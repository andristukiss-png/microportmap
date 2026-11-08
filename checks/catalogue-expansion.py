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
assert twenty_second==batch['releases'][21]['recordIds'] and len(twenty_second)==6
twenty_third=json.loads((ROOT/'catalogue/twenty-third-batch-ids.json').read_text())
assert twenty_third==batch['releases'][22]['recordIds'] and len(twenty_third)==5
prior316=json.loads((ROOT/'catalogue/prior-316-preservation.json').read_text())
assert len(prior316)==266
for id,digest in prior316.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 316-record release changed'
twenty_third_rows=[p for p in additions if p['id'] in twenty_third]
assert all(p['sourceReviewedAt']=='2026-10-30' and p['region']=='Asia' for p in twenty_third_rows)
assert len({p['where'] for p in twenty_third_rows})==5
pixel=next(p for p in twenty_third_rows if p['id']=='singapore-pixel-h3-test-origin')
assert pixel['reportedStatus']=='historical' and pixel['sourcePublishedAt']=='2024-10-25'
assert next(p for p in twenty_third_rows if p['id']=='taiki-hospo-uav-runway')['sourcePublishedAt']=='2026-10-04'
assert all('F-REI' in p['reportedOperator'] for p in twenty_third_rows if p['id'].startswith('fukushima-rtf-'))
assert sum(p['recordScope']=='test-centre' for p in twenty_third_rows)==4
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

# Preserve the full previous release and distinguish planned sites from a completed trial.
twenty_fourth=json.loads((ROOT/'catalogue/twenty-fourth-batch-ids.json').read_text())
assert twenty_fourth==batch['releases'][23]['recordIds'] and len(twenty_fourth)==4
prior321=json.loads((ROOT/'catalogue/prior-321-preservation.json').read_text())
assert len(prior321)==271
for id,digest in prior321.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 321-record release changed'
new_rows=[p for p in additions if p['id'] in twenty_fourth]
assert all(p['country']=='Finland' and p['sourceReviewedAt']=='2026-10-30' for p in new_rows)
assert len({p['where'] for p in new_rows})==4
assert sum(p['reportedStatus']=='announced' and p['sourcePublishedAt'] is None for p in new_rows)==3
assert next(p for p in new_rows if p['id']=='ouluzone-wireless-drone-test')['reportedStatus']=='trial'

# The next batch adds two campuses, not their component facilities or programmes.
twenty_fifth=json.loads((ROOT/'catalogue/twenty-fifth-batch-ids.json').read_text())
assert twenty_fifth==batch['releases'][24]['recordIds'] and len(twenty_fifth)==2
prior325=json.loads((ROOT/'catalogue/prior-325-preservation.json').read_text())
assert len(prior325)==275
for id,digest in prior325.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 325-record release changed'
new_rows=[p for p in additions if p['id'] in twenty_fifth]
assert {p['country'] for p in new_rows}=={'Netherlands','Switzerland'}
assert all(p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['sourcePublishedAt'] is None for p in new_rows)
assert all(p['sourceReviewedAt']=='2026-10-30' and len(p['supportingSources'])==2 for p in new_rows)

# Preserve prior research and keep flight enclosures scoped to two facilities.
twenty_sixth=json.loads((ROOT/'catalogue/twenty-sixth-batch-ids.json').read_text())
assert twenty_sixth==batch['releases'][25]['recordIds'] and len(twenty_sixth)==2
prior327=json.loads((ROOT/'catalogue/prior-327-preservation.json').read_text())
assert len(prior327)==277
for id,digest in prior327.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 327-record release changed'
new_rows=[p for p in additions if p['id'] in twenty_sixth]
assert all(p['country']=='United States' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' for p in new_rows)
assert all(p['sourceReviewedAt']=='2026-10-30' and p['sourcePublishedAt'] is None for p in new_rows)
assert len({p['where'] for p in new_rows})==2

# Preserve the previous release and distinguish current-source experiments from archive evidence.
twenty_seventh=json.loads((ROOT/'catalogue/twenty-seventh-batch-ids.json').read_text())
assert twenty_seventh==batch['releases'][26]['recordIds'] and len(twenty_seventh)==2
prior329=json.loads((ROOT/'catalogue/prior-329-preservation.json').read_text())
assert len(prior329)==279
for id,digest in prior329.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 329-record release changed'
cyberzoo=next(p for p in additions if p['id']=='tu-delft-cyberzoo')
assert cyberzoo['reportedStatus']=='trial' and cyberzoo['sourcePublishedAt']=='2026-05-13'
arena=next(p for p in additions if p['id']=='eth-flying-machine-arena')
assert arena['reportedStatus']=='historical' and arena['sourcePublishedAt'] is None
assert arena['source']['url'].startswith('https://idsc.ethz.ch/')
assert all(p['sourceReviewedAt']=='2026-10-30' and len(p['supportingSources'])==1 for p in [cyberzoo,arena])

# Preserve all earlier records and the single-arena counting decision.
twenty_eighth=json.loads((ROOT/'catalogue/twenty-eighth-batch-ids.json').read_text())
assert twenty_eighth==batch['releases'][27]['recordIds']==['caltech-cast-aerodrome']
prior331=json.loads((ROOT/'catalogue/prior-331-preservation.json').read_text())
assert len(prior331)==281
for id,digest in prior331.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 331-record release changed'
cast=next(p for p in additions if p['id']=='caltech-cast-aerodrome')
assert cast['reportedStatus']=='reported-operation' and cast['sourcePublishedAt'] is None
assert cast['recordScope']=='test-centre' and cast['sourceReviewedAt']=='2026-10-30'
assert cast['source']['url']=='https://cast.caltech.edu/facilities'
assert len(cast['supportingSources'])==1

# One DTU arena; earlier catalogue remains unchanged.
twenty_ninth=json.loads((ROOT/'catalogue/twenty-ninth-batch-ids.json').read_text())
assert twenty_ninth==batch['releases'][28]['recordIds']==['dtu-asta-lyngby']
prior332=json.loads((ROOT/'catalogue/prior-332-preservation.json').read_text())
assert len(prior332)==282
for id,digest in prior332.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 332-record release changed'
asta=next(p for p in additions if p['id']=='dtu-asta-lyngby')
assert asta['reportedStatus']=='reported-operation' and asta['sourcePublishedAt'] is None
assert asta['recordScope']=='test-centre' and asta['sourceReviewedAt']=='2026-10-31'
assert asta['source']['url']=='https://asta.dtu.dk/' and asta['country']=='Denmark'

# Preserve earlier research and keep the indoor and outdoor Bristol sites distinct.
thirtieth=json.loads((ROOT/'catalogue/thirtieth-batch-ids.json').read_text())
assert thirtieth==batch['releases'][29]['recordIds'] and len(thirtieth)==2
prior333=json.loads((ROOT/'catalogue/prior-333-preservation.json').read_text())
assert len(prior333)==283
for id,digest in prior333.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 333-record release changed'
bristol=[p for p in additions if p['id'] in thirtieth]
assert len({p['where'] for p in bristol})==2
assert all(p['reportedStatus']=='reported-operation' and p['sourcePublishedAt'] is None and p['sourceReviewedAt']=='2026-10-31' for p in bristol)
assert all(p['recordScope']=='test-centre' and p['country']=='United Kingdom' and p['supportingSources'] for p in bristol)

# Distinguish the university enclosure from the unrelated SOAR dock programme.
thirty_first=json.loads((ROOT/'catalogue/thirty-first-batch-ids.json').read_text())
assert thirty_first==batch['releases'][30]['recordIds']==['buffalo-soar-research-enclosure']
prior335=json.loads((ROOT/'catalogue/prior-335-preservation.json').read_text())
assert len(prior335)==285
for id,digest in prior335.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 335-record release changed'
soar=next(p for p in additions if p['id']=='buffalo-soar-research-enclosure')
assert soar['reportedStatus']=='reported-operation' and soar['sourcePublishedAt'] is None
assert soar['recordScope']=='test-centre' and soar['sourceReviewedAt']=='2026-10-31'
assert soar['where']=='Amherst, New York, United States' and len(soar['supportingSources'])==2

# Two research arenas, with no inferred outdoor sites or installed planned equipment.
thirty_second=json.loads((ROOT/'catalogue/thirty-second-batch-ids.json').read_text())
assert thirty_second==batch['releases'][31]['recordIds'] and len(thirty_second)==2
prior336=json.loads((ROOT/'catalogue/prior-336-preservation.json').read_text())
assert len(prior336)==286
for id,digest in prior336.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 336-record release changed'
new_arenas=[p for p in additions if p['id'] in thirty_second]
assert {p['country'] for p in new_arenas}=={'United Kingdom','Italy'}
assert all(p['reportedStatus']=='reported-operation' and p['sourcePublishedAt'] is None and p['sourceReviewedAt']=='2026-10-31' for p in new_arenas)
assert all(p['recordScope']=='test-centre' and len(p['supportingSources'])==1 for p in new_arenas)

# Preserve earlier records and distinguish relocation from source publication.
thirty_third=json.loads((ROOT/'catalogue/thirty-third-batch-ids.json').read_text())
assert thirty_third==batch['releases'][32]['recordIds'] and len(thirty_third)==2
prior338=json.loads((ROOT/'catalogue/prior-338-preservation.json').read_text())
assert len(prior338)==288
for id,digest in prior338.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 338-record release changed'
new_australian=[p for p in additions if p['id'] in thirty_third]
assert all(p['country']=='Australia' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' for p in new_australian)
assert next(p for p in new_australian if p['id']=='macquarie-indoor-flight-facility')['sourcePublishedAt'] is None
assert next(p for p in new_australian if p['id']=='unsw-canberra-lirta')['sourcePublishedAt']=='2026-05-12'

# Distinct university arenas; no extra sites from equipment or office addresses.
thirty_fourth=json.loads((ROOT/'catalogue/thirty-fourth-batch-ids.json').read_text())
assert thirty_fourth==batch['releases'][33]['recordIds'] and len(thirty_fourth)==2
prior340=json.loads((ROOT/'catalogue/prior-340-preservation.json').read_text())
assert len(prior340)==290
for id,digest in prior340.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 340-record release changed'
new_labs=[p for p in additions if p['id'] in thirty_fourth]
assert {p['country'] for p in new_labs}=={'Australia','United States'}
assert all(p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and len(p['supportingSources'])==1 for p in new_labs)
assert next(p for p in new_labs if p['id']=='houston-alaic-flight-arena')['sourcePublishedAt'] is None
assert next(p for p in new_labs if p['id']=='federation-gippsland-flight-lab')['sourcePublishedAt']=='2025-11-04'

# Preserve existing records and distinguish indoor/outdoor structures and source dates.
thirty_fifth=json.loads((ROOT/'catalogue/thirty-fifth-batch-ids.json').read_text())
assert thirty_fifth==batch['releases'][34]['recordIds'] and len(thirty_fifth)==4
prior342=json.loads((ROOT/'catalogue/prior-342-preservation.json').read_text())
assert len(prior342)==292
for id,digest in prior342.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 342-record release changed'
new_facilities={p['id']:p for p in additions if p['id'] in thirty_fifth}
assert {p['country'] for p in new_facilities.values()}=={'Australia','Italy','Austria'}
assert all(p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' for p in new_facilities.values())
assert new_facilities['cdu-katherine-air-f']['sourcePublishedAt']=='2025-09-09'
assert new_facilities['naples-prisma-flare']['sourcePublishedAt'] is None
assert new_facilities['klagenfurt-indoor-drone-hall']['sourcePublishedAt'] is None
assert new_facilities['klagenfurt-outdoor-odsa']['sourcePublishedAt']=='2026-06-03'
assert len(new_facilities['klagenfurt-outdoor-odsa']['supportingSources'])==2

# Distinct Delft facilities and a source-qualified Kamenz hangar.
thirty_sixth=json.loads((ROOT/'catalogue/thirty-sixth-batch-ids.json').read_text())
assert thirty_sixth==batch['releases'][35]['recordIds'] and len(thirty_sixth)==3
prior346=json.loads((ROOT/'catalogue/prior-346-preservation.json').read_text())
assert len(prior346)==296
for id,digest in prior346.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 346-record release changed'
new36={p['id']:p for p in additions if p['id'] in thirty_sixth}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' for p in new36.values())
assert new36['miteb-kamenz-hangar']['sourcePublishedAt']=='2026-10-22'
assert new36['miteb-kamenz-hangar']['where']=='Kamenz, Saxony, Germany'
assert all(new36[id]['sourcePublishedAt'] is None for id in ['tu-delft-mobile-robotics-lab','tu-delft-swarming-lab'])
assert all(len(p['supportingSources'])==1 for p in new36.values())

# University arenas retain unknown dates and unfinished-construction context.
thirty_seventh=json.loads((ROOT/'catalogue/thirty-seventh-batch-ids.json').read_text())
assert thirty_seventh==batch['releases'][36]['recordIds'] and len(thirty_seventh)==3
prior349=json.loads((ROOT/'catalogue/prior-349-preservation.json').read_text())
assert len(prior349)==299
for id,digest in prior349.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 349-record release changed'
new37={p['id']:p for p in additions if p['id'] in thirty_seventh}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['country']=='United States' for p in new37.values())
assert new37['johns-hopkins-robodrome']['sourcePublishedAt']=='2026-07-14'
assert 'completion and additional netting were still planned' in new37['johns-hopkins-robodrome']['reviewNotes']
assert all(new37[id]['sourcePublishedAt'] is None for id in ['ut-knoxville-asl-flight-arena','alabama-ascl-flight-arena'])

# Three distinct European research arenas; publication dates remain unknown.
thirty_eighth=json.loads((ROOT/'catalogue/thirty-eighth-batch-ids.json').read_text())
assert thirty_eighth==batch['releases'][37]['recordIds'] and len(thirty_eighth)==3
prior352=json.loads((ROOT/'catalogue/prior-352-preservation.json').read_text())
assert len(prior352)==302
for id,digest in prior352.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 352-record release changed'
new38={p['id']:p for p in additions if p['id'] in thirty_eighth}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['region']=='Europe' and p['sourcePublishedAt'] is None for p in new38.values())
assert new38['tum-garching-flying-systems-lab']['where']=='Garching bei München, Germany'
assert 'contact office is not asserted to be the arena room' in new38['epfl-lis-flight-arena']['reviewNotes']
assert all(len(p['supportingSources'])==1 for p in new38.values())

# A combined Brest facility and distinct Raleigh indoor/outdoor research sites.
thirty_ninth=json.loads((ROOT/'catalogue/thirty-ninth-batch-ids.json').read_text())
assert thirty_ninth==batch['releases'][38]['recordIds'] and len(thirty_ninth)==3
prior355=json.loads((ROOT/'catalogue/prior-355-preservation.json').read_text())
assert len(prior355)==305
for id,digest in prior355.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 355-record release changed'
new39={p['id']:p for p in additions if p['id'] in thirty_ninth}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' for p in new39.values())
assert new39['ensta-brest-air-sea-facility']['sourcePublishedAt']=='2026-06-24'
assert new39['nc-state-lake-wheeler-uas-field']['sourcePublishedAt']=='2021-11-09'
assert new39['nc-state-aeris-indoor-arena']['sourcePublishedAt'] is None
assert 'not counted or assumed complete' in new39['nc-state-aeris-indoor-arena']['reviewNotes']

# Three separately located research sites; historical page updates are not publication dates.
fortieth=json.loads((ROOT/'catalogue/fortieth-batch-ids.json').read_text())
assert fortieth==batch['releases'][39]['recordIds'] and len(fortieth)==3
prior358=json.loads((ROOT/'catalogue/prior-358-preservation.json').read_text())
assert len(prior358)==308
for id,digest in prior358.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 358-record release changed'
new40={p['id']:p for p in additions if p['id'] in fortieth}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' for p in new40.values())
assert new40['cmu-hazelwood-ric-drone-cage']['sourcePublishedAt']=='2026-02-27'
assert all(new40[id]['sourcePublishedAt'] is None for id in ['itg-coruna-experimentation-centre','hsu-hamburg-inspection-drone-cage'])
assert 'last changed 15 April 2021' in new40['hsu-hamburg-inspection-drone-cage']['reviewNotes']
assert 'not separate records' in new40['itg-coruna-experimentation-centre']['reviewNotes']

# Three US research enclosures, with historical expansion limits retained.
forty_first=json.loads((ROOT/'catalogue/forty-first-batch-ids.json').read_text())
assert forty_first==batch['releases'][40]['recordIds'] and len(forty_first)==3
prior361=json.loads((ROOT/'catalogue/prior-361-preservation.json').read_text())
assert len(prior361)==311
for id,digest in prior361.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 361-record release changed'
new41={p['id']:p for p in additions if p['id'] in forty_first}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['country']=='United States' for p in new41.values())
assert new41['uc-cincinnati-digital-futures-cage']['sourcePublishedAt']=='2026-10-29'
assert new41['uc-san-diego-aerodrome']['sourcePublishedAt']=='2018-01-25'
assert new41['northeastern-burlington-ecuas']['sourcePublishedAt']=='2019-04-08'
assert 'not counted or assumed completed' in new41['uc-san-diego-aerodrome']['reviewNotes']
assert 'distinct from Cincinnati Police' in new41['uc-cincinnati-digital-futures-cage']['reviewNotes']

# Distinct Sheffield teaching/research spaces and Manchester tracking arena.
forty_second=json.loads((ROOT/'catalogue/forty-second-batch-ids.json').read_text())
assert forty_second==batch['releases'][41]['recordIds'] and len(forty_second)==3
prior364=json.loads((ROOT/'catalogue/prior-364-preservation.json').read_text())
assert len(prior364)==314
for id,digest in prior364.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 364-record release changed'
new42={p['id']:p for p in additions if p['id'] in forty_second}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['country']=='United Kingdom' for p in new42.values())
assert new42['sheffield-kroto-drone-lab']['sourcePublishedAt'] is None
assert new42['sheffield-diamond-drone-enclosure']['sourcePublishedAt'] is None
assert new42['manchester-aerospace-tracking-arena']['sourcePublishedAt']=='2026-10-05'
assert 'different camera count' in new42['sheffield-kroto-drone-lab']['reviewNotes']
assert 'distinct from the Kroto' in new42['sheffield-diamond-drone-enclosure']['reviewNotes']

# Three university arenas with equipment, institutional aliases and future flights separated.
forty_third=json.loads((ROOT/'catalogue/forty-third-batch-ids.json').read_text())
assert forty_third==batch['releases'][42]['recordIds'] and len(forty_third)==3
prior367=json.loads((ROOT/'catalogue/prior-367-preservation.json').read_text())
assert len(prior367)==317
for id,digest in prior367.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 367-record release changed'
new43={p['id']:p for p in additions if p['id'] in forty_third}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['country']=='United Kingdom' for p in new43.values())
assert new43['liverpool-dif-extreme-environment-lab']['sourcePublishedAt'] is None
assert new43['ntu-robotics-test-arena']['sourcePublishedAt'] is None
assert new43['cranfield-drone-flight-arena']['sourcePublishedAt']=='2025-12-10'
assert 'not assumed completed' in new43['cranfield-drone-flight-arena']['reviewNotes']
assert 'not two locations' in new43['ntu-robotics-test-arena']['reviewNotes']

# University cages and an operator lab; historic closure and mailing locality caveats.
forty_fourth=json.loads((ROOT/'catalogue/forty-fourth-batch-ids.json').read_text())
assert forty_fourth==batch['releases'][43]['recordIds'] and len(forty_fourth)==3
prior370=json.loads((ROOT/'catalogue/prior-370-preservation.json').read_text())
assert len(prior370)==320
for id,digest in prior370.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 370-record release changed'
new44={p['id']:p for p in additions if p['id'] in forty_fourth}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['country']=='United States' for p in new44.values())
assert new44['csulb-pack-drone-cage']['sourcePublishedAt']=='2025-11-24'
assert new44['uw-seattle-bowman-flight-arena']['sourcePublishedAt']=='2020-11-23'
assert new44['matrix-beavercreek-drone-lab']['sourcePublishedAt'] is None
assert new44['matrix-beavercreek-drone-lab']['sourceType']=='operator'
assert 'does not establish current closure or reopening' in new44['uw-seattle-bowman-flight-arena']['reviewNotes']
assert 'two sites' in new44['matrix-beavercreek-drone-lab']['reviewNotes']

# University test sites: one facility each, with uncertain dimensions and dates explicit.
forty_fifth=json.loads((ROOT/'catalogue/forty-fifth-batch-ids.json').read_text())
assert forty_fifth==batch['releases'][44]['recordIds'] and len(forty_fifth)==3
prior373=json.loads((ROOT/'catalogue/prior-373-preservation.json').read_text())
assert len(prior373)==323
for id,digest in prior373.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 373-record release changed'
new45={p['id']:p for p in additions if p['id'] in forty_fifth}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['country']=='United States' and p['sourceType']=='research' and p['sourcePublishedAt'] is None for p in new45.values())
assert 'different enclosure heights' in new45['unt-denton-uaam-test-facility']['reviewNotes']
assert 'different arena dimensions' in new45['illinois-urbana-flying-arena']['reviewNotes']
assert 'does not authorize airfield use' in new45['csu-fort-collins-christman-airfield']['reviewNotes']

# Distinct university flight spaces; facility aliases and office addresses do not add sites.
forty_sixth=json.loads((ROOT/'catalogue/forty-sixth-batch-ids.json').read_text())
assert forty_sixth==batch['releases'][45]['recordIds'] and len(forty_sixth)==3
prior376=json.loads((ROOT/'catalogue/prior-376-preservation.json').read_text())
assert len(prior376)==326
for id,digest in prior376.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 376-record release changed'
new46={p['id']:p for p in additions if p['id'] in forty_sixth}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['sourceType']=='research' for p in new46.values())
assert new46['toronto-myhal-flight-arena']['sourcePublishedAt']=='2023-06-08'
assert new46['toronto-myhal-flight-arena']['country']=='Canada'
assert new46['umd-college-park-brin-drone-lab']['sourcePublishedAt'] is None
assert new46['illinois-urbana-stock-pavilion']['sourcePublishedAt'] is None
assert 'manager’s IDEA Factory office' in new46['umd-college-park-brin-drone-lab']['reviewNotes']
assert 'separately listed' in new46['illinois-urbana-stock-pavilion']['reviewNotes']

# European research facilities: proposed tracking, integrated areas and lab scope explicit.
forty_seventh=json.loads((ROOT/'catalogue/forty-seventh-batch-ids.json').read_text())
assert forty_seventh==batch['releases'][46]['recordIds'] and len(forty_seventh)==3
prior379=json.loads((ROOT/'catalogue/prior-379-preservation.json').read_text())
assert len(prior379)==329
for id,digest in prior379.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 379-record release changed'
new47={p['id']:p for p in additions if p['id'] in forty_seventh}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['sourceType']=='research' and p['sourcePublishedAt'] is None and p['region']=='Europe' for p in new47.values())
assert new47['ctu-prague-indoor-flight-arena']['country']=='Czech Republic'
assert 'not assumed installed' in new47['ctu-prague-indoor-flight-arena']['reviewNotes']
assert 'not four sites' in new47['naitec-estella-logistics-lab']['reviewNotes']
assert 'not a documented dedicated flight arena' in new47['sintef-trondheim-drone-laboratory']['reviewNotes']

# University arenas distinguished from already catalogued off-campus facilities.
forty_eighth=json.loads((ROOT/'catalogue/forty-eighth-batch-ids.json').read_text())
assert forty_eighth==batch['releases'][47]['recordIds'] and len(forty_eighth)==3
prior382=json.loads((ROOT/'catalogue/prior-382-preservation.json').read_text())
assert len(prior382)==332
for id,digest in prior382.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 382-record release changed'
new48={p['id']:p for p in additions if p['id'] in forty_eighth}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['sourceType']=='research' and p['country']=='United States' for p in new48.values())
assert new48['northeastern-boston-exp-drone-cage']['sourcePublishedAt']=='2025-08-29'
assert new48['cmu-pittsburgh-scaife-drone-arena']['sourcePublishedAt'] is None
assert new48['oru-tulsa-tandy-drone-arena']['sourcePublishedAt']=='2024-11-08'
assert 'distinct from the existing Burlington' in new48['northeastern-boston-exp-drone-cage']['reviewNotes']
assert 'distinct from the Hazelwood' in new48['cmu-pittsburgh-scaife-drone-arena']['reviewNotes']

# Separate facilities, honest dates and preservation of the prior release.
forty_ninth=json.loads((ROOT/'catalogue/forty-ninth-batch-ids.json').read_text())
assert forty_ninth==batch['releases'][48]['recordIds'] and len(forty_ninth)==3
prior385=json.loads((ROOT/'catalogue/prior-385-preservation.json').read_text())
assert len(prior385)==335
for id,digest in prior385.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 385-record release changed'
new49={p['id']:p for p in additions if p['id'] in forty_ninth}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['sourceType']=='research' and p['sourcePublishedAt'] is None for p in new49.values())
assert new49['sherbrooke-3it-drone-flight-room']['country']=='Canada'
assert 'distinct from the Reno-Stead' in new49['unr-reno-applied-research-drone-arena']['reviewNotes']
assert 'original cage closed' in new49['csueb-hayward-braddock-drone-lab']['reviewNotes']
assert 'submitted 13 October 2025' in new49['csueb-hayward-braddock-drone-lab']['reportDateLabel']

# Physical flight rooms, unknown publication dates and unchanged prior records.
fiftieth=json.loads((ROOT/'catalogue/fiftieth-batch-ids.json').read_text())
assert fiftieth==batch['releases'][49]['recordIds'] and len(fiftieth)==3
prior388=json.loads((ROOT/'catalogue/prior-388-preservation.json').read_text())
assert len(prior388)==338
for id,digest in prior388.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 388-record release changed'
new50={p['id']:p for p in additions if p['id'] in fiftieth}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['sourceType']=='research' and p['sourcePublishedAt'] is None for p in new50.values())
assert new50['technion-haifa-mrs-flight-room']['country']=='Israel'
assert 'office address' in new50['technion-haifa-mrs-flight-room']['reviewNotes']
assert 'no second site' in new50['unipi-pisa-raasl-flight-room']['reviewNotes']
assert 'physical-flight evidence' in new50['msu-denver-uas-flight-laboratory']['reviewNotes']

# Separate campus facilities and source-date limits.
fifty_first=json.loads((ROOT/'catalogue/fifty-first-batch-ids.json').read_text())
assert fifty_first==batch['releases'][50]['recordIds'] and len(fifty_first)==3
prior391=json.loads((ROOT/'catalogue/prior-391-preservation.json').read_text())
assert len(prior391)==341
for id,digest in prior391.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 391-record release changed'
new51={p['id']:p for p in additions if p['id'] in fifty_first}
assert all(p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['sourceType']=='research' for p in new51.values())
assert new51['stevens-hoboken-sas-flight-range']['sourcePublishedAt'] is None
assert new51['auckland-city-motion-capture-flight-lab']['sourcePublishedAt'] is None
assert new51['auckland-newmarket-wind-tunnel-drone-testing']['sourcePublishedAt']=='2026-09-01'
assert 'distinct from the Newmarket' in new51['auckland-city-motion-capture-flight-lab']['reviewNotes']
assert 'distinct from the City Campus' in new51['auckland-newmarket-wind-tunnel-drone-testing']['reviewNotes']

# Swedish facilities, separate lab identities and conservative source dates.
fifty_second=json.loads((ROOT/'catalogue/fifty-second-batch-ids.json').read_text())
assert fifty_second==batch['releases'][51]['recordIds'] and len(fifty_second)==3
prior394=json.loads((ROOT/'catalogue/prior-394-preservation.json').read_text())
assert len(prior394)==344
for id,digest in prior394.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 394-record release changed'
new52={p['id']:p for p in additions if p['id'] in fifty_second}
assert all(p['country']=='Sweden' and p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['sourceType']=='research' for p in new52.values())
assert new52['lund-ljungbyhed-uas-lab']['sourcePublishedAt'] is None
for id in ['ltu-lulea-concept-drone-arena','ltu-lulea-frost-drone-arena']:
 assert new52[id]['sourcePublishedAt']=='2019-03-11'
 assert 'Directory entry' in new52[id]['reportDateLabel']
 assert 'separately listed' in new52[id]['reviewNotes']

# Shared research arenas: dates and preservation.
fifty_third=json.loads((ROOT/'catalogue/fifty-third-batch-ids.json').read_text())
assert fifty_third==batch['releases'][52]['recordIds'] and len(fifty_third)==3
prior397=json.loads((ROOT/'catalogue/prior-397-preservation.json').read_text())
assert len(prior397)==347
for id,digest in prior397.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 397-record release changed'
new53={p['id']:p for p in additions if p['id'] in fifty_third}
assert {p['country'] for p in new53.values()}=={'Sweden','Belgium','Portugal'}
assert all(p['sourcePublishedAt'] is None and p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['sourceType']=='research' for p in new53.values())
assert 'last changed' in new53['kth-stockholm-smart-mobility-flight-lab']['reviewNotes']
assert 'Paris is not' in new53['ugent-ghent-iiot-drone-testbed']['reviewNotes']
assert 'timed out' in new53['tecnico-lisbon-idmec-robotics-arena']['reviewNotes']

# Shared research arenas: dates and preservation.
fifty_fourth=json.loads((ROOT/'catalogue/fifty-fourth-batch-ids.json').read_text())
assert fifty_fourth==batch['releases'][53]['recordIds'] and len(fifty_fourth)==3
prior400=json.loads((ROOT/'catalogue/prior-400-preservation.json').read_text())
assert len(prior400)==350
for id,digest in prior400.items():
 p=next(p for p in additions if p['id']==id)
 assert hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest, 'Prior 400-record release changed'
new54={p['id']:p for p in additions if p['id'] in fifty_fourth}
assert {p['country'] for p in new54.values()}=={'Germany','Spain','Netherlands'}
assert all(p['sourcePublishedAt'] is None and p['sourceReviewedAt']=='2026-11-01' and p['recordScope']=='test-centre' and p['reportedStatus']=='reported-operation' and p['sourceType']=='research' for p in new54.values())
assert 'approval-free' in new54['dlr-braunschweig-drone-cage']['reviewNotes']
assert 'subsystem validation' in new54['burgos-milanera-drone-laboratory']['reviewNotes']
assert 'No dedicated arena' in new54['twente-enschede-itc-uav-lab']['reviewNotes']
# Preserve the previous catalogue and distinguish operating, historical and announced sites.
latest_ids=json.loads((ROOT/'catalogue/fifty-fifth-batch-ids.json').read_text())
assert latest_ids==batch['releases'][54]['recordIds']
prior403=json.loads((ROOT/'catalogue/prior-403-preservation.json').read_text())
assert len(prior403)==353
by_id={p['id']:p for p in additions}
for id,digest in prior403.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert [by_id[id]['reportedStatus'] for id in latest_ids]==['reported-operation','historical','announced']
assert [by_id[id]['sourcePublishedAt'] for id in latest_ids]==[None,'2022-07-26','2026-03-20']
# Count each named FAA proposal once; retain the existing Clermont record.
fl_ids=json.loads((ROOT/'catalogue/fifty-sixth-batch-ids.json').read_text())
assert fl_ids==batch['releases'][55]['recordIds'] and len(fl_ids)==6
prior406=json.loads((ROOT/'catalogue/prior-406-preservation.json').read_text())
assert len(prior406)==356
for id,digest in prior406.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert len({by_id[id]['where'] for id in fl_ids})==6
assert all(by_id[id]['reportedStatus']=='announced' and by_id[id]['recordScope']=='delivery-hub' for id in fl_ids)
assert all('Johns Lake' not in by_id[id]['where'] for id in fl_ids)
# Preserve all prior records and the distinction between a reported pickup and a historical trial.
medical_ids=json.loads((ROOT/'catalogue/fifty-seventh-batch-ids.json').read_text())
assert medical_ids==batch['releases'][56]['recordIds'] and len(medical_ids)==6
prior412=json.loads((ROOT/'catalogue/prior-412-preservation.json').read_text())
assert len(prior412)==362
for id,digest in prior412.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert [by_id[id]['reportedStatus'] for id in medical_ids]==['reported-operation']*2+['historical']*4
assert by_id['widjifake-health-centre-return']['recordScope']=='trial-site'
# Preserve historical records; distinguish carried supplies from simulated diagnostic samples.
return_ids=json.loads((ROOT/'catalogue/fifty-eighth-batch-ids.json').read_text())
assert return_ids==batch['releases'][57]['recordIds'] and len(return_ids)==3
prior418=json.loads((ROOT/'catalogue/prior-418-preservation.json').read_text())
assert len(prior418)==368
for id,digest in prior418.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert all(by_id[id]['reportedStatus']=='historical' and by_id[id]['recordScope']=='trial-site' for id in return_ids)
assert 'simulated samples' in by_id['lilongwe-area-25-drone-trial']['reportedEquipment']
# A service launch is distinct from a documented flight, and a receiving site counts only with return cargo evidence.
india_ids=json.loads((ROOT/'catalogue/fifty-ninth-batch-ids.json').read_text())
assert india_ids==batch['releases'][58]['recordIds'] and len(india_ids)==14
prior421=json.loads((ROOT/'catalogue/prior-421-preservation.json').read_text())
assert len(prior421)==371
for id,digest in prior421.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert sum(by_id[id]['sourcePublishedAt']=='2024-10-29' for id in india_ids)==11
assert all(by_id[id]['country']=='India' for id in india_ids)
assert 'blood samples' in by_id['tangi-chc-sample-return']['description']
# Named cargo origins only; retain old records and historical evidence limits.
clinical_ids=json.loads((ROOT/'catalogue/sixtieth-batch-ids.json').read_text())
assert clinical_ids==batch['releases'][59]['recordIds'] and len(clinical_ids)==7
prior435=json.loads((ROOT/'catalogue/prior-435-preservation.json').read_text())
assert len(prior435)==385
for id,digest in prior435.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert all(by_id[id]['country']=='India' and by_id[id]['reportedStatus']=='historical' for id in clinical_ids)
assert 'diagnostic reports' in by_id['jhalma-report-return']['description']
# Eleven named PHCs, not every subcentre, plus a single Nagaland trial origin.
phc_ids=json.loads((ROOT/'catalogue/sixty-first-batch-ids.json').read_text())
assert phc_ids==batch['releases'][60]['recordIds'] and len(phc_ids)==12
prior442=json.loads((ROOT/'catalogue/prior-442-preservation.json').read_text())
assert len(prior442)==392
for id,digest in prior442.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert sum(by_id[id]['sourcePublishedAt']=='2026-02-11' for id in phc_ids)==11
assert all(by_id[id]['recordScope']=='trial-site' and by_id[id]['reportedStatus']=='historical' for id in phc_ids)
# Two named dispatch hubs and eight logged return sites; exclude surveyed-only locations.
drots_ids=json.loads((ROOT/'catalogue/sixty-second-batch-ids.json').read_text())
assert drots_ids==batch['releases'][61]['recordIds'] and len(drots_ids)==10
prior454=json.loads((ROOT/'catalogue/prior-454-preservation.json').read_text())
assert len(prior454)==404
for id,digest in prior454.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert sum(id.endswith('-hub') for id in drots_ids)==2
assert all(by_id[id]['country']=='Nepal' and by_id[id]['reportedStatus']=='historical' for id in drots_ids)
canadian_ids=json.loads((ROOT/'catalogue/sixty-third-batch-ids.json').read_text())
assert canadian_ids==batch['releases'][62]['recordIds'] and len(canadian_ids)==5
prior464=json.loads((ROOT/'catalogue/prior-464-preservation.json').read_text())
assert len(prior464)==414
for id,digest in prior464.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert all(by_id[id]['country']=='Canada' and by_id[id]['reportedStatus']=='historical' for id in canadian_ids)
swedish_ids=json.loads((ROOT/'catalogue/sixty-fourth-batch-ids.json').read_text())
assert swedish_ids==batch['releases'][63]['recordIds'] and len(set(swedish_ids))==6
prior469=json.loads((ROOT/'catalogue/prior-469-preservation.json').read_text())
assert len(prior469)==419
for id,digest in prior469.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert all(by_id[id]['country']=='Sweden' and by_id[id]['recordScope']=='dispatch-site' for id in swedish_ids)
norwegian_ids=json.loads((ROOT/'catalogue/sixty-fifth-batch-ids.json').read_text())
assert norwegian_ids==batch['releases'][64]['recordIds'] and len(set(norwegian_ids))==5
prior475=json.loads((ROOT/'catalogue/prior-475-preservation.json').read_text())
assert len(prior475)==425
for id,digest in prior475.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert all(by_id[id]['country']=='Norway' and by_id[id]['recordScope']=='dispatch-site' for id in norwegian_ids)
helsinki_ids=json.loads((ROOT/'catalogue/sixty-sixth-batch-ids.json').read_text())
assert helsinki_ids==batch['releases'][65]['recordIds'] and len(set(helsinki_ids))==3
prior480=json.loads((ROOT/'catalogue/prior-480-preservation.json').read_text())
assert len(prior480)==430
for id,digest in prior480.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert all(by_id[id]['country']=='Finland' and by_id[id]['reportedStatus']=='historical' for id in helsinki_ids)
port_hall_hospital_ids=json.loads((ROOT/'catalogue/sixty-seventh-batch-ids.json').read_text())
assert port_hall_hospital_ids==batch['releases'][66]['recordIds'] and len(set(port_hall_hospital_ids))==3
prior483=json.loads((ROOT/'catalogue/prior-483-preservation.json').read_text())
assert len(prior483)==433
for id,digest in prior483.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert {by_id[id]['country'] for id in port_hall_hospital_ids}=={'Germany','Sweden'}
goto_dispatch_ids=json.loads((ROOT/'catalogue/sixty-eighth-batch-ids.json').read_text())
assert goto_dispatch_ids==batch['releases'][67]['recordIds'] and len(set(goto_dispatch_ids))==4
prior486=json.loads((ROOT/'catalogue/prior-486-preservation.json').read_text())
assert len(prior486)==436
for id,digest in prior486.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert all(by_id[id]['country']=='Japan' for id in goto_dispatch_ids)
jp_cargo_ids=json.loads((ROOT/'catalogue/sixty-ninth-batch-ids.json').read_text())
assert jp_cargo_ids==batch['releases'][68]['recordIds'] and len(set(jp_cargo_ids))==10
prior490=json.loads((ROOT/'catalogue/prior-490-preservation.json').read_text())
assert len(prior490)==440
for id,digest in prior490.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert all(by_id[id]['country']=='Japan' and by_id[id]['reportedStatus']=='historical' for id in jp_cargo_ids)
mountain_island_ids=json.loads((ROOT/'catalogue/seventieth-batch-ids.json').read_text())
assert mountain_island_ids==batch['releases'][69]['recordIds'] and len(set(mountain_island_ids))==8
prior500=json.loads((ROOT/'catalogue/prior-500-preservation.json').read_text())
assert len(prior500)==450
for id,digest in prior500.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert all(by_id[id]['country']=='Japan' and by_id[id]['reportedStatus']=='historical' for id in mountain_island_ids)
dispatch_ids=json.loads((ROOT/'catalogue/seventy-first-batch-ids.json').read_text())
assert dispatch_ids==batch['releases'][70]['recordIds'] and len(set(dispatch_ids))==7
prior508=json.loads((ROOT/'catalogue/prior-508-preservation.json').read_text())
assert len(prior508)==458
for id,digest in prior508.items():
 assert hashlib.sha256(json.dumps(by_id[id],ensure_ascii=False,sort_keys=True).encode()).hexdigest()==digest
assert all(by_id[id]['reportedStatus']=='historical' for id in dispatch_ids)
# Preserve the 465 additions preceding the community dispatch release.
assert hashlib.sha256(json.dumps(additions[:465],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='40d60b5c346e4ab0b457aecad343605aff2ae7455d4cf3afe447aaa9792c58b3'
assert batch['releases'][71]['recordIds']==['japan-makurase', 'japan-kokuzo-satoyama', 'japan-hikariura-tunnel']
assert hashlib.sha256(json.dumps(additions[:468],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='170857890bb025f59b87f4c98fe01ccf005c7cdf181a7f29ab5b2d3da4c3a83a'
assert batch['releases'][72]['recordIds']==['japan-yoshinoya-komatsu', 'japan-tateishi-park', 'japan-kawazu-materials-warehouse', 'japan-yanagida-gymnasium']
assert hashlib.sha256(json.dumps(additions[:472],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='a87bcb30d360366c97216305a80b8d3955ca928c4e1496e76785a9258a9480d3'
assert batch['releases'][73]['recordIds']==['mongolia-national-transfusion-center', 'mongolia-city-hall-branch']
assert hashlib.sha256(json.dumps(additions[:474],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='52816cce61d23ccfefa2ceb3a8141a25f702418a5def97cbeb174d422fc28e6c'
assert batch['releases'][74]['recordIds']==['bhutan-thimphu-referral-hospital', 'madagascar-maroantsetra-health-base', 'vanuatu-melsisi-vaccine-base']
assert hashlib.sha256(json.dumps(additions[:477],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='10fe5401b4fc5846ff4c5a17b28185b3c8b9623b36b290ff0d92dc68290db62f'
assert batch['releases'][75]['recordIds']==['sierra-leone-njala-test-runway', 'peru-contamana-football-field', 'peru-pampa-hermosa-sample-return']
assert hashlib.sha256(json.dumps(additions[:480],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='9f40d4ffaa9fe3a6ead150cfb2a629386851027b00f53397a0e570aa6fc3970f'
assert batch['releases'][76]['recordIds']==['dominican-republic-bohechio-hospital', 'india-jengjal-hospital', 'india-vikarabad-district-hospital']
assert hashlib.sha256(json.dumps(additions[:483],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='19ad175fb4a8b432c519c661ec684230fb6ff6fc13738869910eb38f7c1f3586'
assert batch['releases'][77]['recordIds']==['tanzania-mwanza-medical-stores', 'tanzania-nansio-district-hospital', 'malawi-matawale-hospital']
# Preserve the previous release and the historical scope of the Scottish trials.
assert hashlib.sha256(json.dumps(additions[:486],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='d4407dfb97779b69811a39e232da7c46ac479d6b4d45fc6b535e1ef9680b46d9'
assert batch['releases'][78]['recordIds']==['caelus-borders-general-hospital', 'caelus-crosshouse-hospital']
assert all(by_id[id]['reportedStatus']=='historical' and by_id[id]['recordScope']=='trial-site' for id in batch['releases'][78]['recordIds'])
# Preserve the previous release and distinguish the two airport trial origins.
assert hashlib.sha256(json.dumps(additions[:488],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='0b9f7213f24591374a41edcb65d69a64c1e047689b6baa80f44e86f93fa7ee28'
assert batch['releases'][79]['recordIds']==['royal-mail-kirkwall-airport-trial', 'royal-mail-tingwall-airport-trial']
assert all(by_id[id]['reportedStatus']=='historical' and by_id[id]['recordScope']=='trial-site' for id in batch['releases'][79]['recordIds'])
assert by_id['royal-mail-tingwall-airport-trial']['sourcePublishedAt'] is None
# Preserve prior records and retain the distinction between delivery and payload research.
assert hashlib.sha256(json.dumps(additions[:490],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='6576384adee219f3c53ba2ff1d3908bafb06ff6b09ed06fa99f213e91c85ba18'
assert batch['releases'][80]['recordIds']==['thorney-island-baker-barracks-trial', 'lands-end-airport-insulin-trial', 'west-wellow-insulin-flight-trial']
assert all(by_id[id]['reportedStatus']=='historical' for id in batch['releases'][80]['recordIds'])
assert all(by_id[id]['sourcePublishedAt'] is None for id in ['lands-end-airport-insulin-trial','west-wellow-insulin-flight-trial'])
# Preserve the prior release and keep undated research sources separate from trial dates.
assert hashlib.sha256(json.dumps(additions[:493],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='42a1f23086b1e1d5c2232e9f8e15ae9f2cf0d188ea04d2078baed95218016357'
assert batch['releases'][81]['recordIds']==['keevil-medical-payload-trial', 'henstridge-blood-payload-trial']
assert all(by_id[id]['reportedStatus']=='historical' and by_id[id]['sourcePublishedAt'] is None for id in batch['releases'][81]['recordIds'])
# Preserve all earlier additions and the historical Solent airfield trial scope.
assert hashlib.sha256(json.dumps(additions[:495],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='27de221778efe90fc1da5c92941862593b8e013ae3bfb54a765c768e27e52d99'
assert batch['releases'][82]['recordIds']==['lee-on-solent-medical-trial', 'binstead-medical-trial']
assert all(by_id[id]['reportedStatus']=='historical' and by_id[id]['sourcePublishedAt']=='2020-05-13' for id in batch['releases'][82]['recordIds'])
# Preserve the previous release and historical Scilly airbridge scope.
assert hashlib.sha256(json.dumps(additions[:497],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='778ff376ef64a84b335bc93742dee895bc089ac990fc5aaf1de02d0c59e3ef6e'
assert batch['releases'][83]['recordIds']==['perranporth-airbridge-trial', 'st-marys-scilly-airbridge-trial']
assert all(by_id[id]['reportedStatus']=='historical' and by_id[id]['sourcePublishedAt'] is None for id in batch['releases'][83]['recordIds'])
# Preserve all earlier additions and the historical St Merryn testing scope.
assert hashlib.sha256(json.dumps(additions[:499],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='299bdd29c6e1c144de1471ced2a232b387ef648b808ae39e5573f6f0ac7a5898'
assert batch['releases'][84]['recordIds']==['st-merryn-ultra-flight-trial']
assert by_id['st-merryn-ultra-flight-trial']['reportedStatus']=='historical'
# Preserve all earlier additions and historical Marwell trial scope.
assert hashlib.sha256(json.dumps(additions[:500],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='7700318f558234b482c9e7544406a3eca92efd92cb06118a37b2aa480588d2f3'
assert batch['releases'][85]['recordIds']==['marwell-conservation-flight-trial']
assert by_id['marwell-conservation-flight-trial']['reportedStatus']=='historical'
# Preserve the previous release and historical South Terras survey scope.
assert hashlib.sha256(json.dumps(additions[:501],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='d380f000543af658cede45fdc4e76bebc2a920af55c2435722255c1ce08ff427'
assert batch['releases'][86]['recordIds']==['south-terras-radiation-survey']
assert by_id['south-terras-radiation-survey']['reportedStatus']=='historical'
# Preserve all prior additions and the distinct DroneTEX facility scope.
assert hashlib.sha256(json.dumps(additions[:502],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='ba95419912e7eb225a9384a699a3b0f2e39d0e2e281933678682bf33eded7d81'
assert batch['releases'][87]['recordIds']==['swindon-dronetex-testing-centre']
assert by_id['swindon-dronetex-testing-centre']['reportedStatus']=='reported-operation'
assert by_id['swindon-dronetex-testing-centre']['sourcePublishedAt']=='2026-06-12'
# Preserve all prior additions and historical Twinwoods test-centre scope.
assert hashlib.sha256(json.dumps(additions[:503],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='f5821de57ca6a3c23fb669b4fd0477fd8ab2cc0c08925c901fd36c714ed88f6d'
assert batch['releases'][88]['recordIds']==['blue-bear-twinwoods-flight-test-centre']
assert by_id['blue-bear-twinwoods-flight-test-centre']['reportedStatus']=='historical'
assert by_id['blue-bear-twinwoods-flight-test-centre']['sourcePublishedAt']=='2019-08-29'
# Preserve all prior additions and the Portland heliport-based facility scope.
assert hashlib.sha256(json.dumps(additions[:504],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='3c47426fea32d61f96046e540ac130487c7b1a39ebba122eb56fb55a907725e7'
assert batch['releases'][89]['recordIds']==['portland-dca-test-centre']
assert by_id['portland-dca-test-centre']['reportedStatus']=='reported-operation'
assert by_id['portland-dca-test-centre']['sourcePublishedAt']=='2026-04-17'
# Preserve all prior additions and the single Radnor range scope.
assert hashlib.sha256(json.dumps(additions[:505],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='37e8c93fca0405b62325cd375984fa9363d4c84fd185dca1e921a7094de724bf'
assert batch['releases'][90]['recordIds']==['radnor-range-drone-test-site']
assert by_id['radnor-range-drone-test-site']['reportedStatus']=='reported-operation'
assert by_id['radnor-range-drone-test-site']['sourcePublishedAt'] is None
# Preserve all earlier additions and the historical Avonmouth trial scope.
assert hashlib.sha256(json.dumps(additions[:506],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='ad1ee065898180a0c69ead20cc2ceae03c1db6d3b2258816d77c0071de1d8db8'
assert batch['releases'][91]['recordIds']==['avonmouth-npas-flight-trial']
assert by_id['avonmouth-npas-flight-trial']['reportedStatus']=='historical'
assert by_id['avonmouth-npas-flight-trial']['sourcePublishedAt'] is None
# Preserve prior additions and distinguish historical Draycott from Goodwood facilities.
assert hashlib.sha256(json.dumps(additions[:507],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='af1cf552aca5b0cd946e23b7ee6fca975802dc42204ebe6a408e08e44bb78ef5'
assert batch['releases'][92]['recordIds']==['draycott-student-uav-test-site','goodwood-aviation-innovation-centre']
assert by_id['draycott-student-uav-test-site']['reportedStatus']=='historical'
assert by_id['draycott-student-uav-test-site']['sourcePublishedAt']=='2009-01-07'
assert by_id['goodwood-aviation-innovation-centre']['sourcePublishedAt'] is None
# Preserve earlier additions and distinguish West Wales activity from historical West Freugh trials.
assert hashlib.sha256(json.dumps(additions[:509],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='e03860122bfca099b075c1b49895d3bd658fce3c64b8642be20460ddb13b9b88'
assert batch['releases'][93]['recordIds']==['west-wales-airport-uas-testing','west-freugh-uas-trial-site']
assert by_id['west-freugh-uas-trial-site']['reportedStatus']=='historical'
assert by_id['west-freugh-uas-trial-site']['sourcePublishedAt']=='2015-05-26'
assert by_id['west-wales-airport-uas-testing']['sourcePublishedAt']=='2025-07-18'
# Preserve all earlier additions and keep the undated facility source distinct from the campus opening.
assert hashlib.sha256(json.dumps(additions[:511],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='10a7363872c3e01882287bd6b2f694d78684edbf8db40ee93c934a7c6692cccf'
assert batch['releases'][94]['recordIds']==['shannon-fmci-drone-port']
assert by_id['shannon-fmci-drone-port']['sourcePublishedAt'] is None
assert by_id['shannon-fmci-drone-port']['reportedStatus']=='reported-operation'
# Preserve earlier additions and retain historical scope for Irish island trials.
assert hashlib.sha256(json.dumps(additions[:512],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='8d11b618f97f2aa691d87f6c66d51839184af4235cc6e1e6cfb86b17a9394abd'
assert batch['releases'][95]['recordIds']==['connemara-airport-diabetes-trial', 'roonagh-pier-postal-trial']
assert by_id['connemara-airport-diabetes-trial']['reportedStatus']=='historical'
assert by_id['connemara-airport-diabetes-trial']['sourcePublishedAt']=='2019-09-16'
assert by_id['roonagh-pier-postal-trial']['reportedStatus']=='historical'
assert by_id['roonagh-pier-postal-trial']['sourcePublishedAt']=='2018-07-06'
# Preserve earlier additions and retain historical scope for the Moneygall base.
assert hashlib.sha256(json.dumps(additions[:514],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='1fe60421e831a940a1565a612fa360e2d270a8f644c50324fccfde1e2e49b8f7'
assert batch['releases'][96]['recordIds']==['manna-moneygall-obama-plaza']
assert by_id['manna-moneygall-obama-plaza']['reportedStatus']=='historical'
assert by_id['manna-moneygall-obama-plaza']['sourcePublishedAt']=='2020-05-18'
# Preserve earlier additions and distinguish the two Irish testing records.
assert hashlib.sha256(json.dumps(additions[:515],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='6bd151fe74c7e9006eecae6399c08ab924a7069e75f6e0db4cc50df509784776'
assert batch['releases'][97]['recordIds']==['manna-moorock-test-facility', 'newcastle-airfield-rapid-trials']
assert by_id['manna-moorock-test-facility']['sourcePublishedAt'] is None
assert by_id['manna-moorock-test-facility']['reportedStatus']=='reported-operation'
assert by_id['newcastle-airfield-rapid-trials']['sourcePublishedAt'] is None
assert by_id['newcastle-airfield-rapid-trials']['reportedStatus']=='historical'
# Preserve earlier additions and retain historical Waterford trial scope.
assert hashlib.sha256(json.dumps(additions[:517],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='e1b3ed7c12b160f4bcf13a4a214007f33cb98ffb6bb9649e705a164beaf075de'
assert batch['releases'][98]['recordIds']==['waterford-airport-uflyte-trials']
assert by_id['waterford-airport-uflyte-trials']['reportedStatus']=='historical'
assert by_id['waterford-airport-uflyte-trials']['sourcePublishedAt']=='2018-09-21'
# Preserve earlier additions and retain the undated operator source for Kirkbride.
assert hashlib.sha256(json.dumps(additions[:518],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='f159005f259a192110a375801164ffcf8c7ae7ccedd2b8d585c8c381fc36e20d'
assert batch['releases'][99]['recordIds']==['kirkbride-enefftech-training-facility']
assert by_id['kirkbride-enefftech-training-facility']['sourcePublishedAt'] is None
assert by_id['kirkbride-enefftech-training-facility']['reportedStatus']=='reported-operation'
# Preserve earlier additions and count York's indoor/rooftop spaces as one facility.
assert hashlib.sha256(json.dumps(additions[:519],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='22628e51c562e00e5553bde846c4e5d8576dfd64bc2547d5639a98c42797b73e'
assert batch['releases'][100]['recordIds']==['york-safe-autonomy-drone-facility']
assert by_id['york-safe-autonomy-drone-facility']['sourcePublishedAt'] is None
assert by_id['york-safe-autonomy-drone-facility']['reportedStatus']=='reported-operation'
# Preserve earlier additions and the undated Loughborough laboratory source.
assert hashlib.sha256(json.dumps(additions[:520],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='136d923be90e86df79dd181f3c415d06429a1dbf011e2d7b5ebc4cf4105a599b'
assert batch['releases'][101]['recordIds']==['loughborough-autonomous-systems-flight-lab']
assert by_id['loughborough-autonomous-systems-flight-lab']['sourcePublishedAt'] is None
assert by_id['loughborough-autonomous-systems-flight-lab']['reportedStatus']=='reported-operation'
# Preserve earlier additions and the undated Newcastle teaching-zone source.
assert hashlib.sha256(json.dumps(additions[:521],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='65ef9037f9dad5645db77a7ff6d58277c6574e89c7b24c7c2bc228ed6085527a'
assert batch['releases'][102]['recordIds']==['newcastle-university-aerospace-drone-zone']
assert by_id['newcastle-university-aerospace-drone-zone']['sourcePublishedAt'] is None
assert by_id['newcastle-university-aerospace-drone-zone']['reportedStatus']=='reported-operation'
# Preserve earlier additions and keep both undated university facility sources explicit.
assert hashlib.sha256(json.dumps(additions[:522],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='3570b225047fa21c7bda85268fc4dc58999b10f11c5c4f50fd7c915d22096e2f'
assert batch['releases'][103]['recordIds']==['plymouth-autonomous-systems-test-laboratory', 'essex-robotics-arena']
assert by_id['plymouth-autonomous-systems-test-laboratory']['sourcePublishedAt'] is None
assert by_id['plymouth-autonomous-systems-test-laboratory']['reportedStatus']=='reported-operation'
assert by_id['essex-robotics-arena']['sourcePublishedAt'] is None
assert by_id['essex-robotics-arena']['reportedStatus']=='reported-operation'
# Preserve all earlier additions and reconcile the fifty-candidate review.
assert hashlib.sha256(json.dumps(additions[:524],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='0a97be0c2795f9a062a4cb4b18dfc3ce65a96ffc59a9d3be31f9a603d94f362e'
fifty=json.loads((ROOT/'catalogue/2026-11-08-fifty-task-review.json').read_text())
assert fifty['completedTasks']==50 and [t['task'] for t in fifty['tasks']]==list(range(1,51))
assert all(t['reviewStatus']=='completed' and t['sourceUrls'] and t['reason'] for t in fifty['tasks'])
accepted=[t['recordId'] for t in fifty['tasks'] if t['decision']=='accepted']
assert accepted==batch['releases'][104]['recordIds'] and len(accepted)==20
assert sum(t['decision']=='deferred' for t in fifty['tasks'])==28
assert sum(t['decision']=='excluded-overlap' for t in fifty['tasks'])==2
assert all(t['recordId'] is None for t in fifty['tasks'] if t['decision']!='accepted')
assert by_id['utari-fort-worth-mavrc']['sourcePublishedAt']=='2025-09-16'
assert by_id['princeton-equad-drone-flight-space']['sourcePublishedAt']=='2022-01-25'
assert all(by_id[id]['sourcePublishedAt'] is None for id in accepted if id not in ['utari-fort-worth-mavrc','princeton-equad-drone-flight-space'])
# Preserve all 594 previous records and reconcile the second fifty-task ledger.
assert hashlib.sha256(json.dumps(additions[:544],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='fbd744862000512a9c11c0e6f2298fa9a11bc9dd1c924bd1d9bd855e2a014dd0'
fifty_second=json.loads((ROOT/'catalogue/2026-11-08-second-fifty-task-review.json').read_text())
assert fifty_second['completedTasks']==50 and [t['task'] for t in fifty_second['tasks']]==list(range(1,51))
assert all(t['reviewStatus']=='completed' and t['sourceUrls'] and t['reason'] for t in fifty_second['tasks'])
accepted_second=[t['recordId'] for t in fifty_second['tasks'] if t['decision']=='accepted']
assert accepted_second==batch['releases'][105]['recordIds'] and len(accepted_second)==fifty_second['acceptedRecords']==18
assert sum(t['decision']=='deferred' for t in fifty_second['tasks'])==fifty_second['deferredCandidates']==24
assert sum(t['decision']=='excluded-overlap' for t in fifty_second['tasks'])==fifty_second['excludedOverlaps']==8
assert all(t['recordId'] is None for t in fifty_second['tasks'] if t['decision']!='accepted')
assert by_id['upc-castelldefels-dronelab']['sourcePublishedAt']=='2022-12-13'
assert by_id['gipsa-moca-indoor-aviary']['sourcePublishedAt']=='2026-03-24'
assert all(by_id[id]['sourcePublishedAt'] is None for id in accepted_second if id not in ['upc-castelldefels-dronelab','gipsa-moca-indoor-aviary'])
assert by_id['oit-hirakata-dx-field']['where']=='Hirakata, Japan'
assert by_id['jbnu-jeonju-irdl-flight-room']['where']=='Jeonju, South Korea'
# Preserve all 612 previous records and reconcile the third fifty-task ledger.
assert hashlib.sha256(json.dumps(additions[:562],sort_keys=True,ensure_ascii=False).encode()).hexdigest()=='6874748fb1c924b3bdae5fc535100a7a11bca5f496626a38f16616baf5dbb641'
fifty_third=json.loads((ROOT/'catalogue/2026-11-08-third-fifty-task-review.json').read_text())
assert fifty_third['completedTasks']==50 and [t['task'] for t in fifty_third['tasks']]==list(range(1,51))
assert all(t['reviewStatus']=='completed' and t['sourceUrls'] and t['reason'] for t in fifty_third['tasks'])
accepted_third=[t['recordId'] for t in fifty_third['tasks'] if t['decision']=='accepted']
assert accepted_third==batch['releases'][106]['recordIds'] and len(accepted_third)==fifty_third['acceptedRecords']==17
assert sum(t['decision']=='deferred' for t in fifty_third['tasks'])==fifty_third['deferredCandidates']==24
assert sum(t['decision']=='excluded-overlap' for t in fifty_third['tasks'])==fifty_third['excludedOverlaps']==9
assert all(t['recordId'] is None for t in fifty_third['tasks'] if t['decision']!='accepted')
dated_third={'mranti-bukit-jalil-area-57':'2023-07-23','sejong-seoul-gwanggaeto-flight-room':'2022-03-25','dji-yongin-flight-arena':'2016-08-17','tokyo-itabashi-drone-field':'2024-10-02','nmt-socorro-skeen-drone-room':'2022-02-02','fahari-nairobi-drone-cage':'2022-06-10'}
assert all(by_id[id]['sourcePublishedAt']==dated_third.get(id) for id in accepted_third)
assert by_id['aichi-nagoya-port-south-5-test-field']['where']=='Chita, Aichi, Japan'
assert 'paused' in by_id['japan-kawachi-drone-field']['reviewNotes']
assert 'without hangars, electricity or water' in by_id['shizuoka-miho-drone-test-airfield']['reviewNotes']
print(f'PASS: {len(rows)} records, {len(additions)} sourced additions, aligned exports, generated passports, safe input and deterministic build')
