"""Check capture failure handling with a simulated browser, not UI assertions."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
FAKE_CHROME = '''#!/usr/bin/env python3
import json,os,sys
from pathlib import Path
state=Path(os.environ['INSIGHTS_HARNESS_STATE'])
data=json.loads(state.read_text())
if '--dump-dom' in sys.argv:
 data['dumps']+=1
 mode=data['mode']
 outcome=('PENDING' if data['dumps']==1 else 'PASS: completed') if mode=='retry' else {'pass':'PASS: completed','pending':'PENDING','fail':'FAIL: assertion','missing':'NO RESULT','crash':'CRASH'}[mode]
 state.write_text(json.dumps(data))
 if mode=='crash':sys.exit(2)
 print('<output id="ir-probe-result">'+outcome+'</output>')
else:
 data['screenshots']+=1
 state.write_text(json.dumps(data))
 path=next(a.split('=',1)[1] for a in sys.argv if a.startswith('--screenshot='))
 Path(path).write_bytes(b'simulated capture')
'''
# The fake server/curl avoid networking; this tests orchestration only.
FAKE_PYTHON = '''#!/usr/bin/env bash
if test "${1:-}" = -m;then exec sleep 30;fi
exec "$INSIGHTS_REAL_PYTHON" "$@"
'''
real_python = shutil.which('python3')
with tempfile.TemporaryDirectory(prefix='insights-harness-') as temp:
    base = Path(temp)
    fixture = base / 'fixture'
    (fixture / 'checks').mkdir(parents=True)
    for name in ['insights-reliability-browser-smoke.sh', 'insights-reliability-browser-prelude.js', 'insights-reliability-browser-probe.js']:
        shutil.copy2(ROOT / 'checks' / name, fixture / 'checks' / name)
    (fixture / 'src').mkdir()
    (fixture / 'src/index.html').write_text('<html><head></head><body></body></html>')
    (base / 'tmp').mkdir()
    bindir = base / 'bin'
    bindir.mkdir()
    for name, content in [('google-chrome', FAKE_CHROME), ('python3', FAKE_PYTHON), ('curl', '#!/usr/bin/env bash\nexit 0\n')]:
        file = bindir / name
        file.write_text(content)
        file.chmod(0o755)
    env = dict(os.environ, TMPDIR=str(base / 'tmp'), PATH=str(bindir)+os.pathsep+os.environ['PATH'], INSIGHTS_REAL_PYTHON=real_python, INSIGHTS_HARNESS_STATE=str(base / 'state.json'))
    for mode, success, dumps, screenshots in [('pass', True, 6, 6), ('retry', True, 7, 6), ('pending', False, 3, 0), ('fail', False, 1, 0), ('missing', False, 1, 0), ('crash', False, 1, 0)]:
        state = base / 'state.json'
        state.write_text(json.dumps(dict(mode=mode, dumps=0, screenshots=0)))
        result = subprocess.run(['bash', 'checks/insights-reliability-browser-smoke.sh'], cwd=fixture, env=env, capture_output=True, text=True, timeout=20)
        data = json.loads(state.read_text())
        assert (result.returncode == 0) == success, (mode, result.stdout, result.stderr)
        assert data['dumps'] == dumps and data['screenshots'] == screenshots, data
        assert not list((fixture / 'src').rglob('__ir_*')), 'Probe files were not cleaned up'
        if mode == 'pending':
            assert result.stderr.count('retrying') == 2, result.stderr
        if mode in ['fail', 'missing', 'crash']:
            assert 'retrying' not in result.stderr, result.stderr
print('PASS: insights capture accepts completion, bounds PENDING retries, and fails immediately on assertions, missing results and browser errors')
