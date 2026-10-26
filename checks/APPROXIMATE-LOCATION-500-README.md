# Approximate Location 500 — useful location context, not flight navigation

This release adds ten geographic research controls on **each of the existing 50 project passports**, yielding **50 × 10 = 500 project-specific actions**. The panel is collapsed by default to avoid clutter.

| Action | Behavior |
|---|---|
| `latitude` | Copy approximate latitude with precision caveat |
| `longitude` | Copy approximate longitude with precision caveat |
| `coordinates` | Copy approximate latitude/longitude pair and warning |
| `geojson-copy` | Copy a GeoJSON FeatureCollection with non-navigational marker |
| `geojson-download` | Download approximate GeoJSON as a geographic file |
| `kml-download` | Download KML placemark with explicit location caveat |
| `osm` | Open OpenStreetMap area context at regional zoom |
| `google` | Open Google Maps approximate-area context |
| `atlas` | Open original project on the research atlas |
| `directory` | Browse other original records from the same reported country |

The coordinates come exclusively from each original project's `approximateMapPoint` (latitude and longitude). All 50 currently have valid numeric approximate points. No new coordinates are geocoded, estimated or inferred. GeoJSON uses the required coordinate array order **longitude, latitude**. KML uses **longitude, latitude, altitude** with altitude zero merely as format syntax, *not a measured site altitude*. Both files embed a disclaimer and the original passport reference. An OpenStreetMap or Google Maps link is labeled as **approximate area context**, opened at a broad zoom, and is **not navigation to a verified droneport**.

The safe, collapsible module `src/approximate-location-tools.js` loads on passports through the existing shared site script. Styling is additive in `src/site-navigation.css` using the original palette. All original 72 HTML files and 50 data records, existing map, citation, local review and comparison features remain untouched.

Verification: `node checks/approximate-location-500.cjs` executes all ten actions on each original record; `python3 checks/approximate-location-500-audit.py` confirms task ledger and preservation; `bash checks/approximate-location-browser-smoke.sh` runs Chromium checks at desktop/mobile sizes. These are engineering tests and are not external source-accuracy, airspace-authorization or physical-device certifications.
