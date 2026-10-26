(async()=>{
 const output=document.getElementById('dr-probe-result'),assert=(ok,msg)=>{if(!ok)throw Error(msg)},wait=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,25));}throw Error('Condition timed out')};
 try{
  await wait(()=>!document.getElementById('error').hidden);
  assert(document.getElementById('results').getAttribute('aria-busy')==='false','Deadline must release busy state');
  assert(document.getElementById('export-json').disabled,'Failed lookup must disable JSON');
  document.getElementById('retry-directory').click();
  await wait(()=>window.mpFilteredRecords?.length===50);
  const id=new URLSearchParams(location.search).get('project'),p=window.mpFilteredRecords.find(r=>r.id===id);assert(p,'Original project');
  const input=document.getElementById('search');input.value=p.name;input.dispatchEvent(new Event('input',{bubbles:true}));
  assert(window.mpFilteredRecords.some(r=>r.id===id),'Filtered project');
  const native=URL.createObjectURL;let blob;
  URL.createObjectURL=b=>{blob=b;return native(b)};
  document.addEventListener('click',e=>{if(e.target.closest('a[download]'))e.preventDefault()},true);
  document.getElementById('export-json').click();
  const data=JSON.parse(await blob.text());assert(data.records.some(r=>r.id===id),'JSON project');assert(data.filters.search===p.name,'Filter context');
  window.directoryLateResponse({ok:true,json:async()=>({records:[]})});await new Promise(r=>setTimeout(r,50));
  assert(window.mpFilteredRecords.some(r=>r.id===id),'Late response must not overwrite recovery');
  input.value='qa-no-project-matches';input.dispatchEvent(new Event('input',{bubbles:true}));assert(document.getElementById('export-json').disabled,'Empty result disables JSON');
  document.getElementById('empty-reset').click();assert(window.mpFilteredRecords.length===50,'Clear restores all projects');
  output.textContent='PASS: directory timeout, retry, late response, filtered JSON and empty reset';
 }catch(e){output.textContent='FAIL: '+e.message;}
})();
