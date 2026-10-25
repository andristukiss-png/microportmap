"""Generate the same static, JavaScript-independent navigation on every HTML page."""
from pathlib import Path
from html import escape
from urllib.parse import quote,urlsplit
import json,re,hashlib
from site_navigation_support import CSS_LINK,without_site_navigation
root=Path('src'); records=json.loads((root/'data/projects.json').read_text())['records']; ordered=sorted(records,key=lambda r:(r['name'].casefold(),r['id'])); positions={r['id']:i for i,r in enumerate(ordered)}
paths={
 'atlas':'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
 'projects':'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
 'technology':'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
 'evidence':'<path d="M6 3h9l4 4v14H6V3Zm9 0v5h4M9 12h7M9 16h5"/>',
 'explore':'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>',
 'next':'<path d="M4 12h15m-6-6 6 6-6 6"/>',
 'countries':'<path d="M12 21s7-6 7-12A7 7 0 0 0 5 9c0 6 7 12 7 12Z"/><circle cx="12" cy="9" r="2"/>'}
def icon(key):return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+paths[key]+'</svg>'
def block(part,html):return '<!-- mp-site-navigation:'+part+':start -->'+html+'<!-- mp-site-navigation:'+part+':end -->'
def path_of(page):return '/' if page==root/'index.html' else '/'+page.relative_to(root).as_posix().removesuffix('index.html')
common=[('/#atlas','THE WORLD MAP','Explore the atlas','Follow reported infrastructure around the world.','atlas'),('/directory/','PROJECT DIRECTORY','Find your next project','Browse all '+str(len(records))+' source-linked research passports.','projects'),('/technologies/','INFRASTRUCTURE','Meet the technology','Explore drone docks, cargo hubs and other reported systems.','technology'),('/countries/','PLACES & REGIONS','Explore by country','Follow the research across countries and regions.','countries'),('/data-quality/','RESEARCH TRANSPARENCY','Look at the evidence','See coverage, review flags and the limits of the data.','evidence'),('/verification-guide/','RESEARCH GUIDE','Follow the sources','Understand how to read and check each reported project.','explore')]
secondary=[('/countries/','Countries'),('/coverage/','Coverage'),('/operators/','Operators'),('/data-quality/','Data quality'),('/verification-guide/','Verification guide'),('/methodology/','Methodology'),('/data-dictionary/','Data downloads'),('/network/','Network'),('/submit/','Suggest a project'),('/help/','Help')]
rail=[('/#atlas','Atlas','Atlas','atlas'),('/directory/','Projects','Project directory','projects'),('/technologies/','Tech','Technology pages','technology'),('/data-quality/','Evidence','Data quality and evidence','evidence'),('#mp-continue','Explore','More MicroportMap pages','explore')]
if not Path('baseline-round25.json').exists():Path('baseline-round25.json').write_text(json.dumps({'src/'+p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()},indent=2)+'\n')
for page in sorted(root.rglob('*.html')):
 text=without_site_navigation(page.read_text()); current=path_of(page); project_id=page.parent.name if page.parent.parent==root/'projects' else None; record=next((r for r in records if r['id']==project_id),None); prev=''
 if record:
  index=positions[record['id']]; following=ordered[(index+1)%len(ordered)]; previous=ordered[(index-1)%len(ordered)]
  cards=[('/projects/'+following['id']+'/','NEXT RESEARCH PASSPORT',following['name'],'Continue with another reported infrastructure project.','next'),('/directory/?country='+quote(record['country'],safe=''),'MORE IN '+record['country'].upper(),'Explore '+record['country'],'Find other reported projects and compare the evidence.','countries'),common[0],common[2]]
  prev='<p class="mp-continue-previous">Previous project: <a href="/projects/'+previous['id']+'/">'+escape(previous['name'])+'</a></p>'
 else:cards=[c for c in common if urlsplit(c[0]).path!=current][:4]
 content='<section class="mp-continue" id="mp-continue" aria-labelledby="mp-continue-heading"><div class="mp-continue-inner"><div class="mp-continue-intro"><div><p class="mp-continue-kicker">KEEP EXPLORING / MICROPORTMAP</p><h2 id="mp-continue-heading">Your next discovery is here.</h2></div><p>Another place. Another project. More of the story.</p></div><div class="mp-continue-grid">'
 for href,kicker,title,description,key in cards:
  content+='<a class="mp-continue-card" href="'+escape(href,quote=True)+'"><span class="mp-continue-card-kicker">'+escape(kicker)+'</span><span class="mp-continue-symbol">'+icon(key)+'</span><span class="mp-continue-card-title">'+escape(title)+'<span class="mp-continue-arrow" aria-hidden="true">↗</span></span><span class="mp-continue-card-copy">'+escape(description)+'</span></a>'
 content+='</div>'+prev+'<nav class="mp-continue-topics" aria-label="More site topics">'+''.join('<a href="'+href+'">'+label+'</a>' for href,label in secondary if href!=current)+'</nav></div></section>'
 nav='<nav class="mp-bottom-nav" id="mp-bottom-navigation" aria-label="Site navigation" tabindex="-1">'
 for href,label,accessible,key in rail:
  active=' aria-current="page"' if not href.startswith('#') and urlsplit(href).path==current else ''
  nav+='<a class="mp-bottom-link" href="'+href+'" aria-label="'+accessible+'"'+active+'>'+icon(key)+'<span>'+label+'</span></a>'
 nav+='</nav>'
 text=text.replace('</head>',CSS_LINK+'</head>',1)
 footer=re.search(r'<footer\b',text,re.I); position=footer.start() if footer else text.lower().rfind('</body>');assert position>=0
 text=text[:position]+block('content',content)+text[position:]
 position=re.search(r'<body\b[^>]*>',text,re.I).end();text=text[:position]+block('skip','<a class="mp-site-nav-skip" href="#mp-bottom-navigation">Skip to site navigation</a>')+text[position:]
 text=text.replace('</body>',block('rail',nav)+'</body>',1);page.write_text(text)
print('Generated shared navigation and internal discovery banners on',len(list(root.rglob('*.html'))),'pages')
