"""500 separately recorded static navigation assertions: 10 behaviors x 50 passports."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,parse_qs
import json,hashlib,re
from site_navigation_support import without_site_navigation
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__();self.elements=[];self.feed(text)
 def handle_starttag(self,tag,attrs):self.elements.append((tag,dict(attrs)))
root=Path('src');records=json.loads((root/'data/projects.json').read_text())['records']
baseline=json.loads(Path('baseline-round25.json').read_text());ledger=[]
ordered=sorted(records,key=lambda r:(r['name'].casefold(),r['id']))
# Use generated link order as the traversal graph; separately verify reversibility and coverage.
pages={r['id']:(root/'projects'/r['id']/'index.html').read_text() for r in records}
def cards(text):return [a for t,a in Page(text).elements if t=='a' and 'mp-continue-card' in a.get('class','').split()]
nexts={id:cards(text)[0]['href'].split('/')[2] for id,text in pages.items()}
prevs={id:re.search(r'Previous project: <a href="/projects/([^/]+)/',text)[1] for id,text in pages.items()}
for record in records:
 id=record['id'];text=pages[id];doc=Page(text);cs=cards(text)
 checks=[]
 checks.append(('Four distinct non-self discovery destinations',len(cs)==4 and len({a['href'] for a in cs})==4 and all(urlsplit(a['href']).path!='/projects/'+id+'/' for a in cs)))
 checks.append(('Country banner retains exact research country',parse_qs(urlsplit(cs[1]['href']).query).get('country')==[record['country']]))
 checks.append(('Next passport exists and previous returns here',nexts[id] in pages and prevs[nexts[id]]==id))
 checks.append(('Previous passport exists and next returns here',prevs[id] in pages and nexts[prevs[id]]==id))
 seen=set();cur=id
 while cur not in seen and cur in nexts:seen.add(cur);cur=nexts[cur]
 checks.append(('Forward discovery reaches every passport then returns',len(seen)==50 and cur==id))
 seen=set();cur=id
 while cur not in seen and cur in prevs:seen.add(cur);cur=prevs[cur]
 checks.append(('Reverse discovery reaches every passport then returns',len(seen)==50 and cur==id))
 fragment=''.join(text.split('<!-- mp-site-navigation:'+part+':start -->')[1].split('<!-- mp-site-navigation:'+part+':end -->')[0] for part in ['content','rail','skip'])
 links=[a for t,a in Page(fragment).elements if t=='a'];valid=True
 for a in links:
  u=urlsplit(a['href']);p=root/u.path.lstrip('/') if u.path else root/'projects'/id/'index.html'
  if p.is_dir():p=p/'index.html'
  valid=valid and not u.scheme and not u.netloc and p.is_file() and a.get('target') is None
  if u.fragment and p.is_file():valid=valid and any(at.get('id')==u.fragment for tag,at in Page(p.read_text()).elements)
 checks.append(('Every added destination and fragment resolves internally',valid))
 checks.append(('Keyboard targets each occur once and rail is focusable',all(sum(a.get('id')==target for t,a in doc.elements)==1 for target in ['mp-continue','mp-continue-heading','mp-bottom-navigation']) and any(a.get('id')=='mp-bottom-navigation' and a.get('tabindex')=='-1' for t,a in doc.elements)))
 checks.append(('Shared style loaded once and no false passport current state',text.count('href="/site-navigation.css"')==1 and not any(a.get('aria-current')=='page' for t,a in Page(fragment).elements)))
 checks.append(('Original passport bytes preserved after removing additions',hashlib.sha256(without_site_navigation(text).encode()).hexdigest()==baseline['src/projects/'+id+'/index.html']))
 for behavior,passed in checks:ledger.append({'id':len(ledger)+1,'project':id,'behavior':behavior,'passed':bool(passed)})
assert len(ledger)==500
Path('checks/discovery-500-results.json').write_text(json.dumps({'total':500,'passed':sum(x['passed'] for x in ledger),'failed':sum(not x['passed'] for x in ledger),'scope':'Local static HTML checks; not live browser or mobile visual tests','checks':ledger},indent=2)+'\n')
Path('checks/discovery-500-ledger.json').write_text(json.dumps([[x['project'],x['behavior'],'PASS' if x['passed'] else 'FAIL'] for x in ledger],indent=2)+'\n')
assert all(x['passed'] for x in ledger),[x for x in ledger if not x['passed']]
print('PASS: 500 navigation checks across 50 passports; no production source changes')
