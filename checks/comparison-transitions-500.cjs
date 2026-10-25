'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const records=JSON.parse(fs.readFileSync('src/data/projects.json')).records,s=fs.readFileSync('checks/compare.cjs','utf8'),m={exports:{}};vm.runInNewContext(s.slice(0,s.indexOf('(async()=>{'))+'\nmodule.exports={setup}',{require,module:m,console,URL,URLSearchParams,Blob,Date,AbortController,setImmediate});const setup=m.exports.setup,ledger=[];
// Explicit expected states: no model of the application selection algorithm is used.
const sequences=[
 ['Forward selection then middle removal',[[0,[0]],[1,[0,1]],[2,[0,1,2]],[1,[0,2]]]],
 ['Reverse selection then first removal',[[2,[2]],[1,[2,1]],[0,[2,1,0]],[2,[1,0]]]],
 ['Alternate order then last removal',[[1,[1]],[0,[1,0]],[2,[1,0,2]],[2,[1,0]]]],
 ['Removed first project is appended when reselected',[[0,[0]],[1,[0,1]],[2,[0,1,2]],[0,[1,2]],[0,[1,2,0]]]],
 ['Removed middle project is appended when reselected',[[0,[0]],[1,[0,1]],[2,[0,1,2]],[1,[0,2]],[1,[0,2,1]]]],
 ['Fourth selection refused then accepted after a removal',[[0,[0]],[1,[0,1]],[2,[0,1,2]],[3,[0,1,2]],[1,[0,2]],[3,[0,2,3]]]],
 ['Clear then rebuild in a different order',[[0,[0]],[1,[0,1]],['clear',[]],[2,[2]],[0,[2,0]]]],
 ['Last removal clears comparison then selection recovers',[[0,[0]],[0,[]],[1,[1]],[0,[1,0]]]],
 ['Repeated state notifications retain selection order',[[2,[2]],['state',[2]],[0,[2,0]],['state',[2,0]],[1,[2,0,1]],['state',[2,0,1]]]],
 ['Full selection survives load recovery then removal',[[1,[1]],[2,[1,2]],[0,[1,2,0]],['loading',[1,2,0]],[2,[1,0]]]]
];
async function verify(x,indices,group){if(!indices.length){assert(x.fields['project-comparison'].hidden);assert(x.fields['comparison-json'].disabled);assert.equal(x.fields['comparison-table'].innerHTML,'');return}x.fields['comparison-json'].click();const data=JSON.parse(await x.blob.text());assert.deepEqual(data.records,indices.map(i=>group[i]));assert.deepEqual(data.selectedProjectIds,indices.map(i=>group[i].id));assert.equal(data.count,indices.length);assert.equal(new URL(x.location.href).searchParams.get('compare'),indices.map(i=>group[i].id).join(','));for(let i=0;i<group.length;i++){const b=x.cards.find(c=>c.dataset.projectId===group[i].id).children[0];assert.equal(b.attrs['aria-pressed'],String(indices.includes(i)));if(indices.length===3&&!indices.includes(i))assert(b.disabled)}}
(async()=>{for(let i=0;i<records.length;i++){const p=records[i],group=Array.from({length:4},(_,n)=>records[(i+n)%records.length]);for(const [behavior,steps] of sequences){try{const x=setup();for(const [action,expected] of steps){if(action==='clear')x.fields['comparison-clear'].click();else if(action==='state')x.state();else if(action==='loading'){x.state(false,true);assert(x.fields['comparison-json'].disabled);assert(x.fields['project-comparison'].hidden);x.state()}else x.toggle(group[action].id);await verify(x,expected,group)}ledger.push({project:p.id,behavior,passed:true,transitions:steps.length})}catch(e){ledger.push({project:p.id,behavior,passed:false,error:e.stack})}}}
const report={total:ledger.length,passed:ledger.filter(x=>x.passed).length,failed:ledger.filter(x=>!x.passed).length,mode:'Local controlled DOM/VM with real comparison script; exact original JSON verified after each transition.',checks:ledger};fs.writeFileSync('checks/comparison-transitions-500-results.json',JSON.stringify(report,null,2)+'\n');fs.writeFileSync('checks/comparison-transitions-500-ledger.json',JSON.stringify(ledger.map(x=>[x.project,x.behavior,x.passed?'PASS':'FAIL']),null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,firstFailure:ledger.find(x=>!x.passed)},null,2));assert.equal(report.total,500);if(report.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
