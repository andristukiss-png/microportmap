'use strict';
// 50 original projects x 10 URL/filter scenarios x 4 independent handoff
// workflows = 2,000 controlled DOM/VM cases. No production mutations.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const originals=JSON.parse(fs.readFileSync('src/data/projects.json','utf8')).records;
function harness(name) {
  const source=fs.readFileSync('checks/'+name+'.cjs','utf8');
  const cut=source.indexOf('(async()=>{');
  assert(cut>0,'Missing setup export for '+name);
  const module={exports:{}};
  vm.runInNewContext(source.slice(0,cut)+'\nmodule.exports={setup}',{
    require,module,console,URL,URLSearchParams,Blob,Date,AbortController,
    setImmediate,setTimeout,clearTimeout
  });
  return module.exports.setup;
}
const directory=harness('directory'),atlas=harness('atlas'),
  compare=harness('compare'),passport=harness('passport');
const year=p=>(String(p.reportDateLabel||'').match(/\b20[0-9]{2}\b/)||[])[0]||'unknown';
const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function matches(p,q) {
  const terms=fold(q).trim().split(/\s+/).filter(Boolean);
  const corpus=fold([p.name,p.where,p.country,p.region,p.infrastructureType,
    p.reportedOperator,p.reportedEquipment,p.description,
    typeof p.source==='string'?p.source:p.source?.name].join(' '));
  return terms.every(s=>corpus.includes(s));
}
function context(p,index) {
  const base=[
    ['country-and-name-sort',{country:p.country}],
    ['category-country-sort',{type:p.infrastructureType,sort:'country'}],
    ['region-year-recent',{region:p.region,year:year(p),sort:'recent'}],
    ['exact-name-country',{q:p.name,country:p.country}],
    ['operator-region',{q:p.reportedOperator,region:p.region}],
    ['equipment-category',{q:p.reportedEquipment,type:p.infrastructureType}],
    ['uppercased-name',{q:'  '+p.name.toUpperCase().replace(/ /g,'   ')+'  ',country:p.country}],
    ['reversed-country-name',{q:p.country+' '+p.name,sort:'recent'}],
    ['empty-country-query',{q:'nonexistent-project-'+p.id,country:p.country,sort:'country'}],
    ['all-structured-filters',{q:p.region+' '+p.name,country:p.country,
      type:p.infrastructureType,region:p.region,year:year(p),sort:'country'}]
  ];
  const [label,fields]=base[index];
  const params=new URLSearchParams(fields);
  return {label,fields,params};
}
function expected(rows,fields,atlasOnly=false) {
  const q=fields.q||'';
  const matched=rows.filter(p=>
    (!fields.country||p.country===fields.country) &&
    (!fields.type||p.infrastructureType===fields.type) &&
    (atlasOnly||!fields.region||p.region===fields.region) &&
    (atlasOnly||!fields.year||year(p)===fields.year) &&
    matches(p,q));
  if(atlasOnly)return matched;
  if(fields.sort==='country')matched.sort((a,b)=>
    String(a.country||'').localeCompare(String(b.country||''))||a.name.localeCompare(b.name));
  else if(fields.sort==='recent')matched.sort((a,b)=>
    (Number(year(b))||0)-(Number(year(a))||0)||a.name.localeCompare(b.name));
  else matched.sort((a,b)=>a.name.localeCompare(b.name));
  return matched;
}
const keys=['q','country','type','region','year','sort'];
function preserveFilters(actual,values) {
  for(const key of keys)assert.equal(actual.searchParams.get(key),values[key]||null,
    'Bad preserved filter '+key);
  for(const key of ['token','redirect','admin'])assert(!actual.searchParams.has(key),
    'Unrelated parameter leaked: '+key);
}
const ledger=[];
async function task(p,scenario,workflow,fn) {
  const result={task:ledger.length+1,projectId:p.id,scenario:scenario.label,workflow,status:'pending'};
  try { await fn();result.status='passed'; }
  catch(e){result.status='failed';result.error=String(e.stack||e);}
  ledger.push(result);
}
(async()=>{
  assert.equal(originals.length,50);
  assert.equal(new Set(originals.map(p=>p.id)).size,50);
  for(let i=0;i<originals.length;i++){
    const p=originals[i],other=originals[(i+1)%originals.length];
    for(let k=0;k<10;k++){
      const scenario=context(p,k),fields=scenario.fields,params=scenario.params;
      const ids=[p.id,other.id],selection=ids.join(',');
      const filterQuery=params.toString();
      let directoryView,passportRoute;
      await task(p,scenario,'directory-filter-history',async()=>{
        const x=await directory('?'+filterQuery);
        directoryView=x;
        const actual=Array.from(x.context.window.mpFilteredRecords,r=>r.id);
        const wanted=expected(originals,fields).map(r=>r.id);
        assert.deepEqual(actual,wanted);
        assert.equal(x.f.count.textContent,wanted.length+' of 50 projects');
        assert.equal(x.f.search.value,fields.q||'');
        const url=new URL(x.location.href);
        for(const key of keys){
          if(key==='sort')assert.equal(url.searchParams.get('sort')||'name',fields.sort||'name');
          else assert.equal(url.searchParams.get(key),fields[key]||null);
        }
        if(wanted.length){
          assert(x.f.results.innerHTML.includes('/projects/'+wanted[0]+'/'));
          assert(x.f.results.innerHTML.includes('/submit/?project='+wanted[0]));
        }else{
          assert(x.f.results.innerHTML.includes('empty-reset'));
        }
        // Exercise actual popstate recovery, including zero-result searches.
        x.location.href='https://microportmap.com/directory/?'+filterQuery;
        x.events.popstate();
        assert.deepEqual(Array.from(x.context.window.mpFilteredRecords,r=>r.id),wanted);
      });
      await task(p,scenario,'atlas-deeplink-filter-recovery',async()=>{
        const atlasParams=new URLSearchParams();
        for(const key of ['q','country','type'])if(fields[key])atlasParams.set(key,fields[key]);
        atlasParams.set('project',p.id);
        const x=await atlas('?'+atlasParams.toString()+'#explore');
        const wanted=expected(originals,fields,true);
        assert.equal(x.f.results.children.length,wanted.length);
        assert.deepEqual(Array.from(x.f.results.children,c=>c.dataset.projectId),wanted.map(r=>r.id));
        assert.equal(x.f['fallback-pins'].children.length,wanted.length);
        assert.equal(x.f['shown-count'].textContent,wanted.length+' / 50');
        assert.equal(x.f['result-total'].textContent,wanted.length+
          (wanted.length===1?' PROJECT':' PROJECTS'));
        assert(!x.f.detail.hidden,'known requested project must open even when filters hide it');
        assert(x.f['detail-content'].innerHTML.includes('/submit/?project='+p.id));
        assert(x.main.inert&&x.header.inert&&x.footer.inert);
        assert.equal(new URL(x.location.href).hash,'#atlas');
        x.listeners.keydown({key:'Escape',preventDefault(){}});
        assert(x.f.detail.hidden&&!x.main.inert&&!x.header.inert&&!x.footer.inert);
        const url=new URL(x.location.href);
        assert(!url.searchParams.has('project'));
        for(const key of ['q','country','type'])
          assert.equal(url.searchParams.get(key),fields[key]||null);
      });
      await task(p,scenario,'comparison-to-passport-filter-handoff',async()=>{
        // Use the normalized directory view, never trust stale/unrelated URL keys.
        const viewSearch=new URL(directoryView.location.href).search;
        const x=compare('?compare='+encodeURIComponent(selection)+'&token=do-not-forward',originals,
          {viewSearch});
        assert(!x.fields['project-comparison'].hidden);
        x.fields['comparison-json'].click();
        const data=JSON.parse(await x.blob.text());
        assert.deepEqual(data.selectedProjectIds,ids);
        assert.deepEqual(data.records,[p,other]);
        assert(x.link.removed);
        const html=x.fields['comparison-table'].innerHTML;
        const link=html.match(new RegExp('href="([^"]*\\/projects\\/'+p.id+'\\/\\?[^"]+)"'));
        assert(link,'Missing comparison passport link for '+p.id);
        passportRoute=new URL(link[1].replace(/&amp;/g,'&'),'https://microportmap.com');
        assert.equal(passportRoute.pathname,'/projects/'+p.id+'/');
        assert.equal(passportRoute.searchParams.get('compare'),selection);
        // sort=name is omitted by normalized directory state.
        const normalized={...fields};if(normalized.sort==='name')delete normalized.sort;
        preserveFilters(passportRoute,normalized);
        assert(html.includes('/?project='+p.id+'#atlas'));
      });
      await task(p,scenario,'passport-return-canonical-and-export',async()=>{
        assert(passportRoute,'comparison handoff missing');
        const x=await passport({id:p.id,query:passportRoute.search,
          ...(k===8?{error:true}:{})});
        const back=x.get('project-compare-link');
        const url=new URL(back.href,'https://microportmap.com');
        assert.equal(url.pathname,'/directory/');
        assert.equal(url.searchParams.get('compare'),selection);
        assert.equal(url.hash,'#project-comparison');
        const normalized={...fields};if(normalized.sort==='name')delete normalized.sort;
        preserveFilters(url,normalized);
        assert.equal(back.attrs['aria-label'],'Return to comparison of 2 projects');
        assert(x.get('project-copy-link'),'Copy action must exist');
        if(k===8){
          assert(!x.get('project-data-retry').hidden);
          assert(x.get('project-download-json').disabled);
          await x.get('project-data-retry').click();
        }
        assert(!x.get('project-download-json').disabled);
        await x.get('project-copy-link').click();
        assert.equal(x.copied,'https://microportmap.com/projects/'+p.id+'/');
        x.get('project-download-json').click();
        const data=JSON.parse(await x.blob.text());
        assert.equal(data.count,1);
        assert.deepEqual(data.records,[p]);
        assert(x.link.removed);
      });
    }
  }
  const passed=ledger.filter(r=>r.status==='passed').length,failed=ledger.length-passed;
  const report={batch:'cross-view-2000',total:ledger.length,passed,failed,projects:originals.length,
    scenarios:10,workflows:['directory-filter-history','atlas-deeplink-filter-recovery',
      'comparison-to-passport-filter-handoff','passport-return-canonical-and-export'],
    verificationMode:'Local controlled DOM/VM with original 50 records and synthetic URL/filter states; no live mobile/device, online map tile, evidence or inbox checks.',
    cases:ledger};
  fs.writeFileSync('checks/cross-view-2000-results.json',JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync('checks/cross-view-2000-ledger.json',JSON.stringify(ledger.map(r=>
    [r.task,r.projectId,r.scenario,r.workflow,r.status]),null,2)+'\n');
  fs.writeFileSync('checks/cross-view-2000-status.json',JSON.stringify({
    total:ledger.length,passed,failed,mode:report.verificationMode,
    unverified:['Real mobile/device visuals','Live online map tiles','Independent research accuracy','Submission inbox']
  },null,2)+'\n');
  console.log(JSON.stringify({total:ledger.length,passed,failed,firstFailures:ledger.filter(r=>r.status==='failed').slice(0,4)},null,2));
  assert.equal(ledger.length,2000);
  if(failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
