/* MicroportMap approximate location utilities: 50 projects x 10 factual, non-navigational actions. */
(()=>{
'use strict';
const route=location.pathname.match(/^\/projects\/([a-z0-9-]+)\/?$/);
if(!route||document.getElementById('mpl-location'))return;
const id=route[1],main=document.querySelector('main');
if(!main)return;
const E=(tag,cls,text)=>{
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(text!==undefined)el.textContent=String(text);
 return el;
};
const label='Approximate research reference — NOT an exact landing site, operating facility, public access point or flight authorization.';
const disclaimer='This source-linked point is indicative only. Do not use it for aviation navigation, route planning, site access or permission decisions.';
const pass='/projects/'+encodeURIComponent(id)+'/';
const action=(key,title,handler)=>{
 const button=E('button','mpl-action',title);button.type='button';
 button.dataset.mplAction=key;button.addEventListener('click',()=>{
  if(key!=='retry'&&(!ready||!point))return false;
  return handler();
 });return button;
};
const link=(key,title,target,external=false)=>{
 const a=E('a','mpl-action mpl-link',title);a.dataset.mplAction=key;a.href=target;
 if(external){a.target='_blank';a.rel='noopener noreferrer';}
 a.addEventListener('click',event=>{if(!ready||(external&&!point))event.preventDefault();});
 return a;
};
const escapeXML=value=>String(value).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'
}[c]));
function pointOf(record){
 const p=record?.approximateMapPoint;
 if(!p||typeof p.latitude!=='number'||typeof p.longitude!=='number'||
    !Number.isFinite(p.latitude)||!Number.isFinite(p.longitude)||
    Math.abs(p.latitude)>90||Math.abs(p.longitude)>180)return null;
 return {lat:p.latitude,lon:p.longitude};
}
const fmt=n=>Number(n).toFixed(5).replace(/0+$/,'').replace(/\.$/,'');
let record=null,point=null,ready=false,busy=false,actionRequest=0;
const container=E('details','mpl-location');container.id='mpl-location';
const summary=E('summary','mpl-summary','Explore approximate geographic context');
summary.setAttribute('aria-controls','mpl-content');
const body=E('div','mpl-content');body.id='mpl-content';
const headline=E('p','mpl-lead',label);
const details=E('div','mpl-facts');details.id='mpl-facts';
const controls=E('div','mpl-controls');controls.id='mpl-controls';
const message=E('p','mpl-message');message.id='mpl-message';
message.setAttribute('role','status');message.setAttribute('aria-live','polite');
const manual=E('div','mpl-manual');manual.hidden=true;
const manualInput=E('textarea','mpl-manual-text');manualInput.readOnly=true;manualInput.rows=5;
manualInput.setAttribute('aria-label','Select and copy approximate location context');
manual.append(E('p','','Clipboard unavailable. Copy this source-qualified text manually:'),manualInput);
const caveat=E('details','mpl-caveat');
caveat.append(E('summary','','What geographic precision can be assumed?'),
 E('p','',disclaimer));
const retry=action('retry','Retry geographic reference',load);retry.hidden=true;
body.append(headline,details,controls,message,manual,caveat,retry);
container.append(summary,body);
const host=main.querySelector('.columns')||main.querySelector('.hero');
if(host)host.insertAdjacentElement('afterend',container);else main.append(container);
function originalContext(){
 return 'MicroportMap research reference\nProject: '+record.name+
  '\nReported place: '+(record.where||'Unspecified')+
  '\nPrecision: '+(record.locationPrecision||'Unspecified')+
  '\nResearch passport: https://microportmap.com'+pass+'\n'+label+'\n'+disclaimer;
}
function coordContext(kind){
 if(!point)return originalContext()+'\nCoordinate: unavailable.';
 const value=kind==='latitude'?fmt(point.lat):kind==='longitude'?fmt(point.lon):fmt(point.lat)+', '+fmt(point.lon);
 const field=kind==='latitude'?'Approximate latitude':kind==='longitude'?'Approximate longitude':'Approximate latitude, longitude';
 return originalContext()+'\n'+field+': '+value;
}
function geoJSON(){
 if(!point)return '';
 return JSON.stringify({type:'FeatureCollection',
  name:'MicroportMap approximate research marker',features:[{
   type:'Feature',
   geometry:{type:'Point',coordinates:[point.lon,point.lat]},
   properties:{
    id:record.id,name:record.name,country:record.country,
    reportedPlace:record.where||'',locationPrecision:record.locationPrecision||'Unspecified',
    locationIsApproximate:true,notForNavigation:true,
    researchPassport:'https://microportmap.com'+pass,
    caution:disclaimer
   }
  }]},null,2);
}
function kml(){
 if(!point)return '';
 return '<?xml version="1.0" encoding="UTF-8"?>\n'+
  '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'+
  '<name>MicroportMap approximate research marker</name><description>'+
  escapeXML(disclaimer)+'</description><Placemark><name>'+escapeXML(record.name)+
  '</name><description>'+escapeXML(originalContext())+
  '</description><Point><coordinates>'+point.lon+','+point.lat+',0</coordinates></Point>'+
  '</Placemark></Document></kml>\n';
}
function mapURL(provider){
 if(!['osm','google'].includes(provider))return '';
 if(!point)return '#mpl-facts';
 if(provider==='osm'){
  const u=new URL('https://www.openstreetmap.org/');
  u.searchParams.set('mlat',String(point.lat));
  u.searchParams.set('mlon',String(point.lon));
  u.hash='map=9/'+point.lat+'/'+point.lon;
  return u.toString();
 }
 const u=new URL('https://www.google.com/maps/');
 u.searchParams.set('q',String(point.lat)+','+String(point.lon));
 u.searchParams.set('z','9');
 return u.toString();
}
async function copy(value,name){
 if(!ready||!point||!value)return false;
 const request=++actionRequest;
 manual.hidden=true;manualInput.value='';let timer;
 message.textContent='Copying '+name.toLowerCase()+' with approximation warning…';
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
  await Promise.race([
   navigator.clipboard.writeText(value),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Clipboard timed out')),800);})
  ]);
  if(request!==actionRequest)return false;
  message.textContent=name+' copied with approximation warning. Nothing was submitted.';
  return true;
 }catch{
  if(request!==actionRequest)return false;
  manual.hidden=false;manualInput.value=value;
  manualInput.focus({preventScroll:true});manualInput.select();
  message.textContent='Automatic copying unavailable. '+name+' is prepared for manual copying.';
  return false;
 }finally{if(timer)clearTimeout(timer);}
}
function download(content,filename,type){
 if(!ready||!point||!content)return false;
 actionRequest++;manual.hidden=true;manualInput.value='';
 let object,anchor;
 try{
  object=URL.createObjectURL(new Blob([content],{type}));
  anchor=E('a');anchor.href=object;anchor.download=filename;
  document.body.append(anchor);anchor.click();
  message.textContent='Requested '+filename+' containing an explicitly approximate marker.';
  return true;
 }catch{
  manual.hidden=false;manualInput.value=content;manualInput.focus({preventScroll:true});manualInput.select();
  message.textContent='Download unavailable. '+filename+' is prepared for manual copying.';
  return false;
 }
 finally{anchor?.remove();if(object)setTimeout(()=>URL.revokeObjectURL(object),30000);}
}
function facts(){
 details.replaceChildren();
 for(const [name,value] of [
  ['Reported place',record.where||'Not recorded'],
  ['Location precision',record.locationPrecision||'Not recorded'],
  ['Approximate latitude',point?fmt(point.lat):'Not recorded'],
  ['Approximate longitude',point?fmt(point.lon):'Not recorded']
 ]){
  const row=E('div','mpl-fact');
  row.append(E('small','',name),E('strong','',value));details.append(row);
 }
}
function draw(){
 facts();controls.replaceChildren();
 const items=[
  action('latitude','Copy approximate latitude',()=>copy(coordContext('latitude'),'Approximate latitude')),
  action('longitude','Copy approximate longitude',()=>copy(coordContext('longitude'),'Approximate longitude')),
  action('coordinates','Copy coordinate pair with warning',()=>copy(coordContext('pair'),'Approximate coordinates')),
  action('geojson-copy','Copy GeoJSON point',()=>copy(geoJSON(),'Approximate GeoJSON')),
  action('geojson-download','Download GeoJSON',()=>download(geoJSON(),'microportmap-'+id+'-approximate.geojson','application/geo+json;charset=utf-8')),
  action('kml-download','Download KML',()=>download(kml(),'microportmap-'+id+'-approximate.kml','application/vnd.google-earth.kml+xml;charset=utf-8')),
  link('osm','View approximate area in OpenStreetMap ↗',mapURL('osm'),true),
  link('google','View approximate area in Google Maps ↗',mapURL('google'),true),
  link('atlas','View research point in atlas','/?project='+encodeURIComponent(id)+'#atlas'),
  link('directory','Find more research in '+(record.country||'country'),'/directory/?'+new URLSearchParams({country:record.country||''}))
 ];
 if(!point)for(let i=0;i<8;i++){
  if(items[i].tagName==='BUTTON')items[i].disabled=true;
  else{items[i].setAttribute('aria-disabled','true');items[i].addEventListener('click',e=>e.preventDefault());}
 }
 controls.append(...items);
 ready=true;container.dataset.mplReady='true';
 message.textContent=point?'Ten project-specific location tools available. All coordinates are approximate.':
   'Coordinates unavailable; atlas and directory research links are still available.';
}
function load(){
 if(busy)return;busy=true;ready=false;record=null;point=null;actionRequest++;
 container.dataset.mplReady='false';container.setAttribute('aria-busy','true');
 controls.replaceChildren();details.replaceChildren();manual.hidden=true;manualInput.value='';
 retry.hidden=true;retry.disabled=true;message.textContent='Loading original research coordinates…';
 const controller=new AbortController();let timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Location lookup timed out'));},12000);});
 Promise.race([deadline,(async()=>{
  const response=await fetch('/data/projects.json',{signal:controller.signal});
  if(!response.ok)throw Error('Catalogue unavailable');return response.json();
 })()]).then(data=>{
  const records=data?.records;
  if(!Array.isArray(records)||records.length<50||
    records.some(p=>!p||typeof p.id!=='string'||!/^[a-z0-9-]+$/.test(p.id)||typeof p.name!=='string'||!p.name.trim())||
    new Set(records.map(p=>p.id)).size!==records.length)throw Error('Invalid catalogue');
  record=records.find(p=>p.id===id);
  if(!record)throw Error('Project unavailable');
  point=pointOf(record);draw();
 }).catch(()=>{
  ready=false;record=null;point=null;controls.replaceChildren();details.replaceChildren();message.textContent='Approximate location tools are unavailable. The original passport remains readable.';
  retry.hidden=false;container.dataset.mplReady='false';
 }).finally(()=>{busy=false;retry.disabled=false;container.setAttribute('aria-busy','false');clearTimeout(timer);});
}
window.MicroportLocation=Object.freeze({
 getState:()=>({ready,loading:busy,projectId:id,actions:ready?controls.children.length:0,approximate:ready&&!!point}),
 getActionIds:()=>[...controls.children].map(el=>el.dataset.mplAction),
 getCoordinateText:kind=>ready?coordContext(kind):'',
 getGeoJSON:()=>ready?geoJSON():'',
 getKML:()=>ready?kml():'',
 getMapURL:provider=>ready?mapURL(provider):'',
 getPrecision:()=>record?.locationPrecision||''
});
load();
})();