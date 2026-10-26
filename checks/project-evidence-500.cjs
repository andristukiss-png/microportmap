/* Exhaustive 50 research passports x ten interactive comparison field actions. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const catalog=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('checks/project-evidence-500-ledger.json','utf8'));
const source=fs.readFileSync('src/project-evidence-compare.js','utf8');
const ids=ledger.fields.map(x=>x.id);
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={};this.attr={};this.events={};this._text='';this.hidden=false;this.value='';this.disabled=false;}
 set className(value){this._class=value;}get className(){return this._class||'';}
 set textContent(value){this._text=String(value);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent||'').join('');}
 append(...nodes){this.children.push(...nodes.filter(Boolean));}
 appendChild(node){this.append(node);return node;}
 insertAdjacentElement(where,node){this.append(node);return node;}
 replaceChildren(...nodes){this._text='';this.children=[];this.append(...nodes);}
 setAttribute(name,value){this.attr[name]=String(value);}
 addEventListener(name,fn){this.events[name]=fn;}
 click(){return this.events.click?.({preventDefault(){}});}
 scrollIntoView(){}
 remove(){}
 focus(){}
 select(){}
}
const result=[];
async function one(p){
 const main=new El('main'),host=new El('div'),body=new El('body');
 main.querySelector=s=>s==='.columns'?host:null;
 const doc={getElementById:id=>null,querySelector:s=>s==='main'?main:null,createElement:t=>new El(t),body};
 const blobs=[],copies=[];
 class TestURL extends URL{};
 TestURL.createObjectURL=b=>{blobs.push(b);return 'blob:compare-test';};
 TestURL.revokeObjectURL=()=>{};
 const context={document:doc,URL:TestURL,URLSearchParams,Blob,AbortController,
  navigator:{clipboard:{writeText:async s=>{copies.push(s);}}},location:{pathname:'/projects/'+p.id+'/',search:'',origin:'https://microportmap.com'},
  window:{},setTimeout:()=>1,clearTimeout:()=>{},
  fetch:async path=>{assert.equal(path,'/data/projects.json');return {ok:true,json:async()=>catalog};}};
 vm.runInNewContext(source,context,{filename:'src/project-evidence-compare.js'});
 for(let n=0;n<12&&!context.window.MicroportEvidenceCompare?.getState().ready;n++)await new Promise(done=>setImmediate(done));
 const api=context.window.MicroportEvidenceCompare,initial=api?.getState();
 assert.equal(initial?.ready,true,'Not ready: '+p.id);
 assert.equal(initial.primaryId,p.id);
 assert.notEqual(initial.otherId,p.id);
 assert.equal(initial.fields,10);
 assert.equal(api.getOtherOptions().length,49);
 assert.ok(api.choose(catalog.records.find(x=>x.id!==p.id).id));
 const second=catalog.records.find(x=>x.id===api.getState().otherId);
 const grid=host.children.find(x=>x.id==='mpd-compare');
 assert.ok(grid,'Missing details comparison for '+p.id);
 assert.equal(grid.tagName,'DETAILS');
 const fieldBox=grid.children.find(x=>x.id==='mpd-content').children.find(x=>x.id==='mpd-fields');
 assert.equal(fieldBox.children.length,10);
 for(let n=0;n<ids.length;n++){
  const key=ids[n],field=api.getFields()[n],dom=fieldBox.children[n];
  assert.equal(field.id,key);
  assert.equal(dom.dataset.mpdField,key);
  const selected=key==='sourceName'?p.source?.name:p[key];
  const other=key==='sourceName'?second.source?.name:second[key];
  assert.equal(field.primary,selected||'Not recorded in catalogue');
  assert.equal(field.comparison,other||'Not recorded in catalogue');
  assert.ok(field.observation.includes(selected===other?'Same':'Different')||field.observation.includes('omits'));
  const control=dom.children.find(x=>x.dataset?.mpdAction===key);
  assert.ok(control,key+' button missing');
  control.click();
  assert.equal(api.getState().active,key);
  const focus=grid.children.find(x=>x.id==='mpd-content').children.find(x=>x.id==='mpd-focus');
  assert.ok(focus.textContent.includes(selected),key+' active details missing');
  assert.ok(focus.textContent.includes(other),key+' other context missing');
  assert.ok(focus.textContent.includes('independently'),key+' qualification absent');
  result.push({id:'C'+String(result.length+1).padStart(3,'0'),primaryId:p.id,fieldId:key,comparisonId:second.id,passed:true});
 }
 const actionBox=grid.children.find(x=>x.id==='mpd-content').children.find(x=>x.className==='mpd-actions');
 actionBox.children[1].click();
 assert.ok(blobs.length>=1);
 const json=JSON.parse(await blobs.at(-1).text());
 assert.equal(json.fields.length,10);assert.equal(json.primaryId,p.id);assert.equal(json.comparisonId,second.id);
 actionBox.children[2].click();assert.ok((await blobs.at(-1).text()).includes('field_id'));
 await actionBox.children[0].click();assert.ok(copies.at(-1).includes(p.name));
 assert.ok(copies.at(-1).includes(second.name));
 assert.equal(api.focus('unknown-field'),false);
}
(async()=>{
 for(const row of catalog.records)await one(row);
 assert.equal(result.length,500);
 assert.deepEqual(result.map(x=>x.id),ledger.tasks.map(x=>x.id));
 assert.deepEqual(result.map(x=>x.primaryId),ledger.tasks.map(x=>x.projectId));
 assert.deepEqual(result.map(x=>x.fieldId),ledger.tasks.map(x=>x.fieldId));
 fs.writeFileSync('checks/project-evidence-500-results.json',JSON.stringify({
  total:500,passed:500,failed:0,
  kind:'50 original primary passports x 10 side-by-side reported-field actions, with an actual distinct comparison record',
  caveat:'Comparisons do not independently authenticate any research claims',
  cases:result
 },null,2)+'\n');
 console.log('PASS: 500/500 evidence comparison controls, exact original values and caveats across 50 passports');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
