# 500 Passport Quick Navigation Actions

**Ten navigation controls on each of the 50 original research passports = 500 real project-specific actions.** This small collapsible navigation replaces neither the existing bottom nav nor the original passport. It makes the increasingly extensive source research tools discoverable without adding a full-screen panel or floating buttons.

| Shortcut | Destination |
|---|---|
| `overview` | Open the published project overview |
| `facts` | Jump to the original reported project facts |
| `related` | Jump to source connections and related research |
| `citation` | Expand the original citation and research brief toolkit |
| `inspector` | Expand the source-qualified field inspector |
| `comparison` | Expand the evidence comparison |
| `geography` | Expand the approximate location context |
| `review` | Jump to the private review workspace |
| `saved` | Open the browser-local saved research drawer |
| `country` | Open the directory filtered to the original reported country |

Source panels are opened when selected; dynamic sections are waited for briefly with a user-visible unavailable message if they do not load. Links to the country directory use original published values. Saved research opens the already-existing browser-local drawer. The shortcuts do not change the data or require an account.

Files added: `src/passport-quick-navigation.js`, additive shared CSS and a one-line passport-only script registration. Every original HTML file, all 50 research objects and existing page functions stay intact.

Verification: `node checks/passport-quick-nav-500.cjs` exercises 500 user actions against original source records, `python3 checks/passport-quick-nav-500-audit.py` checks data/HTML preservation and ledger, `bash checks/passport-quick-nav-browser-smoke.sh` checks responsive desktop/mobile rendering and actual navigation flows. This release does not verify accuracy of third-party claims, current operations or flight permission.
