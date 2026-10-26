"""Check 50x10 field-copy release, original data and website preservation."""
from pathlib import Path
import json
root=Path("src")
ledger=json.loads(Path("checks/field-inspector-500-ledger.json").read_text())
records=json.loads((root/"data/projects.json").read_text())["records"]
tasks=ledger["tasks"]
assert len(records)==50 and len(tasks)==500 and len(ledger["fieldDefinitions"])==10
assert len(list(root.rglob("*.html")))==72
assert [t["taskId"] for t in tasks]==[f"F{i:03}" for i in range(1,501)]
assert len({t["projectId"] for t in tasks})==50
keys=[x["key"] for x in ledger["fieldDefinitions"]]
assert len(set(keys))==10
for record in records:
    items=[x for x in tasks if x["projectId"]==record["id"]]
    assert len(items)==10 and [x["field"] for x in items]==keys
    assert all(x["route"]==f'/projects/{record["id"]}/' for x in items)
    assert (root/"projects"/record["id"]/"index.html").is_file()
src=(root/"passport-field-inspector.js").read_text()
css=(root/"site-navigation.css").read_text()
loader=(root/"experience-tools.js").read_text()
assert css.count("Passport Field Inspector · 500 source-qualified")==1
assert css.count("{")==css.count("}")
assert loader.count("fieldInspector.src='/passport-field-inspector.js'")==1
for key in keys:assert f"['{key}'," in src,key
for needle in ["function fieldText(def)","function normalizedValue(def)","async function copyField(def)",
"function render()","function load()","sourceURL","const safeSource=p=>","aria-live",
"mpf-inspector","MicroportFields","navigator.clipboard.writeText","setTimeout",
"Original source","Not recorded in catalogue"]:
    assert needle in src,needle
print("PASS: 500 unique source-qualified copy controls across 50 original research records")
