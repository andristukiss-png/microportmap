# Evidence input boundary checks

Run `node checks/evidence-boundary-500.cjs` from the bundle root. Ten URL transformations for each original record produce 500 local checks against the real evidence-input script. Five accepted cases preserve input; five rejected cases block submit, focus the source field and recover after the original URL is restored. All fixtures stay in the test harness.

All 500 passed. Report, behavior, date-validation, preservation and shared navigation suites also pass. No app source changes or deployment. No external evidence URLs were requested; format acceptance does not establish availability or research accuracy. Actual mobile visuals and online map tiles remain unverified.
