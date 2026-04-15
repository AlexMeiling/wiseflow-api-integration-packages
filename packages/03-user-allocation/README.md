# Package 03 — User Allocation

Demonstrates enrolling participants, adding assessors, creating groups, and allocating assessment roles on an existing WISEflow exam flow.

## When to use this

Use this package when you need to:
- Bulk-enrol a cohort of students into an exam flow from your SIS
- Assign examiners and automatically distribute participants across them
- Set up managers, invigilators, and authors for an exam session
- Integrate allocation logic with your department's workload management system

## Prerequisites

Before running this workflow, ensure:

| Item | API Endpoint | Notes |
|------|--------------|-------|
| **Flow ID** | `POST /flows/search` or cache | The target exam flow must be active |

### Subsection Prerequisites

#### 3.1 Associates (Managers, Invigilators, Authors)

| Item | Endpoint | Notes |
|------|----------|-------|
| User IDs | — | Get manager/invigilator/author user IDs from your user database |

#### 3.2 Participants

| Item | Endpoint | Notes |
|------|----------|-------|
| Participant IDs | — | User IDs of students enrolling in the exam |

#### 3.3 Assessors & Reviewers

| Item | Endpoint | Notes |
|------|----------|-------|
| Assessor IDs | `GET /licence/` or user database | User IDs for graders/examiners |
| Reviewer IDs | — | User IDs for review-stage participants (if applicable) |

## What this package does

### 3.1 — Associates

| Step | Method | Endpoint | Description |
|------|--------|----------|-------------|
| 1a | POST | `/flows/{flowId}/managers` | Add manager (exam coordinator) |
| 1b | POST | `/flows/{flowId}/invigilators` | Add invigilator (room proctor) |
| 1c | POST | `/flows/{flowId}/author` | Add author (assessment creator) |

### 3.2 — Participants

| Step | Method | Endpoint | Description |
|------|--------|----------|-------------|
| 2a | POST | `/flows/{flowId}/participants/add` | Enrol participants (bulk or single) |
| 2b | PUT | `/flows/{flowId}/participants/{participantId}/unique-exam-id` | Assign unique exam ID per participant |
| 2c | POST | `/flows/{flowId}/participant-groups` | Create participant groups (optional) |

### 3.3 — Assessors & Reviewers

| Step | Method | Endpoint | Description |
|------|--------|----------|-------------|
| 3a | POST | `/flows/{flowId}/assessors` | Add assessor (grader/examiner) |
| 3b | POST | `/flows/{flowId}/assessors/{assessorId}/allocations` | Allocate assessor to participant(s) |
| 3c | PUT | `/flows/{flowId}/participants/{participantId}/unique-exam-id` | (Re-)assign exam ID after allocation |
| 3d | POST | `/flows/{flowId}/participant-groups` | Create reviewer groups (if multi-stage marking) |

## Setup & Runtime

### Prerequisites (Technical)

- Python 3.9+, `pip install -r ../../requirements.txt`
- An existing **active** WISEflow flow (run Package 02 first, or provide an existing flow id)
- User ids for at least one participant and one assessor (run Package 01 first, or provide existing ids)

### Configuration

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

