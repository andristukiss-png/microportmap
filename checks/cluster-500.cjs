'use strict';
// Synthetic coordinate fixtures; real atlas script, controlled DOM and Leaflet doubles.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const records=JSON.parse(fs.readFileSync('src/data/projects.json')).records;
const source=fs.readFileSync('checks/atlas.cjs','utf8'),moduleShim={exports:{}};
vm.runInNewContext(source.slice(0,source.indexOf('(async()=>{'))+'\nmodule.exports={setup}',{require,module:moduleShim,console,URL,URLSearchParams,AbortController,setImmediate});
const setup=moduleShim.exports.setup,ledger=[];
async function fixture(p,other,{zoom=1,detailed=false,same=false,motion=false,alone=false}={}){
 const point=p.approximateMapPoint;
 const data={records:[p,...(alone?[]:[{...other,approximateMapPoint:{latitude:same?point.latitude:point.latitude+(point.latitude>80?-.01:.01),longitude:point.longitude}}])]};
 const x=await setup('',{data}),markers=[],calls=[];
 x.context.window.matchMedia=()=>({matches:!motion});
 if(detailed)x.f['mp-geography-detail']={checked:true};
 const map={getZoom:()=>zoom,removeLayer(){},getMaxZoom:()=>19,latLngToLayerPoint:()=>({x:0,y:0}),fitBounds(bounds,options){calls.push({bounds,options})},flyTo(point,target,options){calls.push({point,target,options})}};
 x.context.L={divIcon:v=>v,latLngBounds(points){const lat=points.map(p=>p[0]),lng=points.map(p=>p[1]);return {points,getNorth:()=>Math.max(...lat),getSouth:()=>Math.min(...lat),getEast:()=>Math.max(...lng),getWest:()=>Math.min(...lng),pad(){return this}}},marker(point,options){const m={point,options,events:{},popup:null,opened:false,bindTooltip(){return this},on(k,fn){this.events[k]=fn;return this},addTo(){return this},getElement(){return null},bindPopup(html,options){this.popup={html,options};return this},openPopup(){this.opened=true;return this}};markers.push(m);return m}};
 x.context.window.__atlasTest.setMap(map);x.context.window.__atlasTest.renderPins();return {x,markers,calls};
}
async function task(p,label,fn){try{await fn();ledger.push({project:p.id,behavior:label,passed:true})}catch(e){ledger.push({project:p.id,behavior:label,passed:false,error:e.message})}}
(async()=>{
 for(let i=0;i<records.length;i++){
  const p=records[i],other=records[(i+1)%records.length];
  await task(p,'Offline cluster expansion caps zoom at 3',async()=>{const f=await fixture(p,other,{});f.markers[0].events.click();assert.equal(f.calls[0].options.maxZoom,3)});
  await task(p,'Offline cluster at cap opens project chooser',async()=>{const f=await fixture(p,other,{zoom:3});f.markers[0].events.click();assert.equal(f.calls.length,0);assert(f.markers[0].opened);for(const r of [p,other])assert(f.markers[0].popup.html.includes('/projects/'+r.id+'/'))});
  await task(p,'Offline stale close-up opens chooser without extra zoom',async()=>{const f=await fixture(p,other,{zoom:8});f.markers[0].events.click();assert.equal(f.calls.length,0);assert(f.markers[0].opened)});
  await task(p,'Detailed cluster expansion keeps three-level step',async()=>{const f=await fixture(p,other,{zoom:2,detailed:true});f.markers[0].events.click();assert.equal(f.calls[0].options.maxZoom,5)});
  await task(p,'Detailed cluster expansion caps at zoom 10',async()=>{const f=await fixture(p,other,{zoom:8,detailed:true});f.markers[0].events.click();assert.equal(f.calls[0].options.maxZoom,10)});
  await task(p,'Reduced motion disables cluster fly animation',async()=>{const f=await fixture(p,other,{detailed:true});f.markers[0].events.click();assert.equal(f.calls[0].options.animate,false)});
  await task(p,'Normal motion allows cluster animation',async()=>{const f=await fixture(p,other,{detailed:true,motion:true});f.markers[0].events.click();assert.equal(f.calls[0].options.animate,true)});
  await task(p,'Coincident offline points open chooser without zoom',async()=>{const f=await fixture(p,other,{same:true});f.markers[0].events.click();assert.equal(f.calls.length,0);assert(f.markers[0].opened);assert(f.markers[0].popup.html.includes('2 reported projects'))});
  await task(p,'Coincident detailed points preserve both passport links',async()=>{const f=await fixture(p,other,{same:true,detailed:true});f.markers[0].events.click();assert.equal(f.calls.length,0);for(const r of [p,other])assert(f.markers[0].popup.html.includes('/projects/'+r.id+'/'))});
  await task(p,'Single marker still opens correct project drawer',async()=>{const f=await fixture(p,other,{alone:true});assert.equal(f.markers.length,1);assert(f.markers[0].options.keyboard);f.markers[0].events.click();assert(!f.x.f.detail.hidden);assert(f.x.f['detail-content'].innerHTML.includes('/submit/?project='+p.id));assert.equal(f.calls[0].target,3)});
 }
 const results={batch:'cluster-500',total:ledger.length,passed:ledger.filter(x=>x.passed).length,failed:ledger.filter(x=>!x.passed).length,mode:'Local controlled DOM/VM and Leaflet doubles. Synthetic second-point placement, no real tile requests or mobile visuals.',checks:ledger};
 fs.writeFileSync('checks/cluster-500-results.json',JSON.stringify(results,null,2)+'\n');
 fs.writeFileSync('checks/cluster-500-ledger.json',JSON.stringify(ledger.map(x=>[x.project,x.behavior,x.passed?'PASS':'FAIL']),null,2)+'\n');
 console.log(JSON.stringify({total:results.total,passed:results.passed,failed:results.failed,failureTypes:[...new Set(ledger.filter(x=>!x.passed).map(x=>x.behavior))]},null,2));assert.equal(results.total,500);if(results.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
