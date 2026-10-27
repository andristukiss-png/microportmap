"""Serve test-instrumented technology HTML without changing any original site file."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
html=Path('src/technologies/index.html').read_text().replace('</head>','<script src="/__er_prelude.js"></script></head>',1).replace('</body>','<output id="er-probe-result">PENDING</output><script src="/__er_probe.js"></script></body>',1)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory='src',**kwargs)
 def do_GET(self):
  route=urlsplit(self.path).path
  if route in ['/technologies/','/__er_prelude.js','/__er_probe.js']:
   data=html.encode() if route=='/technologies/' else Path('checks/equipment-recovery-browser-'+('prelude' if route=='/__er_prelude.js' else 'probe')+'.js').read_bytes()
   self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8' if route=='/technologies/' else 'text/javascript; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
  else:super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8799),Handler).serve_forever()
