# Export boundary checks

Run `node checks/export-boundaries-500.cjs` from the bundle root. Ten isolated equipment-text fixtures per original project produce 500 checks against real directory and comparison scripts in controlled DOM/VM harnesses. CSV is parsed with quoted-newline support and compared by column name, preserving the existing format-specific column orders. Formula-like cells receive the existing apostrophe guard; JSON must preserve the exact unmodified fixture. MIME types and temporary anchor cleanup are also checked.

All 500 passed. An initial test assumption about identical column order was corrected; no application defect or source change was found. Export/directory/comparison and preservation/navigation suites pass. No deployment. Actual mobile visuals, spreadsheet application rendering, online tiles and independent research remain unverified.
