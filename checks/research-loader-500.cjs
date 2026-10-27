'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const rows=JSON.parse(fs.readFileSync('src/data/projects.json')).records;
const code=fs.readFileSync('src/experience-tools.js','utf8');
const excerpt=code.slice(code.indexOf('  let request;'),code.indexOf('  const sortedCounts'));
function fixture(handler){let timer,signal,calls=0;const ctx={AbortController,Promise,Set,Error,isRecord:p=>p&&typeof p.id==='string'&&/^[a-z0-9-]+$/.test(p.id)&&typeof p.name==='string'&&p.name.trim(),setTimeout(fn){timer=fn;return 1},clearTimeout(){timer=null},fetch:(url,opt)=>{calls++;signal=opt.signal;return handler(calls)}};vm.runInNewContext(excerpt+'\nthis.load=data;',ctx);return {load:()=>ctx.load(),expire:()=>timer(),get calls(){return calls},get signal(){return signal}}}
const ok=r=>({ok:true,json:async()=>({records:r})});
const tests=[
 async p=>{const f=fixture(()=>Promise.resolve(ok([p])));assert.equal((await f.load())[0].id,p.id)},
 async p=>{const f=fixture(()=>Promise.resolve(ok([p])));await f.load();await f.load();assert.equal(f.calls,1)},
 async p=>{let end;const f=fixture(()=>new Promise(r=>end=r));const a=f.load(),b=f.load();assert.equal(f.calls,1);end(ok([p]));assert.equal((await a)[0].id,(await b)[0].id)},
 async p=>{let end;const f=fixture(n=>n===1?new Promise(r=>end=r):Promise.resolve(ok([p])));const a=f.load();f.expire();await assert.rejects(a);assert(f.signal.aborted);assert.equal((await f.load())[0].id,p.id);end(ok([]));},
 async p=>{let end;const f=fixture(n=>n===1?Promise.resolve({ok:true,json:()=>new Promise(r=>end=r)}):Promise.resolve(ok([p])));const a=f.load();await Promise.resolve();f.expire();await assert.rejects(a);assert.equal((await f.load())[0].id,p.id);end({records:[]})},
 async p=>{const f=fixture(n=>Promise.resolve(n===1?{ok:false}:ok([p])));await assert.rejects(f.load());assert.equal((await f.load())[0].id,p.id)},
 async p=>{const f=fixture(n=>Promise.resolve(ok(n===1?[p,p]:[p])));await assert.rejects(f.load());assert.equal((await f.load())[0].id,p.id)},
 async p=>{const f=fixture(n=>Promise.resolve(ok(n===1?[]:[p])));await assert.rejects(f.load());assert.equal((await f.load())[0].id,p.id)},
 async p=>{const f=fixture(n=>Promise.resolve(ok(n===1?[{...p,id:'../bad'}]:[p])));await assert.rejects(f.load());assert.equal((await f.load())[0].id,p.id)},
 async p=>{const f=fixture(n=>n===1?Promise.reject(Error('offline')):Promise.resolve(ok([p])));await assert.rejects(f.load());assert.equal((await f.load())[0].id,p.id)}
];
(async()=>{let n=0;for(const p of rows)for(const test of tests){await test(p);n++}assert.equal(n,500);console.log('PASS: 500 shared research loader timeout, retry and validation cases')})().catch(e=>{console.error(e);process.exitCode=1});
