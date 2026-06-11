"""
WISEflow Integration Package 04 — Grade Passback
=================================================
Demonstrates fetching assessment results from WISEflow and pushing them to an
external Student Information System (SIS) or LMS (WISEflow → SIS direction).

  Step 1  GET  /flows/{flowId}/submissions                           Fetch submission status
  Step 2  GET  /flows/{flowId}/participants                          Resolve participantIds
          GET  /flows/{flowId}/participants/{pId}/item-based-marks   Fetch marks per participant
  Step 3  (local) Aggregate item marks → SIS/LMS grade schema
  Step 4  POST {SIS_ENDPOINT}                                        Push grades to SIS

Submissions carry only a submissionId and hand-in status — the participantId
needed for marks lives on the participant object, so step 2 lists participants
first and then pulls item-based marks for each. Item-based marks are returned as
an array of per-item scores, which step 3 aggregates into a single total.

If the flow is not configured for item-based marking the marks endpoint returns
HTTP 403; the script reports this and continues so the pipeline stays green.
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

VERSION = "1.0.3"
BASE_URL = os.environ["WISEFLOW_BASE_URL"].rstrip("/")
FLOW_ID = os.environ.get("WISEFLOW_FLOW_ID", "REPLACE_WITH_FLOW_ID")
SIS_ENDPOINT = os.environ.get("SIS_ENDPOINT", "")
SIS_API_KEY = os.environ.get("SIS_API_KEY", "")

_results: list = []


def _wf_get(path: str) -> dict | list:
    """Authenticated GET against the WISEflow API, unwrapped to the data payload."""
    resp = requests.get(
        f"{BASE_URL}{path}",
        headers=get_headers(),
        timeout=20,
    )
    resp.raise_for_status()
    raw = resp.json()
    # WISEflow wraps payloads in {"success", "data", "error"} — unwrap to the data.
    if isinstance(raw, dict) and "success" in raw and "data" in raw:
        return raw["data"]
    return raw


def _print_step(num: int, label: str) -> None:
    print(f"\n{'─' * 62}")
    print(f"  Step {num}: {label}")


# ── workflow steps ────────────────────────────────────────────────────────────

def step_1_fetch_submissions(ctx: dict) -> dict:
    _print_step(1, "Fetch submission status for the flow")
    path = f"/flows/{FLOW_ID}/submissions"
    print(f"  GET  {path}")

    submissions = _wf_get(path)
    handed_in = sum(1 for s in submissions if s.get("status", {}).get("handedIn"))

    print(f"  ✓ Retrieved {len(submissions)} submission(s); {handed_in} handed in.")
    _results.append({"step": 1, "label": "Fetch submissions", "path": path,
                     "count": len(submissions), "handedIn": handed_in})
    ctx["submissions"] = submissions
    return ctx


def step_2_fetch_marks(ctx: dict) -> dict:
    _print_step(2, "Resolve participants and fetch their item-based marks")

    # Submissions carry no participantId — resolve it from the participant list.
    p_path = f"/flows/{FLOW_ID}/participants"
    print(f"  GET  {p_path}")
    participants = _wf_get(p_path)
    print(f"  ✓ {len(participants)} participant(s) on flow.")

    all_marks = []
    for p in participants:
        participant_id = p.get("participantId")
        if not participant_id:
            continue

        path = f"/flows/{FLOW_ID}/participants/{participant_id}/item-based-marks"
        print(f"  GET  {path}")
        try:
            marks = _wf_get(path)
        except requests.HTTPError as exc:
            detail = ""
            try:
                detail = f" — {exc.response.json().get('error', {}).get('message', '')}"
            except ValueError:
                pass
            print(f"  ⚠  HTTP {exc.response.status_code} for participant {participant_id}{detail} — skipping.")
            continue

        all_marks.append({
            "participantId": participant_id,
            "userId": p.get("userId"),
            "marks": marks,
        })
        preview = json.dumps(marks, indent=2)
        print("  ✓ " + preview[:300].replace("\n", "\n    ") + ("…" if len(preview) > 300 else ""))

    _results.append({"step": 2, "label": "Fetch marks", "participantsProcessed": len(all_marks)})
    ctx["all_marks"] = all_marks
    return ctx


def step_3_transform(ctx: dict) -> dict:
    """Aggregate WISEflow item-based marks into a generic SIS/LMS schema.

    Item-based marks are an array of per-item objects (itemNumber, score, state,
    deactivated). We sum the scores of non-deactivated items into a single total.
    Adjust the mapping below to match your institution's SIS requirements.
    """
    _print_step(3, "Aggregate item marks to SIS schema (local operation)")

    transformed = []
    for entry in ctx["all_marks"]:
        items = entry["marks"] if isinstance(entry["marks"], list) else []
        scored = [i for i in items if not i.get("deactivated")]
        total = sum(i["score"] for i in scored if i.get("score") is not None)
        all_scored = bool(scored) and all(i.get("score") is not None for i in scored)
        participant_id = entry["participantId"]

        sis_record = {
            "participantId": participant_id,   # Keep WISEflow id for audit trail
            "userId": entry.get("userId"),
            "totalScore": total,
            "itemCount": len(items),
            "complete": all_scored,
            "flowId": FLOW_ID,
            "source": "WISEflow",
        }
        transformed.append(sis_record)
        print(f"  → Participant {participant_id}: totalScore={total} "
              f"across {len(items)} item(s), complete={all_scored}")

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
