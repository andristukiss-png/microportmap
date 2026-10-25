from pathlib import Path
from html.parser import HTMLParser
import json
class Doc(HTMLParser):
 def __init__(self,text):super().__init__();self.links=[];self.canonicals=[];self.feed(text)
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='a' and a.get('href'):self.links.append(a)
  if t=='link' and a.get('rel')=='canonical':self.canonicals.append(a.get('href'))
root=Path('src');pages={name:Doc((root/name/'index.html').read_text()).links for name in ['countries','coverage','operators']}
passports={p['id']:{'links':Doc((root/'projects'/p['id']/'index.html').read_text()).links,'canonical':Doc((root/'projects'/p['id']/'index.html').read_text()).canonicals} for p in json.loads((root/'data/projects.json').read_text())['records']}
Path('checks/site-journeys-fixtures.json').write_text(json.dumps({'pages':pages,'passports':passports},indent=2)+'\n')
