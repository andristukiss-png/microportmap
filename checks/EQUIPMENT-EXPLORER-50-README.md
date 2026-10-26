# Technology & Equipment Explorer — 50 visitor-facing tasks

A new data-driven explorer at [microportmap.com/technologies/](https://microportmap.com/technologies/) that uses the original 50 public research records and **does not invent equipment specifications**. Seven infrastructure categories and 36 distinct *literal reportedEquipment labels* are present in the current catalogue. Repeated labels are aggregated, but similar labels are not assumed identical.

| Task range | Workstream |
|---|---|
| H01–H10 | Coverage, overview and global navigation |
| H11–H20 | Combined filters and URL state |
| H21–H30 | Infrastructure and equipment browsing |
| H31–H40 | Original research drilldowns and evidence links |
| H41–H50 | Comparing categories, exports and trust safeguards |

Implementation: `src/equipment-explorer.js` loaded through the pre-existing shared `src/experience-tools.js` on every page. Additional presentation rules are appended to `src/site-navigation.css` without changing colors. The original technologies HTML remains available if enhanced JavaScript fails.

Evidence cautions: “Equipment label” is the unverified *reported wording*, which may reference several machines or software systems. Neither record counts nor matching category labels prove current operations, public access, compatibility, available hardware or permission to fly. A source report year is not an opening year.

Run `python3 checks/equipment-explorer-50-audit.py` and `bash checks/equipment-explorer-50-browser-smoke.sh` plus existing regression suites.
