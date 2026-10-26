(()=>{
window.addEventListener('load',async()=>{
 const target=document.getElementById('mpe-test-status');
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
 const fire=(node,type='change')=>node.dispatchEvent(new Event(type,{bubbles:true}));
 try{
  for(let i=0;i<180&&!window.MicroportEquipment?.getState().loaded;i++)await pause(40);
  const tool=window.MicroportEquipment;
  assert(tool?.getState().loaded,'equipment catalog not loaded');
  assert(tool.getState().matching===50,'initial research count not 50');
  assert(tool.getTypes().length===7,'expected seven infrastructure types');
  assert(tool.getLabels().length===36,'expected 36 distinct exact equipment labels');
  assert(document.body.classList.contains('mpe-ready'),'static fallback not hidden after loading');
  assert(document.querySelectorAll('.mpe-stat').length===5,'five overview counts missing');
  assert(document.querySelectorAll('.mpe-category').length===7,'seven category cards missing');
  assert(document.querySelectorAll('.mpe-equipment-item').length===10,'initial equipment pagination not ten');
  assert(document.querySelectorAll('.mpe-table tr').length===6,'comparison initial rows missing');
  const kind=document.getElementById('mpe-type');kind.value='Industrial dock';fire(kind);
  assert(tool.getState().type==='Industrial dock','category filter did not apply');
  assert(tool.getState().matching>0&&tool.getState().matching<50,'category matching subset invalid');
  assert(location.search.includes('tech_type=Industrial+dock'),'filtered URL not synchronized');
  const query=document.getElementById('mpe-search');query.value='qwertynoappearingrecord';fire(query,'input');
  assert(tool.getState().matching===0,'empty text should match zero');
  assert(document.querySelector('.mpe-empty'),'empty state absent');
  document.querySelector('.mpe-filters>.mpe-secondary').click();
  assert(tool.getState().matching===50,'clear filters did not reset');
  document.getElementById('mpe-equipment-sort').value='alpha';fire(document.getElementById('mpe-equipment-sort'));
  document.querySelector('.mpe-more button:first-child').click();
  assert(document.querySelectorAll('.mpe-equipment-item').length===20,'show more equipment missing');
  document.querySelector('.mpe-equipment-item').click();
  assert(tool.getState().equipment,'equipment label click did not filter');
  assert(document.querySelector('.mpe-project-card a[href^="/projects/"]'),'research passport not linked');
  assert(document.getElementById('mpe-projects').hidden===false,'project view not activated');
  const chip=[...document.querySelectorAll('.mpe-chip')].find(x=>x.getAttribute('aria-label')?.includes('Equipment'));
  assert(chip,'equipment active chip missing');chip.click();
  assert(tool.getState().equipment==='','equipment active chip failed');
  document.querySelector('.mpe-compare-controls button').click();
  assert(document.querySelectorAll('.mpe-table tr').length===6,'category swap comparison failed');
  const year=document.getElementById('mpe-year');
  assert([...year.options].some(o=>o.value==='Unspecified'),'missing unspecified report-year choice');
  const country=document.getElementById('mpe-country');country.value='Germany';fire(country);
  assert(tool.getState().country==='Germany','country filter failed');
  assert(document.querySelector('.mpe-outputs a[href^="/directory/"]'),'directory handoff missing');
  assert(document.querySelectorAll('.mpe-outputs button').length===3,'CSV JSON and share controls missing');
  target.textContent='PASS: 50 original records, seven categories, 36 exact labels, filters, empty state, URL, drilldown, compare and exports';
 }catch(err){target.textContent='FAIL: '+err.message;}
});
})();