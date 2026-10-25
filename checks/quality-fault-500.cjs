'use strict';
// Run real application scripts through the existing controlled DOM harnesses.
// These are local behavioral checks, not browser/device or research verification.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const records=JSON.parse(fs.readFileSync('src/data/projects.json')).records;
function harness(name){const source=fs.readFileSync('checks/'+name+'.cjs','utf8');const end=source.indexOf('(async()=>{');assert(end>0);const module={exports:{}};vm.runInNewContext(source.slice(0,end)+'\nmodule.exports={setup};',{require,module,console,URL,URLSearchParams,Blob,Date,AbortController,setImmediate,setTimeout,clearTimeout});return module.exports.setup;}
const directory=harness('directory'),passport=harness('passport'),compare=harness('compare'),atlas=harness('atlas');
function csv(text){const rows=[];let row=[],field='',quoted=false;for(let i=0,s=text.replace(/^\uFEFF/,'');i<s.length;i++){const c=s[i];if(quoted){if(c==='"'&&s[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(field);field='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&s[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';}else field+=c;if(i===s.length-1&&(field||row.length)){row.push(field);rows.push(row);}}assert(!quoted);return rows;}
const year=p=>(p.reportDateLabel.match(/\b20\d{2}\b/)||[])[0]||'unknown';
const filters=p=>new URLSearchParams({q:p.name,country:p.country,type:p.infrastructureType,region:p.region,year:year(p),sort:'recent'});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cell=v=>{let s=String(v??'');return /^[\s\uFEFF]*[=+@-]/.test(s)?"'"+s:s;};
const quality=harness('quality');
const faults=[
 {name:'Whitespace-only project ID',flag:'Missing project ID',suppressLinks:true,make:p=>[{...p,id:' \t '}]},
 {name:'Path-like project ID',flag:'Invalid project ID',suppressLinks:true,make:p=>[{...p,id:'../'+p.id}]},
 {name:'Duplicate project ID',flag:'Duplicate project ID',suppressLinks:true,make:p=>[p,{...p,name:p.name+' (synthetic duplicate)'}]},
 {name:'Missing project name',flag:'Missing project name',make:p=>[{...p,name:''}]},
 {name:'Non-HTTPS evidence URL',flag:'Missing or invalid HTTPS source URL',make:p=>[{...p,source:{...p.source,url:'http://example.invalid/'+p.id}}]},
 {name:'Credential-bearing evidence URL',flag:'Missing or invalid HTTPS source URL',make:p=>[{...p,source:{...p.source,url:'https://synthetic:fixture@example.invalid/'+p.id}}]},
 {name:'Missing map point',flag:'Missing map point',make:p=>[{...p,approximateMapPoint:null}]},
 {name:'String-valued map latitude',flag:'Invalid map point',make:p=>[{...p,approximateMapPoint:{latitude:String(p.approximateMapPoint.latitude),longitude:p.approximateMapPoint.longitude}}]},
 {name:'Missing report-date label',flag:'Missing report-date label',make:p=>[{...p,reportDateLabel:''}]},
 {name:'Whitespace-only operator',flag:'Missing operator',make:p=>[{...p,reportedOperator:' \t '}]}
];
const ledger=[];
(async()=>{
 for(const p of records){for(const fault of faults){const row={task:ledger.length+1,projectId:p.id,name:p.name,workflow:fault.name,expectedFlag:fault.flag,status:'pending',verificationMode:'local controlled DOM/VM; synthetic fixtures only'};try{
  const fixtures=fault.make(p),x=await quality({data:{records:fixtures},query:'?flag='+encodeURIComponent(fault.flag)});assert(x.fields.error.hidden);assert.equal(x.fetches,1);assert(x.fields['review-records'].innerHTML.includes(fault.flag));
  x.fields['audit-scope'].value='review';x.fields['audit-json'].click();const payload=JSON.parse(await x.blob.text());assert.equal(payload.scope,'review');assert.equal(payload.count,fixtures.length);assert.equal(payload.reviewFilters.flag,fault.flag);assert.deepEqual(payload.records.map(c=>c.record),fixtures);assert(payload.records.every(c=>c.flags.includes(fault.flag)));assert(x.link.removed);
  x.fields['audit-download'].click();const [headers,...rows]=csv(await x.blob.text());assert.equal(rows.length,fixtures.length);const passportIndex=headers.indexOf('Passport URL'),flagsIndex=headers.indexOf('Data review flags'),nameIndex=headers.indexOf('Project name');assert(passportIndex>=0&&flagsIndex>=0&&nameIndex>=0);rows.forEach((r,i)=>{assert(r[flagsIndex].includes(fault.flag));assert.equal(r[nameIndex],cell(fixtures[i].name));assert.equal(r[passportIndex],fault.suppressLinks?'':'https://microportmap.com/projects/'+p.id+'/');});
  if(fault.suppressLinks){assert(!x.fields['review-records'].innerHTML.includes('/projects/'));assert(!x.fields['review-records'].innerHTML.includes('/submit/?project='));assert(x.fields['review-records'].innerHTML.includes('Project ID needs review'));}else{assert(x.fields['review-records'].innerHTML.includes('/submit/?project='+p.id));}
  row.evidence={rows:fixtures.length,expectedFlag:true,reviewFilter:true,jsonExact:true,csvAgreement:true,linkHandling:true,singleFetch:true};row.status='passed';
 }catch(e){row.status='failed';row.error=String(e.stack||e);}ledger.push(row);}}
 const report={date:new Date().toISOString(),batch:'quality-fault-500',total:ledger.length,passed:ledger.filter(t=>t.status==='passed').length,failed:ledger.filter(t=>t.status==='failed').length,projects:records.length,workflows:faults.length,verificationMode:'Local controlled DOM/VM. In-memory fault fixtures never modify original research records.',tasks:ledger};fs.writeFileSync('checks/quality-fault-500-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,failures:ledger.filter(t=>t.status==='failed').map(t=>({task:t.task,projectId:t.projectId,workflow:t.workflow,error:t.error.split('\n').slice(0,7).join('\n')}))},null,2));assert.equal(report.total,500);if(report.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
