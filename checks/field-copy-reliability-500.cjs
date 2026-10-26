/* 50 original projects × 10 fields: full clipboard/fallback/race/reload workflows. */
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
 f.expireCopy=()=>{for(const timer of [...timers.values()])if(timer.ms===800)timer.fn();};
 assert.equal(f.api.getState().ready,true);assert.equal(f.api.getState().projectId,p.id);assert.equal(f.root.open,false);
 return f;
}
async function workflow(p,def,index){
 const f=await fixture(p),api=f.api,key=def.key,next=definitions[(index+1)%definitions.length];
 const expected=api.getFieldText(key),other=api.getFieldText(next.key);
 for(const text of [expected,other]){
  assert.ok(text.includes('Research project: '+p.name));assert.ok(text.includes('Original source: '+p.source.url));
  assert.ok(text.includes('Research passport: https://microportmap.com/projects/'+p.id+'/'));assert.ok(text.includes('Limitations:'));
 }
 assert.ok(expected.includes('Field: '+def.label));
 let copied;f.write=async value=>{copied=value;};
 const button=f.grid.children[index].children[1];assert.equal(button.dataset.mpfField,key);
 assert.equal(await button.click(),true);assert.equal(copied,expected);assert.equal(f.fallback.hidden,true);assert.equal(f.timers.size,0);
 // Clipboard denial, unsupported API and synchronous exceptions all expose exact, selectable text.
 for(const failure of ['denied','unsupported','throw']){
  f.navigator.clipboard=failure==='unsupported'?undefined:f.clipboard;
  f.write=failure==='throw'?()=>{throw Error('Blocked');}:async()=>{throw Error('Denied');};
  const focuses=f.manual.focuses;
  assert.equal(await api.copyField(key),false);assert.equal(f.manual.value,expected);assert.equal(f.fallback.hidden,false);
  assert.equal(f.manual.focuses,focuses+1);assert.ok(f.manual.selections>0);assert.ok(f.status.textContent.includes(def.label));assert.equal(f.timers.size,0);
 }
 f.navigator.clipboard=f.clipboard;
 // A stalled clipboard is bounded; its fallback remains source-qualified.
 f.write=()=>new Promise(()=>{});const timed=api.copyField(key);assert.equal(f.manual.value,'');assert.equal(f.fallback.hidden,true);
 f.expireCopy();assert.equal(await timed,false);assert.equal(f.manual.value,expected);assert.equal(f.timers.size,0);
 // Older success must not overwrite a newer manual fallback or move focus again.
 let finish;f.write=()=>new Promise(resolve=>{finish=resolve;});const oldSuccess=api.copyField(key);
 f.write=async()=>{throw Error('Denied latest');};assert.equal(await api.copyField(next.key),false);
 const latestStatus=f.status.textContent,latestFocus=f.manual.focuses;
 assert.equal(f.manual.value,other);finish();assert.equal(await oldSuccess,false);
 assert.equal(f.status.textContent,latestStatus);assert.equal(f.manual.value,other);assert.equal(f.manual.focuses,latestFocus);
 // Older denial must not expose its field after a newer successful copy.
 let rejectOld;f.write=()=>new Promise((_,reject)=>{rejectOld=reject;});const oldFailure=api.copyField(key);
 f.write=async()=>{};assert.equal(await api.copyField(next.key),true);const successStatus=f.status.textContent,successFocus=f.manual.focuses;
 rejectOld(Error('Late denial'));assert.equal(await oldFailure,false);assert.equal(f.status.textContent,successStatus);
 assert.equal(f.fallback.hidden,true);assert.equal(f.manual.value,'');assert.equal(f.manual.focuses,successFocus);
 // Invalid field keys must leave the current result intact.
 assert.equal(api.copyField('unknown'),false);assert.equal(api.getFieldText('unknown'),'');assert.equal(f.status.textContent,successStatus);
 // Reload invalidates pending copy callbacks, stale rows and old button references.
 let finishReloadCopy;f.write=()=>new Promise(resolve=>{finishReloadCopy=resolve;});const pending=api.copyField(key);
 f.fetch=async()=>({ok:false});f.retry.click();assert.equal(api.getState().ready,false);assert.equal(api.getState().loading,true);
 assert.equal(api.copyField(key),false);assert.equal(api.getFieldText(key),'');assert.equal(await button.click(),false);
 await f.settle();assert.equal(f.grid.children.length,0);assert.equal(f.retry.hidden,false);assert.equal(f.root.attrs['aria-busy'],'false');
 const failureStatus=f.status.textContent;finishReloadCopy();assert.equal(await pending,false);assert.equal(f.status.textContent,failureStatus);assert.equal(f.fallback.hidden,true);
 f.fetch=async()=>({ok:true,json:async()=>catalog});f.retry.click();await f.settle();assert.equal(api.getState().ready,true);assert.equal(f.grid.children.length,10);
 f.write=async value=>{copied=value;};assert.equal(await api.copyField(key),true);assert.equal(copied,expected);assert.equal(f.timers.size,0);
}
(async()=>{
 assert.equal(catalog.records.length,50);assert.equal(definitions.length,10);const cases=[];
 for(const p of catalog.records)for(const [index,def] of definitions.entries()){
  await workflow(p,def,index);cases.push({taskId:'FC'+String(cases.length+1).padStart(3,'0'),projectId:p.id,field:def.key,route:'/projects/'+p.id+'/',passed:true});
 }
 assert.equal(cases.length,500);
 fs.writeFileSync('checks/field-copy-reliability-500-results.json',JSON.stringify({total:500,passed:500,failed:0,scope:'Controlled DOM/VM clipboard UI workflows; real-browser probes run separately. Native clipboard ordering after superseded writes is not asserted.',coverage:['exact success','clipboard denial','unsupported clipboard','synchronous exception','copy timeout','stale success','stale rejection','invalid key','reload invalidation','reload recovery'],cases},null,2)+'\n');
 console.log('PASS: 500 project-field clipboard, fallback, race and reload workflows');
})().catch(e=>{console.error(e);process.exitCode=1;});
