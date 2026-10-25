# Directory filter transition sequences

Run `node checks/filter-transitions-500.cjs` from the bundle root. Ten multi-step sequences for each original project yield 500 cases against the real directory and JSON export scripts in the existing controlled DOM/VM harness. At each transition, independent catalog slicing/sorting defines expected record IDs/order; URL parameters and JSON filter metadata must agree. Nonempty exports must preserve exact original records; empty intersections must give useful feedback.

All 500 passed. No app source changes or deployment. Directory/export/navigation and preservation regressions pass. Actual mobile visuals, live online tiles and independent research remain unverified.
