from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,parse_qs
import hashlib,json,re
from site_navigation_support import CSS_LINK,without_site_navigation
class Doc(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.rails=0;self.cards=[];self.active=[];self.all_links=[];self.nav_links=[];self.in_rail=False;self.rail_depth=0
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if a.get('id'):self.ids.append(a['id'])
  if t=='nav' and a.get('id')=='mp-bottom-navigation':self.rails+=1;self.in_rail=True;self.rail_depth=1
  elif self.in_rail and t=='nav':self.rail_depth+=1
  if t=='a':
   self.all_links.append(a)
   if 'mp-continue-card' in a.get('class','').split():self.cards.append(a)
   if self.in_rail:self.nav_links.append(a)
   if a.get('aria-current')=='page' and self.in_rail:self.active.append(a)
 def handle_endtag(self,t):
  if self.in_rail and t=='nav':
   self.rail_depth-=1
   if not self.rail_depth:self.in_rail=False
root=Path('src');data=json.loads((root/'data/projects.json').read_text())['records']; results=[]
baseline=json.loads(Path('baseline-round25.json').read_text())
reviewed=json.loads(Path('checks/v1-reviewed-html-digests.json').read_text())
assert set(reviewed)=={'src/privacy/index.html','src/cookies/index.html'}
assert all(row['beforeSha256']==baseline[path] for path,row in reviewed.items())
next_ids={};previous_ids={}
for p in sorted(root.rglob('*.html')):
 raw=p.read_text();assert raw.count(CSS_LINK)==1,p;doc=Doc();doc.feed(raw);route='/' if p==root/'index.html' else '/'+p.relative_to(root).as_posix().removesuffix('index.html')
 assert doc.rails==1 and len(doc.nav_links)==5,p
 assert len(doc.cards)==4,p
 assert len(doc.ids)==len(set(doc.ids)),p
 assert 'mp-continue' in doc.ids and 'mp-continue-heading' in doc.ids,p
 assert len(doc.active)==(1 if route in ['/','/directory/','/technologies/','/data-quality/'] else 0),p
 assert hashlib.sha256(without_site_navigation(raw).encode()).hexdigest()==(reviewed[str(p)]['afterSha256'] if str(p) in reviewed else baseline[str(p)]),p
 nav_fragment=raw.split('<!-- mp-site-navigation:content:start -->')[1].split('<!-- mp-site-navigation:content:end -->')[0]+raw.split('<!-- mp-site-navigation:rail:start -->')[1].split('<!-- mp-site-navigation:rail:end -->')[0]
 newdoc=Doc();newdoc.feed(nav_fragment)
 for a in newdoc.all_links:
  href=a['href'];u=urlsplit(href);assert not u.scheme and not u.netloc and href.startswith(('/','#')),href
  assert a.get('target') is None,href
  target=root/u.path.lstrip('/') if u.path else p
  if target.is_dir():target=target/'index.html'
  assert target.exists(),(p,href)
 for a in doc.cards:assert urlsplit(a['href']).path!=route,(p,a['href'])
 if p.parent.parent==root/'projects':
  current=p.parent.name; next_id=doc.cards[0]['href'].split('/')[2];assert next_id!=current;next_ids[current]=next_id
  previous_ids[current]=re.search(r'<p class="mp-continue-previous">Previous project: <a href="/projects/([^/]+)/',raw)[1]
  country=next(r['country'] for r in data if r['id']==current);assert parse_qs(urlsplit(doc.cards[1]['href']).query)['country']==[country]
 results.append({'page':str(p),'passed':True,'bannerCards':4,'bottomNavigationLinks':5,'internalOnly':True,'previousPageContentPreserved':str(p) not in reviewed,'reviewedPolicyCopy':str(p) in reviewed})
assert len(results)==72 and len(next_ids)==50
start=next(iter(next_ids));seen=set();current=start
while current not in seen:seen.add(current);current=next_ids[current]
assert len(seen)==50 and current==start
assert all(next_ids[previous]==current for current,previous in previous_ids.items())
css=(root/'site-navigation.css').read_text();assert 'z-index:1000' in css and 'safe-area-inset-bottom' in css and 'prefers-reduced-motion' in css and '@media(max-width:600px)' in css
assert 'position:fixed' in css and 'scroll-padding-bottom' in css
colors=lambda text:{v.lower() for v in re.findall(r'#[a-fA-F0-9]{3,8}\b',text)}
prior_colors=''.join(p.read_text() for p in root.rglob('*') if p.is_file() and p.suffix in ['.css','.html'] and p.name!='site-navigation.css')
assert colors(css)<=colors(prior_colors)
for path,digest in baseline.items():
 # Lookup and directory scripts were intentionally revised; pin reviewed bytes
 # while retaining the original baseline for every other file.
 if path=='src/country-explorer.js':digest='4d3426b4ffec6fee889dc79f2597975b2c7081f612f8a0b20643d5d836f666ae'
 if path=='src/equipment-explorer.js':digest='c19ce16b8ec9240969815a5ca1c247d094b558638c8ef488211793b9d2dcf568'
 if path=='src/operator-explorer.js':digest='72874b16c0bdf721a77c894a63f254ff55760b89fe26df4e8224052e40190449'
 if path=='src/research-insights.js':digest='f0e7b823071eaded9223f9ae1c093f05d845f1c5013045e79eff9cf364ba6f2f'
 if path=='src/project-connect.js':digest='d42373f1f21e2f325755f91e6bdf6b3b903af92d04c2e32480e3fa85ffb52fc2'
 if path=='src/site-redesign.js':digest='83ce122ac0d9f2e85f94ef3a48e9c5d816a549bed7a8afefd8bbe66ff1068549'
 if path=='src/directory-compare.js':digest='78de082c5f017c5ab3d2197a610a1b9eb49ba5798b9eb53a9e39a3797be0b7a4'
 if path=='src/data-quality.js':digest='028cfc47d17a72a4e9b7644356988be98bafc0cf3aefd7907e395e6aa792a5dc'
 if path=='src/review-tools.js':digest='d0e6a04034de7e3bc6167e8c19d3e624183688a933f09daa502a0d582352a524'
 if path=='src/research-audit-export.js':digest='9e6ac8ad41d131ec69bc4b3d3c51aa299102e66044891f3ad45c92d0abd47b11'
 if path=='src/directory.js':digest='e118a6d4b377a8ab07177bb6c70e6e6e3009359249f1337423469e65de07291f'
 if path=='src/directory-json-export.js':digest='506267611a9a6460599069eb0220d908654b4dd618b8a142fae78bde95545295'
 if path=='src/correction-prefill.js':digest='4db3cea46f3e76526e18db05fc7dd3343808b225b20379056412bde693b63fba'
 p=Path(path)
 if p.suffix!='.html':
  content=p.read_bytes()
  assert hashlib.sha256(content).hexdigest()==digest,path
Path('checks/site-navigation-results.json').write_text(json.dumps({'pages':len(results),'passed':len(results),'projectCycle':50,'sourceFileCount':len([p for p in root.rglob('*') if p.is_file()]),'tests':results,'unverified':['Actual mobile/device rendering']},indent=2)+'\n')
print('PASS: 72 pages, one fixed rail + four internal banners each, active states, no self-card links, 50-project discovery cycle, reviewed privacy/cookie copy and original project/data/CSS preserved')
