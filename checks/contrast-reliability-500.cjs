/* 50 passports × ten recovery, metadata-boundary and accessible-link scenarios. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const catalog=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const source=fs.readFileSync('src/contrasting-research-paths.js','utf8');
const clone=()=>JSON.parse(JSON.stringify(catalog));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.events={};this.hidden=false;this.disabled=false;this.open=false;this._text='';}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this._text='';this.children=[...nodes];}
 insertAdjacentElement(_,n){this.append(n);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,f){this.events[k]=f;}
 click(){if(!this.disabled)return this.events.click?.();}
}
const response=data=>({ok:true,json:async()=>data});
async function fixture(p,handler=()=>response(catalog)){
 const main=new El('main'),host=new El(),timers=new Map();
 main.querySelector=s=>s==='.columns'?host:null;
 const document={getElementById:()=>null,querySelector:s=>s==='main'?main:null,createElement:t=>new El(t)};
 const f={handler,calls:0,signals:[]};let timerId=0;
 const context={document,location:{pathname:'/projects/'+p.id+'/'},URL,URLSearchParams,AbortController,window:{},
  setTimeout:(fn,ms)=>{assert.equal(ms,12000);timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),
  fetch:async(url,options)=>{assert.equal(url,'/data/projects.json');f.calls++;f.signals.push(options.signal);return f.handler();}};
 vm.runInNewContext(source,context);
 f.api=context.window.MicroportContrast;f.root=host.children.find(n=>n.id==='mpcr-contrast');
 const panel=f.root.children[1];[f.intro,f.metrics,f.grid,f.status,f.caveat,f.retry]=panel.children;
 f.settle=async()=>{for(let i=0;i<4;i++)await tick();};
 f.expire=()=>{for(const fn of [...timers.values()])fn();};
 f.timers=timers;
 await f.settle();
 assert.equal(f.api.getState().projectId,p.id);
 assert.equal(f.root.open,false,'panel must not be opened automatically');
 return f;
}
function failed(f){
 assert.equal(f.api.getState().ready,false);assert.equal(f.api.getState().loading,false);
 assert.equal(f.api.getState().paths,0);assert.equal(f.api.getPaths().length,0);
 assert.equal(f.api.getComparisonURL(catalog.records[0].id),'');
 assert.equal(f.grid.children.length,0);assert.equal(f.metrics.children.length,0);
 assert.equal(f.retry.hidden,false);assert.equal(f.retry.disabled,false);
 assert.equal(f.root.attrs['aria-busy'],'false');assert.match(f.status.textContent,/unavailable/);
 assert.equal(f.timers.size,0);
}
function loaded(f){
 assert.equal(f.api.getState().ready,true);assert.equal(f.api.getState().loading,false);
 assert.equal(f.api.getState().paths,10);assert.equal(f.grid.children.length,10);
 assert.equal(f.retry.hidden,true);assert.equal(f.root.attrs['aria-busy'],'false');assert.equal(f.timers.size,0);
}
async function recover(f){f.handler=()=>response(catalog);f.retry.click();assert.equal(f.root.attrs['aria-busy'],'true');assert.equal(f.retry.disabled,true);await f.settle();loaded(f);}
async function rejectsThenRecovers(p,handler){const f=await fixture(p,handler);failed(f);await recover(f);}
const scenarios={
 'http-error-recovery':p=>rejectsThenRecovers(p,()=>({ok:false})),
 'invalid-json-recovery':p=>rejectsThenRecovers(p,()=>({ok:true,json:async()=>{throw SyntaxError('Invalid JSON');}})),
 'duplicate-identities-recovery':p=>{const d=clone();d.records[1].id=d.records[0].id;return rejectsThenRecovers(p,()=>response(d));},
 'missing-passport-recovery':p=>{const d=clone();d.records.find(r=>r.id===p.id).id='missing-passport-reference';return rejectsThenRecovers(p,()=>response(d));},
 'comparison-metadata-types':async p=>{for(const [key,value] of [['country',{}],['region',null],['infrastructureType',[]],['country','  ']]){const d=clone();d.records[0][key]=value;await rejectsThenRecovers(p,()=>response(d));}},
 'malformed-source-attribution':p=>{const d=clone();d.records[0].source.name={publisher:'Not a text attribution'};return rejectsThenRecovers(p,()=>response(d));},
 'unsafe-external-source-suppression':async p=>{for(const url of ['javascript:alert(1)','http://example.com/','https://user:secret@example.com/','data:text/html,test','//example.com/']){
  const d=clone();d.records.forEach(r=>{r.source.url=url;});const f=await fixture(p,()=>response(d));loaded(f);
  for(const row of f.grid.children){const actions=row.children.find(n=>n.className==='mpcr-actions');assert.equal(actions.children.length,2);assert.ok(actions.children.every(n=>!n.target));}
 }},
 'deadline-and-late-response-isolation':async p=>{
  let finish;const f=await fixture(p,()=>new Promise(resolve=>{finish=resolve;}));
  assert.equal(f.api.getState().loading,true);assert.equal(f.root.attrs['aria-busy'],'true');f.expire();await f.settle();failed(f);assert.equal(f.signals[0].aborted,true);
  await recover(f);const paths=JSON.stringify(f.api.getPaths());finish(response({records:[]}));await f.settle();loaded(f);assert.equal(JSON.stringify(f.api.getPaths()),paths);
 },
 'duplicate-retry-request-lock':async p=>{
  const f=await fixture(p,()=>{throw Error('Network offline');});failed(f);
  let finish;f.handler=()=>new Promise(resolve=>{finish=resolve;});f.retry.click();f.retry.events.click();f.retry.events.click();await f.settle();
  assert.equal(f.calls,2);assert.equal(f.api.getState().loading,true);assert.equal(f.retry.disabled,true);
  finish(response(catalog));await f.settle();loaded(f);
 },
 'contextual-link-names-and-literal-text':async p=>{
  const d=clone();d.records.forEach(r=>{r.name+='<img src=x onerror=alert(1)>';r.source.name='<svg onload=alert(1)>source';});
  const f=await fixture(p,()=>response(d));loaded(f);const primary=d.records.find(r=>r.id===p.id);
  for(const row of f.grid.children){const dest=d.records.find(r=>r.id===row.dataset.mpcrPath),actions=row.children.find(n=>n.className==='mpcr-actions');
   assert.equal(actions.children[0].attrs['aria-label'],'Read research passport: '+dest.name);
   assert.equal(actions.children[1].attrs['aria-label'],'Compare '+primary.name+' with '+dest.name);
   assert.equal(actions.children[2].attrs['aria-label'],'Original source for '+dest.name+' (opens in a new tab)');
   assert.equal(row.children.find(n=>n.tagName==='H3').textContent,dest.name);
   assert.ok(row.children.find(n=>n.className==='mpcr-source').textContent.includes('<svg'));
   const visit=n=>{assert.ok(!['IMG','SVG','SCRIPT'].includes(n.tagName));n.children.forEach(visit);};visit(row);
  }
 }
};
(async()=>{
 assert.equal(catalog.records.length,50);const cases=[];
 for(const p of catalog.records)for(const [scenario,run] of Object.entries(scenarios)){
  await run(p);cases.push({taskId:'CR'+String(cases.length+1).padStart(3,'0'),projectId:p.id,route:'/projects/'+p.id+'/',scenario,passed:true});
 }
 assert.equal(cases.length,500);
 fs.writeFileSync('checks/contrast-reliability-500-results.json',JSON.stringify({total:500,passed:500,failed:0,scope:'Controlled DOM/VM fault and accessibility checks; real-browser checks run separately',cases},null,2)+'\n');
 console.log('PASS: 500 contrast recovery, metadata-boundary and accessible-link scenarios');
})().catch(e=>{console.error(e);process.exitCode=1;});
