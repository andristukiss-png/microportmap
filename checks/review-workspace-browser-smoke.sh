#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo "Chrome required" >&2; exit 1; }
mkdir -p checks/review-workspace-screenshots
python3 -m http.server 8775 --bind 127.0.0.1 --directory src >/tmp/mpr-workspace-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; for name in shenzhen kiel rotterdam; do test ! -f "/tmp/mpr-original-$name.html" || cp "/tmp/mpr-original-$name.html" "src/projects/$name/index.html"; done; rm -f src/__mpr_test.js' EXIT
cp checks/review-workspace-browser-probe.js src/__mpr_test.js
for i in {1..30}; do curl -fsS http://127.0.0.1:8775/research-review-workspace.js >/dev/null 2>&1 && break; sleep .2; done
for name in shenzhen kiel rotterdam; do
 cp "src/projects/$name/index.html" "/tmp/mpr-original-$name.html"
 python3 - "$name" <<'PY'
from pathlib import Path
import sys
path=Path("src/projects")/sys.argv[1]/"index.html"
page=path.read_text()
preview='<style>main>.hero,main>.columns,main>#mpp-toolkit,main>#mp-connect,main>.mpx-passport-explore{display:none!important}main{margin-top:14px!important}</style>'
assert "</head>" in page and "</body>" in page
page=page.replace("</head>",preview+"</head>",1)
page=page.replace("</body>",'<output id="mpr-test-result">PENDING</output><script src="/__mpr_test.js"></script></body>',1)
path.write_text(page)
PY
 for viewport in "desktop:1440,900" "mobile:390,844"; do
  IFS=: read -r mode size <<< "$viewport"
  profile="$(mktemp -d)"
  dump="/tmp/mpr-$name-$mode.html"
  screenshot="checks/review-workspace-screenshots/$name-$mode.png"
  timeout 65s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=7000 --dump-dom \
   "http://127.0.0.1:8775/projects/$name/" > "$dump" 2>/tmp/mpr-chrome.log ||
   { cat /tmp/mpr-chrome.log >&2; exit 1; }
  grep -q 'id="mpr-test-result">PASS:' "$dump" ||
   { grep -o 'id="mpr-test-result"[^<]*' "$dump" >&2 || true; exit 1; }
  timeout 65s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=4000 \
   --screenshot="$PWD/$screenshot" "http://127.0.0.1:8775/projects/$name/" \
   >/tmp/mpr-chrome.log 2>&1 || { cat /tmp/mpr-chrome.log >&2; exit 1; }
  test -s "$screenshot"
  rm -rf "$profile"
  echo "PASS: $name $mode with 10 interactive research questions"
 done
 cp "/tmp/mpr-original-$name.html" "src/projects/$name/index.html"
done
echo "PASS: 3 original passports × 2 viewports; persistence, progress, reset and visual QA"
