# Package 04 — Grade Passback

Retrieves final assessment results from WISEflow and pushes them to an external Student Information System (SIS) or LMS.

**Direction:** WISEflow → Your SIS/LMS

## What this package does

| Step | Method | Endpoint | Description |
|------|--------|----------|-------------|
| 1 | GET | `/flows/{flowId}/submissions` | Fetch all submissions for the flow |
| 2 | GET | `/flows/{flowId}/participants/{pId}/item-based-marks` | Fetch detailed marks per participant |
| 3 | — | *(local transform)* | Map WISEflow grade fields → SIS/LMS schema |
| 4 | POST | `{SIS_ENDPOINT}` | Push transformed grade records to SIS |

The transformation step (Step 3) is intentionally left simple and clearly labelled — this is where institutions customise the field mapping to match their SIS's expected schema.

## When to use this

Use this package when you need to:
- Automatically return final exam grades to your student record system after marking is complete
- Export grades nightly via cron job after each marking deadline
- Audit the grade data flowing between WISEflow and downstream systems

## Prerequisites

- Python 3.9+, `pip install -r ../../requirements.txt`
- A WISEflow flow that has been marked (status: `marked` or `completed`)
- A SIS/LMS grade ingestion endpoint, or a local echo server for testing

## Setup

```bash
cp ../../.env.example .env
```

Add these extra variables to `.env`:
```
WISEFLOW_FLOW_ID=your_completed_flow_id
SIS_ENDPOINT=https://your-sis.institution.edu/api/v1/grades
SIS_API_KEY=your_sis_api_key
```

**Testing without a real SIS:** Start a local echo server and point `SIS_ENDPOINT` at it:
```bash
# In a separate terminal:
python -m http.server 8080

# Then in .env:
SIS_ENDPOINT=http://localhost:8080
```

## Run

```bash
python wiseflow_grade_passback.py
```

## Customising the field mapping

Edit `step_3_transform()` in `wiseflow_grade_passback.py` to map WISEflow fields to your SIS schema. The current mapping is:

```python
sis_record = {
    "participantId": participant_id,
    "grade": marks.get("grade"),
    "score": marks.get("score"),
    "flowId": FLOW_ID,
    "source": "WISEflow",
}
```

Common SIS-specific fields you may need to add: `courseCode`, `studentNumber`, `credits`, `semester`.

## Output

- `run_results.json` — step log
- `grades_output.json` — transformed grade records (useful as a manual import fallback if `SIS_ENDPOINT` is not configured)
