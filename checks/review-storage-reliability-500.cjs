/* 50 passports × ten task workflows: stale snapshots, quota recovery and cleared-note UI. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const catalog=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const categories=JSON.parse(fs.readFileSync('checks/review-workspace-500-ledger.json','utf8')).categories;
const source=fs.readFileSync('src/research-review-workspace.js','utf8');
const KEY='microportmap.review-workspace.v1',tick=()=>new Promise(resolve=>setImmediate(resolve));
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.events={};this.style={};this.hidden=false;this.value='';this._text='';}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 append(...nodes){for(const n of nodes){this.children.push(n);n.parentNode=this;}}
 replaceChildren(...nodes){this._text='';this.children=[];this.append(...nodes);}
 insertAdjacentElement(_,n){this.append(n);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,fn){this.events[k]=fn;}
 click(){return this.events.click?.();}
 focus(){this.doc.activeElement=this;}select(){}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);}
}
async function fixture(p,shared){
 const main=new El('main'),host=new El(),body=new El('body'),timers=new Map();let timerId=0,urlId=0;
 main.querySelector=s=>s==='.columns'?host:null;
 const document={body,activeElement:body,getElementById:()=>null,querySelector:s=>s==='main'?main:null,createElement:t=>{const n=new El(t);n.doc=document;return n;}};
 const localStorage={getItem:key=>{assert.equal(key,KEY);if(shared.failRead)throw Error('Read denied');return shared.raw;},setItem:(key,value)=>{assert.equal(key,KEY);if(shared.failWrite)throw Error('Quota');shared.raw=value;shared.writes=(shared.writes||0)+1;}};
 const f={write:async()=>{},confirm:true,urls:new Map(),events:{},localStorage,document};
 class U extends URL{}
 U.createObjectURL=blob=>{const url='blob:review-'+(++urlId);f.urls.set(url,blob);return url;};U.revokeObjectURL=url=>f.urls.delete(url);
 const context={document,localStorage,location:{pathname:'/projects/'+p.id+'/'},URL:U,Blob,AbortController,
  navigator:{clipboard:{writeText:text=>f.write(text)}},window:{confirm:()=>f.confirm,addEventListener:(key,fn)=>f.events[key]=fn},
  setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),fetch:async()=>({ok:true,json:async()=>catalog})};
 vm.runInNewContext(source,context);f.api=context.window.MicroportReview;
 for(let n=0;n<4;n++)await tick();
 f.root=host.children.find(n=>n.id==='mpr-workspace');
 [f.intro,f.evidence,f.meta,f.progress,f.track,f.list,f.actions,f.notice,f.manual,f.caveat,f.retry]=f.root.children;
 f.text=f.manual.children[0];f.note=key=>f.list.children.find(n=>n.dataset.mprKey===key).children[1].children[1].children[0];
 f.status=key=>f.list.children.find(n=>n.dataset.mprKey===key).children[1].children[0].children[0];
 f.task=key=>f.api.getTasks().find(t=>t.id===key);
 f.copy=()=>f.actions.children[2].click();f.reset=()=>f.actions.children[3].click();
 f.external=event=>f.events.storage({storageArea:localStorage,...event});
 f.expire=ms=>{for(const [id,t] of [...timers])if(t.ms===ms){timers.delete(id);t.fn();}};
 assert.equal(f.api.getState().ready,true);return f;
}
async function workflow(p,category,index){
 const key=category.id,next=categories[(index+1)%categories.length].id,other=catalog.records.find(r=>r.id!==p.id);
 const shared={raw:null},a=await fixture(p,shared),b=await fixture(other,shared),c=await fixture(p,shared);
 // No storage events are delivered: saves must re-read the latest snapshot.
 a.api.update(key,'reviewed','First project evidence');b.api.update(key,'follow-up','Other project evidence');
 let data=JSON.parse(shared.raw);assert.equal(data[p.id][key].note,'First project evidence');assert.equal(data[other.id][key].note,'Other project evidence');
 a.api.update(key,'reviewed','Latest task evidence');c.api.update(next,'follow-up','Another tab task');
 data=JSON.parse(shared.raw);assert.equal(data[p.id][key].note,'Latest task evidence');assert.equal(data[p.id][next].note,'Another tab task');
 a.note(key).focus();const input=a.note(key);input.value='Edited without losing other tasks';input.events.input();
 assert.equal(a.note(key),input);assert.equal(a.document.activeElement,input);assert.equal(a.task(next).note,'Another tab task');assert.equal(a.note(next).value,'Another tab task');
 // Unsaved dirty tasks survive quota failures and are flushed when storage recovers.
 shared.failWrite=true;a.api.update(key,'follow-up','Temporary first task');a.api.update(next,'reviewed','Temporary second task');assert.match(a.meta.textContent,/temporary/);
 shared.failWrite=false;a.api.update(key,'reviewed','Recovered first task');data=JSON.parse(shared.raw);
 assert.equal(data[p.id][key].note,'Recovered first task');assert.equal(data[p.id][next].note,'Temporary second task');assert.equal(data[other.id][key].note,'Other project evidence');
 // Malformed storage must not be overwritten or destroy in-memory notes.
 const good=shared.raw,writes=shared.writes;shared.raw='{malformed';a.api.update(key,'follow-up','Keep while storage malformed');assert.equal(shared.raw,'{malformed');assert.equal(shared.writes,writes);assert.equal(a.task(key).note,'Keep while storage malformed');
 shared.raw=good;a.api.update(next,'reviewed','Recover after malformed storage');assert.equal(JSON.parse(shared.raw)[p.id][key].note,'Keep while storage malformed');
 shared.failRead=true;a.api.update(key,'follow-up','Temporary read-denied note');a.external({key:KEY,newValue:shared.raw});assert.equal(a.task(key).note,'Temporary read-denied note');assert.match(a.meta.textContent,/temporary/);
 shared.failRead=false;a.api.update(next,'reviewed','Recovered after read denial');assert.equal(JSON.parse(shared.raw)[p.id][key].note,'Temporary read-denied note');
 a.api.update(key,'reviewed','X'.repeat(700));assert.equal(a.task(key).note.length,600);assert.equal(a.api.update(key,'unverified','invalid'),false);
 // Storage updates synchronize controls without replacing the focused note field.
 const focused=a.note(key);focused.focus();c.api.update(next,'follow-up','External changed task');a.external({key:KEY,newValue:shared.raw});
 assert.equal(a.note(key),focused);assert.equal(a.document.activeElement,focused);assert.equal(a.task(next).note,'External changed task');assert.equal(a.note(next).value,'External changed task');
 c.api.update(next,'reviewed','Ignore unrelated storage area');a.external({key:KEY,newValue:shared.raw,storageArea:{}});assert.equal(a.task(next).note,'External changed task');
 a.external({key:'unrelated',newValue:shared.raw});assert.equal(a.task(next).note,'External changed task');
 a.external({key:KEY,newValue:shared.raw});assert.equal(a.task(next).note,'Ignore unrelated storage area');
 // A clear event removes old notes instead of resurrecting a cached project snapshot.
 shared.raw=null;a.external({key:null,newValue:null});assert.ok(a.api.getTasks().every(t=>t.status==='not-started'&&t.note===''));
 a.api.update(key,'reviewed','Only post-clear note');data=JSON.parse(shared.raw);assert.equal(Object.keys(data).length,1);assert.equal(data[p.id][next].note,'');
 // Cancelled reset is non-destructive; confirmed reset cannot reopen an older copy fallback.
 a.confirm=false;a.reset();assert.equal(a.task(key).note,'Only post-clear note');
 let reject;a.write=()=>new Promise((_,fail)=>{reject=fail;});const pending=a.copy();a.confirm=true;a.reset();const resetNotice=a.notice.textContent;
 reject(Error('Late clipboard denial'));assert.equal(await pending,false);assert.equal(a.notice.textContent,resetNotice);assert.equal(a.manual.hidden,true);assert.equal(a.text.value,'');
 assert.ok(a.api.getTasks().every(t=>t.note===''&&t.status==='not-started'));
 // Editing notes invalidates a displayed snapshot and supersedes pending successes.
 a.api.update(key,'follow-up','Current private note');a.write=async()=>{throw Error('Denied');};assert.equal(await a.copy(),false);assert.ok(a.text.value.includes('Current private note'));
 a.note(key).value='Changed private note';a.note(key).events.input();assert.equal(a.manual.hidden,true);assert.equal(a.text.value,'');
 let finish;a.write=()=>new Promise(resolve=>{finish=resolve;});const old=a.copy();a.api.update(key,'reviewed','Newest private note');const notice=a.notice.textContent;
 finish();assert.equal(await old,false);assert.equal(a.notice.textContent,notice);assert.equal(a.manual.hidden,true);
 a.actions.children[0].click();const blob=[...a.urls.values()].at(-1),exported=JSON.parse(await blob.text());
 assert.equal(exported.projectId,p.id);assert.equal(exported.questions.find(q=>q.id===key).note,'Newest private note');assert.match(exported.note,/not independent verification/);a.expire(30000);assert.equal(a.urls.size,0);
}
(async()=>{
 assert.equal(catalog.records.length,50);assert.equal(categories.length,10);const cases=[];
 for(const p of catalog.records)for(const [index,category] of categories.entries()){await workflow(p,category,index);cases.push({taskId:'RS'+String(cases.length+1).padStart(3,'0'),projectId:p.id,questionId:category.id,route:'/projects/'+p.id+'/',passed:true});}
 assert.equal(cases.length,500);
 fs.writeFileSync('checks/review-storage-reliability-500-results.json',JSON.stringify({total:500,passed:500,failed:0,scope:'Controlled DOM/VM stale-snapshot, storage and private-note UI workflows; real-browser checks run separately. Read/merge/write is not an atomic cross-tab transaction. Native clipboard writes already begun cannot be recalled.',cases},null,2)+'\n');
 console.log('PASS: 500 review-task storage merge, failure recovery, clear-event and reset workflows');
})().catch(e=>{console.error(e);process.exitCode=1;});
