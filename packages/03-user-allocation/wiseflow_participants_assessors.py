"""
WISEflow Integration Package 03 — Participants, Assessors & Allocation
=======================================================================
Demonstrates enrolling a participant, adding an assessor, and allocating the
assessor to the participant on an existing active flow (individual allocation).

  Step 1  POST /flows/{flowId}/participants                          Add participant
  Step 2  GET  /flows/{flowId}/participants                          List + resolve participantId
  Step 3  POST /flows/{flowId}/assessors                             Add assessor
  Step 4  GET  /flows/{flowId}/assessors                             List + resolve assessorId
  Step 5  POST /flows/{flowId}/assessors/{aId}/allocations/participants/{pId}
                                                                     Allocate assessor → participant
  Step 6  GET  /flows/{flowId}/assessors/{aId}/allocations           Verify allocations

Note: this flow uses *individual* assessor allocation. Creating assessor groups
requires a flow configured for GROUPED allocation and is intentionally not shown.

Prerequisites
-------------
Copy .env.example (repo root) to a .env file in this directory and fill in:
  WISEFLOW_BASE_URL, WISEFLOW_CLIENT_ID, WISEFLOW_CLIENT_SECRET.

The script also needs:
  WISEFLOW_FLOW_ID          — id of an existing active flow
  WISEFLOW_PARTICIPANT_USER_ID  — userId to enrol as participant
  WISEFLOW_ASSESSOR_USER_ID     — userId to add as assessor

These can be set in .env or as environment variables.

Run
---
  python wiseflow_participants_assessors.py

Results are written to run_results.json in this directory.
"""

import json
import os
import pathlib
import sys

import requests
from dotenv import load_dotenv

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[1]

load_dotenv(HERE / ".env")
load_dotenv(ROOT / ".env")

sys.path.insert(0, str(ROOT))
from shared.auth import get_headers  # noqa: E402

VERSION = "1.0.3"
BASE_URL = os.environ["WISEFLOW_BASE_URL"].rstrip("/")

# These IDs must be set in .env; see README for how to obtain them.
def _maybe_int(value: str):
    return int(value) if value.isdigit() else value


FLOW_ID = os.environ.get("WISEFLOW_FLOW_ID", "REPLACE_WITH_FLOW_ID")
PARTICIPANT_USER_ID = _maybe_int(os.environ.get("WISEFLOW_PARTICIPANT_USER_ID", "REPLACE_WITH_USER_ID"))
ASSESSOR_USER_ID = _maybe_int(os.environ.get("WISEFLOW_ASSESSOR_USER_ID", "REPLACE_WITH_ASSESSOR_USER_ID"))

_results: list = []


def _step(num: int, label: str, method: str, path: str, **kwargs):
    url = f"{BASE_URL}{path}"
    print(f"\n{'─' * 62}")
    print(f"  Step {num}: {label}")
    print(f"  {method}  {path}")

    resp = requests.request(
        method, url,
        headers={**get_headers(), "Content-Type": "application/json"},
        timeout=20,
        **kwargs,
    )

    ok = resp.status_code < 400
    print(f"  {'✓' if ok else '✗'} HTTP {resp.status_code}")

    try:
        raw = resp.json()
        # WISEflow wraps payloads in {"success", "data", "error"} — unwrap to the data.
        body = raw["data"] if isinstance(raw, dict) and "success" in raw and "data" in raw else raw
        preview = json.dumps(body, indent=2)
        print("  " + preview[:500].replace("\n", "\n  ") + ("…" if len(preview) > 500 else ""))
    except ValueError:
        body = resp.text
        print(f"  {resp.text[:300]}")

    _results.append({
        "step": num, "label": label, "method": method,
        "path": path, "status": resp.status_code, "response": body,
    })

    resp.raise_for_status()
    return body


# ── workflow steps ────────────────────────────────────────────────────────────

def step_1_add_participant(ctx: dict) -> dict:
    # POST returns 200 even if the user is already enrolled (error ALREADY_ON_FLOW),
    # and the participant id is present in either case.
    body = _step(
        1, "Add participant to flow", "POST",
        f"/flows/{FLOW_ID}/participants",
        json=[{"userId": PARTICIPANT_USER_ID}],
    )
    item = body[0] if isinstance(body, list) and body else {}
    if item.get("error") and item["error"] != "ALREADY_ON_FLOW":
        raise ValueError(f"Could not add participant: {item['error']}")
    if item.get("participant"):
        ctx["participantId"] = item["participant"]["id"]
    return ctx


def step_2_list_participants(ctx: dict) -> dict:
    body = _step(2, "List participants on flow", "GET", f"/flows/{FLOW_ID}/participants")
    print(f"\n  → {len(body)} participant(s) enrolled.")
    match = [p for p in body if p.get("userId") == PARTICIPANT_USER_ID]
    if match:
        ctx["participantId"] = match[0]["participantId"]
    if not ctx.get("participantId"):
        raise ValueError("Could not resolve participantId for the configured user.")
    return ctx


def step_3_add_assessor(ctx: dict) -> dict:
    # Re-adding an existing assessor returns 400; tolerate it and resolve in step 4.
    try:
        body = _step(
            3, "Add assessor to flow", "POST",
            f"/flows/{FLOW_ID}/assessors",
            json={"userId": ASSESSOR_USER_ID},
        )
        ctx["assessorId"] = body.get("assessorId")
    except requests.HTTPError:
        print("  ⚠  Assessor likely already on the flow — will resolve from the list.")
    return ctx


def step_4_list_assessors(ctx: dict) -> dict:
    body = _step(4, "List assessors on flow", "GET", f"/flows/{FLOW_ID}/assessors")
    print(f"\n  → {len(body)} assessor(s) on flow.")
    match = [a for a in body if a.get("user", {}).get("userId") == ASSESSOR_USER_ID]
    if match:
        ctx["assessorId"] = match[0]["assessorId"]
    if not ctx.get("assessorId"):
        raise ValueError("Could not resolve assessorId for the configured user.")
    return ctx


def step_5_allocate(ctx: dict) -> dict:
    _step(
        5, "Allocate assessor to participant", "POST",
        f"/flows/{FLOW_ID}/assessors/{ctx['assessorId']}/allocations/participants/{ctx['participantId']}",
    )
    return ctx


def step_6_verify_allocations(ctx: dict) -> dict:
    body = _step(
        6, "Verify assessor allocations", "GET",
        f"/flows/{FLOW_ID}/assessors/{ctx['assessorId']}/allocations",
    )
    allocs = body.get("participantIds", []) if isinstance(body, dict) else []
    print(f"\n  → Assessor is allocated to {len(allocs)} participant(s).")
    return ctx


# ── main ──────────────────────────────────────────────────────────────────────

def run_workflow() -> None:
    print("\n" + "=" * 62)
    print("  WISEflow Integration Package 03 — Participants & Assessors")
    print(f"  Package version: {VERSION}  ·  API: {BASE_URL}")
    print(f"  Flow: {FLOW_ID}")
    print("=" * 62)

    unset = [
        name for name, val in (
            ("WISEFLOW_FLOW_ID", FLOW_ID),
            ("WISEFLOW_PARTICIPANT_USER_ID", PARTICIPANT_USER_ID),
            ("WISEFLOW_ASSESSOR_USER_ID", ASSESSOR_USER_ID),
        )
        if isinstance(val, str) and "REPLACE_WITH" in val
    ]
    if unset:
        print(f"\n✗  Not configured: {', '.join(unset)}.\n"
              "   Add them to your .env file (see README).")
        sys.exit(1)

    ctx: dict = {}
    steps = [
        step_1_add_participant,
        step_2_list_participants,
        step_3_add_assessor,
        step_4_list_assessors,
        step_5_allocate,
        step_6_verify_allocations,
    ]

    try:
        for fn in steps:
            ctx = fn(ctx)
    except requests.HTTPError as exc:
        print(f"\n✗ Workflow halted — HTTP {exc.response.status_code}: {exc.response.url}")
        sys.exit(1)
    except (KeyError, ValueError) as exc:
        print(f"\n✗ Workflow halted — {exc}")
        sys.exit(1)
    finally:
        out = HERE / "run_results.json"
        out.write_text(json.dumps(_results, indent=2))
        print(f"\n{'=' * 62}")
        print(f"  Results saved → {out}")

    print(f"\n✓  All {len(steps)} steps completed successfully.")


if __name__ == "__main__":
    run_workflow()
