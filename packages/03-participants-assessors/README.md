# Package 03 — Participants, Assessors & Allocation

Demonstrates enrolling participants, adding assessors, creating an assessor group, and allocating assessors to participants on an existing WISEflow exam flow.

## What this package does

| Step | Method | Endpoint | Description |
|------|--------|----------|-------------|
| 1 | POST | `/flows/{flowId}/participants` | Enrol a participant (student) |
| 2 | GET | `/flows/{flowId}/participants` | List & verify participants |
| 3 | POST | `/flows/{flowId}/assessors` | Add an assessor (examiner) |
| 4 | GET | `/flows/{flowId}/assessors` | List & verify assessors |
| 5 | POST | `/flows/{flowId}/assessor-groups` | Create an assessor group |
| 6 | POST | `/flows/{flowId}/assessors/{aId}/allocations/participants/{pId}` | Allocate assessor → participant |
| 7 | GET | `/flows/{flowId}/assessors/{aId}/allocations` | Verify allocation |

## When to use this

Use this package when you need to:
- Bulk-enrol a cohort of students into an exam flow from your SIS
- Assign examiners and automatically distribute participants across them
- Integrate allocation logic with your department's workload management system

## Prerequisites

- Python 3.9+, `pip install -r ../../requirements.txt`
- An existing **active** WISEflow flow (run Package 02 first, or provide an existing flow id)
- User ids for at least one participant and one assessor (run Package 01 first, or provide existing ids)

## Setup

```bash
cp ../../.env.example .env
```

Add these extra variables to `.env`:
```
WISEFLOW_FLOW_ID=your_flow_id
WISEFLOW_PARTICIPANT_USER_ID=usr_abc12345
WISEFLOW_ASSESSOR_USER_ID=usr_examiner001
```

## Run

```bash
python wiseflow_participants_assessors.py
```

## Sample data

`sample_data/participants.json` — bulk participant/assessor id lists for reference.

## Output

`run_results.json` — full step-by-step request/response log.
