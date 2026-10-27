(async()=>{
 const output=document.getElementById('qr-probe-result'),assert=(ok,msg)=>{if(!ok)throw Error(msg)},wait=async fn=>{for(let i=0;i<280;i++){if(fn())return;await new Promise(r=>setTimeout(r,25));}throw Error('Condition timed out')};
 try{
  await wait(()=>!document.getElementById('error').hidden);
  assert(document.getElementById('summary').getAttribute('aria-busy')==='false','Deadline must release busy state');
  assert(document.getElementById('audit-json').disabled,'Failed lookup must disable audit export');
  document.getElementById('quality-retry').click();await wait(()=>window.qualityProbeRecords?.length===50);
  const id=new URLSearchParams(location.search).get('project');assert(window.qualityProbeRecords.some(r=>r.id===id),'Original project');
  const native=URL.createObjectURL;let blob;URL.createObjectURL=b=>{blob=b;return native(b)};
  document.addEventListener('click',e=>{if(e.target.closest('a[download]'))e.preventDefault()},true);
  document.getElementById('audit-json').click();let data=JSON.parse(await blob.text());assert(data.records.some(c=>c.record.id===id),'All-record audit context');assert(data.count===50,'All records');
  window.qualityLateResponse({ok:true,json:async()=>({records:[]})});await new Promise(r=>setTimeout(r,50));assert(window.qualityProbeRecords.length===50,'Late response ignored');
  const scope=document.getElementById('audit-scope'),search=document.getElementById('review-search');scope.value='review';scope.dispatchEvent(new Event('change',{bubbles:true}));search.value='qa-no-record-matches';search.dispatchEvent(new Event('input',{bubbles:true}));assert(document.getElementById('audit-json').disabled,'Empty review disables JSON');assert(document.getElementById('audit-download').disabled,'Empty review disables CSV');
  scope.value='all';scope.dispatchEvent(new Event('change',{bubbles:true}));assert(!document.getElementById('audit-json').disabled,'All scope independent of review search');
  scope.value='review';scope.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('review-reset').click();assert(!document.getElementById('audit-json').disabled,'Reset restores review export');
  document.getElementById('audit-json').click();data=JSON.parse(await blob.text());assert(data.scope==='review'&&data.count===28,'Review export has flagged records');assert(data.reviewFilters.search==='','Cleared filter recorded');assert(data.limitations.includes('does not establish accuracy'),'Research limits retained');
  document.getElementById('review-queue').scrollIntoView();output.textContent='PASS: metadata timeout, retry, late response, audit scopes and filtered JSON';
 }catch(e){output.textContent='FAIL: '+e.message;}
})();
