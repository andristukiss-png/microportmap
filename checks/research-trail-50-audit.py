"""Source-preservation and 50-task audit for the browser-local Research Trail."""
from pathlib import Path
import json,hashlib,re
root=Path("src")
ledger=json.loads(Path("checks/research-trail-50-ledger.json").read_text())
tasks=ledger["tasks"]
assert len(tasks)==50, len(tasks)
assert [r["id"] for r in tasks]==[f"T{i:02}" for i in range(1,51)]
assert len({r["task"] for r in tasks})==50
assert len(list(root.rglob("*.html")))==72
script=(root/"research-trail.js").read_text()
loader=(root/"experience-tools.js").read_text()
css=(root/"site-navigation.css").read_text()
assert loader.count("trailScript.src='/research-trail.js'")==1
assert css.count("Research Trail · browser-local shortlist")==1
assert css.count("{")==css.count("}")
for token in [
"function dedupe(ids)","function getStore()","function persist()","function save(id)",
"function render()","function renderSuggestions()","function renderShared()",
"function dismiss()","function exportData(format)","function shareLink()",
"function parseShare()","function observe()","function passportButton()",
"window.addEventListener('storage'","role','dialog'","aria-modal","mpt-save",
"microportmap.research-trail.v1","window.MicroportTrail","reportDateLabel",
"role','status'","aria-pressed","getClientRects","querySelectorAll",
"CSV","location.origin","window.confirm","^\\s\\uFEFF"]:
    assert token in script,token
assert script.count("localStorage.") >= 2
assert "microportmap.com" not in script, "share URL should use current first-party origin"
assert not any(url in script for url in ["google-analytics","facebook.com","smtp","mailto:"])
print("PASS: 50 tracked Research Trail tasks; additive loader and shared CSS; 72 pages retained")
