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

## Upcoming

Subscribe to [SYCAmore](https://sycamore.wiseflow.net) for advance notice of WISEflow API changes
(typically announced ~6 weeks before each release: major in March/October, minor in April/November).
