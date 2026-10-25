'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const records=JSON.parse(fs.readFileSync('src/data/projects.json')).records;
function harness(name){const s=fs.readFileSync('checks/'+name+'.cjs','utf8'),m={exports:{}};vm.runInNewContext(s.slice(0,s.indexOf('(async()=>{'))+'\nmodule.exports={setup}',{require,module:m,console,URL,URLSearchParams,Blob,Date,AbortController,setImmediate,setTimeout,clearTimeout});return m.exports.setup}
const directory=harness('directory'),compare=harness('compare'),passport=harness('passport');
const s=fs.readFileSync('checks/advanced-500.cjs','utf8'),m={exports:{}};vm.runInNewContext(s.slice(0,s.lastIndexOf('\n(async()=>{'))+'\nmodule.exports={csv}',{require,module:m,console,URL,URLSearchParams,Blob,Date,AbortController,setImmediate,setTimeout,clearTimeout});const csv=m.exports.csv;
function jsonButton(x){const create=x.context.document.createElement;let b;x.context.document.createElement=tag=>{const el=create(tag);if(tag==='button')b=el;return el};vm.runInNewContext(fs.readFileSync('src/directory-json-export.js','utf8'),x.context);return b}
const fields=['name','where','country','region','infrastructureType','reportedOperator','reportedEquipment','locationPrecision','reportDateLabel','verificationStatus'];
const variants=[['CSV quote/comma','Research, "quoted" value'],['Multiline Unicode','Café 港\r\nΔοκιμή\nSecond line'],['Whitespace-prefixed formula',' \t=SUM("research",2)'],['HTML-like literal','<b data-reference="public">Research & evidence</b>']];
const guarded=value=>{const s=String(value??'');return /^[\s\uFEFF]*[=+@-]/.test(s)?"'"+s:s},ledger=[];
function verifyCSV(blobText,p){const rows=csv(blobText);assert.equal(rows.length,2);assert.equal(rows[0].length,12);assert.equal(rows[1].length,12);rows[0].forEach((key,i)=>assert.equal(rows[1][i],guarded(key==='sourceUrl'?p.source.url:p[key])));return Object.fromEntries(rows[0].map((key,i)=>[key,rows[1][i]]))}
(async()=>{for(const p of records)for(const field of fields)for(const [variant,text] of variants){try{
 const clone={...p,[field]:text+' / '+p.id},d=await directory('',{data:{records:[clone]}}),c=compare('?compare='+p.id,[clone]);
 assert(d.f.error.hidden);d.f['export-csv'].click();c.fields['comparison-csv'].click();assert.deepEqual(verifyCSV(await d.blob.text(),clone),verifyCSV(await c.blob.text(),clone));assert(d.link.removed&&c.link.removed);assert.equal(d.blob.type,'text/csv;charset=utf-8');assert.equal(c.blob.type,'text/csv;charset=utf-8');
 jsonButton(d).click();const dj=JSON.parse(await d.blob.text());assert.deepEqual(dj.records,[clone]);assert.equal(dj.count,1);assert(d.link.removed);
 c.fields['comparison-json'].click();const cj=JSON.parse(await c.blob.text());assert.deepEqual(cj.records,[clone]);assert.deepEqual(cj.selectedProjectIds,[p.id]);assert(c.link.removed);
 const pass=await passport({id:p.id,data:{records:[clone]}});assert(!pass.get('project-download-json').disabled);pass.get('project-download-json').click();assert.deepEqual(JSON.parse(await pass.blob.text()).records,[clone]);assert(pass.link.removed);
 ledger.push({project:p.id,field,variant,passed:true});
 }catch(e){ledger.push({project:p.id,field,variant,passed:false,error:e.stack})}}
 const result={total:ledger.length,passed:ledger.filter(x=>x.passed).length,failed:ledger.filter(x=>!x.passed).length,projects:50,fields:fields.length,variants:variants.length,mode:'Local controlled DOM/VM with isolated synthetic field values. Each case checks two CSV and three JSON export paths; no production mutations or live spreadsheet/browser verification.',checks:ledger};
 fs.writeFileSync('checks/record-field-2000-results.json',JSON.stringify(result,null,2)+'\n');fs.writeFileSync('checks/record-field-2000-ledger.json',JSON.stringify(ledger.map(x=>[x.project,x.field+' — '+x.variant,x.passed?'PASS':'FAIL']),null,2)+'\n');console.log(JSON.stringify({total:result.total,passed:result.passed,failed:result.failed,firstFailure:ledger.find(x=>!x.passed)},null,2));assert.equal(result.total,2000);if(result.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
