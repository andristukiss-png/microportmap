"""Audit 500 trackable per-record research review tasks and original site preservation."""
from pathlib import Path
import json
root=Path("src")
catalog=json.loads((root/"data/projects.json").read_text())
tasks=json.loads(Path("checks/review-workspace-500-ledger.json").read_text())
assert len(catalog["records"])==catalog["count"]==50
assert len(list(root.rglob("*.html")))==72
assert len(tasks["tasks"])==500
assert [x["id"] for x in tasks["tasks"]]==[f"R{i:03}" for i in range(1,501)]
assert len(tasks["categories"])==10
assert len({p["projectId"] for p in tasks["tasks"]})==50
questions={q["id"] for q in tasks["categories"]}
for p in catalog["records"]:
    rows=[x for x in tasks["tasks"] if x["projectId"]==p["id"]]
    assert len(rows)==10 and {x["questionId"] for x in rows}==questions
    assert (root/"projects"/p["id"]/"index.html").is_file()
    assert all(x["route"]==f"/projects/{p['id']}/" for x in rows)
src=(root/"research-review-workspace.js").read_text()
loader=(root/"experience-tools.js").read_text()
style=(root/"site-navigation.css").read_text()
assert loader.count("reviewWorkspace.src='/research-review-workspace.js'")==1
assert style.count("Research Review Workspace: 500 visitor-controlled")==1
assert style.count("{")==style.count("}")
for q in questions:assert f"['{q}'," in src,q
for token in ["function restore()","function persist(changedKey)","function storedReviews()","function syncControls()","function clearPrepared()","function questionRow(","function render()",
"function summaryText()","function csv()","function download(format)","async function copySummary()",
"function resetOne()","function load()","'storage'","localStorage","aria-valuenow",
"microportmap.review-workspace.v1","getTasks:","MicroportReview","follow-up","not-started","reviewed"]:
    assert token in src,token
assert r"^[\s\uFEFF]*[=+@-]" in src, "CSV cells need formula safeguards"
print("PASS: 500 project/question instances, 50 original records, 72 HTML pages, local-only workspace")
