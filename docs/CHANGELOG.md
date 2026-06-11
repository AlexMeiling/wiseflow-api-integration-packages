# Changelog

All notable changes to the WISEflow Integration Packages are documented here.

Format: `[Package version] — WISEflow API version — Date`

---

## [1.0.0] — API 1.34.0 — 2026-03-26

### Added
- Initial release of all four integration packages
- Package 01: User Management (7 steps)
- Package 02: Flow Management (8 steps)
- Package 03: Participants & Assessors (7 steps)
- Package 04: Grade Passback (4 steps, WISEflow → SIS direction)
- Postman collections for all four packages with auto-OAuth2 token handling
- GitHub Pages site with animated sequence diagram previews
- CI: `test-packages.yml` — runs all scripts against sandbox + API spec diff
- CI: `pages.yml` — deploys web/ to GitHub Pages

### Notes
- Packages target WISEflow API 1.34.0 (OAS 3.0)
- OAuth2 uses the `client_credentials` grant (`POST /oauth2/token`)
- Grade passback supports an optional `SIS_ENDPOINT` env var; omitting it writes `grades_output.json` instead

---

## [1.0.1] — API 1.34.0 — 2026-04-15

### Changed
- **Restructured Package 03**: Renamed from "Participants & Assessors" to "User Allocation" for clarity
- **Updated workflow documentation**: Organized Package 03 workflow into three subsections
  - 3.1 Associates (managers, invigilators, authors)
  - 3.2 Participants (enrolment, unique exam IDs, groups)
  - 3.3 Assessors & Reviewers (allocations, groups)
- **Added prerequisites to all packages**: Each package now documents required data/endpoints
  - Package 01: User roles and data types
  - Package 02: Flow types, purposes, grading scale
  - Package 03: Flow ID
  - Package 04: Marked flow and SIS endpoint
- **Updated website**: Interactive prerequisites table displayed on each workflow card

### Notes
- Folder structure changed: `packages/03-participants-assessors/` → `packages/03-user-allocation/`
- Postman collection file names and Python script names unchanged for backward compatibility
- All prerequisites are now prominently displayed on the GitHub Pages site alongside workflow steps

---

## [1.0.2] — API 1.34.0 — 2026-06-10

### Added
- **FADS (Fictitious Assessment Data Store)**: browser-based mock SIS demo app on the Pages site — simulates user provisioning, exam enrolment, and grade passback with realistic mock API requests/responses (IndexedDB, 100 % client-side, fictional data)
- `LICENSE` file (MIT) — previously referenced from README but missing
- README: audience statement, "Which package do I need?" decision guide, FADS section

### Changed
- Site rebranded to the WISEflow design token system (Signika, brand palette, logo assets)
- `shared/auth.py`: clear error message when required environment variables are missing; documented 401-retry pattern via `invalidate_cache()`
- Package `VERSION` constants and `compatibility.json` aligned with the changelog (1.0.1 bump was missed)

### Fixed
- Endpoint references in READMEs and website corrected to match the API spec: `/license/…` (not `/licence/…`), `/license/grading-scales` (not `/licence/grading-scale`)
- CI `spec-diff`: GitHub issue on spec change was never created (`hashFiles()` does not work on `/tmp`); replaced with step outputs, fixed curl error-handling precedence, added `issues: write` permission

---

## [1.0.3] — API 1.35.0 — 2026-06-11

### Added
- FADS **Simulation** tab: end-to-end animated process diagram contrasting the PUSH (webhook) and PULL (grade passback) integration patterns
- FADS **Data Flow** tab: sequence-diagram model showing each endpoint's posted/returned payloads, an icon travelling between systems, and a run checklist of what updated and what's next

### Changed
- Refreshed `docs/api-spec-snapshot.yaml` to WISEflow API **1.35.0** — additive only for the four packages: new `/flows/{flowId}/participant-groups` endpoints, and `GET /flow/{flowId}/groups` is now deprecated (use `/participant-groups`; EOL Release 2028.03). No package required code changes.
- FADS API Console and tab actions: request/response shapes audited against the API spec and verified against the live API — corrected user provisioning (`emails`/`firstName`/`lastName`/`roles`), flow creation (integer `type` + `managers`), the dates/activate `PATCH` bodies, participant enrolment, submissions, and item-based-marks
- `lastTestedDate` refreshed to 2026-06-11 across all four packages (re-verified against the live API)

### Fixed
- FADS: removed a fabricated grade-push `PATCH` call — WISEflow only exports grades (pull), so the manual passback now logs the supported `GET /flows/{flowId}/participants/{pId}/item-based-marks` read

---

## Upcoming

Subscribe to [SYCAmore](https://sycamore.wiseflow.net) for advance notice of WISEflow API changes
(typically announced ~6 weeks before each release: major in March/October, minor in April/November).
