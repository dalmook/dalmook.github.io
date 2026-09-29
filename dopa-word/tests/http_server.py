"""Static test server with explicit response termination and no revalidation cache.
The production Pages run still uses real CDN headers and the same reload assertions.
"""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import socket

class Server(ThreadingHTTPServer):
    request_queue_size=64
    daemon_threads=True
    allow_reuse_address=True
class Handler(SimpleHTTPRequestHandler):
    protocol_version='HTTP/1.1'
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript','.json':'application/json'}
    def setup(self):
        super().setup()
        self.connection.setsockopt(socket.IPPROTO_TCP,socket.TCP_NODELAY,1)
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('Connection','close')
        self.close_connection=True
        super().end_headers()

if __name__=='__main__':
    Server(('127.0.0.1',8765),Handler).serve_forever()
