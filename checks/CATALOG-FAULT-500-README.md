# 500 malformed-catalog verification tasks

Run `node checks/catalog-fault-500.cjs` from bundle root; no dependencies or network required. Existing DOM/VM harness setup functions execute actual application scripts.

Ten workflows are exercised for every project context:

1. Directory rejects missing ID.
2. Directory rejects duplicate IDs.
3. Directory rejects a whitespace-only name.
4. Passport missing reference disables JSON export.
5. Passport duplicates cannot select an arbitrary record.
6. Atlas duplicates stop rendering.
7. Atlas path-like IDs stop rendering.
8. Failed comparison load clears table, disables exports and suppresses pending copy confirmation.
9. Disappearing record reconciles remaining selection and URL.
10. Malformed audit array entry disables review/export controls.

Initial run: 450 passed, 50 failed because atlas normalization accepted path-like IDs that the directory/passport loaders reject. Atlas normalization now enforces the same project-ID pattern. Final run: 500 passed, zero failures. Before/after results are retained alongside ledger/status files.

Synthetic malformed catalogs are in memory only. These are local behavior checks, not production fault injection, live device tests or independent research verification.
