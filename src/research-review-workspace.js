/* MicroportMap Review Workspace: ten user-controlled diligence tasks per original research record. */
(()=>{
'use strict';
const match=location.pathname.match(/^\/projects\/([a-z0-9-]+)\/?$/);
if(!match||document.getElementById('mpr-workspace'))return;
const id=match[1],main=document.querySelector('main');
if(!main)return;
const KEY='microportmap.review-workspace.v1',MAX_NOTES=600;
const prompts=[
 ['source','Check the original source','Read the linked publication and note what it actually states.'],
 ['timing','Check the source timing','Confirm whether the report date can be established from the original publication.'],
 ['claim','Check the reported claim','Compare the public article with this research record’s description.'],
 ['country','Check country and locality','Review the reported country and place against the source.'],
 ['precision','Check location precision','Distinguish an approximate research map point from a surveyed landing coordinate.'],
 ['operator','Check attribution wording','Examine the exact reported operator label; do not infer formal partnerships.'],
 ['equipment','Check hardware descriptions','Check reported equipment wording without assuming models are identical.'],
 ['current','Investigate current activity','Seek independent evidence of present-day operation; historic reporting alone is insufficient.'],
 ['access','Investigate access restrictions','Check whether any public access rights or site restrictions are documented.'],
 ['permission','Investigate aviation permissions','Verify flight regulations and authorizations separately; the research listing is not approval.']
];
const allowed=new Set(['not-started','reviewed','follow-up']);
const element=(tag,cls,label)=>{
 const n=document.createElement(tag);if(cls)n.className=cls;
 if(label!==undefined)n.textContent=String(label);
 return n;
};
const button=(label,handler,cls='mpr-button')=>{
 const n=element('button',cls,label);n.type='button';n.addEventListener('click',handler);return n;
};
const safeSource=p=>{try{
 const u=new URL(p.source?.url);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;
}catch{return null;}};
const fallback=()=>Object.fromEntries(prompts.map(([key])=>[key,{status:'not-started',note:''}]));
let record=null,ready=false,loading=false,storageAvailable=true,items=fallback(),saved={},loadFailed=false,copyRequest=0;
const dirty=new Set();
function normalize(data){
 const out=fallback();
 if(data&&typeof data==='object'&&!Array.isArray(data))for(const [key] of prompts){
  const r=data[key];
  if(!r||typeof r!=='object')continue;
  out[key].status=allowed.has(r.status)?r.status:'not-started';
  out[key].note=typeof r.note==='string'?r.note.slice(0,MAX_NOTES):'';
 }
 return out;
}
function storedReviews(){
 const raw=localStorage.getItem(KEY),data=raw?JSON.parse(raw):{};
 return data&&typeof data==='object'&&!Array.isArray(data)?data:{};
}
function restore(){
 try{
  saved=storedReviews();
  const incoming=normalize(saved[id]);
  for(const key of dirty)incoming[key]={...items[key]};
  items=incoming;storageAvailable=dirty.size===0;
 }catch{storageAvailable=false;}
}
function clearPrepared(){
 copyRequest++;manual.hidden=true;copyInput.value='';notice.textContent='';
}
function syncControls(){
 for(const row of taskList.children){
  const key=row.dataset.mprKey;if(!items[key])continue;
  const controls=row.children[1],select=controls.children[0].children[0],note=controls.children[1].children[0];
  if(select.value!==items[key].status)select.value=items[key].status;
  if(note.value!==items[key].note)note.value=items[key].note;
 }
}
function persist(changedKey){
 clearPrepared();
 if(changedKey)dirty.add(changedKey);else for(const [key] of prompts)dirty.add(key);
 try{
  const latest=storedReviews(),merged=normalize(latest[id]);
  for(const key of dirty)merged[key]={...items[key]};
  latest[id]=merged;
  localStorage.setItem(KEY,JSON.stringify(latest));
  saved=latest;items=merged;dirty.clear();storageAvailable=true;
 }catch{storageAvailable=false;}
 syncControls();
}
const root=element('section','mpr-workspace');root.id='mpr-workspace';
root.setAttribute('aria-labelledby','mpr-title');
const intro=element('div','mpr-intro');
const title=element('h2','','Research verification workspace');title.id='mpr-title';
const sub=element('p','mpr-intro-text','Ten practical questions for independent research follow-up. Set your own progress; a “Reviewed” mark is your personal checklist status, not a MicroportMap verification or flight authorization.');
intro.append(element('p','mpr-kicker','SOURCE DILIGENCE / PRIVATE REVIEW'),title,sub);
const evidence=element('div','mpr-evidence');evidence.id='mpr-evidence';
const meta=element('div','mpr-meta');meta.id='mpr-meta';
const progress=element('p','mpr-progress');progress.id='mpr-progress';progress.setAttribute('role','status');progress.setAttribute('aria-live','polite');
const progressTrack=element('div','mpr-progress-track');
progressTrack.setAttribute('role','progressbar');progressTrack.setAttribute('aria-label','Research questions examined');
progressTrack.setAttribute('aria-valuemin','0');progressTrack.setAttribute('aria-valuemax','10');progressTrack.setAttribute('aria-valuenow','0');
const progressFill=element('span','mpr-progress-fill');progressTrack.append(progressFill);
const taskList=element('ol','mpr-tasks');taskList.id='mpr-tasks';
const actions=element('div','mpr-actions');
const exportJSON=button('Download review JSON',()=>download('json'),'mpr-primary');
const exportCSV=button('Download review CSV',()=>download('csv'),'mpr-primary');
const copy=button('Copy review summary',copySummary,'mpr-button');
const reset=button('Reset this project’s review',resetOne,'mpr-button');
const sourceLink=element('a','mpr-link','Open original source ↗');sourceLink.id='mpr-source';
actions.append(exportJSON,exportCSV,copy,reset,sourceLink);
const notice=element('p','mpr-notice');notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
const manual=element('div','mpr-manual');manual.hidden=true;
const copyInput=element('textarea','mpr-manual-text');copyInput.readOnly=true;copyInput.setAttribute('aria-label','Copy review summary manually');manual.append(copyInput);
const caveat=element('details','mpr-caveat');caveat.append(element('summary','','What does “reviewed” mean?'),
 element('p','','Reviewed means the visitor has examined this question and recorded their own notes. It does not mean the reported operator, equipment, site, public access or flight permission has been independently verified. Unanswered and follow-up questions are preserved as such.'));
const retry=button('Retry loading research record',load,'mpr-button');retry.hidden=true;
root.append(intro,evidence,meta,progress,progressTrack,taskList,actions,notice,manual,caveat,retry);
const marker=document.getElementById('mpp-toolkit')||main.querySelector('.columns')||main.querySelector('.hero');
if(marker)marker.insertAdjacentElement('afterend',root);else main.append(root);
function report(){
 const counts={reviewed:0,'follow-up':0,'not-started':0};
 for(const key of Object.keys(items))counts[items[key].status]++;
 const touched=10-counts['not-started'];
 progress.textContent=touched+' / 10 questions examined · '+counts.reviewed+' marked reviewed · '+counts['follow-up']+' need follow-up';
 progressTrack.setAttribute('aria-valuenow',String(touched));
 progressFill.style.width=(touched*10)+'%';
 meta.textContent=storageAvailable?'Private notes saved in this browser only. Clearing browser data removes them.':
  'Browser storage unavailable: progress is temporary for this page only.';
}
function questionRow(key,heading,hint,i){
 const row=element('li','mpr-item');row.dataset.mprKey=key;
 const text=element('div','mpr-question');
 text.append(element('span','mpr-number',String(i+1).padStart(2,'0')),
   element('strong','mpr-question-title',heading),element('p','mpr-hint',hint));
 const control=element('div','mpr-controls');
 const statusLabel=element('label','mpr-field','Your review status');
 const select=element('select','mpr-select');select.dataset.mprStatus=key;
 select.setAttribute('aria-label','Review status for '+heading);
 for(const [value,label] of [
  ['not-started','Not started'],['reviewed','Reviewed by me'],['follow-up','Needs follow-up']]){
  const opt=element('option','',label);opt.value=value;select.append(opt);
 }
 select.value=items[key].status;statusLabel.append(select);
 const noteLabel=element('label','mpr-field','Your private notes');
 const note=element('textarea','mpr-note');note.rows=2;note.maxLength=MAX_NOTES;
 note.setAttribute('aria-label','Private notes for '+heading);note.placeholder='Optional: evidence, open questions, next step…';
 note.dataset.mprNote=key;note.value=items[key].note;noteLabel.append(note);
 control.append(statusLabel,noteLabel);row.append(text,control);
 select.addEventListener('change',()=>{items[key].status=allowed.has(select.value)?select.value:'not-started';persist(key);report();});
 note.addEventListener('input',()=>{items[key].note=note.value.slice(0,MAX_NOTES);persist(key);report();});
 return row;
}
function render(){
 clearPrepared();taskList.replaceChildren();
 for(let i=0;i<prompts.length;i++){
  const [key,heading,hint]=prompts[i];
  taskList.append(questionRow(key,heading,hint,i));
 }
 evidence.replaceChildren();
 const block=[
  ['Research project',record.name],
  ['Reported country',record.country||'Not stated'],
  ['Reported equipment',record.reportedEquipment||'Not stated'],
  ['Source report label',record.reportDateLabel||'Not stated']
 ];
 for(const [label,value] of block){
  const field=element('div','mpr-evidence-item');
  field.append(element('small','',label),element('strong','',value));evidence.append(field);
 }
 const link=safeSource(record);
 if(link){sourceLink.href=link;sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';sourceLink.hidden=false;}
 else{sourceLink.hidden=true;}
 ready=true;root.dataset.mprLoaded='true';report();
}
function summaryText(){
 return 'MicroportMap · Private research follow-up\n'+record.name+'\n'+
  'Research passport: https://microportmap.com/projects/'+encodeURIComponent(id)+'/\n'+
  'These statuses were set manually by the visitor; not independent verification.\n\n'+
  prompts.map(([key,heading],i)=>(i+1)+'. '+heading+' — '+items[key].status+
    (items[key].note?'\n   '+items[key].note:'')).join('\n\n')+
  '\n\nPublic research reports do not establish site access, current operations or flight permission.';
}
function csv(){
 const safe=x=>{let s=String(x??'');if(/^[\s\uFEFF]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const lines=[['project_id','project_name','question_id','research_question','review_status','private_note']];
 for(const [key,name] of prompts)lines.push([id,record.name,key,name,items[key].status,items[key].note]);
 return '\uFEFF'+lines.map(row=>row.map(safe).join(',')).join('\r\n');
}
function download(format){
 if(!ready)return;
 clearPrepared();
 let a,url;
 try{
  const content=format==='csv'?csv():JSON.stringify({
   schema:'microportmap-manual-review-v1',projectId:id,projectName:record.name,
   note:'Visitor-set progress, not independent verification',questions:prompts.map(([key,title])=>({id:key,title,...items[key]}))
  },null,2);
  a=element('a');url=URL.createObjectURL(new Blob([content],{type:format==='csv'?'text/csv;charset=utf-8':'application/json;charset=utf-8'}));
  a.href=url;a.download='microportmap-'+id+'-review.'+format;document.body.append(a);a.click();
  notice.textContent='Download requested. Your browser controls file saving; no notes were sent.';
 }catch{notice.textContent='Download unavailable. Use Copy review summary instead.';}
 finally{a?.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),30000);}
}
async function copySummary(){
 if(!ready)return false;
 clearPrepared();const request=copyRequest;
 notice.textContent='Copying your review summary…';
 const content=summaryText();
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
  let timer;try{
   await Promise.race([navigator.clipboard.writeText(content),
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Clipboard timeout')),700);})]);
  }finally{if(timer)clearTimeout(timer);}
  if(request!==copyRequest)return false;
  notice.textContent='Review summary copied. Nothing was submitted.';
  return true;
 }catch{
  if(request!==copyRequest)return false;
  manual.hidden=false;copyInput.value=content;copyInput.focus({preventScroll:true});copyInput.select();
  notice.textContent='Automatic clipboard unavailable. Select and copy your review manually.';
  return false;
 }
}
function resetOne(){
 if(!ready)return;
 if(typeof window.confirm==='function'&&!window.confirm('Reset all ten review statuses and private notes for this project?'))return;
 items=fallback();persist();render();notice.textContent='This project’s local review was reset.';
}
function load(){
 if(loading)return;loading=true;retry.hidden=true;loadFailed=false;
 notice.textContent='Loading the original research record…';
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
 fetch('/data/projects.json',{signal:controller.signal}).then(r=>{
  if(!r.ok)throw Error('Research records unavailable');return r.json();
 }).then(data=>{
  const rows=data?.records;
  if(!Array.isArray(rows)||rows.length!==50||rows.some(r=>!r||typeof r.id!=='string'||!/^[a-z0-9-]+$/.test(r.id)||typeof r.name!=='string'||!r.name.trim())||
      new Set(rows.map(x=>x.id)).size!==50)throw Error('Invalid research catalog');
  record=rows.find(r=>r.id===id);if(!record)throw Error('Project unavailable');
  restore();render();notice.textContent='';
 }).catch(()=>{
  loadFailed=true;retry.hidden=false;
  notice.textContent='Could not load review questions. The original passport is still readable.';
 }).finally(()=>{loading=false;clearTimeout(timer);});
}
window.addEventListener('storage',event=>{
 if((event.key!==KEY&&event.key!==null)||!ready)return;
 if(event.storageArea&&event.storageArea!==localStorage)return;
 if(event.key===null||event.newValue===null){dirty.clear();items=fallback();}
 clearPrepared();restore();syncControls();report();notice.textContent='Review progress updated from another tab.';
});
window.MicroportReview=Object.freeze({
 getState:()=>({ready,projectId:id,total:10,reviewed:Object.values(items).filter(x=>x.status==='reviewed').length,
 followUp:Object.values(items).filter(x=>x.status==='follow-up').length}),
 getTasks:()=>prompts.map(([key,title])=>({id:key,title,status:items[key].status,note:items[key].note})),
 update:(key,status,note)=>{if(!ready||!prompts.some(x=>x[0]===key)||!allowed.has(status))return false;
   items[key]={status,note:String(note||'').slice(0,MAX_NOTES)};persist(key);render();return true;}
});
load();
})();