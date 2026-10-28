/* MicroportMap contrasting research paths: ten new source-linked comparisons per passport. */
(()=>{
'use strict';
const match=location.pathname.match(/^\/projects\/([a-z0-9-]+)\/?$/);
if(!match||document.getElementById('mpcr-contrast'))return;
const primaryId=match[1],main=document.querySelector('main');
if(!main)return;
const make=(tag,cls,label)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(label!==undefined)node.textContent=String(label);
 return node;
};
const link=(title,url,cls='mpcr-link')=>{
 const a=make('a',cls,title);a.href=url;return a;
};
const validSource=p=>{
 if(typeof p.source?.url!=='string')return null;
 try{const x=new URL(p.source.url);return x.protocol==='https:'&&!x.username&&!x.password?x.href:null}
 catch{return null;}
};
const passport=p=>'/projects/'+encodeURIComponent(p.id)+'/';
const compare=(a,b)=>'/directory/?'+new URLSearchParams({compare:a.id+','+b.id})+'#project-comparison';
const caveat='These are contrasting public research references, not affiliated projects, verified operating facilities, equipment equivalences, exact locations, access rights or aviation permissions.';
function existingRelated(records,primary){
 return records.filter(p=>p.id!==primary.id).map(p=>({
  id:p.id,name:p.name,
  score:(p.country&&p.country===primary.country?4:0)+
        (p.infrastructureType&&p.infrastructureType===primary.infrastructureType?2:0)+
        (p.region&&p.region===primary.region?1:0)
 })).filter(p=>p.score>0).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name))
   .slice(0,6).map(x=>x.id);
}
function contrastPaths(records,primary){
 const blocked=new Set(existingRelated(records,primary));
 const remaining=records.filter(p=>p.id!==primary.id&&!blocked.has(p.id));
 const picked=[],types=new Set(),countries=new Set(),regions=new Set();
 while(picked.length<10&&remaining.length){
  remaining.sort((a,b)=>{
   const merit=p=>
     (p.country!==primary.country?4:0)+
     (p.infrastructureType!==primary.infrastructureType?4:0)+
     (p.region!==primary.region?2:0)+
     (!types.has(p.infrastructureType)?5:0)+
     (!countries.has(p.country)?4:0)+
     (!regions.has(p.region)?3:0);
   return merit(b)-merit(a)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
  });
  const p=remaining.shift();
  picked.push(p);types.add(p.infrastructureType);countries.add(p.country);regions.add(p.region);
 }
 return picked;
}
function differences(a,b){
 const list=[];
 if(a.country!==b.country)list.push('Different reported country');
 if(a.infrastructureType!==b.infrastructureType)list.push('Different infrastructure category');
 if(a.region!==b.region)list.push('Different world region');
 if(!list.length)list.push('Different published project record');
 return list;
}
const root=make('details','mpcr-contrast');root.id='mpcr-contrast';
const summary=make('summary','mpcr-summary','Explore 10 contrasting research projects');
summary.setAttribute('aria-controls','mpcr-path-grid');root.append(summary);
const panel=make('div','mpcr-body');
const intro=make('p','mpcr-intro',
 'Explore projects beyond the six most closely related references. Paths favor variety in reported countries, infrastructure categories and regions, using the published research catalogue.');
const metrics=make('div','mpcr-metrics');
const grid=make('div','mpcr-grid');grid.id='mpcr-path-grid';
const status=make('p','mpcr-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const caveatEl=make('p','mpcr-caveat',caveat);
const retry=make('button','mpcr-retry','Retry research connections');
retry.type='button';retry.hidden=true;retry.addEventListener('click',load);
panel.append(intro,metrics,grid,status,caveatEl,retry);
root.append(panel);
const host=main.querySelector('#mp-connect')||main.querySelector('.columns')||main.querySelector('.hero');
if(host)host.insertAdjacentElement('afterend',root);else main.append(root);
let primary=null,paths=[],ready=false,busy=false;
function render(){
 grid.replaceChildren();
 metrics.replaceChildren();
 const stats=[
  [paths.length,'Contrasting research paths'],
  [new Set(paths.map(p=>p.country)).size,'Countries in the paths'],
  [new Set(paths.map(p=>p.infrastructureType)).size,'Infrastructure categories'],
  [new Set(paths.map(p=>p.region)).size,'World regions']
 ];
 for(const [n,label] of stats){
  const stat=make('div','mpcr-stat');
  stat.append(make('strong','',n),make('span','',label));metrics.append(stat);
 }
 for(let i=0;i<paths.length;i++){
  const p=paths[i],row=make('article','mpcr-card');
  row.dataset.mpcrPath=p.id;
  row.append(make('small','mpcr-kicker','RESEARCH PATH '+String(i+1).padStart(2,'0')));
  const heading=make('h3','',p.name);
  row.append(heading);
  row.append(make('p','mpcr-facts',(p.country||'Country not stated')+' · '+(p.infrastructureType||'Category not stated')+' · '+(p.region||'Region not stated')));
  const tags=make('div','mpcr-tags');
  const differencesForPath=differences(primary,p);
  for(const text of differencesForPath)tags.append(make('span','mpcr-tag',text));
  row.append(tags);
  const sourceLabel=p.source?.name||'Source not stated';
  row.append(make('p','mpcr-source','Original report attribution: '+sourceLabel));
  const buttons=make('div','mpcr-actions');
  const dest=link('Read research passport',passport(p),'mpcr-primary');dest.dataset.mpcrOpen=p.id;
  dest.setAttribute('aria-label','Read research passport: '+p.name);
  const comp=link('Compare these two',compare(primary,p),'mpcr-link');comp.dataset.mpcrCompare=p.id;
  comp.setAttribute('aria-label','Compare '+primary.name+' with '+p.name);
  buttons.append(dest,comp);
  const uri=validSource(p);
  if(uri){
   const s=link('Original source ↗',uri,'mpcr-link');s.target='_blank';s.rel='noopener noreferrer';
   s.setAttribute('aria-label','Original source for '+p.name+' (opens in a new tab)');
   buttons.append(s);
  }
  row.append(buttons);grid.append(row);
 }
 status.textContent=paths.length+' distinct source-linked research paths available from '+primary.name+'.';
 root.dataset.mpcrReady='true';ready=true;
}
function load(){
 if(busy)return;
 busy=true;ready=false;primary=null;paths=[];
 root.dataset.mpcrReady='false';root.setAttribute('aria-busy','true');
 grid.replaceChildren();metrics.replaceChildren();retry.disabled=true;
 status.textContent='Loading other research records…';
 const controller=new AbortController();
 let timer;
 // Bound the entire response/JSON operation, even when an adapter ignores abort.
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{
  controller.abort();reject(Error('Research catalogue timed out'));
 },12000);});
 Promise.race([
  Promise.resolve().then(()=>fetch('/data/projects.json',{signal:controller.signal}))
   .then(r=>{if(!r.ok)throw Error('Research catalogue unavailable');return r.json();}),
  deadline
 ])
 .then(data=>{
  const records=data?.records;
  if(!Array.isArray(records)||records.length<50||
     records.some(p=>!p||typeof p.id!=='string'||!/^[a-z0-9-]+$/.test(p.id)||typeof p.name!=='string'||!p.name.trim()||
       ['country','region','infrastructureType'].some(key=>typeof p[key]!=='string'||!p[key].trim())||
       (p.source?.name!=null&&typeof p.source.name!=='string'))||
     new Set(records.map(p=>p.id)).size!==records.length)throw Error('Unexpected catalogue');
  primary=records.find(p=>p.id===primaryId);
  if(!primary)throw Error('Research record not found');
  paths=contrastPaths(records,primary);
  if(paths.length!==10)throw Error('Not enough other records for ten research paths');
  render();retry.hidden=true;
 }).catch(()=>{
  ready=false;primary=null;paths=[];grid.replaceChildren();metrics.replaceChildren();retry.hidden=false;
  root.dataset.mpcrReady='false';
  status.textContent='Contrasting research suggestions are unavailable. The original passport and existing related-project links remain usable.';
 }).finally(()=>{busy=false;retry.disabled=false;root.setAttribute('aria-busy','false');clearTimeout(timer);});
}
window.MicroportContrast=Object.freeze({
 getState:()=>({ready,loading:busy,projectId:primaryId,paths:paths.length}),
 getPaths:()=>paths.map(p=>({id:p.id,country:p.country,region:p.region,type:p.infrastructureType,reasons:differences(primary,p)})),
 getComparisonURL:targetId=>primary&&paths.some(p=>p.id===targetId)?compare(primary,paths.find(p=>p.id===targetId)):''
});
load();
})();