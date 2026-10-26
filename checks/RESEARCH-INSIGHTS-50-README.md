# Research Insights 50 — data-driven coverage explorer

A responsive, accessible analytics section on the MicroportMap homepage using the same 50 public research records and existing palette.

- **I01–I10**: coverage counters, introduction, directory and cross-page links.
- **I11–I22**: combined country, type, region, report-year and text filters, shareable state and removable filter chips.
- **I23–I34**: interactive categorical charts, view/sort modes, drilldown, expansion and empty feedback.
- **I35–I44**: record links, original evidence, source-date caveats, ordering and six-at-a-time browsing.
- **I45–I50**: filtered JSON/CSV, spreadsheet-safe fields, share links, directory handoff and retryable errors.

Source code: `src/research-insights.js`, dynamically loaded via the already-present `src/experience-tools.js` on all 72 pages. Only additive CSS in the shared `src/site-navigation.css`. All original JSON, CSV, source-linked research records, original HTML and core directory/atlas behaviors remain intact.

**Interpretation:** Charts count research records, not physical airports or currently operating sites. Report years are extracted from labels and **are not opening dates**. Approximate map pins and reporting do not establish public access or flight permissions. Browser and audit CI do not independently verify evidence accuracy or physical-device presentation.

Checks: `python3 checks/research-insights-50-audit.py`, `bash checks/research-insights-50-browser-smoke.sh`, existing regression suites.
