(async()=>{
 const output=document.getElementById('v1-browser-result'),assert=(ok,msg)=>{if(!ok)throw Error(msg)};
 try{
  await new Promise(resolve=>{if(document.readyState==='complete')resolve();else window.addEventListener('load',resolve,{once:true})});
  await new Promise(r=>setTimeout(r,1400));
  assert(document.querySelectorAll('h1').length===1,'Exactly one primary heading');
  assert(document.documentElement.lang==='en','Document language');assert(document.querySelector('main'),'Main landmark');
  assert(document.querySelector('meta[name=viewport]')?.content.includes('width=device-width'),'Responsive viewport');
  assert(document.querySelector('link[rel=canonical]')?.href==='https://microportmap.com'+location.pathname,'Canonical route');
  assert(document.documentElement.scrollWidth<=innerWidth+2,'Page-level horizontal overflow: '+document.documentElement.scrollWidth+' / '+innerWidth);
  for(const n of [...document.querySelectorAll('button')].filter(n=>n.getClientRects().length&&!n.hidden))assert((n.getAttribute('aria-label')||n.textContent||n.title||'').trim(),'Visible button without an accessible name');
  for(const n of [...document.querySelectorAll('input,select,textarea')].filter(n=>n.getClientRects().length&&n.type!=='hidden'))assert(n.getAttribute('aria-label')||n.getAttribute('aria-labelledby')||n.labels?.length,'Visible field without a label: '+n.id);
  if(location.pathname==='/privacy/'||location.pathname==='/cookies/'){
   const text=document.querySelector('main').textContent;assert(text.includes('unpkg')&&text.includes('Detailed geography'),'Current map-loading disclosure');
   assert(text.includes('microportmap.review-workspace.v1'),'Current local storage disclosure');
  }
  if(location.pathname==='/submit/')assert(document.querySelector('main').textContent.includes('does not automatically transmit'),'Local-only correction scope');
  const links=[...document.querySelectorAll('#mp-bottom-navigation a')];assert(links.length===5,'Shared primary navigation');
  output.textContent='PASS: '+location.pathname+' responsive layout, landmarks, labels, canonical and scope disclosures';
 }catch(e){output.textContent='FAIL: '+e.message;}
})();
