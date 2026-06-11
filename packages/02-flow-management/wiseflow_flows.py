"""
WISEflow Integration Package 02 — Flow Management
==================================================
Demonstrates creating and configuring an exam flow end-to-end:

  Step 1  GET  /license/flow-types          Discover available flow types
  Step 2  GET  /license/roles               Find a role for the flow manager
  Step 3  POST /license/user                Create a manager (flows require one)
  Step 4  POST /license/create/flow         Create a new flow (draft)
  Step 5  GET  /flow/{flowId}               Verify the flow was created
  Step 6  PATCH /flows/{flowId}/dates       Set participation start/end (unix)
  Step 7  PUT  /flows/{flowId}/description  Add participant-facing description
  Step 8  GET  /flows/{flowId}/grading-scale Check the grading scale
  Step 9  PATCH /flows/{flowId}/activate    Publish / activate the flow

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
import time

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

def step_1_get_flow_types(ctx: dict) -> dict:
    body = _step(1, "Discover available flow types", "GET", "/license/flow-types")
    if not body:
        raise ValueError("No flow types returned — check licence configuration.")
    # Use the first available type; in production you'd select by name/id
    ctx["flowTypeId"] = body[0]["id"]
    print(f"\n  → Using flow type: '{body[0].get('name', body[0]['id'])}'")
    return ctx


def step_2_get_manager_role(ctx: dict) -> dict:
    body = _step(2, "Find a role for the flow manager", "GET", "/license/roles")
    manager = next((r for r in body if r.get("name") == "Manager" and not r.get("isProtected")), None)
    role = manager or next((r for r in body if not r.get("isProtected")), None)
    if not role:
        raise ValueError("No assignable role found to create a manager user.")
    ctx["managerRoleId"] = role["roleId"]
    return ctx


def step_3_create_manager(ctx: dict) -> dict:
    body = _step(
        3, "Create a manager user (flows require an owner)", "POST", "/license/user",
        json={
            "emails": ["integration.manager@institution.edu"],
            "firstName": "Integration",
            "lastName": "Manager",
            "roles": [ctx["managerRoleId"]],
        },
    )
    ctx["managerId"] = body.get("userId")
    if not ctx["managerId"]:
        raise ValueError(f"Could not extract manager userId from response: {body}")
    return ctx


def step_4_create_flow(ctx: dict) -> dict:
    body = _step(
        4, "Create new exam flow", "POST", "/license/create/flow",
        json={
            "title": "Integration Demo — CS101 Final Exam",
            "type": ctx["flowTypeId"],
            "managers": [ctx["managerId"]],
        },
    )
    ctx["flowId"] = body.get("flowId")
    if not ctx["flowId"]:
        raise ValueError(f"Could not extract flowId from response: {body}")
    return ctx


def step_5_verify_flow(ctx: dict) -> dict:
    body = _step(5, "Verify flow was created", "GET", f"/flow/{ctx['flowId']}")
    ctx["flow"] = body
    return ctx


def step_6_set_dates(ctx: dict) -> dict:
    # All times are unix seconds. Marking must start after participation ends —
    # sending participation alone leaves the old marking window dangling and 500s.
    start = int(time.time()) + 7 * 24 * 3600          # participation opens in a week
    end = start + 3 * 3600                              # three-hour exam window
    marking_start = end + 3600                          # marking opens an hour later
    marking_end = marking_start + 7 * 24 * 3600         # one week to mark
    _step(
        6, "Set participation and marking dates", "PATCH",
        f"/flows/{ctx['flowId']}/dates",
        json={
            "participation": {"start": start, "end": end},
            "marking": {"start": marking_start, "end": marking_end},
        },
    )
    return ctx


def step_7_set_description(ctx: dict) -> dict:
    _step(
        7, "Set participant-facing description", "PUT",
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


def step_8_check_grading_scale(ctx: dict) -> dict:
    body = _step(8, "Check grading scale", "GET", f"/flows/{ctx['flowId']}/grading-scale")
    ctx["gradingScale"] = body
    return ctx


def step_9_activate_flow(ctx: dict) -> dict:
    _step(
        9, "Activate (publish) the flow", "PATCH",
        f"/flows/{ctx['flowId']}/activate",
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
        step_2_get_manager_role,
        step_3_create_manager,
        step_4_create_flow,
        step_5_verify_flow,
        step_6_set_dates,
        step_7_set_description,
        step_8_check_grading_scale,
        step_9_activate_flow,
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
