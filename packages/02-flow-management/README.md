# Package 02 — Flow Management

Demonstrates creating and fully configuring an exam flow in WISEflow from scratch.

## Prerequisites

Before running this workflow, ensure you have retrieved the following identifiers:

| Prerequisite | API Endpoints | Notes |
|--------------|---------------|-------|
| **Flow Type ID** | `GET /licence/flow-types` | Determine which exam types are available in your licence |
| **Flow Purpose ID** | `GET /licence/flow-purposes` | Select the appropriate flow purpose for your use case |
| **Grading Scale ID** | `GET /licence/grading-scale` | Identify the grading framework (numeric, alpha, custom) |
| **Assessor Types** | `GET /flows/{flowId}/assessors` | (Retrieved after flow creation to configure assessment roles) |
| **OAuth2 credentials** | — | Must have `flow creation` and `flow management` permissions |

### Workflow Variants

This package demonstrates two creation patterns:

1. **Simple**: `POST /licence/create/flow` — Start from scratch
2. **Template**: `POST /flows/{flowId}/copy` — Clone an existing flow as a template

## What this package does

| Step | Method | Endpoint | Description |
|------|--------|----------|-------------|
| 1 | GET | `/license/flow-types` | Discover available exam types |
| 2 | GET | `/license/flow-purposes` | Discover available flow purposes |
| 3 | POST | `/license/create/flow` | Create a new flow (draft) |
| 4 | GET | `/flow/{flowId}` | Verify the flow was created |
| 5 | PATCH | `/flows/{flowId}/dates` | Set start and end date/time |
| 6 | PUT | `/flows/{flowId}/description` | Add participant-facing description |
| 7 | GET | `/flows/{flowId}/grading-scale` | Inspect the grading scale |
| 8 | PATCH | `/flows/{flowId}/activate` | Publish / activate the flow |

## When to use this

Use this package when you need to:
- Automatically create exam instances from your course management system
- Bulk-create flows for a semester at the start of term
- Integrate WISEflow flow creation into a CI/QA pipeline for assessment design

## Setup

- Python 3.9+, `pip install -r ../../requirements.txt`
- OAuth2 client credentials with `flow creation` and `flow management` permissions

### Configuration

```bash
cp ../../.env.example .env
# Edit .env with your credentials
```

## Run

```bash
python wiseflow_flows.py
```

## Sample data

`sample_data/flow_config.json` — example flow configuration payloads.

## Output

`run_results.json` — full step-by-step request/response log.
