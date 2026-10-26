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
  output.textContent='PASS: ten real actions, safe links, GeoJSON/KML, reported precision, warning and clipboard fallback';
 }catch(err){output.textContent='FAIL: '+err.message;}
});
})();