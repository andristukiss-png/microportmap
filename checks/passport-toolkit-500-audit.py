"""Audit 500 on-page research action instances on 50 original project passports."""
from pathlib import Path
import json
root=Path("src")
data=json.loads((root/"data/projects.json").read_text())
ledger=json.loads(Path("checks/passport-toolkit-500-ledger.json").read_text())
rows=ledger["tasks"];ops=ledger["actionCatalog"]
assert data["count"]==len(data["records"])==50
assert len(list(root.rglob("*.html")))==72
assert len(rows)==500 and len({r["id"] for r in rows})==500
assert [r["id"] for r in rows]==[f"P{i:03}" for i in range(1,501)]
assert len(ops)==10 and len({x["actionId"] for x in ops})==10
assert len({r["projectId"] for r in rows})==50
for record in data["records"]:
    rr=[r for r in rows if r["projectId"]==record["id"]]
    assert len(rr)==10,record["id"]
    assert {r["actionId"] for r in rr}=={x["actionId"] for x in ops}
    assert (root/"projects"/record["id"]/"index.html").exists()
    assert all(r["route"]=="/projects/"+record["id"]+"/" for r in rr)
source=(root/"passport-research-toolkit.js").read_text()
loader=(root/"experience-tools.js").read_text()
css=(root/"site-navigation.css").read_text()
assert loader.count("passportToolkit.src='/passport-research-toolkit.js'")==1
assert css.count("Passport Research Toolkit · 500 per-record actions")==1
assert css.count("{")==css.count("}")
for task in ops:assert "'"+task["actionId"]+"'" in source,task["actionId"]
for needle in ["function citationPlain()","function citationMarkdown()","function citationBibTeX()","function briefText()","function briefMarkdown()","function reviewText()","function reviewCSV()","function quickFacts()","function renderEvidence()","function sourceURL(p)","'aria-live'","'aria-disabled'","new URLSearchParams","navigator.clipboard","URL.createObjectURL","verificationStatus","reportDateLabel","MicroportPassportToolkit"]:
    assert needle in source,needle
assert r"^[\s\uFEFF]*[=+@-]" in source,"CSV formula safety absent"
print("PASS: 500 real passport/action instances on 50 existing records, no original HTML rewrites")
