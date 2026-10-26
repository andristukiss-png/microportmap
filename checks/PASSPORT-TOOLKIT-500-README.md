# MicroportMap Passport Research Toolkit · 500 project/action tasks

This release delivers ten useful additional research actions on **each of the 50 existing project passports**: **50 × 10 = 500 concrete project-specific action instances**. It is one cohesive progressively enhanced feature; it does not create 500 new project records, 500 separate apps or 500 independently verified operational claims.

## Ten new actions on each passport

| ID | Action |
| --- | --- |
| `citation-plain` | Copy source-qualified plain citation |
| `citation-markdown` | Copy research citation in Markdown |
| `citation-bibtex` | Copy machine-readable BibTeX for catalogue record |
| `download-brief-txt` | Download original-field plain-text research brief |
| `download-brief-md` | Download original-field Markdown research brief |
| `copy-review` | Copy field-presence review with caveats |
| `download-review-csv` | Download safe CSV field-presence review |
| `copy-facts` | Copy project-specific, caveated key facts |
| `original-source` | Open HTTPS original evidence link |
| `same-equipment` | Find directory research mentioning the same reported equipment |

Every action has its own project-specific URL, original catalogue evidence and appropriate caveats. The source link opens only valid HTTPS references, and equipment links search the directory without treating similar equipment labels as the same model. Local browser downloads do not upload research anywhere. When clipboard access fails, users can select and copy the prepared text manually.

The panel also presents a seven-field **field-presence checklist** to distinguish a documented field from independently confirmed activity. The report-year label is not turned into an invented publication or opening date. Citation text and BibTeX refer explicitly to the *MicroportMap research record*, not to fabricated original publisher metadata.

## Preservation

Original 50 records at `src/data/projects.json`, all 72 original HTML pages, original passport text, site colors, established map and comparison code, and prior shared navigation are unchanged. Only `src/passport-research-toolkit.js`, the shared loader, additive CSS and audit files are changed. The toolkit runs only on `/projects/<id>/` URLs.

## Reproducible checks

Run `node checks/passport-toolkit-500.cjs` to execute a genuine 50-passport × 10-action test matrix; `python3 checks/passport-toolkit-500-audit.py` to verify the ledger, data preservation and integration; and `bash checks/passport-toolkit-browser-smoke.sh` for a real Chromium DOM/mobile check. Existing site and research regression suites run in CI as before.

The tests verify the code and transformations; they do not independently validate research accuracy, external source current availability, live map tiles or physical-device behavior.
