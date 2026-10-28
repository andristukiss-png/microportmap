"""Verify the built catalogue, independent of the original 50-record regression fixtures."""
import copy,csv,hashlib,importlib.util,json,re,subprocess,sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from build_catalogue import validate,passport
subprocess.run([sys.executable,'scripts/build_catalogue.py'],cwd=ROOT,check=True)
seed=json.loads((ROOT/'src/data/projects.json').read_text())['records']
batch=json.loads((ROOT/'catalogue/additions.json').read_text());additions=batch['records']
built=json.loads((ROOT/'dist/data/projects.json').read_text());rows=built['records']
assert rows[:50]==seed and rows[50:]==additions
assert built['count']==len(rows)==len({p['id'] for p in rows})
assert len(rows)==batch['expectedTotal'] and len(additions)==batch['expectedTotal']-50
previous=json.loads((ROOT/'catalogue/first-batch-preservation.json').read_text())
for id,digest in previous.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Earlier reviewed addition changed'
latest=json.loads((ROOT/'catalogue/second-batch-ids.json').read_text())
assert latest==batch['releases'][-1]['recordIds'] and len(latest)==40
assert next(p for p in additions if p['id']=='amazon-college-station')['reportedStatus']=='historical'
for id in ['zipline-kisumu','zipline-karongi','droneup-rogers-5837','droneup-bentonville-100','wing-frisco-stonebrook']:
 assert next(p for p in additions if p['id']==id)['reportedStatus']=='announced'
assert (ROOT/'dist/data/original-50/projects.json').read_bytes()==(ROOT/'src/data/projects.json').read_bytes()
exports=list(csv.DictReader((ROOT/'dist/data/projects.csv').open(encoding='utf-8-sig')))
assert {p['id'] for p in exports}=={p['id'] for p in rows}
geo=json.loads((ROOT/'dist/data/projects.geojson').read_text())
assert len(geo['features'])==len(rows)
assert {f['properties']['id'] for f in geo['features']}=={p['id'] for p in rows}
assert sum(p['projectCount'] for p in json.loads((ROOT/'dist/data/countries.json').read_text()))==len(rows)
class Page(HTMLParser):
 def __init__(self):super().__init__();self.h1=0;self.ids=[];self.links=[];self.assets=[];self.canonicals=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='h1':self.h1+=1
  if 'id' in a:self.ids.append(a['id'])
  if tag=='a' and 'href' in a:self.links.append(a)
  if tag in ['script','link'] and (a.get('src') or a.get('href')):self.assets.append(a.get('src') or a.get('href'))
  if tag=='link' and a.get('rel')=='canonical':self.canonicals.append(a['href'])
for p in rows:
 route='/projects/'+p['id']+'/'
 page=ROOT/'dist'/route.lstrip('/')/'index.html';raw=page.read_text();doc=Page();doc.feed(raw)
 assert doc.h1==1 and len(doc.ids)==len(set(doc.ids)),p['id']
 assert doc.canonicals==['https://microportmap.com'+route]
 if p in additions:
  assert p['source']['url'] in raw and p['sourceReviewedAt'] in raw and p['coordinateBasis'] in raw
  assert p['verificationStatus'] in raw and 'independently verified' in raw
  assert '/directory/?country='+p['country'].replace(' ','%20') in raw
 for a in doc.links:
  if a.get('target')=='_blank':assert set(a.get('rel','').split())>={'noopener','noreferrer'}
 for url in [a['href'] for a in doc.links]+doc.assets:
  u=urlsplit(url)
  if u.scheme or u.netloc or not u.path:continue
  target=ROOT/'dist'/u.path.lstrip('/')
  assert target.exists(),(page,url)
  if target.is_dir():assert (target/'index.html').exists()
 assert 'https://microportmap.com'+route in (ROOT/'dist/sitemap.xml').read_text()
# Rejected input must fail before publishing: duplicate IDs/entities, unsafe source, missing evidence and invalid geography.
for kind in ['id','entity','signature','source','status','review','latitude','longitude','date']:
 bad=copy.deepcopy(additions)
 if kind=='id':bad[0]['id']=seed[0]['id']
 if kind=='entity':bad[1]['entityKey']=bad[0]['entityKey']
 if kind=='signature':bad[1]['name']=bad[0]['name'];bad[1]['where']=bad[0]['where']
 if kind=='source':bad[0]['source']['url']='https://user:password@example.com/'
 if kind=='status':bad[0]['reportedStatus']='verified'
 if kind=='review':bad[0]['reviewNotes']=''
 if kind=='latitude':bad[0]['approximateMapPoint']['latitude']=91
 if kind=='longitude':bad[0]['approximateMapPoint']['longitude']=float('nan')
 if kind=='date':bad[0]['sourceReviewedAt']='not-a-date'
 try:validate(seed,bad)
 except (AssertionError,ValueError):pass
 else:raise AssertionError('Invalid input accepted: '+kind)
# The generated template escapes source data rather than treating it as HTML.
unsafe=copy.deepcopy(additions[0]);unsafe['name']='<img src=x onerror=alert(1)>'
html=passport(unsafe,(ROOT/'src/projects/kiel/index.html').read_text())
assert '<img src=x onerror=' not in html and '&lt;img src=x onerror=' in html
before={p.relative_to(ROOT/'dist').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'dist').rglob('*') if p.is_file()}
subprocess.run([sys.executable,'scripts/build_catalogue.py'],cwd=ROOT,check=True)
after={p.relative_to(ROOT/'dist').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'dist').rglob('*') if p.is_file()}
assert before==after,'Build must be deterministic'
print(f'PASS: {len(rows)} records, {len(additions)} sourced additions, aligned exports, generated passports, safe input and deterministic build')
