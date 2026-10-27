"""Serve test-instrumented country HTML without changing any original site file."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
html=Path('src/countries/index.html').read_text().replace('</head>','<script src="/__cr_prelude.js"></script></head>',1).replace('</body>','<output id="cr-probe-result">PENDING</output><script src="/__cr_probe.js"></script></body>',1)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory='src',**kwargs)
 def do_GET(self):
  route=urlsplit(self.path).path
  if route in ['/countries/','/__cr_prelude.js','/__cr_probe.js']:
   data=html.encode() if route=='/countries/' else Path('checks/country-recovery-browser-'+('prelude' if route=='/__cr_prelude.js' else 'probe')+'.js').read_bytes()
   self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8' if route=='/countries/' else 'text/javascript; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
  else:super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8800),Handler).serve_forever()
