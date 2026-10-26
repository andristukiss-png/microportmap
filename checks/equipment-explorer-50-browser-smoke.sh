#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo "Chromium missing" >&2; exit 1; }
mkdir -p checks/equipment-explorer-50-screenshots
original="$(mktemp)"
cp src/technologies/index.html "$original"
python3 -m http.server 8771 --bind 127.0.0.1 --directory src >/tmp/mpe-http.log 2>&1 &
server=$!
trap 'cp "$original" src/technologies/index.html; rm -f "$original"; kill "$server" 2>/dev/null || true' EXIT
for i in {1..35}; do curl -fsS http://127.0.0.1:8771/equipment-explorer.js >/dev/null 2>&1 && break; sleep .2; done
python3 - <<'PY'
from pathlib import Path
page=Path('src/technologies/index.html')
proof=Path('checks/equipment-explorer-50-probe.js').read_text()
content=page.read_text()
assert '</body>' in content
page.write_text(content.replace('</body>','<p id="mpe-test-status">PENDING</p><script>'+proof+'</script></body>',1))
PY
profile="$(mktemp -d)"
timeout 80s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
 --disable-gpu --disable-background-networking --user-data-dir="$profile" \
 --virtual-time-budget=9000 --dump-dom \
 'http://127.0.0.1:8771/technologies/' > /tmp/mpe-browser-proof.html 2>/tmp/mpe-browser.log ||
 { cat /tmp/mpe-browser.log >&2; exit 1; }
grep -q 'id="mpe-test-status">PASS:' /tmp/mpe-browser-proof.html ||
 { grep -o 'id="mpe-test-status"[^<]*' /tmp/mpe-browser-proof.html >&2 || true; exit 1; }
echo 'PASS: seven categories, exact equipment labels, filters, comparison, paging and directory handoff'
cp "$original" src/technologies/index.html
rm -rf "$profile"
for item in 'tech:/technologies/' 'filtered:/technologies/?tech_type=Industrial+dock' 'directory:/directory/'; do
 IFS=: read -r name route <<< "$item"
 for viewport in 'desktop:1440,900' 'mobile:390,844'; do
  IFS=: read -r mode size <<< "$viewport"
  profile="$(mktemp -d)"
  output="checks/equipment-explorer-50-screenshots/$name-$mode.png"
  html="/tmp/mpe-browser-$name-$mode.html"
  timeout 55s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=4500 --dump-dom \
   "http://127.0.0.1:8771$route" > "$html" 2>/tmp/mpe-browser.log ||
   { cat /tmp/mpe-browser.log >&2; exit 1; }
  if [ "$name" != directory ]; then
   grep -q 'data-mpe-loaded="1"' "$html" || { echo "Equipment view not ready $name $mode" >&2; exit 1; }
  else grep -q 'data-mpe-link' "$html" || { echo "Shared equipment link missing" >&2; exit 1; }
  fi
  timeout 55s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=4500 \
   --screenshot="$PWD/$output" "http://127.0.0.1:8771$route" >/tmp/mpe-browser.log 2>&1 ||
   { cat /tmp/mpe-browser.log >&2; exit 1; }
  test -s "$output"
  rm -rf "$profile"
  echo "PASS: $name $mode rendered"
 done
done
echo 'PASS: browser interaction checks and six responsive snapshots'
