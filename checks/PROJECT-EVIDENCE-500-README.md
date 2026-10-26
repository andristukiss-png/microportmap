# Project Evidence Comparison — 500 inspectable project/field actions

Each of MicroportMap's **50 existing research passports** gains one compact, collapsed comparison panel. A visitor can select any of the other 49 original project records and inspect **10 reported fields** side by side. Every field includes an **Inspect field context** control explaining what the published wording means, showing whether the text is literally the same, different, or omitted, and emphasizing what cannot be inferred. A selection can be copied or exported as CSV/JSON. It never edits a source record or creates new “verified” findings.

The implementation contains **500 original-project × field controls**, not 500 new projects or 500 independent apps. A project visitor can compare to multiple others; the ledger tracks the ten field actions available on each of the 50 source passports.

| Field key | Research comparison |
|---|---|
| `country` | Reported country |
| `region` | World region |
| `infrastructureType` | Infrastructure category |
| `reportedOperator` | Operator attribution |
| `reportedEquipment` | Equipment description |
| `where` | Reported location |
| `locationPrecision` | Location precision |
| `reportDateLabel` | Source report timing |
| `verificationStatus` | Research verification status |
| `sourceName` | Original source attribution |

## Data and interface integrity

- `src/project-evidence-compare.js` runs only on `/projects/<original-id>/`. It uses unchanged `src/data/projects.json`.
- New CSS is appended to existing `src/site-navigation.css` with existing colors; an extra shared loader is added to `src/experience-tools.js`. All 72 original HTML pages, research passport text, original field inspector, saved trail, verification workspace and other existing tools remain intact.
- Suggestions rank common reported country/category/region only; **shared text is not independent corroboration**.
- Original external evidence URLs open only if they are safe HTTPS URLs. Exported CSV escapes spreadsheet-formula prefixes.
- Browser clipboard has a selectable-text fallback. No personal information, account or server-side submission is introduced.

## Validation

`node checks/project-evidence-500.cjs` runs 500 comparison field checks across all 50 original primary records. `python3 checks/project-evidence-500-audit.py` audits the ledger/data integrity, while `bash checks/project-evidence-browser-smoke.sh` verifies browser behavior with three source passports at desktop/mobile viewports, preserving the existing full CI suites.

Research coverage is *not* physical site counts, current operational verification or permission to fly.
