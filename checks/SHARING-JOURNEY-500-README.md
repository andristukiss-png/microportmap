# Sharing journey checks

Run `node checks/sharing-journey-500.cjs` from the bundle root. Ten chained journeys per original project generate 500 recorded checks using the real project-connect and directory-compare scripts in existing controlled DOM/VM harnesses. Journeys pass generated URLs between the scripts and verify exact original records in resulting JSON exports.

All 500 passed. No source changes or deployment. Cases include triple-selection order, all three passport returns, Unicode punctuation filters, unknown query removal, related companion returns, malformed percent encoding, failed-load retry, canonical sharing, loading restoration and middle-selection removal. These are automated local checks, not live browser/device or research verification.
