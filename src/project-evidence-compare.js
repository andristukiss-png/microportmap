/* Project Evidence Comparison · 50 original passports × ten reported-field comparisons. */
(()=>{
'use strict';
const match=location.pathname.match(/^\/projects\/([a-z0-9-]+)\/?$/);
if(!match||document.getElementById('mpd-compare'))return;
const primaryId=match[1],main=document.querySelector('main');
if(!main)return;
const caveat='These values are public research descriptions, not independently verified operating sites, ownership relationships, equipment specifications, landing coordinates, public access, or flight permissions.';
const fields=[
 ['country','Reported country',p=>p.country,'Country of the reported research reference; not a site-access permission.'],
 ['region','World region',p=>p.region,'Broad editorial geography, not a surveyed operating boundary.'],
 ['infrastructureType','Infrastructure category',p=>p.infrastructureType,'Catalogue classification, not an independently certified facility type.'],
 ['reportedOperator','Operator attribution',p=>p.reportedOperator,'Names are quoted as reported; a shared term does not establish a partnership.'],
 ['reportedEquipment','Equipment description',p=>p.reportedEquipment,'Reported labels can mix hardware and software; they are not model certifications.'],
 ['where','Reported location',p=>p.where,'Places are approximate references; differences are not travel distances.'],
 ['locationPrecision','Location precision',p=>p.locationPrecision,'Compare how precisely each record describes its location, not accuracy.'],
 ['reportDateLabel','Source report timing',p=>p.reportDateLabel,'Report labels do not establish project opening or current operational dates.'],
 ['verificationStatus','Research verification status',p=>p.verificationStatus,'Status describes research limitations; matching text is not external verification.'],
 ['sourceName','Original source attribution',p=>p.source?.name,'Source publisher/type wording is attributed to the original research record.']
];
const E=(tag,cls,text)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(text!==undefined)node.textContent=String(text);
 return node;
};
const L=(label,url,cls='mpd-link')=>{
 const node=E('a',cls,label);node.href=url;return node;
};
const B=(label,fn,cls='mpd-button')=>{
 const node=E('button',cls,label);node.type='button';node.addEventListener('click',fn);return node;
};
const safeURL=p=>{
 try{
  const u=new URL(p.source?.url);
  return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;
 }catch{return null;}
};
const value=(p,fn)=>{
 const text=fn(p);
 return typeof text==='string'&&text.trim()?text:'Not recorded in catalogue';
};
const byName=(a,b)=>a.name.localeCompare(b.name);
const compareRoute=id=>'/projects/'+encodeURIComponent(id)+'/';
let all=[],primary=null,other=null,ready=false,loading=false,active='',search='',sort='related',filtered=[],actionRequest=0;
const root=E('details','mpd-compare');root.id='mpd-compare';
const summary=E('summary','mpd-summary','Compare 10 published research fields with another project');
summary.setAttribute('aria-controls','mpd-content');
const body=E('div','mpd-content');body.id='mpd-content';
const lead=E('p','mpd-lede','Compare exact reported descriptions side by side; choose another source-linked project and inspect what matches or differs. Similar wording does not independently verify either report.');
const controls=E('div','mpd-controls');
const searchLabel=E('label','mpd-control','Find another project');
const query=E('input','mpd-search');query.type='search';query.placeholder='Project, place, operator…';query.setAttribute('aria-label','Filter comparison project options');
const optionLabel=E('label','mpd-control','Compare against');
const select=E('select','mpd-select');select.id='mpd-project-select';select.setAttribute('aria-label','Select comparison project');
const sortLabel=E('label','mpd-control','Suggested order');
const sortSelect=E('select','mpd-sort');
for(const [v,label] of [['related','Related first'],['name','Name A–Z'],['country','Country A–Z']]){
 const option=E('option','',label);option.value=v;sortSelect.append(option);
}
searchLabel.append(query);optionLabel.append(select);sortLabel.append(sortSelect);
controls.append(searchLabel,optionLabel,sortLabel);
const status=E('p','mpd-status');status.id='mpd-status';
status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const head=E('div','mpd-heading');
const primaryHeading=E('a','mpd-title-link','');primaryHeading.id='mpd-primary-title';primaryHeading.href=compareRoute(primaryId);
const secondaryHeading=E('a','mpd-title-link','');secondaryHeading.id='mpd-secondary-title';
head.append(primaryHeading,secondaryHeading);
const fieldsGrid=E('div','mpd-fields');fieldsGrid.id='mpd-fields';
const focus=E('section','mpd-focus');focus.id='mpd-focus';focus.setAttribute('aria-live','polite');
const references=E('div','mpd-references');references.id='mpd-references';
const actions=E('div','mpd-actions');
const copy=B('Copy comparison summary',copySummary,'mpd-primary');
const json=B('Download comparison JSON',()=>download('json'),'mpd-button');
const csv=B('Download comparison CSV',()=>download('csv'),'mpd-button');
const swap=B('Open compared project as primary',()=>{
 if(ready&&other)location.href=compareRoute(other.id)+'?comparison='+encodeURIComponent(primaryId);
},'mpd-button');
actions.append(copy,json,csv,swap);
const fallback=E('div','mpd-manual');fallback.hidden=true;
fallback.append(E('p','','Clipboard unavailable. You can select and copy this prepared comparison text.'));
const manualText=E('textarea','mpd-manual-text');manualText.readOnly=true;manualText.rows=5;
manualText.setAttribute('aria-label','Manual research comparison summary');fallback.append(manualText);
const disclosure=E('p','mpd-caveat',caveat);
const retry=B('Retry loading research comparisons',load,'mpd-button');retry.hidden=true;
body.append(lead,controls,status,head,fieldsGrid,focus,references,actions,fallback,disclosure,retry);
root.append(summary,body);
const host=document.getElementById('mpf-inspector')||main.querySelector('.columns')||main.querySelector('.hero');
if(host)host.insertAdjacentElement('afterend',root);else main.append(root);
function score(p){
 if(!primary)return 0;
 return (p.country===primary.country?4:0)+
   (p.infrastructureType===primary.infrastructureType?3:0)+
   (p.region===primary.region?1:0);
}
function orderOptions(){
 const others=all.filter(p=>p.id!==primaryId);
 if(sort==='country')others.sort((a,b)=>value(a,p=>p.country).localeCompare(value(b,p=>p.country))||byName(a,b));
 else if(sort==='name')others.sort(byName);
 else others.sort((a,b)=>score(b)-score(a)||byName(a,b));
 return others;
}
function applyOptions(){
 if(!ready)return;
 const needle=search.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 filtered=orderOptions().filter(p=>[p.name,p.country,p.region,p.infrastructureType,p.reportedEquipment,p.reportedOperator].join(' ')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(needle));
 const current=other?.id;
 select.replaceChildren();
 if(!filtered.length){
  const empty=E('option','','No matching projects');empty.value='';select.append(empty);select.disabled=true;
 }else{
  select.disabled=false;
  for(const project of filtered){
   const opt=E('option','',project.name+' · '+value(project,p=>p.country));
   opt.value=project.id;select.append(opt);
  }
  if(filtered.some(p=>p.id===current))select.value=current;
  else{other=filtered[0];select.value=other.id;}
 }
 if(!filtered.length)other=null;
 renderComparison();
}
function explain(a,b){
 if(a==='Not recorded in catalogue'||b==='Not recorded in catalogue')return 'At least one record omits this field';
 if(a===b)return 'Same reported wording (not independent corroboration)';
 return 'Different published wording';
}
function makeField(def){
 const [key,label,get,hint]=def;
 const left=value(primary,get),right=value(other,get);
 const section=E('article','mpd-field');section.dataset.mpdField=key;
 section.setAttribute('aria-label',label+' source-text comparison');
 section.append(E('h3','mpd-field-title',label));
 const values=E('div','mpd-values');
 values.append(E('p','mpd-value',left),E('p','mpd-value',right));
 section.append(values);
 const result=E('span','mpd-result',explain(left,right));section.append(result);
 const inspect=B(active===key?'Hide field context':'Inspect field context',()=>toggle(key),'mpd-inspect');
 inspect.dataset.mpdAction=key;inspect.setAttribute('aria-pressed',String(active===key));
 section.append(inspect);
 section.append(E('p','mpd-field-hint',hint));
 return section;
}
function toggle(key){
 if(!ready||!other)return false;
 const restoreFocus=document.activeElement?.dataset?.mpdAction===key;
 active=active===key?'':key;renderComparison();
 if(restoreFocus){
  const row=[...fieldsGrid.children].find(node=>node.dataset.mpdField===key);
  const button=row&&[...row.children].find(node=>node.dataset.mpdAction===key);
  button?.focus({preventScroll:true});
 }
 if(active)focus.scrollIntoView({behavior:'auto',block:'nearest'});
}
function renderFocus(){
 focus.replaceChildren();
 if(!active||!other){focus.hidden=true;return;}
 const def=fields.find(x=>x[0]===active);
 if(!def){focus.hidden=true;return;}
 focus.hidden=false;
 const left=value(primary,def[2]),right=value(other,def[2]);
 focus.append(E('h3','','Field context: '+def[1]),
  E('p','',def[3]),E('p','',explain(left,right)),
  E('p','','Project 1: '+primary.name+' — '+left),
  E('p','','Project 2: '+other.name+' — '+right),
  E('small','',caveat));
}
function addSourceLinks(){
 references.replaceChildren();
 for(const record of [primary,other]){
  const box=E('div','mpd-source');
  box.append(E('strong','',record.name));
  box.append(L('Research passport',compareRoute(record.id)));
  const uri=safeURL(record);
  if(uri){
   const source=L('Original source ↗',uri);
   source.target='_blank';source.rel='noopener noreferrer';box.append(source);
  }else box.append(E('span','','Original HTTPS link unavailable.'));
  references.append(box);
 }
}
function renderComparison(){
 actionRequest++;fallback.hidden=true;manualText.value='';
 fieldsGrid.replaceChildren();head.hidden=focus.hidden=references.hidden=!other;
 for(const control of [copy,json,csv,swap])control.disabled=!other;
 if(!other){
  active='';focus.replaceChildren();references.replaceChildren();secondaryHeading.textContent='';
  status.textContent='No projects match this search. Clear the filter to compare again.';
  return;
 }
 primaryHeading.textContent=primary.name;secondaryHeading.textContent=other.name;
 secondaryHeading.href=compareRoute(other.id);
 for(const def of fields)fieldsGrid.append(makeField(def));
 renderFocus();addSourceLinks();
 status.textContent='Comparing '+primary.name+' with '+other.name+' across 10 reported fields. '+filtered.length+' selectable projects.';
}
function fieldRows(){
 if(!ready||!other)return [];
 return fields.map(([key,label,get,hint])=>{
  const a=value(primary,get),b=value(other,get);
  return {id:key,label,primary:a,comparison:b,observation:explain(a,b),caveat:hint};
 });
}
function summaryText(){
 return 'MicroportMap research field comparison\n'+primary.name+' vs '+other.name+'\n\n'+
  fieldRows().map((r,i)=>(i+1)+'. '+r.label+'\n  '+primary.name+': '+r.primary+
   '\n  '+other.name+': '+r.comparison+'\n  '+r.observation+'\n  '+r.caveat).join('\n\n')+
  '\n\n'+caveat+
  '\nOriginal passports: https://microportmap.com'+compareRoute(primary.id)+
  ' and https://microportmap.com'+compareRoute(other.id);
}
async function copySummary(){
 if(!ready||!other)return false;
 const request=++actionRequest;
 const value=summaryText();fallback.hidden=true;manualText.value='';
 status.textContent='Copying the source-qualified comparison…';
 let timer;
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
  await Promise.race([navigator.clipboard.writeText(value),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Clipboard timeout')),800);})]);
  if(request!==actionRequest)return false;
  status.textContent='Source-qualified comparison copied; nothing was submitted.';
  return true;
 }catch{
  if(request!==actionRequest)return false;
  manualText.value=value;fallback.hidden=false;manualText.focus({preventScroll:true});manualText.select();
  status.textContent='Comparison prepared for manual copying; nothing was submitted.';
  return false;
 }finally{if(timer)clearTimeout(timer);}
}
function download(format){
 if(!ready||!other)return false;
 actionRequest++;fallback.hidden=true;manualText.value='';
 const rows=fieldRows();let text,mime;
 if(format==='json'){
  text=JSON.stringify({schema:'microportmap-evidence-comparison-v1',primaryId,comparisonId:other.id,
   caveat,fields:rows,projectSources:[safeURL(primary),safeURL(other)]},null,2);
  mime='application/json;charset=utf-8';
 }else{
  const cell=v=>{let s=String(v??'');if(/^[\s\uFEFF]*[=+@-]/.test(s))s="'"+s;
   return '"'+s.replace(/"/g,'""')+'"';};
  text='\uFEFF'+[['field_id','field','project_1_value','project_2_value','observation','limitations'],
   ...rows.map(r=>[r.id,r.label,r.primary,r.comparison,r.observation,r.caveat])].map(r=>r.map(cell).join(',')).join('\r\n');
  mime='text/csv;charset=utf-8';
 }
 let url,link;
 try{
  url=URL.createObjectURL(new Blob([text],{type:mime}));
  link=E('a');link.href=url;link.download='microportmap-'+primaryId+'-vs-'+other.id+'.'+format;
  document.body.append(link);link.click();status.textContent='Comparison '+format.toUpperCase()+' download requested.';
 }catch{status.textContent='Download unavailable. Try copying the comparison text.';}
 finally{link?.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),30000);}
}
function selectOther(id){
 if(!ready)return false;
 const found=all.find(p=>p.id===id&&p.id!==primaryId);
 if(!found)return false;
 if(!filtered.some(p=>p.id===id)){search='';query.value='';}
 other=found;active='';applyOptions();return true;
}
function load(){
 if(loading)return;
 loading=true;ready=false;all=[];primary=null;other=null;filtered=[];active='';
 renderComparison();root.dataset.mpdReady='false';root.setAttribute('aria-busy','true');
 query.disabled=select.disabled=sortSelect.disabled=true;
 retry.hidden=true;retry.disabled=true;status.textContent='Loading original project descriptions…';
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 fetch('/data/projects.json',{signal:controller.signal})
 .then(r=>{if(!r.ok)throw Error('Research catalogue unavailable');return r.json();})
 .then(data=>{
  const rows=data?.records;
  if(!Array.isArray(rows)||rows.length<50||
    rows.some(p=>!p||typeof p.id!=='string'||!/^[a-z0-9-]+$/.test(p.id)||typeof p.name!=='string'||!p.name.trim())||
    new Set(rows.map(p=>p.id)).size!==rows.length)throw Error('Invalid published catalogue');
  all=rows.slice();primary=all.find(p=>p.id===primaryId);
  if(!primary)throw Error('Passport not in published catalogue');
  ready=true;query.disabled=sortSelect.disabled=false;
  const requested=new URLSearchParams(location.search).get('comparison');
  other=all.find(p=>p.id===requested&&p.id!==primaryId)||orderOptions()[0];
  applyOptions();
  root.dataset.mpdReady='true';
 }).catch(()=>{
  ready=false;all=[];primary=null;other=null;filtered=[];renderComparison();select.replaceChildren();
  status.textContent='Comparison temporarily unavailable. The original passport remains readable.';
  retry.hidden=false;root.dataset.mpdReady='false';
 }).finally(()=>{loading=false;retry.disabled=false;root.setAttribute('aria-busy','false');clearTimeout(timer);});
}
query.addEventListener('input',()=>{search=query.value;applyOptions();});
select.addEventListener('change',()=>selectOther(select.value));
sortSelect.addEventListener('change',()=>{sort=sortSelect.value;applyOptions();});
window.MicroportEvidenceCompare=Object.freeze({
 getState:()=>({ready,loading,primaryId,otherId:other?.id||null,fields:ready&&other?fields.length:0,active}),
 getFields:()=>fieldRows().map(r=>({...r})),
 getOtherOptions:()=>orderOptions().map(p=>p.id),
 choose:id=>selectOther(id),
 focus:key=>fields.some(f=>f[0]===key)&&ready&&other?(toggle(key),true):false
});
load();
})();