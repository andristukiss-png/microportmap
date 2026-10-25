import json,re,hashlib,zipfile
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,parse_qs,unquote
class Doc(HTMLParser):
 def __init__(self):super().__init__();self.ids=set();self.links=[];self.attrs=[]
 def handle_starttag(self,t,a):
  a=dict(a);self.attrs.append((t,a))
  if a.get('id'):assert a['id'] not in self.ids;self.ids.add(a['id'])
  for key in ['href','src']:
   if a.get(key):self.links.append(a[key])
from site_navigation_support import without_site_navigation
root=Path('src');docs={}
for p in root.rglob('*.html'):
 d=Doc();d.feed(p.read_text());docs[p]=d
for p,d in docs.items():
 for link in d.links:
  u=urlsplit(link)
  if u.scheme or u.netloc:continue
  target=root/unquote(u.path).lstrip('/') if u.path.startswith('/') else p.parent/unquote(u.path) if u.path else p
  if target.is_dir():target=target/'index.html'
  assert target.exists(),(p,link)
  if u.fragment and target in docs:assert u.fragment in docs[target].ids,(p,link)
data=json.loads((root/'data/projects.json').read_text())['records']
for name in ['countries','coverage']:
 links=[parse_qs(urlsplit(x).query) for x in docs[root/name/'index.html'].links if x.startswith('/directory/?country=')]
 assert {x['country'][0] for x in links}=={r['country'] for r in data}
for name in ['operators','technologies']:
 links=[parse_qs(urlsplit(x).query)['q'][0] for x in docs[root/name/'index.html'].links if x.startswith('/directory/?q=')]
 assert len(links)==(48 if name=='operators' else 6),(name,len(links))
for p in docs:
 text=p.read_text();assert '<title>' in text;assert 'name="viewport"' in text;assert 'rel="canonical"' in text or p.name=='404.html'
baseline=json.loads(Path('baseline-round12.json').read_text())
for name,digest in baseline.items():
 p=Path(name)
 if name.startswith('src/data/') or name.endswith('.css') or name.startswith('src/projects/'):
  raw=without_site_navigation(p.read_text()).encode() if p.suffix=='.html' else p.read_bytes()
  assert hashlib.sha256(raw).hexdigest()==digest,name
# Immutable embedded-style digests captured from the user-supplied handoff ZIP.
styles=json.loads(Path('checks/embedded-style-baseline.json').read_text())
for name,digest in styles.items():
 text=Path(name).read_text()
 actual=hashlib.sha256('\n'.join(re.findall(r'<style\b[^>]*>.*?</style>',text,re.S)).encode()).hexdigest()
 assert actual==digest,name
for page in ['directory','submit','data-quality']:assert '<noscript>' in (root/page/'index.html').read_text()
print('PASS: all HTML pages: local paths/anchors, unique IDs, titles/viewports/canonicals; country/operator/technology destinations; all data, CSS, embedded styles and 50 passport contents preserved apart from requested shared navigation')
