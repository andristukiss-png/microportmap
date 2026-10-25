"""Read-only production integrity audit. No external evidence-site requests."""
import concurrent.futures, datetime, hashlib, json, urllib.request, urllib.error
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parent.parent
class Doc(HTMLParser):
 def __init__(self): super().__init__(); self.canonical=None; self.h1=0; self.links=[]; self.scripts=[]; self.noindex=False
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='link' and a.get('rel')=='canonical': self.canonical=a.get('href')
  if t=='h1': self.h1+=1
  if t=='a': self.links.append(a.get('href'))
  if t=='script' and a.get('src'): self.scripts.append(a['src'])
  if t=='meta' and a.get('name')=='robots': self.noindex='noindex' in a.get('content','')
def get(path):
 try:
  with urllib.request.urlopen('https://microportmap.com'+path,timeout=25) as r: return r.status,r.read(),r.url
 except urllib.error.HTTPError as e: return e.code,e.read(),e.url

def check_file(p):
 relative=p.relative_to(ROOT/'src').as_posix()
 route='/'+relative
 if relative=='index.html': route='/'
 elif relative.endswith('/index.html'): route='/'+relative[:-10]
 try:
  status,body,url=get(route)
  expected=hashlib.sha256(p.read_bytes()).hexdigest()
  return dict(path=relative,route=route,status=status,url=url,sha256=hashlib.sha256(body).hexdigest(),expectedSha256=expected,passed=status==200 and hashlib.sha256(body).hexdigest()==expected)
 except Exception as e: return dict(path=relative,route=route,passed=False,error=str(e))
files=sorted(p for p in (ROOT/'src').rglob('*') if p.is_file() and p.name!='404.html')
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: results=list(pool.map(check_file,files))
by_path={r['path']:r for r in results}
data=json.loads((ROOT/'src/data/projects.json').read_text())
assert data['count']==len(data['records'])==50
sitemap=(ROOT/'src/sitemap.xml').read_text()
ledger=[]
for i,p in enumerate(data['records'],1):
 path=f"projects/{p['id']}/index.html"; raw=(ROOT/'src'/path).read_text(); doc=Doc(); doc.feed(raw)
 checks={
  'live_http_and_exact_bytes':by_path[path]['passed'],
  'canonical_identity':doc.canonical==f"https://microportmap.com/projects/{p['id']}/",
  'single_heading':doc.h1==1,
  'original_evidence_link':p['source']['url'] in doc.links,
  'map_project_context':f"/?project={p['id']}#explore" in doc.links,
  'passport_enhancement_loaded':'/project-connect.js' in doc.scripts,
  'sitemap_entry':doc.canonical in sitemap,
  'dataset_exact_live_bytes':by_path['data/projects.json']['passed'],
 }
 ledger.append(dict(task=i,type='verification',projectId=p['id'],name=p['name'],checks=checks,passed=all(checks.values())))
status,body,url=get('/integrity-audit-missing-2026-10-25/')
doc=Doc(); doc.feed(body.decode())
recovery=dict(status=status,noindex=doc.noindex,exact404Bytes=body==(ROOT/'src/404.html').read_bytes(),passed=status==404 and doc.noindex and body==(ROOT/'src/404.html').read_bytes())
report=dict(checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),origin='https://microportmap.com',taskCount=len(ledger),passedTasks=sum(t['passed'] for t in ledger),tasks=ledger,files=results,recovery=recovery,limitations=['HTTP/source checks are not visual/device tests.','Original source claims were not independently researched.','Exports are exercised by local VM suites; this audit compares served data bytes.'])
(ROOT/'checks/live-integrity-results.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
(ROOT/'checks/live-integrity-tasks.json').write_text(json.dumps([[f"Verify production passport: {t['name']}",f"src/projects/{t['projectId']}/index.html",json.dumps(t['checks'])] for t in ledger],indent=2,ensure_ascii=False)+'\n')
failed=[r for r in results if not r['passed']]
print(json.dumps(dict(tasksPassed=report['passedTasks'],taskCount=len(ledger),filesChecked=len(results),fileFailures=failed,recovery=recovery),indent=2))
raise SystemExit(bool(failed) or report['passedTasks']!=50 or not recovery['passed'])
