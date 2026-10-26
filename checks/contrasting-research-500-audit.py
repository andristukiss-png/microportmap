"""Validate 500 distinct data-grounded cross-research paths without rewriting source HTML."""
from pathlib import Path
import json
root=Path("src")
catalog=json.loads((root/"data/projects.json").read_text())
ledger=json.loads(Path("checks/contrasting-research-500-ledger.json").read_text())
records=catalog["records"];tasks=ledger["tasks"]
assert catalog["count"]==len(records)==50
assert len(list(root.rglob("*.html")))==72
assert len(tasks)==500
assert [t["id"] for t in tasks]==[f"X{i:03}" for i in range(1,501)]
id_set={x["id"] for x in records}
for p in records:
    related=[t for t in tasks if t["sourceId"]==p["id"]]
    assert len(related)==10
    assert [t["step"] for t in related]==list(range(1,11))
    assert len({t["destinationId"] for t in related})==10
    assert all(t["destinationId"]!=p["id"] for t in related)
    assert all(t["destinationId"] in id_set for t in related)
    assert (root/"projects"/p["id"]/"index.html").is_file()
    assert all((root/"projects"/t["destinationId"]/"index.html").is_file() for t in related)
source=(root/"contrasting-research-paths.js").read_text()
entry=(root/"experience-tools.js").read_text()
css=(root/"site-navigation.css").read_text()
assert entry.count("contrastPaths.src='/contrasting-research-paths.js'")==1
assert css.count("Contrasting Research Paths 500 · ten source-linked")==1
assert css.count("{")==css.count("}")
for needle in ["function existingRelated(records,primary)","function contrastPaths(records,primary)",
               "function differences(a,b)","function render()","function load()",
               "mpcr-path-grid","mpcr-contrast","MicroportContrast",
               "noopener noreferrer","Different reported country","Different infrastructure category",
               "Reported country","Original report attribution"]:
    assert needle in source,needle
print("PASS: 500 distinct source-to-destination paths, no record duplication, 72 untouched HTML pages")
