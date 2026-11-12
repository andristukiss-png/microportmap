# MicroportMap

Interactive, source-linked research directory of drone infrastructure worldwide.

Live site: https://microportmap.com

## Project structure

- `src/`: static website, shared navigation, atlas, directory, project passports and original research data.
- `checks/`: dependency-free Python and Node.js checks, reproducible fixtures, results and task ledgers.
- `baseline-round*.json` and `manifest.json`: preservation baselines.
- `development-report.html`: implementation and verification history.

The site has no framework or dependency installation. Run `python3 scripts/build_catalogue.py` and serve `dist/` as the web root. The build merges the immutable original 50-record snapshot in `src/data/projects.json` with reviewed additions in `catalogue/additions.json`, generates new passports, and aligns JSON/CSV/GeoJSON downloads and the sitemap. `src/` alone is the original reference site, not the complete expanded release. The current production site is hosted on Vercel; the connected Vercel project builds and deploys main-branch changes.

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

The current build contains 1,054 source-linked research records (50 originals plus 1004 additions in one hundred and twenty-four reviewed batches). Records can describe a centre, hospital campus, station or network; they are not a count of individually verified operating ports. All approximate map points are research references. They do not establish current operations, public access or flight permission. Independent research accuracy and actual mobile/device visuals remain unverified. Correction reports are prepared locally; no submission inbox is connected.

## V1 launch status

[V1 launch review](V1-LAUNCH.md) records the finite release scope, 500 passport gates, corrected map/storage disclosures and two open owner-content blockers. Passing technical tests does not complete the publisher/contact and hosting/privacy information.

## Catalogue expansion

The 1,000-record catalogue target has been reached: 1,054 source-linked records across 56 countries. Continue adding credible, distinct facilities after evidence and counting-scope review; this milestone does not establish current operation or public access.

The [50-candidate review](catalogue/one-hundred-fifth-batch-review.md) records 50 completed screening tasks: 20 accepted sites, 28 deferred candidates and two overlapping entries excluded. A completed screening is not a claim that a deferred site has been verified.

The [second 50-candidate review](catalogue/one-hundred-sixth-batch-review.md) records a further 50 completed screening tasks: 18 accepted sites, 24 deferred candidates and eight overlapping entries excluded. These are screening outcomes, not 50 new records.

The [third 50-candidate review](catalogue/one-hundred-seventh-batch-review.md) records another 50 screening decisions: 17 accepted sites, 24 deferred candidates and nine overlaps excluded. The record total increases by 17, not 50.

The [fourth 50-candidate review](catalogue/one-hundred-eighth-batch-review.md) records another 50 screening decisions: 11 accepted sites, 26 deferred candidates and 13 overlaps excluded. The record total increases by 11, not 50.

The [fifth 50-candidate review](catalogue/one-hundred-ninth-batch-review.md) records another 50 screening decisions: 20 accepted sites, 19 deferred candidates and 11 overlaps excluded. The record total increases by 20, not 50.

The [sixth 50-candidate review](catalogue/one-hundred-tenth-batch-review.md) records 29 accepted Japanese flight venues, 15 deferred candidates and six existing-site overlaps. The record total increases by 29.

The [seventh 50-candidate review](catalogue/one-hundred-eleventh-batch-review.md) adds 15 locations, defers 33 leads and resolves two overlaps.

The [eighth 50-candidate review](catalogue/one-hundred-twelfth-batch-review.md) adds 24 locations, defers 24 leads and resolves two overlaps.

The [batch 113 review](catalogue/one-hundred-thirteenth-batch-review.md) adds 27 locations (four historical), defers 21 leads and resolves two overlaps from 50 candidates.

The [batch 114 review](catalogue/one-hundred-fourteenth-batch-review.md) adds 31 locations, defers 17 leads and resolves two overlaps from 50 candidates. Seasonal limits and suspended facilities remain explicit.

The [batch 115 review](catalogue/one-hundred-fifteenth-batch-review.md) adds 30 locations and defers 20 leads from 50 reviews. Two former venues are historical; three suspended offerings have unknown current status.

The [batch 116 review](catalogue/one-hundred-sixteenth-batch-review.md) adds 18 facilities and defers 32 candidates from 50 reviews. Kitakyushu Kawachi is suspended with unknown current status.

The [batch 117 review](catalogue/one-hundred-seventeenth-batch-review.md) adds 36 facilities and defers 14 candidates from 50 reviews. Huwei is recorded as historical following its reported closure.

The [batch 118 review](catalogue/one-hundred-eighteenth-batch-review.md) adds 30 Korean facilities and defers 20 candidates from 50 reviews. Two former Boeun examination venues are historical.

The [batch 119 review](catalogue/one-hundred-nineteenth-batch-review.md) adds 25 Southeast Asian facilities and defers 25 candidates from 50 reviews. Four SAFRA venues are marked as trials.

The [batch 120 review](catalogue/one-hundred-twentieth-batch-review.md) adds 29 facilities, defers 17 candidates and excludes four overlaps from 50 reviews.

The [batch 121 review](catalogue/one-hundred-twenty-first-batch-review.md) adds 36 facilities, defers nine candidates and excludes five overlaps from 50 reviews.

The [batch 122 review](catalogue/one-hundred-twenty-second-batch-review.md) adds 12 facilities, defers 36 candidates and excludes two overlaps from 50 reviews.

The [batch 123 review](catalogue/one-hundred-twenty-third-batch-review.md) adds 26 facilities, defers 19 candidates and excludes five overlaps from 50 reviews.

The [batch 124 review](catalogue/one-hundred-twenty-fourth-batch-review.md) adds 26 facilities, defers 23 candidates and excludes one overlap from 50 reviews.

Each new record requires a named location or clearly scoped network, a traceable public source, its publication date when displayed, source-reading date, source type, reported status, duplicate-review notes and an explicitly editorial approximate locality point. Do not count delivery destinations, all hospitals in a network, or vendor fleet totals as individual sites without separate evidence. Source reading is not an operational inspection.

Add reviewed records to `catalogue/additions.json`, then run `python3 checks/catalogue-expansion.py`. The build rejects duplicate IDs/entities, duplicate names and localities, missing review notes, unsafe URLs and invalid coordinates. Review near-duplicates manually; string checks cannot establish real-world identity. Government, hospital, operator, research and attributed original news reports support the reviewed batches. Undated ministry pages remain labelled undated.

The original source and export snapshot is available under `/data/original-50/` in the build. Historic audit/backlog downloads outside the current projects/countries/quality exports still describe that original snapshot; their 500 planned review tasks are not newly completed research. Existing source-regression suites retain their original fixture scope. The separate expansion suite tests the actual built 816-record catalogue and its generated pages in desktop/mobile Chromium.

Vercel builds from the repository root using `vercel.json`; output is `dist/`. Deploying only `src/` will omit additions. The build is deterministic and does not contact source websites or geocode during deployment.

The 29 October 2026 review also corrects four Australian Wing records to historical, with linked cessation evidence and an exact before/after correction ledger. The other 246 prior records remain unchanged.

### Catalogue browser coverage

Browser verification derives its routes from the built catalogue: every passport plus the atlas, directory, countries, operators and technologies views. Four independent CI shards cover each route once at desktop and mobile sizes. At 1,054 records this is 1,059 routes and 2,118 journeys; new records join automatically. Every shard must pass. Only a pending probe may retry, with three attempts maximum; assertion failures, missing results, browser errors and missing screenshots fail the check. Browser profiles and the temporary HTTP server are cleaned up after execution.

Run `bash checks/catalogue-expansion-browser-smoke.sh` for the full local browser suite, or set `CATALOGUE_SHARD_INDEX` (zero-based) and `CATALOGUE_SHARD_COUNT` to run one partition. Run `python3 checks/catalogue-browser-runner-test.py` after building to verify partition coverage and failure handling without Chromium.
