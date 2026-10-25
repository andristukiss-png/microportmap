from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import xml.etree.ElementTree as E
class Doc(HTMLParser):
 def __init__(self):super().__init__();self.canonical=None;self.noindex=False;self.links=[];self.lang=None;self.h1=0;self.viewport=False
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='html':self.lang=a.get('lang')
  if t=='h1':self.h1+=1
  if t=='meta' and a.get('name')=='robots':self.noindex='noindex' in a.get('content','')
  if t=='meta' and a.get('name')=='viewport':self.viewport=True
  if t=='link' and a.get('rel')=='canonical':self.canonical=a.get('href')
  if t=='a':self.links.append(a.get('href'))
docs={}
for p in Path('src').rglob('*.html'):
 d=Doc();d.feed(p.read_text());docs[p]=d
urls=[e.text for e in E.parse('src/sitemap.xml').iter() if e.tag.endswith('loc')]
expected={d.canonical for p,d in docs.items() if p.name!='404.html'}
assert len(urls)==len(set(urls))==71;assert set(urls)==expected
assert all(urlsplit(u).scheme=='https' and urlsplit(u).netloc=='microportmap.com' for u in urls)
assert not any(e.tag.endswith('lastmod') for e in E.parse('src/sitemap.xml').iter())
assert not any('404' in u for u in urls)
for u in urls:
 route=urlsplit(u).path;p=Path('src')/route.lstrip('/')/'index.html';assert p.exists(),u
missing=docs[Path('src/404.html')];assert missing.noindex;assert missing.lang=='en';assert missing.h1==1;assert missing.viewport
for link in ['/directory/','/#atlas','/data-dictionary/','/submit/','#missing-page']:assert link in missing.links
assert 'no submission inbox is connected' in Path('src/404.html').read_text()
assert 'Sitemap: https://microportmap.com/sitemap.xml' in Path('src/robots.txt').read_text()
print('PASS: sitemap exactly covers 71 canonical pages, excludes error page, uses valid HTTPS routes and no invented modification dates; 404 semantics, links and local-report notice')
