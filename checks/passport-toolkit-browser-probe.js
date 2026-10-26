(()=>{
window.addEventListener('load',async()=>{
 const output=document.getElementById('mpp-probe-result');
 const delay=ms=>new Promise(done=>setTimeout(done,ms));
 const must=(yes,msg)=>{if(!yes)throw Error(msg);};
 try{
  for(let i=0;i<150&&!window.MicroportPassportToolkit?.getState().loaded;i++)await delay(40);
  const state=window.MicroportPassportToolkit?.getState();
  must(state?.loaded,'toolkit not loaded');
  const path=location.pathname.match(/^\/projects\/([a-z0-9-]+)\//);
  must(state.id===path?.[1],'wrong passport ID');
  must(state.actions===10,'10 actions not mounted');
  const root=document.getElementById('mpp-toolkit');
  must(root!==null,'research toolkit panel missing');
  must(root.querySelectorAll('[data-mpp-action]').length===10,'action list incomplete');
  must(root.querySelectorAll('.mpp-check').length===7,'seven evidence field checks missing');
  must(root.querySelectorAll('.mpp-quickfact').length===4,'research field summary missing');
  const original=root.querySelector('[data-mpp-action="original-source"]');
  must(original?.href?.startsWith('https://'),'source destination not safe HTTPS');
  must(original?.getAttribute('rel')==='noopener noreferrer','source link lacks safe target rel');
  const equipment=root.querySelector('[data-mpp-action="same-equipment"]');
  must(equipment?.href?.includes('/directory/?q='),'equipment handoff missing');
  root.querySelector('[data-mpp-action="citation-plain"]').click();
  await delay(80);
  must(root.querySelector('#mpp-status').textContent.includes('citation'),'copy citation feedback missing');
  must(root.dataset.mppLoaded==='true','enhancement state missing');
  output.textContent='PASS: original passport '+state.id+', ten actions, safe source, equipment, seven checklist items and clipboard fallback';
 }catch(err){output.textContent='FAIL: '+err.message;}
});
})();