/* 500 field-level project actions verified against unmodified original research objects. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const catalog=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('checks/field-inspector-500-ledger.json','utf8'));
const script=fs.readFileSync('src/passport-field-inspector.js','utf8');
const keys=ledger.fieldDefinitions.map(x=>x.key);
class El{
 constructor(t='div'){
  this.tagName=t.toUpperCase();this.children=[];this.dataset={};this.style={};this.attributes={};
  this.listeners={};this.hidden=false;this.value='';this._text='';
 }
 set className(x){this._class=String(x);}get className(){return this._class||'';}
 set textContent(x){this._text=String(x);this.children=[];}
 get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('');}
 append(...nodes){this.children.push(...nodes.filter(Boolean));}
 appendChild(x){this.append(x);return x;}
 replaceChildren(...nodes){this._text='';this.children=[];this.append(...nodes);}
 insertAdjacentElement(where,node){this.append(node);return node;}
 setAttribute(key,val){this.attributes[key]=String(val);}
 getAttribute(key){return this.attributes[key]??null;}
 addEventListener(ev,fn){this.listeners[ev]=fn;}
 click(){return this.listeners.click?.();}
 focus(){}select(){}remove(){}
}
let tested=[];
async function one(p){
 const main=new El('main'),host=new El('div'),body=new El('body');
 main.querySelector=x=>x==='.columns'?host:null;
 const document={querySelector:x=>x==='main'?main:null,getElementById:()=>null,createElement:t=>new El(t),body};
 let copied=[];
 const context={document,location:{pathname:'/projects/'+p.id+'/'},
  URL,AbortController,navigator:{clipboard:{writeText:async s=>{copied.push(s);}}},
  window:{},setTimeout:()=>1,clearTimeout:()=>{},
  fetch:async()=>({ok:true,json:async()=>catalog})};
 vm.runInNewContext(script,context,{filename:'src/passport-field-inspector.js'});
 for(let i=0;i<12&&!context.window.MicroportFields?.getState().ready;i++)await new Promise(done=>setImmediate(done));
 const api=context.window.MicroportFields;
 assert.equal(api?.getState().ready,true,p.id+' not initialized');
 assert.equal(api.getState().count,10);
 assert.equal(api.getState().projectId,p.id);
 assert.deepEqual([...api.getFieldKeys()],keys);
 const root=host.children.find(x=>x.id==='mpf-inspector');
 assert.ok(root,'missing inspector panel');
 assert.equal(root.tagName,'DETAILS');
 assert.equal(root.dataset.mpfReady,'true');
 const bodySection=root.children.find(x=>x.className==='mpf-body');
 const list=bodySection.children.find(x=>x.id==='mpf-field-list');
 assert.equal(list.children.length,10);
 for(let n=0;n<10;n++){
  const key=keys[n],row=list.children[n],text=api.getFieldText(key);
  assert.equal(row.dataset.mpfFieldRow,key);
  const btn=row.children.find(x=>x.dataset?.mpfField===key);
  assert.ok(btn,'copy button missing '+key);
  assert.ok(text.includes('Research project: '+p.name));
  assert.ok(text.includes('Field: '+ledger.fieldDefinitions[n].label));
  const original=key==='sourceURL'?p.source?.url:p[key];
  assert.ok(text.includes('Reported value: '+original),'original value mismatched for '+p.id+' '+key);
  assert.ok(text.includes('Limitations: Public source-linked research only.'));
  const result=await btn.click();
  assert.equal(copied.length,n+1,'clipboard copy missing');
  assert.equal(copied.at(-1),text,'copied content mismatches displayed field context');
  tested.push({id:'F'+String(tested.length+1).padStart(3,'0'),projectId:p.id,field:key,passed:true});
 }
 assert.equal(api.getFieldText('unknown-field'),'','unknown field should not throw');
 assert.equal(api.copyField('unknown-field'),false);
}
(async()=>{
 for(const p of catalog.records)await one(p);
 assert.equal(tested.length,500);
 assert.deepEqual(tested.map(x=>x.id),ledger.tasks.map(x=>x.taskId));
 assert.deepEqual(tested.map(x=>x.projectId),ledger.tasks.map(x=>x.projectId));
 assert.deepEqual(tested.map(x=>x.field),ledger.tasks.map(x=>x.field));
 fs.writeFileSync('checks/field-inspector-500-results.json',JSON.stringify({
  total:500,passed:500,failed:0,checks:'50 public research projects × ten exact field copy actions',
  note:'Simulated clipboard DOM; real Chromium smoke separately verifies responsive UI and manual fallback',
  tasks:tested
 },null,2)+'\n');
 console.log('PASS: 500/500 correct, source-qualified field copies across 50 original research records');
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
