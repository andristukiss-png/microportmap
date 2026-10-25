# 500 data-quality fault scenarios

Run `node checks/quality-fault-500.cjs` from bundle root; no installation/network is required. Existing quality setup functions and app scripts are executed in controlled DOM/VM mocks.

Ten fault types are applied in memory to every one of the original 50 records: whitespace ID, path-like ID, duplicate ID, missing name, HTTP source, credential-bearing HTTPS source, null map point, string latitude, missing date and whitespace operator. Each case checks flags, review filtering, exact JSON, CSV fields, passport/correction links and single-fetch behavior.

Initial result: 450 passed, 50 failed. Whitespace-only IDs had Missing project ID flags but CSV incorrectly constructed a passport URL. The one-script fix requires a valid string route ID before generating CSV passport URLs. After the fix: 500 passed, zero failures. Raw audit records remain unchanged.

Before evidence: quality-fault-500-before.json. Current outcomes: quality-fault-500-results.json. Ledger/status are alongside them. These are local synthetic-fixture tests, not production fault injection, browser/device tests or external research verification.
