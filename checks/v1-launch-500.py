"""500 passport release gates plus explicitly separate V1 content blockers."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,parse_qs,unquote
import json,csv,math,hashlib,re
ROOT=Path('src')
class Doc(HTMLParser):
 def __init__(self):super().__init__();self.tags=[];self.ids=[];self.visible=[];self.skip=0;self.lang='';self.h1=0
 def handle_starttag(self,t,attrs):
  a=dict(attrs);self.tags.append((t,a))
  if a.get('id'):self.ids.append(a['id'])
  if t=='html':self.lang=a.get('lang','')
  if t=='h1':self.h1+=1
  if t in ['style','script']:self.skip+=1
 def handle_endtag(self,t):
  if t in ['style','script']:self.skip=max(0,self.skip-1)
 def handle_data(self,s):
  if not self.skip:self.visible.append(s)
 @property
 def text(self):return ' '.join(' '.join(self.visible).split())
def target(page,href):
 u=urlsplit(href);p=ROOT/unquote(u.path).lstrip('/') if u.path.startswith('/') else page.parent/unquote(u.path) if u.path else page
 if p.is_dir():p=p/'index.html'
 return p,u
pages={p:Doc() for p in ROOT.rglob('*.html')}
for p,d in pages.items():d.feed(p.read_text())
records=json.loads((ROOT/'data/projects.json').read_text())['records'];assert len(records)==50
csv_rows={r['id']:r for r in csv.DictReader((ROOT/'data/projects.csv').open(encoding='utf-8-sig'))}
geo={r['properties']['id']:r for r in json.loads((ROOT/'data/projects.geojson').read_text())['features']}
cases=[];definitions={}
def gate(p,key,ok,evidence):
 definitions[key]=evidence
 cases.append({'taskId':'V1-'+str(len(cases)+1).zfill(3),'projectId':p['id'],'gate':key,'passed':bool(ok)})
for r in records:
 p=ROOT/'projects'/r['id']/'index.html';d=pages[p];links=[a for t,a in d.tags if t=='a'];src=urlsplit(r['source']['url']);point=r['approximateMapPoint']
 gate(r,'identity',bool(re.fullmatch('[a-z0-9-]+',r['id'])) and sum(x['id']==r['id'] for x in records)==1 and d.h1==1 and r['name'] in d.text,'Unique catalog identity, published route, one primary heading and readable project name')
 canon=[a.get('href') for t,a in d.tags if t=='link' and a.get('rel')=='canonical'];meta=[a for t,a in d.tags if t=='meta']
 gate(r,'search-and-mobile-metadata',d.lang=='en' and canon==['https://microportmap.com/projects/'+r['id']+'/'] and any(a.get('name')=='viewport' and 'width=device-width' in a.get('content','') for a in meta) and len([a for a in meta if a.get('name')=='description' and a.get('content','').strip()])==1 and any(t=='title' for t,a in d.tags),'Language, canonical, viewport, nonempty description and title; not a ranking or device-performance claim')
 gate(r,'citation-traceability',src.scheme=='https' and bool(src.hostname) and not src.username and not src.password and any(a.get('href')==r['source']['url'] for a in links),'Exact cited HTTPS URL appears in published passport; external availability and claim accuracy are not tested')
 gate(r,'reported-context',all(isinstance(r.get(k),str) and r[k].strip() and r[k] in d.text for k in ['reportedOperator','reportedEquipment','locationPrecision','reportDateLabel']),'Published operator, equipment, precision and report-date labels agree with catalog')
 gate(r,'research-limitations',bool(re.search(r'not independently verified|not verified',d.text,re.I)) and 'permission' in d.text.lower() and bool(r.get('verificationStatus')),'Published uncertainty/permission warning and nonempty catalog evidence status')
 gate(r,'approximate-geography',all(type(point[k]) in [int,float] and math.isfinite(point[k]) for k in ['latitude','longitude']) and abs(point['latitude'])<=85.05112878 and abs(point['longitude'])<=180 and bool(r['locationPrecision']),'Finite bounded approximate point with explicit precision; not an independently verified landing location')
 broken=[]
 for a in links:
  href=a.get('href','');u=urlsplit(href)
  if not href or u.scheme or u.netloc:continue
  dest,u=target(p,href)
  if not dest.exists() or (u.fragment and dest in pages and u.fragment not in pages[dest].ids):broken.append(href)
 gate(r,'local-navigation',not broken and len(d.ids)==len(set(d.ids)),'All static local destinations/fragments resolve; IDs are unique')
 assets=[]
 for t,a in d.tags:
  href=a.get('src') if t in ['script','img'] else a.get('href') if t=='link' and a.get('rel')=='stylesheet' else None
  if href and not urlsplit(href).scheme and not urlsplit(href).netloc and not target(p,href)[0].exists():assets.append(href)
 gate(r,'assets-and-link-safety',not assets and all('alt' in a for t,a in d.tags if t=='img') and all('noopener' in a.get('rel','').split() for a in links if a.get('target')=='_blank'),'Referenced local assets exist, image alternatives are declared, new-tab links isolate their opener; not a full WCAG audit')
 c=csv_rows[r['id']];g=geo[r['id']]
 mapping={'id':'id','name':'name','where':'where','country':'country','region':'region','type':'infrastructureType','operator':'reportedOperator','tech':'reportedEquipment','scope':'locationPrecision','date':'reportDateLabel','url':None}
 consistent=all(c[k]==(r['source']['url'] if v is None else r[v]) for k,v in mapping.items())
 gate(r,'export-consistency',consistent and g['geometry']['coordinates']==[point['longitude'],point['latitude']] and g['properties']['name']==r['name'] and g['properties']['source']==r['source']['url'] and g['properties']['approximate'] is True,'Original CSV and GeoJSON retain catalog identity, source, reported values and approximate geography')
 gate(r,'core-workflow-entry',any(urlsplit(a.get('href','')).path=='/' and parse_qs(urlsplit(a.get('href','')).query).get('project')==[r['id']] for a in links) and any(t=='script' and a.get('src')=='/project-connect.js' for t,a in d.tags) and (ROOT/'submit/index.html').exists() and (ROOT/'directory/index.html').exists(),'Project-specific atlas handoff and shared comparison/export/correction loader; runtime flows verified by separate suites')
assert len(cases)==500
sitewide={
 'htmlPages':len(pages),'projectPassports':len(records),
 'onePrimaryHeadingEveryPage':all(d.h1==1 for d in pages.values()),
 'languageEveryPage':all(d.lang for d in pages.values()),
 'descriptionEveryPage':all(any(t=='meta' and a.get('name')=='description' and a.get('content','').strip() for t,a in d.tags) for d in pages.values()),
 'imageAlternativesDeclared':all('alt' in a for d in pages.values() for t,a in d.tags if t=='img'),
 'correctionsRemainLocal':all('no submission inbox is connected' in pages[ROOT/x/'index.html'].text.lower() for x in ['submit','help']),
 'policyMapLoadingCorrected':all('unpkg' in pages[ROOT/x/'index.html'].text and 'Detailed geography' in pages[ROOT/x/'index.html'].text for x in ['privacy','cookies']),
 'policyStorageKeysDocumented':all(all(k in pages[ROOT/x/'index.html'].text for k in ['microportmap.research-trail.v1','microportmap.country-bookmarks.v1','microportmap.review-workspace.v1']) for x in ['privacy','cookies'])
}
assert sitewide['htmlPages']==72 and all(v for k,v in sitewide.items() if isinstance(v,bool))
blockers=[
 {'id':'V1-OWNER-01','status':'open','owner':'site owner','title':'Verified publisher identity and contact details','evidence':'src/legal/index.html and src/privacy/index.html explicitly retain owner/controller/contact placeholders.','completion':'Owner supplies accurate publisher identity, postal address and working contact channel, then final copy replaces placeholders. No identity or email is inferred.'},
 {'id':'V1-OWNER-02','status':'open','owner':'site owner','title':'Hosting/privacy facts remain unconfirmed','evidence':'src/privacy/index.html explicitly says hosting log retention, transfer details and the operator assessment are not finalized.','completion':'Confirm the actual hosting/account practices and finalize policy text. This audit is a technical/content review, not a legal-compliance determination.'}
]
result={'total':500,'passed':sum(c['passed'] for c in cases),'failed':sum(not c['passed'] for c in cases),'scope':'Static passport release gates, 50 projects × 10 categories. Passing these gates does not mean V1 launch is complete. Runtime/browser evidence is separate; source truth, external citation availability, full WCAG conformance, legal compliance and physical-device testing are outside these gates.','siteWide':sitewide,'launchStatus':'technical-audit-complete-owner-content-blockers-open','openLaunchBlockers':blockers,'gateDefinitions':definitions,'cases':cases}
Path('checks/v1-launch-500-results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'total':500,'passed':result['passed'],'failed':result['failed'],'siteWide':sitewide,'openLaunchBlockers':2}))
if result['failed']:print(json.dumps([c for c in cases if not c['passed']],indent=2));raise SystemExit(1)
