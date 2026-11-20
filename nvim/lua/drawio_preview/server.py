from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import secrets
import sys
from threading import Condition, Thread
from time import monotonic


ROOT = Path(__file__).resolve().parent
PREFIX = "/" + secrets.token_urlsafe(24) + "/"
ASSETS = {
    "": ("preview.html", "text/html; charset=utf-8"),
    "preview.js": ("preview.js", "text/javascript; charset=utf-8"),
    "viewer-static.min.js": ("viewer-static.min.js", "text/javascript; charset=utf-8"),
}
POLICY = (
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
    "connect-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; "
    "base-uri 'none'; frame-ancestors 'none'; form-action 'none'"
)


class PreviewServer(ThreadingHTTPServer):
    def __init__(self):
        super().__init__(("127.0.0.1", 0), PreviewHandler)
        self.updates = Condition()
        self.snapshot = (0, b'""')
        self.streams = 0
        self.close_at = None
        self.closing = False

    def publish(self, revision, body):
        with self.updates:
            self.snapshot = (revision, body.rstrip(b"\r\n"))
            self.updates.notify_all()

    def service_actions(self):
        with self.updates:
            if self.close_at is not None and monotonic() >= self.close_at:
                self.close_at = None
                self.closing = True
                print("tabs-closed", flush=True)


class PreviewHandler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        if self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        path = self.path.partition("?")[0]
        if not path.startswith(PREFIX):
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        route = path[len(PREFIX):]
        if route == "diagram":
            self.stream_diagram()
        elif route in ASSETS:
            name, content_type = ASSETS[route]
            self.respond(content_type, (ROOT / name).read_bytes())
        else:
            self.send_error(HTTPStatus.NOT_FOUND)

    def stream_diagram(self):
        server = self.server
        with server.updates:
            if server.closing:
                self.send_error(HTTPStatus.SERVICE_UNAVAILABLE)
                return
            server.streams += 1
            server.close_at = None

        try:
            self.respond("text/event-stream")
            self.wfile.write(b"retry: 500\n\n")
            version = -1
            while True:
                with server.updates:
                    changed = server.updates.wait_for(
                        lambda: server.snapshot[0] != version, timeout=1
                    )
                    version, body = server.snapshot
                self.wfile.write(b"data: " + body + b"\n\n" if changed else b": keepalive\n\n")
        except (ConnectionError, TimeoutError):
            pass
        finally:
            with server.updates:
                server.streams -= 1
                if server.streams == 0:
                    server.close_at = monotonic() + 2

    def respond(self, content_type, body=None):
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        if body is not None:
            self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Security-Policy", POLICY)
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        if body is not None:
            self.wfile.write(body)


def main():
    with PreviewServer() as server:
        worker = Thread(target=server.serve_forever, kwargs={"poll_interval": 0.1})
        worker.start()
        try:
            print(f"http://127.0.0.1:{server.server_port}{PREFIX}", flush=True)
            for revision, body in enumerate(sys.stdin.buffer, start=1):
                server.publish(revision, body)
        finally:
            server.shutdown()
            worker.join()


if __name__ == "__main__":
    main()
