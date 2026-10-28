#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo 'Chromium required' >&2;exit 1; }
python3 scripts/build_catalogue.py
mkdir -p checks/catalogue-expansion-screenshots
cp checks/catalogue-expansion-browser-probe.js dist/__expansion_probe.js
python3 - <<'PY'
from pathlib import Path
routes=['','directory','countries','operators','technologies','projects/kiel','projects/zipline-omenako','projects/labor-berlin-network','projects/lugano-eoc-station','projects/amazon-college-station','projects/wing-walmart-768','projects/wing-walmart-4538','projects/wing-columbus-helsinki','projects/zipline-kisumu','projects/wing-walmart-942','projects/wing-walmart-575','projects/aeronext-kosuge','projects/singapore-mpa-marina-south-pier','projects/oban-argyll-medical-trial','projects/dhl-reit-im-winkl','projects/dillons-bay-vaccine-trial','projects/inhambane-medical-drone-study','projects/aeronext-shintotsukawa','projects/abu-dhabi-skygo-matternet']
for route in routes:
 p=Path('dist')/route/'index.html'
 p.write_text(p.read_text().replace('</body>','<output id="expansion-probe">PENDING</output><script src="/__expansion_probe.js"></script></body>',1))
PY
python3 -m http.server 8808 --bind 127.0.0.1 --directory dist >/tmp/mp-expansion-server.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true' EXIT
for i in {1..30};do curl -fsS http://127.0.0.1:8808/data/projects.json >/dev/null 2>&1 && break;sleep .2;done
for route in '' directory countries operators technologies projects/kiel projects/zipline-omenako projects/labor-berlin-network projects/lugano-eoc-station projects/amazon-college-station projects/wing-walmart-768 projects/wing-walmart-4538 projects/wing-columbus-helsinki projects/zipline-kisumu projects/wing-walmart-942 projects/wing-walmart-575 projects/aeronext-kosuge projects/singapore-mpa-marina-south-pier projects/oban-argyll-medical-trial projects/dhl-reit-im-winkl projects/dillons-bay-vaccine-trial projects/inhambane-medical-drone-study projects/aeronext-shintotsukawa projects/abu-dhabi-skygo-matternet;do
 name="${route//\//-}";name="${name:-atlas}"
 for spec in desktop:1440,900 mobile:390,844;do
  IFS=: read -r mode viewport <<< "$spec"
  passed=false
  for attempt in 1 2 3;do
   profile="$(mktemp -d)";dump="/tmp/mp-expansion-$name-$mode.html"
   timeout 80s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --host-resolver-rules='MAP unpkg.com ~NOTFOUND' --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=18000 --dump-dom "http://127.0.0.1:8808/${route:+$route/}" >"$dump" 2>/tmp/mp-expansion-chrome.log || { cat /tmp/mp-expansion-chrome.log >&2;exit 1; }
   rm -rf "$profile"
   if grep -q 'id="expansion-probe">PASS:' "$dump";then passed=true;break;fi
   if ! grep -q 'id="expansion-probe">PENDING' "$dump";then grep -o 'id="expansion-probe"[^<]*' "$dump" >&2 || true;exit 1;fi
  done
  if [ "$passed" != true ];then echo "Probe remained pending: $name $mode" >&2;exit 1;fi
  profile="$(mktemp -d)"
  timeout 80s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --host-resolver-rules='MAP unpkg.com ~NOTFOUND' --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=12000 --screenshot="$PWD/checks/catalogue-expansion-screenshots/$name-$mode.png" "http://127.0.0.1:8808/${route:+$route/}" >/tmp/mp-expansion-capture.log 2>&1 || { cat /tmp/mp-expansion-capture.log >&2;exit 1; }
  rm -rf "$profile";echo "PASS: $name $mode expanded catalogue"
 done
done
