(()=>{
window.addEventListener('load',async()=>{
 const out=document.getElementById('mpcr-probe');
 const pause=ms=>new Promise(r=>setTimeout(r,ms));
 const ok=(v,m)=>{if(!v)throw Error(m);};
 try{
  for(let i=0;i<160&&!window.MicroportContrast?.getState().ready;i++)await pause(40);
  const app=window.MicroportContrast,s=app?.getState();
  ok(s?.ready,'contrast catalogue not ready');
  ok(s.paths===10,'not ten alternative research projects');
  const root=document.getElementById('mpcr-contrast');
  ok(root?.tagName==='DETAILS','compact contrasting research panel not a disclosure');
  ok(!root.open,'panel should be collapsed by default');
  root.open=true;
  const cards=[...root.querySelectorAll('[data-mpcr-path]')];
  ok(cards.length===10,'not ten research paths');
  ok(new Set(cards.map(c=>c.dataset.mpcrPath)).size===10,'duplicate project links');
  ok(cards.every(c=>c.dataset.mpcrPath!==s.projectId),'source project in destination list');
  ok(root.querySelectorAll('.mpcr-stat').length===4,'coverage summary counts missing');
  const current=app.getPaths();
  ok(current.length===10,'public path metadata missing');
  ok(current.every(p=>p.reasons.length>0),'contrast reason missing');
  for(const card of cards){
   const id=card.dataset.mpcrPath;
   const passport=card.querySelector('[data-mpcr-open]'),comparison=card.querySelector('[data-mpcr-compare]');
   ok(passport?.getAttribute('href')==='/projects/'+id+'/','incorrect destination for '+id);
   const params=new URL(comparison.href).searchParams;
   ok(params.get('compare')===s.projectId+','+id,'comparison pair mismatch');
   const destinationName=card.querySelector('h3').textContent;
   ok(passport.getAttribute('aria-label')==='Read research passport: '+destinationName,'passport accessible name lacks project context');
   ok(comparison.getAttribute('aria-label')?.includes(destinationName),'comparison accessible name lacks destination context');
   const source=card.querySelector('a[target="_blank"]');
   ok(source?.getAttribute('aria-label')?.includes(destinationName),'source accessible name lacks project context');
   ok(source?.protocol==='https:'&&source.rel==='noopener noreferrer','unsafe or missing source link');
   ok(card.querySelectorAll('.mpcr-tag').length>0,'reason labels missing');
  }
  ok(root.querySelector('.mpcr-caveat').textContent.includes('not affiliated'),'research qualification absent');
  if(new URL(location.href).searchParams.has('snapshot')){
   window.scrollTo(0,0);
   out.textContent='PASS: expanded 10 contrasted research paths ready for screenshot';
   return;
  }
  ok(root.getAttribute('aria-busy')==='false','loading indicator not cleared');
  const retry=root.querySelector('.mpcr-retry'),grid=root.querySelector('.mpcr-grid');
  const originalFetch=window.fetch;
  try{
   let requests=0;
   window.fetch=(...args)=>{
    if(String(args[0])==='/data/projects.json'){requests++;return Promise.resolve({ok:false});}
    return originalFetch.apply(window,args);
   };
   retry.click();
   ok(root.getAttribute('aria-busy')==='true'&&retry.disabled,'retry did not enter accessible loading state');
   retry.click();
   for(let i=0;i<100&&app.getState().loading;i++)await pause(20);
   ok(requests===1,'duplicate retry started another request');
   ok(!app.getState().ready&&!app.getState().loading,'failed request remained ready or loading');
   ok(app.getPaths().length===0&&grid.children.length===0,'failed request retained stale research paths');
   ok(!retry.hidden&&!retry.disabled,'retry unavailable after failure');
   ok(document.querySelector('main .hero'),'original passport removed by failed enhancement');
  }finally{window.fetch=originalFetch;}
  retry.click();
  for(let i=0;i<150&&app.getState().loading;i++)await pause(20);
  ok(app.getState().ready&&app.getState().paths===10,'retry did not restore ten paths');
  ok(grid.children.length===10&&retry.hidden,'recovery controls or research cards incorrect');
  ok(root.getAttribute('aria-busy')==='false','recovered panel still marked busy');
  out.textContent='PASS: contextual link names, safe source links, accessible loading, duplicate retry prevention and failed-load recovery';
 }catch(error){out.textContent='FAIL: '+error.message;}
});
})();