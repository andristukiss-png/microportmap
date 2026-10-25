"""50 additive, palette-preserving visual tasks; static checks, not device screenshots."""
from pathlib import Path
import json,re
from site_navigation_support import CSS_LINK
root=Path("src")
css=(root/"site-navigation.css").read_text()
ledger=json.loads(Path("checks/visual-50-ledger.json").read_text())
tasks=ledger["tasks"]
assert len(tasks)==50 and [x["id"] for x in tasks]==[f"V{i:02}" for i in range(1,51)]
assert css.count("visual-50 release")==1
assert css.count("{")==css.count("}"),"CSS block braces mismatch"
for row in tasks:
    marker=f"/* {row['id']} · {row['area']} · {row['title']} */"
    assert css.count(marker)==1,marker
    assert css.count(row["selectorRule"])==1,row["id"]
    assert ":hover" in row["selectorRule"] or ":focus" in row["selectorRule"] or "{" in row["selectorRule"]
assert len(list(root.rglob("*.html")))==72
assert all(p.read_text().count(CSS_LINK)==1 for p in root.rglob("*.html"))
palette="".join(p.read_text(errors="replace") for p in root.rglob("*") if p.is_file() and p.suffix in (".css",".html") and p.name!="site-navigation.css")
hexes=lambda v:{s.lower() for s in re.findall(r"#[0-9a-fA-F]{3,8}\b",v)}
assert hexes(css).issubset(hexes(palette)),"New colors must reuse original palette"
assert not any("/data/" in row["selectorRule"] for row in tasks)
print("PASS: 50 numbered visual changes, 72 HTML entry points, CSS brace balance and existing palette")
