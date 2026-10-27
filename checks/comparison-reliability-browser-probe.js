(async()=>{
 const output=document.getElementById('cr-probe-result'),assert=(ok,msg)=>{if(!ok)throw Error(msg)},wait=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,25));}throw Error('Condition timed out')},settle=()=>new Promise(r=>setTimeout(r,5));
 try{
  await wait(()=>window.mpFilteredRecords?.length===50&&document.querySelector('[data-compare-project]'));
  const id=new URLSearchParams(location.search).get('project'),p=window.mpFilteredRecords.find(r=>r.id===id);assert(p,'Original project');
  document.querySelector('[data-compare-project="'+id+'"]').click();
  const country=document.getElementById('country');country.value=p.country;country.dispatchEvent(new Event('change',{bubbles:true}));
  const search=document.getElementById('search');search.value=p.name;search.dispatchEvent(new Event('input',{bubbles:true}));
  const copy=document.getElementById('comparison-copy'),status=document.getElementById('comparison-status');copy.click();await wait(()=>status.textContent.startsWith('Copy this comparison link:'));
  const u=new URL(status.textContent.replace('Copy this comparison link: ',''));assert(u.searchParams.get('compare')===id,'Selected project');assert(u.searchParams.get('country')===p.country,'Country context');assert(u.searchParams.get('q')===p.name,'Search context');
  window.comparisonProbeCopies[0].resolve();await settle();assert(status.textContent.startsWith('Copy this'),'Late clipboard cannot replace fallback');
  copy.click();copy.click();window.comparisonProbeCopies[2].resolve();await settle();const copied=status.textContent;assert(copied.includes('copied'),'Latest copy success');window.comparisonProbeCopies[1].reject(Error('blocked'));await settle();assert(status.textContent===copied,'Older failure ignored');
  copy.click();const native=URL.createObjectURL;let blob;URL.createObjectURL=b=>{blob=b;return native(b)};document.addEventListener('click',e=>{if(e.target.closest('a[download]'))e.preventDefault()},true);
  document.getElementById('comparison-json').click();const message=status.textContent,data=JSON.parse(await blob.text());assert(data.records[0].id===id&&data.count===1,'Exact selected export');assert(data.limitations.includes('No independent confirmation'),'Limits retained');window.comparisonProbeCopies[3].resolve();await settle();assert(status.textContent===message,'Export message preserved');
  document.getElementById('project-comparison').scrollIntoView();output.textContent='PASS: comparison clipboard deadline, filter context, request ordering and exact export';
 }catch(e){output.textContent='FAIL: '+e.message;}
})();
