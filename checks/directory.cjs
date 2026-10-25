const fs=require('fs'),vm=require('vm'),assert=require('assert');
const dataset=JSON.parse(fs.readFileSync('src/data/projects.json'));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class Element {
 constructor(id='',values=null){this.id=id;this.options=values?.map(value=>({value}))||[];this._value=values?.[0]||'';this.listeners={};this.attrs={};this.innerHTML='';this.textContent='';this.hidden=true;this.disabled=false;this.removed=false;}
 get value(){return this._value} set value(v){this._value=this.options.length&&!this.options.some(o=>o.value===v)?'':v}
 setAttribute(k,v){this.attrs[k]=v} addEventListener(e,fn){this.listeners[e]=fn} appendChild(o){this.options.push(o)} remove(i){if(typeof i==='number')this.options.splice(i,1);else this.removed=true} focus(){this.focused=true} click(){return this.listeners.click?.()} insertAdjacentElement(){}
}
async function setup(query='',options={}){
 const f=Object.fromEntries(['search','country','kind','sort','region','year','results','count','share-status','error','reset','export-csv','share-filters','retry-directory','empty-reset'].map(id=>[id,new Element(id,id==='sort'?['name','recent','country']:['country','kind','region','year'].includes(id)?['']:null)]));
 let blob,link,revoked=false,fetches=0,resolveFetch,failDownload=false,clipResolve;
 const location={href:'https://microportmap.com/directory/'+query,get search(){return new URL(this.href).search}};
 const events={},window={addEventListener(k,fn){events[k]=fn},dispatchEvent(event){events[event.type]?.(event)}};
 const doc={getElementById:id=>f[id],createElement:tag=>{const el=new Element();if(tag==='a')link=el;return el},body:{appendChild(){}}};
 class TestURL extends URL{};TestURL.createObjectURL=b=>{if(failDownload)throw Error('blocked');blob=b;return 'blob:test'};TestURL.revokeObjectURL=()=>{revoked=true};
 const timers=[];
 const context={document:doc,window,location,history:{replaceState(a,b,value){if(options.historyError)throw Error('history unavailable');location.href=new URL(value,location.href).href}},URL:TestURL,URLSearchParams,CustomEvent:class{constructor(type,args){this.type=type;this.detail=args.detail}},AbortController,Blob,navigator:{clipboard:{writeText(){return new Promise(r=>clipResolve=r)}}},setTimeout(fn,delay){timers.push({fn,delay});return timers.length},clearTimeout(){},fetch(url,{signal}){fetches++;if(options.pending&&fetches===1)return new Promise((resolve,reject)=>{resolveFetch=resolve;signal.addEventListener('abort',()=>reject(Error('aborted')))});return Promise.resolve({ok:!(options.error&&fetches===1),json:async()=>options.data||dataset})}};
 vm.runInNewContext(fs.readFileSync('src/research-search.js','utf8'),context);
 vm.runInNewContext(fs.readFileSync('src/directory.js','utf8'),context);await tick();
 return {f,context,events,location,timers,get blob(){return blob},get link(){return link},get fetches(){return fetches},failDownload(){failDownload=true},resolveClip(){clipResolve()},finishFetch(){resolveFetch({ok:true,json:async()=>dataset})}};
}
(async()=>{
 let x=await setup('?country=Atlantis&type=bogus&sort=bad');assert.equal(x.f.country.value,'');assert.equal(x.f.kind.value,'');assert.equal(x.f.sort.value,'name');assert.equal(new URL(x.location.href).search,'');
 const search=value=>{x.f.search.value=value;x.f.search.listeners.input()};
 search('Wurzburg');assert.equal(x.context.window.mpFilteredRecords[0].id,'wurzburg-emqport');
 search('Shenzhen traffic');assert.equal(x.context.window.mpFilteredRecords.length,1);
 search('Autonomous drone nests');assert(x.context.window.mpFilteredRecords.some(p=>p.id==='shenzhen'));
 search('65 drone nests');assert.equal(x.context.window.mpFilteredRecords[0].id,'shenzhen');
 search('Shenzhen Traffic Police government');assert.equal(x.context.window.mpFilteredRecords[0].id,'shenzhen');
 assert(x.f.results.innerHTML.includes('aria-label="View research passport for Futian'));
 assert(x.f.results.innerHTML.includes('/submit/?project=shenzhen'));
 x.f['export-csv'].click();assert.equal(x.blob.type,'text/csv;charset=utf-8');assert.equal(x.link.download,'microportmap-filtered-projects.csv');assert(x.link.removed);assert(x.timers.some(t=>t.delay===30000));assert(/download requested/.test(x.f['share-status'].textContent));assert((await x.blob.text()).includes('shenzhen'));
 x.failDownload();x.f['export-csv'].click();assert(/could not be started/.test(x.f['share-status'].textContent));
 const copy=x.f['share-filters'].click();search('Kiel');x.resolveClip();await copy;assert.equal(x.f['share-status'].textContent,'');
 search('unfindable-QA');assert(x.f.results.innerHTML.includes('empty-reset'));x.f['empty-reset'].click();assert.equal(x.context.window.mpFilteredRecords.length,50);
 x.location.href='https://microportmap.com/directory/?country=China';x.events.popstate();assert.equal(x.f.country.value,'China');assert.equal(x.context.window.mpFilteredRecords.length,1);
 x=await setup('',{pending:true});assert(x.f.search.disabled);assert(x.f.region.disabled);assert(x.f.year.disabled);assert.equal(x.f.results.attrs['aria-busy'],'true');x.finishFetch();await tick();assert(!x.f.search.disabled);assert(!x.f.region.disabled);assert(!x.f.year.disabled);assert.equal(x.f.results.attrs['aria-busy'],'false');
 x=await setup('',{error:true});assert(!x.f.error.hidden);assert(x.f['export-csv'].disabled);await x.f['retry-directory'].click();await tick();assert.equal(x.fetches,2);assert(x.f.error.hidden);assert.equal(x.context.window.mpFilteredRecords.length,50);
 x=await setup('',{data:{records:'wrong'}});assert(!x.f.error.hidden);assert.equal(x.context.window.mpFilteredRecords,undefined);
 x=await setup('',{data:{records:[dataset.records[0],dataset.records[0]]}});assert(!x.f.error.hidden);
 x=await setup('',{pending:true});x.timers.find(t=>t.delay===15000).fn();await tick();assert(!x.f.error.hidden);assert.equal(x.f.results.attrs['aria-busy'],'false');
 x=await setup('',{historyError:true});x.f.search.value='Shenzhen';x.f.search.listeners.input();assert.equal(x.context.window.mpFilteredRecords.length,1);
 for(const query of [...new Set(dataset.records.map(p=>p.region))].map(region=>'?region='+encodeURIComponent(region)).concat([...new Set(dataset.records.map(p=>(String(p.reportDateLabel).match(/\b20[0-9]{2}\b/)||[])[0]||'unknown'))].map(year=>'?year='+year),['?country=Germany&region=Europe&year=2026','?region=Asia&type=Industrial%20dock'])){
  x=await setup(query);const params=new URLSearchParams(query);const expected=dataset.records.filter(p=>(!params.has('country')||p.country===params.get('country'))&&(!params.has('type')||p.infrastructureType===params.get('type'))&&(!params.has('region')||p.region===params.get('region'))&&(!params.has('year')||((String(p.reportDateLabel).match(/\b20[0-9]{2}\b/)||[])[0]||'unknown')===params.get('year')));assert.deepEqual(Array.from(x.context.window.mpFilteredRecords,p=>p.id).sort(),expected.map(p=>p.id).sort());assert.equal(x.f.region.value,params.get('region')||'');assert.equal(x.f.year.value,params.get('year')||'');assert.equal(new URL(x.location.href).searchParams.get('year'),params.get('year'));
 }
 x=await setup('?region=Atlantis&year=2099');assert.equal(x.f.region.value,'');assert.equal(x.f.year.value,'');assert.equal(new URL(x.location.href).search,'');
 x=await setup('?region=Europe&year=2025');x.f.reset.click();assert.equal(x.context.window.mpFilteredRecords.length,50);assert.equal(x.f.region.value,'');assert.equal(x.f.year.value,'');x.location.href='https://microportmap.com/directory/?region=Asia&year=2026';x.events.popstate();assert.equal(x.f.region.value,'Asia');assert.equal(x.f.year.value,'2026');
 x=await setup('',{data:{records:[{...dataset.records[0],id:'../unsafe'}]}});assert(!x.f.error.hidden);assert.equal(x.context.window.mpFilteredRecords,undefined);
 x=await setup('',{historyError:true});let currentView;x.events['mp-directory-state']=event=>currentView=event.detail;x.f.country.value='Germany';x.f.country.listeners.change();assert.equal(new URLSearchParams(currentView.viewSearch).get('country'),'Germany');
 console.log('PASS: directory invalid URL, expanded search, link contexts, CSV payload/errors/cleanup, stale clipboard, empty reset, popstate, loading, retry, invalid/duplicate records and history failure');
})().catch(error=>{console.error(error);process.exit(1)});
