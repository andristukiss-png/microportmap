# MicroportMap V1 launch review

Reviewed 27 October 2026. V1 is a public, source-reported research directory: atlas → directory → passport → comparison/export, plus local report preparation. It is not an operational droneport directory or a live contribution inbox.

## Result

The 500 static passport release gates pass: 50 original projects × 10 independently described categories. The site retains 72 HTML routes, 50 research records and the existing palette. Privacy and cookie copy was intentionally corrected on two existing pages; project passports and research data remain unchanged.

Passing these technical gates does **not** mean launch is complete. Two owner-content blockers remain:

| ID | Remaining item | Completion evidence |
| --- | --- | --- |
| V1-OWNER-01 | Publisher identity and working contact | Verified publisher name, postal address and contact channel replace the explicit placeholders in Legal Notice and Privacy Policy. No personal identity or address is inferred from a GitHub account. |
| V1-OWNER-02 | Hosting/privacy facts | Owner confirms actual hosting log retention, transfer details and the operator assessment already called out as unfinished in Privacy Policy; final text reflects those facts. |

These are content findings from the existing drafts, not a legal-compliance determination. The website remains an early-stage research preview until the owner information is completed. No further feature batch is necessary to resolve these two items.

## Completed in this review

- Corrected privacy/cookie descriptions: the homepage loads Leaflet JavaScript from unpkg; local styling and a schematic atlas come from MicroportMap. OpenStreetMap tiles load only when Detailed geography is enabled. The layer checkbox does not prevent the initial unpkg request.
- Removed instructions for the obsolete map-preference consent dialog. Documented current research-trail, country-bookmark and review-workspace storage, including review notes and clearing browser data.
- Checked all 72 pages for one primary heading, language, descriptions and declared image alternatives. Existing navigation/recovery audits cover local routes, anchors, sitemap and error-page behavior.
- Added 500 passport gates: identity; search/mobile metadata; exact citation URL; reported context; uncertainty; approximate geography; local navigation; assets/link safety; CSV/GeoJSON consistency; core workflow entry points.
- Added responsive checks and captures for atlas, directory, Kiel passport, metadata review, correction preparation, privacy and cookies at 1440×900 and 390×844. The new probe also checks page-level horizontal overflow and basic visible control names/labels. It blocks unpkg to exercise the site's fallback; it does not assess external tile availability.
- Retained the existing full functional regression suite, including local report preparation, copy/export behavior, browser storage, comparisons and failure/retry paths.

## Explicit scope and follow-up

Correction reports stay on the visitor's device; no public submission inbox is connected. This is disclosed on the form and Help page. A backend inbox is optional future work unless receiving contributions becomes part of the V1 promise.

External citation availability and independent project accuracy are not established by these checks. Existing report-date labels, including those marked unverified, remain unchanged. A source link is not a current operational certification.

Chromium viewport tests are not physical-device, screen-reader, full WCAG, Core Web Vitals, or legal reviews. A short human check on an actual phone and keyboard/screen reader remains useful before a wider announcement. No performance or accessibility score is invented.

Keep features frozen while completing the two owner-content items. Re-run the final checks after those copy edits, then announce the narrowly defined research-directory V1.

## Reproduce

```sh
python3 checks/v1-launch-500.py
python3 checks/validate.py
python3 checks/navigation-round12.py
python3 checks/site-navigation-audit.py
python3 checks/site-recovery.py
bash checks/v1-launch-browser-smoke.sh
```

The browser command requires Chromium. GitHub Actions runs it alongside the full existing regression suite. Results: `checks/v1-launch-500-results.json`; responsive captures: the workflow's `microportmap-v1-launch-audit-500` artifact. Publishing a successful workflow does not itself deploy production; deployment is separately verified.
