"""Build the public site from the immutable seed catalogue plus reviewed additions."""
from collections import Counter
from datetime import date
from html import escape
import csv, hashlib, io, json, math, re, shutil
from pathlib import Path
from urllib.parse import urlsplit, quote

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src'; OUT=ROOT/'dist'
REQUIRED=('id','name','where','country','region','infrastructureType','reportedOperator','reportedEquipment','locationPrecision','reportDateLabel','description','verificationStatus')
STATUS={'reported-operation','trial','announced','historical','unknown'}

def safe_url(value):
 u=urlsplit(value)
 return u.scheme=='https' and bool(u.hostname) and not u.username and not u.password

def validate(seed, additions):
 assert len(seed)==50, 'The original 50-record snapshot must remain intact'
 ids={p['id'] for p in seed}; entities=set(); signatures={(p['name'].casefold(),p['where'].casefold()) for p in seed}
 assert len(ids)==len(seed)
 for p in additions:
  assert all(isinstance(p.get(k),str) and p[k].strip() for k in REQUIRED),p.get('id')
  assert re.fullmatch(r'[a-z0-9-]+',p['id']) and p['id'] not in ids, 'Duplicate or unsafe project ID'
  assert p['entityKey'] not in entities and p['entityKey'], 'Duplicate entity key'
  signature=(p['name'].casefold(),p['where'].casefold())
  assert signature not in signatures, 'Duplicate project name and locality'
  assert p['reportedStatus'] in STATUS and p['recordScope'] and p['reviewNotes']
  assert p['sourceType'] in {'government','operator','hospital','research'}
  assert safe_url(p['source']['url']) and p['source']['name']
  date.fromisoformat(p['sourceReviewedAt'])
  if p['sourcePublishedAt']:assert date.fromisoformat(p['sourcePublishedAt'])<=date.fromisoformat(p['sourceReviewedAt'])
  assert p['coordinateBasis'].startswith('Editorial locality reference.')
  point=p['approximateMapPoint'];lat=point['latitude'];lon=point['longitude']
  assert type(lat) in (int,float) and type(lon) in (int,float) and math.isfinite(lat) and math.isfinite(lon)
  assert -85.05112878<=lat<=85.05112878 and -180<=lon<=180
  ids.add(p['id']);entities.add(p['entityKey']);signatures.add(signature)
 return seed+additions

def dump(path,value):
 path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def passport(p, template):
 e=lambda k:escape(str(p[k]),quote=True)
 route='/projects/'+p['id']+'/'
 state={'reported-operation':'Reported operation in historical source','announced':'Announced / planned in cited source','trial':'Trial in cited source','historical':'Historical project','unknown':'Status not established'}[p['reportedStatus']]
 details=''.join('<div><dt>'+escape(label)+'</dt><dd>'+e(key)+'</dd></div>' for label,key in [('Reported operator','reportedOperator'),('Reported equipment','reportedEquipment'),('Geographic precision','locationPrecision'),('Source timing','reportDateLabel'),('Record scope','recordScope')])
 main=f'''<main><div class="eyebrow">Source-reported research · {e('country')}</div><div class="hero"><span class="pill">{escape(state)}</span><h1>{e('name')}</h1><p>{e('description')}</p></div><div class="columns"><div><section class="card"><h2>Reported infrastructure</h2><p>{e('description')}</p><a class="button" href="{escape(p['source']['url'],quote=True)}" target="_blank" rel="noopener noreferrer">Read original evidence ↗</a></section><section class="card"><h2>Evidence and limitations</h2><p>{escape(p['source']['name'])} · {e('reportDateLabel')}</p><p><strong>Source reviewed:</strong> {e('sourceReviewedAt')}. This is a source-reading date, not an operational inspection.</p><p><strong>Reported status:</strong> {escape(state)}. {e('verificationStatus')}.</p><div class="warn">Current operations, exact locations, public access and aviation permission are not independently verified.</div><p>{e('coordinateBasis')}</p></section><section class="card"><h2>How this record is counted</h2><p>{e('reviewNotes')}</p><p><a href="/catalogue/">Catalogue scope and expansion progress ↗</a></p></section></div><aside><section class="card"><h2>Project details</h2><dl class="spec">{details}</dl></section></aside></div></main>'''
 s=re.sub(r'<title>.*?</title>','<title>'+e('name')+' | MicroportMap</title>',template,count=1)
 s=re.sub(r'<meta name="description" content="[^"]*">','<meta name="description" content="'+e('description')+'">',s,count=1)
 s=re.sub(r'<link rel="canonical" href="[^"]*">','<link rel="canonical" href="https://microportmap.com'+route+'">',s,count=1)
 s=s.replace('/?project=kiel#explore','/?project='+p['id']+'#atlas')
 s=re.sub(r'<main>.*?</main>',lambda _:main,s,count=1,flags=re.S)
 s=s.replace('/directory/?country=Germany','/directory/?country='+quote(p['country']))
 s=s.replace('MORE IN GERMANY','MORE IN '+escape(p['country'].upper())).replace('Explore Germany','Explore '+e('country'))
 s=re.sub(r'<p class="mp-continue-previous">.*?</p>','',s,count=1)
 # Existing shared navigation leads to the directory and the original atlas.
 return s

def build():
 seed_data=json.loads((SRC/'data/projects.json').read_text()); batch=json.loads((ROOT/'catalogue/additions.json').read_text())
 rows=validate(seed_data['records'],batch['records']);count=len(rows);countries=len({p['country'] for p in rows})
 assert count==batch['expectedTotal'], 'Unexpected release record count'
 released=[id for release in batch['releases'] for id in release['recordIds']]
 assert len(released)==len(set(released)) and set(released)=={p['id'] for p in batch['records']}, 'Release manifest must identify each addition once'
 if OUT.exists():shutil.rmtree(OUT)
 shutil.copytree(SRC,OUT)
 catalogue={**seed_data,'name':'MicroportMap sourced research catalogue','count':count,'updatedAt':batch['reviewedAt'],'originalRecordCount':len(seed_data['records']),'additionCount':len(batch['records']),'records':rows}
 dump(OUT/'data/projects.json',catalogue)
 geo={'type':'FeatureCollection','properties':{'disclaimer':'Editorial approximate locality references, not landing coordinates or flight permissions.'},'features':[]}
 for p in rows:
  point=p['approximateMapPoint'];geo['features'].append({'type':'Feature','geometry':{'type':'Point','coordinates':[point['longitude'],point['latitude']]},'properties':{'id':p['id'],'name':p['name'],'country':p['country'],'source':p['source']['url'],'scope':p['locationPrecision'],'approximate':True,'reportedStatus':p.get('reportedStatus','unknown')}})
 dump(OUT/'data/projects.geojson',geo)
 stream=io.StringIO(); writer=csv.writer(stream,lineterminator='\r\n',quoting=csv.QUOTE_ALL)
 keys=['id','name','where','country','region','type','operator','tech','scope','date','source','url','verificationStatus','reportedStatus','recordScope','sourceReviewedAt']
 aliases={'type':'infrastructureType','operator':'reportedOperator','tech':'reportedEquipment','scope':'locationPrecision','date':'reportDateLabel'}
 writer.writerow(keys)
 for p in rows:
  values=[str(p['source']['url'] if k=='url' else p['source']['name'] if k=='source' else p.get(aliases.get(k,k),'')) for k in keys]
  writer.writerow(["'"+v if re.match(r'^[\s\uFEFF]*[=+@-]',v) else v for v in values])
 (OUT/'data/projects.csv').write_text('\ufeff'+stream.getvalue())
 dump(OUT/'data/countries.json',[{'country':k,'projectCount':v} for k,v in sorted(Counter(p['country'] for p in rows).items())])
 (OUT/'data/README.txt').write_text('Current projects.json, projects.csv, projects.geojson, countries.json and quality.json are built from the original snapshot plus reviewed additions. Other audit/backlog exports describe the original 50-record review snapshot. The unmodified original exports are in original-50/. Research records are not independently verified operating facilities.\n')
 dump(OUT/'data/quality.json',{'records':count,'countries':countries,'sourceLinked':count,'independentlyVerifiedActiveSites':0,'coordinates':'Approximate only','updatedAt':batch['reviewedAt']})
 # Keep the original record and export snapshot separately, explicitly dated and unmodified.
 shutil.copytree(SRC/'data',OUT/'data/original-50')
 template=(SRC/'projects/kiel/index.html').read_text()
 for p in batch['records']:
  target=OUT/'projects'/p['id'];target.mkdir(parents=True);(target/'index.html').write_text(passport(p,template))
 # Update catalogue-wide copy only. Historical review-backlog figures remain the original 50-record snapshot.
 for path in OUT.rglob('*.html'):
  s=path.read_text()
  for old,new in [('Browse all 50 source-linked research passports.',f'Browse all {count} source-linked research passports.'),('Browse all 50 projects ↗',f'Browse all {count} projects ↗'),('50 project records spanning 23 countries.',f'{count} project records spanning {countries} countries.'),('50 source-backed project records across 23 countries.',f'{count} source-backed project records across {countries} countries.'),('covering the current 50 project records','covering the original 50-record snapshot')]:s=s.replace(old,new)
  path.write_text(s)
 progress=f'''<main><div class="hero"><span class="pill">Sourced catalogue expansion</span><h1>{count} research records. Building toward 1,000.</h1><p>{len(batch['records'])} reviewed additions join the original 50-record snapshot. Records describe projects, centres or networks; they are not a count of verified operating microports.</p></div><section class="card"><h2>What counts</h2><p>A named distribution centre, hospital station, campus programme or network with a traceable public source. A network is counted once unless separate sites are individually documented. Hospital delivery destinations are not automatically droneports.</p><p>Source-reported operation, trial and announced projects may be included. Status refers to the cited report; current operation is not independently verified. Approximate map points are editorial locality references.</p></section><section class="card"><h2>Reviewed research additions</h2><ul>'''+''.join('<li><a href="/projects/'+p['id']+'/">'+escape(p['name'])+'</a> — '+escape(p['verificationStatus'])+'</li>' for p in batch['records'])+'''</ul></section><section class="card"><h2>Downloads and review</h2><p><a href="/data/projects.json">Current JSON</a> · <a href="/data/projects.csv">Current CSV</a> · <a href="/data/projects.geojson">Current GeoJSON</a> · <a href="/data/original-50/projects.json">Original 50-record snapshot</a></p><p>New entries retain their source publication date when displayed, source-reading date, scope, status and duplicate-review notes in JSON. Reading a source is not operational verification.</p><p><a href="/directory/">Browse all records ↗</a> · <a href="/#atlas">Explore the atlas ↗</a></p></section></main>'''
 page=re.sub(r'<main>.*?</main>',lambda _:progress,template,count=1,flags=re.S)
 page=re.sub(r'<title>.*?</title>','<title>Catalogue expansion | MicroportMap</title>',page,count=1)
 page=page.replace('https://microportmap.com/projects/kiel/','https://microportmap.com/catalogue/').replace('/?project=kiel#explore','/#atlas')
 page=re.sub(r'<p class="mp-continue-previous">.*?</p>','',page,count=1)
 page=re.sub(r'<meta name="description" content="[^"]*">',f'<meta name="description" content="{count} sourced research records and the path toward a larger reviewed catalogue.">',page,count=1)
 # This overview is not a passport; avoid loading passport-only enhancements.
 page=page.replace('<script defer src="/project-connect.js"></script>','')
 (OUT/'catalogue').mkdir();(OUT/'catalogue/index.html').write_text(page)
 for path in OUT.rglob('*.html'):
  s=path.read_text().replace('<a href="/coverage/">Coverage</a>','<a href="/coverage/">Coverage</a><a href="/catalogue/">Catalogue growth</a>')
  path.write_text(s)
 sitemap=OUT/'sitemap.xml';xml=sitemap.read_text();entries=['https://microportmap.com/projects/'+p['id']+'/' for p in batch['records']]+['https://microportmap.com/catalogue/']
 xml=xml.replace('</urlset>',''.join('<url><loc>'+url+'</loc></url>' for url in entries)+'</urlset>');sitemap.write_text(xml)
 dump(OUT/'data/catalogue-build.json',{'recordCount':count,'originalRecordCount':50,'additionCount':len(batch['records']),'latestReleaseCount':len(batch['releases'][-1]['recordIds']),'countries':countries,'sourceReviewedAt':batch['reviewedAt'],'target':1000,'remainingToTarget':max(0,1000-count),'originalSnapshotSHA256':hashlib.sha256((SRC/'data/projects.json').read_bytes()).hexdigest(),'countingUnit':'source-reported projects, centres, campuses or networks; not verified operating sites'})
 print(f'Built {count} records, {len(batch["records"])} generated addition passports and {len(list(OUT.rglob("*.html")))} HTML routes')
 return rows

if __name__=='__main__':build()
