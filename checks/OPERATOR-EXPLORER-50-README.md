# Operators 50 — Source-attributed operators explorer

The updated operator research experience uses the **original published attribution labels verbatim**. A label such as “Operator A / Partner B” remains one literal field value, not an assertion about a formal joint venture or its activities.

| IDs | Ten documented user-facing improvements |
| --- | --- |
| O01–O10 | Counts, dynamic source loading, fallback and frequent attribution labels |
| O11–O20 | Search, country, infrastructure, region, year, sorting and deep links |
| O21–O30 | Source-backed operator project details and supporting passports |
| O31–O40 | Attribution-to-attribution research coverage comparison |
| O41–O50 | Original record exports, CSV hardening, share, fallback and caveats |

The existing `/operators/` HTML remains unchanged. New `src/operator-explorer.js` loads through the existing 72-page shared `src/experience-tools.js` and keeps the existing static operator list visible until the validated JSON catalogue successfully loads. New CSS only appends to the existing shared palette. No original `src/data/` files or core atlas, directory, comparison or passport scripts are modified.

This release compares *how often attribution labels appear in the catalogue*; it does not establish corporate relationships, ownership, actual equipment, operations, site access or aviation authorization.

Verify with `python3 checks/operator-explorer-50-audit.py`, `bash checks/operator-explorer-50-browser-smoke.sh`, and all existing CI suites. Automated screenshots are not physical-device validation.
