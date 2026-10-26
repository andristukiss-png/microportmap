/* MicroportMap Country & Region Explorer. All counts refer to source-linked records. */
(()=>{
'use strict';
if(document.documentElement.dataset.mpcExplorer)return;
document.documentElement.dataset.mpcExplorer='1';
const page=location.pathname.replace(/\/+$/,'/');
const countryPage=page==='/countries/';
const coveragePage=page==='/coverage/';
const $=id=>document.getElementById(id);
const E=(tag,cls,value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=String(value);return node;};
const A=(label,url,cls='mpc-link')=>{const n=E('a',cls,label);n.href=url;return n;};
const B=(label,fn,cls='mpc-button')=>{const n=E('button',cls,label);n.type='button';n.addEventListener('click',fn);return n;};
const O=(value,label)=>{const node=E('option','',label);node.value=value;return node;};
const count=(items,key)=>{const m=new Map();for(const r of items){const k=String(r[key]||'Unspecified');m.set(k,(m.get(k)||0)+1)}return [...m].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));};
const year=r=>(String(r.reportDateLabel||'').match(/\b20\d\d\b/)||[])[0]||'Unspecified';
const source=r=>{try{const u=new URL(r.source?.url);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
const recordHref=id=>'/projects/'+encodeURIComponent(id)+'/';
const filterHref=(url,country)=>url+'?'+new URLSearchParams({country});
const lower=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const IDs=r=>r&&typeof r.id==='string'&&/^[a-z0-9-]+$/.test(r.id)&&typeof r.name==='string'&&r.name.trim();
let records=[],groups=[],regions=[],current='',region='',query='',sort='count',minCount=1,
    favorites=[],maxShown=12,projectShown=6,selectedA='',selectedB='',isReady=false,isLoading=false,storageOK=true;
const key='microportmap.country-bookmarks.v1';
function readFavorites(){
 try{const ids=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(ids))return [];
  return [...new Set(ids.filter(x=>typeof x==='string'))].slice(0,3);
 }catch{storageOK=false;return [];}
}
favorites=readFavorites();
function keepFavorites(){
 try{localStorage.setItem(key,JSON.stringify(favorites));storageOK=true;}
 catch{storageOK=false;}
}
const root=E('section','mpc-explorer');root.id='mpc-explorer';root.setAttribute('aria-labelledby','mpc-title');
const heading=E('div','mpc-head');
const h=E('h2','','Explore countries and regions');h.id='mpc-title';
const tagline=E('p','mpc-lede','Filter reported infrastructure research geographically, then inspect the actual project records and original evidence.');
heading.append(E('p','mpc-eyebrow','GLOBAL GEOGRAPHIC RESEARCH'),h,tagline);
const pills=E('div','mpc-highlights');pills.id='mpc-highlights';
const selectors=E('div','mpc-selectors');
const searchLabel=E('label','mpc-field');searchLabel.append(E('span','','Find a country'));
const search=E('input','mpc-input');search.id='mpc-search';search.type='search';search.placeholder='Country or region…';search.autocomplete='off';searchLabel.append(search);
const regionLabel=E('label','mpc-field');regionLabel.append(E('span','','Region'));
const regionSelect=E('select','mpc-select');regionSelect.id='mpc-region';regionSelect.append(O('','All regions'));regionLabel.append(regionSelect);
const sortLabel=E('label','mpc-field');sortLabel.append(E('span','','Order'));
const sortSelect=E('select','mpc-select');sortSelect.id='mpc-sort';
sortSelect.append(O('count','Most reports first'),O('alpha','Country A–Z'));sortLabel.append(sortSelect);
const minLabel=E('label','mpc-field');minLabel.append(E('span','','Minimum records'));
const minSelect=E('select','mpc-select');minSelect.id='mpc-min';
minSelect.append(O('1','1 or more'),O('2','2 or more'),O('3','3 or more'),O('5','5 or more'));minLabel.append(minSelect);
selectors.append(searchLabel,regionLabel,sortLabel,minLabel);
const regionTabs=E('nav','mpc-region-tabs');regionTabs.setAttribute('aria-label','Filter by world region');
const status=E('p','mpc-status');status.id='mpc-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const reset=B('Clear geographic filters',resetAll,'mpc-secondary');
const controls=E('div','mpc-actions');
const copy=B('Copy country view link',copyURL,'mpc-secondary');
const globe=A('Global atlas','/#atlas','mpc-secondary');
const quality=A('Geographic coverage notes','/coverage/','mpc-secondary');
controls.append(reset,copy,globe,quality);
const active=E('div','mpc-chips');active.id='mpc-chips';
const spotlight=E('div','mpc-spotlight');spotlight.id='mpc-spotlight';
const chart=E('div','mpc-bars');chart.id='mpc-bars';
const cards=E('div','mpc-country-grid');cards.id='mpc-country-grid';
const more=B('Show remaining countries',()=>{maxShown=100;draw();},'mpc-secondary');
const less=B('Show fewer countries',()=>{maxShown=12;draw();},'mpc-secondary');
const countryButtons=E('div','mpc-actions');countryButtons.append(more,less);
const explorerTitle=E('h3','','Countries in these results');
const detail=E('section','mpc-detail');detail.id='mpc-country-detail';detail.setAttribute('aria-labelledby','mpc-detail-title');
const compare=E('section','mpc-compare');compare.id='mpc-country-compare';
const compareTitle=E('h3','','Compare country research coverage');
const compareDesc=E('p','mpc-note','Compare published record counts and category coverage. This does not rank real-world infrastructure or operational activity.');
const compareForm=E('div','mpc-compare-form');
const compareSelectA=E('select','mpc-select');compareSelectA.id='mpc-compare-a';compareSelectA.setAttribute('aria-label','First comparison country');
const compareSelectB=E('select','mpc-select');compareSelectB.id='mpc-compare-b';compareSelectB.setAttribute('aria-label','Second comparison country');
const swap=B('Swap countries',()=>{const prev=compareSelectA.value;compareSelectA.value=compareSelectB.value;compareSelectB.value=prev;compareRender();},'mpc-secondary');
compareForm.append(compareSelectA,compareSelectB,swap);
const compareBody=E('div','mpc-compare-body');compareBody.id='mpc-compare-body';
compare.append(compareTitle,compareDesc,compareForm,compareBody);
const exports=E('div','mpc-exports');
const csv=B('Export shown research CSV',()=>download('csv'),'mpc-primary');
const json=B('Export shown research JSON',()=>download('json'),'mpc-primary');
const directory=A('Browse selected country in directory','/directory/','mpc-secondary');directory.id='mpc-dir-link';
const guidance=A('Verification guide','/verification-guide/','mpc-secondary');
exports.append(csv,json,directory,guidance);
const notice=E('p','mpc-notice');notice.id='mpc-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
const caveat=E('details','mpc-caveat');
caveat.append(E('summary','','How to interpret the geographic information'),
 E('p','','A country or region identifies the broad reporting area of a research record. Coordinates are approximate; these reports do not independently verify current operations, physical site counts, public access or flight permission. Publication-date labels are not verified opening dates.'));
const errors=E('div','mpc-error');errors.hidden=true;errors.setAttribute('role','alert');
errors.append(E('p','','Country research is temporarily unavailable. The original country list and source-linked directory remain accessible.'),B('Retry loading',load,'mpc-primary'));
root.append(heading,pills,selectors,regionTabs,status,controls,active,spotlight,explorerTitle,chart,cards,countryButtons,detail,compare,exports,notice,caveat,errors);
function preserveURL(){
 if(!countryPage)return;
 const u=new URL(location.href);
 for(const k of ['country','region','cq','minimum'])u.searchParams.delete(k);
 if(current)u.searchParams.set('country',current);
 if(region)u.searchParams.set('region',region);
 if(query)u.searchParams.set('cq',query);
 if(minCount>1)u.searchParams.set('minimum',String(minCount));
 try{history.replaceState(null,'',u.pathname+u.search+u.hash)}catch{}
}
function restoreURL(){
 if(!countryPage)return;
 const q=new URLSearchParams(location.search);
 current=q.get('country')||'';region=q.get('region')||'';
 query=q.get('cq')||'';const m=Number(q.get('minimum')||1);minCount=[1,2,3,5].includes(m)?m:1;
}
function getLink(){
 const u=new URL('/countries/',location.origin);
 if(current)u.searchParams.set('country',current);
 if(region)u.searchParams.set('region',region);
 if(query)u.searchParams.set('cq',query);
 if(minCount>1)u.searchParams.set('minimum',String(minCount));
 if(current)u.hash='mpc-country-detail';
 return u.href;
}
function updateInputs(){
 search.value=query;regionSelect.value=region;sortSelect.value=sort;minSelect.value=String(minCount);
}
function setCurrent(name){
 current=current===name?'':name;projectShown=6;maxShown=12;
 region='';query='';minCount=1;
 updateInputs();draw();
 if(current)detail.scrollIntoView({behavior:'auto',block:'start'});
}
function setRegion(value){
 region=region===value?'':value;current='';projectShown=6;updateInputs();draw();
}
function resetAll(){
 current='';region='';query='';minCount=1;maxShown=12;projectShown=6;updateInputs();draw();search.focus({preventScroll:true});
}
function countryItems(name){return records.filter(x=>x.country===name);}
function countryGroups(){
 const map=new Map();
 for(const r of records){
  if(!map.has(r.country))map.set(r.country,{name:r.country,region:r.region,records:[]});
  map.get(r.country).records.push(r);
 }
 groups=[...map.values()].sort((a,b)=>b.records.length-a.records.length||a.name.localeCompare(b.name));
 regions=[...new Set(groups.map(x=>x.region))].sort();
}
function shown(){
 let list=groups.filter(c=>{
  const text=lower([c.name,c.region].join(' '));
  return (!region||c.region===region)&&(!current||c.name===current)&&c.records.length>=minCount&&
    lower(query).trim().split(/\s+/).filter(Boolean).every(q=>text.includes(q));
 });
 if(sort==='alpha')list.sort((a,b)=>a.name.localeCompare(b.name));
 else list.sort((a,b)=>b.records.length-a.records.length||a.name.localeCompare(b.name));
 return list;
}
function counts(items,key){
 const m=new Map();
 for(const p of items){const v=p[key]||'Unspecified';m.set(v,(m.get(v)||0)+1)}
 return [...m].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
}
function statsRender(){
 pills.replaceChildren();
 for(const [value,label] of [[records.length,'Research records'],[groups.length,'Countries'],[regions.length,'Regions'],
   [new Set(records.map(x=>x.infrastructureType)).size,'Infrastructure categories']]){
  const item=E('div','mpc-highlight');item.append(E('strong','',value),E('span','',label));pills.append(item);
 }
}
function tabsRender(){
 regionTabs.replaceChildren();
 regionTabs.append(B('All regions',()=>setRegion(''),'mpc-tab'));
 for(const name of regions)regionTabs.append(B(name,()=>setRegion(name),'mpc-tab'));
 for(const t of regionTabs.children)t.setAttribute('aria-pressed',String(t.textContent===(region||'All regions')));
}
function bookmarks(){
 const wrap=E('section','mpc-bookmarks');
 wrap.append(E('h3','','Your saved countries'),E('p','mpc-note',storageOK?
  'Pin up to three countries in this browser. No account or server-side sync.':
  'Your browser blocks local storage; bookmarks last only during this page.'));
 const row=E('div','mpc-bookmarks-row');
 if(!favorites.length)row.append(E('span','mpc-muted','No countries pinned yet.'));
 for(const country of favorites){
  const control=E('div','mpc-bookmark');
  control.append(B(country,()=>setCurrent(country),'mpc-chip'),B('Remove',()=>togglePin(country),'mpc-remove'));
  row.append(control);
 }
 wrap.append(row);return wrap;
}
function togglePin(name){
 if(favorites.includes(name)){favorites=favorites.filter(x=>x!==name);notice.textContent='Country unpinned.';}
 else if(favorites.length>=3){notice.textContent='Up to three countries can be pinned. Unpin one first.';return;}
 else{favorites.push(name);notice.textContent='Country pinned for this browser.';}
 keepFavorites();draw();
}
function cardsRender(list){
 chart.replaceChildren();cards.replaceChildren();
 const n=list.length;const max=Math.max(1,...list.map(x=>x.records.length));
 for(const c of list.slice(0,maxShown)){
  const bar=B('',()=>setCurrent(c.name),'mpc-bar');bar.setAttribute('aria-label',c.name+': '+c.records.length+' research records');
  bar.setAttribute('aria-pressed',String(current===c.name));
  const title=E('span','mpc-bar-head');title.append(E('span','',c.name),E('strong','',String(c.records.length)));
  const track=E('span','mpc-bar-track'),fill=E('span','mpc-bar-fill');fill.style.width=(100*c.records.length/max).toFixed(1)+'%';
  track.append(fill);bar.append(title,track);chart.append(bar);
  const card=E('article','mpc-country-card');
  card.append(E('span','mpc-region-label',c.region),E('h4','',c.name),
    E('p','mpc-country-count',c.records.length+' source-linked '+(c.records.length===1?'record':'records')));
  const types=counts(c.records,'infrastructureType').slice(0,3);
  const typeBox=E('div','mpc-type-tags');types.forEach(([name,n])=>typeBox.append(E('span','mpc-tag',name+' · '+n)));card.append(typeBox);
  const buttons=E('div','mpc-card-actions');
  buttons.append(B(current===c.name?'Close details':'Explore projects',()=>setCurrent(c.name),'mpc-primary'),
   A('View directory',filterHref('/directory/',c.name),'mpc-link'),
   B(favorites.includes(c.name)?'✓ Pinned':'☆ Pin country',()=>togglePin(c.name),'mpc-secondary'));
  card.append(buttons);cards.append(card);
 }
 more.hidden=n<=maxShown;less.hidden=maxShown<=12;
}
function detailRender(){
 detail.replaceChildren();
 if(!current){detail.hidden=true;return;}
 const rows=countryItems(current),group=groups.find(x=>x.name===current);
 if(!group){detail.hidden=true;return;}
 detail.hidden=false;
 const title=E('h3','','Research in '+current);title.id='mpc-detail-title';
 const hint=E('p','mpc-note',rows.length+' source-linked reports · '+group.region+' · locations approximate and operational status unverified.');
 const head=E('div','mpc-detail-head');
 const close=B('Close country details',()=>{current='';draw();},'mpc-secondary');
 head.append(title,close);detail.append(head,hint);
 const stats=E('div','mpc-detail-stats');
 for(const [n,label] of [[rows.length,'Reports'],[counts(rows,'infrastructureType').length,'Infrastructure types'],
 [rows.filter(x=>year(x)!=='Unspecified').length,'With explicit report year'],
 [rows.filter(x=>source(x)).length,'With source URL']]){
  const block=E('div','mpc-mini-stat');block.append(E('strong','',n),E('span','',label));stats.append(block);
 }
 detail.append(stats);
 const byType=E('div','mpc-detail-categories');
 for(const [name,n] of counts(rows,'infrastructureType')){
  byType.append(A(name+' · '+n,'/directory/?'+new URLSearchParams({country:current,type:name}),'mpc-chip'));
 }
 detail.append(byType);
 const actions=E('div','mpc-actions');
 actions.append(A('All '+current+' records',filterHref('/directory/',current),'mpc-primary'),
  A('Show approximate atlas markers','/?'+new URLSearchParams({country:current})+'#atlas','mpc-secondary'),
  A('Region: '+group.region,'/directory/?'+new URLSearchParams({region:group.region}),'mpc-secondary'));
 detail.append(actions);
 const list=E('div','mpc-project-grid');list.id='mpc-project-grid';
 for(const p of rows.slice(0,projectShown)){
  const card=E('article','mpc-project');
  card.append(E('h4','',p.name),E('p','',p.infrastructureType+' · '+(p.where||group.region)),
    E('p','mpc-report-date',p.reportDateLabel||'Publication date not stated'),
    E('p','mpc-evidence-note',p.verificationStatus||'Source-report verification pending'));
  const links=E('div','mpc-card-actions');links.append(A('Research passport',recordHref(p.id)));
  const href=source(p);
  if(href){const a=A('Original evidence ↗',href);a.target='_blank';a.rel='noopener noreferrer';links.append(a);}
  card.append(links);list.append(card);
 }
 detail.append(list);
 const buttons=E('div','mpc-actions');
 if(rows.length>projectShown)buttons.append(B('Show more project records',()=>{projectShown+=6;detailRender();},'mpc-secondary'));
 if(projectShown>6)buttons.append(B('Show fewer project records',()=>{projectShown=6;detailRender();},'mpc-secondary'));
 detail.append(buttons);
}
function comparisonRows(c){
 const r=countryItems(c);
 return {name:c,total:r.length,type:counts(r,'infrastructureType').length,years:r.filter(x=>year(x)!=='Unspecified').length,source:r.filter(x=>source(x)).length};
}
function compareRender(){
 compareBody.replaceChildren();
 selectedA=compareSelectA.value;selectedB=compareSelectB.value;
 if(!selectedA||!selectedB){compareBody.append(E('p','mpc-muted','Choose two countries to compare reporting coverage.'));return;}
 const a=comparisonRows(selectedA),b=comparisonRows(selectedB);
 if(a.name===b.name){compareBody.append(E('p','mpc-muted','Choose two different countries.'));return;}
 const table=E('table','mpc-table');
 const caption=E('caption','','Research-record coverage comparison. No operational ranking.');table.append(caption);
 const header=E('tr');for(const cell of ['Metric',a.name,b.name])header.append(E('th','',cell));table.append(header);
 for(const [label,key] of [['Research records','total'],['Infrastructure categories','type'],
 ['With report-year label','years'],['With source URL','source']]){
  const row=E('tr');for(const v of [label,a[key],b[key]])row.append(E('td','',v));table.append(row);
 }
 compareBody.append(table,A('Browse '+a.name,filterHref('/directory/',a.name)),
 A('Browse '+b.name,filterHref('/directory/',b.name)));
}
function activeRender(){
 active.replaceChildren();
 for(const [label,value,clear] of [
  ['Country',current,()=>{current='';draw();}],
  ['Region',region,()=>{region='';updateInputs();draw();}],
  ['Search',query,()=>{query='';updateInputs();draw();}],
  ['Minimum',minCount>1?String(minCount):'',()=>{minCount=1;updateInputs();draw();}]
 ]){
  if(!value)continue;
  const chip=B(label+': '+value+' ✕',clear,'mpc-chip');
  chip.setAttribute('aria-label','Remove '+label+' filter '+value);active.append(chip);
 }
 if(!active.childElementCount)active.append(E('span','mpc-muted','All countries included'));
}
function draw(){
 if(!isReady)return;
 if(current&&!groups.some(x=>x.name===current))current='';
 if(region&&!regions.includes(region))region='';
 const list=shown();const countReports=list.reduce((sum,c)=>sum+c.records.length,0);
 status.textContent=list.length+' of '+groups.length+' countries · '+countReports+' matching research records';
 activeRender();tabsRender();
 spotlight.replaceChildren();spotlight.append(bookmarks());
 cardsRender(list);detailRender();compareRender();
 directory.href=current?filterHref('/directory/',current):region?
  '/directory/?'+new URLSearchParams({region}):'/directory/';
 reset.disabled=!current&&!region&&!query&&minCount===1;
 csv.disabled=json.disabled=!list.length;
 preserveURL();
}
function exportRows(){
 return [...new Set(shown().flatMap(g=>g.records))];
}
function download(format){
 const items=exportRows();if(!items.length)return;
 let text,type,file;
 if(format==='json'){
  text=JSON.stringify({title:'MicroportMap geographic research subset',count:items.length,
    filters:{country:current,region,search:query,minRecords:minCount},
    caveat:'Source reports only; operations and access not independently verified.',
    records:items},null,2);
  type='application/json;charset=utf-8';file='microportmap-countries.json';
 }else{
  const keys=['id','name','country','region','infrastructureType','reportDateLabel','verificationStatus','sourceUrl'];
  const quote=x=>{let s=String(x??'');if(/^[\s\uFEFF]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  text='\uFEFF'+[keys,...items.map(p=>keys.map(k=>k==='sourceUrl'?source(p)||'':p[k]))]
    .map(row=>row.map(quote).join(',')).join('\r\n');
  type='text/csv;charset=utf-8';file='microportmap-countries.csv';
 }
 let url,anchor;
 try{
  url=URL.createObjectURL(new Blob([text],{type}));
  anchor=E('a');anchor.href=url;anchor.download=file;document.body.append(anchor);anchor.click();
  notice.textContent=format.toUpperCase()+' export requested for '+items.length+' original research records.';
 }catch{notice.textContent='Download unavailable. Open the directory for another export.';}
 finally{anchor?.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),30000);}
}
async function copyURL(){
 const url=getLink();
 try{await navigator.clipboard.writeText(url);notice.textContent='Country view link copied.';}
 catch{notice.textContent='Copy this link: '+url;}
}
function fill(){
 countryGroups();restoreURL();
 regionSelect.replaceChildren(O('','All regions'));
 for(const name of regions)regionSelect.append(O(name,name));
 compareSelectA.replaceChildren(O('','Choose first country'));
 compareSelectB.replaceChildren(O('','Choose second country'));
 for(const c of groups){compareSelectA.append(O(c.name,c.name));compareSelectB.append(O(c.name,c.name));}
 if(groups.length>1){compareSelectA.value=groups[0].name;compareSelectB.value=groups[1].name;}
 statsRender();isReady=true;updateInputs();draw();
 document.body.classList.add('mpc-ready');
 document.documentElement.dataset.mpcLoaded='1';
 if(location.hash==='#mpc-country-detail'&&current)setTimeout(()=>detail.scrollIntoView({behavior:'auto'}),200);
}
function load(){
 if(isLoading)return;isLoading=true;errors.hidden=true;status.textContent='Loading published research records…';
 fetch('/data/projects.json').then(r=>{if(!r.ok)throw Error('Data unavailable');return r.json();})
 .then(data=>{
  if(!Array.isArray(data.records)||data.records.length!==50||
   data.records.some(r=>!IDs(r))||new Set(data.records.map(r=>r.id)).size!==50)throw Error('Invalid catalogue');
  records=data.records.slice();isLoading=false;fill();
 }).catch(()=>{isLoading=false;errors.hidden=false;status.textContent='Could not load country research data.';});
}
function entryLinks(){
 for(const nav of document.querySelectorAll('.mp-continue-topics')){
  if(!nav.querySelector('[data-mpc-link]')){
   const link=A('Country explorer','/countries/');link.dataset.mpcLink='1';nav.append(link);
  }
 }
 const hero=document.querySelector('.hero-actions');
 if(hero&&!hero.querySelector('[data-mpc-link]')){const link=A('Explore countries →','/countries/','ghost');link.dataset.mpcLink='1';hero.append(link);}
 const insights=$('insights');
 if(insights&&!insights.querySelector('[data-mpc-link]')){
  const link=A('Country & region explorer','/countries/','mpc-secondary');link.dataset.mpcLink='1';
  insights.querySelector('.mpi-outputs')?.append(link);
 }
 if(coveragePage){
  const main=document.querySelector('main'),warning=main?.querySelector('.warning');
  if(warning){
   const panel=E('section','mpc-coverage-cta');
   panel.append(E('h2','','Explore country evidence interactively'),
    E('p','','Search country coverage, inspect original project reports and compare two geographic reporting groups without treating counts as operational capacity.'),
    A('Open Country & Region Explorer','/countries/','mpc-primary'));
   warning.insertAdjacentElement('afterend',panel);
  }
 }
}
search.addEventListener('input',()=>{query=search.value.trim();current='';maxShown=12;draw();});
regionSelect.addEventListener('change',()=>{region=regionSelect.value;current='';draw();});
sortSelect.addEventListener('change',()=>{sort=sortSelect.value;draw();});
minSelect.addEventListener('change',()=>{minCount=Number(minSelect.value)||1;current='';draw();});
compareSelectA.addEventListener('change',compareRender);
compareSelectB.addEventListener('change',compareRender);
window.addEventListener('popstate',()=>{if(isReady){restoreURL();updateInputs();draw();}});
entryLinks();
if(countryPage){
 const main=document.querySelector('main'),original=main?.querySelector('.columns'),warning=main?.querySelector('.warning');
 if(main){
  (warning||original||main.lastElementChild)?.insertAdjacentElement('afterend',root);
  load();
 }
}
window.MicroportCountries=Object.freeze({
 getState:()=>({loaded:isReady,countries:groups.length,region,country:current,query,visible:shown().length}),
 getVisible:()=>shown().map(c=>c.name),getRecords:()=>exportRows().map(r=>r.id)
});
})();