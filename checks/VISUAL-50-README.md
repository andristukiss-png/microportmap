# 50 visible MicroportMap refinements

This release makes 50 discrete, numbered presentation changes via `src/site-navigation.css`, which every existing HTML route already loads. See `checks/visual-50-ledger.json` for the exact numbered CSS implementing each task.

- V01–V10: Shared five-destination navigation and discovery banners.
- V11–V20: Homepage hero, calls to action, statistics, technology and timeline.
- V21–V30: Atlas workspace, filters, results, map legend and mobile scrolling.
- V31–V40: Directory filters, results and comparison table.
- V41–V48: Project research passports, related items and share/compare actions.
- V49–V50: Data-quality review and evidence cards.

No research data, original page HTML, legacy CSS palettes or application JavaScript changes. Improvements are CSS only and do not add new claims about verified sites or flight permission. CSS `:has()` is used to scope enhancements to relevant pages; older browsers will retain existing functional styling. Media queries preserve accessibility and navigation.

Run `python3 checks/visual-50-audit.py` and existing preservation/navigation suites. Real mobile/browser screenshots and optional online tile availability must still be verified separately; CI is not a substitute for visual QA.
