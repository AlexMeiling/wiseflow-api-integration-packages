# WISEflow API — Integration Packages

Runnable, end-to-end workflow scripts for the four most common WISEflow API integration patterns — built to take an institution from *"we have API credentials"* to *"our SIS talks to WISEflow"* in hours, not weeks.

Each package is a standalone Python script (+ Postman collection) that executes a real workflow against the WISEflow API, with sample data, step-by-step output, and an animated preview on the [companion site](https://alexmeiling.github.io/wiseflow-api-integration-packages/).

**Who is this for?** Integration developers and technical staff at institutions connecting their SIS/LMS to WISEflow — and anyone evaluating what a WISEflow integration involves before writing production code.

> **WISEflow API version:** 1.34.0 (OAS 3.0)  
> **Package version:** see `compatibility.json`

---

## Packages

| # | Package | What it demonstrates |
|---|---------|----------------------|
| 01 | [User Management](packages/01-user-management/) | Create users, assign roles, update details, patch custom data |
| 02 | [Flow Management](packages/02-flow-management/) | Create exam flows, set dates/description, activate |
| 03 | [User Allocation](packages/03-user-allocation/) | Enrol participants, add assessors, create groups, allocate |
| 04 | [Grade Passback](packages/04-grade-passback/) | Fetch submissions & marks, transform, push to SIS/LMS |

### Which package do I need?

| If you want to… | Start with |
|-----------------|------------|
| Provision students/staff from your SIS or HR system | **01** |
| Create and configure exam flows from your exam planning system | **02** |
| Enrol students and allocate examiners onto existing flows | **03** |
| Return final grades to your SIS/LMS after assessment | **04** |
| See the full SIS ↔ WISEflow lifecycle without writing code | **FADS** (below) |

The packages mirror the natural integration lifecycle: **01 → 02 → 03 → 04** covers users in, exams set up, people allocated, grades out.

---

## FADS — try the integration without an integration

[**FADS** (Fictitious Assessment Data Store)](https://alexmeiling.github.io/wiseflow-api-integration-packages/fads.html) is a browser-based mock SIS for the imaginary *WISEflow UNIversity*. It generates a realistic student database (students, exams, enrolments, staff — 100 % fictional, persisted in your browser) and simulates the three core workflows — user provisioning, exam enrolment, and grade passback — showing the exact API requests and responses a real integration would exchange.

Use it in demos, onboarding sessions, and integration design workshops to align stakeholders on the data flow **before** anyone writes code. No backend, no credentials, no risk.

---

## Prerequisites

- Python 3.9+
- A WISEflow **sandbox** tenant with OAuth2 client credentials

```bash
pip install -r requirements.txt
```

---

## Setup

1. Copy `.env.example` to `.env` in the package folder you want to run:
   ```bash
   cp .env.example packages/01-user-management/.env
   ```
2. Edit `.env` and fill in your credentials:
   ```
   WISEFLOW_BASE_URL=https://europe-api.wiseflow.net/v1
   WISEFLOW_CLIENT_ID=your_client_id
   WISEFLOW_CLIENT_SECRET=your_client_secret
   ```
3. Run the script:
   ```bash
   python packages/01-user-management/wiseflow_users.py
   ```

Results are written to `run_results.json` in each package directory.

---

## Postman collections

Each package folder contains a `postman/` subfolder with a ready-made Postman collection.  
A shared environment file lives at `postman/WISEflow-Integration.postman_environment.json` — import this once and it works across all four collections.

**Import collections:** In Postman → *Import* → paste the raw GitHub URL of the `.postman_collection.json` file, e.g.:
```
https://raw.githubusercontent.com/AlexMeiling/wiseflow-api-integration-packages/main/packages/01-user-management/postman/user_management.postman_collection.json
```

**Import environment:** In Postman → *Import* → paste:
```
https://raw.githubusercontent.com/AlexMeiling/wiseflow-api-integration-packages/main/postman/WISEflow-Integration.postman_environment.json
```

Then fill in `baseUrl`, `clientId`, `clientSecret` in the environment — the collections fetch a bearer token automatically. Never commit your actual credentials.

---

## Keeping packages up to date

WISEflow releases follow a quarterly cycle (major: March/October · minor: April/November).  
Six weeks before each release, [SYCAmore](https://sycamore.wiseflow.net) is updated with upcoming endpoint changes.

Maintenance checklist:
- [ ] Check SYCAmore "Next Release" section for relevant endpoint changes
- [ ] Run CI pipeline against latest sandbox after each WISEflow release
- [ ] Compare `docs/api-spec-snapshot.yaml` against the new spec (automated via `test-packages.yml`)
- [ ] Bump package `VERSION` constant + update `docs/CHANGELOG.md`
- [ ] Update `compatibility.json`

---

## Repository structure

```
wiseflow-integration-packages/
├── shared/auth.py                  # Shared OAuth2 token helper
├── packages/
│   ├── 01-user-management/
│   ├── 02-flow-management/
│   ├── 03-user-allocation/
│   └── 04-grade-passback/
├── web/                            # GitHub Pages site
│   ├── index.html                  # Package overview + animated previews
│   └── fads.html / fads.js         # FADS — mock SIS demo app
├── docs/
│   ├── CHANGELOG.md
│   └── api-spec-snapshot.yaml      # Committed API spec for diff tracking
├── compatibility.json
└── .github/workflows/
    ├── test-packages.yml           # CI: run scripts + diff API spec
    └── pages.yml                   # Deploy web/ to GitHub Pages
```

---

## Licence

MIT — see [LICENSE](LICENSE).
