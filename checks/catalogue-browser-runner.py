#!/usr/bin/env python3
"""Run every catalogue passport and core view, optionally in a CI shard."""
import functools
import http.server
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import threading

ROOT = Path(__file__).resolve().parents[1]
VIEWS = ['', 'directory', 'countries', 'operators', 'technologies']
SIZES = [('desktop', '1440,900'), ('mobile', '390,844')]
FLAGS = ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
         '--disable-background-networking', '--host-resolver-rules=MAP unpkg.com ~NOTFOUND']


def catalogue_routes(data):
    records = data['records']
    ids = [p['id'] for p in records]
    if data['count'] != len(ids) or len(ids) != len(set(ids)):
        raise ValueError('Catalogue count or duplicate identity mismatch')
    if any(not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', id) for id in ids):
        raise ValueError('Unsafe project identity')
    return VIEWS + ['projects/' + id for id in ids]


def shard_routes(routes, index, count):
    if count < 1 or count > 64 or index < 0 or index >= count:
        raise ValueError('Shard index must be within count; count must be 1..64')
    return routes[index::count]


def browser_call(chrome, args):
    result = subprocess.run([chrome, *FLAGS, *args], capture_output=True, text=True, timeout=80)
    if result.returncode:
        raise RuntimeError('Chromium exited unsuccessfully: ' + result.stderr[-2000:])
    return result.stdout


def run_case(chrome, url, name, mode, viewport, output, scratch):
    for attempt in range(1, 4):
        with tempfile.TemporaryDirectory(prefix='profile-', dir=scratch) as profile:
            dom = browser_call(chrome, ['--user-data-dir=' + profile, '--window-size=' + viewport,
                                      '--virtual-time-budget=18000', '--dump-dom', url])
        result = re.search(r'<output\b[^>]*\bid="expansion-probe"[^>]*>([^<]*)', dom)
        value = result.group(1).strip() if result else ''
        if value.startswith('PASS:'):
            break
        if value != 'PENDING':
            raise RuntimeError(f'{name} {mode}: {value or "missing probe result"}')
        if attempt == 3:
            raise RuntimeError(f'{name} {mode}: probe remained pending after 3 attempts')
        print(f'Retry pending probe: {name} {mode} attempt {attempt + 1}', flush=True)
    capture = output / f'{name}-{mode}.png'
    capture.unlink(missing_ok=True)
    with tempfile.TemporaryDirectory(prefix='capture-', dir=scratch) as profile:
        browser_call(chrome, ['--user-data-dir=' + profile, '--window-size=' + viewport,
                             '--virtual-time-budget=12000', '--screenshot=' + str(capture), url])
    if not capture.exists() or capture.read_bytes()[:8] != b'\x89PNG\r\n\x1a\n':
        raise RuntimeError(f'{name} {mode}: missing or invalid screenshot')
    print(f'PASS: {name} {mode} expanded catalogue', flush=True)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    index = int(os.environ.get('CATALOGUE_SHARD_INDEX', '0'))
    count = int(os.environ.get('CATALOGUE_SHARD_COUNT', '1'))
    shard_routes([], index, count)  # Reject invalid configuration before building.
    chrome = next((shutil.which(n) for n in ('google-chrome', 'chromium', 'chromium-browser') if shutil.which(n)), None)
    if not chrome:
        raise RuntimeError('Chromium required')
    subprocess.run(['python3', 'scripts/build_catalogue.py'], cwd=ROOT, check=True)
    dist = ROOT / 'dist'
    data = json.loads((dist / 'data/projects.json').read_text())
    routes = catalogue_routes(data)
    selected = shard_routes(routes, index, count)
    if not selected:
        raise ValueError('Shard has no routes; reduce shard count')
    output = ROOT / 'checks/catalogue-expansion-screenshots'
    output.mkdir(exist_ok=True)
    for old_capture in output.glob("*.png"):
        old_capture.unlink()
    shutil.copyfile(ROOT / 'checks/catalogue-expansion-browser-probe.js', dist / '__expansion_probe.js')
    for route in selected:
        p = dist / route / 'index.html'
        html = p.read_text()
        if '</body>' not in html:
            raise ValueError('Missing document body: ' + route)
        p.write_text(html.replace('</body>', '<output id="expansion-probe">PENDING</output><script src="/__expansion_probe.js"></script></body>', 1))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(dist)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        print(f'Catalogue shard {index + 1}/{count}: {len(selected)} of {len(routes)} routes; {len(selected) * 2} journeys', flush=True)
        with tempfile.TemporaryDirectory(prefix='mp-catalogue-') as scratch:
            for route in selected:
                name = route.replace('/', '-') or 'atlas'
                url = f'http://127.0.0.1:{server.server_port}/' + (route + '/' if route else '')
                for mode, viewport in SIZES:
                    run_case(chrome, url, name, mode, viewport, output, scratch)
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


if __name__ == '__main__':
    main()
