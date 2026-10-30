#!/usr/bin/env python3
"""Verify complete sharding and browser failure handling without requiring Chromium."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('runner', Path(__file__).with_name('catalogue-browser-runner.py'))
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)


class Coverage(unittest.TestCase):
    def test_all_built_passports_once(self):
        data = json.loads((r.ROOT / 'dist/data/projects.json').read_text())
        routes = r.catalogue_routes(data)
        self.assertEqual(len(routes), data['count'] + 5)
        for count in (1, 2, 4, 7):
            shards = [r.shard_routes(routes, i, count) for i in range(count)]
            flat = [route for shard in shards for route in shard]
            self.assertCountEqual(flat, routes)
            self.assertEqual(len(flat), len(set(flat)))
            self.assertLessEqual(max(map(len, shards)) - min(map(len, shards)), 1)

    def test_future_growth_is_automatic(self):
        data = {'count': 1000, 'records': [{'id': f'project-{i}'} for i in range(1000)]}
        routes = r.catalogue_routes(data)
        self.assertEqual(len(routes), 1005)
        self.assertEqual(sum(len(r.shard_routes(routes, i, 4)) for i in range(4)), 1005)

    def test_invalid_inputs(self):
        for index, count in [(-1, 4), (4, 4), (0, 0), (0, 65)]:
            with self.subTest(index=index, count=count), self.assertRaises(ValueError):
                r.shard_routes([], index, count)
        for data in [{'count': 2, 'records': [{'id': 'a'}]},
                     {'count': 2, 'records': [{'id': 'a'}, {'id': 'a'}]},
                     {'count': 1, 'records': [{'id': '../escape'}]}]:
            with self.subTest(data=data), self.assertRaises(ValueError):
                r.catalogue_routes(data)


class BrowserResults(unittest.TestCase):
    def scenario(self, values, expected_dumps, expected_captures, error=None, screenshot=True):
        calls = []
        profiles = []
        def fake(chrome, args):
            profiles.append(Path(next(a.split('=', 1)[1] for a in args if a.startswith('--user-data-dir='))))
            self.assertTrue(profiles[-1].exists())
            if '--dump-dom' in args:
                calls.append('dump')
                value = values.pop(0)
                if isinstance(value, Exception):
                    raise value
                return value
            calls.append('capture')
            if screenshot:
                Path(next(a.split('=', 1)[1] for a in args if a.startswith('--screenshot='))).write_bytes(b'\x89PNG\r\n\x1a\nfixture')
            return ''
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'out';output.mkdir()
            with patch.object(r, 'browser_call', side_effect=fake):
                if error:
                    with self.assertRaises(error):
                        r.run_case('fake', 'http://127.0.0.1/test/', 'test', 'mobile', '390,844', output, folder)
                else:
                    r.run_case('fake', 'http://127.0.0.1/test/', 'test', 'mobile', '390,844', output, folder)
            self.assertTrue(all(not p.exists() for p in profiles))
            self.assertEqual(len(profiles), len(set(profiles)))
        self.assertEqual(calls.count('dump'), expected_dumps)
        self.assertEqual(calls.count('capture'), expected_captures)

    def test_pass(self):
        self.scenario(['<output id="expansion-probe">PASS: done</output>'], 1, 1)

    def test_pending_then_pass(self):
        self.scenario(['<output id="expansion-probe">PENDING</output>', '<output id="expansion-probe">PASS: done</output>'], 2, 1)

    def test_persistent_pending(self):
        self.scenario(['<output id="expansion-probe">PENDING</output>'] * 3, 3, 0, RuntimeError)

    def test_assertion_failure_not_retried(self):
        self.scenario(['<output id="expansion-probe">FAIL: wrong record</output>'], 1, 0, RuntimeError)

    def test_missing_probe_not_retried(self):
        self.scenario(['<p>PASS: unrelated</p>'], 1, 0, RuntimeError)

    def test_browser_crash_not_retried(self):
        self.scenario([RuntimeError('browser crashed')], 1, 0, RuntimeError)

    def test_browser_timeout_not_retried(self):
        self.scenario([subprocess.TimeoutExpired('browser', 80)], 1, 0, subprocess.TimeoutExpired)

    def test_missing_screenshot_fails(self):
        self.scenario(['<output id="expansion-probe">PASS: done</output>'], 1, 1, RuntimeError, screenshot=False)

    def test_process_failure_is_checked(self):
        result = subprocess.CompletedProcess([], 1, '', 'crashed')
        with patch.object(subprocess, 'run', return_value=result), self.assertRaises(RuntimeError):
            r.browser_call('fake', [])


if __name__ == '__main__':
    unittest.main()
