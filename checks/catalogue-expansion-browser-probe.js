(async()=>{
 const out=document.getElementById('expansion-probe');
 const check=(v,m)=>{if(!v)throw Error(m);};
 const wait=async fn=>{for(let i=0;i<240;i++){if(fn())return;await new Promise(r=>setTimeout(r,40));}throw Error('Timed out waiting for expanded catalogue');};
 try{
  const path=location.pathname;
  if(path==='/'){
   await wait(()=>document.getElementById('stats-projects')?.textContent==='60');
   check(document.querySelectorAll('[data-project-id]').length===60,'Atlas omitted records');
  }else if(path==='/directory/'){
   await wait(()=>window.mpFilteredRecords?.length===60);
   check(document.querySelectorAll('[data-project-id]').length===60,'Directory omitted records');
   const search=document.getElementById('search');search.value='Zipline';search.dispatchEvent(new Event('input',{bubbles:true}));
   check(window.mpFilteredRecords.length===6,'Zipline records not searchable');
   search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
  }else if(path==='/countries/'){
   await wait(()=>window.MicroportCountries?.getState().loaded);
   check(window.MicroportCountries.getRecords().length===60,'Country explorer omitted records');
   check(window.MicroportCountries.getVisible().includes('Ghana')&&window.MicroportCountries.getVisible().includes('Rwanda'),'New countries absent');
  }else if(path==='/operators/'){
   await wait(()=>window.MicroportOperators?.getState().ready);
   check(window.MicroportOperators.getRecordIds().length===60,'Operator explorer omitted records');
  }else if(path==='/technologies/'){
   await wait(()=>window.MicroportEquipment?.getState().loaded);
   check(window.MicroportEquipment.getIds().length===60,'Equipment explorer omitted records');
  }else if(path.startsWith('/projects/')){
   const id=path.split('/')[2];
   await wait(()=>window.MicroportFields?.getState().ready&&window.MicroportLocation?.getState().ready&&window.MicroportPassportToolkit?.getState().loaded&&window.MicroportReview?.getState().ready&&window.MicroportQuickNav?.getState().ready&&window.MicroportEvidenceCompare?.getState().ready&&window.MicroportContrast?.getState().ready);
   check(window.MicroportFields.getState().projectId===id,'Wrong project loaded');
   check(window.MicroportFields.getState().count===10,'Field actions incomplete');
   check(window.MicroportLocation.getState().actions===10,'Location actions incomplete');
   check(window.MicroportPassportToolkit.getState().actions===10,'Toolkit actions incomplete');
   check(window.MicroportEvidenceCompare.getOtherOptions().length===59,'Comparison catalogue incomplete');
   check(window.MicroportFields.getFieldText('sourceURL').includes('Original source: https://'),'Source context lost');
   window.MicroportEvidenceCompare.choose(id==='kiel'?'zipline-omenako':'kiel');
   check(window.MicroportEvidenceCompare.getState().fields===10,'New/original comparison failed');
  }
  await wait(()=>document.querySelector('.mpx-search-trigger'));
  document.querySelector('.mpx-search-trigger').click();
  const search=document.getElementById('mpx-search-field');search.value='Omenako';search.dispatchEvent(new Event('input',{bubbles:true}));
  await wait(()=>document.querySelector('.mpx-search-result')?.href.includes('/projects/zipline-omenako/'));
  document.querySelector('.mpx-close').click();
  check(document.documentElement.scrollWidth<=innerWidth+2,'Page overflows horizontally');
  out.textContent='PASS: expanded catalogue, new record search and cross-catalogue workflows';
 }catch(error){out.textContent='FAIL: '+error.message;}
})();
