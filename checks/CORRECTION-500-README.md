# 500 correction/evidence verification tasks

Run `node checks/correction-500.cjs` from the bundle root; no install or network is required. Existing behavior/report harness setup and actual application scripts must remain available.

Each of the 50 project references is checked through ten workflows:

1. Resolved correction identity and original metadata/category.
2. User title/category changes during asynchronous lookup.
3. Unknown requested reference remains unresolved.
4. Duplicate reference rejection.
5. Network failure and retry preserve user name/city.
6. Timeout recovery and successful retry.
7. Resolved schema 1.1 report preserves original context.
8. Unresolved report never becomes a new suggestion or invented passport.
9. Private-IP evidence blocks form preparation.
10. Original cited HTTPS URL passes format checks, without an accuracy claim.

All reports remain locally prepared and unsubmitted. Synthetic references and failures exist only in controlled mocks. No source-site requests or production data changes occur.

All 500 outcomes are written to correction-500-results.json. Any failed task produces a nonzero exit code. These are local behavioral tests, not live browser/device tests or independent research checks.
