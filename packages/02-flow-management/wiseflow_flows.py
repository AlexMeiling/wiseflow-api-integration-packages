"""
WISEflow Integration Package 02 — Flow Management
==================================================
Demonstrates creating and configuring an exam flow end-to-end:

  Step 1  GET  /license/flow-types          Discover available flow types
  Step 2  GET  /license/flow-purposes       Discover available flow purposes
  Step 3  POST /license/create/flow         Create a new flow (draft)
  Step 4  GET  /flow/{flowId}               Verify the flow was created
  Step 5  PATCH /flows/{flowId}/dates       Set start and end date/time
  Step 6  PUT  /flows/{flowId}/description  Add participant-facing description
  Step 7  GET  /flows/{flowId}/grading-scale Check the grading scale
  Step 8  PATCH /flows/{flowId}/activate    Publish / activate the flow

Prerequisites
-------------
Copy .env.example (repo root) to a .env file in this directory and fill
in WISEFLOW_BASE_URL, WISEFLOW_CLIENT_ID, WISEFLOW_CLIENT_SECRET.

Run
---
  python wiseflow_flows.py

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

def step_1_get_flow_types(ctx: dict) -> dict:
    body = _step(1, "Discover available flow types", "GET", "/license/flow-types")
    types = body if isinstance(body, list) else body.get("flowTypes", [])
    if not types:
        raise ValueError("No flow types returned — check licence configuration.")
    # Use the first available type; in production you'd select by name/id
    ctx["flowTypeId"] = types[0]["id"]
    print(f"\n  → Using flow type: '{types[0].get('name', types[0]['id'])}'")
    return ctx


def step_2_get_flow_purposes(ctx: dict) -> dict:
    body = _step(2, "Discover available flow purposes", "GET", "/license/flow-purposes")
    purposes = body if isinstance(body, list) else body.get("flowPurposes", [])
    ctx["flowPurposeId"] = purposes[0]["id"] if purposes else None
    return ctx


def step_3_create_flow(ctx: dict) -> dict:
    payload: dict = {
        "title": "Integration Demo — CS101 Final Exam",
        "flowTypeId": ctx["flowTypeId"],
    }
    if ctx.get("flowPurposeId"):
        payload["flowPurposeId"] = ctx["flowPurposeId"]

    body = _step(3, "Create new exam flow", "POST", "/license/create/flow", json=payload)
    ctx["flowId"] = body.get("id") or body.get("flowId")
    if not ctx["flowId"]:
        raise ValueError(f"Could not extract flowId from response: {body}")
    return ctx


def step_4_verify_flow(ctx: dict) -> dict:
    body = _step(4, "Verify flow was created", "GET", f"/flow/{ctx['flowId']}")
    ctx["flow"] = body
    return ctx


def step_5_set_dates(ctx: dict) -> dict:
    _step(
        5, "Set exam start and end dates", "PATCH",
        f"/flows/{ctx['flowId']}/dates",
        json={
            "startDate": "2026-05-15T09:00:00Z",
            "endDate":   "2026-05-15T12:00:00Z",
        },
    )
    return ctx


def step_6_set_description(ctx: dict) -> dict:
    _step(
        6, "Set participant-facing description", "PUT",
        f"/flows/{ctx['flowId']}/description",
        json={
            "description": (
                "This is the final examination for Introduction to Computer Science (CS101). "
                "The exam is closed book and lasts 3 hours.  "
                "All answers must be submitted before the end time."
            )
        },
    )
    return ctx


def step_7_check_grading_scale(ctx: dict) -> dict:
    body = _step(7, "Check grading scale", "GET", f"/flows/{ctx['flowId']}/grading-scale")
    ctx["gradingScale"] = body
    return ctx


def step_8_activate_flow(ctx: dict) -> dict:
    _step(
        8, "Activate (publish) the flow", "PATCH",
        f"/flows/{ctx['flowId']}/activate",
        json={},
    )
    return ctx


# ── main ──────────────────────────────────────────────────────────────────────

def run_workflow() -> None:
    print("\n" + "=" * 62)
    print("  WISEflow Integration Package 02 — Flow Management")
    print(f"  Package version: {VERSION}  ·  API: {BASE_URL}")
    print("=" * 62)

    ctx: dict = {}
    steps = [
        step_1_get_flow_types,
        step_2_get_flow_purposes,
        step_3_create_flow,
        step_4_verify_flow,
        step_5_set_dates,
        step_6_set_description,
        step_7_check_grading_scale,
        step_8_activate_flow,
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
    print(f"   Created flow id: {ctx.get('flowId')}")


if __name__ == "__main__":
    run_workflow()
