# Handover — remaining work (requires local execution / credentials / browser)

Status as of 2026-06-10. Everything below could **not** be completed in the Cowork session
(sandboxed environment — no sandbox credentials, no browser, no network push).
All code/doc fixes are already committed locally on `main`.

## 1. Push and verify CI (highest priority)

- [ ] `git push origin main` (local is several commits ahead).
- [ ] Verify the **pages.yml** deploy succeeds and the live site renders correctly
      (rebrand + FADS page + new FADS teaser section on index).
- [ ] Verify **test-packages.yml** runs green. The `spec-diff` job was rewritten
      (step outputs instead of `hashFiles('/tmp/…')`, `issues: write` permission added,
      curl error-handling fixed) — confirm the job completes and, if a spec diff exists,
      that a GitHub issue is actually created.

## 2. Run packages against sandbox

- [ ] Run all four scripts against the WISEflow sandbox with real `.env` credentials
      (`python packages/0X-…/wiseflow_….py`). They were syntax-checked only.
- [ ] `shared/auth.py` changed (env-var validation + docstring): confirm a normal run
      and a missing-var run both behave as expected.
- [ ] On success: update `lastTestedDate` in `compatibility.json`.

## 3. FADS browser smoke test

Static review passed against the FADS-PROMPT.md checklist (all four tabs, seed/reset,
provisioning, grade passback, API console using real `/license/…` paths). Not testable headless:

- [ ] Serve locally: `python3 -m http.server 3456 --directory web` (or the `fads-preview` launch config).
- [ ] First load seeds 80 students / 20 exams / ~200 enrolments / 15 staff; data survives refresh.
- [ ] Provision, enrol, grade-passback and Reset DB all work; toasts show on IndexedDB errors.
- [ ] Test on a small viewport (tables must scroll horizontally).

## 4. Nice-to-have (not started — deliberate scope decisions)

- [ ] `web/fads.css` has a handful of hardcoded hex values (JSON syntax-highlight colours
      + one gradient stop). Acceptable, but could be tokenised for strictness.
- [ ] Package 03 README prerequisite "Assessor IDs" now says *see Package 01 or your user
      database* — the old `GET /licence/` reference was not a real endpoint. Consider pointing
      to a concrete user-search endpoint if one exists in the spec.
- [ ] Consider a shared `_wf_get/_wf_post` helper module — each package script currently
      duplicates its own HTTP wrapper. Low priority; duplication keeps packages standalone
      (which is a feature for downloadable examples).
- [ ] FADS-PROMPT.md is now historical (the app is built). Consider moving it to `docs/`
      or deleting it before the repo is shared externally.

## Done in this session (for context)

- Committed FADS app + WISEflow design-token rebrand (3 commits) and all fixes below.
- Fixed CI spec-diff bug (issue creation never triggered), curl precedence, permissions.
- `shared/auth.py`: friendly missing-env-var error + 401/`invalidate_cache()` guidance.
- Created missing `LICENSE` (MIT, UNIwise ApS).
- README: audience statement, decision guide, FADS section, repo-structure update.
- Fixed `/licence/` → `/license/` endpoint references (READMEs + web/app.js) and
  `/license/grading-scales` to match `docs/api-spec-snapshot.yaml`.
- Version alignment: scripts + `compatibility.json` → 1.0.2; CHANGELOG entry added.
- index.html: FADS teaser section before footer.
