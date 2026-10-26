window.addEventListener('load',async()=>{
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const check=(value,message)=>{if(!value)throw Error(message);};
 const out=document.getElementById('cp-probe-result'),form=document.getElementById('proposal');
 const id=new URLSearchParams(location.search).get('project'),initialFetch=window.fetch;
 const field=id=>document.getElementById(id);
 const settled=async()=>{for(let i=0;i<150&&form.dataset.contextResolution==='loading';i++)await wait(20);};
 try{
  for(let i=0;i<100&&!window.__cpReleaseLookup;i++)await wait(20);
  check(window.__cpReleaseLookup,'initial lookup was not captured');
  check(form.dataset.contextResolution==='loading'&&form.querySelector('button[type=submit]').disabled,'lookup did not disable preparation');
  const data=await window.__cpOriginalFetch('/data/projects.json').then(r=>r.json()),record=data.records.find(p=>p.id===id);
  check(record,'original project missing');
  for(const key of ['name','city','country','operator','type']){
   field(key).value=key==='type'?field(key).options[1].value:'Visitor edit';
   field(key).dispatchEvent(new Event(key==='type'?'change':'input',{bubbles:true}));
   field(key).value='';field(key).dispatchEvent(new Event(key==='type'?'change':'input',{bubbles:true}));
  }
  window.__cpReleaseLookup({ok:false});await settled();
  check(form.dataset.contextResolution==='unavailable'&&!form.dataset.projectId,'failed lookup invented a resolved correction');
  const retry=document.getElementById('correction-retry');check(retry&&!retry.disabled,'retry missing after failure');
  window.fetch=(...args)=>String(args[0])==='/data/projects.json'?Promise.resolve({ok:true,json:async()=>data}):initialFetch(...args);
  retry.click();await settled();
  check(form.dataset.contextResolution==='resolved'&&form.dataset.projectId===id,'retry did not resolve identity');
  for(const key of ['name','city','country','operator','type'])check(field(key).value==='',key+' was refilled after the visitor cleared it');
  check(field('source').value==='','original source was incorrectly used as correction evidence');
  check(form.dataset.originalOperator===record.reportedOperator,'original operator metadata lost');
  const fill=(id,value)=>{field(id).value=value;field(id).dispatchEvent(new Event('input',{bubbles:true}));};
  fill('name','Visitor correction '+record.name);fill('city','Visitor correction locality');fill('country',record.country);
  fill('operator','Visitor operator attribution');fill('desc','Independent follow-up evidence supporting this proposed correction for '+record.name);
  fill('source','https://example.org/evidence/'+id);
  field('type').value=field('type').options[1].value;field('type').dispatchEvent(new Event('change',{bubbles:true}));
  form.requestSubmit();
  let report=JSON.parse(field('report-preview').textContent);
  check(report.recordType==='MicroportMap project correction'&&report.projectId===id,'resolved report context incorrect');
  check(report.status==='Prepared locally — NOT submitted','report was not labeled local-only');
  window.fetch=(...args)=>String(args[0])==='/data/projects.json'?Promise.resolve({ok:false}):initialFetch(...args);
  retry.click();await settled();
  check(!form.dataset.projectId&&!form.dataset.originalOperator,'failed retry retained stale resolved metadata');
  check(document.getElementById('result').style.display==='none','lookup change retained a prepared stale report');
  form.requestSubmit();report=JSON.parse(field('report-preview').textContent);
  check(report.recordType==='MicroportMap unresolved correction reference'&&report.requestedProjectId===id&&report.projectId===null,'unresolved correction became a new suggestion or kept old identity');
  check(report.projectPassportUrl===null,'unresolved report invented a passport');
  window.fetch=(...args)=>String(args[0])==='/data/projects.json'?Promise.resolve({ok:true,json:async()=>data}):initialFetch(...args);
  retry.click();await settled();
  check(form.dataset.contextResolution==='resolved'&&field('name').value==='Visitor correction '+record.name,'final retry lost the visitor edit');
  check(document.querySelectorAll('#correction-original-source').length===1,'original source references duplicated');
  check(field('source').value==='https://example.org/evidence/'+id,'lookup replaced supporting evidence');
  window.scrollTo(0,0);
  out.textContent='PASS: cleared fields, retry identity, untouched evidence, local report schema and failed-retry invalidation';
 }catch(error){out.textContent='FAIL: '+error.message;}
 finally{window.fetch=initialFetch;}
});
