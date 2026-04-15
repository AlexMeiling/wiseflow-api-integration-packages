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

## Upcoming

Subscribe to [SYCAmore](https://sycamore.wiseflow.net) for advance notice of WISEflow API changes
(typically announced ~6 weeks before each release: major in March/October, minor in April/November).
