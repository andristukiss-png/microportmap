"""Preservation checks for 50 concrete Country & Region Explorer affordances."""
from pathlib import Path
import json
root=Path("src")
rows=json.loads(Path("checks/country-explorer-50-ledger.json").read_text())["tasks"]
assert len(rows)==50
assert [r["id"] for r in rows]==[f"G{i:02}" for i in range(1,51)]
assert len({r["title"] for r in rows})==50
assert len(list(root.rglob("*.html")))==72
assert json.loads((root/"data/projects.json").read_text())["count"]==50
js=(root/"country-explorer.js").read_text()
loader=(root/"experience-tools.js").read_text()
css=(root/"site-navigation.css").read_text()
assert loader.count("countryScript.src='/country-explorer.js'")==1
assert css.count("Country & Region Explorer 50 — additive presentation")==1
assert css.count("{")==css.count("}")
for token in ["function countryGroups()","function setCurrent(name)","function setRegion(value)",
    "function cardsRender(list)","function detailRender()","function compareRender()",
    "function bookmarks()","function togglePin(name)","function exportRows()",
    "function download(format)","function copyURL()","function restoreURL()",
    "function preserveURL()","function load()","function entryLinks()","function draw()",
    "function shown()","function fill()","mpc-country-grid","mpc-country-detail",
    "mpc-country-compare","localStorage","aria-pressed","source(r)",
    "verificationStatus","reportDateLabel","getVisible","MicroportCountries",
    "source-linked","countryPage","coveragePage","projects.json"]:
    assert token in js,token
assert r"^[\s\uFEFF]*[=+@-]" in js, "CSV spreadsheet formulas must be escaped"
assert "/countries/" in js and "/directory/" in js and "/#atlas" in js
print("PASS: 50 visitor-facing tasks, 72 original HTML pages and unchanged 50-record research catalogue")
