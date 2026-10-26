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
   const source=card.querySelector('a[target="_blank"]');
   ok(source?.protocol==='https:'&&source.rel==='noopener noreferrer','unsafe or missing source link');
   ok(card.querySelectorAll('.mpcr-tag').length>0,'reason labels missing');
  }
  ok(root.querySelector('.mpcr-caveat').textContent.includes('not affiliated'),'research qualification absent');
  if(new URL(location.href).searchParams.has('snapshot')){
   window.scrollTo(0,0);
   out.textContent='PASS: expanded 10 contrasted research paths ready for screenshot';
   return;
  }
  out.textContent='PASS: 10 unique destination passports, valid comparison pairs, safe external source links and grounded distinctions';
 }catch(error){out.textContent='FAIL: '+error.message;}
});
})();