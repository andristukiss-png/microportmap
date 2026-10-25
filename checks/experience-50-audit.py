"""Audit additive research experience wiring and 50-item task ledger."""
from pathlib import Path
import json
from site_navigation_support import without_site_navigation
root=Path("src")
tasks=json.loads(Path("checks/experience-50-ledger.json").read_text())["tasks"]
assert len(tasks)==50 and [x["id"] for x in tasks]==[f"E{i:02}" for i in range(1,51)]
assert len({x["task"] for x in tasks})==50
script='<script src="/experience-tools.js" defer></script>'
html=list(root.rglob("*.html"))
assert len(html)==72
for path in html:
    source=path.read_text()
    assert source.count(script)==1,path
    assert source.index("<!-- mp-site-navigation:content:start -->") < source.index(script) < source.index("<!-- mp-site-navigation:content:end -->"),path
    assert script not in without_site_navigation(source),path
js=(root/"experience-tools.js").read_text()
for token in ["function finder()","function homepage()","function atlasExtras()","function directoryExtras()","function passportExtras()","function qualityExtras()","mpx-search-trigger","mpx-research-hub","mpx-directory-tools","mpx-passport-explore","mpx-quality-guide","aria-modal","mp-directory-state","selectedOptions","data().then"]:
    assert token in js,token
css=(root/"site-navigation.css").read_text()
assert css.count("Research experience · 50 real discovery")==1
assert css.count("{")==css.count("}"),"Unbalanced CSS"
assert all(x in css for x in [".mpx-search-trigger",".mpx-home-hub",".mpx-directory-tools",".mpx-atlas-actions",".mpx-passport-explore",".mpx-quality-guide"])
print("PASS: 50 concrete user-facing tasks, 72 script-bearing pages and original HTML preservation")
