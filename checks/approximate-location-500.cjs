/* 50 original approximate markers x ten working utility actions. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('checks/approximate-location-500-ledger.json','utf8'));
const source=fs.readFileSync('src/approximate-location-tools.js','utf8');
const keys=ledger.actions.map(x=>x.id);
class El{
 constructor(t='div'){this.tagName=t.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.events={};this.style={};this.hidden=false;this.disabled=false;this._text='';}
 set className(x){this._class=x;}get className(){return this._class||'';}
 set textContent(x){this._text=String(x);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent||'').join('');}
 append(...nodes){this.children.push(...nodes.filter(Boolean));}
 appendChild(node){this.append(node);return node;}
 insertAdjacentElement(where,node){this.append(node);return node;}
 replaceChildren(...nodes){this._text='';this.children=[];this.append(...nodes);}
 addEventListener(key,cb){this.events[key]=cb;}
 setAttribute(key,v){this.attrs[key]=String(v);}
 click(){return this.events.click?.();}
 focus(){}select(){}remove(){}
}
const results=[];
async function one(record){
 const host=new El,main=new El,body=new El;
 main.querySelector=what=>what==='.columns'?host:null;
 const doc={getElementById:()=>null,querySelector:s=>s==='main'?main:null,createElement:t=>new El(t),body};
 const copies=[],blobs=[];
 class U extends URL{}
 U.createObjectURL=blob=>{blobs.push(blob);return 'blob:test';};U.revokeObjectURL=()=>{};
 const ctx={document:doc,location:{pathname:'/projects/'+record.id+'/',origin:'https://microportmap.com'},
  URL:U,URLSearchParams,Blob,AbortController,
  navigator:{clipboard:{writeText:async s=>copies.push(s)}},
  window:{},setTimeout:()=>1,clearTimeout:()=>{},
  fetch:async()=>({ok:true,json:async()=>data})};
 vm.runInNewContext(source,ctx,{filename:'src/approximate-location-tools.js'});
 for(let i=0;i<14&&!ctx.window.MicroportLocation?.getState().ready;i++)await new Promise(done=>setImmediate(done));
 const api=ctx.window.MicroportLocation;
 assert.equal(api?.getState().ready,true,'not ready '+record.id);
 assert.equal(api.getState().approximate,true);
 assert.equal(api.getState().actions,10);
 assert.deepEqual([...api.getActionIds()],keys);
 const root=host.children.find(x=>x.id==='mpl-location');
 assert.ok(root&&root.tagName==='DETAILS',record.id+' inspector not collapsible');
 assert.equal(root.dataset.mplReady,'true');
 const content=root.children.find(x=>x.id==='mpl-content');
 const actions=content.children.find(x=>x.id==='mpl-controls');
 assert.equal(actions.children.length,10);
 const geo=JSON.parse(api.getGeoJSON());
 assert.deepEqual([...geo.features[0].geometry.coordinates],[record.approximateMapPoint.longitude,record.approximateMapPoint.latitude]);
 assert.equal(geo.features[0].properties.notForNavigation,true);
 assert.equal(geo.features[0].properties.locationIsApproximate,true);
 assert.equal(geo.features[0].properties.locationPrecision,record.locationPrecision);
 assert.ok(api.getKML().includes(record.approximateMapPoint.longitude+','+record.approximateMapPoint.latitude+',0'));
 assert.ok(api.getMapURL('osm').startsWith('https://www.openstreetmap.org/'));
 assert.ok(api.getMapURL('google').startsWith('https://www.google.com/maps/'));
 for(let i=0;i<keys.length;i++){
  const key=keys[i],el=actions.children[i],priorCopy=copies.length,priorBlob=blobs.length;
  assert.equal(el.dataset.mplAction,key);
  if(i<=3){
   await el.click();
   assert.equal(copies.length,priorCopy+1,key+' missing copy');
   assert.ok(copies.at(-1).includes(record.name)||key==='geojson-copy');
   if(key!=='geojson-copy')assert.ok(copies.at(-1).includes('NOT an exact landing'));
  }else if(i<=5){
   el.click();assert.equal(blobs.length,priorBlob+1,key+' did not download');
   const text=await blobs.at(-1).text();
   assert.ok(text.includes(record.name));
   if(key==='geojson-download')assert.deepEqual(JSON.parse(text).features[0].geometry.coordinates,[record.approximateMapPoint.longitude,record.approximateMapPoint.latitude]);
   else assert.ok(text.includes('<kml xmlns='));
  }else if(i===6){
   const u=new URL(el.href);
   assert.equal(u.host,'www.openstreetmap.org');
   assert.equal(u.searchParams.get('mlat'),String(record.approximateMapPoint.latitude));
   assert.equal(el.rel,'noopener noreferrer');
  }else if(i===7){
   const u=new URL(el.href);
   assert.equal(u.host,'www.google.com');
   assert.equal(u.searchParams.get('q'),record.approximateMapPoint.latitude+','+record.approximateMapPoint.longitude);
   assert.equal(el.rel,'noopener noreferrer');
  }else if(i===8){assert.equal(el.href,'/?project='+record.id+'#atlas');}
  else{assert.equal(new URLSearchParams(el.href.split('?')[1]).get('country'),record.country);}
  results.push({id:'L'+String(results.length+1).padStart(3,'0'),projectId:record.id,actionId:key,passed:true});
 }
}
(async()=>{
 for(const p of data.records)await one(p);
 assert.equal(results.length,500);
 assert.deepEqual(results.map(x=>x.id),ledger.tasks.map(x=>x.id));
 assert.deepEqual(results.map(x=>x.projectId),ledger.tasks.map(x=>x.projectId));
 assert.deepEqual(results.map(x=>x.actionId),ledger.tasks.map(x=>x.actionId));
 fs.writeFileSync('checks/approximate-location-500-results.json',JSON.stringify({total:500,passed:500,failed:0,note:'Simulated DOM/browser action checks; all points are approximate and non-navigational',cases:results},null,2)+'\n');
 console.log('PASS: 500/500 project-specific approximate geo utilities including coordinate order, warning and map links');
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
