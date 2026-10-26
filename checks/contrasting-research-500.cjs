/* Verify 50 original research passports x 10 distinct complementary catalogue links. */
'use strict';
const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const catalog=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('checks/contrasting-research-500-ledger.json','utf8'));
const source=fs.readFileSync('src/contrasting-research-paths.js','utf8');
const all=catalog.records;
function oldRelated(p){
 return all.filter(x=>x.id!==p.id).map(x=>({
  id:x.id,name:x.name,
  score:(x.country&&x.country===p.country?4:0)+
   (x.infrastructureType&&x.infrastructureType===p.infrastructureType?2:0)+
   (x.region&&x.region===p.region?1:0)
 })).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).slice(0,6).map(x=>x.id);
}
class El{
 constructor(tag='div'){
  this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this._text='';this.attributes={};this.events={};this.hidden=false;this.style={};
 }
 set className(value){this._class=value;}
 get className(){return this._class||'';}
 set textContent(x){this._text=String(x);this.children=[];}
 get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('');}
 append(...children){this.children.push(...children.filter(Boolean));}
 appendChild(el){this.append(el);return el;}
 insertAdjacentElement(pos,el){this.append(el);}
 replaceChildren(...children){this._text='';this.children=[];this.append(...children);}
 setAttribute(name,value){this.attributes[name]=String(value);}
 addEventListener(name,handler){this.events[name]=handler;}
 focus(){}remove(){}
}
const cases=[];
async function one(origin){
 const main=new El('main'),originalColumns=new El('div'),body=new El('body');
 main.querySelector=selector=>selector==='.columns'?originalColumns:null;
 const document={getElementById:()=>null,querySelector:s=>s==='main'?main:null,createElement:t=>new El(t),body};
 const ctx={document,location:{pathname:'/projects/'+origin.id+'/'},URL,URLSearchParams,AbortController,
   setTimeout:()=>1,clearTimeout:()=>{},window:{},
   fetch:async path=>{assert.equal(path,'/data/projects.json');return {ok:true,json:async()=>catalog};}};
 vm.runInNewContext(source,ctx,{filename:'src/contrasting-research-paths.js'});
 for(let i=0;i<12&&!ctx.window.MicroportContrast?.getState().ready;i++)await new Promise(done=>setImmediate(done));
 const api=ctx.window.MicroportContrast;
 assert.equal(api?.getState().ready,true,'not loaded: '+origin.id);
 assert.equal(api.getState().projectId,origin.id);
 assert.equal(api.getState().paths,10);
 const paths=api.getPaths();
 const root=originalColumns.children.find(x=>x.id==='mpcr-contrast');
 assert.ok(root,"missing original project's collapsed research panel");
 assert.equal(root.tagName,'DETAILS');
 const panel=root.children.find(x=>x.className==='mpcr-body');
 const cardGrid=panel.children.find(x=>x.id==='mpcr-path-grid');
 assert.equal(cardGrid.children.length,10);
 assert.equal(new Set(paths.map(p=>p.id)).size,10,'duplicate recommendations for '+origin.id);
 const banned=new Set(oldRelated(origin));
 for(let i=0;i<10;i++){
  const row=cardGrid.children[i],path=paths[i],dest=all.find(p=>p.id===path.id);
  const task=ledger.tasks[cases.length];
  assert.ok(dest,'destination unavailable');
  assert.equal(task.sourceId,origin.id);
  assert.equal(task.destinationId,dest.id,'wrong ranked destination for '+origin.id);
  assert.equal(row.dataset.mpcrPath,dest.id);
  assert.notEqual(dest.id,origin.id,'self-linked recommendation');
  assert.ok(!banned.has(dest.id),'existing related recommendation duplicated');
  assert.equal(path.country,dest.country);
  assert.equal(path.region,dest.region);
  assert.equal(path.type,dest.infrastructureType);
  assert.deepEqual(Array.from(path.reasons),task.distinctions.map(key=>key==='country'?'Different reported country':key==='infrastructureType'?'Different infrastructure category':'Different world region'));
  const actions=row.children.find(x=>x.className==='mpcr-actions');
  const passportLink=actions.children.find(x=>x.dataset?.mpcrOpen===dest.id);
  const compareLink=actions.children.find(x=>x.dataset?.mpcrCompare===dest.id);
  assert.ok(passportLink,'passport link missing');
  assert.ok(compareLink,'comparison link missing');
  assert.equal(passportLink.href,task.passportHref);
  assert.equal(compareLink.href,task.comparisonHref);
  assert.equal(api.getComparisonURL(dest.id),compareLink.href);
  const external=actions.children.find(x=>x.target==='_blank');
  assert.ok(external&&external.href===dest.source.url,'safe original external source missing');
  assert.equal(external.rel,'noopener noreferrer');
  assert.ok(row.textContent.includes(dest.name),'incorrect research card title');
  cases.push({taskId:task.id,sourceId:origin.id,destinationId:dest.id,passed:true});
 }
}
(async()=>{
 for(const original of all)await one(original);
 assert.equal(cases.length,500);
 assert.deepEqual(cases.map(x=>x.taskId),ledger.tasks.map(x=>x.id));
 fs.writeFileSync('checks/contrasting-research-500-results.json',JSON.stringify({
  total:500,passed:500,failed:0,kind:'500 distinct existing-catalogue passport links and pairwise comparisons',
  note:'Reported metadata differences only; not proof of operational distinctions or affiliations',
  cases
 },null,2)+'\n');
 console.log('PASS 500/500 contrasting research destinations, safe sources and direct comparison links');
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
