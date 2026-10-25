# Second 500-task verification batch

Run `node checks/advanced-500.cjs` from the bundle root. No installation or network is required. Existing harness setup functions remain in checks/directory.cjs, passport.cjs, compare.cjs and atlas.cjs.

This batch exercises ten new workflows against every original record:

1. Region/type intersection and complete name ordering.
2. Regional country sorting with name tie-breaks.
3. Report-year slice with recent-sort tie-breaks.
4. Uppercase, accent-folded search and surrounding whitespace.
5. Stale clipboard completion after changing the view.
6. Synthetic CSV formula prefix, quotes, commas, multiline and Unicode text.
7. Synthetic HTML markup escaping with exact JSON preservation.
8. Null map coordinates with unaffected comparison export.
9. Clipboard denial and clean canonical fallback.
10. JSON object-URL allocation failure and subsequent successful retry.

Synthetic records are in-memory fixtures. Production data is never modified. These are local behavior tests, not browser/device checks or external research verification.

All 500 outcomes, including failures, are written to advanced-500-results.json; any failure produces a nonzero exit code. The previous next-500.cjs batch and results are retained separately. This batch does not claim 500 independent product features.
