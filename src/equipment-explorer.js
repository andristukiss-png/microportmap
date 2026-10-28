/* MicroportMap Technology & Equipment Explorer: source-reported labels, not certified hardware. */
(()=>{
'use strict';
if(document.documentElement.dataset.mpeInitialized)return;
document.documentElement.dataset.mpeInitialized='1';
const isTech=location.pathname.replace(/\/+$/,'/')==='/technologies/';
const E=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x;};
const A=(name,href,cls='mpe-link')=>{const x=E('a',cls,name);x.href=href;return x;};
const B=(name,handler,cls='mpe-button')=>{const x=E('button',cls,name);x.type='button';x.addEventListener('click',handler);return x;};
const Opt=(value,label)=>{const x=E('option','',label);x.value=value;return x;};
const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const getYear=p=>(String(p.reportDateLabel??'').match(/\b20\d\d\b/)||[])[0]||'Unspecified';
const equipment=p=>p.reportedEquipment||'Unspecified';
const category=p=>p.infrastructureType||'Unspecified';
const country=p=>p.country||'Unspecified';
const evidenceURL=p=>{
 try{const u=new URL(p.source?.url);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}
 catch{return null}
};
const projectURL=id=>'/projects/'+encodeURIComponent(id)+'/';
const directoryURL=(name,value)=>'/directory/?'+new URLSearchParams({[name]:value});
const count=(records,key)=>{
 const map=new Map();
 for(const p of records){const value=String(key(p));map.set(value,(map.get(value)||0)+1);}
 return [...map].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
};
const unique=(records,key)=>new Set(records.map(key)).size;
const fields={q:'',type:'',country:'',year:'',equipment:''};
let records=[],matches=[],loaded=false,loading=false,sort='name',equipSort='count',
 recordLimit=6,equipLimit=10,view='equipment',compareA='',compareB='',generation=0,copyRequest=0;
const root=E('section','mpe-explorer');root.id='mpe-explorer';root.setAttribute('aria-labelledby','mpe-title');
const heading=E('div','mpe-intro');
const title=E('h2','','Explore reported technologies and equipment');
title.id='mpe-title';
heading.append(E('p','mpe-kicker','TECHNOLOGY / SOURCE-REPORTED EQUIPMENT'),title,
 E('p','mpe-lede','Explore the infrastructure categories and exact equipment descriptions recorded in source-linked reports. Labels are descriptive, may overlap, and are not independent equipment certifications.'));
const stats=E('div','mpe-stats');stats.id='mpe-stats';
const filters=E('div','mpe-filters');
const searchLabel=E('label','mpe-field');searchLabel.append(E('span','','Search reported technology'));
const search=E('input','mpe-input');search.id='mpe-search';search.type='search';search.autocomplete='off';
search.placeholder='Dock, inspection, DJI, operator…';searchLabel.append(search);filters.append(searchLabel);
const selectors={};
for(const [id,headingName] of [['type','Infrastructure category'],['country','Reported country'],['year','Source report year']]){
 const label=E('label','mpe-field'),select=E('select','mpe-select');
 select.id='mpe-'+id;select.append(Opt('','All '+headingName.toLowerCase()+'s'));
 label.append(E('span','',headingName),select);selectors[id]=select;filters.append(label);
}
const clearAll=B('Clear all filters',reset,'mpe-secondary');filters.append(clearAll);
const status=E('p','mpe-status');status.id='mpe-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const active=E('div','mpe-active');active.id='mpe-active';
const categoryHeading=E('h3','','Infrastructure categories');
const categoryList=E('div','mpe-category-grid');categoryList.id='mpe-categories';
const modeActions=E('div','mpe-mode-actions');
const showEquipment=B('Equipment labels',()=>setView('equipment'),'mpe-tab');
const showProjects=B('Project records',()=>setView('projects'),'mpe-tab');
modeActions.append(showEquipment,showProjects);
const equipmentArea=E('section','mpe-equipment');equipmentArea.id='mpe-equipment';
const equipmentTop=E('div','mpe-section-head');
equipmentTop.append(E('h3','','Reported equipment labels'),
 E('p','mpe-note','These are literal descriptions from the research catalogue. A label can mention multiple systems; equal or similar labels are not necessarily interchangeable.'));
const equipmentOrder=E('select','mpe-select');equipmentOrder.id='mpe-equipment-sort';
equipmentOrder.setAttribute('aria-label','Sort reported equipment labels');
equipmentOrder.append(Opt('count','Most mentioned first'),Opt('alpha','Equipment labels A–Z'));
equipmentTop.append(equipmentOrder);
const equipmentList=E('div','mpe-equipment-list');equipmentList.id='mpe-equipment-list';
const moreEquipment=B('Show more equipment labels',()=>{equipLimit+=10;renderEquipment();},'mpe-secondary');
const lessEquipment=B('Show fewer labels',()=>{equipLimit=10;renderEquipment();},'mpe-secondary');
const equipmentFoot=E('div','mpe-more');equipmentFoot.append(moreEquipment,lessEquipment);
equipmentArea.append(equipmentTop,equipmentList,equipmentFoot);
const projects=E('section','mpe-projects');projects.id='mpe-projects';
const projectHeader=E('div','mpe-section-head');
projectHeader.append(E('h3','','Research projects behind the labels'),
 E('p','mpe-note','Inspect the published record, reported equipment, report-date context and its original source.'));
const projectSort=E('select','mpe-select');projectSort.id='mpe-project-sort';
projectSort.setAttribute('aria-label','Sort matching projects');
projectSort.append(Opt('name','Name A–Z'),Opt('country','Country A–Z'),Opt('year','Newest report year'));
projectHeader.append(projectSort);
const projectCards=E('div','mpe-project-grid');projectCards.id='mpe-project-grid';
const moreProjects=B('Show more matching projects',()=>{recordLimit+=6;renderProjects();},'mpe-secondary');
const lessProjects=B('Show fewer projects',()=>{recordLimit=6;renderProjects();},'mpe-secondary');
const projectFoot=E('div','mpe-more');projectFoot.append(moreProjects,lessProjects);
projects.append(projectHeader,projectCards,projectFoot);
const compare=E('section','mpe-compare');compare.id='mpe-compare';
compare.append(E('h3','','Compare infrastructure categories'),
 E('p','mpe-note','Compare only the coverage of our published research. These counts do not establish hardware compatibility, deployments, current operations, or commercial market share.'));
const compareSelectors=E('div','mpe-compare-controls');
const compareSelectA=E('select','mpe-select');compareSelectA.id='mpe-compare-a';compareSelectA.setAttribute('aria-label','First infrastructure category');
const compareSelectB=E('select','mpe-select');compareSelectB.id='mpe-compare-b';compareSelectB.setAttribute('aria-label','Second infrastructure category');
const swap=B('Swap categories',()=>{
 const old=compareSelectA.value;compareSelectA.value=compareSelectB.value;compareSelectB.value=old;renderCompare();
},'mpe-secondary');
compareSelectors.append(compareSelectA,compareSelectB,swap);
const comparison=E('div','mpe-table-scroll');comparison.id='mpe-comparison';
compare.append(compareSelectors,comparison);
const outputs=E('div','mpe-outputs');
const csv=B('Export matching CSV',()=>download('csv'),'mpe-primary');
const json=B('Export matching JSON',()=>download('json'),'mpe-primary');
const copy=B('Copy filtered technology link',copyURL,'mpe-secondary');
const directory=A('Open matching directory','/directory/','mpe-secondary');directory.id='mpe-directory-link';
outputs.append(csv,json,copy,directory,
 A('Research evidence guide','/verification-guide/','mpe-secondary'));
const message=E('p','mpe-announcement');message.id='mpe-message';message.setAttribute('role','status');message.setAttribute('aria-live','polite');
const disclosure=E('details','mpe-disclosure');disclosure.append(E('summary','','What do technology labels mean?'),
 E('p','','Infrastructure categories are editorial groups; equipment labels are transcribed as reported. They may mix multiple models or software references. Counts describe research entries, not individual machines, operating installations or independent verification. Report-year labels are not opening dates, and approximate map points do not grant flight access.'));
const errors=E('div','mpe-error');errors.hidden=true;errors.setAttribute('role','alert');
const retry=B('Retry loading technology records',load,'mpe-primary');
errors.append(E('p','','The enhanced technology catalogue is unavailable; the original technology mentions above and the project directory remain usable.'),retry);
root.append(heading,stats,filters,active,status,categoryHeading,categoryList,modeActions,equipmentArea,projects,compare,outputs,message,disclosure,errors);
function entryLinks(){
 for(const nav of document.querySelectorAll('.mp-continue-topics')){
  if(!nav.querySelector('[data-mpe-link]')){const l=A('Equipment explorer','/technologies/');l.dataset.mpeLink='1';nav.append(l);}
 }
 const hero=document.querySelector('.hero-actions');
 if(hero&&!hero.querySelector('[data-mpe-link]')){const l=A('Browse technologies →','/technologies/','ghost');l.dataset.mpeLink='1';hero.append(l);}
 const insights=document.querySelector('.mpi-outputs');
 if(insights&&!insights.querySelector('[data-mpe-link]')){const l=A('Technology & equipment','/technologies/','mpi-secondary');l.dataset.mpeLink='1';insights.append(l);}
 const trail=document.querySelector('.mpt-reads');
 if(trail&&!trail.querySelector('[data-mpe-link]')){const l=A('Technology references','/technologies/','mpt-link');l.dataset.mpeLink='1';trail.append(l);}
}
function pathURL(){
 const url=new URL('/technologies/',location.origin);
 for(const [key,param] of [['q','tech_q'],['type','tech_type'],['country','tech_country'],['year','tech_year'],['equipment','tech_equipment']]){
  if(fields[key])url.searchParams.set(param,fields[key]);
 }
 return url;
}
function restore(){
 const params=new URLSearchParams(location.search);
 for(const [key,param] of [['q','tech_q'],['type','tech_type'],['country','tech_country'],['year','tech_year'],['equipment','tech_equipment']]){
  fields[key]=params.get(param)||'';
 }
}
function syncURL(){
 if(!isTech)return;
 const url=new URL(location.href);
 for(const [key,param] of [['q','tech_q'],['type','tech_type'],['country','tech_country'],['year','tech_year'],['equipment','tech_equipment']]){
  url.searchParams.delete(param);
  if(fields[key])url.searchParams.set(param,fields[key]);
 }
 try{history.replaceState(null,'',url.pathname+url.search+url.hash);}catch{}
}
function syncInputs(){
 search.value=fields.q;
 for(const key of ['type','country','year'])selectors[key].value=fields[key];
}
function reset(){
 Object.assign(fields,{q:'',type:'',country:'',year:'',equipment:''});
 recordLimit=6;equipLimit=10;syncInputs();filter();search.focus({preventScroll:true});
}
function setFilter(key,value){
 fields[key]=fields[key]===value?'':value;
 recordLimit=6;equipLimit=10;syncInputs();filter();
}
function setView(next){
 view=next;
 equipmentArea.hidden=next!=='equipment';
 projects.hidden=next!=='projects';
 showEquipment.setAttribute('aria-pressed',String(next==='equipment'));
 showProjects.setAttribute('aria-pressed',String(next==='projects'));
}
function categoryCounts(rows){return count(rows,category);}
function renderStats(){
 stats.replaceChildren();
 for(const [value,label] of [[matches.length,'Matching research records'],
  [unique(matches,category),'Infrastructure categories'],
  [unique(matches,equipment),'Exact equipment labels'],
  [unique(matches,country),'Countries represented'],
  [matches.filter(p=>getYear(p)!=='Unspecified').length,'With explicit report year']]){
  const item=E('div','mpe-stat');item.append(E('strong','',value),E('span','',label));stats.append(item);
 }
}
function renderCategories(){
 categoryList.replaceChildren();
 for(const [name,n] of categoryCounts(matches)){
  const row=B('',()=>setFilter('type',name),'mpe-category');
  row.setAttribute('aria-label','Filter by '+name+': '+n+' matching records');
  row.setAttribute('aria-pressed',String(fields.type===name));
  row.append(E('strong','',name),E('span','',n+' research '+(n===1?'record':'records')),
   E('small','','Explore reported projects →'));
  categoryList.append(row);
 }
 if(!categoryList.childElementCount)categoryList.append(E('p','mpe-empty','No categories match these filters.'));
}
function renderEquipment(){
 equipmentList.replaceChildren();
 let entries=count(matches,equipment);
 if(equipSort==='alpha')entries.sort((a,b)=>a[0].localeCompare(b[0]));
 const size=entries.length;
 for(const [name,n] of entries.slice(0,equipLimit)){
  const item=B('',()=>{setFilter('equipment',name);setView('projects');},'mpe-equipment-item');
  item.setAttribute('aria-label','Show '+name+': '+n+' matching research records');
  item.setAttribute('aria-pressed',String(fields.equipment===name));
  item.append(E('strong','',name),E('span','',n+' '+(n===1?'record':'records')),E('small','','Show supporting records →'));
  equipmentList.append(item);
 }
 if(!size)equipmentList.append(E('p','mpe-empty','No reported-equipment labels match these filters.'));
 moreEquipment.hidden=size<=equipLimit;
 lessEquipment.hidden=equipLimit<=10;
}
function sortedProjects(){
 const result=matches.slice();
 if(sort==='country')result.sort((a,b)=>country(a).localeCompare(country(b))||a.name.localeCompare(b.name));
 else if(sort==='year')result.sort((a,b)=>(Number(getYear(b))||0)-(Number(getYear(a))||0)||a.name.localeCompare(b.name));
 else result.sort((a,b)=>a.name.localeCompare(b.name));
 return result;
}
function renderProjects(){
 projectCards.replaceChildren();
 const items=sortedProjects();
 for(const p of items.slice(0,recordLimit)){
  const card=E('article','mpe-project-card');
  card.append(E('small','mpe-project-kicker',country(p)+' · '+category(p)),
   E('h4','',p.name),E('p','mpe-equipment-fact','Reported equipment: '+equipment(p)),
   E('p','mpe-country-fact',p.where||country(p)),
   E('p','mpe-report-fact','Source date: '+(p.reportDateLabel||'Not stated')),
   E('p','mpe-evidence-fact',p.verificationStatus||'Current operations unverified'));
  const actions=E('div','mpe-card-links');
  actions.append(A('Research passport',projectURL(p.id)));
  const url=evidenceURL(p);
  if(url){const source=A('Original evidence ↗',url);source.rel='noopener noreferrer';source.target='_blank';actions.append(source);}
  actions.append(A('Compare projects','/directory/?'+new URLSearchParams({compare:p.id})+'#project-comparison'));
  card.append(actions);projectCards.append(card);
 }
 if(!items.length)projectCards.append(E('p','mpe-empty','No projects match. Remove an active filter to see more.'));
 moreProjects.hidden=items.length<=recordLimit;
 lessProjects.hidden=recordLimit<=6;
}
function metric(type){
 const subset=records.filter(p=>category(p)===type);
 return {count:subset.length,countries:unique(subset,country),
  labels:unique(subset,equipment),
  years:subset.filter(p=>getYear(p)!=='Unspecified').length,
  sources:subset.filter(p=>evidenceURL(p)).length};
}
function renderCompare(){
 comparison.replaceChildren();
 compareA=compareSelectA.value;compareB=compareSelectB.value;
 if(!compareA||!compareB){comparison.append(E('p','mpe-note','Choose two categories to compare coverage.'));return;}
 if(compareA===compareB){comparison.append(E('p','mpe-note','Choose two different infrastructure categories.'));return;}
 const a=metric(compareA),b=metric(compareB),table=E('table','mpe-table');
 table.append(E('caption','','Research-record coverage comparison, not equipment performance.'));
 const th=E('tr');
 for(const v of ['Measure',compareA,compareB])th.append(E('th','',v));
 table.append(th);
 for(const [label,key] of [['Published research records','count'],['Countries in reports','countries'],
  ['Exact reported equipment labels','labels'],['With explicit source year','years'],
  ['With valid source URL','sources']]){
  const row=E('tr');for(const v of [label,a[key],b[key]])row.append(E('td','',v));
  table.append(row);
 }
 comparison.append(table,A('View '+compareA,'/directory/?'+new URLSearchParams({type:compareA})),
  A('View '+compareB,'/directory/?'+new URLSearchParams({type:compareB})));
}
function renderActive(){
 active.replaceChildren();
 for(const [key,label] of [['q','Search'],['type','Category'],['country','Country'],['year','Report year'],['equipment','Equipment']]){
  if(!fields[key])continue;
  const value=fields[key];
  const chip=B(label+': '+value+' ✕',()=>setFilter(key,value),'mpe-chip');
  chip.setAttribute('aria-label','Remove '+label+' filter '+value);
  active.append(chip);
 }
 if(!active.childElementCount)active.append(E('span','mpe-muted','All reported technology and equipment records'));
}
function filter(){
 if(!loaded)return;
 generation++;message.textContent='';
 matches=records.filter(p=>{
  if(fields.type&&category(p)!==fields.type)return false;
  if(fields.country&&country(p)!==fields.country)return false;
  if(fields.year&&getYear(p)!==fields.year)return false;
  if(fields.equipment&&equipment(p)!==fields.equipment)return false;
  const text=fold([p.name,p.where,p.country,p.region,p.infrastructureType,
   p.reportedEquipment,p.reportedOperator,p.description].join(' '));
  return fold(fields.q).split(/\s+/).filter(Boolean).every(word=>text.includes(word));
 });
 status.textContent=matches.length+' of '+records.length+' published records match your technology filters.';
 renderActive();renderStats();renderCategories();renderEquipment();renderProjects();
 clearAll.disabled=!Object.values(fields).some(Boolean);
 json.disabled=csv.disabled=!matches.length;
 const params=new URLSearchParams();
 if(fields.q||fields.equipment)params.set('q',[fields.q,fields.equipment].filter(Boolean).join(' '));
 if(fields.type)params.set('type',fields.type);
 if(fields.country)params.set('country',fields.country);
 if(fields.year)params.set('year',fields.year);
 directory.href='/directory/'+(params.size?'?'+params:'');directory.removeAttribute('aria-disabled');
 syncURL();
}
function exportCSV(items){
 const keys=['id','name','country','region','infrastructureType','reportedEquipment','reportedOperator','reportDateLabel','verificationStatus','sourceUrl'];
 const cell=v=>{let s=String(v??'');if(/^[\s\uFEFF]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return '\uFEFF'+[keys,...items.map(p=>keys.map(k=>k==='sourceUrl'?evidenceURL(p)||'':p[k]))]
 .map(row=>row.map(cell).join(',')).join('\r\n');
}
function download(format){
 if(!loaded||!matches.length)return;
 copyRequest++;
 let blob,filename;
 if(format==='json'){
  blob=new Blob([JSON.stringify({title:'MicroportMap technology research subset',
   count:matches.length,filters:{...fields},
   caveat:'Published descriptions only. Equipment specifications and operations not independently verified.',
   records:matches},null,2)],{type:'application/json;charset=utf-8'});
  filename='microportmap-technology-research.json';
 }else{
  blob=new Blob([exportCSV(matches)],{type:'text/csv;charset=utf-8'});
  filename='microportmap-technology-research.csv';
 }
 let url,anchor;
 try{
  url=URL.createObjectURL(blob);anchor=E('a');anchor.href=url;anchor.download=filename;
  document.body.append(anchor);anchor.click();
  message.textContent=format.toUpperCase()+' export requested for '+matches.length+' research records.';
 }catch{message.textContent='Export failed to start. Try the directory export.';}
 finally{anchor?.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),30000);}
}
async function copyURL(){
 if(!loaded)return;
 const url=pathURL().toString(),version=generation,request=++copyRequest,current=()=>version===generation&&request===copyRequest;
 let timer;
 try{
  await Promise.race([navigator.clipboard.writeText(url),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Clipboard timed out')),5000);})]);
  if(current())message.textContent='Technology filter link copied.';
 }catch{if(current())message.textContent='Copy this URL: '+url;}
 finally{clearTimeout(timer);}
}
function prepare(){
 const types=count(records,category).map(x=>x[0]);
 const countries=count(records,country).map(x=>x[0]);
 const years=count(records,getYear).map(x=>x[0]);
 for(const [key,list] of [['type',types],['country',countries],['year',years]]){
  selectors[key].replaceChildren(Opt('','All '+key+'s'));
  list.forEach(v=>selectors[key].append(Opt(v,v==='Unspecified'&&key==='year'?'Year unspecified':v)));
  if(!list.includes(fields[key]))fields[key]='';
 }
 const labels=count(records,equipment).map(x=>x[0]);if(!labels.includes(fields.equipment))fields.equipment='';
 compareSelectA.replaceChildren(Opt('','First category'));
 compareSelectB.replaceChildren(Opt('','Second category'));
 for(const type of types){compareSelectA.append(Opt(type,type));compareSelectB.append(Opt(type,type));}
 if(types.length>1){compareSelectA.value=types[0];compareSelectB.value=types[1];}
 syncInputs();loaded=true;filter();renderCompare();setView('equipment');document.body.classList.add('mpe-ready');
 document.documentElement.dataset.mpeLoaded='1';
}
function controls(available){
 [search,...Object.values(selectors),clearAll,showEquipment,showProjects,equipmentOrder,projectSort,moreEquipment,lessEquipment,moreProjects,lessProjects,compareSelectA,compareSelectB,swap,csv,json,copy].forEach(n=>{n.disabled=!available;});
}
function clearData(){
 loaded=false;records=[];matches=[];controls(false);
 document.body.classList.remove('mpe-ready');delete document.documentElement.dataset.mpeLoaded;
 [stats,active,categoryList,equipmentList,projectCards,comparison].forEach(n=>n.replaceChildren());
 moreEquipment.hidden=lessEquipment.hidden=moreProjects.hidden=lessProjects.hidden=true;
 directory.removeAttribute('href');directory.setAttribute('aria-disabled','true');
}
async function load(){
 if(loading)return;
 loading=true;generation++;retry.disabled=true;errors.hidden=true;clearData();message.textContent='';root.setAttribute('aria-busy','true');status.textContent='Loading source-linked equipment research…';
 const controller=new AbortController();let timer;
 try{
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Equipment lookup timed out'));},15000);});
  const data=await Promise.race([deadline,(async()=>{const response=await fetch('/data/projects.json',{signal:controller.signal});if(!response.ok)throw Error('Unavailable');return response.json();})()]);
  if(!Array.isArray(data.records)||data.records.length<50||
     data.records.some(x=>!x||typeof x.id!=='string'||!/^[a-z0-9-]+$/.test(x.id)||typeof x.name!=='string'||!x.name.trim())||
     new Set(data.records.map(x=>x.id)).size!==data.records.length)throw Error('Invalid catalogue');
  records=data.records.slice();restore();controls(true);prepare();
 }catch{clearData();errors.hidden=false;status.textContent='Could not load equipment research.';}
 finally{clearTimeout(timer);loading=false;retry.disabled=false;root.setAttribute('aria-busy','false');}
}
function normalizeRestoredFilters(){
 for(const key of ['type','country','year'])if(![...selectors[key].options].some(o=>o.value===fields[key]))fields[key]='';
 if(!records.some(p=>equipment(p)===fields.equipment))fields.equipment='';
}
search.addEventListener('input',()=>{fields.q=search.value.trim();recordLimit=6;equipLimit=10;filter();});
for(const key of ['type','country','year'])selectors[key].addEventListener('change',()=>{fields[key]=selectors[key].value;recordLimit=6;filter();});
equipmentOrder.addEventListener('change',()=>{equipSort=equipmentOrder.value;renderEquipment();});
projectSort.addEventListener('change',()=>{sort=projectSort.value;recordLimit=6;renderProjects();});
compareSelectA.addEventListener('change',renderCompare);
compareSelectB.addEventListener('change',renderCompare);
window.addEventListener('popstate',()=>{if(loaded){restore();normalizeRestoredFilters();syncInputs();filter();}});
entryLinks();
if(isTech){
 const main=document.querySelector('main'),columns=main?.querySelector('.columns');
 if(main){
  (columns||main.lastElementChild)?.insertAdjacentElement('afterend',root);
  load();
 }
}
window.MicroportEquipment=Object.freeze({
 getState:()=>({loaded,matching:matches.length,type:fields.type,country:fields.country,year:fields.year,equipment:fields.equipment,search:fields.q}),
 getIds:()=>matches.map(p=>p.id),getTypes:()=>count(matches,category),getLabels:()=>count(matches,equipment)
});
})();