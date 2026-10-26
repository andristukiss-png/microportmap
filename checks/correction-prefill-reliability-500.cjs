/* 50 original correction references × ten asynchronous prefill/recovery scenarios. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const catalog=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const source=fs.readFileSync('src/correction-prefill.js','utf8'),tick=()=>new Promise(resolve=>setImmediate(resolve));
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.events={};this.value='';this.disabled=false;this.maxLength=500;this._text='';}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 get options(){return this.children.filter(n=>n.tagName==='OPTION');}
 appendChild(n){if(n.parentNode)n.remove();this.children.push(n);n.parentNode=this;return n;}
 insertBefore(n,ref){if(n.parentNode)n.remove();const at=this.children.indexOf(ref);this.children.splice(at<0?this.children.length:at,0,n);n.parentNode=this;}
 insertAdjacentElement(_,n){if(this.parentNode){if(n.parentNode)n.remove();const at=this.parentNode.children.indexOf(this);this.parentNode.children.splice(at+1,0,n);n.parentNode=this.parentNode;}}
 get firstChild(){return this.children[0]||null;}
 setAttribute(k,v){this.attrs[k]=String(v);}
 getAttribute(k){return this.attrs[k]??null;}
 removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
 dispatchEvent(e){for(const fn of this.events[e.type]||[])fn(e);}
 click(){if(this.disabled)return false;return this.events.click?.[0]?.();}
 querySelector(s){return s==='button[type=submit]'?this.children.find(n=>n.type==='submit'):null;}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);this.parentNode=null;}
}
async function fixture(p,{change,handler,disabled=false}={}){
 const data=JSON.parse(JSON.stringify(catalog));if(change)change(data.records.find(r=>r.id===p.id));
 const root=new El('body'),form=new El('form'),fields={proposal:form};form.id='proposal';root.appendChild(form);
 for(const key of ['name','city','country','operator','type','source']){const n=new El(key==='type'?'select':'input');n.id=key;form.appendChild(n);fields[key]=n;}
 for(const value of ['','Other documented infrastructure']){const n=new El('option');n.value=value;fields.type.appendChild(n);}
 const submit=new El('button');submit.type='submit';submit.disabled=disabled;form.appendChild(submit);
 const heading=new El('h1'),label=new El('label');root.appendChild(heading);root.appendChild(label);
 const created=[],timers=new Map();let timerId=0;
 const find=(n,id)=>n.id===id?n:n.children.map(c=>find(c,id)).find(Boolean);
 const document={getElementById:id=>find(root,id),querySelector:s=>s==='.intro h1'?heading:s==='label[for="desc"]'?label:null,createElement:t=>{const n=new El(t);created.push(n);return n;},createTextNode:t=>{const n=new El('text');n.textContent=t;return n;}};
 const f={data,fields,form,submit,root,signals:[],calls:0,handler:handler||(()=>Promise.resolve({ok:true,json:async()=>data}))};
 const context={document,location:{search:'?'+new URLSearchParams({project:p.id})},URL,URLSearchParams,AbortController,CustomEvent:class{constructor(type){this.type=type;}},
  setTimeout:(fn,ms)=>{assert.equal(ms,15000);timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),fetch:(path,options)=>{assert.equal(path,'/data/projects.json');f.calls++;f.signals.push(options.signal);return f.handler();}};
 vm.runInNewContext(source,context);f.retry=created.find(n=>n.id==='correction-retry');
 f.settle=async()=>{for(let n=0;n<5;n++)await tick();};await f.settle();f.timers=timers;
 f.expire=()=>{for(const [id,fn] of [...timers]){timers.delete(id);fn();}};
 f.edit=(key,value,event='input')=>{fields[key].value=value;fields[key].dispatchEvent({type:event});};
 f.all=id=>{const rows=[];const walk=n=>{if(n.id===id)rows.push(n);n.children.forEach(walk);};walk(root);return rows;};
 assert.equal(form.dataset.requestedProjectId,p.id);return f;
}
const response=data=>({ok:true,json:async()=>data});
const scenarios={
 'typed-then-cleared-fields-remain-empty':async p=>{
  let finish;const f=await fixture(p,{handler:()=>new Promise(resolve=>{finish=resolve;})});assert.equal(f.form.dataset.contextResolution,'loading');
  for(const key of ['name','city','country','operator','type']){f.edit(key,'User edit',key==='type'?'change':'input');f.edit(key,'',key==='type'?'change':'input');}
  finish(response(f.data));await f.settle();assert.equal(f.form.dataset.contextResolution,'resolved');for(const key of ['name','city','country','operator','type'])assert.equal(f.fields[key].value,'',key);
 },
 'untouched-prefill-retains-original-context':async p=>{
  const f=await fixture(p);assert.equal(f.fields.name.value,p.name);assert.equal(f.fields.country.value,p.country);assert.equal(f.fields.operator.value,p.reportedOperator);assert.equal(f.fields.type.value,p.infrastructureType);assert.equal(f.fields.source.value,'');assert.equal(f.form.dataset.originalLocation,p.where);assert.equal(f.form.dataset.projectId,p.id);assert.equal(f.submit.disabled,false);assert.equal(f.timers.size,0);
 },
 'non-text-optional-metadata-not-coerced':async p=>{
  const f=await fixture(p,{change:r=>{r.where={};r.country=[];r.reportedOperator=42;r.infrastructureType={};r.verificationStatus=false;r.source.url={};}});
  assert.equal(f.form.dataset.contextResolution,'resolved');for(const key of ['city','country','operator','type'])assert.equal(f.fields[key].value,'');for(const key of ['originalLocation','originalOperator','originalInfrastructureType','originalEvidenceStatus'])assert.equal(f.form.dataset[key],'');assert.equal(f.all('correction-original-source').length,0);
 },
 'fetch-deadline-ignores-late-response':async p=>{
  let finish;const f=await fixture(p,{handler:()=>new Promise(resolve=>{finish=resolve;})});f.expire();await f.settle();assert.equal(f.form.dataset.contextResolution,'unavailable');assert.equal(f.submit.disabled,false);assert.equal(f.signals[0].aborted,true);
  f.edit('name','Manual correction');f.handler=()=>Promise.resolve(response(f.data));await f.retry.click();assert.equal(f.form.dataset.contextResolution,'resolved');finish(response({records:[]}));await f.settle();assert.equal(f.form.dataset.contextResolution,'resolved');assert.equal(f.fields.name.value,'Manual correction');
 },
 'json-deadline-ignores-late-body':async p=>{
  let finish;const f=await fixture(p,{handler:()=>Promise.resolve({ok:true,json:()=>new Promise(resolve=>{finish=resolve;})})});f.expire();await f.settle();assert.equal(f.form.dataset.contextResolution,'unavailable');assert.ok(!f.form.dataset.projectId);
  f.handler=()=>Promise.resolve(response(f.data));await f.retry.click();finish({records:[]});await f.settle();assert.equal(f.form.dataset.contextResolution,'resolved');assert.equal(f.form.dataset.projectId,p.id);assert.equal(f.timers.size,0);
 },
 'failed-retry-clears-resolved-metadata':async p=>{
  const f=await fixture(p);assert.equal(f.form.dataset.projectId,p.id);f.handler=()=>Promise.resolve(response({records:[]}));await f.retry.click();assert.equal(f.form.dataset.contextResolution,'not-found');assert.ok(!f.form.dataset.projectId);assert.ok(!f.form.dataset.originalOperator);assert.equal(f.all('correction-original-source').length,0);
  f.handler=()=>Promise.resolve(response({records:[p,p]}));await f.retry.click();assert.equal(f.form.dataset.contextResolution,'unavailable');assert.ok(!f.form.dataset.projectId);assert.equal(f.form.dataset.requestedProjectId,p.id);
 },
 'retry-preserves-cleared-and-written-values':async p=>{
  const f=await fixture(p,{handler:()=>Promise.reject(Error('Offline'))});f.edit('name','Typed correction');f.edit('city','Typed city');f.edit('country','Temporary');f.edit('country','');f.edit('operator','');f.edit('type','', 'change');
  f.handler=()=>Promise.resolve(response(f.data));await f.retry.click();assert.equal(f.fields.name.value,'Typed correction');assert.equal(f.fields.city.value,'Typed city');for(const key of ['country','operator','type'])assert.equal(f.fields[key].value,'');assert.equal(f.form.dataset.originalOperator,p.reportedOperator);
 },
 'repeated-lookup-does-not-duplicate-context':async p=>{
  const f=await fixture(p);await f.retry.click();await f.retry.click();assert.equal(f.all('recorded-type-help').length,1);assert.equal(f.all('correction-original-source').length,1);assert.equal(f.fields.type.options.filter(o=>o.value===p.infrastructureType).length,1);assert.equal(f.fields.type.attrs['aria-describedby'].split(/\s+/).filter(id=>id==='recorded-type-help').length,1);
 },
 'submit-lock-and-retry-request-guard':async p=>{
  const f=await fixture(p,{disabled:true});assert.equal(f.submit.disabled,true);let finish;f.handler=()=>new Promise(resolve=>{finish=resolve;});const before=f.calls,pending=f.retry.click();for(const fn of f.retry.events.click)fn();assert.equal(f.calls,before+1);assert.equal(f.retry.disabled,true);finish(response(f.data));await pending;assert.equal(f.submit.disabled,true);assert.equal(f.retry.disabled,false);assert.ok(!f.form.attrs['aria-busy']);
 },
 'source-links-format-only-and-evidence-untouched':async p=>{
  for(const url of ['javascript:alert(1)','http://example.com/','https://user:secret@example.com/',p.source.url]){
   const f=await fixture(p,{change:r=>{r.source.url=url;}});assert.equal(f.fields.source.value,'');const ref=f.all('correction-original-source')[0];const links=ref.children.filter(n=>n.tagName==='A');
   if(url===p.source.url){assert.equal(links.length,1);assert.equal(links[0].href,url);assert.equal(links[0].rel,'noopener noreferrer');assert.equal(links[0].target,'_blank');}else assert.equal(links.length,0);
  }
 }
};
(async()=>{
 assert.equal(catalog.records.length,50);const cases=[];
 for(const p of catalog.records)for(const [scenario,run] of Object.entries(scenarios)){await run(p);cases.push({taskId:'CP'+String(cases.length+1).padStart(3,'0'),projectId:p.id,route:'/submit/?project='+p.id,scenario,passed:true});}
 assert.equal(cases.length,500);
 fs.writeFileSync('checks/correction-prefill-reliability-500-results.json',JSON.stringify({total:500,passed:500,failed:0,scope:'Controlled DOM/VM asynchronous correction lookup checks; real-browser checks run separately. Reports remain local, no messages or submissions are sent, and source links are not independently verified.',cases},null,2)+'\n');
 console.log('PASS: 500 correction-prefill edit, identity, deadline and retry workflows');
})().catch(e=>{console.error(e);process.exitCode=1;});
