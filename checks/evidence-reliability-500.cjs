/* 50 original primary passports × ten field-specific comparison reliability workflows. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const catalog=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const fields=JSON.parse(fs.readFileSync('checks/project-evidence-500-ledger.json','utf8')).fields;
const source=fs.readFileSync('src/project-evidence-compare.js','utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.events={};this.hidden=false;this.disabled=false;this.value='';this.open=false;this._text='';this.focuses=0;}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 append(...nodes){for(const n of nodes){this.children.push(n);n.parentNode=this;}}
 replaceChildren(...nodes){this._text='';this.children=[];this.append(...nodes);}
 insertAdjacentElement(_,n){this.append(n);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,fn){this.events[k]=fn;}
 click(){if(!this.disabled)return this.events.click?.();}
 focus(){this.focuses++;this.doc.activeElement=this;}
 select(){}scrollIntoView(){}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);}
}
async function fixture(p,missing){
 const data=JSON.parse(JSON.stringify(catalog));
 if(missing)for(const r of data.records){if(missing==='sourceName')delete r.source.name;else delete r[missing];}
 const main=new El('main'),host=new El(),body=new El('body'),timers=new Map();let timerId=0,urlId=0;
 main.querySelector=s=>s==='.columns'?host:null;
 const document={body,activeElement:body,getElementById:()=>null,querySelector:s=>s==='main'?main:null,createElement:t=>{const n=new El(t);n.doc=document;return n;}};
 const f={data,write:async()=>{},fetch:async()=>({ok:true,json:async()=>data}),urls:new Map()};
 class U extends URL{}
 U.createObjectURL=blob=>{const url='blob:evidence-'+(++urlId);f.urls.set(url,blob);return url;};U.revokeObjectURL=url=>f.urls.delete(url);
 const context={document,URL:U,URLSearchParams,Blob,AbortController,navigator:{clipboard:{writeText:text=>f.write(text)}},
  location:{pathname:'/projects/'+p.id+'/',search:''},window:{},fetch:(...args)=>f.fetch(...args),
  setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(source,context);f.api=context.window.MicroportEvidenceCompare;
 f.settle=async()=>{for(let i=0;i<4;i++)await tick();};await f.settle();
 f.root=host.children.find(n=>n.id==='mpd-compare');
 const content=f.root.children[1];[f.lead,f.controls,f.status,f.head,f.grid,f.focus,f.references,f.actions,f.fallback,f.caveat,f.retry]=content.children;
 f.query=f.controls.children[0].children[0];f.select=f.controls.children[1].children[0];f.sort=f.controls.children[2].children[0];f.manual=f.fallback.children[1];
 f.document=document;f.timers=timers;
 f.inspect=key=>f.grid.children.find(n=>n.dataset.mpdField===key).children.find(n=>n.dataset.mpdAction===key);
 f.search=text=>{f.query.value=text;f.query.events.input();};
 f.expire=ms=>{for(const [id,t] of [...timers])if(t.ms===ms){timers.delete(id);t.fn();}};
 assert.equal(f.api.getState().ready,true);assert.equal(f.root.open,false);return f;
}
async function workflow(p,field){
 const key=field.id,f=await fixture(p),api=f.api;
 const alternate=api.getOtherOptions().find(id=>id!==api.getState().otherId);
 // Inspection retains keyboard focus on the newly rendered matching control.
 f.inspect(key).focus();f.inspect(key).click();assert.equal(api.getState().active,key);
 assert.equal(f.document.activeElement,f.inspect(key));assert.equal(f.inspect(key).attrs['aria-pressed'],'true');
 f.inspect(key).click();assert.equal(api.getState().active,'');assert.equal(f.document.activeElement,f.inspect(key));assert.equal(f.inspect(key).attrs['aria-pressed'],'false');
 // Selecting an explicit project outside the current filter must select exactly that project.
 f.search('no-project-can-match-this-query');assert.equal(api.getState().otherId,null);assert.equal(f.grid.children.length,0);assert.equal(f.references.children.length,0);assert.ok(f.actions.children.every(n=>n.disabled));
 assert.equal(api.choose(alternate),true);assert.equal(api.getState().otherId,alternate);assert.equal(f.query.value,'');assert.equal(f.select.disabled,false);
 assert.equal(api.choose(p.id),false);assert.equal(api.choose('unknown'),false);assert.equal(api.getState().otherId,alternate);
 // Late clipboard feedback from the old pair must never replace the new pair's UI.
 let finish;f.write=()=>new Promise(resolve=>{finish=resolve;});const old=f.actions.children[0].click();
 const next=api.getOtherOptions().find(id=>id!==alternate);api.choose(next);const changedStatus=f.status.textContent;
 finish();assert.equal(await old,false);assert.equal(f.status.textContent,changedStatus);assert.equal(f.fallback.hidden,true);
 // Clearing all options also invalidates late failures and removes previous manual text.
 let reject;f.write=()=>new Promise((_,fail)=>{reject=fail;});const pending=f.actions.children[0].click();
 f.search('no-project-can-match-this-query');const emptyStatus=f.status.textContent;reject(Error('Late denial'));assert.equal(await pending,false);
 assert.equal(f.status.textContent,emptyStatus);assert.equal(f.fallback.hidden,true);assert.equal(f.manual.value,'');assert.equal(f.focus.children.length,0);
 f.search('');f.write=async()=>{throw Error('Denied');};assert.equal(await f.actions.children[0].click(),false);assert.equal(f.fallback.hidden,false);
 assert.ok(f.manual.value.includes(p.name));assert.ok(f.manual.value.includes('not independently'));api.choose(alternate);assert.equal(f.fallback.hidden,true);assert.equal(f.manual.value,'');
 // Exports remain exact and carry the currently selected pair after field inspection.
 api.focus(key);f.actions.children[1].click();let blob=[...f.urls.values()].at(-1);const exported=JSON.parse(await blob.text());
 assert.equal(exported.primaryId,p.id);assert.equal(exported.comparisonId,alternate);assert.equal(exported.fields.length,10);assert.ok(exported.fields.some(r=>r.id===key));f.expire(30000);
 f.actions.children[2].click();blob=[...f.urls.values()].at(-1);assert.ok((await blob.text()).includes('field_id'));f.expire(30000);assert.equal(f.urls.size,0);
 // Failed reloads remove stale choices, field data, sources and export actions.
 f.fetch=async()=>({ok:false});f.retry.click();assert.equal(api.getState().ready,false);assert.equal(api.choose(alternate),false);assert.equal(api.focus(key),false);
 await f.settle();assert.equal(api.getOtherOptions().length,0);assert.equal(api.getFields().length,0);assert.equal(f.grid.children.length,0);assert.ok(f.actions.children.every(n=>n.disabled));assert.equal(f.query.disabled,true);assert.equal(f.retry.hidden,false);
 f.fetch=async()=>({ok:true,json:async()=>f.data});f.retry.click();await f.settle();assert.equal(api.getState().ready,true);assert.equal(api.getFields().length,10);assert.equal(f.query.disabled,false);assert.equal(f.root.attrs['aria-busy'],'false');assert.equal(f.timers.size,0);
 // Two absent fields are omissions, never corroborating or matching reported wording.
 const missing=await fixture(p,key),row=missing.api.getFields().find(r=>r.id===key);
 assert.equal(row.primary,'Not recorded in catalogue');assert.equal(row.comparison,'Not recorded in catalogue');assert.match(row.observation,/omits/);assert.ok(!row.observation.includes('Same'));
 missing.sort.value='country';missing.sort.events.change();assert.equal(missing.api.getFields().length,10);
}
(async()=>{
 assert.equal(catalog.records.length,50);assert.equal(fields.length,10);const cases=[];
 for(const p of catalog.records)for(const field of fields){await workflow(p,field);cases.push({taskId:'ER'+String(cases.length+1).padStart(3,'0'),projectId:p.id,field:field.id,route:'/projects/'+p.id+'/',passed:true});}
 assert.equal(cases.length,500);
 fs.writeFileSync('checks/evidence-reliability-500-results.json',JSON.stringify({total:500,passed:500,failed:0,scope:'Controlled DOM/VM field comparison workflows; real-browser checks run separately. Wording comparisons are not independent research verification.',coverage:['keyboard focus retention','explicit selection outside filter','empty search recovery','stale clipboard outcomes','manual fallback invalidation','exact current-pair exports','failed reload recovery','two missing values are omissions','missing-country sort'],cases},null,2)+'\n');
 console.log('PASS: 500 field comparison semantics, selection, focus and recovery workflows');
})().catch(e=>{console.error(e);process.exitCode=1;});
