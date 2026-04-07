# Package 01 — User Management

Demonstrates a complete user-management workflow using the WISEflow API.

## What this package does

| Step | Method | Endpoint | Description |
|------|--------|----------|-------------|
| 1 | POST | `/license/user` | Create a new user |
| 2 | GET | `/users/{userId}` | Verify the user was created |
| 3 | GET | `/license/roles` | Discover available roles |
| 4 | POST | `/users/{userId}/roles` | Assign a role to the user |
| 5 | PUT | `/users/{userId}` | Update the user's name |
| 6 | GET | `/license/user-data-types` | Discover custom field types |
| 7 | PATCH | `/users/{userId}/user-data` | Attach a custom data value |

## When to use this

Use this package when you need to:
- Bulk-synchronise user accounts from your HR/SIS into WISEflow
- Provision new students at enrolment time
- Keep names and custom fields in sync after updates in your source system

## Prerequisites

- Python 3.9+, `pip install -r ../../requirements.txt`
- A WISEflow sandbox tenant with OAuth2 client credentials
- The credentials must have `user management` permission on the licence

## Setup

```bash
cp ../../.env.example .env
# Edit .env with your credentials
```

## Run

```bash
python wiseflow_users.py
```

Expected output:
```
================================================================
  WISEflow Integration Package 01 — User Management
  Package version: 1.0.0  ·  API: https://europe-api.wiseflow.net/v1
================================================================

──────────────────────────────────────────────────────────────
  Step 1: Create user
  POST  /license/user
  ✓ HTTP 201
  ...
✓  All 7 steps completed successfully.
   Created user id: usr_abc12345
```

## Sample data

`sample_data/users.json` contains example payloads for bulk user creation.

## Output

`run_results.json` — full request/response log for each step.
