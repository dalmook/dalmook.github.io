#!/usr/bin/env python3
"""Serve this app locally. Bind only to localhost; no network exposure."""
import argparse,functools,http.server,webbrowser
from pathlib import Path

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--port',type=int,default=8080)
 parser.add_argument('--no-browser',action='store_true')
 args=parser.parse_args()
 root=Path(__file__).resolve().parents[1]
 handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(root))
 try:
  server=http.server.ThreadingHTTPServer(('127.0.0.1',args.port),handler)
 except OSError as exc:
  print(f'Could not start on port {args.port}: {exc}. Try --port 8081.')
  raise SystemExit(1)
 url=f'http://127.0.0.1:{args.port}/'
 print('WordBunny Island: '+url+'  |  Stop: Ctrl+C',flush=True)
 if not args.no_browser:webbrowser.open(url)
 try:server.serve_forever()
 except KeyboardInterrupt:pass
 finally:server.server_close()
if __name__=='__main__':main()
