# MicroportMap handoff — 25 October 2026

Continue development of MicroportMap.com. The user authorizes routine fixes and safe Vercel deployments without repeated approval. Preserve all 50 original research records and existing desktop/mobile colors. Use Cloud Browser for live UI tests. Report implementation, verification and unverified items separately. Do not spawn agents without explicit authorization.

## Current state

`src/` contains 140 source files. Static HTML/JS site with no build/install command or framework. No connected Git repository was discovered. All original data files, CSS, embedded styles and 50 passport HTML files remain unchanged. Added CSS files only provide layout rules or reuse existing palette values.

Latest production deployment: `dpl_EGMn5Neb21NBS5fmtX4Mhxn2hdPe`, hostname `microportmap-qap6azyvh-football-planet.vercel.app`, reported READY and assigned public aliases including microportmap.com.

Vercel team `team_hi6YkEW8L8iAzNzWSWBeJq5U` (football-planet), project `prj_0se7rYd7NsDFOFZOxwbiXB7k4LZP` (microportmap). Deploy exact files relative to src, target production, framework/build/install/outputDirectory null. Use Vercel connector. Read files as base64 in 25-file chunks to avoid output truncation. Current source count must be computed dynamically. Vercel tree returns source SHA1s, except five deep Leaflet PNG metadata entries are truncated; compare those bytes from the public site.

## Latest interrupted batch

The user asked for another 50 tasks, then requested this ZIP before the batch was finished. DO NOT claim the latest batch has 50 completed tasks. Previous batches have explicit implementation/verification ledgers.

Latest deployed changes:
- Comparison state survives browser history write failures.
- Selection is reconciled when a record disappears from the current dataset.
- Invalid selection feedback is visible and persists across repeated ready events.
- Comparison help is an accessible status/focus target.
- Unavailable comparison tables are cleared; stale hidden anchors recover to results.
- Date validation refreshes on field focus, window focus and tab visibility after midnight.
- Branded 404.html reuses existing colors and links to current directory/atlas/data/correction paths.
- Sitemap lists all 71 canonical pages and excludes 404, without invented modification dates.
- Help page documents current tools.

Local tests passed before deploy. Browser verified branded missing-page UI, recovery to 50-record directory, and invalid comparison feedback/focus. A combined final verification tool call was interrupted: rerun final source hash/runtime scan and verify HTTP status 404/noindex plus published sitemap bytes. No fresh mobile/device visual check. No submission inbox. External research accuracy, current operations, permissions and source dates have not been independently researched.

## Reproducible checks

Run `python checks/validate.py`, `python checks/map-assets.py`, `python checks/navigation-round12.py`, `python checks/site-recovery.py`; run Node suites behavior, directory, atlas, export, report, quality, passport, legacy-browse, compare and date-validation (`node checks/NAME.cjs`). These need no dependency install. Node VM mocks are controlled tests, not browser tests. Browser use must use Cloud Browser tools; refresh its documentation and locate the existing tab on a new chat. Previous handles may not persist.

## Existing features

Atlas supports shared accent-insensitive search, category shortcuts, project deep links, accessible drawer and working Leaflet stylesheet/assets. Detailed OpenStreetMap layer works; switching back offline caps regional zoom. Directory supports country/type/region/year filters, URL state, CSV/JSON, shared views and three-record comparison with exact original JSON. Data quality exposes 28 explicitly unverified date labels, filtered review queue and scoped CSV/JSON audits. Correction report schema 1.1 preserves resolved/unresolved context and remains local-only. Passport JSON preserves the exact individual record.

## Persistence and report

`development-report.html` and `checks/release.json` describe latest state; prior task ledgers preserve history. `baseline-round15.json` is the pre-latest-batch hash baseline. `manifest.json` preserves original deployment source hashes. `checks/build-release-report.py` rebuilds report and ZIP. This handoff is included automatically by the updated packager.

Known source bundle Library ID: `libfile_a560b920c1d081918f3c84fccaba1eb0`. Replace this same file rather than creating duplicates; use the latest version returned with this chat upload. No Library search/list is authorized. Screenshots are excluded from ZIP and Library.

## Continuation audit — 25 October 2026

The user supplied microportmap-development-2026-10-24(1).zip in this conversation. Its replacement target is the attachment ID `libfile_4e3c7e82fc94819187742907cfc87540`, not the older bundle ID above. No Library search or list was used.

Completed **50 verification tasks**, one production passport audit per original record, with detailed assertions in `checks/live-integrity-results.json` and ledger/status alongside it. This is not 50 implementation tasks and does not retroactively complete the prior interrupted implementation ledger.

No src/ files changed and no new deployment was needed. Existing deployment rechecked READY. All 139 normal served source routes returned 200 and match SHA-256 bytes; missing route returns 404 with noindex and exact 404.html bytes. All five Leaflet image assets match. All 135 hashes available in Vercel source tree match; see deployed-tree-comparison.json.

Fixed navigation-round12.py's missing old ZIP dependency using checks/embedded-style-baseline.json captured from the actual handoff archive. All existing suites, preservation checks and 88 JS syntax checks passed. Cloud Browser observed restored comparison, loaded Kiel passport, enabled export control, copy feedback and branded missing page. Browser logs contain extension metadata errors; no site-origin errors in checked views. Mobile/device visuals, external evidence accuracy and submission delivery remain unverified/unconnected.

Run the existing checks from the bundle root. `python checks/live-integrity.py` performs fresh HTTP reads of the public site with six concurrent requests and writes a new timestamped result. It does not contact external source-report domains or change production.

## Latest release: passport comparison handoff

Current production deployment is `dpl_4K71mrFBNmvPwrboERVR6Avuz1vB`, hostname `microportmap-e2kdha1td-football-planet.vercel.app`, READY with the existing public aliases. Supersedes the older deployment IDs above.

Added one feature: Compare this project link in the shared passport action group (`src/project-connect.js`). It routes to `/directory/?compare=<id>#project-comparison`, remains available while data loads/fails, and names the loaded project accessibly. All 50 per-project link/export cases pass in checks/passport.cjs. Ledger/result/release evidence files use the passport-comparison prefix.

Only project-connect.js changed against baseline-round16.json. All records, data files, existing CSS, embedded colors and static passport HTML are unchanged. Targeted passport/comparison suites, 34 preservation checks, navigation and sitemap/recovery checks pass. All 135 current deployment-tree hashes match. Exact public script/data bytes match. Live Cloud Browser verified Kiel passport → Kiel comparison, then adding EnBW and URL state. No site-origin browser errors in these checked views; browser extension metadata errors occurred.

Fresh mobile/device visuals, external research accuracy and submission delivery remain unverified/unconnected. This is one implemented feature with 50 verification cases, not a claim of 50 separate new features. The previous 140-file HTTP audit belongs to the previous unchanged-image release and retains its timestamp.

## Latest release: preserve comparison through passport visits

Current deployment: `dpl_8Cf6s9KsHBH7659kw2f2u1fRVjsK`, hostname `microportmap-qgb66pif2-football-planet.vercel.app`, READY with existing public aliases. Supersedes all prior IDs above.

Comparison table passport links include `?compare=<selected IDs>`. The passport's existing compare action becomes Return to comparison (N) for a valid group containing that passport. It preserves the group through a visit. Plain passports still start a one-project comparison; canonical sharing strips query context. Rejects malformed/duplicate/oversized/over-three/unrelated context. Return remains available during dataset failure.

Only project-connect.js and directory-compare.js changed against baseline-round17.json; original 50 records, data, static passport pages, existing CSS/colors untouched. Passport and comparison suites pass with 50 contextual-return cases plus malformed URL/loading/canonical-copy tests. Preservation/navigation/sitemap checks and script syntax pass. Current 135 available deployment hashes match; exact public bytes of both scripts and original dataset match.

Live keyboard flow verified: Kiel + EnBW comparison → Kiel table link → Return to comparison (2) → Enter → both selections restored and comparison heading focused. Evidence: checks/comparison-return-results.json, comparison-return-ledger.json, comparison-return-release.json and deployed-tree-round17-comparison.json.

One feature with 50 per-project verification cases, not 50 new independent features. Mobile/device visuals, external research and submission inbox remain unverified/unconnected. Current replacement target remains libfile_4e3c7e82fc94819187742907cfc87540; prior save returned version 2 before this release save.

## Latest release: preserve filters on passport comparison return

Current deployment `dpl_CCfSxWWtdQDbQMJuRhwyiY8NmQCM`, hostname `microportmap-a3g380wau-football-planet.vercel.app`, READY with existing public aliases; supersedes all earlier IDs above.

Comparison-table passport URLs and passport return links now carry supported directory q/country/type/region/year/sort values. Directory render events supply viewSearch from normalized current controls so links stay current with blocked/late history writes. Only whitelisted keys forward; canonical passport copying stays clean. Comparison selections remain independent of visible filter matches.

Only project-connect.js, directory-compare.js and directory.js changed against baseline-round18.json. All 50 research records, data files, static passports, CSS and colors unchanged. Passport/comparison/directory suites, changed-script syntax, 34 preservation checks, navigation and sitemap/recovery checks pass. Fifty per-project filter-return cases plus query escaping, arbitrary-key exclusion and blocked-history tests pass.

Live keyboard round trip verified: Germany, recent sorting and Kiel/EnBW selected → Kiel comparison-table passport → Enter return → Germany/recent controls restored, 3 of 50 records and 2 selections retained. All 135 current available deployment hashes match; exact public bytes of three scripts and projects.json match. See checks/comparison-filter-return-* and deployed-tree-round18-comparison.json.

Fresh mobile/device visuals, external research and submission inbox remain unverified/unconnected. One feature with 50 verification cases, not 50 independent implementations. Replacement target remains libfile_4e3c7e82fc94819187742907cfc87540; prior version was 3 before this release save.

## Latest release: compare related project pairs

Current deployment `dpl_7nQfsWddTPdg1kwhEpSvGBwyT8fZ`, hostname `microportmap-3abqtx7es-football-planet.vercel.app`, READY with existing aliases. Supersedes earlier IDs above.

One shared feature added: beside each related project suggestion, Compare these two projects links current passport + related project directly. Preserves directory filters and has an accessible name identifying both projects. It starts the named pair; the independent Return to comparison action still preserves the prior group. Existing individual passport links remain.

Completed the requested 50-item ledger as **50 per-project verification tasks**, not 50 independent feature implementations. Covers all 296 suggested pair links and exact two-record JSON exports plus all 50 unchanged single-record exports. Evidence: checks/related-pair-ledger.json, related-pair-results.json, related-pair-export-results.json and related-pair-status.json.

Run node checks/passport.cjs before node checks/compare.cjs to refresh pair fixtures/results. Both pass. Script syntax, 34 preservation checks, navigation and sitemap/recovery checks pass. Only project-connect.js changed against baseline-round19.json; records, static passport HTML, CSS and colors unchanged. All current 135 available deployment hashes match. Exact public script/dataset bytes match.

Live Enter-key test: Kiel passport → compare Kiel/Würzburg → correct pair, Germany and recent filters retained, heading focused. Mobile/device visuals, external research and submission inbox remain unverified/unconnected. Replacement target remains libfile_4e3c7e82fc94819187742907cfc87540; prior version 4 before this save.

## Latest release: comparison-to-atlas links

Current deployment `dpl_DwoKtgsaXhLh2qjVM2ErtwuDdMdR`, hostname `microportmap-dvhcp0j4x-football-planet.vercel.app`, READY with existing aliases. Supersedes all earlier IDs above.

Added Approximate map reference comparison row. A record with finite numeric lat/lng inside ±85.05112878 / ±180 has a named Show on atlas link (`/?project=<id>#atlas`). Unusable coordinates show Map reference unavailable. No data/coordinates inferred or modified; the existing limitations remain visible.

Completed 50 per-project verification tasks, not 50 independent feature implementations. Evidence: checks/comparison-map-results.json, comparison-map-atlas-results.json, comparison-map-ledger.json, comparison-map-status.json. Tests cover every correct project URL, original exact JSON, atlas drawer and close-control focus, plus null/missing/string/boolean/nonfinite/out-of-range inputs and accepted zero/boundary coordinates.

Run node checks/passport.cjs → node checks/compare.cjs → node checks/atlas.cjs in that order to refresh test fixtures/results. All pass, including previous 296 pair exports. Syntax, 34 preservation checks, navigation and sitemap/recovery checks pass. Only directory-compare.js changed against baseline-round20.json. Data, 50 static passports, CSS and colors unchanged. Current 135 exposed deployment hashes match; exact public script/data bytes match.

Live keyboard map link opens Kiel drawer with close control focused. Browser Back restores two-project comparison plus Germany/recent filters. Mobile/device visuals, optional detailed geography, external research and submission inbox remain unverified/unconnected. Replacement ID libfile_4e3c7e82fc94819187742907cfc87540; prior version 5 before this save.

## Latest continuation: 500 verification tasks, no production change

Completed exactly 500 verification tasks with zero failures: ten distinct workflows × all 50 original records. No implementation work or new features claimed in this batch. Existing production remains `dpl_DwoKtgsaXhLh2qjVM2ErtwuDdMdR`, hostname `microportmap-dvhcp0j4x-football-planet.vercel.app`, rechecked READY. No new deployment.

Run `node checks/next-500.cjs` from bundle root. Reads existing harness setups and executes real app scripts in controlled DOM/VM mocks. Covers directory scoped views, JSON/CSV, passport exports/sharing, pair JSON/CSV, three-project filtered return, atlas Escape/focus recovery and directory error/retry/export recovery. See checks/NEXT-500-README.md. Results include all 500 individual records and failure details; nonzero exit if any fail.

Evidence: checks/next-500-results.json, next-500-ledger.json, next-500-status.json, next-500-preservation.json and next-500-deployed-tree.json. All existing ten Node suites and four Python audits pass. Current 135 exposed deployment hashes match. All 140 source files match the previous saved bundle exactly. Data, records, static passports and all colors unchanged.

This is not a 500-browser-test claim. Fresh mobile/device visuals, optional detailed online geography, external research and submission inbox remain unverified/unconnected. Replacement ID libfile_4e3c7e82fc94819187742907cfc87540; prior version 6 before this save.

## Latest continuation: second, distinct 500-task batch

Completed 500 additional local behavioral verification tasks, zero failures. Ten new workflows × 50 projects; names/scopes disjoint from the prior next-500 batch. No implementation work, production code changes or new deployment. Existing `dpl_DwoKtgsaXhLh2qjVM2ErtwuDdMdR` rechecked READY.

Run `node checks/advanced-500.cjs`. Covers filter intersections/sort tie-breaks, year slices, accent/case search, stale clipboard feedback, adversarial CSV fields, HTML escaping/lossless JSON, null coordinates, clipboard fallback and JSON URL-allocation failure/recovery. Synthetic fixtures are local/in-memory only. Source preservation compares all 140 files to the previous saved bundle; all unchanged. Prior deployment hashes refer to the same immutable deployment.

Evidence: advanced-500-results.json, advanced-500-ledger.json, advanced-500-status.json, advanced-500-preservation.json and ADVANCED-500-README.md. Earlier next-500 harness/results are retained. Neither batch is a 500-live-browser/device-test claim. Mobile/device visuals, detailed online geography, external research and submission inbox remain unverified/unconnected.

Replacement ID libfile_4e3c7e82fc94819187742907cfc87540; prior version 7 before this save.

## Latest release: 500 quality fault tasks and CSV ID-link fix

Current deployment `dpl_GgMjjjfBGseuRBNFesPEYFtYoVMh`, hostname `microportmap-3bssxe3xc-football-planet.vercel.app`, READY with existing aliases. Supersedes all earlier deployment IDs.

Completed 500 local data-quality fault verification tasks (10 types × 50 projects). Before: 450 pass / 50 fail. Found whitespace-only project IDs correctly flagged as missing but incorrectly converted into CSV passport URLs. Fixed research-audit-export.js to require a string ID matching /^[a-z0-9-]+$/ plus existing invalid/duplicate guards. JSON/raw records remain preserved. After: 500 pass / zero fail.

Run node checks/quality-fault-500.cjs. Evidence: quality-fault-500-before.json, quality-fault-500-results.json, quality-fault-500-ledger.json, quality-fault-500-status.json, QUALITY-FAULT-500-README.md. All synthetic inputs stay in local VM mocks; production records never altered. These are 500 verification tasks plus one implementation fix, not 500 independent features.

Existing quality suite, syntax, 34 preservation checks, navigation and sitemap/recovery checks pass. Only research-audit-export.js changed against baseline-round21.json. All data, records, static passport HTML, CSS and colors unchanged. Current 135 exposed deployment hashes match; exact public script/dataset bytes match. Live Germany review CSV request still reports two records. Malformed IDs were reproduced locally, not injected into production.

Mobile/device visuals, optional detailed geography, external research and submission inbox remain unverified/unconnected. Replacement ID libfile_4e3c7e82fc94819187742907cfc87540; prior version 8 before this save.

## Latest continuation: 500 correction/evidence tasks

Completed 500 local verification tasks with zero failures (10 workflows × 50 project references). No implementation change or new deployment. Current deployment remains `dpl_GgMjjjfBGseuRBNFesPEYFtYoVMh`, hostname `microportmap-3bssxe3xc-football-planet.vercel.app`, rechecked READY.

Run node checks/correction-500.cjs. Covers original metadata/category, user edits during lookup, unknown/duplicate references, network/timeout retries, resolved/unresolved schema 1.1 report identity, invalid private-IP evidence rejection and cited public-HTTPS format validation. All reports explicitly remain locally prepared/unsubmitted. No source-site requests or production data changes.

Evidence: correction-500-results.json, correction-500-ledger.json, correction-500-status.json, correction-500-preservation.json, CORRECTION-500-README.md. Existing behavior/report/date-validation suites also pass. All 140 source files match previous bundle exactly, retaining all records, data, passports, CSS and colors. This is not 500 product features or live browser tests.

Mobile/device visuals, optional online geography, external research and submission inbox remain unverified/unconnected. Replacement ID libfile_4e3c7e82fc94819187742907cfc87540; prior version 9 before this save.

## Latest release: 500 catalog fault tasks and atlas ID validation

Current deployment `dpl_JCwCCumnVDdQpcp6XFvJdx23Qpmn`, hostname `microportmap-nc1vw4etv-football-planet.vercel.app`, READY with existing aliases. Supersedes all earlier IDs above.

Completed 500 local malformed-catalog verification tasks (10 workflows × 50 project contexts). Before: 450 pass / 50 fail. Atlas normalization accepted path-like IDs despite directory/passport rejection. Fixed src/site-redesign.js normalization to require /^[a-z0-9-]+$/. After: 500 pass / zero fail. These are 500 verification tasks plus one implementation fix, not 500 features.

Run node checks/catalog-fault-500.cjs. Evidence: catalog-fault-500-before.json, catalog-fault-500-results.json, catalog-fault-500-ledger.json, catalog-fault-500-status.json, CATALOG-FAULT-500-README.md. Covers rejected directory/passport/atlas catalogs, stale comparison copy/export suppression, selection removal and malformed quality-audit records. All faults use local in-memory mocks; no production data injection.

Atlas/directory/passport/quality suites, syntax, 34 preservation checks, map assets, navigation and sitemap/recovery audits pass. Only site-redesign.js changed against baseline-round22.json. Data, all 50 records, static passport HTML, existing CSS/colors unchanged. Current 135 exposed deployment hashes match; exact public script/data bytes match. Live Kiel drawer opens with close focus; Escape dismisses and atlas shows 50/50 records.

Mobile/device visuals, optional detailed geography, external research and submission inbox remain unverified/unconnected. Replacement ID libfile_4e3c7e82fc94819187742907cfc87540; prior version 10 before this save.

## Latest release: 500 map/state tasks and strict coordinate types

Current deployment `dpl_db4BD4FE7LsBgaQQJRrdDseWY3bV`, hostname `microportmap-pt6c6wxk1-football-planet.vercel.app`, READY with existing aliases. Supersedes all earlier IDs above.

Completed 500 local coordinate/comparison-state verification tasks (10 workflows × 50 contexts). Before: 350 pass / 150 fail. Atlas coords helper coerced booleans, numeric strings and arrays into points. Changed site-redesign.js coords to require number-typed finite lat/lng inside map bounds, matching quality/comparison validators. Valid zero/boundaries accepted; invalid-coordinate records remain accessible in list. After: 500 pass / zero fail.

Run node checks/map-state-500.cjs. Evidence: map-state-500-before.json, map-state-500-results.json, map-state-500-ledger.json, map-state-500-status.json and MAP-STATE-500-README.md. Comparison checks include limits/order, duplicate/unknown recovery, blocked history, final clear/focus and latest filter context. All fixtures local; no production fault injection.

Atlas/comparison/quality suites, syntax, 34 preservation checks, map assets, navigation and sitemap/recovery audits pass. Only site-redesign.js changed against baseline-round23.json. All original records, coordinates, data, static passport HTML, CSS/colors unchanged. Current 135 exposed deployment hashes match; exact public script/data bytes match. Live atlas reports 50 mapped locations/50 records, 50 projects/10 pins and 50 project buttons.

Mobile/device visuals, optional detailed geography, external research and submission inbox remain unverified/unconnected. Replacement ID libfile_4e3c7e82fc94819187742907cfc87540; prior version 11 before this save.

## Latest release: 500 atlas view-state tasks and project-focus zoom cap

Current deployment `dpl_5nWD1GEDTaMa7VT5CRn3ALuKELmk`, hostname `microportmap-9hqgwtkwn-football-planet.vercel.app`, READY with existing aliases. Supersedes all earlier IDs above.

Completed 500 local atlas view-state verification tasks (10 workflows × 50 contexts). Before: 400 pass / 100 fail. Opening a project forced offline schematic zoom beyond the filter-fit cap. In site-redesign.js openProject now uses zoom 3 offline; detailed mode retains Math.max(currentZoom,5). After: 500 pass / zero fail.

Run node checks/atlas-view-500.cjs. Evidence: atlas-view-500-before.json, atlas-view-500-results.json, atlas-view-500-ledger.json, atlas-view-500-status.json, ATLAS-VIEW-500-README.md. Covers missing coordinates, reduced motion, inert-state preservation, history replacement, marker accessibility and failed deep-link retry with filters. Exact zoom targets were verified in mock maps, not by reading hidden live map state.

Atlas suite, syntax, 34 preservation checks, map assets, navigation and sitemap/recovery audits pass. Only site-redesign.js changed against baseline-round24.json. Data, all 50 records/coordinates, static passport HTML and CSS/colors unchanged. Current 135 exposed deployment hashes match; exact public script/data bytes match. Live offline-mode smoke: Kiel drawer, close focus, Escape, 50/50 records.

Next useful audit target: clustered marker expansion has separate zoom logic in renderPins and was not covered by this batch. Mobile/device visuals, live detailed geography, external research and submission inbox remain unverified/unconnected. Replacement ID libfile_4e3c7e82fc94819187742907cfc87540; prior version 12 before this save.

## Latest release: shared persistent lower navigation and internal banners

Current deployment `dpl_DBEBGMXG2qMFnvSdwPyEK9fDWsxs`, hostname `microportmap-z47j0bmmr-football-planet.vercel.app`, READY with existing public aliases. Source file count now 141 (new site-navigation.css). Supersedes earlier deployment IDs above.

User explicitly requested a constant lower navigation panel and internal banners on every page. Implemented statically on all 72 HTML pages: fixed 5-link bar (Atlas/Projects/Tech/Evidence/Explore), four internal discovery banners, and site-topic navigation. Project pages offer next/previous research passports in one 50-project cycle and a country directory banner. No new external destinations, forced navigation, tab traps or JS dependency.

New CSS reuses existing palette and supports 4/2/1 banner columns, safe areas, keyboard skip/focus, current-page states and reduced motion. It hides the redundant home shortcut, raises existing Up button clear of the bar, and sits below the atlas dialog. Original data/coordinates, existing CSS and embedded colors unchanged. HTML intentionally gains navigation; stripping ONLY marked blocks and the shared stylesheet link reproduces prior content exactly. Preservation checks explicitly account for these authorized additions.

Regenerate with python checks/site-navigation.py; audit with python checks/site-navigation-audit.py. Both use checks/site_navigation_support.py and baseline-round25.json. Generator is idempotent. README and status/ledger/results/HTTP evidence use site-navigation prefixes. Baseline25 is immutable; do not replace it with post-navigation HTML. Existing atlas/passport behavior, 34 preservation checks, navigation and sitemap/recovery audits pass.

Local managed preview daemon was unavailable; no replacement server was started. Live desktop QA checked banner Kiel → Network Rail, persistent fixed bar, directory active state, Explore jump, and bar inert isolation/restoration during atlas dialog. All 136 exposed deployment hashes match. Public CSS, Kiel HTML, branded 404 body/status and original data match exact bytes. Actual mobile/device visuals remain unverified, though responsive CSS is included. Existing research/source/inbox limitations remain.

No Git repository is connected. User's earlier push-to-main request could not be completed because repository URL was missing; do not claim a Git push occurred. Current navigation request was deployed through existing Vercel flow. Replacement bundle ID libfile_4e3c7e82fc94819187742907cfc87540; prior version 13 before this save. Screenshots excluded from source/Library bundle.

## Latest discovery verification batch

500/500 local static HTML navigation assertions pass (checks/discovery-500.py). No source changes or deployment. All 72-page audits and atlas/passport regression suites pass. This batch does not establish mobile visuals or live online-map behavior. Latest deployment remains dpl_DBEBGMXG2qMFnvSdwPyEK9fDWsxs; 141 source files. Authorized bundle ID is libfile_4e3c7e82fc94819187742907cfc87540; older IDs above are historical.

## Latest cluster batch

500 controlled cluster checks: 250 before / 500 after; offline cluster cap and reduced motion fixed in site-redesign.js. Production READY: dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz, microportmap-b12dztds2-football-planet.vercel.app. 141 files; all 136 exposed hashes match. Live offline 17-project cluster expands, 9-project chooser opens. Original research records, HTML and colors unchanged. Mobile/device visuals and live online layer remain unverified. No Git push. Bundle current version before this save: 15.

## Latest cluster recovery batch

500/500 local controlled DOM/VM checks pass in cluster-recovery-500.cjs. No source changes or deployment. Existing 136 published source hashes match; all 140 files other than the previous cluster script fix still match the pre-fix snapshot. Regression suites pass. Production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Bundle version before this save: 16. Actual mobile, live online tiles and independent research remain unverified.

## Latest sharing journey batch

500/500 local chained project/compare journey checks pass in sharing-journey-500.cjs. No source change or deployment; production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Comparison/passport suites, navigation, preservation and recovery checks pass. All 136 exposed previous deployment hashes match current source. Bundle version before save: 17. Actual mobile and live online map tiles remain unverified.

## Latest directory recovery batch

500/500 local controlled directory recovery checks pass in directory-recovery-500.cjs. No app source changes or deployment. Directory/export/sharing journey suites, navigation, preservation and recovery checks pass. 136 previous deployment hashes match. Production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Bundle version before save: 18. Actual mobile visuals and live online tiles remain unverified.

## Latest research handoff batch

500/500 local controlled correction/quality journey checks pass in research-handoff-500.cjs. No app source changes or deployment. Report/quality/behavior/correction and navigation/preservation suites pass. Original data, HTML, CSS preserved; 136 earlier deployment hashes match. Production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Bundle version before save: 19. No submission delivery or external research verification.

## Latest site connection batch

500/500 journeys pass in site-journeys-500.cjs, using HTML link fixtures generated by site-journeys-fixtures.py. No app source change or deployment. Navigation, directory, atlas, passport, preservation and recovery regressions pass. All 136 prior deployment hashes match. Production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Bundle version before save: 20. Actual mobile visuals, live online tiles and independent research remain unverified.

## Latest evidence-input boundary batch

500/500 local checks pass in evidence-boundary-500.cjs. No app changes or deployment. Five valid URL transformations and five invalid-to-valid recovery sequences per record. Report/behavior/date/preservation/navigation checks pass. All 136 prior deployment hashes match. Production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Bundle version before save: 21. No external research or actual mobile verification.

## Latest date boundary batch

500/500 local controlled calendar-event checks pass in date-boundaries-500.cjs (50 dates, ten sequences). No app source changes or deployment. Date/report/evidence/navigation/preservation regressions pass. All 136 prior deployment hashes match. Production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Bundle version before save: 22. Actual timezone-device/mobile visuals remain unverified.

## Latest search concordance batch

500/500 cross-surface search and URL restoration journeys pass in search-concordance-500.cjs. No app source changes or deployment. Directory/atlas/navigation/preservation regressions pass; 136 previous deployment hashes match. Production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Bundle version before save: 23. Actual mobile, live online tiles and independent research remain unverified.

## Latest export boundary batch

500/500 local export fixtures pass in export-boundaries-500.cjs. Compare CSV semantically by column name: directory and comparison intentionally differ in column order. No app source changes or deployment. Export/compare/directory/navigation/preservation checks pass; 136 prior deployment hashes match. Production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Bundle version before save: 24. Actual mobile and spreadsheet-app visuals remain unverified.

## Latest comparison transition batch

500/500 selection-state sequences pass in comparison-transitions-500.cjs. Ten sequences per starting project; exact JSON/order/URL/button states verified at each step. No app source changes or deployment. Compare/sharing/preservation/navigation checks pass; 136 previous deployment hashes match. Production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Bundle version before save: 25. Actual mobile visuals, online tiles and independent research remain unverified.

## Latest filter transition batch

500/500 directory filter sequences pass in filter-transitions-500.cjs. Exact record order, URL and JSON metadata checked after every step. No app source changes or deployment. Directory/export/navigation/preservation checks pass; 136 previous deployment hashes match. Production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Bundle version before save: 26. Actual mobile visuals, live online tiles and independent research remain unverified.

## Latest atlas history batch

500/500 controlled popstate sequences pass in atlas-history-500.cjs. No app source changes or deployment. Atlas/search/preservation/navigation regressions pass; 136 previous deployment hashes match. Production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Bundle version before save: 27. Local history events are not live browser back/forward tests; mobile, online tiles and independent research remain unverified.

## Latest review transition batch

500/500 review queue sequences pass in review-transitions-500.cjs. Synthetic three-record fixtures only; exact flags/records/scope checked at every transition. No app source changes or deployment. Quality/research-handoff/navigation/preservation checks pass; 136 previous deployment hashes match. Production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Bundle version before save: 28. Actual mobile, online tiles and independent research remain unverified.

## Latest 2,000-case record-field batch

2,000/2,000 cases pass in record-field-2000.cjs (50 projects × 10 fields × 4 variants). Five export paths per case: directory/comparison CSV and directory/comparison/passport JSON. Synthetic fixtures only. No app source changes or deployment. Directory/compare/passport/export/navigation/recovery/preservation suites pass; 136 previous deployment hashes match. Production remains dpl_5GKteLhbc8vH5Ejm456oyYjWMdWz. Bundle version before save: 29. Actual mobile/spreadsheet visuals, online tiles and independent research remain unverified.
