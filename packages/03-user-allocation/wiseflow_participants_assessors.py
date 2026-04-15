"""
WISEflow Integration Package 03 — Participants, Assessors & Allocation
=======================================================================
Demonstrates enrolling participants, adding assessors, creating an assessor
group, and allocating assessors to participants on an existing active flow.

  Step 1  POST /flows/{flowId}/participants                          Add participant
  Step 2  GET  /flows/{flowId}/participants                          List participants
  Step 3  POST /flows/{flowId}/assessors                             Add assessor
  Step 4  GET  /flows/{flowId}/assessors                             List assessors
  Step 5  POST /flows/{flowId}/assessor-groups                       Create assessor group
  Step 6  POST /flows/{flowId}/assessors/{aId}/allocations/participants/{pId}
                                                                     Allocate assessor → participant
  Step 7  GET  /flows/{flowId}/assessors/{aId}/allocations           Verify allocations

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

VERSION = "1.0.0"
BASE_URL = os.environ["WISEFLOW_BASE_URL"].rstrip("/")

# These IDs must be set in .env; see README for how to obtain them.
FLOW_ID = os.environ.get("WISEFLOW_FLOW_ID", "REPLACE_WITH_FLOW_ID")
PARTICIPANT_USER_ID = os.environ.get("WISEFLOW_PARTICIPANT_USER_ID", "REPLACE_WITH_USER_ID")
ASSESSOR_USER_ID = os.environ.get("WISEFLOW_ASSESSOR_USER_ID", "REPLACE_WITH_ASSESSOR_USER_ID")

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
        body = resp.json()
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
    body = _step(
        1, "Add participant to flow", "POST",
        f"/flows/{FLOW_ID}/participants",
        json={"userId": PARTICIPANT_USER_ID},
    )
    ctx["participantId"] = body.get("id") or body.get("participantId")
    return ctx


def step_2_list_participants(ctx: dict) -> dict:
    body = _step(2, "List participants on flow", "GET", f"/flows/{FLOW_ID}/participants")
    participants = body if isinstance(body, list) else body.get("participants", [])
    print(f"\n  → {len(participants)} participant(s) enrolled.")
    # Resolve participantId from list if not returned by POST
    if not ctx.get("participantId") and participants:
        match = [p for p in participants if p.get("userId") == PARTICIPANT_USER_ID]
        if match:
            ctx["participantId"] = match[0].get("id") or match[0].get("participantId")
    return ctx


def step_3_add_assessor(ctx: dict) -> dict:
    body = _step(
        3, "Add assessor to flow", "POST",
        f"/flows/{FLOW_ID}/assessors",
        json={"userId": ASSESSOR_USER_ID},
    )
    ctx["assessorId"] = body.get("id") or body.get("assessorId")
    return ctx


def step_4_list_assessors(ctx: dict) -> dict:
    body = _step(4, "List assessors on flow", "GET", f"/flows/{FLOW_ID}/assessors")
    assessors = body if isinstance(body, list) else body.get("assessors", [])
    print(f"\n  → {len(assessors)} assessor(s) added.")
    if not ctx.get("assessorId") and assessors:
        match = [a for a in assessors if a.get("userId") == ASSESSOR_USER_ID]
        if match:
            ctx["assessorId"] = match[0].get("id") or match[0].get("assessorId")
    return ctx


def step_5_create_assessor_group(ctx: dict) -> dict:
    body = _step(
        5, "Create assessor group", "POST",
        f"/flows/{FLOW_ID}/assessor-groups",
        json={"name": "Integration Demo — Examiner Group"},
    )
    ctx["assessorGroupId"] = body.get("id") or body.get("assessorGroupId")
    return ctx


def step_6_allocate(ctx: dict) -> dict:
    assessor_id = ctx.get("assessorId")
    participant_id = ctx.get("participantId")
    if not assessor_id or not participant_id:
        print("  ⚠  Missing assessorId or participantId — skipping allocation step.")
        return ctx
    _step(
        6, "Allocate assessor to participant", "POST",
        f"/flows/{FLOW_ID}/assessors/{assessor_id}/allocations/participants/{participant_id}",
        json={},
    )
    return ctx


def step_7_verify_allocations(ctx: dict) -> dict:
    assessor_id = ctx.get("assessorId")
    if not assessor_id:
        print("  ⚠  No assessorId — skipping allocation verification.")
        return ctx
    body = _step(
        7, "Verify assessor allocations", "GET",
        f"/flows/{FLOW_ID}/assessors/{assessor_id}/allocations",
    )
    allocs = body if isinstance(body, list) else body.get("allocations", [])
    print(f"\n  → Assessor is allocated to {len(allocs)} participant(s).")
    return ctx


# ── main ──────────────────────────────────────────────────────────────────────

def run_workflow() -> None:
    print("\n" + "=" * 62)
    print("  WISEflow Integration Package 03 — Participants & Assessors")
    print(f"  Package version: {VERSION}  ·  API: {BASE_URL}")
    print(f"  Flow: {FLOW_ID}")
    print("=" * 62)

    if "REPLACE_WITH" in FLOW_ID:
        print("\n✗  WISEFLOW_FLOW_ID is not configured.\n"
              "   Add it to your .env file (see README).")
        sys.exit(1)

    ctx: dict = {}
    steps = [
        step_1_add_participant,
        step_2_list_participants,
        step_3_add_assessor,
        step_4_list_assessors,
        step_5_create_assessor_group,
        step_6_allocate,
        step_7_verify_allocations,
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
