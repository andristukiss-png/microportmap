/* 50 authentic research passports × ten reversible reading actions = 500 controls. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('checks/passport-reading-500-ledger.json','utf8'));
const source=fs.readFileSync('src/passport-reading-controls.js','utf8');
const names=ledger.actions.map(x=>x.actionId);
class Classes{
 constructor(){this.values=new Set();}
 toggle(name,on){if(on===undefined? !this.values.has(name):on)this.values.add(name);else this.values.delete(name);}
 contains(name){return this.values.has(name);}
}
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.events={};this._text='';this.open=false;this.style={values:{},setProperty:(key,val)=>this.style.values[key]=val};}
 set className(x){this._class=x;}get className(){return this._class||'';}
 set textContent(x){this._text=String(x);this.children=[];}
 get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('');}
 append(...xs){this.children.push(...xs.filter(Boolean));}
 insertAdjacentElement(position,x){this.append(x);}
 appendChild(x){this.append(x);return x;}
 setAttribute(key,val){this.attrs[key]=String(val);}
 getAttribute(key){return this.attrs[key]??null;}
 addEventListener(key,fn){this.events[key]=fn;}
 click(){return this.events.click?.();}
}
const executed=[];
async function one(p){
 const main=new El('main'),hero=new El('div'),body=new El('body');
 body.classList=new Classes();
 const details=Array.from({length:4},()=>new El('details'));
 main.querySelector=x=>x==='.hero'?hero:null;
 main.querySelectorAll=x=>x==='details'?details:[];
 const document={querySelector:x=>x==='main'?main:null,getElementById:()=>null,createElement:t=>new El(t),body};
 let printCount=0;
 const context={document,location:{pathname:'/projects/'+p.id+'/'},window:{print:()=>{printCount++;}}};
 vm.runInNewContext(source,context,{filename:'src/passport-reading-controls.js'});
 const api=context.window.MicroportReading;
 assert.equal(api?.getState().ready,true);
 assert.equal(api.getState().projectId,p.id);
 assert.equal(api.getState().actions,10);
 assert.deepEqual([...api.getActions()],names);
 const root=hero.children.find(x=>x.id==='mprc-controls');
 assert.equal(root?.tagName,'DETAILS','reader should be collapsible');
 assert.equal(root.open,false,'reader begins closed');
 const actions=root.children.find(x=>x.className==='mprc-panel').children.find(x=>x.id==='mprc-action-grid');
 assert.equal(actions.children.length,10);
 for(let i=0;i<names.length;i++){
  const key=names[i],button=actions.children[i];
  assert.equal(button.dataset.mprcAction,key);
  assert.equal(button.tagName,'BUTTON');
  assert.equal(button.attrs['aria-label'],ledger.actions[i].title);
  button.click();
  const state=api.getState();
  if(key==='focus'){assert.equal(state.focused,true);assert.equal(body.classList.contains('mprc-focus'),true);}
  else if(key==='tools'){assert.equal(state.focused,false);assert.equal(body.classList.contains('mprc-focus'),false);}
  else if(key==='larger'){assert.equal(state.scale,1.1);assert.equal(main.style.values['--mprc-scale'],'1.1');}
  else if(key==='smaller'){assert.equal(state.scale,1);}
  else if(key==='normal-text'){assert.equal(state.scale,1);}
  else if(key==='comfort'){assert.equal(state.spacing,'comfortable');assert.equal(body.classList.contains('mprc-comfort'),true);}
  else if(key==='compact'){assert.equal(state.spacing,'compact');assert.equal(body.classList.contains('mprc-comfort'),false);assert.equal(body.classList.contains('mprc-compact'),true);}
  else if(key==='expand')assert.ok(details.every(x=>x.open));
  else if(key==='collapse')assert.ok(details.every(x=>!x.open));
  else if(key==='print')assert.equal(printCount,1);
  executed.push({id:'RC'+String(executed.length+1).padStart(3,'0'),projectId:p.id,actionId:key,passed:true});
 }
 assert.equal(api.activate('unknown'),false);
 assert.equal(api.activate('larger'),true);
 assert.equal(api.activate('normal-text'),true);
 assert.equal(api.getState().scale,1);
 assert.ok(root.children[1].children.find(x=>x.id==='mprc-status').textContent.length);
}
(async()=>{
 for(const r of data.records)await one(r);
 assert.equal(executed.length,500);
 assert.deepEqual(executed.map(x=>x.id),ledger.tasks.map(x=>x.taskId));
 assert.deepEqual(executed.map(x=>x.projectId),ledger.tasks.map(x=>x.projectId));
 assert.deepEqual(executed.map(x=>x.actionId),ledger.tasks.map(x=>x.actionId));
 fs.writeFileSync('checks/passport-reading-500-results.json',JSON.stringify({
  total:500,passed:500,failed:0,kind:'50 original project passports × 10 reversible reading controls',
  caveat:'Simulated state controls; real Chromium checks performed separately',
  cases:executed
 },null,2)+'\n');
 console.log('PASS 500/500 reversible project reading actions; printing, sizing, focus and disclosures');
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
