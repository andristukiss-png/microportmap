# Contrasting Research Paths — 500 distinct passport destinations

This release adds a **collapsed by default** "Explore 10 contrasting research projects" panel to all 50 existing MicroportMap research passports. From each original project, visitors can navigate to ten other original, source-linked research records that broaden the reported country, infrastructure category and region represented in their reading. Each entry includes a factual distinction label, an original passport link, a direct *compare these two* link and the original source URL (only if valid HTTPS).

The **500** items represent **50 origin passports × 10 different destination passports**. They are not 500 new projects, unverified claims, independent research discoveries or physical facilities. Every path is uniquely documented in `checks/contrasting-research-500-ledger.json`.

## Transparent selection

The selection algorithm first excludes the up-to-six most closely related projects already visible in the existing "Explore related projects" section (same-country/type/region weighted 4/2/1). It then selects ten other records, favoring diverse reported countries, infrastructure categories and regions. Names provide deterministic tie breaks. An exact match/difference is about **catalogue wording**—not physical infrastructure equivalence, corporate affiliation or permitted flight activity.

Original 50 records and all 72 source HTML pages are unchanged. Only the new shared passport module, the pre-existing experience loader, additive CSS using existing colors and checks/docs change. The original related-project section remains intact.

## Verification

Run `node checks/contrasting-research-500.cjs` to test all 500 generated paths against the original data and the prior related-project selection; `python3 checks/contrasting-research-500-audit.py` for static preservation; and `bash checks/contrasting-research-browser-smoke.sh` to inspect original Kiel, Shenzhen and Rotterdam passports in Chromium on desktop/mobile. All earlier site, atlas, directory, passport and export regressions remain in CI.

The generated paths are source-grounded catalogue cross-links, not proof of operations, ownership, access or aviation permission.
