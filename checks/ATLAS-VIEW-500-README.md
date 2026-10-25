# 500 atlas view-state checks

Run `node checks/atlas-view-500.cjs` from bundle root; no dependencies/network required. Uses actual application scripts with existing controlled DOM/VM setup and mock maps.

Ten workflows for each project cover offline focus from world/stale close-up views, detailed focus from world/close-up views, missing-coordinate drawer access, reduced motion, pre-existing inert background restoration, history project replacement, selected-marker accessibility and failed deep-link retry with country context.

Initial result: 400 passed, 100 failed. Project opening forced the schematic offline atlas above the zoom cap used by filter fitting. Project focus now targets zoom 3 offline, retaining detailed-mode focus behavior. Final result: 500 passed, zero failures.

Mock maps verify exact target zoom. Live smoke checked normal project opening in offline mode and keyboard dismissal; live detailed-map tiles and cluster-expansion zoom are not covered. Original records, coordinates, palettes and CSS were not changed. Before/after results and the 500-item ledger are retained.
