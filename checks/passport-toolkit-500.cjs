/* 50 original research passports × 10 visitor actions = 500 executable instances. */
'use strict';
const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const catalogue=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const source=fs.readFileSync('src/passport-research-toolkit.js','utf8');
const operationIds=['citation-plain','citation-markdown','citation-bibtex',
 'download-brief-txt','download-brief-md','copy-review','download-review-csv',
 'copy-facts','original-source','same-equipment'];
assert.equal(catalogue.records.length,50);
class Element{
 constructor(tag='div'){
  this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};
  this.listeners={};this.hidden=false;this.value='';this._text='';this.parentNode=null;
 }
 set className(x){this._cls=x;}
 get className(){return this._cls||'';}
 set textContent(x){this.children=[];this._text=String(x);}
 get textContent(){return this._text+this.children.map(x=>x?.textContent||'').join('');}
 append(...nodes){for(const node of nodes){if(node==null)continue;this.children.push(node);node.parentNode=this;}}
 appendChild(node){this.append(node);return node;}
 insertAdjacentElement(position,node){this.append(node);return node;}
 setAttribute(name,value){this.attributes[name]=String(value);}
 getAttribute(name){return this.attributes[name]??null;}
 addEventListener(name,callback){this.listeners[name]=callback;}
 click(){return this.listeners.click?.({preventDefault(){this.defaultPrevented=true;}});}
 focus(){}
 select(){}
 remove(){this.removed=true;}
 querySelectorAll(selector){
  const found=[];const visit=node=>{
   for(const child of node.children){
    if(selector==='[data-mpp-action]'&&child.dataset?.mppAction)found.push(child);
    visit(child);
   }
  };
  visit(this);return found;
 }
}
const rows=[];
async function one(record){
 const main=new Element('main'),host=new Element('div'),body=new Element('body');
 main.querySelector=s=>s==='.columns'?host:null;
 const doc={
  querySelector:s=>s==='main'?main:null,
  getElementById:()=>null,
  createElement:tag=>new Element(tag),body
 };
 const downloads=[],copies=[],urlRevokes=[];
 class MockURL extends URL{}
 MockURL.createObjectURL=b=>{downloads.push(b);return 'blob:microportmap-test-'+downloads.length;};
 MockURL.revokeObjectURL=u=>urlRevokes.push(u);
 const browser={};
 const ctx={document:doc,window:browser,
  navigator:{clipboard:{writeText:async value=>{copies.push(value);}}},
  location:{pathname:'/projects/'+record.id+'/',origin:'https://microportmap.com'},
  URL:MockURL,URLSearchParams,Blob,AbortController,
  setTimeout:()=>1,clearTimeout:()=>{},
  fetch:async path=>{
   assert.equal(path,'/data/projects.json');
   return {ok:true,json:async()=>catalogue};
  }
 };
 const instrumented=source.replace('.catch(errorMessage)', '.catch(err=>{globalThis.__passportError=String(err.stack||err);errorMessage()})');
 vm.runInNewContext(instrumented,ctx,{filename:'src/passport-research-toolkit.js'});
 for(let i=0;i<5&&!browser.MicroportPassportToolkit?.getState().loaded;i++){
   await new Promise(done=>setImmediate(done));
 }
 const state=browser.MicroportPassportToolkit?.getState();
 assert.equal(state?.loaded,true,'toolkit failed for '+record.id+': '+ctx.__passportError);
 assert.equal(state.id,record.id);
 assert.equal(state.actions,10);
 assert.deepEqual(Array.from(browser.MicroportPassportToolkit.getLabels()),operationIds);
 const root=host.children.find(x=>x.id==='mpp-toolkit');
 assert.ok(root,'missing research panel for '+record.id);
 const entries=root.querySelectorAll('[data-mpp-action]');
 const mapped=new Map(entries.map(x=>[x.dataset.mppAction,x]));
 assert.equal(mapped.size,10);
 for(const [index,id] of operationIds.entries()){
  const control=mapped.get(id);assert.ok(control,record.id+' '+id);
  if(control.tagName==='BUTTON'){
    const beforeCopy=copies.length,beforeDownload=downloads.length;
    await control.click();
    if(id.startsWith('copy')||id.startsWith('citation-')){
      assert.equal(copies.length,beforeCopy+1,id+' not copied');
      const result=copies.at(-1);
      assert.ok(result.includes(record.name),'citation/summary uses wrong project');
      assert.ok(result.includes('MicroportMap')||result.includes('microportmap'),'record context missing');
      if(id==='citation-bibtex')assert.ok(result.startsWith('@misc{microportmap_'+record.id+','));
    }else{
      assert.equal(downloads.length,beforeDownload+1,id+' no download');
      const blob=downloads.at(-1),contents=await blob.text();
      assert.ok(contents.includes(record.name),'file refers to wrong project');
      if(id==='download-review-csv')assert.ok(contents.includes('catalog_field_present'));
      if(id==='download-brief-md')assert.ok(contents.startsWith('# '));
    }
  }else{
    assert.equal(control.tagName,'A');
    if(id==='original-source'){
      const original=record.source?.url;
      assert.equal(control.href,original);
      assert.ok(original.startsWith('https://'));
      assert.equal(control.target,'_blank');
      assert.equal(control.rel,'noopener noreferrer');
    }else{
      assert.ok(control.href.startsWith('/directory/?q='));
      assert.equal(new URLSearchParams(control.href.split('?')[1]).get('q'),record.reportedEquipment);
    }
  }
  rows.push({taskId:'P'+String(rows.length+1).padStart(3,'0'),
    projectId:record.id,actionId:id,passed:true,recordSpecific:true});
 }
}
(async()=>{
 for(const r of catalogue.records)await one(r);
 assert.equal(rows.length,500);
 const ledger=JSON.parse(fs.readFileSync('checks/passport-toolkit-500-ledger.json','utf8')).tasks;
 assert.deepEqual(rows.map(x=>x.taskId),ledger.map(x=>x.id));
 assert.deepEqual(rows.map(x=>x.projectId),ledger.map(x=>x.projectId));
 assert.deepEqual(rows.map(x=>x.actionId),ledger.map(x=>x.actionId));
 fs.writeFileSync('checks/passport-toolkit-500-results.json',JSON.stringify({
  total:rows.length,passed:rows.length,failed:0,kind:'runtime simulated DOM action verification',
  caveat:'Simulated browser APIs; physical browsers checked separately',cases:rows
 },null,2)+'\n');
 console.log('PASS: 500/500 project-specific citation, download, review, link actions across 50 real records');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
