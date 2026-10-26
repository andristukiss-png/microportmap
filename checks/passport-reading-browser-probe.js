(()=>{
window.addEventListener('load',async()=>{
 const result=document.getElementById('mprc-probe');
 const wait=ms=>new Promise(done=>setTimeout(done,ms));
 const ok=(condition,msg)=>{if(!condition)throw Error(msg);};
 try{
  for(let i=0;i<130&&!window.MicroportReading?.getState().ready;i++)await wait(35);
  const api=window.MicroportReading;
  ok(api?.getState().ready,'reading controls did not initialize');
  ok(api.getState().actions===10,'expected ten reading actions');
  const root=document.getElementById('mprc-controls');
  ok(root?.tagName==='DETAILS','reader must use collapsible details');
  ok(!root.open,'reading toolbar should start collapsed');
  root.open=true;
  const items=[...root.querySelectorAll('[data-mprc-action]')];
  ok(items.length===10,'ten control buttons missing');
  const keys=['focus','tools','larger','smaller','normal-text','comfort','compact','expand','collapse','print'];
  ok(JSON.stringify(items.map(el=>el.dataset.mprcAction))===JSON.stringify(keys),'reader control identities incorrect');
  if(new URLSearchParams(location.search).has('snapshot')){
   window.scrollTo(0,0);
   result.textContent='PASS: open reading controls with ten compact responsive options';
   return;
  }
  items[0].click();ok(api.getState().focused,'focus mode inactive');
  ok(document.body.classList.contains('mprc-focus'),'focus class missing');
  const original=document.querySelector('main .columns');
  ok(original!==null,'original reported facts missing');
  items[1].click();ok(!api.getState().focused,'tools not restored');
  items[2].click();ok(api.getState().scale===1.1,'larger text failed');
  ok(getComputedStyle(original.querySelector('.card p')).fontSize!=='15px','reported fact text scaling failed');
  items[3].click();ok(api.getState().scale===1,'smaller text did not reverse');
  items[5].click();ok(api.getState().spacing==='comfortable','comfortable spacing failed');
  items[6].click();ok(api.getState().spacing==='compact','compact spacing failed');
  const expanded=[...document.querySelectorAll('main details')].filter(x=>x!==root);
  items[7].click();ok(expanded.every(x=>x.open),'expand-all failed');
  items[8].click();ok(expanded.every(x=>!x.open),'collapse-all failed');
  items[4].click();ok(api.getState().scale===1,'reset font failed');
  let prints=0;window.print=()=>{prints++;};
  items[9].click();ok(prints===1,'native print trigger not called');
  ok(root.querySelector('#mprc-status').textContent.toLowerCase().includes('print'),'print status absent');
  result.textContent='PASS: ten reversible reader controls; font, spacing, focus, section expansion and print';
 }catch(error){result.textContent='FAIL: '+error.message;}
});
})();