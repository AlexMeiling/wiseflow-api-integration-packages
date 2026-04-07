# WISEflow API — Integration Packages

Downloadable, runnable workflow scripts that demonstrate the most common WISEflow API integration patterns. Each package is a standalone Python script (+ Postman collection) that executes a real end-to-end workflow against the WISEflow API.

> **WISEflow API version:** 1.34.0 (OAS 3.0)  
> **Package version:** see `compatibility.json`

---

## Packages

| # | Package | What it demonstrates |
|---|---------|----------------------|
| 01 | [User Management](packages/01-user-management/) | Create users, assign roles, update details, patch custom data |
| 02 | [Flow Management](packages/02-flow-management/) | Create exam flows, set dates/description, activate |
| 03 | [Participants & Assessors](packages/03-participants-assessors/) | Enrol participants, add assessors, create groups, allocate |
| 04 | [Grade Passback](packages/04-grade-passback/) | Fetch submissions & marks, transform, push to SIS/LMS |

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
│   ├── 03-participants-assessors/
│   └── 04-grade-passback/
├── web/                            # GitHub Pages site
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
