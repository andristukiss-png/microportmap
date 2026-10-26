(()=>{
window.addEventListener('load',async()=>{
 const result=document.getElementById('mpr-test-result');
 const delay=t=>new Promise(r=>setTimeout(r,t));
 const ok=(v,m)=>{if(!v)throw Error(m);};
 try{
  for(let i=0;i<150&&!window.MicroportReview?.getState().ready;i++)await delay(40);
  const api=window.MicroportReview;
  ok(api?.getState().ready,'review workspace not loaded');
  ok(api.getState().total===10,'ten review questions missing');
  const root=document.getElementById('mpr-workspace');
  ok(root&&root.dataset.mprLoaded==='true','review panel missing');
  const selects=[...root.querySelectorAll('[data-mpr-status]')],notes=[...root.querySelectorAll('[data-mpr-note]')];
  ok(selects.length===10&&notes.length===10,'ten accessible note and status inputs missing');
  ok(root.querySelectorAll('.mpr-item').length===10,'task card count incorrect');
  selects[0].value='reviewed';selects[0].dispatchEvent(new Event('change',{bubbles:true}));
  notes[1].value='Check independent publication against original claims';
  notes[1].dispatchEvent(new Event('input',{bubbles:true}));
  selects[1].value='follow-up';selects[1].dispatchEvent(new Event('change',{bubbles:true}));
  ok(api.getState().reviewed===1&&api.getState().followUp===1,'review state not updated');
  ok(api.getTasks()[1].note.includes('Check independent'),'private note missing');
  const data=JSON.parse(localStorage.getItem('microportmap.review-workspace.v1'));
  ok(data?.[api.getState().projectId]?.source?.status==='reviewed','browser local storage not updated');
  ok(root.querySelector('[role=progressbar]').getAttribute('aria-valuenow')==='2','progress aria not updated');
  ok(root.querySelectorAll('.mpr-evidence-item').length===4,'source context missing');
  ok(root.querySelector('.mpr-actions a[href^="https://"]'),'original source link missing');
  ok(root.querySelector('.mpr-actions button'),'exports missing');
  const reset=[...root.querySelectorAll('.mpr-actions button')].find(x=>x.textContent.includes('Reset this project'));
  window.confirm=()=>true;reset.click();
  ok(api.getState().reviewed===0&&api.getState().followUp===0,'review reset failed');
  result.textContent='PASS: ten review questions, local private notes, progress, export actions, source links and reset';
 }catch(e){result.textContent='FAIL: '+e.message;}
});
})();