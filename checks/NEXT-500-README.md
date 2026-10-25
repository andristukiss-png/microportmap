# 500-task verification batch

From the bundle root, run `node checks/next-500.cjs`. No dependencies or network are required.

This runs ten distinct behavioral workflows for each of the 50 original projects:

1. Scoped directory result and six-field URL restoration.
2. Filtered JSON exact record and metadata.
3. Filtered CSV fields, encoding and download cleanup.
4. Passport exact single-record JSON download.
5. Clean canonical sharing from a contextual passport.
6. Ordered pair JSON export.
7. Ordered pair CSV export.
8. Three-project comparison → passport → filtered comparison return.
9. Atlas modal Escape recovery, filters and focus.
10. Directory fetch failure → retry → scoped record/export recovery.

The harness loads setup functions from existing test files and executes the actual application scripts in their controlled DOM/VM environments. It records all 500 outcomes even if some fail and returns a failing exit code when any task fails. Keep the existing test-file setup functions available alongside it.

These are 500 local behavioral verification tasks, not 500 new product features or live browser/device tests. Current deployment source hashes and previous-bundle preservation are separate evidence in `next-500-preservation.json`. No production files or data were changed in this batch.
