# Research Review Workspace — 500 trackable due-diligence tasks

This release adds ten **manually trackable, record-specific questions** to each of the 50 original project passports (**50 × 10 = 500 review tasks**). This is a different function from the existing citation/field-presence toolkit: it lets a human visitor plan and record follow-up work, not assert verified facts.

Each question offers **Not started**, **Reviewed by me**, or **Needs follow-up**, plus up to 600 characters of private notes. Progress is summarized per project and can be cleared, copied, or exported in JSON and formula-safe CSV. Data stays locally in the browser when localStorage is allowed; when blocked, edits remain only in the page session. Updates in another tab refresh the display.

| Question ID | Visitor follow-up |
|---|---|
| `source` | Check original source |
| `timing` | Check source timing |
| `claim` | Compare reported claim to source |
| `country` | Check country and locality |
| `precision` | Check coordinate precision |
| `operator` | Check attribution wording |
| `equipment` | Check hardware descriptions |
| `current` | Investigate present-day operation |
| `access` | Investigate public access restrictions |
| `permission` | Investigate aviation authorization |

For each question we preserve the underlying published research caveats. A selected “Reviewed by me” status means only that the visitor examined a question; it does not independently validate the source, current operations, public access, coordinates or flight permissions.

Implementation: `src/research-review-workspace.js` loaded only on original `/projects/<slug>/` pages by the existing shared experience entry point. CSS rules added to `src/site-navigation.css` reuse the original palette. No changes to original research JSON or HTML. The per-task manifest is in `checks/review-workspace-500-ledger.json`.

Run `node checks/review-workspace-500.cjs` for a 500-task per-project state-transition matrix, `python3 checks/review-workspace-500-audit.py` for repository preservation, and `bash checks/review-workspace-browser-smoke.sh` for real browser render/actions and responsive views. Automated tests cannot independently confirm operational research facts.
