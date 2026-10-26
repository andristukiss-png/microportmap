/* 50 passports × ten toolkit metadata, format and recovery scenarios. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const catalog=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const source=fs.readFileSync('src/passport-research-toolkit.js','utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.events={};this.hidden=false;this.disabled=false;this.value='';this._text='';this.focuses=0;this.selections=0;}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 append(...nodes){for(const n of nodes){this.children.push(n);n.parentNode=this;}}
 replaceChildren(...nodes){this._text='';this.children=[];this.append(...nodes);}
 insertAdjacentElement(_,n){this.append(n);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
 click(event={preventDefault:()=>{}}){if(this.disabled)return false;let result;for(const fn of this.events.click||[])result=fn(event);return result;}
 focus(){this.focuses++;}select(){this.selections++;}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);}
 querySelectorAll(selector){const out=[];for(const c of this.children){if(selector==='[data-mpp-action]'&&c.dataset.mppAction)out.push(c);out.push(...c.querySelectorAll(selector));}return out;}
}
async function fixture(p,change,initial){
 const data=JSON.parse(JSON.stringify(catalog));if(change)change(data.records.find(r=>r.id===p.id));
 const main=new El('main'),host=new El(),body=new El('body'),timers=new Map();let timerId=0,urlId=0;
 const f={data,write:async value=>{f.copied=value;},fetch:initial||(async()=>({ok:true,json:async()=>data})),urls:new Map(),failBlob:false,failAnchor:false};
 main.querySelector=s=>s==='.columns'?host:null;
 const document={body,getElementById:()=>null,querySelector:s=>s==='main'?main:null,createElement:t=>{const n=new El(t);if(t==='a'){const click=n.click.bind(n);n.click=(...args)=>{if(n.download&&f.failAnchor)throw Error('Anchor blocked');return click(...args);};}return n;}};
 class U extends URL{}
 U.createObjectURL=blob=>{if(f.failBlob)throw Error('Blob blocked');const url='blob:toolkit-'+(++urlId);f.urls.set(url,blob);return url;};U.revokeObjectURL=url=>f.urls.delete(url);
 const context={document,location:{pathname:'/projects/'+p.id+'/'},URL:U,URLSearchParams,Blob,AbortController,navigator:{clipboard:{writeText:value=>f.write(value)}},window:{},fetch:(...args)=>f.fetch(...args),
  setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(source,context);f.api=context.window.MicroportPassportToolkit;
 f.settle=async()=>{for(let n=0;n<4;n++)await tick();};await f.settle();
 f.root=host.children.find(n=>n.id==='mpp-toolkit');[f.heading,f.info,f.toolbar,f.status,f.fallback,f.checks,f.caveat,f.retry]=f.root.children;
 f.text=f.fallback.children[0].children[0];f.body=body;f.timers=timers;
 f.action=key=>f.toolbar.children.find(n=>n.dataset.mppAction===key);
 f.expire=ms=>{for(const [id,t] of [...timers])if(t.ms===ms){timers.delete(id);t.fn();}};
 return f;
}
function loaded(f){assert.equal(f.api.getState().loaded,true);assert.equal(f.api.getState().actions,10);assert.equal(f.root.attrs['aria-busy'],'false');}
const scenarios={
 'malformed-optional-metadata':async p=>{
  const f=await fixture(p,r=>{r.country={};r.reportedOperator=[];r.reportedEquipment=42;r.locationPrecision=false;r.verificationStatus={};r.source.name=[];r.reportDateLabel=null;});loaded(f);
  await f.action('copy-review').click();assert.ok(!f.copied.includes('[object Object]'));assert.ok(f.copied.includes('[Review] Reported country provided: Not stated'));assert.ok(f.copied.includes('[Review] Reported equipment provided: Not stated'));
  assert.equal(f.action('same-equipment').attrs['aria-disabled'],'true');
 },
 'blank-equipment-and-unsafe-source':async p=>{
  for(const url of ['javascript:alert(1)','http://example.com','https://user:secret@example.com/']){
   const f=await fixture(p,r=>{r.reportedEquipment=' \n\u0000 ';r.source.url=url;});loaded(f);
   for(const key of ['original-source','same-equipment']){let prevented=false;const a=f.action(key);assert.equal(a.attrs['aria-disabled'],'true');a.click({preventDefault:()=>{prevented=true;}});assert.equal(prevented,true);}
   await f.action('citation-plain').click();assert.ok(f.copied.includes('Source URL not available'));assert.ok(!f.copied.includes(url));
  }
 },
 'markdown-citation-literal-data':async p=>{
  const f=await fixture(p,r=>{r.name='Literal [link](javascript:bad) <img> *bold* _word_ `code`';r.source.name='Publisher [x] <script>';});loaded(f);await f.action('citation-markdown').click();
  assert.ok(f.copied.includes('\\[link\\]'));assert.ok(f.copied.includes('\\<img\\>'));assert.ok(f.copied.includes('\\*bold\\*'));assert.ok(f.copied.includes('\\_word\\_'));assert.ok(f.copied.includes('\\`code\\`'));assert.ok(!f.copied.includes('<script>'));
 },
 'markdown-brief-literal-table-values':async p=>{
  const f=await fixture(p,r=>{r.name='Literal <img> [name]';r.reportedOperator='Operator | [label] <svg> *text*';});loaded(f);f.action('download-brief-md').click();const text=await [...f.urls.values()][0].text();
  assert.ok(text.startsWith('# Literal \\<img\\> \\[name\\]'));assert.ok(text.includes('Operator \\| \\[label\\] \\<svg\\> \\*text\\*'));assert.ok(text.includes('## Limitations'));f.expire(30000);assert.equal(f.urls.size,0);
 },
 'bibtex-literal-tex-characters':async p=>{
  const f=await fixture(p,r=>{r.name='Literal 50% A&B #1_$ {group} ~ ^ \\ path';});loaded(f);await f.action('citation-bibtex').click();
  for(const escaped of ['50\\%','A\\&B','\\#1\\_\\$','\\{group\\}','\\textasciitilde{}','\\textasciicircum{}','\\textbackslash{}'])assert.ok(f.copied.includes(escaped),escaped);
  assert.ok(f.copied.startsWith('@misc{microportmap_'+p.id+','));assert.ok(f.copied.includes('not independent verification'));
 },
 'csv-formula-and-quote-boundaries':async p=>{
  const f=await fixture(p,r=>{r.name='=HYPERLINK("bad")';r.reportedEquipment=' +SUM(1,2)';});loaded(f);f.action('download-review-csv').click();const text=await [...f.urls.values()][0].text();
  assert.deepEqual([...new Uint8Array(await [...f.urls.values()][0].arrayBuffer()).slice(0,3)],[239,187,191]);assert.ok(text.includes('"\'=HYPERLINK(""bad"")"'));assert.ok(text.includes('"\'+SUM(1,2)"'));assert.ok(text.includes('catalog_field_present'));f.expire(30000);assert.equal(f.urls.size,0);
 },
 'clipboard-race-and-timeout':async p=>{
  const f=await fixture(p);loaded(f);let finish;f.write=()=>new Promise(resolve=>{finish=resolve;});const older=f.action('citation-plain').click();
  f.write=async()=>{throw Error('Latest denied');};await f.action('copy-facts').click();const status=f.status.textContent,text=f.text.value,focus=f.text.focuses;
  finish();assert.equal(await older,false);assert.equal(f.status.textContent,status);assert.equal(f.text.value,text);assert.equal(f.text.focuses,focus);
  f.write=()=>new Promise(()=>{});const timed=f.action('copy-facts').click();assert.equal(f.text.value,'');f.expire(800);assert.equal(await timed,false);assert.ok(f.text.value.includes(p.name));assert.equal(f.timers.size,0);
 },
 'download-fallback-and-resource-cleanup':async p=>{
  const f=await fixture(p);loaded(f);for(const key of ['download-brief-txt','download-brief-md','download-review-csv']){
   f.failBlob=false;assert.equal(f.action(key).click(),true);const expected=Buffer.from(await [...f.urls.values()][0].arrayBuffer()).toString('utf8');f.expire(30000);assert.equal(f.urls.size,0);assert.equal(f.body.children.length,0);
   f.failBlob=true;const selected=f.text.selections;assert.equal(f.action(key).click(),false);assert.equal(f.text.value,expected);assert.equal(f.fallback.hidden,false);assert.equal(f.text.selections,selected+1);
  }
  f.failBlob=false;f.failAnchor=true;f.action('download-brief-txt').click();assert.equal(f.body.children.length,0);f.expire(30000);assert.equal(f.urls.size,0);
 },
 'reload-invalidates-old-actions-and-copy':async p=>{
  const f=await fixture(p);loaded(f);const old=f.action('citation-plain'),link=f.action('original-source');let reject;
  f.write=()=>new Promise((_,fail)=>{reject=fail;});const pending=old.click();f.fetch=async()=>({ok:false});f.retry.click();assert.equal(old.click(),false);
  let prevented=false;link.click({preventDefault:()=>{prevented=true;}});assert.equal(prevented,true);await f.settle();assert.equal(f.api.getState().loaded,false);assert.equal(f.api.getState().actions,0);assert.equal(f.info.children.length,0);assert.equal(f.checks.children.length,0);
  const status=f.status.textContent;reject(Error('Old denial'));assert.equal(await pending,false);assert.equal(f.status.textContent,status);assert.equal(f.fallback.hidden,true);assert.equal(f.text.value,'');
  f.fetch=async()=>({ok:true,json:async()=>f.data});f.retry.click();await f.settle();loaded(f);
 },
 'invalid-catalogue-and-retry-lock':async p=>{
  const invalid=JSON.parse(JSON.stringify(catalog));invalid.records[1].id=invalid.records[0].id;
  const f=await fixture(p,null,async()=>({ok:true,json:async()=>invalid}));assert.equal(f.api.getState().loaded,false);assert.equal(f.api.getState().actions,0);assert.equal(f.retry.hidden,false);
  let finish,calls=0;f.fetch=()=>{calls++;return new Promise(resolve=>{finish=resolve;});};f.retry.click();for(const fn of f.retry.events.click)fn();await f.settle();assert.equal(calls,1);assert.equal(f.retry.disabled,true);
  finish({ok:true,json:async()=>f.data});await f.settle();loaded(f);assert.equal(f.timers.size,0);
 }
};
(async()=>{
 assert.equal(catalog.records.length,50);const cases=[];
 for(const p of catalog.records)for(const [scenario,run] of Object.entries(scenarios)){await run(p);cases.push({taskId:'TK'+String(cases.length+1).padStart(3,'0'),projectId:p.id,route:'/projects/'+p.id+'/',scenario,passed:true});}
 assert.equal(cases.length,500);
 fs.writeFileSync('checks/toolkit-reliability-500-results.json',JSON.stringify({total:500,passed:500,failed:0,scope:'Controlled DOM/VM metadata, format escaping, CSV, clipboard UI and export recovery checks; real-browser checks run separately. No native clipboard ordering claims.',cases},null,2)+'\n');
 console.log('PASS: 500 research toolkit format, metadata and recovery scenarios');
})().catch(e=>{console.error(e);process.exitCode=1;});
