/* MicroportMap Field Inspector · ten source-qualified field actions on each of 50 passports. */
(()=>{
'use strict';
const match=location.pathname.match(/^\/projects\/([a-z0-9-]+)\/?$/);
if(!match||document.getElementById('mpf-inspector'))return;
const id=match[1],main=document.querySelector('main');
if(!main)return;
const definitions=[
 ['name','Project title',p=>p.name,'Catalogue project title, not a verified site name.'],
 ['where','Reported place',p=>p.where,'Source-reported place; not a landing coordinate or site-access instruction.'],
 ['country','Reported country',p=>p.country,'Geographic research grouping, not an authorization jurisdiction.'],
 ['region','Region',p=>p.region,'Editorial region grouping, not a surveyed operational boundary.'],
 ['infrastructureType','Infrastructure category',p=>p.infrastructureType,'Editorial classification of research, not a certified facility designation.'],
 ['reportedOperator','Operator attribution',p=>p.reportedOperator,'The full attribution text; combined names do not prove a partnership.'],
 ['reportedEquipment','Equipment description',p=>p.reportedEquipment,'Exact reported description; models and specifications are unverified.'],
 ['locationPrecision','Location precision',p=>p.locationPrecision,'Describes approximation in the research map, not physical accuracy.'],
 ['reportDateLabel','Source report label',p=>p.reportDateLabel,'Report timing is not a verified opening or commissioning date.'],
 ['sourceURL','Original source URL',p=>safeSource(p)||'', 'Original public source link, not independent confirmation of current operations.']
];
const caveat='Public source-linked research only. No independent confirmation of current operations, exact landing coordinates, access, ownership or aviation permission.';
const E=(tag,cls,copy)=>{
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(copy!==undefined)n.textContent=String(copy);
 return n;
};
const safeSource=p=>{try{const url=new URL(p.source?.url);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}};
const passportURL='https://microportmap.com/projects/'+encodeURIComponent(id)+'/';
let record=null,ready=false,busy=false,copyRequest=0;
const root=E('details','mpf-inspector');root.id='mpf-inspector';
const summary=E('summary','mpf-summary','Inspect and copy 10 research fields');
summary.setAttribute('aria-controls','mpf-field-list');root.append(summary);
const body=E('div','mpf-body');
const introduction=E('p','mpf-intro','Copy individual fields with their project, source and meaning attached. Field values are as reported in the original catalogue; copying is not a verification or submission.');
const grid=E('div','mpf-field-list');grid.id='mpf-field-list';
const status=E('p','mpf-status');status.id='mpf-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const fallback=E('div','mpf-fallback');fallback.hidden=true;
const manual=E('textarea','mpf-manual');manual.rows=5;manual.readOnly=true;manual.setAttribute('aria-label','Manually copy the selected research field');
fallback.append(E('p','','Automatic clipboard unavailable. Select and copy this text manually.'),manual);
const disclosure=E('p','mpf-disclaimer',caveat);
const retry=E('button','mpf-retry','Retry field details');retry.type='button';retry.hidden=true;retry.addEventListener('click',load);
body.append(introduction,grid,status,fallback,disclosure,retry);root.append(body);
const host=main.querySelector('.columns')||main.querySelector('.hero');
if(host)host.insertAdjacentElement('afterend',root);else main.append(root);
function normalizedValue(def){
 const value=def[2](record);
 return typeof value==='string'&&value.trim()?value:'Not recorded in catalogue';
}
function fieldText(def){
 const source=safeSource(record)||'Original HTTPS source URL unavailable';
 return [
  'MicroportMap public research field',
  'Research project: '+record.name,
  'Field: '+def[1],
  'Reported value: '+normalizedValue(def),
  'What this means: '+def[3],
  'Original source: '+source,
  'Research passport: '+passportURL,
  'Limitations: '+caveat
 ].join('\n');
}
async function copyField(def){
 if(!ready||!record)return false;
 const request=++copyRequest;
 fallback.hidden=true;manual.value='';
 status.textContent='Copying '+def[1].toLowerCase()+' with source context…';
 const value=fieldText(def);
 let timeout;
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard not supported');
  await Promise.race([
   navigator.clipboard.writeText(value),
   new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Copy timed out')),800);})
  ]);
  if(request!==copyRequest)return false;
  status.textContent=def[1]+' copied with source context. Nothing was submitted.';
  return true;
 }catch{
  if(request!==copyRequest)return false;
  manual.value=value;fallback.hidden=false;manual.focus({preventScroll:true});manual.select();
  status.textContent=def[1]+' prepared for manual copying. Nothing was submitted.';
  return false;
 }finally{if(timeout)clearTimeout(timeout);}
}
function render(){
 grid.replaceChildren();
 for(const def of definitions){
  const [key,label,,hint]=def;
  const row=E('article','mpf-row');row.dataset.mpfFieldRow=key;
  const content=E('div','mpf-content');
  content.append(E('strong','mpf-label',label),E('p','mpf-value',normalizedValue(def)),E('small','mpf-hint',hint));
  const copy=E('button','mpf-copy','Copy field');
  copy.type='button';copy.dataset.mpfField=key;
  copy.setAttribute('aria-label','Copy '+label+' with source context');
  copy.addEventListener('click',()=>copyField(def));
  row.append(content,copy);grid.append(row);
 }
 root.dataset.mpfReady='true';ready=true;
 summary.textContent='Inspect and copy 10 research fields';
 status.textContent='Ten original catalogue fields ready for this project.';
}
function load(){
 if(busy)return;busy=true;ready=false;record=null;copyRequest++;
 root.dataset.mpfReady='false';root.setAttribute('aria-busy','true');
 grid.replaceChildren();fallback.hidden=true;manual.value='';
 retry.hidden=true;retry.disabled=true;status.textContent='Loading original research fields…';
 const controller=new AbortController();let timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Field lookup timed out'));},12000);});
 Promise.race([deadline,(async()=>{
  const response=await fetch('/data/projects.json',{signal:controller.signal});
  if(!response.ok)throw Error('Catalogue unavailable');return response.json();
 })()]).then(data=>{
  const rows=data?.records;
  if(!Array.isArray(rows)||rows.length<50||rows.some(p=>!p||typeof p.id!=='string'||!/^[a-z0-9-]+$/.test(p.id)||typeof p.name!=='string'||!p.name.trim())||
   new Set(rows.map(p=>p.id)).size!==rows.length)throw Error('Invalid catalogue');
  record=rows.find(p=>p.id===id);if(!record)throw Error('Project not in catalogue');
  render();
 }).catch(()=>{ready=false;record=null;grid.replaceChildren();root.dataset.mpfReady='false';summary.textContent='Field inspector temporarily unavailable';retry.hidden=false;status.textContent='The original passport remains available.';})
 .finally(()=>{busy=false;retry.disabled=false;root.setAttribute('aria-busy','false');clearTimeout(timer);});
}
window.MicroportFields=Object.freeze({
 getState:()=>({ready,loading:busy,projectId:id,count:ready?definitions.length:0}),
 getFieldKeys:()=>definitions.map(d=>d[0]),
 getFieldText:key=>{const def=definitions.find(d=>d[0]===key);return ready&&def?fieldText(def):'';},
 copyField:key=>{const def=definitions.find(d=>d[0]===key);return ready&&def?copyField(def):false;}
});
load();
})();