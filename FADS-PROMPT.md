# Claude Code Prompt — FADS Mock SIS for WISEflow UNIversity

## Context

This is a static GitHub Pages site (`web/` folder) for the WISEflow API Integration Packages. It's pure HTML + CSS + JS — no build step, no framework. The site uses the WISEflow design token system (`tokens.css`) and `styles.css`. Typography is Signika. Primary brand colour is `#769b08` (green).

Existing nav in `web/index.html` links to four anchor sections on the same page. You need to add a fifth nav item linking to a **new separate page** (`web/fads.html`).

## Task

Build **FADS** — the **Fictitious Assessment Data Store** — a mock Student Information System (SIS) for the imaginary institution **"WISEflow UNIversity"**. This is a demo/simulation tool used to show how a real SIS integrates with the WISEflow API across three workflows: user provisioning, exam enrolment, and grade passback.

All data must be **randomly generated** on first load (no real people, no real institutions). Data must persist in **IndexedDB** so the database survives page refreshes. No backend, no server — this is 100% client-side.

---

## Files to create / modify

| File | Action |
|------|--------|
| `web/index.html` | Add "FADS" nav link pointing to `fads.html` |
| `web/fads.html` | New page — full FADS application |
| `web/fads.css` | Styles for the FADS page (use tokens from `tokens.css`) |
| `web/fads.js` | All JS: IndexedDB, data generation, UI logic |

---

## Data model

All four tables live in a single IndexedDB database named `fads-db` (version 1).

### 1. `students`
| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | Primary key (`keyPath: 'id'`) |
| `wf_id` | string | WISEflow user ID, format: `wfu-` + 8 random alphanumeric chars, unique |
| `first_name` | string | Random first name (mix of Danish + English) |
| `last_name` | string | Random last name |
| `email` | string | `{firstname}.{lastname}{N}@stud.wf.dk` where N avoids collisions |
| `programme` | string | e.g. "BSc Computer Science", "MSc Business Administration" |
| `programme_code` | string | e.g. "BSCS", "MSBIZ" |
| `year_of_study` | number | 1–5 |
| `enrolment_date` | string (ISO date) | Date student enrolled at the institution |
| `status` | string | `active` \| `inactive` \| `graduated` \| `suspended` |
| `nationality` | string | e.g. "Danish", "German", "Norwegian" |
| `language` | string | `da` \| `en` |
| `student_group` | string | e.g. "Group A", "Group B" |
| `date_of_birth` | string (ISO date) | Age 18–30 range |
| `wf_provisioned` | boolean | Whether this student has been "sent" to WISEflow |
| `wf_provisioned_at` | string \| null | ISO datetime of last provisioning |
| `created_at` | string (ISO datetime) | |

Indexes: `wf_id` (unique), `email` (unique), `status`, `programme_code`

### 2. `exams`
| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | Primary key |
| `exam_code` | string | e.g. "CS101-2026-S1", unique |
| `title` | string | e.g. "Introduction to Programming — Spring 2026" |
| `course_code` | string | e.g. "CS101" |
| `course_name` | string | e.g. "Introduction to Programming" |
| `exam_type` | string | `written` \| `oral` \| `portfolio` \| `multiple-choice` \| `take-home` |
| `flow_type` | string | `FLOWlock` \| `FLOWmulti` \| `FLOWassign` \| `FLOWhandin` |
| `faculty` | string | e.g. "Faculty of Technology", "Faculty of Business" |
| `department` | string | |
| `start_date` | string (ISO datetime) | |
| `end_date` | string (ISO datetime) | |
| `duration_minutes` | number \| null | For timed exams |
| `max_participants` | number | |
| `grade_scale` | string | `7-point` \| `pass-fail` \| `ECTS` |
| `language` | string | `da` \| `en` |
| `status` | string | `draft` \| `active` \| `completed` \| `archived` |
| `wf_flow_id` | string \| null | The flow ID returned when provisioned to WISEflow |
| `wf_provisioned` | boolean | |
| `wf_provisioned_at` | string \| null | |
| `created_at` | string (ISO datetime) | |

Indexes: `exam_code` (unique), `status`, `faculty`, `flow_type`

### 3. `enrolments`
This is the junction table — one row per student per exam.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | Primary key |
| `student_id` | string | FK → students.id |
| `exam_id` | string | FK → exams.id |
| `enrolment_status` | string | `enrolled` \| `withdrawn` \| `no-show` |
| `wf_participant_id` | string \| null | The participant ID returned by WISEflow |
| `wf_provisioned` | boolean | Whether enrolment was pushed to WISEflow |
| `wf_provisioned_at` | string \| null | |
| `grade` | string \| null | e.g. "12", "7", "Pass", "Fail" |
| `grade_passed` | boolean \| null | |
| `grade_passback_at` | string \| null | ISO datetime when grade was received |
| `submission_id` | string \| null | WISEflow submission ID (simulated) |
| `created_at` | string (ISO datetime) | |

Compound unique index on `[student_id, exam_id]`. Indexes: `student_id`, `exam_id`, `enrolment_status`

### 4. `staff`
| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | Primary key |
| `wf_id` | string | `wfs-` + 8 chars, unique |
| `first_name` | string | |
| `last_name` | string | |
| `email` | string | `{firstname}.{lastname}@wf.dk` |
| `role` | string | `examiner` \| `co-examiner` \| `admin` \| `course-coordinator` |
| `department` | string | |
| `wf_provisioned` | boolean | |
| `created_at` | string (ISO datetime) | |

---

## Seed data (generated on first load)

Generate the following randomly when the database is empty:
- **80 students** across 6 programmes
- **20 exams** across 4 faculties (mix of past, active, upcoming)
- **~200 enrolments** (each student on 2–4 exams, realistic spread)
- **15 staff members**

Programmes to use:
- BSc Computer Science (`BSCS`)
- BSc Business Administration (`BSBIZ`)
- MSc Artificial Intelligence (`MSAI`)
- MSc Education Technology (`MSEDT`)
- BSc Mathematics (`BSMAT`)
- MA Digital Communication (`MADC`)

Use a realistic mix of Danish, Scandinavian, and English first/last names (purely fictional). Generate sensible exam titles and course codes that match the programmes. About 60% of students and exams should be `wf_provisioned: true` (simulating that some have already been synced), 40% pending.

---

## UI layout

`fads.html` is a full app page. It must:
- Reuse the same topnav from `index.html` (copy the header HTML, mark "FADS" as the active nav item)
- Have a page hero/header with: title "FADS — Fictitious Assessment Data Store", subtitle "WISEflow UNIversity · Mock SIS", and a small stats bar showing live counts (students, exams, enrolments, staff)

Below the hero, the main content is a **tab bar** with four tabs:

### Tab 1 — Students
- Searchable, sortable data table of all students
- Columns: WF-ID, Name, Email, Programme, Year, Status, WF Provisioned (yes/no badge)
- Clicking a row opens a slide-in detail panel (or modal) showing all student fields + their enrolments
- Buttons: "Add Student" (opens a form to create a new random-ish or custom student), "Seed 10 more", "Export JSON"
- Each row has action buttons: Edit, Delete, "Provision to WF" (simulates a POST to WISEflow — marks `wf_provisioned: true`, sets `wf_provisioned_at`, shows a mock API response in a toast/panel)

### Tab 2 — Exams
- Same pattern as Students tab but for exams
- Columns: Exam Code, Title, Type, Flow Type, Faculty, Status, Dates, WF Provisioned
- "Provision to WF" button on each exam sets `wf_flow_id` to a realistic fake ID and marks provisioned
- "Add Exam" form

### Tab 3 — Enrolments
- A table filtered by exam (dropdown to pick exam) or student
- Columns: Student Name, Exam Title, Status, WF Provisioned, Grade, Passed
- "Enrol Student" button (pick student + exam from dropdowns)
- "Sync to WF" per row — simulates participant provisioning
- "Passback Grade" per row — opens a small form to enter a grade for that student/exam, marks `grade`, `grade_passed`, `grade_passback_at`
- Bulk actions: "Sync all unprovisioned", "Passback all grades"

### Tab 4 — API Console
A simulated REST API console. Shows mock HTTP request/response for each of the three workflows:

**Workflow panels (accordion or tabs within this tab):**

1. **User Provisioning** — Pick one or more students from a list → generates a realistic mock `POST /v5/users` request body (JSON) based on the student data → shows mock WISEflow response. Has a "Send" button that executes the simulated call (marks student as provisioned).

2. **Exam Enrolment** — Pick an exam → shows students enrolled in it → generates mock `POST /v5/flows/{flowId}/participants` batch request → "Send" marks enrolments as WF provisioned.

3. **Grade Passback** — Shows a table of enrolments with grades for a selected exam → generates mock `PATCH /v5/flows/{flowId}/participants/{participantId}` payloads → "Send" marks grade_passback_at.

Each panel shows:
- **Request** block: method badge (POST/PATCH/GET), URL, headers (Authorization: Bearer [mock token]), JSON body — syntax highlighted
- **Response** block: HTTP status code, response JSON
- A small "Copy" button on each block
- A log at the bottom showing the last 10 simulated API calls with timestamp, method, endpoint, status

---

## Styling notes

- Use CSS variables from `tokens.css` for all colours and spacing — do NOT hardcode hex values
- The page should feel like a real admin tool, not a toy — use a clean table layout with proper borders (`--wf-colors-border-default`), hover states, and consistent padding
- Status badges: `active`/`enrolled` = green (`--wf-colors-success-*`), `draft` = grey, `completed` = blue, `withdrawn`/`suspended` = orange, `no-show` = red
- WF Provisioned: green tick badge; Not provisioned: grey outlined badge
- Buttons: primary style = `--wf-colors-primary-9` background, white text. Secondary = outlined with `--wf-colors-border-default`
- The topnav active link for "FADS" should be visually distinct (e.g. `--wf-colors-primary-9` underline or background)
- Mobile-responsive: tables should scroll horizontally on small screens

---

## Technical requirements

- **No frameworks** — vanilla JS only (ES2020+, modules are fine but a single script file is preferred for GitHub Pages compatibility)
- **IndexedDB wrapper** — write a small Promise-based wrapper (open, getAll, get, put, delete, getByIndex) rather than using a third-party library
- **Data generation** — all random data is generated in JS using `crypto.randomUUID()` for IDs. No external APIs.
- **Persistence** — every Create/Update/Delete goes to IndexedDB immediately. On page load, read from IndexedDB; if empty, seed with generated data
- **Error handling** — all IndexedDB operations wrapped in try/catch, errors shown to the user as toast notifications
- The page must work when served via `file://` (no CORS issues) as well as via GitHub Pages

---

## Nav change in `index.html`

Add to the `<nav class="nav-links">` section:
```html
<a href="fads.html" class="nav-fads-link">FADS ↗</a>
```

Place it before the "API Docs ↗" link.

---

## Deliverable checklist

- [ ] `web/index.html` — nav updated
- [ ] `web/fads.html` — complete, valid HTML
- [ ] `web/fads.css` — all styles, no hardcoded colours
- [ ] `web/fads.js` — IndexedDB, seed data, all tab UI and interactions
- [ ] First load: seeds 80 students, 20 exams, ~200 enrolments, 15 staff
- [ ] All four tabs functional: Students, Exams, Enrolments, API Console
- [ ] "Provision to WF" simulation works on students, exams, and enrolments
- [ ] Grade passback simulation works
- [ ] API Console shows realistic mock request/response JSON for all three workflows
- [ ] Data persists on page refresh
- [ ] "Reset database" button somewhere (clears IndexedDB and re-seeds) — put it in the page hero or a settings corner

---

## Tips for realistic mock data

- WF-IDs for students: `wfu-` + 8 hex chars (e.g. `wfu-a3f92c11`)
- WF-IDs for staff: `wfs-` + 8 hex chars
- WISEflow flow IDs returned by the mock API: `flw-` + 8 hex chars
- Participant IDs: `par-` + 8 hex chars
- Submission IDs: `sub-` + 8 hex chars
- Danish grade scale values: `12`, `10`, `7`, `4`, `02`, `00`, `-3`
- ECTS scale values: `A`, `B`, `C`, `D`, `E`, `Fx`, `F`
- Pass/fail values: `Pass`, `Fail`
- Mock OAuth token in API Console: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...` (truncated fake JWT)
