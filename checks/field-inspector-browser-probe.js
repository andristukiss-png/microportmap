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
  output.textContent='PASS: ten original fields, collapsed default, copy action, manual fallback, HTTPS source and caveats';
 }catch(e){output.textContent='FAIL: '+e.message;}
});
})();