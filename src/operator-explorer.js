/* MicroportMap Reported Operators Explorer: literal attribution labels only. */
(()=>{
'use strict';
if(document.documentElement.dataset.mpoReady)return;
document.documentElement.dataset.mpoReady='initializing';
const isOperators=location.pathname.replace(/\/+$/,'/')==='/operators/';
const create=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;};
const anchor=(text,href,cls='mpo-link')=>{const e=create('a',cls,text);e.href=href;return e;};
const button=(text,fn,cls='mpo-button')=>{const e=create('button',cls,text);e.type='button';e.addEventListener('click',fn);return e;};
const option=(value,text)=>{const e=create('option','',text);e.value=value;return e;};
const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const yr=r=>(String(r.reportDateLabel||'').match(/\b20[0-9]{2}\b/)||[])[0]||'Unspecified';
const val=(p,k)=>String(p?.[k]||'Unspecified');
const safeURL=r=>{try{const x=new URL(r.source?.url);return x.protocol==='https:'&&!x.username&&!x.password?x.href:null;}catch{return null;}};
const projectUrl=r=>'/projects/'+encodeURIComponent(r.id)+'/';
const urlSearch=(key,value)=>'/directory/?'+new URLSearchParams({[key]:value});
const group=(items,fn)=>{
 const map=new Map();
 for(const r of items){const key=fn(r);if(!map.has(key))map.set(key,[]);map.get(key).push(r);}
 return [...map].map(([label,records])=>({label,records})).sort((a,b)=>b.records.length-a.records.length||a.label.localeCompare(b.label));
};
const distinct=(items,fn)=>new Set(items.map(fn)).size;
let all=[],operators=[],results=[],ready=false,pending=false,sort='count',minimum=1,limit=12,recordLimit=6,selected='',search='',country='',type='',region='',year='',comparisonLeft='',comparisonRight='';
const panel=create('section','mpo-explorer');panel.id='mpo-explorer';panel.setAttribute('aria-labelledby','mpo-title');
const intro=create('div','mpo-intro');
const title=create('h2','','Explore reported operators');title.id='mpo-title';
intro.append(create('p','mpo-kicker','OPERATORS / ORIGINAL SOURCE ATTRIBUTIONS'),title,
 create('p','mpo-lede','Browse exact operator attribution labels from the 50 research records. Some labels contain multiple named parties; we do not split them into independent companies or infer partnerships, ownership or operations.'));
const metrics=create('div','mpo-metrics');metrics.id='mpo-metrics';
const filters=create('div','mpo-filters');
const searchLabel=create('label','mpo-field');searchLabel.append(create('span','','Find reported operators'));
const query=create('input','mpo-input');query.type='search';query.id='mpo-query';query.autocomplete='off';query.placeholder='Operator, country, equipment…';searchLabel.append(query);filters.append(searchLabel);
const selects={};
for(const [id,label] of [['country','Country'],['type','Infrastructure'],['region','Region'],['year','Report year']]){
 const wrap=create('label','mpo-field'),e=create('select','mpo-select');e.id='mpo-'+id;
 e.append(option('','All '+label.toLowerCase()+'s'));selects[id]=e;wrap.append(create('span','',label),e);filters.append(wrap);
}
const minimumLabel=create('label','mpo-field');minimumLabel.append(create('span','','Minimum reports'));
const minimumSelect=create('select','mpo-select');minimumSelect.id='mpo-minimum';
for(const n of [1,2,3,5])minimumSelect.append(option(String(n),n===1?'Any number':n+' or more'));
minimumLabel.append(minimumSelect);filters.append(minimumLabel);
const orderLabel=create('label','mpo-field');orderLabel.append(create('span','','Operator ordering'));
const sortSelect=create('select','mpo-select');sortSelect.id='mpo-sort';
sortSelect.append(option('count','Most reports first'),option('alpha','Operator label A–Z'));
orderLabel.append(sortSelect);filters.append(orderLabel);
const reset=button('Clear filters',resetAll,'mpo-secondary');filters.append(reset);
const status=create('p','mpo-status');status.id='mpo-status';status.setAttribute('aria-live','polite');status.setAttribute('role','status');
const chips=create('div','mpo-chips');chips.id='mpo-chips';
const quick=create('div','mpo-quick');quick.id='mpo-quick';
const grid=create('div','mpo-grid');grid.id='mpo-grid';
const gridActions=create('div','mpo-actions');
const more=button('Show more operator labels',()=>{limit+=12;render();},'mpo-secondary');
const fewer=button('Show fewer labels',()=>{limit=12;render();},'mpo-secondary');gridActions.append(more,fewer);
const detail=create('section','mpo-detail');detail.id='mpo-detail';detail.setAttribute('aria-labelledby','mpo-detail-title');
const comparison=create('section','mpo-compare');comparison.id='mpo-compare';
const compareTitle=create('h3','','Compare reported attribution coverage');
const compareIntro=create('p','mpo-note','Compare descriptions in published records—not independent company size, operating capacity or commercial relationships.');
const compareFilters=create('div','mpo-compare-filters');
const left=create('select','mpo-select');left.id='mpo-compare-left';left.setAttribute('aria-label','First operator attribution label');
const right=create('select','mpo-select');right.id='mpo-compare-right';right.setAttribute('aria-label','Second operator attribution label');
const swap=button('Swap attribution labels',()=>{
 const first=left.value;left.value=right.value;right.value=first;renderComparison();
},'mpo-secondary');
compareFilters.append(left,right,swap);
const compareBody=create('div','mpo-comparison');compareBody.id='mpo-comparison';
comparison.append(compareTitle,compareIntro,compareFilters,compareBody);
const downloads=create('div','mpo-exports');
const json=button('Export matching JSON',()=>download('json'),'mpo-primary');
const csv=button('Export matching CSV',()=>download('csv'),'mpo-primary');
const copy=button('Copy filtered operator link',copyURL,'mpo-secondary');
const directory=anchor('Open matching directory','/directory/','mpo-secondary');directory.id='mpo-directory-link';
downloads.append(json,csv,copy,directory,anchor('Verification guide','/verification-guide/','mpo-secondary'));
const announcement=create('p','mpo-announcement');announcement.id='mpo-announcement';announcement.setAttribute('role','status');announcement.setAttribute('aria-live','polite');
const caveat=create('details','mpo-disclosure');
caveat.append(create('summary','','What does “reported operator” mean?'),
 create('p','','Attribution labels are retained exactly as published in each research record. A slash, comma or conjunction is not proof of a formal partnership. Project counts are source-backed references, not verified facilities, current operations, access, or aircraft permissions. Date labels describe reporting rather than opening dates.'));
const err=create('div','mpo-error');err.hidden=true;err.setAttribute('role','alert');
err.append(create('p','','The enhanced operator explorer could not load. Original operator references and directory links remain available.'),button('Retry research data',load,'mpo-primary'));
panel.append(intro,metrics,filters,chips,status,quick,grid,gridActions,detail,comparison,downloads,announcement,caveat,err);
const displayYear=r=>yr(r);
function groupsForView(){
 const filtered=all.filter(p=>{
  if(country&&val(p,'country')!==country)return false;
  if(type&&val(p,'infrastructureType')!==type)return false;
  if(region&&val(p,'region')!==region)return false;
  if(year&&yr(p)!==year)return false;
  const text=fold([p.reportedOperator,p.name,p.country,p.region,p.infrastructureType,p.reportedEquipment,p.where].join(' '));
  return fold(search).trim().split(/\s+/).filter(Boolean).every(term=>text.includes(term));
 });
 let list=group(filtered,p=>val(p,'reportedOperator')).filter(o=>o.records.length>=minimum);
 if(selected)list=list.filter(o=>o.label===selected);
 if(sort==='alpha')list.sort((a,b)=>a.label.localeCompare(b.label));
 results=list.flatMap(o=>o.records);
 return list;
}
function onSelect(value){
 selected=selected===value?'':value;
 recordLimit=6;render();
 if(selected)detail.scrollIntoView({behavior:'auto',block:'nearest'});
}
function clearOnly(key){
 if(key==='selected')selected='';
 else if(key==='search')search='';
 else if(key==='minimum')minimum=1;
 else if(key==='country')country='';
 else if(key==='type')type='';
 else if(key==='region')region='';
 else if(key==='year')year='';
 recordLimit=6;syncFields();render();
}
function resetAll(){search='';country='';type='';region='';year='';selected='';minimum=1;limit=12;recordLimit=6;syncFields();render();query.focus({preventScroll:true});}
function syncFields(){query.value=search;for(const [key,value] of Object.entries({country,type,region,year}))selects[key].value=value;minimumSelect.value=String(minimum);sortSelect.value=sort;}
function setupSelects(){
 const fields={country:p=>val(p,'country'),type:p=>val(p,'infrastructureType'),region:p=>val(p,'region'),year:displayYear};
 for(const [key,fn] of Object.entries(fields)){
  selects[key].replaceChildren(option('','All '+key+'s'));
  for(const {label} of group(all,fn))selects[key].append(option(label,label==='Unspecified'&&key==='year'?'Report year unspecified':label));
  if(![...selects[key].options].some(x=>x.value===({country,type,region,year})[key])){
   if(key==='country')country='';if(key==='type')type='';if(key==='region')region='';if(key==='year')year='';
  }
 }
 left.replaceChildren(option('','First attribution'));right.replaceChildren(option('','Second attribution'));
 for(const o of operators){left.append(option(o.label,o.label));right.append(option(o.label,o.label));}
 if(operators.length>1){left.value=operators[0].label;right.value=operators[1].label;}
 syncFields();
}
function filterURL(){
 const u=new URL('/operators/',location.origin);
 for(const [key,value] of [['op_q',search],['op_country',country],['op_type',type],['op_region',region],['op_year',year],['op_label',selected]]){
  if(value)u.searchParams.set(key,value);
 }
 if(minimum>1)u.searchParams.set('op_min',String(minimum));
 return u;
}
function syncURL(){
 if(!isOperators)return;
 const u=new URL(location.href);
 for(const key of ['op_q','op_country','op_type','op_region','op_year','op_label','op_min'])u.searchParams.delete(key);
 const normalized=filterURL();
 for(const [key,value] of normalized.searchParams)u.searchParams.set(key,value);
 try{history.replaceState(null,'',u.pathname+u.search+u.hash);}catch{}
}
function restore(){
 const params=new URLSearchParams(location.search);
 search=params.get('op_q')||'';country=params.get('op_country')||'';
 type=params.get('op_type')||'';region=params.get('op_region')||'';
 year=params.get('op_year')||'';selected=params.get('op_label')||'';
 const m=Number(params.get('op_min')||'1');minimum=[1,2,3,5].includes(m)?m:1;
 if(!operators.some(o=>o.label===selected))selected='';
}
function renderStats(labels){
 metrics.replaceChildren();
 for(const [n,name] of [[results.length,'Matching records'],[labels.length,'Matching attribution labels'],
 [distinct(results,p=>val(p,'country')),'Countries in matched records'],
 [distinct(results,p=>val(p,'infrastructureType')),'Infrastructure categories'],
 [results.filter(p=>safeURL(p)).length,'Records with source URLs']]){
  const box=create('div','mpo-metric');box.append(create('strong','',n),create('span','',name));metrics.append(box);
 }
}
function renderQuick(labels){
 quick.replaceChildren();
 quick.append(create('h3','','Common attribution labels'),create('p','mpo-note','The leading counts are derived from the published catalogue, without splitting combined names.'));
 const choices=create('div','mpo-quick-actions');
 for(const item of operators.slice(0,6)){
  const b=button(item.label+' · '+item.records.length,()=>onSelect(item.label),'mpo-chip');
  b.setAttribute('aria-pressed',String(selected===item.label));choices.append(b);
 }
 quick.append(choices);
}
function renderChips(){
 chips.replaceChildren();
 for(const [key,label,value] of [
  ['search','Search',search],['country','Country',country],['region','Region',region],
  ['type','Infrastructure',type],['year','Report year',year],['selected','Attribution',selected],
  ['minimum','Min records',minimum>1?String(minimum):'']]){
  if(!value)continue;
  const x=button(label+': '+value+' ✕',()=>clearOnly(key),'mpo-chip');
  x.setAttribute('aria-label','Remove '+label+' filter '+value);chips.append(x);
 }
 if(!chips.childElementCount)chips.append(create('span','mpo-muted','All reported operator labels'));
}
function renderGrid(list){
 grid.replaceChildren();
 if(!list.length)grid.append(create('p','mpo-empty','No reported operator labels match these filters. Clear a filter to see more.'));
 for(const o of list.slice(0,limit)){
  const card=create('article','mpo-card');
  card.append(create('small','','PUBLISHED ATTRIBUTION'),create('h4','',o.label),
   create('p','',o.records.length+' source-linked '+(o.records.length===1?'record':'records')),
   create('p','',distinct(o.records,p=>val(p,'country'))+' '+(distinct(o.records,p=>val(p,'country'))===1?'country':'countries')+' · '+distinct(o.records,p=>val(p,'infrastructureType'))+' categories'));
  const types=create('div','mpo-tags');
  for(const t of [...new Set(o.records.map(p=>val(p,'infrastructureType')))].slice(0,3))types.append(create('span','mpo-tag',t));
  card.append(types);
  const actions=create('div','mpo-card-actions');
  const inspect=button(selected===o.label?'Close research details':'View source-backed records',()=>onSelect(o.label),'mpo-primary');
  actions.append(inspect,anchor('Search directory',urlSearch('q',o.label)));
  card.append(actions);grid.append(card);
 }
 more.hidden=list.length<=limit;fewer.hidden=limit<=12;
}
function renderDetail(){
 detail.replaceChildren();
 if(!selected){detail.hidden=true;return;}
 const groupData=operators.find(x=>x.label===selected);
 if(!groupData){detail.hidden=true;return;}
 const rows=groupData.records.filter(p=>results.includes(p));detail.hidden=false;
 const header=create('div','mpo-detail-head');
 const h=create('h3','','Research attributed to '+selected);h.id='mpo-detail-title';
 header.append(h,button('Close details',()=>clearOnly('selected'),'mpo-secondary'));detail.append(header,
  create('p','mpo-note','This is the exact reported attribution text; relationships and operational responsibility are not independently established.'));
 const counts=create('div','mpo-detail-metrics');
 for(const [n,name] of [[rows.length,'Published records'],[distinct(rows,p=>val(p,'country')),'Countries'],
 [distinct(rows,p=>val(p,'infrastructureType')),'Infrastructure categories'],[rows.filter(p=>displayYear(p)!=='Unspecified').length,'With explicit report year']]){
  const item=create('div','mpo-small-stat');item.append(create('strong','',n),create('span','',name));counts.append(item);
 }
 detail.append(counts);
 const filters=create('div','mpo-card-actions');
 for(const c of [...new Set(rows.map(p=>val(p,'country')))]){
  filters.append(anchor('Country: '+c,urlSearch('country',c),'mpo-chip'));
 }
 for(const cat of [...new Set(rows.map(p=>val(p,'infrastructureType')))]){
  filters.append(anchor('Type: '+cat,urlSearch('type',cat),'mpo-chip'));
 }
 detail.append(filters);
 const cards=create('div','mpo-projects');
 for(const p of rows.slice(0,recordLimit)){
  const card=create('article','mpo-project');
  card.append(create('h4','',p.name),create('p','',p.country+' · '+p.infrastructureType),
   create('p','','Reported equipment: '+val(p,'reportedEquipment')),
   create('p','mpo-project-date','Source date label: '+(p.reportDateLabel||'Unspecified')),
   create('p','mpo-project-caveat',p.verificationStatus||'Current operations unverified'));
  const links=create('div','mpo-card-actions');
  links.append(anchor('Research passport',projectUrl(p)));
  const source=safeURL(p);
  if(source){const a=anchor('Original evidence ↗',source);a.target='_blank';a.rel='noopener noreferrer';links.append(a);}
  card.append(links);cards.append(card);
 }
 detail.append(cards);
 const controls=create('div','mpo-actions');
 if(rows.length>recordLimit)controls.append(button('Show more attributed projects',()=>{recordLimit+=6;renderDetail();},'mpo-secondary'));
 if(recordLimit>6)controls.append(button('Show fewer attributed projects',()=>{recordLimit=6;renderDetail();},'mpo-secondary'));
 detail.append(controls);
}
function comparisonMetrics(label){
 const rows=operators.find(x=>x.label===label)?.records||[];
 return {total:rows.length,countries:distinct(rows,p=>val(p,'country')),
  types:distinct(rows,p=>val(p,'infrastructureType')),
  years:rows.filter(p=>displayYear(p)!=='Unspecified').length,sources:rows.filter(safeURL).length};
}
function renderComparison(){
 compareBody.replaceChildren();comparisonLeft=left.value;comparisonRight=right.value;
 if(!comparisonLeft||!comparisonRight){compareBody.append(create('p','mpo-note','Choose two attribution labels to compare their research coverage.'));return;}
 if(comparisonLeft===comparisonRight){compareBody.append(create('p','mpo-note','Choose two different attribution labels.'));return;}
 const l=comparisonMetrics(comparisonLeft),r=comparisonMetrics(comparisonRight),table=create('table','mpo-table');
 table.append(create('caption','','Published record coverage only — not company size or operating status.'));
 const header=create('tr');for(const v of ['Coverage measure',comparisonLeft,comparisonRight])header.append(create('th','',v));table.append(header);
 for(const [label,key] of [['Reported projects','total'],['Countries','countries'],['Infrastructure types','types'],['With report year','years'],['With valid source URL','sources']]){
  const row=create('tr');for(const value of [label,l[key],r[key]])row.append(create('td','',value));table.append(row);
 }
 compareBody.append(table,anchor('Find '+comparisonLeft,urlSearch('q',comparisonLeft)),anchor('Find '+comparisonRight,urlSearch('q',comparisonRight)));
}
function render(){
 if(!ready)return;
 const list=groupsForView();
 status.textContent=list.length+' attribution labels · '+results.length+' matching research records';
 renderStats(list);renderQuick(list);renderChips();renderGrid(list);renderDetail();renderComparison();
 const dir=new URL('/directory/',location.origin);
 if(country)dir.searchParams.set('country',country);
 if(type)dir.searchParams.set('type',type);
 if(region)dir.searchParams.set('region',region);
 if(year)dir.searchParams.set('year',year);
 if(search||selected)dir.searchParams.set('q',[search,selected].filter(Boolean).join(' '));
 directory.href=dir.pathname+dir.search;
 reset.disabled=!search&&!selected&&!country&&!type&&!region&&!year&&minimum===1;
 json.disabled=csv.disabled=!results.length;
 syncURL();
}
function exportCSV(rows){
 const keys=['id','name','reportedOperator','country','region','infrastructureType','reportedEquipment','reportDateLabel','verificationStatus','sourceUrl'];
 const quote=v=>{let s=String(v??'');if(/^[\s\uFEFF]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return '\uFEFF'+[keys,...rows.map(p=>keys.map(k=>k==='sourceUrl'?safeURL(p)||'':p[k]))].map(r=>r.map(quote).join(',')).join('\r\n');
}
function download(format){
 if(!results.length)return;
 const selectedRows=results.filter(p=>groupsForView().some(x=>x.label===val(p,'reportedOperator')));
 if(!selectedRows.length)return;
 const file='microportmap-reported-operators.'+format;
 const contents=format==='json'?JSON.stringify({
  title:'MicroportMap published operator attributions',count:selectedRows.length,
  filters:{search,country,type,region,year,selected,minimum},
  caveat:'Exact reported labels only, not verified affiliations or operational status.',records:selectedRows},null,2):exportCSV(selectedRows);
 let href,tag;
 try{
  href=URL.createObjectURL(new Blob([contents],{type:format==='json'?'application/json;charset=utf-8':'text/csv;charset=utf-8'}));
  tag=create('a');tag.href=href;tag.download=file;document.body.append(tag);tag.click();
  announcement.textContent=format.toUpperCase()+' export requested for '+selectedRows.length+' records.';
 }catch{announcement.textContent='Download unavailable. Use the published directory export.';}
 finally{tag?.remove();if(href)setTimeout(()=>URL.revokeObjectURL(href),30000);}
}
async function copyURL(){
 const url=filterURL().toString();
 try{await navigator.clipboard.writeText(url);announcement.textContent='Filtered operator link copied.';}
 catch{announcement.textContent='Copy this link: '+url;}
}
function load(){
 if(pending)return;pending=true;err.hidden=true;status.textContent='Loading original research catalogue…';
 fetch('/data/projects.json').then(r=>{if(!r.ok)throw Error('Unavailable');return r.json();}).then(data=>{
  if(!Array.isArray(data.records)||data.records.length!==50||
   data.records.some(p=>!p||typeof p.id!=='string'||!/^[a-z0-9-]+$/.test(p.id)||typeof p.name!=='string'||!p.name.trim())||
   new Set(data.records.map(p=>p.id)).size!==50)throw Error('Invalid dataset');
  all=data.records.slice();operators=group(all,p=>val(p,'reportedOperator'));pending=false;
  restore();setupSelects();ready=true;render();document.body.classList.add('mpo-loaded');
  document.documentElement.dataset.mpoLoaded='1';
 }).catch(()=>{pending=false;err.hidden=false;status.textContent='Could not load published operator data.';});
}
query.addEventListener('input',()=>{search=query.value.trim();selected='';limit=12;render();});
for(const id of ['country','type','region','year'])selects[id].addEventListener('change',()=>{
 if(id==='country')country=selects[id].value;
 if(id==='type')type=selects[id].value;
 if(id==='region')region=selects[id].value;
 if(id==='year')year=selects[id].value;
 selected='';limit=12;render();
});
minimumSelect.addEventListener('change',()=>{minimum=Number(minimumSelect.value)||1;selected='';render();});
sortSelect.addEventListener('change',()=>{sort=sortSelect.value;render();});
left.addEventListener('change',renderComparison);right.addEventListener('change',renderComparison);
window.addEventListener('popstate',()=>{if(ready){restore();syncFields();render();}});
function entryLinks(){
 for(const nav of document.querySelectorAll('.mp-continue-topics')){
  if(nav.querySelector('[data-mpo-link]'))continue;
  const link=anchor('Reported operator explorer','/operators/');link.dataset.mpoLink='1';nav.append(link);
 }
 const tech=document.querySelector('.mpe-outputs');
 if(tech&&!tech.querySelector('[data-mpo-link]')){const link=anchor('Reported operator research','/operators/','mpe-secondary');link.dataset.mpoLink='1';tech.append(link);}
 const insights=document.querySelector('.mpi-outputs');
 if(insights&&!insights.querySelector('[data-mpo-link]')){const link=anchor('Operators in sources','/operators/','mpi-secondary');link.dataset.mpoLink='1';insights.append(link);}
}
entryLinks();
if(isOperators){
 const main=document.querySelector('main'),columns=main?.querySelector('.columns');
 if(main){(columns||main.lastElementChild)?.insertAdjacentElement('afterend',panel);load();}
}
window.MicroportOperators=Object.freeze({
 getState:()=>({ready,records:results.length,labels:groupsForView().length,selected,country,type,region,year,search,minimum}),
 getOperatorLabels:()=>operators.map(x=>x.label),getRecordIds:()=>results.map(x=>x.id)
});
})();