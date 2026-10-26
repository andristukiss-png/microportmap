/* 50 authentic research passports × ten reversible reading actions = 500 controls. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const source=fs.readFileSync('src/passport-reading-controls.js','utf8');
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

const cases=[];
const scenarios={
 'focus-toggle':({api,body})=>{api.activate('focus');assert.equal(body.classList.contains('mprc-focus'),true);api.activate('focus');assert.equal(api.getState().focused,false);},
 'show-tools':({api})=>{api.activate('focus');api.activate('tools');api.activate('tools');assert.equal(api.getState().focused,false);},
 'expand-from-focus':({api,details,body})=>{api.activate('focus');api.activate('expand');assert.ok(details.every(d=>d.open));assert.equal(body.classList.contains('mprc-focus'),false);},
 'collapse-keeps-reader':({api,details,root})=>{root.open=true;api.activate('expand');api.activate('collapse');assert.ok(details.every(d=>!d.open));assert.equal(root.open,true);},
 'upper-bound':({api,buttons})=>{for(let n=0;n<20;n++)api.activate('larger');assert.equal(api.getState().scale,1.4);assert.equal(buttons.larger.disabled,true);api.activate('smaller');assert.equal(buttons.larger.disabled,false);},
 'lower-bound':({api,buttons})=>{for(let n=0;n<20;n++)api.activate('smaller');assert.equal(api.getState().scale,.9);assert.equal(buttons.smaller.disabled,true);api.activate('larger');assert.equal(buttons.smaller.disabled,false);},
 'normal-restores-bounds':({api,buttons})=>{for(let n=0;n<20;n++)api.activate('larger');api.activate('normal-text');assert.equal(api.getState().scale,1);assert.equal(buttons.larger.disabled,false);assert.equal(buttons.smaller.disabled,false);},
 'spacing-exclusive-toggle':({api,buttons,body})=>{api.activate('comfort');assert.equal(buttons.comfort.attrs['aria-pressed'],'true');api.activate('compact');assert.equal(buttons.comfort.attrs['aria-pressed'],'false');assert.equal(body.classList.contains('mprc-comfort'),false);api.activate('compact');assert.equal(api.getState().spacing,'normal');},
 'button-semantics':({api,buttons})=>{for(const [k,b] of Object.entries(buttons))assert.equal(b.attrs['aria-pressed'],['focus','comfort','compact'].includes(k)?'false':undefined);api.activate('focus');assert.equal(buttons.focus.attrs['aria-pressed'],'true');},
 'print-failure-recovery':({api,context,status})=>{context.window.print=()=>{throw Error('Blocked')};assert.equal(api.activate('print'),false);assert.match(status.textContent,/browser menu/);context.window.print=undefined;assert.equal(api.activate('print'),false);api.activate('larger');assert.equal(api.getState().scale,1.1);}
};
for(const p of data.records)for(const [scenario,test] of Object.entries(scenarios)){
 const main=new El('main'),hero=new El('div'),body=new El('body');body.classList=new Classes();
 const details=Array.from({length:4},()=>new El('details'));
 let root;
 main.querySelector=x=>x==='.hero'?hero:null;
 main.querySelectorAll=x=>x==='details'?[...details,root].filter(Boolean):[];
 const document={querySelector:x=>x==='main'?main:null,getElementById:()=>null,createElement:t=>new El(t),body};
 const context={document,location:{pathname:'/projects/'+p.id+'/'},window:{print:()=>{}}};
 vm.runInNewContext(source,context);
 root=hero.children.find(x=>x.id==='mprc-controls');
 const panel=root.children[1],grid=panel.children.find(x=>x.id==='mprc-action-grid');
 const buttons=Object.fromEntries(grid.children.map(b=>[b.dataset.mprcAction,b]));
 const api=context.window.MicroportReading,status=panel.children.find(x=>x.id==='mprc-status');
 assert.equal(api.getState().projectId,p.id);
 assert.equal(root.open,false);
 test({api,details,root,body,buttons,context,status});
 cases.push({taskId:'RR'+String(cases.length+1).padStart(3,'0'),projectId:p.id,route:'/projects/'+p.id+'/',scenario,passed:true});
}
assert.equal(cases.length,500);
fs.writeFileSync('checks/reading-reliability-500-results.json',JSON.stringify({total:cases.length,passed:cases.length,failed:0,scope:'Controlled DOM/VM interaction transitions; not a browser or deployment test',cases},null,2)+'\n');
console.log('PASS: 500 reading reliability scenarios across 50 project routes');
