(()=>{
window.addEventListener('load',async()=>{
 const output=document.getElementById('mpf-probe');
 const wait=ms=>new Promise(done=>setTimeout(done,ms));
 const assert=(condition,msg)=>{if(!condition)throw Error(msg);};
 try{
  for(let i=0;i<140&&!window.MicroportFields?.getState().ready;i++)await wait(45);
  const tool=window.MicroportFields;
  assert(tool?.getState().ready,'field inspector did not load');
  assert(tool.getState().count===10,'expected ten distinct field actions');
  const root=document.getElementById('mpf-inspector');
  assert(root&&root.tagName==='DETAILS','inspector is not collapsible');
  assert(!root.open,'inspector should be collapsed by default');
  root.open=true;
  assert(root.querySelectorAll('[data-mpf-field]').length===10,'ten copy controls missing');
  assert(root.querySelectorAll('[data-mpf-field-row]').length===10,'ten source fields missing');
  const buttons=[...root.querySelectorAll('[data-mpf-field]')];
  const expected=['name','where','country','region','infrastructureType','reportedOperator','reportedEquipment','locationPrecision','reportDateLabel','sourceURL'];
  assert(JSON.stringify(buttons.map(x=>x.dataset.mpfField))===JSON.stringify(expected),'field ordering changed');
  const first=buttons[0];
  assert(first.getAttribute('aria-label').includes('Project title'),'accessible copy label missing');
  first.click();
  await wait(1200);
  const status=root.querySelector('#mpf-status').textContent;
  assert(status.includes('Project title'),'copy result did not identify the field: '+status);
  const copyText=tool.getFieldText('where');
  assert(copyText.includes('Research project:')&&copyText.includes('Reported value:'),'reported value not source-qualified');
  assert(copyText.includes('Original source: https://'),'original HTTPS source not included');
  assert(copyText.includes('Limitations:'),'operational limitations missing');
  const source=tool.getFieldText('sourceURL');
  assert(source.includes('Reported value: https://'),'source URL field missing');
  const manual=root.querySelector('.mpf-manual'),fallback=root.querySelector('.mpf-fallback'),statusNode=root.querySelector('#mpf-status');
  const descriptor=Object.getOwnPropertyDescriptor(navigator,'clipboard');
  const clipboard=value=>Object.defineProperty(navigator,'clipboard',{configurable:true,value});
  try{
   clipboard(undefined);
   for(const key of expected){
    assert(await tool.copyField(key)===false,'unsupported clipboard should use fallback');
    assert(manual.value===tool.getFieldText(key),'fallback lost exact field/source context');
    assert(!fallback.hidden&&document.activeElement===manual,'manual fallback focus missing');
    assert(manual.selectionStart===0&&manual.selectionEnd===manual.value.length,'manual fallback text not selected');
   }
   let finish;
   clipboard({writeText:()=>new Promise(resolve=>{finish=resolve;})});
   const older=tool.copyField('name');
   clipboard({writeText:async()=>{throw Error('Latest denied');}});
   await tool.copyField('where');
   const latest=statusNode.textContent,latestValue=manual.value;
   finish();assert(await older===false,'superseded success not ignored');
   assert(statusNode.textContent===latest&&manual.value===latestValue,'older success replaced newer fallback');
   let reject;
   clipboard({writeText:()=>new Promise((_,fail)=>{reject=fail;})});
   const rejected=tool.copyField('name');
   clipboard({writeText:async()=>{}});
   first.focus();await tool.copyField('where');const success=statusNode.textContent;
   reject(Error('Older denied'));assert(await rejected===false,'superseded denial not ignored');
   assert(fallback.hidden&&manual.value==='','older denial exposed stale fallback');
   assert(statusNode.textContent===success&&document.activeElement===first,'older denial changed feedback or stole focus');
   clipboard({writeText:()=>new Promise(()=>{})});
   assert(await tool.copyField('sourceURL')===false,'stalled clipboard did not time out');
   assert(!fallback.hidden&&manual.value===source,'timeout fallback missing original source context');
  }finally{
   if(descriptor)Object.defineProperty(navigator,'clipboard',descriptor);else delete navigator.clipboard;
  }
  output.textContent='PASS: ten field fallbacks, selection/focus, stale success/rejection isolation, copy timeout and source-qualified text';
 }catch(e){output.textContent='FAIL: '+e.message;}
});
})();