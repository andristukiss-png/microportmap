# Date boundary checks

Run `node checks/date-boundaries-500.cjs` from the bundle root. Ten sequences across 50 selected calendar dates in 2024–2028 produce 500 assertions against the real source-date-validation script in a controlled DOM/VM. Calendar fixtures use explicit local date getters and include leap-year February, month ends and year ends. They do not emulate actual device timezones.

All 500 passed. Current and past dates remain accepted, future dates block submit, optional empty values clear errors, focus/visibility refresh the maximum, and a backward calendar change revalidates on submission. No app source changes or deployment. All research records and colors are preserved. Mobile visuals, online tiles and independent research remain unverified.
