/* 50 passports × ten toolkit metadata, format and recovery scenarios. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const catalog=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const source=fs.readFileSync('src/passport-research-toolkit.js','utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.events={};this.hidden=false;this.disabled=false;this.value='';this._text='';this.focuses=0;this.selections=0;}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 append(...nodes){for(const n of nodes){this.children.push(n);n.parentNode=this;}}
 replaceChildren(...nodes){this._text='';this.children=[];this.append(...nodes);}
 insertAdjacentElement(_,n){this.append(n);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
 click(event={preventDefault:()=>{}}){if(this.disabled)return false;let result;for(const fn of this.events.click||[])result=fn(event);return result;}
 focus(){this.focuses++;}select(){this.selections++;}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);}
 querySelectorAll(selector){const out=[];for(const c of this.children){if(selector==='[data-mpp-action]'&&c.dataset.mppAction)out.push(c);out.push(...c.querySelectorAll(selector));}return out;}
}
async function fixture(p,change,initial){
 const data=JSON.parse(JSON.stringify(catalog));if(change)change(data.records.find(r=>r.id===p.id));
 const main=new El('main'),host=new El(),body=new El('body'),timers=new Map();let timerId=0,urlId=0;
 const f={data,write:async value=>{f.copied=value;},fetch:initial||(async()=>({ok:true,json:async()=>data})),urls:new Map(),failBlob:false,failAnchor:false};
 main.querySelector=s=>s==='.columns'?host:null;
 const document={body,getElementById:()=>null,querySelector:s=>s==='main'?main:null,createElement:t=>{const n=new El(t);if(t==='a'){const click=n.click.bind(n);n.click=(...args)=>{if(n.download&&f.failAnchor)throw Error('Anchor blocked');return click(...args);};}return n;}};
 class U extends URL{}
 U.createObjectURL=blob=>{if(f.failBlob)throw Error('Blob blocked');const url='blob:toolkit-'+(++urlId);f.urls.set(url,blob);return url;};U.revokeObjectURL=url=>f.urls.delete(url);
 const context={document,location:{pathname:'/projects/'+p.id+'/'},URL:U,URLSearchParams,Blob,AbortController,navigator:{clipboard:{writeText:value=>f.write(value)}},window:{},fetch:(...args)=>f.fetch(...args),
  setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(source,context);f.api=context.window.MicroportPassportToolkit;
 f.settle=async()=>{for(let n=0;n<4;n++)await tick();};await f.settle();
 f.root=host.children.find(n=>n.id==='mpp-toolkit');[f.heading,f.info,f.toolbar,f.status,f.fallback,f.checks,f.caveat,f.retry]=f.root.children;
 f.text=f.fallback.children[0].children[0];f.body=body;f.timers=timers;
 f.action=key=>f.toolbar.children.find(n=>n.dataset.mppAction===key);
 f.expire=ms=>{for(const [id,t] of [...timers])if(t.ms===ms){timers.delete(id);t.fn();}};
 return f;
}
const scenarios=['fetch-timeout-late-success','fetch-timeout-late-error','body-timeout-late-success','body-timeout-late-error','http-error','malformed-catalogue','missing-project','duplicate-project','fetch-rejection','invalid-record'];
async function run(p,scenario){
 const f=await fixture(p);let resolveLate,rejectLate;
 const delayed=new Promise((resolve,reject)=>{resolveLate=resolve;rejectLate=reject;});
 if(scenario.startsWith('fetch-timeout'))f.fetch=()=>delayed;
 else if(scenario.startsWith('body-timeout'))f.fetch=async()=>({ok:true,json:()=>delayed});
 else if(scenario==='http-error')f.fetch=async()=>({ok:false});
 else if(scenario==='fetch-rejection')f.fetch=async()=>{throw Error('offline');};
 else {const bad=JSON.parse(JSON.stringify(f.data));
  if(scenario==='malformed-catalogue')bad.records=null;
  if(scenario==='missing-project')bad.records=bad.records.filter(r=>r.id!==p.id);
  if(scenario==='duplicate-project')bad.records[0]=bad.records[1];
  if(scenario==='invalid-record')bad.records[0].name='';
  f.fetch=async()=>({ok:true,json:async()=>bad});
 }
 f.retry.click();assert.equal(f.api.getState().loading,true);assert.equal(f.api.getState().loaded,false);
 if(scenario.includes('timeout')){await f.settle();f.expire(15000);}
 await f.settle();assert.equal(f.api.getState().loading,false);assert.equal(f.api.getState().loaded,false);
 assert.equal(f.retry.hidden,false);assert.equal(f.retry.disabled,false);assert.equal(f.root.attrs['aria-busy'],'false');assert.equal(f.toolbar.children.length,0);
 f.fetch=async()=>({ok:true,json:async()=>f.data});f.retry.click();await f.settle();
 assert.equal(f.api.getState().loaded,true);assert.equal(f.api.getState().actions,10);const state=f.status.textContent;
 if(scenario.endsWith('late-success'))resolveLate(scenario.startsWith('fetch')?{ok:true,json:async()=>({records:[]})}:{records:[]});
 if(scenario.endsWith('late-error'))rejectLate(Error('late failure'));
 await f.settle();assert.equal(f.api.getState().loaded,true);assert.equal(f.status.textContent,state);assert.equal(f.timers.size,0);
}
(async()=>{let count=0;for(const p of catalog.records)for(const scenario of scenarios){await run(p,scenario);count++;}assert.equal(count,500);console.log('PASS: 500 passport-toolkit timeout and recovery scenarios');})().catch(e=>{console.error(e);process.exitCode=1;});
