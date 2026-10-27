'use strict';
const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const records=JSON.parse(fs.readFileSync('src/data/projects.json')).records;
const source=fs.readFileSync('src/experience-tools.js','utf8');
const finder=source.slice(source.indexOf('  function finder() {'),source.indexOf('\n  function headline('));
const tick=()=>new Promise(r=>setImmediate(r));
async function setup(record){
 const listeners={},doc={activeElement:null};
 class El{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.events={};this.attrs={};this.inert=false;this.isConnected=true;this.hidden=false;this.value='';this.textContent='';}
  appendChild(n){this.children.push(n);return n;}replaceChildren(...n){this.children=n;}setAttribute(k,v){this.attrs[k]=String(v);}addEventListener(k,fn){this.events[k]=fn;}
  focus(){doc.activeElement=this;}click(){this.events.click?.({target:this});}
  querySelectorAll(){const out=[];function visit(n){for(const c of n.children){if(['A','BUTTON','INPUT'].includes(c.tagName))out.push(c);visit(c)}}visit(this);return out;}
  querySelector(s){return this.querySelectorAll().find(n=>s==='.mpx-search-result'&&n.className==='mpx-search-result')||null;}
 }
 const body=new El('body'),header=new El('header'),main=new El('main'),footer=new El('footer'),origin=new El('button');header.appendChild(origin);main.inert=true;body.children=[header,main,footer];body.classList={add(){},remove(){}};doc.body=body;doc.activeElement=origin;doc.addEventListener=(k,fn)=>listeners[k]=fn;
 const make=(tag,cls,text)=>{const e=new El(tag);e.className=cls||'';if(text!==undefined)e.textContent=String(text);return e};
 const button=(name,fn,cls)=>{const e=make('button',cls,name);e.addEventListener('click',fn);return e};
 const link=(name,href,cls)=>{const e=make('a',cls,name);e.href=href;return e};
 const ctx={document:doc,location:{href:''},URLSearchParams,make,button,link,add:(p,items)=>items.forEach(x=>p.appendChild(x)),$:()=>null,data:()=>Promise.resolve([record]),matches:()=>true,catalogueURL:id=>'/projects/'+id+'/',projectAtlasURL:id=>'/?project='+id+'#atlas'};
 vm.runInNewContext(finder+'\nfinder();',ctx);const trigger=body.children[3],cover=body.children[4],panel=cover.children[0],search=panel.children[2],count=panel.children[3],results=panel.children[4];
 return {body,header,main,footer,origin,trigger,cover,panel,search,count,results,listeners};
}
(async()=>{let total=0;for(const record of records){const f=await setup(record);f.trigger.click();await tick();
 const checks=[()=>assert(!f.cover.hidden),()=>assert.equal(f.trigger.attrs['aria-expanded'],'true'),()=>assert(f.header.inert&&f.footer.inert&&f.trigger.inert),()=>assert(f.main.inert),()=>assert.equal(f.count.textContent,'1 of 1 research records.'),()=>assert.equal(f.results.children[0].children[0].href,'/projects/'+record.id+'/'),()=>assert.equal(f.search.attrs['aria-label'],'Find research projects'),()=>{f.listeners.keydown({key:'Escape',preventDefault(){}});assert(f.cover.hidden)},()=>assert(!f.header.inert&&!f.footer.inert&&f.main.inert),()=>assert.equal(f.trigger.attrs['aria-expanded'],'false')];
 for(const check of checks){check();total++}assert.equal(f.trigger.inert,false);f.trigger.click();await tick();f.cover.events.pointerdown({target:f.cover});assert(f.cover.hidden);assert(!f.header.inert&&f.main.inert);
 }assert.equal(total,500);console.log('PASS: 500 project-specific search dialog accessibility and restoration cases')})().catch(e=>{console.error(e);process.exitCode=1});
