/* 50 genuine passports × ten geographic boundary and recovery scenarios. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const catalog=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const source=fs.readFileSync('src/approximate-location-tools.js','utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.events={};this.hidden=false;this.disabled=false;this.open=false;this.value='';this.focuses=0;this.selections=0;this._text='';}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 append(...nodes){for(const n of nodes){this.children.push(n);n.parentNode=this;}}
 replaceChildren(...nodes){this.children.forEach(n=>n.parentNode=null);this.children=[];this._text='';this.append(...nodes);}
 insertAdjacentElement(_,n){this.append(n);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
 click(event={preventDefault:()=>{}}){if(this.disabled)return false;let value;for(const fn of this.events.click||[])value=fn(event);return value;}
 focus(){this.focuses++;}select(){this.selections++;}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);this.parentNode=null;}
}
async function fixture(p,change){
 const data=JSON.parse(JSON.stringify(catalog));if(change)change(data.records.find(r=>r.id===p.id));
 const main=new El('main'),host=new El(),body=new El('body'),timers=new Map();let timerId=0,urlId=0;
 const f={data,urls:new Map(),revoked:[],write:async()=>{},fetch:async()=>({ok:true,json:async()=>data}),failCreate:false,failAnchor:false};
 main.querySelector=s=>s==='.columns'?host:null;
 const document={body,getElementById:()=>null,querySelector:s=>s==='main'?main:null,createElement:t=>{const n=new El(t);if(t==='a'){const click=n.click.bind(n);n.click=(...args)=>{if(f.failAnchor&&n.download)throw Error('Download blocked');return click(...args);};}return n;}};
 class U extends URL{}
 U.createObjectURL=blob=>{if(f.failCreate)throw Error('Blob blocked');const url='blob:test-'+(++urlId);f.urls.set(url,blob);return url;};
 U.revokeObjectURL=url=>{f.revoked.push(url);f.urls.delete(url);};
 f.clipboard={writeText:value=>f.write(value)};f.navigator={clipboard:f.clipboard};
 const context={document,location:{pathname:'/projects/'+p.id+'/'},URL:U,URLSearchParams,Blob,AbortController,navigator:f.navigator,window:{},
  setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),fetch:(...args)=>f.fetch(...args)};
 vm.runInNewContext(source,context);f.api=context.window.MicroportLocation;
 f.settle=async()=>{for(let n=0;n<4;n++)await tick();};await f.settle();
 f.root=host.children.find(n=>n.id==='mpl-location');
 [f.headline,f.facts,f.controls,f.message,f.manual,f.caveat,f.retry]=f.root.children[1].children;
 f.text=f.manual.children[1];f.body=body;f.timers=timers;
 f.action=key=>f.controls.children.find(n=>n.dataset.mplAction===key);
 f.expire=ms=>{for(const [id,timer] of [...timers])if(timer.ms===ms){timers.delete(id);timer.fn();}};
 assert.equal(f.api.getState().ready,true);assert.equal(f.api.getState().projectId,p.id);assert.equal(f.root.open,false);
 return f;
}
function noPoint(f,p){
 assert.equal(f.api.getState().approximate,false);assert.equal(f.controls.children.length,10);
 for(const item of f.controls.children.slice(0,8)){
  if(item.tagName==='BUTTON'){assert.equal(item.disabled,true);assert.equal(item.click(),false);}
  else{assert.equal(item.attrs['aria-disabled'],'true');let prevented=false;item.click({preventDefault:()=>{prevented=true;}});assert.equal(prevented,true);}
 }
 assert.equal(f.api.getGeoJSON(),'');assert.equal(f.api.getKML(),'');assert.match(f.api.getCoordinateText('pair'),/Coordinate: unavailable/);
 assert.equal(f.action('atlas').href,'/?project='+p.id+'#atlas');assert.equal(new URLSearchParams(f.action('directory').href.split('?')[1]).get('country'),p.country);
}
const scenarios={
 'zero-and-coordinate-limits':async p=>{for(const [lat,lon] of [[0,0],[90,180],[-90,-180]]){
  const f=await fixture(p,r=>{r.approximateMapPoint={latitude:lat,longitude:lon};});
  assert.equal(f.api.getState().approximate,true);assert.deepEqual(JSON.parse(f.api.getGeoJSON()).features[0].geometry.coordinates,[lon,lat]);
  assert.ok(f.api.getKML().includes(lon+','+lat+',0'));assert.equal(new URL(f.api.getMapURL('osm')).searchParams.get('mlat'),String(lat));assert.equal(f.api.getMapURL('unknown'),'');
 }},
 'invalid-latitudes-disable-geographic-actions':async p=>{for(const value of [91,-91,NaN,Infinity,'0',null])noPoint(await fixture(p,r=>{r.approximateMapPoint.latitude=value;}),p);},
 'invalid-longitudes-disable-geographic-actions':async p=>{for(const value of [181,-181,NaN,-Infinity,'0',undefined])noPoint(await fixture(p,r=>{r.approximateMapPoint.longitude=value;}),p);},
 'clipboard-unavailable-and-timeout':async p=>{
  const f=await fixture(p),expected=f.api.getCoordinateText('pair');f.navigator.clipboard=undefined;
  assert.equal(await f.action('coordinates').click(),false);assert.equal(f.text.value,expected);assert.equal(f.manual.hidden,false);assert.equal(f.text.focuses,1);assert.equal(f.text.selections,1);assert.match(expected,/NOT an exact landing site/);
  f.navigator.clipboard=f.clipboard;f.write=()=>new Promise(()=>{});const pending=f.action('coordinates').click();assert.equal(f.text.value,'');f.expire(800);assert.equal(await pending,false);assert.equal(f.text.value,expected);assert.equal(f.timers.size,0);
 },
 'competing-copy-feedback':async p=>{
  const f=await fixture(p);let finish;f.write=()=>new Promise(resolve=>{finish=resolve;});const first=f.action('latitude').click();
  f.write=async()=>{throw Error('Denied');};await f.action('longitude').click();const latest=f.message.textContent,text=f.text.value,focus=f.text.focuses;
  finish();assert.equal(await first,false);assert.equal(f.message.textContent,latest);assert.equal(f.text.value,text);assert.equal(f.text.focuses,focus);
  let reject;f.write=()=>new Promise((_,fail)=>{reject=fail;});const old=f.action('latitude').click();f.write=async()=>{};await f.action('coordinates').click();const success=f.message.textContent;
  reject(Error('Older rejected'));assert.equal(await old,false);assert.equal(f.message.textContent,success);assert.equal(f.manual.hidden,true);assert.equal(f.text.value,'');
 },
 'geojson-download-failure-preserves-file':async p=>{
  const f=await fixture(p);f.failCreate=true;assert.equal(f.action('geojson-download').click(),false);assert.equal(f.manual.hidden,false);assert.equal(f.text.value,f.api.getGeoJSON());
  assert.equal(JSON.parse(f.text.value).features[0].properties.notForNavigation,true);assert.ok(f.message.textContent.includes(p.id+'-approximate.geojson'));assert.equal(f.text.selections,1);assert.equal(f.body.children.length,0);
 },
 'kml-download-failure-preserves-file':async p=>{
  const f=await fixture(p);f.failCreate=true;assert.equal(f.action('kml-download').click(),false);assert.equal(f.text.value,f.api.getKML());assert.equal(f.manual.hidden,false);
  assert.match(f.text.value,/<kml xmlns=/);assert.ok(f.message.textContent.includes(p.id+'-approximate.kml'));assert.equal(f.text.focuses,1);
 },
 'download-resource-cleanup':async p=>{
  const f=await fixture(p);for(const key of ['geojson-download','kml-download']){
   assert.equal(f.action(key).click(),true);assert.equal(f.body.children.length,0);assert.equal(f.urls.size,1);
   const blob=[...f.urls.values()][0];assert.ok((await blob.text()).includes(p.name));f.expire(30000);assert.equal(f.urls.size,0);
  }
  f.failAnchor=true;assert.equal(f.action('kml-download').click(),false);assert.equal(f.body.children.length,0);assert.equal(f.text.value,f.api.getKML());f.expire(30000);assert.equal(f.urls.size,0);assert.equal(f.revoked.length,3);
 },
 'download-supersedes-pending-copy':async p=>{
  const f=await fixture(p);let reject;f.write=()=>new Promise((_,fail)=>{reject=fail;});const pending=f.action('latitude').click();
  assert.equal(f.action('geojson-download').click(),true);const downloadStatus=f.message.textContent;reject(Error('Late clipboard error'));assert.equal(await pending,false);
  assert.equal(f.message.textContent,downloadStatus);assert.equal(f.manual.hidden,true);assert.equal(f.text.focuses,0);f.expire(30000);assert.equal(f.urls.size,0);
 },
 'failed-reload-clears-geographic-state':async p=>{
  const f=await fixture(p),oldCopy=f.action('coordinates'),oldMap=f.action('osm');let finish;
  f.write=()=>new Promise(resolve=>{finish=resolve;});const pending=oldCopy.click();f.fetch=async()=>({ok:false});f.retry.click();
  assert.equal(f.api.getState().ready,false);assert.equal(f.api.getState().approximate,false);assert.equal(oldCopy.click(),false);
  let prevented=false;oldMap.click({preventDefault:()=>{prevented=true;}});assert.equal(prevented,true);
  await f.settle();assert.equal(f.controls.children.length,0);assert.equal(f.facts.children.length,0);assert.equal(f.api.getPrecision(),'');assert.equal(f.api.getGeoJSON(),'');assert.equal(f.api.getMapURL('osm'),'');
  const status=f.message.textContent;finish();assert.equal(await pending,false);assert.equal(f.message.textContent,status);assert.equal(f.retry.hidden,false);assert.equal(f.root.attrs['aria-busy'],'false');
  f.fetch=async()=>({ok:true,json:async()=>f.data});f.retry.click();await f.settle();assert.equal(f.api.getState().ready,true);assert.equal(f.api.getState().actions,10);assert.equal(f.api.getPrecision(),p.locationPrecision);assert.equal(f.timers.size,0);
 }
};
(async()=>{
 assert.equal(catalog.records.length,50);const cases=[];
 for(const p of catalog.records)for(const [scenario,run] of Object.entries(scenarios)){
  await run(p);cases.push({taskId:'LR'+String(cases.length+1).padStart(3,'0'),projectId:p.id,route:'/projects/'+p.id+'/',scenario,passed:true});
 }
 assert.equal(cases.length,500);
 fs.writeFileSync('checks/location-reliability-500-results.json',JSON.stringify({total:500,passed:500,failed:0,scope:'Controlled DOM/VM geographic boundary, UI and file-resource checks; real-browser checks run separately. No independently verified landing locations or native clipboard ordering claims.',cases},null,2)+'\n');
 console.log('PASS: 500 geographic boundary, export, clipboard and reload scenarios');
})().catch(e=>{console.error(e);process.exitCode=1;});
