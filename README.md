# MicroportMap

Interactive, source-linked research directory of drone infrastructure worldwide.

Live site: https://microportmap.com

## Project structure

- `src/`: static website, shared navigation, atlas, directory, project passports and original research data.
- `checks/`: dependency-free Python and Node.js checks, reproducible fixtures, results and task ledgers.
- `baseline-round*.json` and `manifest.json`: preservation baselines.
- `development-report.html`: implementation and verification history.

The site has no framework or dependency installation. Run `python3 scripts/build_catalogue.py` and serve `dist/` as the web root. The build merges the immutable original 50-record snapshot in `src/data/projects.json` with reviewed additions in `catalogue/additions.json`, generates new passports, and aligns JSON/CSV/GeoJSON downloads and the sitemap. `src/` alone is the original reference site, not the complete expanded release. The current production site is hosted on Vercel; publishing this repository does not configure automatic deployments.

## Verification

Run from the repository root using Python 3 and Node.js:

```sh
python3 checks/validate.py
python3 checks/navigation-round12.py
python3 checks/site-navigation-audit.py
python3 checks/site-recovery.py
node checks/directory.cjs
node checks/atlas.cjs
node checks/compare.cjs
node checks/passport.cjs
node checks/export.cjs
node checks/record-field-2000.cjs
```

Additional suites and their exact scope are documented under `checks/`. Controlled DOM/VM tests are local behavioral checks, not live browser/device tests.

## Continuous verification

GitHub Actions runs `.github/workflows/verify.yml` on pull requests, pushes to `main` and manual dispatches. It checks source/data preservation, site navigation and recovery, atlas/directory/passport/comparison behavior, and the 2,000-case record-field export suite.

`node checks/map-layer-transitions.cjs` exercises the existing atlas map-layer lifecycle with a controlled Leaflet mock: offline/online toggles, repeat attachment, tile-load and tile-error feedback, automatic schematic fallback and retry. These are code-level tests, not real mobile visual checks or confirmation that external online map tiles are available.

A successful GitHub workflow **does not deploy to Vercel**. The production deployment remains independently managed until an explicit Git integration or deployment workflow is configured.

## Research limits

The current build contains 275 source-linked research records (50 originals plus 225 additions in fourteen reviewed batches). Records can describe a centre, hospital campus, station or network; they are not a count of individually verified operating ports. All approximate map points are research references. They do not establish current operations, public access or flight permission. Independent research accuracy and actual mobile/device visuals remain unverified. Correction reports are prepared locally; no submission inbox is connected.

## V1 launch status

[V1 launch review](V1-LAUNCH.md) records the finite release scope, 500 passport gates, corrected map/storage disclosures and two open owner-content blockers. Passing technical tests does not complete the publisher/contact and hosting/privacy information.

## Catalogue expansion

The next target is 1,000 credible, distinct research records. The first fourteen batches add 225 records; 725 more are needed. No quantity guarantee is made before sources and counting scope are reviewed.

Each new record requires a named location or clearly scoped network, a traceable public source, its publication date when displayed, source-reading date, source type, reported status, duplicate-review notes and an explicitly editorial approximate locality point. Do not count delivery destinations, all hospitals in a network, or vendor fleet totals as individual sites without separate evidence. Source reading is not an operational inspection.

Add reviewed records to `catalogue/additions.json`, then run `python3 checks/catalogue-expansion.py`. The build rejects duplicate IDs/entities, duplicate names and localities, missing review notes, unsafe URLs and invalid coordinates. Review near-duplicates manually; string checks cannot establish real-world identity. Government, hospital, operator, research and attributed original news reports support the reviewed batches. Undated ministry pages remain labelled undated.

The original source and export snapshot is available under `/data/original-50/` in the build. Historic audit/backlog downloads outside the current projects/countries/quality exports still describe that original snapshot; their 500 planned review tasks are not newly completed research. Existing source-regression suites retain their original fixture scope. The separate expansion suite tests the actual built 275-record catalogue and its generated pages in desktop/mobile Chromium.

Vercel builds from the repository root using `vercel.json`; output is `dist/`. Deploying only `src/` will omit additions. The build is deterministic and does not contact source websites or geocode during deployment.

The 29 October 2026 review also corrects four Australian Wing records to historical, with linked cessation evidence and an exact before/after correction ledger. The other 246 prior records remain unchanged.
