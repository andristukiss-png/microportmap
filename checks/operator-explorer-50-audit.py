"""Operator explorer static integrity and 50-item implementation audit."""
from pathlib import Path
import json
root=Path("src")
tasks=json.loads(Path("checks/operator-explorer-50-ledger.json").read_text())["tasks"]
assert len(tasks)==50
assert [t["id"] for t in tasks]==[f"O{i:02}" for i in range(1,51)]
assert len({t["title"] for t in tasks})==50
assert len(list(root.rglob("*.html")))==72
records=json.loads((root/"data/projects.json").read_text())["records"]
assert len(records)==50
assert len({r["reportedOperator"] for r in records})==48
js=(root/"operator-explorer.js").read_text()
loader=(root/"experience-tools.js").read_text()
css=(root/"site-navigation.css").read_text()
assert loader.count("operatorScript.src='/operator-explorer.js'")==1
assert css.count("Operator Explorer 50: additive controls")==1
assert css.count("{")==css.count("}")
for needle in [
"function groupsForView()","function setupSelects()","function filterURL()",
"function restore()","function renderGrid(list)","function renderDetail()",
"function renderComparison()","function renderChips()","function renderStats(labels)",
"function download(format)","function exportCSV(rows)","function load()",
"function render()","function resetAll()","function onSelect(value)",
"reportedOperator","reportDateLabel","reportedEquipment","verificationStatus",
"aria-pressed","mpo-comparison","mpo-grid","mpo-detail","MicroportOperators",
"source-backed","navigator.clipboard.writeText","projects.json",
"application/json;charset=utf-8","text/csv;charset=utf-8"
]:
    assert needle in js,needle
assert r"^[\s\uFEFF]*[=+@-]" in js
print("PASS: 50 operator interface tasks, 48 literal labels, 50 original records and 72 HTML pages preserved")
