/* 50 projects × 10 fields: request and response-body timeout recovery. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const catalog=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const definitions=JSON.parse(fs.readFileSync('checks/field-inspector-500-ledger.json','utf8')).fieldDefinitions;
const source=fs.readFileSync('src/passport-field-inspector.js','utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.events={};this.hidden=false;this.disabled=false;this.value='';this.open=false;this.focuses=0;this.selections=0;this._text='';}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this._text='';this.children=[...nodes];}
 insertAdjacentElement(_,node){this.append(node);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,fn){this.events[k]=fn;}
 click(){if(!this.disabled)return this.events.click?.();}
 focus(){this.focuses++;}select(){this.selections++;}
}
async function fixture(p){
 const main=new El('main'),host=new El(),timers=new Map();let sequence=0;
 main.querySelector=s=>s==='.columns'?host:null;
 const document={getElementById:()=>null,querySelector:s=>s==='main'?main:null,createElement:t=>new El(t)};
 const f={write:async()=>{},fetch:async()=>({ok:true,json:async()=>catalog})};
 f.clipboard={writeText:value=>f.write(value)};f.navigator={clipboard:f.clipboard};
 const context={document,location:{pathname:'/projects/'+p.id+'/'},navigator:f.navigator,URL,AbortController,window:{},
  setTimeout:(fn,ms)=>{timers.set(++sequence,{fn,ms});return sequence;},clearTimeout:id=>timers.delete(id),fetch:(...args)=>f.fetch(...args)};
 vm.runInNewContext(source,context);f.api=context.window.MicroportFields;
 f.settle=async()=>{for(let n=0;n<4;n++)await tick();};await f.settle();
 f.root=host.children.find(n=>n.id==='mpf-inspector');
 [f.intro,f.grid,f.status,f.fallback,f.disclosure,f.retry]=f.root.children[1].children;
 f.manual=f.fallback.children[1];f.timers=timers;
 f.expireLookup=()=>{for(const [id,timer] of [...timers])if(timer.ms===12000){timers.delete(id);timer.fn();}};
 f.expireCopy=()=>{for(const timer of [...timers.values()])if(timer.ms===800)timer.fn();};
 assert.equal(f.api.getState().ready,true);assert.equal(f.api.getState().projectId,p.id);assert.equal(f.root.open,false);
 return f;
}
async function workflow(p,def){
 const f=await fixture(p),api=f.api,expected=api.getFieldText(def.key);
 for(const stage of ['request','body']){
  let resolveLate,rejectLate;
  const pending=new Promise((resolve,reject)=>{resolveLate=resolve;rejectLate=reject;});
  f.fetch=stage==='request'?()=>pending:async()=>({ok:true,json:()=>pending});
  f.retry.click();await f.settle();assert.equal(api.getState().loading,true);assert.equal(api.getState().ready,false);
  assert.equal(api.getFieldText(def.key),'');f.expireLookup();await f.settle();
  assert.equal(api.getState().loading,false);assert.equal(api.getState().ready,false);assert.equal(f.retry.hidden,false);assert.equal(f.retry.disabled,false);assert.equal(f.root.attrs['aria-busy'],'false');assert.equal(f.grid.children.length,0);
  f.fetch=async()=>({ok:true,json:async()=>catalog});f.retry.click();await f.settle();
  assert.equal(api.getState().ready,true);assert.equal(f.grid.children.length,10);assert.equal(api.getFieldText(def.key),expected);
  const status=f.status.textContent;
  if(stage==='request')resolveLate({ok:true,json:async()=>({records:[]})});else rejectLate(Error('Late body failure'));
  await f.settle();assert.equal(api.getState().ready,true);assert.equal(api.getFieldText(def.key),expected);assert.equal(f.status.textContent,status);assert.equal(f.timers.size,0);
 }
}
(async()=>{let cases=0;for(const p of catalog.records)for(const def of definitions){await workflow(p,def);cases++;}assert.equal(cases,500);console.log('PASS: 500 project-field lookup deadline and retry scenarios');})().catch(e=>{console.error(e);process.exitCode=1;});
