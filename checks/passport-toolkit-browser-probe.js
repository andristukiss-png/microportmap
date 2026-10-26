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
  await delay(1100);
  must(root.querySelector('#mpp-status').textContent.includes('citation'),'copy citation feedback missing: '+root.querySelector('#mpp-status').textContent.slice(0,140));
  must(root.dataset.mppLoaded==='true','enhancement state missing');
  const api=window.MicroportPassportToolkit,retry=root.querySelector('.mpp-retry');
  const descriptor=Object.getOwnPropertyDescriptor(navigator,'clipboard'),originalFetch=window.fetch,create=URL.createObjectURL;
  const action=key=>root.querySelector('[data-mpp-action="'+key+'"]');
  const manual=root.querySelector('.mpp-copy-fallback'),text=root.querySelector('.mpp-copy-text'),status=root.querySelector('#mpp-status');
  const clipboard=value=>Object.defineProperty(navigator,'clipboard',{configurable:true,value});
  try{
   const data=await originalFetch('/data/projects.json').then(r=>r.json()),project=data.records.find(p=>p.id===state.id);
   project.name+=' [literal] <img>';project.reportedOperator={};project.reportedEquipment='  ';project.locationPrecision=null;
   window.fetch=(...args)=>String(args[0])==='/data/projects.json'?Promise.resolve({ok:true,json:async()=>data}):originalFetch.apply(window,args);
   retry.click();for(let i=0;i<150&&api.getState().loading;i++)await delay(20);
   must(api.getState().loaded&&api.getState().actions===10,'malformed optional fields broke the toolkit');
   must(action('same-equipment').getAttribute('aria-disabled')==='true','blank equipment produced an enabled search');
   clipboard(undefined);action('citation-markdown').click();await delay(30);
   must(text.value.includes('\\[literal\\]')&&text.value.includes('\\<img\\>'),'Markdown citation interpreted literal name characters');
   must(document.activeElement===text&&text.selectionEnd===text.value.length,'copy fallback is not focused and selected');
   URL.createObjectURL=()=>{throw Error('Download fixture blocked');};action('download-brief-md').click();
   must(!manual.hidden&&text.value.startsWith('# ')&&text.value.includes('\\[literal\\]'),'Markdown download fallback lost escaped content');
   action('download-review-csv').click();must(text.value.includes('catalog_field_present'),'CSV fallback has wrong format');
   let finish;clipboard({writeText:()=>new Promise(resolve=>{finish=resolve;})});action('citation-plain').click();
   clipboard(undefined);action('copy-facts').click();await delay(30);const latest=status.textContent,value=text.value;
   finish();await delay(30);must(status.textContent===latest&&text.value===value,'older clipboard success replaced the latest fallback');
   const oldAction=action('citation-plain');
   window.fetch=(...args)=>String(args[0])==='/data/projects.json'?Promise.resolve({ok:false}):originalFetch.apply(window,args);
   retry.click();oldAction.click();for(let i=0;i<100&&api.getState().loading;i++)await delay(20);
   must(!api.getState().loaded&&api.getState().actions===0,'failed reload retained old toolkit actions');
   must(root.querySelector('#mpp-evidence-fields').children.length===0,'failed reload retained stale evidence checks');
   must(manual.hidden&&text.value==='','failed reload retained prepared text');
   window.fetch=originalFetch;retry.click();for(let i=0;i<150&&api.getState().loading;i++)await delay(20);
   must(api.getState().loaded&&api.getState().actions===10,'toolkit retry did not restore actions');
   must(root.getAttribute('aria-busy')==='false','toolkit loading indicator not cleared');
  }finally{
   window.fetch=originalFetch;URL.createObjectURL=create;
   if(descriptor)Object.defineProperty(navigator,'clipboard',descriptor);else delete navigator.clipboard;
  }
  output.textContent='PASS: malformed metadata, literal Markdown, selected export fallbacks, stale-copy isolation and toolkit reload recovery';
 }catch(err){output.textContent='FAIL: '+err.message;}
});
})();