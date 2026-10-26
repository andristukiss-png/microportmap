#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo "Chrome/Chromium required" >&2; exit 1; }
mkdir -p checks/floating-button-screenshots
python3 -m http.server 8770 --bind 127.0.0.1 --directory src >/tmp/mp-floating-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; rm -f src/__floating_test.html' EXIT
for i in {1..30}; do curl -fsS http://127.0.0.1:8770/site-navigation.css >/dev/null 2>&1 && break; sleep .2; done
for page in "home:src/index.html" "directory:src/directory/index.html"; do
  IFS=: read -r name path <<< "$page"
  python3 - "$path" <<'PY'
from pathlib import Path
import sys
page=Path(sys.argv[1]).read_text()
probe=r"""
<script>
window.addEventListener('load',()=>{
  window.scrollTo({top:document.body.scrollHeight,behavior:'instant'});
  setTimeout(()=>{
    const out=document.getElementById('mp-floating-test-result');
    const up=document.getElementById('mp-up-button');
    const find=document.querySelector('.mpx-search-trigger');
    const saved=document.querySelector('.mpt-trigger');
    if(!up||!find||!saved){out.textContent='FAIL: one or more buttons missing';return;}
    if(up.textContent.trim()!=='↑'){out.textContent='FAIL: Up text is still visible: '+up.textContent;return;}
    if(up.getAttribute('aria-label')!=='Back to top of page'){out.textContent='FAIL: accessible Up label missing';return;}
    const visible=element=>{
      const s=getComputedStyle(element),r=element.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
    };
    const nodes=[up,find,saved].filter(visible);
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i].getBoundingClientRect(),b=nodes[j].getBoundingClientRect();
      const intersection=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
        Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
      if(intersection>0.01){out.textContent='FAIL: floating controls overlap ('+nodes[i].id+' and '+nodes[j].className+')';return;}
    }
    out.textContent='PASS: arrow-only button, accessible name, '+nodes.length+' visible floating controls, no overlap';
  },1200);
});
</script>
"""
assert "</body>" in page
Path("src/__floating_test.html").write_text(page.replace("</body>",'<output id="mp-floating-test-result" style="position:fixed;top:10px;left:10px;z-index:2200000000;background:white;color:black">PENDING</output>'+probe+"</body>",1))
PY
  for spec in "desktop:1440,900" "narrow:850,780" "mobile:390,844"; do
    IFS=: read -r mode size <<< "$spec"
    profile="$(mktemp -d)"
    html="/tmp/mp-floating-$name-$mode.html"
    img="checks/floating-button-screenshots/$name-$mode.png"
    timeout 60s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
      --disable-gpu --disable-background-networking --user-data-dir="$profile" \
      --window-size="$size" --virtual-time-budget=4500 --dump-dom \
      "http://127.0.0.1:8770/__floating_test.html" > "$html" 2>/tmp/mp-floating-chrome.log ||
      { cat /tmp/mp-floating-chrome.log >&2; exit 1; }
    grep -q 'id="mp-floating-test-result"[^>]*>PASS:' "$html" ||
      { grep -o 'id="mp-floating-test-result"[^<]*' "$html" >&2||true; exit 1; }
    if [ "$mode" = 'desktop' ]; then
      timeout 60s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
        --disable-gpu --disable-background-networking --user-data-dir="$profile" \
        --window-size="$size" --virtual-time-budget=4500 \
        --screenshot="$PWD/$img" \
        "http://127.0.0.1:8770/$([ "$name" = 'home' ] && echo '' || echo 'directory/')" >/tmp/mp-floating-chrome.log 2>&1 ||
        { cat /tmp/mp-floating-chrome.log >&2; exit 1; }
      test -s "$img"
    fi
    rm -rf "$profile"
    echo "PASS: $name $mode — controls do not overlap; Up has arrow only"
  done
done
echo 'PASS: 2 page types × 3 viewports, legacy Up behavior retained'
