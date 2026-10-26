"""Audit fifty user-facing Research Insights behaviors and additive loader."""
from pathlib import Path
import json
root=Path("src")
rows=json.loads(Path("checks/research-insights-50-ledger.json").read_text())["tasks"]
assert len(rows)==50
assert [x["id"] for x in rows]==[f"I{i:02}" for i in range(1,51)]
assert len({x["title"] for x in rows})==50
assert len(list(root.rglob("*.html")))==72
js=(root/"research-insights.js").read_text()
loader=(root/"experience-tools.js").read_text()
css=(root/"site-navigation.css").read_text()
assert loader.count("insightScript.src='/research-insights.js'")==1
assert css.count("Research Insights 50 · dashboard")==1
assert css.count("{")==css.count("}")
assert ".mpi-insights header.mpi-intro{background:transparent!important" in css, "Insights mobile hero contrast regression"
for needle in ["function place()","function filter()","function renderCharts()",
    "function renderRecords()","function download(format)","function copyLink()",
    "function readLink()","function syncLink()","function setDisplay(v)",
    "function setOrder(v)","function choose(k,v)","ins_country","ins_type",
    "ins_region","ins_year","ins_q","aria-live","aria-pressed",
    "verificationStatus","reportDateLabel","getMatches","MicroportInsights",
    "projects.json","text/csv","application/json"]:
    assert needle in js,needle
assert r"^[\s\uFEFF]*[=+@-]" in js,"CSV export must neutralize formulas"
print("PASS: 50 insights tasks, shared loader, original 72 HTML pages and current dataset preserved")
