# 500 coordinate and comparison-state checks

Run `node checks/map-state-500.cjs` from bundle root; no dependencies or network required. Uses real application scripts with controlled DOM/VM mocks.

For each of the original 50 project contexts, tests cover boolean latitude, numeric-string latitude, array longitude, missing coordinates, numeric zero/projection boundaries, oversized selections, repeated/unknown selections, blocked-history selection retention, final-selection clear and latest filters despite failed history writes.

Initial run: 350 passed, 150 failed. The atlas converted booleans, numeric strings and single-value arrays into numeric map points. Atlas now accepts finite number-typed coordinates only, matching existing quality/comparison behavior. Valid zero/boundary values still work. Records with invalid coordinates remain accessible without pins.

Final run: 500 passed, zero failures. Before/after outcomes, ledger and status are alongside this file. Original data/coordinates were never changed. These are local behavioral checks, not production fault injection, live device tests or independent research verification.
