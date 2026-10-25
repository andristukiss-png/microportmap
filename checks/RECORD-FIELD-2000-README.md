# Record-field export cases

Run `node checks/record-field-2000.cjs` from the bundle root. Fifty original projects × ten text fields × four isolated variants yield exactly 2,000 cases. Fields: name, where, country, region, infrastructureType, reportedOperator, reportedEquipment, locationPrecision, reportDateLabel, verificationStatus. Variants cover quotes/commas, multiline Unicode, whitespace-prefixed formula text and HTML-like literals.

Each case runs real scripts in controlled DOM/VM harnesses and checks directory/comparison CSV by column name, expected spreadsheet guards, every CSV field, and exact directory/comparison/passport JSON. Temporary anchor cleanup is checked. Fixtures never modify production records.

All 2,000 passed; no application source changes or deployment. Existing directory/comparison/passport/export/navigation/recovery/preservation suites pass. These are automated test cases, not 2,000 implementation changes or live browser/device tests. Actual mobile and spreadsheet-app visuals, online tiles and independent research remain unverified.
