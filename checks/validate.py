import pathlib,json,hashlib,csv,io,re,urllib.parse,math
from site_navigation_support import without_site_navigation
root=pathlib.Path('src'); manifest=json.load(open('manifest.json')); records=json.loads((root/'data/projects.json').read_text())['records']; results=[]
def check(name,ok):
 results.append({'task':name,'status':'verified' if ok else 'failed','evidence':'Automated source/data check'})
def unchanged(f):
 p=pathlib.Path(f['path']); raw=without_site_navigation(p.read_text()).encode() if p.suffix=='.html' else p.read_bytes()
 return hashlib.sha1(raw).hexdigest()==f['uid']
check('Preserve all 50 research records',len(records)==50)
check('Preserve projects.json byte for byte',all(unchanged(f) for f in manifest if f['path']=='src/data/projects.json'))
check('Preserve every existing data export byte for byte',all(unchanged(f) for f in manifest if f['path'].startswith('src/data/')))
check('Preserve desktop and mobile CSS byte for byte',all(unchanged(f) for f in manifest if f['path'].endswith('.css')))
check('Preserve all 50 passport contents apart from requested shared navigation',all(unchanged(f) for f in manifest if f['path'].startswith('src/projects/')))
check('Preserve directory embedded color styles',re.findall(r'<style[^>]*>.*?</style>',(root/'directory/index.html').read_text(),re.S)==re.findall(r'<style[^>]*>.*?</style>',pathlib.Path('baseline-round2/directory/index.html').read_text(),re.S))
check('Parse all JSON exports',all(json.loads(p.read_text()) is not None for p in (root/'data').glob('*.json')))
check('Confirm declared dataset count',json.loads((root/'data/projects.json').read_text())['count']==len(records))
check('Confirm unique record IDs',len({r['id'] for r in records})==50)
check('Confirm safe record ID paths',all(re.fullmatch('[a-z0-9-]+',r['id']) for r in records))
for key,label in [('name','names'),('country','countries'),('region','regions'),('infrastructureType','categories'),('reportedOperator','operators'),('reportedEquipment','equipment'),('locationPrecision','precision caveats'),('reportDateLabel','date labels'),('description','descriptions'),('verificationStatus','evidence status')]:check('Check all record '+label,all(str(r.get(key,'')).strip() for r in records))
check('Check evidence URL format',all(urllib.parse.urlparse(r['source']['url']).scheme=='https' and urllib.parse.urlparse(r['source']['url']).hostname for r in records))
check('Check evidence URLs omit credentials',all(not urllib.parse.urlparse(r['source']['url']).username and not urllib.parse.urlparse(r['source']['url']).password for r in records))
check('Check all latitude bounds',all(isinstance(r['approximateMapPoint']['latitude'],(int,float)) and abs(r['approximateMapPoint']['latitude'])<=85.05112878 for r in records))
check('Check all longitude bounds',all(isinstance(r['approximateMapPoint']['longitude'],(int,float)) and abs(r['approximateMapPoint']['longitude'])<=180 for r in records))
check('Check 23-country coverage',len({r['country'] for r in records})==23)
check('Check seven infrastructure categories',len({r['infrastructureType'] for r in records})==7)
check('Check all 50 passport routes exist',all((root/'projects'/r['id']/'index.html').is_file() for r in records))
missing=[]
for p in root.rglob('*.html'):
 for value in re.findall(r'(?:href|src)=["\'](/[^"\']*)',p.read_text()):
  value=value.split('?')[0].split('#')[0];q=root/value.lstrip('/')
  if value and not q.exists():missing.append((str(p),value))
check('Check internal page and asset destinations',not missing)
geo=json.loads((root/'data/projects.geojson').read_text());check('Parse GeoJSON feature collection',geo['type']=='FeatureCollection' and len(geo['features'])==50)
check('Match GeoJSON IDs to records',{f['properties']['id'] for f in geo['features']}=={r['id'] for r in records})
rows=list(csv.DictReader(io.StringIO((root/'data/projects.csv').read_text(encoding='utf-8-sig'))));check('Parse CSV with 50 records',len(rows)==50)
check('Match CSV IDs to records',{r['id'] for r in rows}=={r['id'] for r in records})
check('Preserve homepage embedded color styles',re.findall(r'<style[^>]*>.*?</style>',(root/'index.html').read_text(),re.S)==re.findall(r'<style[^>]*>.*?</style>',pathlib.Path('baseline-round2/index.html').read_text(),re.S))
check('Preserve all preexisting source files',all(pathlib.Path(f['path']).is_file() for f in manifest))
pathlib.Path('checks/results.json').write_text(json.dumps(results,indent=2));print(json.dumps({'checks':len(results),'failures':[r for r in results if r['status']=='failed']}))
