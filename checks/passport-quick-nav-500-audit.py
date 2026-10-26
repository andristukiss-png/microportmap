"""Validate 50 original passports × 10 compact navigation actions."""
from pathlib import Path
import json
root=Path("src")
manifest=json.loads(Path("checks/passport-quick-nav-500-ledger.json").read_text())
records=json.loads((root/"data/projects.json").read_text())["records"]
assert len(records)==50 and len(manifest["tasks"])==500
assert len(manifest["actions"])==10 and len(list(root.rglob("*.html")))==72
assert [x["id"] for x in manifest["tasks"]]==[f"N{i:03}" for i in range(1,501)]
keys=[x["key"] for x in manifest["actions"]]
for record in records:
    tasks=[x for x in manifest["tasks"] if x["projectId"]==record["id"]]
    assert len(tasks)==10 and [x["actionId"] for x in tasks]==keys
    assert (root/"projects"/record["id"]/"index.html").is_file()
    assert all(x["route"]==f'/projects/{record["id"]}/' for x in tasks)
app=(root/"passport-quick-navigation.js").read_text()
style=(root/"site-navigation.css").read_text()
loader=(root/"experience-tools.js").read_text()
assert loader.count("quickNav.src='/passport-quick-navigation.js'")==1
assert style.count("Passport Quick Navigation · 50 research passports")==1
assert style.count("{")==style.count("}")
for key in keys:assert f"['{key}'," in app,key
for needle in ["function activate(key)","function targetFor(key)","function waitForTarget(key)",
              "function reveal(el)","function updateCountry(project)","function load()",
              "window.MicroportQuickNav","aria-live","mpq-navigation","mpt-open",
              "new URLSearchParams","scrollIntoView","projects.json"]:
    assert needle in app,needle
print("PASS: 500 project-specific research navigation actions and original 50 records/72 HTML preserved")
