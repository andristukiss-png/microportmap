"""Audit the 50×10 passport reader release without modifying source data."""
from pathlib import Path
import json
root=Path("src")
ledger=json.loads(Path("checks/passport-reading-500-ledger.json").read_text())
data=json.loads((root/"data/projects.json").read_text())
assert data["count"]==len(data["records"])==50
assert len(list(root.rglob("*.html")))==72
assert len(ledger["actions"])==10 and len(ledger["tasks"])==500
assert [x["taskId"] for x in ledger["tasks"]]==[f"RC{i:03}" for i in range(1,501)]
ids=[x["actionId"] for x in ledger["actions"]]
assert len(set(ids))==10
for record in data["records"]:
    parts=[x for x in ledger["tasks"] if x["projectId"]==record["id"]]
    assert len(parts)==10 and [x["actionId"] for x in parts]==ids
    assert all(x["route"]==f'/projects/{record["id"]}/' for x in parts)
    assert (root/"projects"/record["id"]/"index.html").exists()
js=(root/"passport-reading-controls.js").read_text()
loader=(root/"experience-tools.js").read_text()
css=(root/"site-navigation.css").read_text()
assert loader.count("readerControls.src='/passport-reading-controls.js'")==1
assert css.count("Passport Reading Comfort 500: optional reversible")==1
assert css.count("{")==css.count("}")
for id in ids: assert f"['{id}'," in js,id
for token in ["window.MicroportReading","function action(key)","function refresh()","--mprc-scale",
    "mprc-focus","mprc-compact","mprc-comfort","aria-pressed","aria-live",
    "querySelectorAll('details')","window.print"]:
    assert token in js,token
assert "body.mprc-focus main" in css
assert "@media print" in css
print("PASS: 500 reversible reading actions on 50 original passports; all 72 HTML and dataset preserved")
