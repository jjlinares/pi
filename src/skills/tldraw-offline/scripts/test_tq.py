#!/usr/bin/env python3
import json
import os
import subprocess
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SCRIPT = Path(__file__).with_name("tq")
TOKEN = "test-token"


class Handler(BaseHTTPRequestHandler):
    def _respond(self):
        length = int(self.headers.get("content-length", "0"))
        body = self.rfile.read(length).decode()
        payload = {
            "method": self.command,
            "path": self.path,
            "authorization": self.headers.get("authorization"),
            "contentType": self.headers.get("content-type"),
            "body": body,
        }
        encoded = json.dumps(payload).encode()
        self.send_response(200)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    do_GET = _respond
    do_POST = _respond

    def log_message(self, *_args):
        pass


class TqTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def invoke(self, *args):
        with tempfile.TemporaryDirectory() as directory:
            config = Path(directory) / "server.json"
            config.write_text(json.dumps({"port": self.server.server_port, "token": TOKEN}))
            env = {**os.environ, "TLDRAW_SERVER_JSON": str(config)}
            return subprocess.run(
                ["sh", str(SCRIPT), *args],
                env=env,
                text=True,
                capture_output=True,
                check=False,
            )

    def test_get_adds_authentication(self):
        result = self.invoke("GET", "/readme")
        self.assertEqual(result.returncode, 0, result.stderr)
        response = json.loads(result.stdout)
        self.assertEqual(response["method"], "GET")
        self.assertEqual(response["path"], "/readme")
        self.assertEqual(response["authorization"], f"Bearer {TOKEN}")
        self.assertIsNone(response["contentType"])

    def test_raw_post_uses_text_plain(self):
        code = "return await api.getDocs()"
        result = self.invoke("POST", "/api/search", code)
        self.assertEqual(result.returncode, 0, result.stderr)
        response = json.loads(result.stdout)
        self.assertEqual(response["contentType"], "text/plain")
        self.assertEqual(response["body"], code)

    def test_json_post_uses_application_json(self):
        body = '{"code":"return true"}'
        result = self.invoke("POST", "/api/search", body)
        self.assertEqual(result.returncode, 0, result.stderr)
        response = json.loads(result.stdout)
        self.assertEqual(response["contentType"], "application/json")
        self.assertEqual(response["body"], body)

    def test_invalid_argument_count_prints_usage(self):
        result = self.invoke("GET")
        self.assertEqual(result.returncode, 2)
        self.assertIn("usage: tq", result.stderr)


if __name__ == "__main__":
    unittest.main()
