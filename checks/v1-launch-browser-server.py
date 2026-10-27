"""Instrument seven real V1 routes without modifying their source HTML."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit
routes={'/','/directory/','/projects/kiel/','/data-quality/','/submit/','/privacy/','/cookies/'}
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory='src',**kw)
 def do_GET(self):
  route=urlsplit(self.path).path
  if route in routes or route=='/__v1_probe.js':
   if route=='/__v1_probe.js':data=Path('checks/v1-launch-browser-probe.js').read_bytes();kind='text/javascript'
   else:
    page=Path('src')/route.lstrip('/')/'index.html';data=page.read_text().replace('</body>','<output id="v1-browser-result">PENDING</output><script src="/__v1_probe.js"></script></body>',1).encode();kind='text/html'
   self.send_response(200);self.send_header('Content-Type',kind+'; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
  else:super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8798),Handler).serve_forever()
