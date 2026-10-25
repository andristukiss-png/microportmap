# MicroportMap

Interactive, source-linked research directory of drone infrastructure worldwide.

Live site: https://microportmap.com

## Project structure

- `src/`: static website, shared navigation, atlas, directory, project passports and original research data.
- `checks/`: dependency-free Python and Node.js checks, reproducible fixtures, results and task ledgers.
- `baseline-round*.json` and `manifest.json`: preservation baselines.
- `development-report.html`: implementation and verification history.

The site has no framework, dependency installation or build step. Serve `src/` as the web root. The current production site is hosted on Vercel; publishing this repository does not configure automatic deployments.

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

## Research limits

The 50 source-linked records and approximate map points are research references. They do not establish current operations, public access or flight permission. Independent research accuracy and actual mobile/device visuals remain unverified. Correction reports are prepared locally; no submission inbox is connected.
