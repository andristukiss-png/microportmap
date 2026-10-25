# Shared lower navigation and discovery banners

Every HTML page includes static markup for a fixed five-link lower bar and four internal discovery banners. No JavaScript is required. The same CSS is cached across pages. Project passports include next/previous project links forming a complete 50-project cycle plus their country directory link.

To regenerate after changing metadata or adding a page:

```
python checks/site-navigation.py
python checks/site-navigation-audit.py
python checks/navigation-round12.py
python checks/validate.py
python checks/site-recovery.py
```

The generator is idempotent. Original page markup, data and styles are preserved. Preservation checks strip only the explicitly marked navigation blocks and stylesheet link before comparing the original HTML hashes; original non-HTML data/style checks remain exact.

The new stylesheet uses the existing palette, accounts for safe areas and the fixed bar's height, hides the redundant old home shortcut, moves the old Up button above the bar, and keeps the bar below the atlas dialog/backdrop. Layouts switch from four to two to one banner column. Keyboard skip links, focus outlines, active-page states and reduced-motion preferences are included.

Local managed preview infrastructure was unavailable. All 72 pages were statically audited; live desktop checks covered passport banner navigation, the fixed bar, directory active state, Explore scrolling and atlas dialog isolation. Actual mobile/device rendering remains unverified. Screenshots are excluded from the source archive.
