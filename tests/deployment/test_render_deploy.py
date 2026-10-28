"""Exercise the actual workflow Python with controlled HTTP and clocks."""
import contextlib
import io
import json
import os
from pathlib import Path
import re
import textwrap
import unittest
from unittest.mock import patch
from urllib.error import HTTPError


WORKFLOW = Path(__file__).resolve().parents[2] / '.github/workflows/cd.yml'
IMAGE = 'ghcr.io/example/api:' + 'a' * 40
ENV = {'DEPLOY_HOOK': 'https://api.render.com/deploy/srv-test?key=secret',
       'RENDER_API_KEY': 'secret-token', 'RENDER_SERVICE_ID': 'srv-test',
       'IMAGE': 'ghcr.io/example/api', 'GITHUB_SHA': 'a' * 40}


def deploy(status='live', image=IMAGE, identity='dep-new', created='2026-10-28T00:00:01Z'):
    return {'id': identity, 'status': status, 'image': {'ref': image}, 'createdAt': created}


class Response(io.BytesIO):
    def __init__(self, status, body):
        super().__init__(json.dumps(body).encode())
        self.status = status


class RenderDeployTest(unittest.TestCase):
    def run_workflow(self, replies, missing=None):
        source = WORKFLOW.read_text()
        match = re.search(r"          python3 - <<'PY'\n(.*?)\n          PY", source, re.S)
        self.assertIsNotNone(match, 'Workflow must wait for Render using tested inline Python')
        code = textwrap.dedent(match.group(1))
        calls, clock = [], [0]

        def request(req, timeout):
            calls.append(req)
            reply = replies.pop(0) if len(replies) > 1 else replies[0]
            if isinstance(reply, int):
                raise HTTPError(req.full_url, reply, 'SECRET URL BODY', {}, None)
            return Response(*reply)

        def sleep(seconds):
            clock[0] += seconds

        env = ENV.copy()
        if missing:
            env.pop(missing)
        output = io.StringIO()
        with patch.dict(os.environ, env, clear=True), patch('urllib.request.urlopen', request), \
                patch('time.monotonic', lambda: clock[0]), patch('time.time', lambda: 1793145600), \
                patch('time.sleep', sleep), contextlib.redirect_stdout(output):
            try:
                exec(compile(code, str(WORKFLOW), 'exec'), {'__name__': '__main__'})
                result = None
            except SystemExit as error:
                result = str(error)
        self.assertNotIn('secret', output.getvalue().lower())
        self.assertNotIn('secret', (result or '').lower())
        self.assertLessEqual(clock[0], 600)
        return result, calls

    def test_matching_live_deploy(self):
        result, calls = self.run_workflow([(200, {'deploy': {'id': 'dep-new'}}), (200, deploy())])
        self.assertIsNone(result)
        self.assertEqual([c.get_method() for c in calls], ['POST', 'GET'])
        self.assertIn('imgURL=ghcr.io%2Fexample%2Fapi%3A', calls[0].full_url)

    def test_old_live_image_rejected(self):
        result, _ = self.run_workflow([(200, {'deploy': {'id': 'dep-new'}}), (200, deploy(image='old'))])
        self.assertIn('image', result)

    def test_terminal_failure(self):
        for status in ['build_failed', 'update_failed', 'pre_deploy_failed', 'canceled', 'deactivated']:
            with self.subTest(status=status):
                result, _ = self.run_workflow([(200, {'deploy': {'id': 'dep-new'}}), (200, deploy(status))])
                self.assertIn(status, result)

    def test_deadline(self):
        result, calls = self.run_workflow([(200, {'deploy': {'id': 'dep-new'}}), (200, deploy('queued'))])
        self.assertIn('deadline', result)
        self.assertEqual(sum(c.get_method() == 'POST' for c in calls), 1)

    def test_queued_hook_cannot_accept_old_green(self):
        result, _ = self.run_workflow([(202, {}), (200, [{'deploy': deploy(created='2026-10-27T00:00:00Z')}])])
        self.assertIn('deadline', result)

    def test_queued_hook_finds_unique_new_deploy(self):
        result, _ = self.run_workflow([(202, {}), (200, [{'deploy': deploy()}]), (200, deploy())])
        self.assertIsNone(result)

    def test_ambiguous_queued_deploys_fail(self):
        result, _ = self.run_workflow([(202, {}), (200, [{'deploy': deploy()}, {'deploy': deploy(identity='dep-other')}])])
        self.assertIn('ambiguous', result)

    def test_transient_poll_errors_retry_without_post(self):
        result, calls = self.run_workflow([(200, {'deploy': {'id': 'dep-new'}}), 429, 503, (200, deploy())])
        self.assertIsNone(result)
        self.assertEqual(sum(c.get_method() == 'POST' for c in calls), 1)

    def test_auth_fails_without_secret_error(self):
        result, calls = self.run_workflow([(200, {'deploy': {'id': 'dep-new'}}), 401])
        self.assertIn('401', result)
        self.assertEqual(len(calls), 2)

    def test_hook_failure_never_reposts(self):
        result, calls = self.run_workflow([503])
        self.assertIn('503', result)
        self.assertEqual(len(calls), 1)

    def test_malformed_hook_id_fails_safely(self):
        for body in ({}, {'deploy': 'secret-value'}):
            with self.subTest(body=body):
                result, calls = self.run_workflow([(200, body)])
                self.assertIn('deploy ID', result)
                self.assertEqual(len(calls), 1)

    def test_missing_configuration_never_posts(self):
        for name in ENV:
            with self.subTest(name=name):
                result, calls = self.run_workflow([], missing=name)
                self.assertIn(name, result)
                self.assertEqual(calls, [])


if __name__ == '__main__':
    unittest.main()
