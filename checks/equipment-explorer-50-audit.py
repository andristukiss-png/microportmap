"""Fifty-task source preservation and equipment-explorer audit."""
from pathlib import Path
import json
root=Path("src")
tasks=json.loads(Path("checks/equipment-explorer-50-ledger.json").read_text())["tasks"]
assert len(tasks)==50
assert [row["id"] for row in tasks]==[f"H{i:02}" for i in range(1,51)]
assert len({row["title"] for row in tasks})==50
assert len(list(root.rglob("*.html")))==72
data=json.loads((root/"data/projects.json").read_text())
assert data["count"]==len(data["records"])==50
assert len({r["infrastructureType"] for r in data["records"]})==7
assert len({r["reportedEquipment"] for r in data["records"]})==36
src=(root/"equipment-explorer.js").read_text()
loader=(root/"experience-tools.js").read_text()
css=(root/"site-navigation.css").read_text()
assert loader.count("equipmentScript.src='/equipment-explorer.js'")==1
assert css.count("Technology & Equipment Explorer — original site palette")==1
assert css.count("{")==css.count("}")
for needle in ["function restore()","function syncURL()","function setFilter(key,value)","function setView(next)",
 "function renderCategories()","function renderEquipment()","function renderProjects()",
 "function renderCompare()","function filter()","function download(format)","async function copyURL()",
 "function load()","reportedEquipment","infrastructureType","reportDateLabel",
 "verificationStatus","mpe-project-grid","mpe-categories","mpe-comparison","mpe-equipment-list",
 "MicroportEquipment","aria-pressed","text/csv","application/json"]:
    assert needle in src,needle
assert r"^[\s\uFEFF]*[=+@-]" in src, "CSV must quote spreadsheet formulas"
print("PASS: 50 documented equipment improvements, seven source categories, 36 labels and original 50 records")
