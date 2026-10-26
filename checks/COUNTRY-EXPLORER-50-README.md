# Country & Region Explorer — 50 concrete improvements

A genuine interactive research experience on the existing `/countries/` page. The original static country cards remain in HTML as no-JavaScript/offline fallback; once the validated 50-record catalogue loads, the richer visitor experience takes their place.

The 50-task ledger documents **controls and behaviors in one explorer**, not 50 new research records:

| Task IDs | Category |
|---|---|
| G01–G10 | Geographic search, filter, browse and summary |
| G11–G20 | Country drilldown, source-backed project cards and pagination |
| G21–G30 | Side-by-side research coverage comparison |
| G31–G40 | Pin up to three countries privately, accessibility and fallback |
| G41–G50 | Bookmarkable states, CSV/JSON, errors and navigation |

The implementation is `src/country-explorer.js`, loaded through the already-present shared `src/experience-tools.js` on all 72 pages, with brand-compatible styles appended to `src/site-navigation.css`.

**Interpretation:** The 50 original records are source-linked mentions with approximate locations. Country counts are not a census of physical droneports or verification of current operations, public access, or airspace authorization. Source report-year text is not proof of a launch year. Shared URLs use only public countries, region labels and text. Browser-local pins may disappear when storage is cleared.

To reproduce source and Chromium verification:

```bash
python3 checks/country-explorer-50-audit.py
bash checks/country-explorer-50-browser-smoke.sh
```

Existing preservation, atlas, directory, project, trail, insights and 2,000-case regression checks also run. CI captures responsive browser screenshots but does not test physical devices or verify external map tiles.
