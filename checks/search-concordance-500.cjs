'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const records=JSON.parse(fs.readFileSync('src/data/projects.json')).records;
function harness(name){const s=fs.readFileSync('checks/'+name+'.cjs','utf8'),m={exports:{}};vm.runInNewContext(s.slice(0,s.indexOf('(async()=>{'))+'\nmodule.exports={setup}',{require,module:m,console,URL,URLSearchParams,Blob,Date,AbortController,setImmediate,setTimeout,clearTimeout});return m.exports.setup}
const directory=harness('directory'),atlas=harness('atlas'),ledger=[];
async function task(p,behavior,query,{empty=false,all=false}={}){try{
 const params='?'+new URLSearchParams({q:query}),d=await directory(params),a=await atlas(params);
 const dids=Array.from(d.context.window.mpFilteredRecords,r=>r.id).sort(),aids=Array.from(a.f.results.children,r=>r.dataset.projectId).sort();assert.deepEqual(dids,aids);
 if(empty)assert.equal(dids.length,0);else if(all)assert.equal(dids.length,50);else assert(dids.includes(p.id));
 assert.equal(new URL(d.location.href).searchParams.get('q')||'',query.trim());assert.equal(new URL(a.location.href).searchParams.get('q')||'',query.trim());
 // A generated directory URL must reconstruct the same set in a fresh instance.
 const restored=await directory(new URL(d.location.href).search);assert.deepEqual(Array.from(restored.context.window.mpFilteredRecords,r=>r.id).sort(),dids);
 if(!empty&&!all){const card=a.f.results.children.find(c=>c.dataset.projectId===p.id);card.listeners.click();assert(!a.f.detail.hidden);assert(a.f['detail-content'].innerHTML.includes('/submit/?project='+p.id));a.listeners.keydown({key:'Escape',preventDefault(){}});assert.equal(new URL(a.location.href).searchParams.get('q'),query.trim())}
 ledger.push({project:p.id,behavior,passed:true,matches:dids.length});
 }catch(e){ledger.push({project:p.id,behavior,passed:false,error:e.stack})}}
(async()=>{for(const p of records){
 await task(p,'Uppercase full-name search agrees across directory and atlas',p.name.toUpperCase());
 await task(p,'Decomposed Unicode full-name search restores matching set',p.name.normalize('NFD'));
 await task(p,'Accent-stripped full-name search retains original project',p.name.normalize('NFD').replace(/[\u0300-\u036f]/g,''));
 await task(p,'Reversed name word order agrees across both search surfaces',p.name.split(/\s+/).reverse().join(' '));
 await task(p,'Mixed whitespace name query restores consistently',p.name.split(/\s+/).join('\t \n'));
 await task(p,'Combined project and country terms keep original project',p.name+' '+p.country);
 await task(p,'Operator and project terms preserve cross-field matching',p.reportedOperator+' '+p.name.split(/\s+/)[0]);
 await task(p,'Region and infrastructure terms agree across atlas and directory',p.region+' '+p.infrastructureType);
 await task(p,'Unique absent term produces no results on either surface','search-concordance-absent-'+p.id,{empty:true});
 await task(p,'Whitespace-only search restores all original records',' \t\n ',{all:true});
 }
 const result={total:ledger.length,passed:ledger.filter(x=>x.passed).length,failed:ledger.filter(x=>!x.passed).length,mode:'Local controlled DOM/VM differential journeys across directory and atlas; no browser/device verification.',checks:ledger};fs.writeFileSync('checks/search-concordance-500-results.json',JSON.stringify(result,null,2)+'\n');fs.writeFileSync('checks/search-concordance-500-ledger.json',JSON.stringify(ledger.map(x=>[x.project,x.behavior,x.passed?'PASS':'FAIL']),null,2)+'\n');console.log(JSON.stringify({total:result.total,passed:result.passed,failed:result.failed,firstFailure:ledger.find(x=>!x.passed)},null,2));assert.equal(result.total,500);if(result.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
