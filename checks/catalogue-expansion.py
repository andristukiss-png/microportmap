"""Verify the built catalogue, independent of the original 50-record regression fixtures."""
import copy,csv,hashlib,importlib.util,json,re,subprocess,sys
from html.parser import HTMLParser
from html import escape
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
# Reviewed corrections must match their exact after-state before restoring the
# original record solely for historical preservation hashes.
corrections=json.loads((ROOT/'catalogue/2026-10-29-status-corrections.json').read_text())
updates={c['id']:c for c in corrections['changes']}
assert len(corrections['changes'])==len(updates)==4
assert set(updates)=={'wing-grand-plaza','wing-eastland','wing-hyperdome','wing-orion-springfield'}
allowed={'reportedStatus','verificationStatus','sourceReviewedAt','supportingSources','reviewNotes'}
for id,c in updates.items():
 assert c['before']['id']==c['after']['id']==id
 changed={k for k in set(c['before'])|set(c['after']) if c['before'].get(k)!=c['after'].get(k)}
 assert changed==allowed, 'Correction altered unrelated fields'
 assert c['after']['reportedStatus']=='historical'
 assert c['after']['sourceReviewedAt']==corrections['reviewedAt']=='2026-10-29'
 assert corrections['source'] in c['after']['supportingSources']
def preserved_record(p):
 if p['id'] not in updates:return p
 c=updates[p['id']]
 assert p==c['after'], 'Record differs from reviewed correction'
 return c['before']
for id in updates:
 p=next(p for p in additions if p['id']==id)
 preserved_record(p)
 for field,value in [('reportedStatus','reported-operation'),('name','Unreviewed name')]:
  bad=copy.deepcopy(p);bad[field]=value
  try:preserved_record(bad)
  except AssertionError:pass
  else:raise AssertionError('Unreviewed correction accepted')
prior250=json.loads((ROOT/'catalogue/prior-250-preservation.json').read_text())
assert len(prior250)==200
for id,digest in prior250.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(preserved_record(p),ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
previous=json.loads((ROOT/'catalogue/first-batch-preservation.json').read_text())
for id,digest in previous.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(preserved_record(p),ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Earlier reviewed addition changed'
second=json.loads((ROOT/'catalogue/second-batch-ids.json').read_text())
assert second==batch['releases'][1]['recordIds'] and len(second)==40
latest=json.loads((ROOT/'catalogue/third-batch-ids.json').read_text())
assert latest==batch['releases'][2]['recordIds'] and len(latest)==30
fourth=json.loads((ROOT/'catalogue/fourth-batch-ids.json').read_text())
assert fourth==batch['releases'][3]['recordIds'] and len(fourth)==10
fifth=json.loads((ROOT/'catalogue/fifth-batch-ids.json').read_text())
assert fifth==batch['releases'][4]['recordIds'] and len(fifth)==10
sixth=json.loads((ROOT/'catalogue/sixth-batch-ids.json').read_text())
assert sixth==batch['releases'][5]['recordIds'] and len(sixth)==30
seventh=json.loads((ROOT/'catalogue/seventh-batch-ids.json').read_text())
assert seventh==batch['releases'][6]['recordIds'] and len(seventh)==30
eighth=json.loads((ROOT/'catalogue/eighth-batch-ids.json').read_text())
assert eighth==batch['releases'][7]['recordIds'] and len(eighth)==30
ninth=json.loads((ROOT/'catalogue/ninth-batch-ids.json').read_text())
assert ninth==batch['releases'][8]['recordIds'] and len(ninth)==10
tenth=json.loads((ROOT/'catalogue/tenth-batch-ids.json').read_text())
assert tenth==batch['releases'][9]['recordIds'] and len(tenth)==5
eleventh=json.loads((ROOT/'catalogue/eleventh-batch-ids.json').read_text())
assert eleventh==batch['releases'][10]['recordIds'] and len(eleventh)==5
twelfth=json.loads((ROOT/'catalogue/twelfth-batch-ids.json').read_text())
assert twelfth==batch['releases'][11]['recordIds'] and len(twelfth)==5
thirteenth=json.loads((ROOT/'catalogue/thirteenth-batch-ids.json').read_text())
assert thirteenth==batch['releases'][12]['recordIds'] and len(thirteenth)==5
fourteenth=json.loads((ROOT/'catalogue/fourteenth-batch-ids.json').read_text())
assert fourteenth==batch['releases'][13]['recordIds'] and len(fourteenth)==5
fifteenth=json.loads((ROOT/'catalogue/fifteenth-batch-ids.json').read_text())
assert fifteenth==batch['releases'][14]['recordIds'] and len(fifteenth)==5
sixteenth=json.loads((ROOT/'catalogue/sixteenth-batch-ids.json').read_text())
assert sixteenth==batch['releases'][15]['recordIds'] and len(sixteenth)==6
seventeenth=json.loads((ROOT/'catalogue/seventeenth-batch-ids.json').read_text())
assert seventeenth==batch['releases'][16]['recordIds'] and len(seventeenth)==4
eighteenth=json.loads((ROOT/'catalogue/eighteenth-batch-ids.json').read_text())
assert eighteenth==batch['releases'][17]['recordIds'] and len(eighteenth)==4
nineteenth=json.loads((ROOT/'catalogue/nineteenth-batch-ids.json').read_text())
assert nineteenth==batch['releases'][18]['recordIds'] and len(nineteenth)==6
twentieth=json.loads((ROOT/'catalogue/twentieth-batch-ids.json').read_text())
assert twentieth==batch['releases'][19]['recordIds'] and len(twentieth)==5
twenty_first=json.loads((ROOT/'catalogue/twenty-first-batch-ids.json').read_text())
assert twenty_first==batch['releases'][20]['recordIds'] and len(twenty_first)==5
twenty_second=json.loads((ROOT/'catalogue/twenty-second-batch-ids.json').read_text())
assert twenty_second==batch['releases'][-1]['recordIds'] and len(twenty_second)==6
prior310=json.loads((ROOT/'catalogue/prior-310-preservation.json').read_text())
assert len(prior310)==260
for id,digest in prior310.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 310-record release changed'
twenty_second_rows=[p for p in additions if p['id'] in twenty_second]
assert all(p['sourceReviewedAt']=='2026-10-30' and p['country']=='South Korea' and p['region']=='Asia' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['sourcePublishedAt'] is None for p in twenty_second_rows)
assert len({p['source']['url'] for p in twenty_second_rows})==6
assert len({p['where'] for p in twenty_second_rows})==6
assert 'South Gyeongsang' in next(p for p in twenty_second_rows if p['id']=='kiast-goseong-flight-test-centre')['where']
prior305=json.loads((ROOT/'catalogue/prior-305-preservation.json').read_text())
assert len(prior305)==255
for id,digest in prior305.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 305-record release changed'
twenty_first_rows=[p for p in additions if p['id'] in twenty_first]
assert all(p['sourceReviewedAt']=='2026-10-30' for p in twenty_first_rows)
assert len({p['where'] for p in twenty_first_rows})==5
hillsboro=next(p for p in twenty_first_rows if p['id']=='hillsboro-ndsu-agricultural-trial')
assert hillsboro['reportedStatus']=='trial' and hillsboro['recordScope']=='trial-site' and hillsboro['sourcePublishedAt']=='2016-05-20'
assert sum(p['recordScope']=='test-centre' for p in twenty_first_rows)==4
assert next(p for p in twenty_first_rows if p['id']=='jornada-uas-research-airstrip')['sourcePublishedAt']=='2014-04-01'
prior300=json.loads((ROOT/'catalogue/prior-300-preservation.json').read_text())
assert len(prior300)==250
for id,digest in prior300.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 300-record release changed'
twentieth_rows=[p for p in additions if p['id'] in twentieth]
assert all(p['sourceReviewedAt']=='2026-10-30' and p['reportedStatus']=='reported-operation' and p['recordScope']=='test-centre' for p in twentieth_rows)
assert len({p['where'] for p in twentieth_rows})==5
assert next(p for p in twentieth_rows if p['id']=='umd-st-marys-uroc')['sourcePublishedAt']=='2022-10-20'
assert all(p['sourcePublishedAt'] is None for p in twentieth_rows if p['id']!='umd-st-marys-uroc')
prior294=json.loads((ROOT/'catalogue/prior-294-preservation.json').read_text())
assert len(prior294)==244
for id,digest in prior294.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 294-record release changed'
nineteenth_rows=[p for p in additions if p['id'] in nineteenth]
assert all(p['sourceReviewedAt']=='2026-10-30' and p['reportedStatus']=='historical' and p['recordScope']=='centre' for p in nineteenth_rows)
assert len({p['where'] for p in nineteenth_rows})==6
assert all(any('vcij-droneup' in v['url'] for v in p['supportingSources']) for p in nineteenth_rows)
assert 'Belt Line' in next(p for p in nineteenth_rows if p['id']=='droneup-walmart-2976')['reviewNotes']
assert 'Research Drive' in next(p for p in nineteenth_rows if p['id']=='droneup-walmart-2974')['reviewNotes']
prior290=json.loads((ROOT/'catalogue/prior-290-preservation.json').read_text())
assert len(prior290)==240
for id,digest in prior290.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 290-record release changed'
eighteenth_rows=[p for p in additions if p['id'] in eighteenth]
assert all(p['sourceReviewedAt']=='2026-10-30' and p['reportedStatus']=='reported-operation' for p in eighteenth_rows)
assert sum(p['recordScope']=='test-centre' for p in eighteenth_rows)==2
assert sum(p['recordScope']=='centre' for p in eighteenth_rows)==2
assert all('five kilometres' in p['reviewNotes'] for p in eighteenth_rows if p['recordScope']=='test-centre')
prior286=json.loads((ROOT/'catalogue/prior-286-preservation.json').read_text())
assert len(prior286)==236
for id,digest in prior286.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 286-record release changed'
new_rows=[p for p in additions if p['id'] in seventeenth]
assert all(p['sourceReviewedAt']=='2026-10-30' for p in new_rows)
assert sum(p['reportedStatus']=='reported-operation' for p in new_rows)==3
trial=next(p for p in new_rows if p['id']=='huangpu-red-wine-street-trial')
assert trial['reportedStatus']=='trial' and trial['recordScope']=='trial-site'
assert 'not established' in trial['reportedOperator']
prior280=json.loads((ROOT/'catalogue/prior-280-preservation.json').read_text())
assert len(prior280)==230
for id,digest in prior280.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 280-record release changed'
sixteenth_rows=[p for p in additions if p['id'] in sixteenth]
assert all(p['recordScope']=='centre' and p['reportedStatus']=='reported-operation' for p in sixteenth_rows)
assert all(p['sourceReviewedAt']=='2026-10-29' and p['country']=='China' for p in sixteenth_rows)
assert len({p['where'] for p in sixteenth_rows})==6
nancun=next(p for p in sixteenth_rows if p['id']=='nancun-cultural-square-delivery')
assert 'not established' in nancun['reportedOperator'] and nancun['sourcePublishedAt']=='2024-12-08'
assert 'Shiyan' in next(p for p in sixteenth_rows if p['id']=='fengyi-xinan-logistics-centre')['reviewNotes']
assert 'Holiday Plaza' in next(p for p in sixteenth_rows if p['id']=='meituan-xili-yitian-holiday-li')['reviewNotes']
prior275=json.loads((ROOT/'catalogue/prior-275-preservation.json').read_text())
assert len(prior275)==225
for id,digest in prior275.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 275-record release changed'
fifteenth_rows=[p for p in additions if p['id'] in fifteenth]
assert all(p['recordScope']=='centre' and p['reportedStatus']=='reported-operation' for p in fifteenth_rows)
assert all(p['sourceReviewedAt']=='2026-10-29' and p['country']=='China' for p in fifteenth_rows)
assert len({p['where'] for p in fifteenth_rows})==5
assert sum(p['reportedOperator']=='Meituan' for p in fifteenth_rows)==4
assert 'Futian' in next(p for p in fifteenth_rows if p['id']=='meituan-galaxy-world')['reviewNotes']
assert 'Luohu' in next(p for p in fifteenth_rows if p['id']=='meituan-baoneng-nanshan')['reviewNotes']
assert 'Xin’an' in next(p for p in fifteenth_rows if p['id']=='fengyi-shiyan-hub')['reviewNotes']
prior270=json.loads((ROOT/'catalogue/prior-270-preservation.json').read_text())
assert len(prior270)==220
for id,digest in prior270.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 270-record release changed'
fourteenth_rows=[p for p in additions if p['id'] in fourteenth]
assert all(p['recordScope']=='centre' and p['reportedStatus']=='reported-operation' for p in fourteenth_rows)
assert all(p['sourceReviewedAt']=='2026-10-29' and p['country']=='China' for p in fourteenth_rows)
assert len({p['where'] for p in fourteenth_rows})==5
longhua=next(p for p in fourteenth_rows if p['id']=='meituan-longhua-tianhong')
assert 'across the street' in longhua['reviewNotes'] and 'Fendouzhe Square' in longhua['reviewNotes']
assert 'M-Port 3' not in longhua['reportedEquipment']
assert all(p['sourcePublishedAt'] for p in fourteenth_rows)
prior265=json.loads((ROOT/'catalogue/prior-265-preservation.json').read_text())
assert len(prior265)==215
for id,digest in prior265.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 265-record release changed'
thirteenth_rows=[p for p in additions if p['id'] in thirteenth]
assert all(p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' for p in thirteenth_rows)
assert all(p['sourceReviewedAt']=='2026-10-29' for p in thirteenth_rows)
assert next(p for p in thirteenth_rows if p['id']=='tawhaki-kaitorete')['country']=='New Zealand'
vt=[p for p in thirteenth_rows if p['id'].startswith('virginia-tech-')]
assert len(vt)==2 and len({p['where'] for p in vt})==2
assert all('Kentland' in p['reviewNotes'] for p in vt)
prior260=json.loads((ROOT/'catalogue/prior-260-preservation.json').read_text())
assert len(prior260)==210
for id,digest in prior260.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 260-record release changed'
twelfth_rows=[p for p in additions if p['id'] in twelfth]
assert sum(p['recordScope']=='test-centre' for p in twelfth_rows)==4
assert next(p for p in twelfth_rows if p['id']=='isala-meppel-medical-trial')['reportedStatus']=='trial'
assert all(p['reportedStatus']=='reported-operation' for p in twelfth_rows if p['recordScope']=='test-centre')
assert all(p['sourceReviewedAt']=='2026-10-29' for p in twelfth_rows)
assert 'continuous availability is not established' in next(p for p in twelfth_rows if p['id']=='cloncurry-flight-test-range')['reviewNotes']
prior255=json.loads((ROOT/'catalogue/prior-255-preservation.json').read_text())
assert len(prior255)==205
for id,digest in prior255.items():
 p=next(p for p in additions if p['id']==id)
 # This baseline includes the four reviewed corrections from release 255.
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 255-record release changed'
for p in [p for p in additions if p['id'] in eleventh]:
 assert p['reportedStatus']=='trial' and p['sourceReviewedAt']=='2026-10-29'
 assert p['sourceType'] in {'government','operator','research'}
assert next(p for p in additions if p['id']=='sao-joao-porto-trial')['country']=='Portugal'
assert 'not a completed facility' in next(p for p in additions if p['id']=='sao-joao-porto-trial')['reviewNotes']
for id,status in [('wing-stonebriar-centre','reported-operation'),('wing-hulen-mall','reported-operation'),('wing-denton-loop-288','reported-operation'),('rigitech-coppet-laboratory','trial'),('wing-coles-ormeau','historical')]:
 assert next(p for p in additions if p['id']==id)['reportedStatus']==status
prior240=json.loads((ROOT/'catalogue/prior-240-preservation.json').read_text())
assert len(prior240)==190
for id,digest in prior240.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(preserved_record(p),ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 240-record release changed'
ninth_rows=[p for p in additions if p['id'] in ninth]
houston=[p for p in ninth_rows if p['id'].startswith('wing-houston-')]
assert len(houston)==8 and len({p['where'] for p in houston})==8
assert all(p['reportedStatus']=='reported-operation' for p in houston)
assert next(p for p in ninth_rows if p['id']=='zipline-denton-university')['reportedStatus']=='announced'
assert next(p for p in ninth_rows if p['id']=='zipline-rowlett-network')['recordScope']=='network'
prior210=json.loads((ROOT/'catalogue/prior-210-preservation.json').read_text())
assert len(prior210)==160
for id,digest in prior210.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(preserved_record(p),ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 210-record release changed'
new=[p for p in additions if p['id'] in eighth]
retail=[p for p in new if p['id'].startswith('droneup-walmart-')]
assert len(retail)==18 and len({p['where'] for p in retail})==18
assert not {'droneup-walmart-2695','droneup-walmart-5299'}&set(eighth), 'Existing Wing origins counted again'
for p in retail:
 assert p['reportedStatus']=='historical'
 assert any('whro.org/' in source['url'] for source in p['supportingSources']), 'Missing later partnership-status evidence'
for id in ['healthdrone-svendborg','biogroup-bourgoin-jallieu']:
 assert next(p for p in new if p['id']==id)['reportedStatus']=='trial'
assert next(p for p in new if p['id']=='dpd-mont-saint-martin')['recordScope']=='receiving-terminal'
assert next(p for p in new if p['id']=='ddc-georgina-island')['recordScope']=='network'
prior180=json.loads((ROOT/'catalogue/prior-180-preservation.json').read_text())
assert len(prior180)==130
for id,digest in prior180.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(preserved_record(p),ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 180-record release changed'
for id in ['manna-oranmore-tesco','manna-balbriggan-millfield','manna-blanchardstown','manna-junction-6','flytrex-holly-springs']:
 assert next(p for p in additions if p['id']==id)['reportedStatus']=='historical'
assert sum(p['recordScope']=='test-centre' for p in additions if p['id'] in seventh)==14
prior150=json.loads((ROOT/'catalogue/prior-150-preservation.json').read_text())
assert len(prior150)==100
for id,digest in prior150.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(preserved_record(p),ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 150-record release changed'
for id in ['wing-walmart-charlotte-callabridge','wing-walmart-charlotte-independence','wing-nrh-bisd','zipline-dallas-forest','harford-county-dfr']:
 assert next(p for p in additions if p['id']==id)['reportedStatus']=='announced'
prior140=json.loads((ROOT/'catalogue/prior-140-preservation.json').read_text())
assert len(prior140)==90
for id,digest in prior140.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(preserved_record(p),ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 140-record release changed'
for id in ['aeronext-sakai','shinshiro-sakude-trial','nara-tsukigase-ono-ono','nara-yagyu-school','japan-post-okutama','japan-post-izushi','japan-post-iruka']:
 assert next(p for p in additions if p['id']==id)['reportedStatus']=='trial'
prior130=json.loads((ROOT/'catalogue/prior-130-preservation.json').read_text())
assert len(prior130)==80
for id,digest in prior130.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(preserved_record(p),ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 130-record release changed'
for id in ['aeronext-tsuruga-arachi','inhambane-medical-drone-study']:
 assert next(p for p in additions if p['id']==id)['reportedStatus']=='historical'
assert next(p for p in additions if p['id']=='abu-dhabi-skygo-matternet')['reportedStatus']=='announced'
assert next(p for p in additions if p['id']=='aeronext-shintotsukawa')['reportedStatus']=='trial'
prior=json.loads((ROOT/'catalogue/prior-100-preservation.json').read_text())
assert len(prior)==50
for id,digest in prior.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(preserved_record(p),ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 100-record release changed'
for id in ['wing-walmart-942','wing-walmart-5299','wing-walmart-725']:
 assert next(p for p in additions if p['id']==id)['reportedStatus']=='announced'
for id in ['oban-argyll-medical-trial','dhl-reit-im-winkl']:
 assert next(p for p in additions if p['id']==id)['reportedStatus']=='historical'
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
  assert escape(p['source']['url'],quote=True) in raw and p['sourceReviewedAt'] in raw and p['coordinateBasis'] in raw
  for evidence in p.get('supportingSources',[]):
   assert escape(evidence['url'],quote=True) in raw and escape(evidence['name']) in raw
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
for kind in ['id','entity','signature','source','status','review','latitude','longitude','date','source-type','support-url','support-name','support-shape']:
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
 if kind=='support-url':bad[0]['supportingSources']=[{'name':'Unsafe','url':'javascript:alert(1)'}]
 if kind=='support-name':bad[0]['supportingSources']=[{'name':'','url':'https://example.org'}]
 if kind=='support-shape':bad[0]['supportingSources']='invalid'
 if kind=='source-type':bad[0]['sourceType']='anonymous-invention'
 try:validate(seed,bad)
 except (AssertionError,ValueError):pass
 else:raise AssertionError('Invalid input accepted: '+kind)
# The generated template escapes source data rather than treating it as HTML.
unsafe=copy.deepcopy(additions[0]);unsafe['name']='<img src=x onerror=alert(1)>'
unsafe['supportingSources']=[{'name':'<script>bad()</script>','url':'https://example.org/?a=1&b=2'}]
html=passport(unsafe,(ROOT/'src/projects/kiel/index.html').read_text())
assert '<script>bad()</script>' not in html and '&lt;script&gt;bad()&lt;/script&gt;' in html
assert 'https://example.org/?a=1&amp;b=2' in html
assert '<img src=x onerror=' not in html and '&lt;img src=x onerror=' in html
before={p.relative_to(ROOT/'dist').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'dist').rglob('*') if p.is_file()}
subprocess.run([sys.executable,'scripts/build_catalogue.py'],cwd=ROOT,check=True)
after={p.relative_to(ROOT/'dist').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'dist').rglob('*') if p.is_file()}
assert before==after,'Build must be deterministic'
print(f'PASS: {len(rows)} records, {len(additions)} sourced additions, aligned exports, generated passports, safe input and deterministic build')
