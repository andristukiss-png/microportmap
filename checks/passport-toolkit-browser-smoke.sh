#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo "Chromium missing" >&2; exit 1; }
mkdir -p checks/passport-toolkit-screenshots
python3 -m http.server 8774 --bind 127.0.0.1 --directory src >/tmp/mp-passport-toolkit-http.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true; for id in shenzhen kiel rotterdam; do test ! -f "/tmp/mpp-original-$id.html" || cp "/tmp/mpp-original-$id.html" "src/projects/$id/index.html"; done' EXIT
for i in {1..35};do curl -fsS http://127.0.0.1:8774/passport-research-toolkit.js >/dev/null 2>&1 && break;sleep .2;done
for id in shenzhen kiel rotterdam;do
  cp "src/projects/$id/index.html" "/tmp/mpp-original-$id.html"
  python3 - "$id" <<'PY'
from pathlib import Path
import sys
id=sys.argv[1]
f=Path("src/projects")/id/"index.html"
html=f.read_text()
proof=Path("checks/passport-toolkit-browser-probe.js").read_text()
css='<style>main>.hero,main>.columns,main>.mpx-passport-explore,main>#mp-connect{display:none!important}main{margin-top:15px!important}</style>'
assert "</head>" in html and "</body>" in html
html=html.replace("</head>",css+"</head>",1)
html=html.replace("</body>",'<output id="mpp-probe-result">PENDING</output><script>'+proof+'</script></body>',1)
f.write_text(html)
PY
  for spec in "desktop:1440,900" "mobile:390,844";do
    IFS=: read -r mode size <<< "$spec"
    profile="$(mktemp -d)"
    html="/tmp/mpp-$id-$mode.html"
    file="checks/passport-toolkit-screenshots/$id-$mode.png"
    timeout 70s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
     --disable-gpu --disable-background-networking --user-data-dir="$profile" \
     --window-size="$size" --virtual-time-budget=7500 --dump-dom \
     "http://127.0.0.1:8774/projects/$id/" > "$html" 2>/tmp/mpp-chrome.log ||
     { cat /tmp/mpp-chrome.log >&2;exit 1; }
    grep -q 'id="mpp-probe-result">PASS:' "$html" ||
     { grep -o 'id="mpp-probe-result"[^<]*' "$html" >&2 || true; exit 1; }
    timeout 65s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
     --disable-gpu --disable-background-networking --user-data-dir="$profile" \
     --window-size="$size" --virtual-time-budget=4500 \
     --screenshot="$PWD/$file" "http://127.0.0.1:8774/projects/$id/" \
     >/tmp/mpp-chrome.log 2>&1 || { cat /tmp/mpp-chrome.log >&2;exit 1; }
    test -s "$file"
    rm -rf "$profile"
    echo "PASS: $id $mode, 10 visible research actions and seven evidence-review fields"
  done
  cp "/tmp/mpp-original-$id.html" "src/projects/$id/index.html"
done
echo "PASS: 3 original passport examples × 2 viewports, functional Chromium DOM and six screenshots"
