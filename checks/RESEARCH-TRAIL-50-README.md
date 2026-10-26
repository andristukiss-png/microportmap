# Research Trail 50 — visitor-facing release

A browser-local shortlist for up to five source-linked MicroportMap research projects. This is one cohesive feature made up of **50 individually described visitor actions and safeguards**, not 50 new datasets or independently audited records.

| Task IDs | Area |
| --- | --- |
| T01–T10 | Save from passports, directory, atlas and global finder |
| T11–T20 | Accessible dialog, empty states, loading, focus and clearing |
| T21–T30 | Saved-record navigation, metadata, filtering and ordering |
| T31–T40 | Compare, exact JSON, safer CSV, sharing and opt-in import |
| T41–T50 | Local-only persistence, cross-tab sync, robustness and privacy |

Run:
```sh
python3 checks/research-trail-50-audit.py
bash checks/research-trail-50-browser-smoke.sh
```

The implementation uses `src/research-trail.js`, loaded through the existing shared `src/experience-tools.js` entry point on all 72 pages. Styling is appended to `src/site-navigation.css` using existing site colors. Research data, original HTML, past palettes and established atlas, directory and export scripts remain untouched.

**Limits:** Browser-local storage can be cleared; in restricted environments it falls back to the current page only. Shared trail links contain public research IDs and *never automatically overwrite saved items*. Current operation, address, airspace permission and external source accuracy remain unverified. There is no remote synchronization or connected submission inbox. Chromium CI is automated browser verification, not testing on physical mobile devices.
