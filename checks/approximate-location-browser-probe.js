(()=>{
window.addEventListener('load',async()=>{
 const output=document.getElementById('mpl-test');
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const check=(ok,msg)=>{if(!ok)throw Error(msg);};
 try{
  for(let i=0;i<160&&!window.MicroportLocation?.getState().ready;i++)await delay(40);
  const api=window.MicroportLocation,state=api?.getState();
  check(state?.ready,'module unavailable');check(state.actions===10,'ten actions missing');
  check(state.approximate,'point should be explicitly approximate');
  const root=document.getElementById('mpl-location');
  check(root?.tagName==='DETAILS','collapse panel missing');
  check(!root.open,'panel must be collapsed by default');
  root.open=true;
  const controls=[...root.querySelectorAll('#mpl-controls [data-mpl-action]')];
  check(controls.length===10,'ten action controls missing');
  check(root.querySelectorAll('.mpl-fact').length===4,'four research facts missing');
  const geo=JSON.parse(api.getGeoJSON());
  check(geo.features[0].properties.notForNavigation===true,'navigational caveat missing');
  const coords=geo.features[0].geometry.coordinates;
  check(coords.length===2&&typeof coords[0]==='number','GeoJSON source point invalid');
  check(api.getKML().includes('<kml xmlns='),'KML export invalid');
  check(api.getMapURL('osm').includes('openstreetmap.org'),'OSM context absent');
  check(api.getMapURL('google').includes('google.com/maps'),'Google context absent');
  const mapLinks=controls.filter(e=>e.target==='_blank');
  check(mapLinks.length===2&&mapLinks.every(e=>e.rel==='noopener noreferrer'),'external map link security incorrect');
  check(controls[8].href.includes('#atlas'),'atlas link missing');
  check(controls[9].href.includes('/directory/?'),'country directory link missing');
  if(new URLSearchParams(location.search).has('snapshot')){
   window.scrollTo(0,0);
   output.textContent='PASS: location panel expanded with ten safe actions for capture';
   return;
  }
  controls[2].click();await delay(1100);
  check(root.querySelector('#mpl-message').textContent.toLowerCase().includes('approximate'),'copy action did not resolve with warning');
  check(api.getCoordinateText('pair').includes('NOT an exact landing site'),'coordinate copy lost warning');
  const manual=root.querySelector('.mpl-manual'),text=root.querySelector('.mpl-manual-text'),message=root.querySelector('#mpl-message');
  const clipboardDescriptor=Object.getOwnPropertyDescriptor(navigator,'clipboard');
  const create=URL.createObjectURL,originalFetch=window.fetch;
  const clipboard=value=>Object.defineProperty(navigator,'clipboard',{configurable:true,value});
  try{
   URL.createObjectURL=()=>{throw Error('Test download failure');};
   controls[4].click();
   check(!manual.hidden&&text.value===api.getGeoJSON(),'failed GeoJSON download lost requested content');
   controls[5].click();
   check(!manual.hidden&&text.value===api.getKML(),'failed KML download offered the wrong format');
   check(document.activeElement===text&&text.selectionEnd===text.value.length,'download fallback not focused/selected');
   let finish;
   clipboard({writeText:()=>new Promise(resolve=>{finish=resolve;})});
   controls[0].click();
   // DOM click returns void; completion is checked through the result UI after settling.
   clipboard({writeText:async()=>{throw Error('Latest denied');}});
   controls[1].click();await delay(30);
   const latest=message.textContent,latestText=text.value;
   finish();await delay(30);
   check(message.textContent===latest&&text.value===latestText,'older copy replaced newer manual fallback');
   let reject;
   clipboard({writeText:()=>new Promise((_,fail)=>{reject=fail;})});
   controls[0].click();controls[5].click();const fileStatus=message.textContent;
   reject(Error('Late clipboard failure'));await delay(30);
   check(message.textContent===fileStatus&&text.value===api.getKML(),'older copy replaced download failure content');
   const retry=root.querySelector('[data-mpl-action="retry"]');
   window.fetch=(...args)=>String(args[0])==='/data/projects.json'?Promise.resolve({ok:false}):originalFetch.apply(window,args);
   retry.click();check(!api.getState().ready&&!api.getState().approximate,'reload retained ready/point state');
   controls[0].click();
   for(let i=0;i<100&&api.getState().loading;i++)await delay(20);
   check(!api.getState().ready&&root.querySelector('#mpl-controls').children.length===0,'failed reload retained old location controls');
   check(api.getPrecision()===''&&api.getKML()===''&&api.getGeoJSON()==='','failed reload retained geographic exports');
   check(!retry.hidden&&!retry.disabled,'geographic retry inaccessible after failure');
   window.fetch=originalFetch;retry.click();
   for(let i=0;i<150&&api.getState().loading;i++)await delay(20);
   check(api.getState().ready&&api.getState().actions===10,'geographic retry did not recover');
   check(root.getAttribute('aria-busy')==='false','geographic loading indicator not cleared');
  }finally{
   URL.createObjectURL=create;window.fetch=originalFetch;
   if(clipboardDescriptor)Object.defineProperty(navigator,'clipboard',clipboardDescriptor);else delete navigator.clipboard;
  }
  output.textContent='PASS: exact GeoJSON/KML fallback, focus/selection, superseded copy isolation and failed-load/retry recovery';
 }catch(err){output.textContent='FAIL: '+err.message;}
});
})();