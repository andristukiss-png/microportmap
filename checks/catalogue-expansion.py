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
assert fifty_fourth==batch['releases'][-1]['recordIds'] and len(fifty_fourth)==3
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
print(f'PASS: {len(rows)} records, {len(additions)} sourced additions, aligned exports, generated passports, safe input and deterministic build')
