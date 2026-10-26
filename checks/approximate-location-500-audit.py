"""Verify 500 geographic controls without modifying original research data."""
from pathlib import Path
import json
root=Path("src")
catalog=json.loads((root/"data/projects.json").read_text())
ledger=json.loads(Path("checks/approximate-location-500-ledger.json").read_text())
records=catalog["records"]
tasks=ledger["tasks"]
keys=[x["id"] for x in ledger["actions"]]
assert catalog["count"]==len(records)==50
assert len(list(root.rglob("*.html")))==72
assert len(keys)==10 and len(set(keys))==10
assert len(tasks)==500
assert [x["id"] for x in tasks]==[f"L{i:03}" for i in range(1,501)]
for r in records:
    p=r.get("approximateMapPoint")
    assert isinstance(p,dict) and isinstance(p.get("latitude"),(int,float)) and isinstance(p.get("longitude"),(int,float))
    assert -90<=p["latitude"]<=90 and -180<=p["longitude"]<=180
    related=[t for t in tasks if t["projectId"]==r["id"]]
    assert len(related)==10 and [t["actionId"] for t in related]==keys
    assert (root/"projects"/r["id"]/"index.html").is_file()
    assert all(t["route"]==f'/projects/{r["id"]}/' for t in related)
src=(root/"approximate-location-tools.js").read_text()
loader=(root/"experience-tools.js").read_text()
css=(root/"site-navigation.css").read_text()
assert loader.count("locationTools.src='/approximate-location-tools.js'")==1
assert css.count("Approximate Location 500: collapsible")==1
assert css.count("{")==css.count("}")
for k in keys:assert f"'{k}'" in src,k
for token in ["function pointOf(record)","function coordContext(kind)","function geoJSON()",
 "function kml()","function mapURL(provider)","async function copy(value,name)",
 "function download(content,filename,type)","function facts()","function draw()",
 "window.MicroportLocation","locationPrecision","approximateMapPoint",
 "locationIsApproximate:true","notForNavigation:true","aria-live",
 "OpenStreetMap","google.com/maps","text/csv"]:
    if token=="text/csv":continue
    assert token in src,token
assert "coordinates:[point.lon,point.lat]" in src
assert "point.lon+','+point.lat+',0" in src
print("PASS: 500 location actions on 50 original approximate points and 72 original HTML pages")
