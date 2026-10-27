(async()=>{
 const output=document.getElementById('pr-probe-result'),assert=(ok,msg)=>{if(!ok)throw Error(msg)},wait=async fn=>{for(let i=0;i<120;i++){if(fn())return;await new Promise(r=>setTimeout(r,25));}throw Error('Condition timed out')},settle=()=>new Promise(r=>setTimeout(r,5));
 try{
  await wait(()=>document.getElementById('project-data-retry')?.hidden===false);
  const id=location.pathname.split('/')[2],details=document.getElementById('project-related-details'),download=document.getElementById('project-download-json'),retry=document.getElementById('project-data-retry'),copy=document.getElementById('project-copy-link'),status=document.querySelector('#mp-connect .mp-share-status');
  assert(details.getAttribute('aria-busy')==='false','Timeout releases busy state');assert(download.disabled,'No stale download');assert(document.querySelector('h1'),'Published passport remains');assert(document.querySelector('#mp-connect a[href="/submit/?project='+id+'"]'),'Correction remains available');
  retry.click();await wait(()=>!download.disabled);assert(details.innerHTML.includes('Location &amp; contact details'),'Related details recovered');
  window.passportLateResponse({ok:true,json:async()=>({records:[]})});await settle();assert(!download.disabled&&retry.hidden,'Late lookup cannot replace recovery');
  copy.click();await wait(()=>status.textContent.includes('Clipboard unavailable'));assert(status.querySelector('a').href==='https://microportmap.com/projects/'+id+'/','Exact canonical fallback');window.passportProbeCopies[0].resolve();await settle();assert(status.textContent.includes('Clipboard unavailable'),'Late clipboard ignored');
  copy.click();copy.click();window.passportProbeCopies[2].resolve();await settle();window.passportProbeCopies[1].reject(Error('blocked'));await settle();assert(status.textContent==='Project link copied','Latest copy outcome');
  const native=URL.createObjectURL;let blob;URL.createObjectURL=b=>{blob=b;return native(b)};document.addEventListener('click',e=>{if(e.target.closest('a[download]'))e.preventDefault()},true);
  copy.click();download.click();const message=status.textContent,data=JSON.parse(await blob.text());assert(data.count===1&&data.records[0].id===id,'Exact project JSON');assert(data.methodology.includes('not independently verified'),'Limitations retained');window.passportProbeCopies[3].resolve();await settle();assert(status.textContent===message,'Export message preserved');
  document.getElementById('mp-connect').scrollIntoView();output.textContent='PASS: passport timeout, retry, canonical copy ordering and exact project JSON';
 }catch(e){output.textContent='FAIL: '+e.message;}
})();
