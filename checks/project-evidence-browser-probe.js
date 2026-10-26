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
  const inspect=()=>root.querySelector('[data-mpd-action="country"]');
  inspect().focus();inspect().click();
  must(document.activeElement===inspect(),'opening field context lost keyboard focus');
  inspect().click();must(document.activeElement===inspect(),'closing field context lost keyboard focus');
  const query=root.querySelector('.mpd-search'),sort=root.querySelector('.mpd-sort');
  query.value='no-project-can-match-this-query';query.dispatchEvent(new Event('input',{bubbles:true}));
  must(api.getState().otherId===null,'empty search kept an old pair');
  must(api.choose(alternative)&&api.getState().otherId===alternative,'explicit choice outside the filter was replaced');
  must(query.value==='','explicit selection did not clear the excluding filter');
  const clipboardDescriptor=Object.getOwnPropertyDescriptor(navigator,'clipboard'),originalFetch=window.fetch;
  const retry=root.querySelector('#mpd-content').lastElementChild;
  const manual=root.querySelector('.mpd-manual'),text=root.querySelector('.mpd-manual-text'),status=root.querySelector('#mpd-status');
  try{
   let reject;
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise((_,fail)=>{reject=fail;})}});
   root.querySelector('.mpd-actions button').click();
   const next=api.getOtherOptions().find(id=>id!==alternative);api.choose(next);const pairStatus=status.textContent;
   reject(Error('Older pair denied'));await wait(30);
   must(status.textContent===pairStatus&&manual.hidden&&text.value==='','old clipboard feedback exposed a stale pair');
   const data=await originalFetch('/data/projects.json').then(r=>r.json());
   data.records.forEach(p=>delete p.country);
   window.fetch=(...args)=>String(args[0])==='/data/projects.json'?Promise.resolve({ok:true,json:async()=>data}):originalFetch.apply(window,args);
   retry.click();
   for(let i=0;i<150&&api.getState().loading;i++)await wait(20);
   must(api.getState().ready,'missing-field comparison fixture did not load');
   must(api.getFields().find(f=>f.id==='country').observation.includes('omits'),'two missing countries were reported as matching wording');
   sort.value='country';sort.dispatchEvent(new Event('change',{bubbles:true}));
   must(api.getFields().length===10,'missing-country sort broke comparison');
   window.fetch=(...args)=>String(args[0])==='/data/projects.json'?Promise.resolve({ok:false}):originalFetch.apply(window,args);
   retry.click();
   for(let i=0;i<100&&api.getState().loading;i++)await wait(20);
   must(!api.getState().ready&&api.getOtherOptions().length===0&&api.getFields().length===0,'failed reload kept old comparison state');
   must(query.disabled&&root.querySelectorAll('[data-mpd-field]').length===0,'failed reload kept interactive stale fields');
   window.fetch=originalFetch;retry.click();
   for(let i=0;i<150&&api.getState().loading;i++)await wait(20);
   must(api.getState().ready&&api.getFields().length===10&&!query.disabled,'comparison reload did not recover');
   must(root.getAttribute('aria-busy')==='false','comparison loading indicator not cleared');
  }finally{
   window.fetch=originalFetch;
   if(clipboardDescriptor)Object.defineProperty(navigator,'clipboard',clipboardDescriptor);else delete navigator.clipboard;
  }
  target.textContent='PASS: keyboard focus, explicit filtered choice, stale pair isolation, missing-field semantics and reload recovery';
 }catch(e){target.textContent='FAIL: '+e.message;}
});
})();