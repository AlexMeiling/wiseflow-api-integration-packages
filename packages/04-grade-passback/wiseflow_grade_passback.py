"""
WISEflow Integration Package 04 — Grade Passback
=================================================
Demonstrates fetching assessment results from WISEflow and pushing them to an
external Student Information System (SIS) or LMS (WISEflow → SIS direction).

  Step 1  GET  /flows/{flowId}/submissions                           Fetch all submissions
  Step 2  GET  /flows/{flowId}/participants/{pId}/item-based-marks   Fetch marks per participant
  Step 3  (local) Transform WISEflow grade schema → SIS/LMS schema
  Step 4  POST {SIS_ENDPOINT}                                        Push grades to SIS

The script processes every participant in the submission list.
Grade data is also written to grades_output.json for audit purposes.

Prerequisites
-------------
Copy .env.example (repo root) to a .env file in this directory and fill in:
  WISEFLOW_BASE_URL, WISEFLOW_CLIENT_ID, WISEFLOW_CLIENT_SECRET
  WISEFLOW_FLOW_ID      — id of a marked/completed flow
  SIS_ENDPOINT          — URL of your SIS grade ingestion endpoint (can be a local mock)
  SIS_API_KEY           — bearer token for the SIS endpoint (optional, set "" to skip)

Run
---
  python wiseflow_grade_passback.py

  # To start a local echo server for testing the SIS push step:
  python -m http.server 8080

Results are written to run_results.json and grades_output.json in this directory.
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
FLOW_ID = os.environ.get("WISEFLOW_FLOW_ID", "REPLACE_WITH_FLOW_ID")
SIS_ENDPOINT = os.environ.get("SIS_ENDPOINT", "")
SIS_API_KEY = os.environ.get("SIS_API_KEY", "")

_results: list = []


def _wf_get(path: str) -> dict | list:
    """Authenticated GET against the WISEflow API."""
    resp = requests.get(
        f"{BASE_URL}{path}",
        headers=get_headers(),
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()


def _print_step(num: int, label: str) -> None:
    print(f"\n{'─' * 62}")
    print(f"  Step {num}: {label}")


# ── workflow steps ────────────────────────────────────────────────────────────

def step_1_fetch_submissions(ctx: dict) -> dict:
    _print_step(1, "Fetch all submissions for the flow")
    path = f"/flows/{FLOW_ID}/submissions"
    print(f"  GET  {path}")

    body = _wf_get(path)
    submissions = body if isinstance(body, list) else body.get("submissions", [])

    print(f"  ✓ Retrieved {len(submissions)} submission(s).")
    _results.append({"step": 1, "label": "Fetch submissions", "path": path,
                     "count": len(submissions)})
    ctx["submissions"] = submissions
    return ctx


def step_2_fetch_marks(ctx: dict) -> dict:
    _print_step(2, "Fetch item-based marks for each participant")

    all_marks = []
    for sub in ctx["submissions"]:
        participant_id = sub.get("participantId") or sub.get("id")
        if not participant_id:
            continue

        path = f"/flows/{FLOW_ID}/participants/{participant_id}/item-based-marks"
        print(f"  GET  {path}")
        try:
            marks = _wf_get(path)
        except requests.HTTPError as exc:
            print(f"  ⚠  HTTP {exc.response.status_code} for participant {participant_id} — skipping.")
            continue

        all_marks.append({
            "participantId": participant_id,
            "marks": marks,
        })
        preview = json.dumps(marks, indent=2)
        print("  ✓ " + preview[:300].replace("\n", "\n    ") + ("…" if len(preview) > 300 else ""))

    _results.append({"step": 2, "label": "Fetch marks", "participantsProcessed": len(all_marks)})
    ctx["all_marks"] = all_marks
    return ctx


def step_3_transform(ctx: dict) -> dict:
    """Map WISEflow grade fields to a generic SIS/LMS schema.

    Adjust the mapping below to match your institution's SIS requirements.
    """
    _print_step(3, "Transform grades to SIS schema (local operation)")

    transformed = []
    for entry in ctx["all_marks"]:
        marks = entry["marks"]
        # WISEflow mark fields (may vary — check your API response)
        grade = marks.get("grade") or marks.get("letterGrade") or marks.get("mark", "")
        score = marks.get("score") or marks.get("totalScore") or marks.get("points")
        participant_id = entry["participantId"]

        sis_record = {
            "participantId": participant_id,   # Keep WISEflow id for audit trail
            "grade": str(grade).strip(),
            "score": score,
            "flowId": FLOW_ID,
            "source": "WISEflow",
        }
        transformed.append(sis_record)
        print(f"  → Participant {participant_id}: grade={grade}, score={score}")

    print(f"\n  ✓ Transformed {len(transformed)} record(s).")
    _results.append({"step": 3, "label": "Transform", "recordsTransformed": len(transformed)})
    ctx["transformed"] = transformed

    # Write grade output for audit / manual import fallback
    out = HERE / "grades_output.json"
    out.write_text(json.dumps(transformed, indent=2))
    print(f"  Grades written → {out}")

    return ctx


def step_4_push_to_sis(ctx: dict) -> dict:
    _print_step(4, "Push grades to SIS/LMS endpoint")

    if not SIS_ENDPOINT:
        print("  ⚠  SIS_ENDPOINT is not configured in .env — skipping push.")
        print("     Grades are available in grades_output.json for manual import.")
        _results.append({"step": 4, "label": "Push to SIS", "status": "skipped"})
        return ctx

    print(f"  POST  {SIS_ENDPOINT}")

    sis_headers: dict = {"Content-Type": "application/json"}
    if SIS_API_KEY:
        sis_headers["Authorization"] = f"Bearer {SIS_API_KEY}"

    outcomes = []
    for record in ctx["transformed"]:
        resp = requests.post(
            SIS_ENDPOINT,
            json=record,
            headers=sis_headers,
            timeout=20,
        )
        ok = resp.status_code < 400
        icon = "✓" if ok else "✗"
        print(f"  {icon} HTTP {resp.status_code}  participant={record['participantId']}")
        outcomes.append({
            "participantId": record["participantId"],
            "status": resp.status_code,
            "ok": ok,
        })

    success = sum(1 for o in outcomes if o["ok"])
    print(f"\n  ✓ Pushed {success}/{len(outcomes)} record(s) successfully.")
    _results.append({"step": 4, "label": "Push to SIS",
                     "endpoint": SIS_ENDPOINT, "outcomes": outcomes})
    return ctx


# ── main ──────────────────────────────────────────────────────────────────────

def run_workflow() -> None:
    print("\n" + "=" * 62)
    print("  WISEflow Integration Package 04 — Grade Passback")
    print(f"  Package version: {VERSION}  ·  API: {BASE_URL}")
    print(f"  Flow: {FLOW_ID}")
    print(f"  SIS endpoint: {SIS_ENDPOINT or '(not configured)'}")
    print("=" * 62)

    if "REPLACE_WITH" in FLOW_ID:
        print("\n✗  WISEFLOW_FLOW_ID is not configured.\n"
              "   Add it to your .env file (see README).")
        sys.exit(1)

    ctx: dict = {}
    steps = [
        step_1_fetch_submissions,
        step_2_fetch_marks,
        step_3_transform,
        step_4_push_to_sis,
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
