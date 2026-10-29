(async()=>{
 const out=document.getElementById('expansion-probe');
 const check=(v,m)=>{if(!v)throw Error(m);};
 const wait=async fn=>{for(let i=0;i<240;i++){if(fn())return;await new Promise(r=>setTimeout(r,40));}throw Error('Timed out waiting for expanded catalogue');};
 try{
  const path=location.pathname;
  const catalogue=await fetch('/data/projects.json').then(r=>r.json()),expected=catalogue.records.length;
  check(expected===catalogue.count,'Published record count mismatch');
  if(path==='/'){
   await wait(()=>document.getElementById('stats-projects')?.textContent===String(expected));
   check(document.querySelectorAll('[data-project-id]').length===expected,'Atlas omitted records');
  }else if(path==='/directory/'){
   await wait(()=>window.mpFilteredRecords?.length===expected);
   check(document.querySelectorAll('[data-project-id]').length===expected,'Directory omitted records');
   const search=document.getElementById('search');search.value='Zipline';search.dispatchEvent(new Event('input',{bubbles:true}));
   check(window.mpFilteredRecords.length===catalogue.records.filter(p=>window.MicroportSearch.matches(p,'Zipline')).length,'Zipline records not searchable');
   search.value='Amazon';search.dispatchEvent(new Event('input',{bubbles:true}));
   check(window.mpFilteredRecords.length===14,'Amazon origins missing or duplicated');
   search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
  }else if(path==='/countries/'){
   await wait(()=>window.MicroportCountries?.getState().loaded);
   check(window.MicroportCountries.getRecords().length===expected,'Country explorer omitted records');
   for(const country of ['Ghana','Rwanda','Kenya','Nigeria','Finland','Singapore','Bulgaria','Malawi','Vanuatu','Mozambique','France','Portugal','New Zealand'])check(window.MicroportCountries.getVisible().includes(country),'New country absent: '+country);
  }else if(path==='/operators/'){
   await wait(()=>window.MicroportOperators?.getState().ready);
   check(window.MicroportOperators.getRecordIds().length===expected,'Operator explorer omitted records');
  }else if(path==='/technologies/'){
   await wait(()=>window.MicroportEquipment?.getState().loaded);
   check(window.MicroportEquipment.getIds().length===expected,'Equipment explorer omitted records');
  }else if(path.startsWith('/projects/')){
   const id=path.split('/')[2];
   if(['amazon-college-station','oban-argyll-medical-trial','dhl-reit-im-winkl','inhambane-medical-drone-study','aeronext-tsuruga-arachi','manna-blanchardstown','manna-junction-6','flytrex-holly-springs','droneup-walmart-994','droneup-walmart-3896','wing-canberra-mitchell','wing-grand-plaza','wing-eastland','wing-hyperdome','wing-orion-springfield','wing-coles-ormeau'].includes(id))check(document.querySelector('.hero').textContent.includes('Historical project'),'Ended pilot presented as operating');
   if(['zipline-kisumu','wing-walmart-942','abu-dhabi-skygo-matternet','wing-walmart-charlotte-callabridge','wing-nrh-bisd','zipline-dallas-forest','harford-county-dfr','zipline-denton-university'].includes(id))check(document.querySelector('.hero').textContent.includes('Announced / planned'),'Proposed hub presented as operating');
   await wait(()=>window.MicroportFields?.getState().ready&&window.MicroportLocation?.getState().ready&&window.MicroportPassportToolkit?.getState().loaded&&window.MicroportReview?.getState().ready&&window.MicroportQuickNav?.getState().ready&&window.MicroportEvidenceCompare?.getState().ready&&window.MicroportContrast?.getState().ready);
   check(window.MicroportFields.getState().projectId===id,'Wrong project loaded');
   if(['aeronext-shintotsukawa','aeronext-sakai','shinshiro-sakude-trial','nara-tsukigase-ono-ono','nara-yagyu-school','japan-post-okutama','japan-post-izushi','japan-post-iruka','manna-espoo-niittykumpu','swoop-goondiwindi','healthdrone-svendborg','biogroup-bourgoin-jallieu','rigitech-coppet-laboratory','caelus-edinburgh-bioquarter','mercury-stracathro-trial','skyports-a-kwadraat-turnhout','san-raffaele-milan-trial','sao-joao-porto-trial','isala-meppel-medical-trial'].includes(id))check(document.querySelector('.hero').textContent.includes('Trial in cited source'),'Demonstration presented as regular service');
   const record=catalogue.records.find(p=>p.id===id);
   if(['2026-10-28-community-logistics-and-testing','2026-10-28-japan-depots-and-postal-trials','2026-10-28-retail-origins-and-dock-networks','2026-10-28-delivery-origins-and-test-centres','2026-10-28-retail-history-and-medical-delivery','2026-10-28-texas-delivery-expansion','2026-10-29-retail-origins-and-status-review','2026-10-29-healthcare-trial-origins','2026-10-29-medical-origin-and-test-centres','2026-10-29-aerospace-research-facilities','2026-10-29-meituan-delivery-origins','2026-10-29-shenzhen-commercial-hubs'].includes(record.researchBatch)||['wing-grand-plaza','wing-eastland','wing-hyperdome','wing-orion-springfield'].includes(id)){
    check(document.querySelector('h1').textContent===record.name,'New passport identity mismatch');
    check([...document.querySelectorAll('a')].some(a=>a.href===record.source.url),'New source link lost');
    for(const source of record.supportingSources||[])check([...document.querySelectorAll('main a')].some(a=>a.href===source.url&&a.textContent===source.name),'Supporting evidence missing');
    check(document.querySelector('main').textContent.includes(record.reviewNotes),'New counting limitation lost');
   }
   if(id==='aeronext-kosuge')check(document.querySelector('.hero').textContent.includes('Hashidate'),'Wrong Japanese depot rendered');
   if(id==='singapore-mpa-marina-south-pier')check(document.querySelector('.hero').textContent.includes('Marina South Pier'),'Wrong Singapore dock rendered');
   check(window.MicroportFields.getState().count===10,'Field actions incomplete');
   check(window.MicroportLocation.getState().actions===10,'Location actions incomplete');
   check(window.MicroportPassportToolkit.getState().actions===10,'Toolkit actions incomplete');
   check(window.MicroportEvidenceCompare.getOtherOptions().length===expected-1,'Comparison catalogue incomplete');
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
