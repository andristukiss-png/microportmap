(()=>{
window.addEventListener('load',async()=>{
 const target=document.getElementById('mpq-test-result');
 const wait=ms=>new Promise(done=>setTimeout(done,ms));
 const ok=(value,msg)=>{if(!value)throw Error(msg);};
 try{
  for(let i=0;i<150&&!window.MicroportQuickNav?.getState().ready;i++)await wait(40);
  const api=window.MicroportQuickNav,state=api?.getState();
  ok(state?.ready,'quick navigation not loaded');
  ok(state.actions===10,'ten shortcuts not registered');
  ok(api.getCountryURL().includes('country='),'project country handoff missing');
  const root=document.getElementById('mpq-navigation');
  ok(root?.tagName==='DETAILS','quick navigation is not a collapsible panel');
  ok(!root.open,'quick navigation must begin closed');
  root.open=true;
  const controls=[...root.querySelectorAll('[data-mpq-action]')];
  ok(controls.length===10,'ten working shortcut controls missing');
  ok(controls.every(x=>x.getAttribute('aria-label')),'shortcut labels inaccessible');
  const expected=['overview','facts','related','citation','inspector','comparison','geography','review','saved','country'];
  ok(JSON.stringify(controls.map(x=>x.dataset.mpqAction))===JSON.stringify(expected),'shortcut order changed');
  if(new URLSearchParams(location.search).has('snapshot')){
   window.scrollTo(0,0);
   target.textContent='PASS: ten compact source navigation actions captured';
   return;
  }
  await api.activate('inspector');
  ok(document.getElementById('mpf-inspector')?.open,'field inspector not opened by quick navigation');
  await api.activate('comparison');
  ok(document.getElementById('mpd-compare')?.open,'evidence comparison not opened by quick navigation');
  await api.activate('geography');
  ok(document.getElementById('mpl-location')?.open,'geographic context not opened by quick navigation');
  await api.activate('overview');
  ok(root.querySelector('#mpq-status').textContent.includes('overview'),'overview feedback missing');
  target.textContent='PASS: ten controls, correct country URL, overview, comparison, geography and inspector navigation';
 }catch(e){target.textContent='FAIL: '+e.message;}
});
})();