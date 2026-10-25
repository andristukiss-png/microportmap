'use strict';
// 50 research identities x 10 synthetic variants x 4 UI workflows = 2,000 cases.
// Controlled local DOM/VM execution, not real browser/mobile verification.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const records=JSON.parse(fs.readFileSync('src/data/projects.json','utf8')).records;
function harness(name){
  const script=fs.readFileSync('checks/'+name+'.cjs','utf8'),stop=script.indexOf('(async()=>{');
  assert(stop>0,'missing setup extraction point in '+name);
  const module={exports:{}};
  vm.runInNewContext(script.slice(0,stop)+'\nmodule.exports={setup}',{require,module,console,URL,URLSearchParams,Blob,Date,AbortController,setImmediate,setTimeout,clearTimeout});
  return module.exports.setup;
}
const directory=harness('directory'),atlas=harness('atlas'),compare=harness('compare');
const fixtures=[
  ['name-image','name','<img src=x onerror=alert(1)> Report'],
  ['name-script','name','Pilot </button><script>alert("x")</script> Delta'],
  ['name-unicode','name','Research "α & β" <field> 港'],
  ['where-svg','where','Site <svg/onload=alert(1)>'],
  ['where-multiline','where','East & "West" <Dock>\nCafé 港'],
  ['operator-iframe','reportedOperator','<iframe src=javascript:alert(1)>Operator</iframe>'],
  ['operator-quote','reportedOperator','Operator "A&B" / Δοκιμή'],
  ['status-script','verificationStatus','Review </td><script>unsafe()</script>'],
  ['source-scheme','source','javascript:alert(1)'],
  ['source-credentials','source','https://user:password@evidence.example.invalid/report']
];
const paths=['directory-card','atlas-results','atlas-drawer','comparison-table'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeSource=p=>{try{const u=new URL(p.source?.url);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
function safeHTML(html){assert(!/<(?:script|iframe|svg|img)(?:[\s/>])/i.test(html),'executable fixture HTML leaked into document');}
function showField(html,p,field,visible){
  if(visible.includes(field))assert(html.includes(esc(p[field])),'missing escaped '+field);
  safeHTML(html);
}
function showSource(html,p,context){
  const source=safeSource(p);
  if(source)assert(html.includes('href="'+esc(source)+'"'),context+': safe source link missing');
  else {
    assert(!html.includes('href="javascript:'),context+': unsafe JavaScript link');
    assert(!html.includes('user:password'),context+': URL credentials disclosed');
    if(context==='comparison')assert(html.includes('Source unavailable'));
    else assert(!html.includes('Original source ↗'),context+': unsafe source action shown');
  }
}
const ledger=[];
async function test(p,v,workflow,fn){
  const row={task:ledger.length+1,projectId:p.id,variant:v[0],workflow,status:'pending'};
  try{await fn();row.status='passed';}catch(e){row.status='failed';row.error=String(e.stack||e);}
  ledger.push(row);
}
(async()=>{
  assert.equal(records.length,50);
  for(const p of records)for(const v of fixtures){
    const clone=v[1]==='source'?{...p,source:{...p.source,url:v[2]}}:{...p,[v[1]]:v[2]};
    const payload={records:[clone]};
    let viewPromise;
    const view=()=>viewPromise||(viewPromise=atlas('',{data:payload}));
    await test(p,v,paths[0],async()=>{
      const x=await directory('',{data:payload}),html=x.f.results.innerHTML;
      assert(x.f.error.hidden);
      assert.equal(x.f.count.textContent,'1 of 1 projects');
      assert.deepEqual(Array.from(x.context.window.mpFilteredRecords,r=>r.id),[p.id]);
      assert(html.includes('data-project-id="'+p.id+'"'));
      assert(html.includes('/projects/'+p.id+'/'));
      assert(html.includes('/submit/?project='+p.id));
      showField(html,clone,v[1],['name','where','reportedOperator','verificationStatus']);
      showSource(html,clone,'directory');
    });
    await test(p,v,paths[1],async()=>{
      const x=await view(),list=x.f.results;
      assert.equal(list.children.length,1);
      assert.equal(list.children[0].dataset.projectId,p.id);
      assert.equal(x.f['result-total'].textContent,'1 PROJECT');
      assert.equal(x.f['fallback-pins'].children.length,1);
      assert.equal(x.f['fallback-pins'].children[0].attrs['aria-label'],'View '+clone.name);
      showField(list.children[0].innerHTML,clone,v[1],['name','where']);
      assert.equal(new URL(x.location.href).searchParams.get('project'),null);
    });
    await test(p,v,paths[2],async()=>{
      const x=await view();
      x.f.results.children[0].listeners.click();
      assert(!x.f.detail.hidden&&!x.f.backdrop.hidden);
      assert(x.main.inert&&x.header.inert&&x.footer.inert);
      assert.strictEqual(x.doc.activeElement,x.f['close-drawer']);
      const html=x.f['detail-content'].innerHTML;
      showField(html,clone,v[1],['name','where','reportedOperator','verificationStatus']);
      showSource(html,clone,'atlas-drawer');
      assert(html.includes('/submit/?project='+p.id));
      assert.equal(new URL(x.location.href).searchParams.get('project'),p.id);
      x.listeners.keydown({key:'Escape',preventDefault(){}});
      assert(x.f.detail.hidden&&x.f.backdrop.hidden);
      assert(!x.main.inert&&!x.header.inert&&!x.footer.inert);
      assert.equal(new URL(x.location.href).searchParams.get('project'),null);
    });
    await test(p,v,paths[3],async()=>{
      const x=compare('?compare='+p.id,[clone]),html=x.fields['comparison-table'].innerHTML;
      assert(!x.fields['project-comparison'].hidden);
      assert(html.includes('/projects/'+p.id+'/?compare='+p.id));
      assert(html.includes('/?project='+p.id+'#atlas'));
      showField(html,clone,v[1],['name','where','reportedOperator','verificationStatus']);
      showSource(html,clone,'comparison');
      x.fields['comparison-json'].click();
      const out=JSON.parse(await x.blob.text());
      assert.equal(out.count,1);
      assert.deepEqual(out.selectedProjectIds,[p.id]);
      assert.deepEqual(out.records,[clone]);
      assert(x.link.removed);
    });
  }
  const passed=ledger.filter(r=>r.status==='passed').length,failed=ledger.length-passed;
  const mode='Local controlled DOM/VM synthetic field fixtures; not a live browser, mobile device, tile-source, evidence accuracy, or email delivery test.';
  const report={batch:'visible-fields-2000',total:ledger.length,passed,failed,projects:records.length,variants:fixtures.map(([key,field])=>({key,field})),workflows:paths,mode,checks:ledger};
  fs.writeFileSync('checks/visible-fields-2000-results.json',JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync('checks/visible-fields-2000-ledger.json',JSON.stringify(ledger.map(r=>[r.task,r.projectId,r.variant,r.workflow,r.status]),null,2)+'\n');
  fs.writeFileSync('checks/visible-fields-2000-status.json',JSON.stringify({total:ledger.length,passed,failed,mode,unverified:['Real mobile/device visuals','Online map tile reachability','Independent research accuracy','Submission inbox connection']},null,2)+'\n');
  console.log(JSON.stringify({total:ledger.length,passed,failed,firstFailure:ledger.find(r=>r.status==='failed')},null,2));
  assert.equal(ledger.length,2000);
  if(failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
