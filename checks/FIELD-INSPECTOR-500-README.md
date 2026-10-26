# Research Field Inspector — 500 practical copy actions

The project pages gain a **collapsed** "Inspect and copy 10 research fields" panel. Each field displays the original catalogue wording plus a caution specific to that field, and has a single copy button. Copied text includes the field name and exact reported value, MicroportMap research passport, safe source URL where available, and evidence limitations. When clipboard access is denied or stalls, a selectable manual-copy box is shown.

This provides **500 actual project-specific copy controls** (50 original projects × 10 fields), not 500 independent new features or verified facts.

| Copy field | Meaning |
|---|---|
| `name` | Project title |
| `where` | Reported place |
| `country` | Reported country |
| `region` | Region |
| `infrastructureType` | Infrastructure category |
| `reportedOperator` | Operator attribution |
| `reportedEquipment` | Equipment description |
| `locationPrecision` | Location precision |
| `reportDateLabel` | Source report label |
| `sourceURL` | Original source URL |

No additional external service, account, stored private note, or submission inbox is created. The feature uses an original existing static dataset in the browser. All 50 original source records, 72 original HTML pages, prior navigation, existing research tools, tests, and site colors remain intact.

## Verification

- `node checks/field-inspector-500.cjs` simulates all 500 on-page copy controls and tests that each output contains the correct original field and project-specific source.
- `python3 checks/field-inspector-500-audit.py` verifies the ledger and preservation expectations.
- `bash checks/field-inspector-browser-smoke.sh` renders the panel in Chromium on three original passports in desktop and mobile sizes, tests an actual button and clipboard fallback, and captures six screenshots.
- All previous regression tests continue to run.

**Critical caveat:** Copying a reported field is not verifying a claimed facility or authorization to use it.
