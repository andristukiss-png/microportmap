import pathlib,re,hashlib,base64
root=pathlib.Path('src');css=root/'vendor/leaflet/leaflet.css'
expected='p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
assert base64.b64encode(hashlib.sha256(css.read_bytes()).digest()).decode()==expected
markup=(root/'index.html').read_text()
assert f'href="/vendor/leaflet/leaflet.css" integrity="sha256-{expected}"' in markup
for target in re.findall(r'url\(([^)]+)\)',css.read_text()):
 target=target.strip('\'"')
 if not target.startswith(('data:','http:','https:','#')):assert (css.parent/target).is_file(),target
for p in (css.parent/'images').glob('*.png'):assert p.read_bytes().startswith(b'\x89PNG\r\n\x1a\n'),p
assert 'BSD 2-Clause License' in (css.parent/'LICENSE.txt').read_text()
print('PASS: official Leaflet CSS hash, configured local URL/SRI, referenced assets, PNG headers and retained license')
