#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo "Chromium missing" >&2; exit 1; }
mkdir -p checks/operator-explorer-50-screenshots
original="$(mktemp)"
cp src/operators/index.html "$original"
python3 -m http.server 8772 --bind 127.0.0.1 --directory src >/tmp/mpo-browser-http.log 2>&1 &
server=$!
trap 'cp "$original" src/operators/index.html; rm -f "$original"; kill "$server" 2>/dev/null || true' EXIT
for i in {1..35};do curl -fsS http://127.0.0.1:8772/operator-explorer.js >/dev/null 2>&1&&break;sleep .2;done
python3 - <<'PY'
from pathlib import Path
p=Path('src/operators/index.html')
source=p.read_text();probe=Path('checks/operator-explorer-50-probe.js').read_text()
assert '</body>' in source
p.write_text(source.replace('</body>','<output id="mpo-probe">PENDING</output><script>'+probe+'</script></body>',1))
PY
profile="$(mktemp -d)"
timeout 80s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
 --disable-gpu --disable-background-networking --user-data-dir="$profile" \
 --virtual-time-budget=9600 --dump-dom \
 'http://127.0.0.1:8772/operators/' > /tmp/mpo-browser-proof.html 2>/tmp/mpo-chrome.log ||
 { cat /tmp/mpo-chrome.log >&2;exit 1; }
grep -q 'id="mpo-probe">PASS:' /tmp/mpo-browser-proof.html ||
 { grep -o 'id="mpo-probe"[^<]*' /tmp/mpo-browser-proof.html >&2||true;exit 1; }
echo 'PASS: operator exploratory browser workflows (48 labels, 50 records)'
cp "$original" src/operators/index.html
python3 - <<'PY'
from pathlib import Path
p=Path('src/operators/index.html')
page=p.read_text()
# Temporary preview-only adjustment: surface genuine JS-created controls above the fold.
css='<style>main>h1,main>.lead,main>.warning,main>.columns{display:none!important}</style>'
assert '</head>' in page
p.write_text(page.replace('</head>',css+'</head>',1))
PY
rm -rf "$profile"
for item in 'operators:/operators/' 'filtered:/operators/?op_country=Germany' 'directory:/directory/';do
 IFS=: read -r name route <<< "$item"
 for vp in 'desktop:1440,900' 'mobile:390,844';do
  IFS=: read -r mode size <<< "$vp"
  profile="$(mktemp -d)";file="checks/operator-explorer-50-screenshots/$name-$mode.png"
  dump="/tmp/mpo-$name-$mode.html"
  timeout 60s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=4300 --dump-dom \
   "http://127.0.0.1:8772$route" > "$dump" 2>/tmp/mpo-chrome.log ||
   { cat /tmp/mpo-chrome.log >&2;exit 1; }
  if [ "$name" != 'directory' ];then
   grep -q 'data-mpo-loaded="1"' "$dump" || { echo "Operator view not ready ($name $mode)" >&2;exit 1; }
  else grep -q 'data-mpo-link' "$dump" || { echo "Directory link not enhanced" >&2;exit 1; }
  fi
  timeout 60s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=4300 \
   --screenshot="$PWD/$file" "http://127.0.0.1:8772$route" \
   >/tmp/mpo-chrome.log 2>&1 ||
   { cat /tmp/mpo-chrome.log >&2;exit 1; }
  test -s "$file";rm -rf "$profile"
  echo "PASS: $name / $mode"
 done
done
echo 'PASS: six responsive screenshots and operator interface interaction test'
