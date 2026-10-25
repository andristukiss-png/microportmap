'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const records=JSON.parse(fs.readFileSync('src/data/projects.json')).records;
const s=fs.readFileSync('checks/correction-500.cjs','utf8'),m={exports:{}};vm.runInNewContext(s.slice(0,s.lastIndexOf('\n(async()=>{'))+'\nmodule.exports={evidence}',{require,module:m,console,URL,URLSearchParams,Blob,Date,AbortController,setTimeout,clearTimeout,setImmediate});const evidence=m.exports.evidence,ledger=[];
function submit(x){let prevented=false,stopped=false;x.formListeners.submit({preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});return {prevented,stopped}}
function accepted(value,expected=value,event='blur'){const x=evidence(value);x.listeners[event]();assert.equal(x.message,'');assert.equal(x.source.value,expected);assert(x.help.textContent.includes('not been independently checked'));assert.deepEqual(submit(x),{prevented:false,stopped:false});assert.equal(x.source.attrs.inputmode,'url');assert.equal(x.source.attrs.autocapitalize,'off');assert.equal(x.source.attrs.spellcheck,'false')}
function rejectedThenRecovered(value,original){const x=evidence(value);assert(x.message);assert.deepEqual(submit(x),{prevented:true,stopped:true});assert(x.source.focused&&x.source.reported);x.source.value=original;x.listeners.input();assert.equal(x.message,'');assert.deepEqual(submit(x),{prevented:false,stopped:false});assert.equal(x.source.value,original)}
async function task(p,behavior,fn){try{fn();ledger.push({project:p.id,behavior,passed:true})}catch(e){ledger.push({project:p.id,behavior,passed:false,error:e.stack})}}
(async()=>{for(const p of records){
 await task(p,'Change event trims surrounding whitespace without altering cited URL',()=>accepted('\t '+p.source.url+' \n',p.source.url,'change'));
 await task(p,'Encoded query punctuation survives validation unchanged',()=>{const u=new URL(p.source.url);u.searchParams.set('reference',p.id+' + & café 港');accepted(u.href)});
 await task(p,'Encoded project fragment survives validation unchanged',()=>{const u=new URL(p.source.url);u.hash=encodeURIComponent(p.id+' café 港');accepted(u.href)});
 await task(p,'Case-insensitive HTTPS scheme retains original input text',()=>accepted(p.source.url.replace(/^https:/i,'HtTpS:')));
 await task(p,'Percent-encoded Unicode evidence path remains intact',()=>{const u=new URL(p.source.url);u.pathname='/research/'+encodeURIComponent(p.id+' café 港');accepted(u.href)});
 await task(p,'Credential-bearing source blocks preparation and recovers to original source',()=>{const u=new URL(p.source.url);u.username='fixture-user';u.password='fixture-password';rejectedThenRecovered(u.href,p.source.url)});
 await task(p,'HTTP source blocks preparation and recovers to original HTTPS source',()=>{const u=new URL(p.source.url);u.protocol='http:';rejectedThenRecovered(u.href,p.source.url)});
 await task(p,'Protocol-relative source blocks preparation and recovers to complete HTTPS source',()=>rejectedThenRecovered(p.source.url.replace(/^https:/i,''),p.source.url));
 await task(p,'IPv6 loopback source blocks preparation and recovers to original source',()=>rejectedThenRecovered('https://[::1]/research/'+p.id,p.source.url));
 await task(p,'Localhost subdomain blocks preparation and recovers to original source',()=>rejectedThenRecovered('https://'+p.id+'.localhost/research',p.source.url));
 }
 const result={total:ledger.length,passed:ledger.filter(x=>x.passed).length,failed:ledger.filter(x=>!x.passed).length,mode:'Local controlled DOM/VM, synthetic URL transformations only. No evidence URL requests, research verification, or submissions.',checks:ledger};fs.writeFileSync('checks/evidence-boundary-500-results.json',JSON.stringify(result,null,2)+'\n');fs.writeFileSync('checks/evidence-boundary-500-ledger.json',JSON.stringify(ledger.map(x=>[x.project,x.behavior,x.passed?'PASS':'FAIL']),null,2)+'\n');console.log(JSON.stringify({total:result.total,passed:result.passed,failed:result.failed,firstFailure:ledger.find(x=>!x.passed)},null,2));assert.equal(result.total,500);if(result.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
