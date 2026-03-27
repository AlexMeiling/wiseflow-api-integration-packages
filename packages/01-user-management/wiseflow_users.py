"""
WISEflow Integration Package 01 — User Management
==================================================
Demonstrates a full user-management workflow:

  Step 1  POST /license/user              Create a new user
  Step 2  GET  /users/{userId}            Verify the user was created
  Step 3  GET  /license/roles             Discover available roles
  Step 4  POST /users/{userId}/roles      Assign a role to the user
  Step 5  PUT  /users/{userId}            Update the user's name
  Step 6  GET  /license/user-data-types   Discover custom data field types
  Step 7  PATCH /users/{userId}/user-data Attach a custom data value

Prerequisites
-------------
Copy .env.example (repo root) to a .env file in this directory and fill
in WISEFLOW_BASE_URL, WISEFLOW_CLIENT_ID, WISEFLOW_CLIENT_SECRET.

Run
---
  python wiseflow_users.py

Results are written to run_results.json in this directory.
"""

import json
import os
import pathlib
import sys

import requests
from dotenv import load_dotenv

# ── resolve paths & load environment ─────────────────────────────────────────
HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[1]

load_dotenv(HERE / ".env")          # package-level .env (preferred)
load_dotenv(ROOT / ".env")          # fallback to repo-root .env

sys.path.insert(0, str(ROOT))
from shared.auth import get_headers  # noqa: E402

VERSION = "1.0.0"
BASE_URL = os.environ["WISEFLOW_BASE_URL"].rstrip("/")

# Accumulates step results — written to run_results.json at end
_results: list = []


# ── step runner ───────────────────────────────────────────────────────────────

def _step(num: int, label: str, method: str, path: str, **kwargs):
    """Execute one API call, pretty-print the result, and record it."""
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
    icon = "✓" if ok else "✗"
    print(f"  {icon} HTTP {resp.status_code}")

    try:
        body = resp.json()
        preview = json.dumps(body, indent=2)
        print("  " + preview[:500].replace("\n", "\n  ") + ("…" if len(preview) > 500 else ""))
    except ValueError:
        body = resp.text
        print(f"  {resp.text[:300]}")

    _results.append({
        "step": num,
        "label": label,
        "method": method,
        "path": path,
        "status": resp.status_code,
        "response": body,
    })

    resp.raise_for_status()
    return body


# ── workflow steps ────────────────────────────────────────────────────────────

def step_1_create_user(ctx: dict) -> dict:
    body = _step(
        1, "Create user", "POST", "/license/user",
        json={
            "email": "integration.demo@institution.edu",
            "firstname": "Integration",
            "lastname": "Demo",
            "eduPrincipalName": "integration.demo@institution.edu",
        },
    )
    # The API returns the new user's id — field name varies by tenant config
    ctx["userId"] = body.get("id") or body.get("userId") or body.get("user_id")
    if not ctx["userId"]:
        raise ValueError(f"Could not extract userId from response: {body}")
    return ctx


def step_2_verify_user(ctx: dict) -> dict:
    body = _step(2, "Verify user was created", "GET", f"/users/{ctx['userId']}")
    ctx["user"] = body
    return ctx


def step_3_get_roles(ctx: dict) -> dict:
    body = _step(3, "Discover available licence roles", "GET", "/license/roles")
    # Pick the first available role; in practice you'd look up the correct id
    roles = body if isinstance(body, list) else body.get("roles", [])
    ctx["roleId"] = roles[0]["id"] if roles else None
    return ctx


def step_4_assign_role(ctx: dict) -> dict:
    if not ctx.get("roleId"):
        print("  ⚠  No roles found on licence — skipping role assignment.")
        return ctx
    _step(
        4, "Assign role to user", "POST", f"/users/{ctx['userId']}/roles",
        json={"roleId": ctx["roleId"]},
    )
    return ctx


def step_5_update_user(ctx: dict) -> dict:
    _step(
        5, "Update user's name", "PUT", f"/users/{ctx['userId']}",
        json={
            "firstname": "Integration",
            "lastname": "Demo-Updated",
        },
    )
    return ctx


def step_6_get_user_data_types(ctx: dict) -> dict:
    body = _step(6, "Discover custom user-data types", "GET", "/license/user-data-types")
    types = body if isinstance(body, list) else body.get("userDataTypes", [])
    ctx["userDataTypeId"] = types[0]["id"] if types else None
    return ctx


def step_7_patch_user_data(ctx: dict) -> dict:
    if not ctx.get("userDataTypeId"):
        print("  ⚠  No user-data types found — skipping custom field patch.")
        return ctx
    _step(
        7, "Attach a custom user-data value", "PATCH",
        f"/users/{ctx['userId']}/user-data",
        json=[{"userDataTypeId": ctx["userDataTypeId"], "value": "STU-2026-DEMO"}],
    )
    return ctx


# ── main ──────────────────────────────────────────────────────────────────────

def run_workflow() -> None:
    print("\n" + "=" * 62)
    print("  WISEflow Integration Package 01 — User Management")
    print(f"  Package version: {VERSION}  ·  API: {BASE_URL}")
    print("=" * 62)

    ctx: dict = {}
    steps = [
        step_1_create_user,
        step_2_verify_user,
        step_3_get_roles,
        step_4_assign_role,
        step_5_update_user,
        step_6_get_user_data_types,
        step_7_patch_user_data,
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
    print(f"   Created user id: {ctx.get('userId')}")


if __name__ == "__main__":
    run_workflow()
