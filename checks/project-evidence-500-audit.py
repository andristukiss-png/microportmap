"""500 project-specific side-by-side evidence dimension checks and original-page preservation."""
from pathlib import Path
import json
root=Path("src")
catalog=json.loads((root/"data/projects.json").read_text())
manifest=json.loads(Path("checks/project-evidence-500-ledger.json").read_text())
rows=manifest["tasks"]
cols=manifest["fields"]
assert len(catalog["records"])==catalog["count"]==50
assert len(list(root.rglob("*.html")))==72
assert len(rows)==500 and len(cols)==10
assert [r["id"] for r in rows]==[f"C{i:03}" for i in range(1,501)]
for record in catalog["records"]:
    subset=[r for r in rows if r["projectId"]==record["id"]]
    assert len(subset)==10
    assert [r["fieldId"] for r in subset]==[c["id"] for c in cols]
    assert all(r["route"]==f'/projects/{record["id"]}/' for r in subset)
    assert (root/"projects"/record["id"]/"index.html").is_file()
js=(root/"project-evidence-compare.js").read_text()
css=(root/"site-navigation.css").read_text()
entry=(root/"experience-tools.js").read_text()
assert entry.count("evidenceCompare.src='/project-evidence-compare.js'")==1
assert css.count("Evidence Comparison 500 · 50 passports")==1
assert css.count("{")==css.count("}")
for f in cols:
    assert f"['{f['id']}'," in js, f["id"]
for token in ["function score(p)","function applyOptions()","function makeField(def)",
              "function toggle(key)","function renderFocus()","function renderComparison()",
              "function fieldRows()","function summaryText()","async function copySummary()",
              "function download(format)","function load()","function selectOther(id)",
              "MicroportEvidenceCompare","navigator.clipboard.writeText",
              "source?.url","aria-pressed","Not recorded in catalogue",
              "Same reported wording (not independent corroboration)"]:
    assert token in js,token
assert r"^[\s\uFEFF]*[=+@-]" in js, "CSV must neutralize formula expressions"
print("PASS: 500 comparison field actions, original 50 research records and 72 HTML pages")
