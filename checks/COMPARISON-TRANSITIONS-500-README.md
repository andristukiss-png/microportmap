# Comparison transition sequences

Run `node checks/comparison-transitions-500.cjs` from the bundle root. Ten explicit action/expected-state sequences for each of 50 starting projects generate 500 checks against the real comparison script in the existing controlled DOM/VM. Each sequence has four to six transitions. After each transition, nonempty selections must export exact original records in the expected order and match URL/button states. Empty and loading states must disable downloads.

All 500 passed; no application source changes or deployment. Comparison and sharing regression suites plus preservation/navigation checks pass. These are local behavioral tests, not live device or research verification.
