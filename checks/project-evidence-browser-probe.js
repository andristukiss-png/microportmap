(()=>{
window.addEventListener('load',async()=>{
 const target=document.getElementById('mpd-probe');
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const must=(x,msg)=>{if(!x)throw Error(msg);};
 try{
  for(let i=0;i<150&&!window.MicroportEvidenceCompare?.getState().ready;i++)await wait(40);
  const api=window.MicroportEvidenceCompare,st=api?.getState();
  must(st?.ready,'comparison did not load');
  must(st.fields===10,'ten field dimensions not loaded');
  must(api.getOtherOptions().length===49,'expected 49 available alternate projects');
  const root=document.getElementById('mpd-compare');
  must(root?.tagName==='DETAILS','comparison must be an accessible disclosure');
  must(!root.open,'comparison should remain collapsed by default');
  root.open=true;
  // Screenshot-only mode does not scroll to a lower comparison field.
  if(new URLSearchParams(location.search).has('snapshot')){
    window.scrollTo(0,0);
    target.textContent='PASS: expanded source comparison visual capture';
    return;
  }
  const fields=[...root.querySelectorAll('[data-mpd-field]')];
  must(fields.length===10,'ten source-field comparison cards missing');
  const buttons=[...root.querySelectorAll('[data-mpd-action]')];
  must(buttons.length===10,'ten field inspect buttons missing');
  const sourceLinks=[...root.querySelectorAll('.mpd-source a[target="_blank"]')];
  must(sourceLinks.length===2,'safe original source links missing');
  must(sourceLinks.every(a=>a.protocol==='https:'&&a.rel==='noopener noreferrer'),'external source URL safety missing');
  let alternative=api.getOtherOptions().find(id=>id!==st.otherId);
  must(api.choose(alternative),'choosing another source project failed');
  must(api.getState().otherId===alternative,'selected secondary research record was not updated');
  must(api.getFields().length===10,'comparison dimension data incomplete');
  must(api.focus('country'),'country inspect control failed');
  must(api.getState().active==='country','focused field state missing');
  must(root.querySelector('#mpd-focus').textContent.includes('not independently'),'focused field lacked source caveat');
  must(api.focus('reportedEquipment'),'equipment field inspection failed');
  must(api.getState().active==='reportedEquipment','equipment field state missing');
  root.querySelector('.mpd-actions button:first-child').click();
  await wait(1150);
  must(root.querySelector('#mpd-status').textContent.toLowerCase().includes('comparison'),'copy feedback missing');
  must(root.querySelectorAll('.mpd-actions button').length===4,'comparison actions missing');
  target.textContent='PASS: ten report-field comparisons, safe original sources, select-other workflow, field focus, copy fallback and collapsed design';
 }catch(e){target.textContent='FAIL: '+e.message;}
});
})();