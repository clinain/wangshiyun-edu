#!/usr/bin/env python3
import http.client
import mimetypes
import os
import posixpath
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlsplit

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(APP_DIR, 'frontend', 'dist')
BACKEND_HOST = os.environ.get('WANGSHIYUN_BACKEND_HOST', '127.0.0.1')
BACKEND_PORT = int(os.environ.get('WANGSHIYUN_BACKEND_PORT', '3003'))
FRONTEND_PORT = int(os.environ.get('WANGSHIYUN_FRONTEND_PORT', '8088'))
BACKEND_TIMEOUT = int(os.environ.get('WANGSHIYUN_BACKEND_TIMEOUT', '600'))
PROXY_PREFIXES = ('/api/', '/api', '/uploads/', '/uploads', '/health')

class Handler(BaseHTTPRequestHandler):
    server_version = 'WangshiyunProxy/1.0'

    def do_GET(self):
        self.handle_request()

    def do_HEAD(self):
        self.handle_request()

    def do_POST(self):
        self.handle_request()

    def do_PUT(self):
        self.handle_request()

    def do_PATCH(self):
        self.handle_request()

    def do_DELETE(self):
        self.handle_request()

    def do_OPTIONS(self):
        self.handle_request()

    def handle_request(self):
        if self.path.startswith(PROXY_PREFIXES):
            self.proxy_to_backend()
            return
        if self.command not in ('GET', 'HEAD'):
            self.send_error(405, 'Method Not Allowed')
            return
        self.serve_static()

    def proxy_to_backend(self):
        length = int(self.headers.get('Content-Length') or '0')
        body = self.rfile.read(length) if length else None
        headers = {key: value for key, value in self.headers.items() if key.lower() not in ('host', 'connection', 'content-length')}
        headers['Host'] = f'{BACKEND_HOST}:{BACKEND_PORT}'
        if body is not None:
            headers['Content-Length'] = str(len(body))
        conn = http.client.HTTPConnection(BACKEND_HOST, BACKEND_PORT, timeout=BACKEND_TIMEOUT)
        try:
            conn.request(self.command, self.path, body=body, headers=headers)
            resp = conn.getresponse()
            data = resp.read()
            self.send_response(resp.status, resp.reason)
            for key, value in resp.getheaders():
                if key.lower() not in ('connection', 'transfer-encoding', 'content-length'):
                    self.send_header(key, value)
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(data)
        except Exception as exc:
            message = f'Backend proxy failed: {exc}'.encode('utf-8')
            self.send_response(502)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.send_header('Content-Length', str(len(message)))
            self.end_headers()
            self.wfile.write(message)
        finally:
            conn.close()

    def serve_static(self):
        parsed = urlsplit(self.path)
        request_path = posixpath.normpath(parsed.path.lstrip('/'))
        if request_path in ('', '.'):
            request_path = 'index.html'
        full_path = os.path.abspath(os.path.join(DIST_DIR, request_path))
        if not full_path.startswith(os.path.abspath(DIST_DIR)):
            self.send_error(403)
            return
        if not os.path.isfile(full_path):
            if request_path.startswith('assets/'):
                self.send_error(404)
                return
            full_path = os.path.join(DIST_DIR, 'index.html')
        if not os.path.isfile(full_path):
            self.send_error(404, 'frontend/dist not found; run npm run build')
            return
        content_type = mimetypes.guess_type(full_path)[0] or 'application/octet-stream'
        with open(full_path, 'rb') as file:
            data = file.read()
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(data)

    def log_message(self, fmt, *args):
        print('%s - - [%s] %s' % (self.client_address[0], self.log_date_time_string(), fmt % args), flush=True)

if __name__ == '__main__':
    os.chdir(APP_DIR)
    server = ThreadingHTTPServer(('0.0.0.0', FRONTEND_PORT), Handler)
    print(f'Wangshiyun frontend proxy listening on 0.0.0.0:{FRONTEND_PORT}, dist={DIST_DIR}, backend={BACKEND_HOST}:{BACKEND_PORT}', flush=True)
    server.serve_forever()
