# Passport Reading Comfort — 500 concrete reading actions

The existing 50 MicroportMap project passports each gain one small, **collapsed by default** reading toolbar with **ten working controls**: focus on the original passport, restore supplementary research tools, increase/decrease/reset text size, switch between comfortable/compact spacing, expand/collapse research disclosures and invoke browser printing.

The task ledger contains **50 × 10 = 500 project/action instances**, not 500 new site records or claimed factual verifications.

| Action key | What changes |
|---|---|
| `focus` | Focus on original project information |
| `tools` | Restore supplementary research tools |
| `larger` | Increase text size for legibility |
| `smaller` | Decrease text size within safe range |
| `normal-text` | Restore normal reading text size |
| `comfort` | Toggle comfortable reading spacing |
| `compact` | Toggle compact reading spacing |
| `expand` | Expand all available research disclosures |
| `collapse` | Collapse all available research disclosures |
| `print` | Open the browser print dialog for this passport |

Settings apply only on the current page and never overwrite source records, research notes, or browser-local saved-project data. Focus mode temporarily hides the supplementary toolkit panels without deleting or disabling them. The underlying original hero, evidence warnings and reported details remain readable. The toolbar keeps site colors and supports reduced-motion preferences, keyboard-accessible buttons and live status text. Print uses the native browser print dialog (no remote service).

Only `src/passport-reading-controls.js`, the shared `src/experience-tools.js` loader, additive `src/site-navigation.css` rules and audit/test scripts change. Original 72 HTML files, all 50 research records and all existing atlas/directory/comparison behavior are untouched.

Run `node checks/passport-reading-500.cjs`, `python3 checks/passport-reading-500-audit.py`, `bash checks/passport-reading-browser-smoke.sh` plus the existing CI suites. A green browser simulation does not independently certify physical-device behavior or research facts.
