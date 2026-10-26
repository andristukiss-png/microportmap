/* 50 original passport contexts × ten shortlist/modal/share boundary scenarios. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const catalog=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const source=fs.readFileSync('src/research-trail.js','utf8'),KEY='microportmap.research-trail.v1';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class Classes{
 constructor(){this.values=new Set();}add(x){this.values.add(x);}remove(x){this.values.delete(x);}contains(x){return this.values.has(x);}
}
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.events={};this.classList=new Classes();this.hidden=false;this.disabled=false;this.inert=false;this.value='';this._text='';this.selected=0;}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 append(...nodes){for(const n of nodes){this.children.push(n);n.parentNode=this;}}
 appendChild(n){this.append(n);return n;}
 replaceChildren(...nodes){this._text='';this.children=[];this.append(...nodes);}
 insertAdjacentElement(_,n){this.parentNode?this.parentNode.append(n):this.append(n);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 getAttribute(k){return this.attrs[k]??null;}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
 click(event={preventDefault:()=>{}}){if(this.disabled||this.inert)return false;let result;for(const fn of this.events.click||[])result=fn(event);return result;}
 focus(){this.doc.activeElement=this;}select(){this.selected++;}
 contains(n){return this===n||this.children.some(c=>c.contains(n));}
 get isConnected(){return this.doc?.body.contains(this)||false;}
 getClientRects(){for(let n=this;n;n=n.parentNode)if(n.hidden)return [];return [{}];}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);this.parentNode=null;}
 matches(selector){if(selector.startsWith('.'))return (this.className||'').split(' ').includes(selector.slice(1));if(selector==='[data-mpt-save]')return !!this.attrs['data-mpt-save'];return false;}
 querySelectorAll(selector){
  const found=[];for(const n of this.children){
   let hit=false;
   if(selector==='[data-mpt-save]')hit=!!n.attrs['data-mpt-save'];
   else if(selector.startsWith('a[href],button'))hit=(n.tagName==='A'&&!!n.href)||(['BUTTON','INPUT','SELECT','TEXTAREA'].includes(n.tagName)&&!n.disabled);
   else if(selector.startsWith('.'))hit=n.matches(selector);
   if(hit)found.push(n);found.push(...n.querySelectorAll(selector));
  }return found;
 }
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
}
async function fixture(p,{ids=[p.id],share=[],fail=false,raw}={}){
 const body=new El('body'),main=new El('main'),hero=new El('div'),alreadyInert=new El('aside');alreadyInert.inert=true;
 main.append(hero);body.append(main,alreadyInert);const documentElement=new El('html');documentElement.dataset={};
 const document={body,documentElement,activeElement:body,events:{},createElement:t=>{const n=new El(t);n.doc=document;return n;},querySelector:s=>s==='main .hero'?hero:null,
  querySelectorAll:s=>body.querySelectorAll(s),getElementById:id=>{const search=n=>n.id===id?n:n.children.map(search).find(Boolean);return search(body)||null;},addEventListener:(k,fn)=>document.events[k]=fn};
 for(const n of [body,main,hero,alreadyInert,documentElement])n.doc=document;
 const store={value:raw===undefined?JSON.stringify(ids):raw},f={write:async()=>{},confirm:true,urls:new Map(),events:{},calls:0};let urlId=0,timerId=0;const timers=new Map();
 const localStorage={getItem:key=>{assert.equal(key,KEY);return store.value;},setItem:(key,value)=>{assert.equal(key,KEY);store.value=value;}};
 const location=new URL('https://microportmap.example/projects/'+p.id+'/'+(share.length?'?'+new URLSearchParams({trail:share.join(',')}):''));
 class U extends URL{}
 U.createObjectURL=blob=>{const url='blob:trail-'+(++urlId);f.urls.set(url,blob);return url;};U.revokeObjectURL=url=>f.urls.delete(url);
 f.fetch=async()=>{if(fail)throw Error('Offline');return {ok:true,json:async()=>catalog};};
 const context={document,localStorage,location,URL:U,URLSearchParams,Blob,MutationObserver:class{observe(){}},
  navigator:{clipboard:{writeText:value=>f.write(value)}},window:{confirm:()=>f.confirm,addEventListener:(k,fn)=>f.events[k]=fn},
  setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),fetch:(...args)=>{f.calls++;return f.fetch(...args);}};
 vm.runInNewContext(source,context);f.api=context.window.MicroportTrail;
 f.settle=async()=>{for(let i=0;i<5;i++)await tick();};await f.settle();
 f.trigger=document.getElementById('mpt-open');f.backdrop=document.getElementById('mpt-drawer');f.panel=f.backdrop.children[0];
 [f.top,f.description,f.shared,f.notice,f.tools,f.summary,f.list,f.suggestions,f.outputs,f.manual,f.more,f.status]=f.panel.children;
 f.query=f.tools.children[0];f.order=f.tools.children[1];f.text=f.manual.children[0].children[0];f.close=f.top.children[1];
 f.document=document;f.main=main;f.alreadyInert=alreadyInert;f.store=store;f.storage=localStorage;f.hero=hero;f.timers=timers;
 f.open=()=>f.trigger.click();f.share=()=>f.outputs.children[3].click();f.clear=()=>f.outputs.children[4].click();
 f.key=(key,shiftKey=false)=>{let prevented=false;document.events.keydown({key,shiftKey,preventDefault:()=>{prevented=true;}});return prevented;};
 f.external=event=>f.events.storage({storageArea:localStorage,...event});
 f.expire=ms=>{for(const [id,t] of [...timers])if(t.ms===ms){timers.delete(id);t.fn();}};
 assert.equal(f.api.max,5);return f;
}
const scenarios={
 'modal-inert-state-and-restoration':async p=>{
  const f=await fixture(p);f.trigger.focus();f.open();assert.equal(f.backdrop.hidden,false);assert.equal(f.main.inert,true);assert.equal(f.trigger.inert,true);assert.equal(f.alreadyInert.inert,true);assert.equal(f.document.activeElement,f.close);
  f.close.click();assert.equal(f.main.inert,false);assert.equal(f.trigger.inert,false);assert.equal(f.alreadyInert.inert,true);assert.equal(f.document.activeElement,f.trigger);assert.equal(f.trigger.attrs['aria-expanded'],'false');
 },
 'keyboard-trap-and-escape':async p=>{
  const f=await fixture(p);f.open();const nodes=f.panel.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)').filter(n=>n.getClientRects().length);
  nodes.at(-1).focus();assert.equal(f.key('Tab'),true);assert.equal(f.document.activeElement,nodes[0]);nodes[0].focus();assert.equal(f.key('Tab',true),true);assert.equal(f.document.activeElement,nodes.at(-1));
  f.document.activeElement=f.document.body;assert.equal(f.key('Tab'),true);assert.equal(f.document.activeElement,nodes[0]);f.key('Escape');assert.equal(f.backdrop.hidden,true);assert.equal(f.document.activeElement,f.trigger);
 },
 'invalid-stored-identities-normalize-to-empty':async p=>{
  const f=await fixture(p,{ids:['unknown-research-record','not/a/slug']});assert.equal(f.api.getIds().length,0);assert.equal(f.store.value,'[]');f.open();assert.ok(f.outputs.children.slice(0,4).every(b=>b.disabled));
 },
 'shared-links-are-opt-in':async p=>{
  const other=catalog.records.find(r=>r.id!==p.id),f=await fixture(p,{ids:[p.id],share:[other.id]});assert.deepEqual([...f.api.getIds()],[p.id]);f.open();assert.equal(f.shared.hidden,false);f.shared.children[1].click();assert.deepEqual([...f.api.getIds()],[p.id,other.id]);assert.equal(f.shared.hidden,true);
 },
 'partial-import-retains-unimported-projects':async p=>{
  const others=catalog.records.filter(r=>r.id!==p.id),saved=[p.id,...others.slice(0,3).map(r=>r.id)],incoming=others.slice(3,5).map(r=>r.id),f=await fixture(p,{ids:saved,share:incoming});f.open();f.shared.children[1].click();
  assert.equal(f.api.getIds().length,5);assert.equal(f.shared.hidden,false);assert.equal(f.shared.children[1].disabled,true);assert.ok(f.shared.textContent.includes('1 project ID was'));
  f.list.children[0].children[3].children[4].click();f.shared.children[1].click();assert.equal(f.api.getIds().length,5);assert.ok(f.api.getIds().includes(incoming[1]));assert.equal(f.shared.hidden,true);
 },
 'storage-clear-and-unrelated-area':async p=>{
  const f=await fixture(p);f.open();f.external({key:KEY,newValue:'[]',storageArea:{}});assert.equal(f.api.getIds().length,1);f.external({key:'unrelated',newValue:'[]'});assert.equal(f.api.getIds().length,1);
  f.store.value=null;f.external({key:null,newValue:null});assert.equal(f.api.getIds().length,0);assert.equal(f.trigger.textContent,'Saved research · 0');assert.ok(f.outputs.children.every(b=>b.disabled));
 },
 'share-timeout-selectable-fallback':async p=>{
  const f=await fixture(p);f.open();f.write=()=>new Promise(()=>{});const pending=f.share();f.expire(800);assert.equal(await pending,false);assert.equal(f.manual.hidden,false);assert.equal(f.document.activeElement,f.text);assert.equal(f.text.selected,1);
  const url=new URL(f.text.value);assert.equal(url.origin,'https://microportmap.example');assert.equal(url.searchParams.get('trail'),p.id);assert.equal(url.hash,'#atlas');assert.equal(f.timers.size,0);
 },
 'clearing-supersedes-share-outcomes':async p=>{
  const f=await fixture(p);f.open();let reject;f.write=()=>new Promise((_,fail)=>{reject=fail;});const pending=f.share();f.clear();const message=f.status.textContent;reject(Error('Old denial'));assert.equal(await pending,false);assert.equal(f.status.textContent,message);assert.equal(f.manual.hidden,true);assert.equal(f.text.value,'');assert.equal(f.api.getIds().length,0);
 },
 'exports-and-accessible-project-labels':async p=>{
  const f=await fixture(p);assert.ok(f.hero.querySelector('[data-mpt-save]').attrs['aria-label'].includes(p.name));f.open();assert.equal(f.list.children[0].children[3].children[4].attrs['aria-label'],'Remove '+p.name+' from research trail');
  let finish;f.write=()=>new Promise(resolve=>{finish=resolve;});const pending=f.share();f.outputs.children[1].click();const status=f.status.textContent;finish();assert.equal(await pending,false);assert.equal(f.status.textContent,status);
  const text=await [...f.urls.values()][0].text(),data=JSON.parse(text);assert.deepEqual(data.selectedProjectIds,[p.id]);assert.match(data.limitations,/flight-permission/);f.expire(30000);assert.equal(f.urls.size,0);
 },
 'catalogue-failure-controls-and-retry':async p=>{
  const f=await fixture(p,{fail:true});f.open();await f.settle();assert.ok(f.outputs.children.slice(0,4).every(b=>b.disabled));assert.equal(f.query.disabled,true);assert.equal(f.list.children[0].textContent,'Retry research catalog');
  let finish;f.fetch=()=>new Promise(resolve=>{finish=resolve;});const before=f.calls;f.list.children[0].click();f.close.click();f.open();assert.equal(f.calls,before+1);finish({ok:true,json:async()=>catalog});await f.settle();assert.equal(f.query.disabled,false);assert.equal(f.list.children.length,1);assert.equal(f.outputs.children[1].disabled,false);
 }
};
(async()=>{
 assert.equal(catalog.records.length,50);const cases=[];
 for(const p of catalog.records)for(const [scenario,run] of Object.entries(scenarios)){await run(p);cases.push({taskId:'TR'+String(cases.length+1).padStart(3,'0'),projectId:p.id,route:'/projects/'+p.id+'/',scenario,passed:true});}
 assert.equal(cases.length,500);
 fs.writeFileSync('checks/trail-reliability-500-results.json',JSON.stringify({total:500,passed:500,failed:0,scope:'Controlled DOM/VM shortlist, accessibility and share-link recovery checks; real-browser checks run separately. Public IDs are shared only on explicit import/copy actions; no independent research verification or native clipboard ordering claims.',cases},null,2)+'\n');
 console.log('PASS: 500 saved-trail modal, shared-import, storage and export recovery scenarios');
})().catch(e=>{console.error(e);process.exitCode=1;});
