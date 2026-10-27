(async()=>{
 const output=document.getElementById('ar-probe-result'),assert=(ok,msg)=>{if(!ok)throw Error(msg)},wait=async fn=>{for(let i=0;i<120;i++){if(fn())return;await new Promise(r=>setTimeout(r,25));}throw Error('Condition timed out')};
 try{
  await wait(()=>document.getElementById('retry-atlas'));
  assert(document.getElementById('results').getAttribute('aria-busy')==='false','Timeout releases busy state');
  document.getElementById('retry-atlas').click();await wait(()=>document.querySelectorAll('#results button[data-project-id]').length===50);
  const id=new URLSearchParams(location.search).get('project'),detail=document.getElementById('detail');assert(id&&!detail.hidden,'Requested project recovered');assert(document.getElementById('detail-content').innerHTML.includes('/projects/'+id+'/'),'Correct project drawer');
  document.getElementById('close-drawer').click();
  const header=document.querySelector('body > header'),main=document.querySelector('main'),beforeHeader=header.inert,beforeMain=main.inert;header.inert=true;document.body.style.overflow='scroll';document.getElementById('search').focus();
  for(let i=0;i<3;i++)document.querySelector('#results button[data-project-id="'+id+'"]').click();
  assert(main.inert,'Drawer isolates background');assert(document.body.style.overflow==='hidden','Drawer locks scroll');document.getElementById('close-drawer').click();assert(header.inert===true,'Preexisting inert preserved');assert(main.inert===beforeMain,'Main inert restored');assert(document.body.style.overflow==='scroll','Original overflow restored');assert(document.activeElement===document.getElementById('search'),'Original focus restored');header.inert=beforeHeader;document.body.style.overflow='';
  window.atlasLateResponse({ok:true,json:async()=>({records:[]})});await new Promise(r=>setTimeout(r,50));assert(document.querySelectorAll('#results button[data-project-id]').length===50,'Late response ignored');assert(detail.hidden,'Late response cannot reopen drawer');
  document.getElementById('search').value='qa-no-matching-project';document.getElementById('search').dispatchEvent(new Event('input',{bubbles:true}));assert(document.getElementById('atlas-empty-reset'),'Empty reset');document.getElementById('atlas-empty-reset').click();assert(document.querySelectorAll('#results button[data-project-id]').length===50,'Reset restores catalog');
  document.getElementById('atlas').scrollIntoView();output.textContent='PASS: atlas deadline, retry, project recovery, repeated drawer restoration and late response';
 }catch(e){output.textContent='FAIL: '+e.message;}
})();
