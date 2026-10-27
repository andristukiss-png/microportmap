const fs=require('fs'),vm=require('vm'),assert=require('assert');
const original=JSON.parse(fs.readFileSync('src/data/projects.json')).records;
function setup(query='',data=original,options={}){
 let blob,link,fail=false,resolveCopy,rejectCopy;const events={},timers=[];
 class El{
  constructor(id=''){this.id=id;this.dataset={};this.attrs={};this.children=[];this.listeners={};this.hidden=false;this.disabled=false;this._html='';this.textContent='';}
  set innerHTML(v){this._html=v;this.removes=[...v.matchAll(/data-remove-project="([^"]+)"/g)].map(m=>{const b=new El();b.dataset.removeProject=m[1];return b;});}get innerHTML(){return this._html;}
  addEventListener(k,fn){this.listeners[k]=fn;}setAttribute(k,v){this.attrs[k]=v;}appendChild(el){this.children.push(el);}focus(){this.focused=true;}scrollIntoView(args){this.scrolled=args;}click(){return this.listeners.click?.();}remove(){this.removed=true;}
  querySelector(s){return this.children.find(c=>c.className==='comparison-toggle');}
  querySelectorAll(s){if(s==='[data-remove-project]')return this.removes||[];if(s==='article[data-project-id]')return cards;return [];}
 }
 let cards=data.map(p=>{const e=new El();e.dataset.projectId=p.id;return e;});
 const fields=Object.fromEntries(['project-comparison','comparison-table','comparison-status','comparison-help','comparison-heading','comparison-copy','comparison-json','comparison-csv','comparison-clear','search','results'].map(id=>[id,new El(id)]));
 const location={href:'https://microportmap.com/directory/'+query,get origin(){return new URL(this.href).origin;}};
 class TestURL extends URL{}TestURL.createObjectURL=b=>{if(fail)throw Error('blocked');blob=b;return 'blob:test';};TestURL.revokeObjectURL=()=>{};
 const ctx={document:{getElementById:id=>fields[id],createElement(tag){const e=new El();if(tag==='a')link=e;return e;},body:{appendChild(){}}},window:{addEventListener(k,fn){events[k]=fn;}},location,history:{replaceState(a,b,url){if(options.historyError)throw Error('History unavailable');location.href=new URL(url,location.href).href;}},navigator:{clipboard:{writeText(){return new Promise((resolve,reject)=>{resolveCopy=resolve;rejectCopy=reject;});}}},URL:TestURL,Blob,Date,setTimeout(fn,delay){timers.push({fn,delay});return timers.length;},clearTimeout(id){if(timers[id-1])timers[id-1].cleared=true;}};
 vm.runInNewContext(fs.readFileSync('src/directory-compare.js','utf8'),ctx);
 const state=(ready=true,loading=false,current=data,viewSearch=options.viewSearch)=>events['mp-directory-state']({detail:{ready,loading,records:current,viewSearch}});
 state();
 return {fields,cards,location,state,timers,get blob(){return blob;},get link(){return link;},fail(){fail=true;},resolveCopy(){resolveCopy();},rejectCopy(){rejectCopy(Error('denied'));},toggle(id){cards.find(c=>c.dataset.projectId===id).children[0].click();}};
}
(async()=>{
 let x=setup();assert(x.fields['project-comparison'].hidden);assert(x.fields['comparison-json'].disabled);
 x.toggle('shenzhen');assert(!x.fields['project-comparison'].hidden);assert(x.fields['comparison-table'].innerHTML.includes('scope="row"'));assert(x.fields['comparison-table'].innerHTML.includes('<caption>'));assert.equal(x.cards.find(c=>c.dataset.projectId==='shenzhen').children[0].attrs['aria-pressed'],'true');
 x.toggle('kiel');x.toggle('enbw');assert(x.fields['comparison-table'].innerHTML.includes('/projects/kiel/?compare=shenzhen%2Ckiel%2Cenbw'));assert(x.cards.find(c=>c.dataset.projectId==='ishikawa').children[0].disabled);assert(!x.cards.find(c=>c.dataset.projectId==='kiel').children[0].disabled);
 x.fields['comparison-json'].click();let p=JSON.parse(await x.blob.text());assert.deepEqual(p.selectedProjectIds,['shenzhen','kiel','enbw']);assert.equal(p.count,3);assert.deepEqual(p.records,p.selectedProjectIds.map(id=>original.find(r=>r.id===id)));assert.equal(x.blob.type,'application/json;charset=utf-8');assert(x.link.removed);assert.equal(x.link.download,'microportmap-comparison.json');assert(x.timers.some(t=>t.delay===30000));
 x.fields['comparison-csv'].click();let csv=await x.blob.text();assert.equal(csv.trim().split('\r\n').length,4);assert.equal(x.blob.type,'text/csv;charset=utf-8');assert.equal(x.link.download,'microportmap-comparison.csv');assert(csv.includes('reportDateLabel'));
 let copy=x.fields['comparison-copy'].click();x.resolveCopy();await copy;assert(x.fields['comparison-status'].textContent.includes('copied'));
 copy=x.fields['comparison-copy'].click();x.toggle('enbw');x.resolveCopy();await copy;assert(!x.fields['comparison-status'].textContent.includes('copied'));
 copy=x.fields['comparison-copy'].click();x.rejectCopy();await copy;assert(x.fields['comparison-status'].textContent.includes('Copy this comparison link:'));
 const before=new URL(x.location.href).searchParams.get('compare');x.state();assert.equal(new URL(x.location.href).searchParams.get('compare'),before);
 x.fields['comparison-table'].removes[0].click();assert(x.fields['comparison-heading'].focused);x.fields['comparison-table'].removes[0].click();assert(x.fields.search.focused);assert(x.fields['project-comparison'].hidden);
 x=setup('?compare=shenzhen,shenzhen,bogus,kiel,enbw,ishikawa');assert(x.fields['comparison-status'].textContent.includes('removed'));x.fields['comparison-json'].click();p=JSON.parse(await x.blob.text());assert.deepEqual(p.selectedProjectIds,['shenzhen','kiel','enbw']);assert(!new URL(x.location.href).search.includes('bogus'));
 x.location.href='https://microportmap.com/directory/?compare=ishikawa';x.state();x.fields['comparison-json'].click();assert.equal(JSON.parse(await x.blob.text()).records[0].id,'ishikawa');
 x.state(false,true);assert(x.fields['project-comparison'].hidden);assert(x.fields['comparison-json'].disabled);x.state();assert(!x.fields['comparison-json'].disabled);
 x.fail();x.fields['comparison-json'].click();assert(x.fields['comparison-status'].textContent.includes('could not be started'));
 x.fields['comparison-clear'].click();assert(x.fields['project-comparison'].hidden);assert(x.fields.search.focused);assert(!new URL(x.location.href).searchParams.has('compare'));
 x=setup('?country=Germany&year=2026&compare=kiel,enbw');assert.equal(new URL(x.location.href).searchParams.get('country'),'Germany');x.fields['comparison-json'].click();assert.equal(JSON.parse(await x.blob.text()).count,2);
 x=setup('?compare=kiel#project-comparison');assert.equal(x.fields['project-comparison'].scrolled.behavior,'auto');assert(x.fields['comparison-heading'].focused);
 x=setup('',original,{historyError:true});x.toggle('kiel');x.toggle('enbw');x.state();x.fields['comparison-json'].click();assert.deepEqual(JSON.parse(await x.blob.text()).selectedProjectIds,['kiel','enbw']);
 x=setup('?compare=unknown#project-comparison');assert(x.fields['comparison-help'].focused);assert(x.fields['comparison-help'].textContent.includes('removed'));x.state();assert(x.fields['comparison-help'].textContent.includes('removed'));assert.equal(new URL(x.location.href).hash,'#results');
 x=setup('?compare=kiel#project-comparison');x.fields['comparison-clear'].click();assert.equal(new URL(x.location.href).hash,'#results');x.state(false,true);assert.equal(x.fields['comparison-table'].innerHTML,'');
 x=setup('?compare=kiel,enbw');x.state(true,false,original.filter(p=>p.id!=='enbw'));x.fields['comparison-json'].click();assert.deepEqual(JSON.parse(await x.blob.text()).selectedProjectIds,['kiel']);assert(x.fields['comparison-help'].textContent.includes('removed'));
 x=setup('?country=China&compare=kiel,enbw',original,{viewSearch:'?country=Germany&sort=recent&unknown=drop'});let contextLink=x.fields['comparison-table'].innerHTML.match(/href="([^"]+)"/)[1].replace(/&amp;/g,'&');let contextURL=new URL(contextLink,'https://microportmap.com');assert.equal(contextURL.searchParams.get('country'),'Germany');assert.equal(contextURL.searchParams.get('sort'),'recent');assert(!contextURL.searchParams.has('unknown'));
 const bad={...original[0],name:'<script>bad</script>',reportedOperator:'=formula',reportedEquipment:'',source:{url:'https://user:pass@example.com/'}};
 x=setup('?compare='+bad.id,[bad]);const html=x.fields['comparison-table'].innerHTML;assert(html.includes('&lt;script&gt;'));assert(!html.includes('<script>'));assert(html.includes('Not recorded'));assert(html.includes('Source unavailable'));assert(!html.includes('user:pass'));x.fields['comparison-csv'].click();assert((await x.blob.text()).includes("'=formula"));
 const mapTasks=[];
 // Every existing record must export unchanged as a single selected comparison.
 for(const record of original){x=setup('?compare='+record.id);x.fields['comparison-json'].click();assert.deepEqual(JSON.parse(await x.blob.text()).records,[record]);assert(x.fields['comparison-table'].innerHTML.includes('/projects/'+record.id+'/?compare='+record.id));const mapHref='/?project='+record.id+'#atlas';assert(x.fields['comparison-table'].innerHTML.includes('href="'+mapHref+'"'));assert(x.fields['comparison-table'].innerHTML.includes('Show approximate map reference for '));mapTasks.push({projectId:record.id,name:record.name,mapHref,exactExportPreserved:true,passed:true});}
 fs.writeFileSync('checks/comparison-map-results.json',JSON.stringify({total:mapTasks.length,passed:mapTasks.length,tasks:mapTasks},null,2)+'\n');
 for(const point of [null,{}, {latitude:null,longitude:1},{latitude:'1',longitude:1},{latitude:true,longitude:1},{latitude:NaN,longitude:1},{latitude:Infinity,longitude:1},{latitude:86,longitude:1},{latitude:1,longitude:181}]){const noMap={...original[0],approximateMapPoint:point};x=setup('?compare='+noMap.id,[noMap]);assert(x.fields['comparison-table'].innerHTML.includes('Map reference unavailable'));assert(!x.fields['comparison-table'].innerHTML.includes('Show on atlas'));}
 for(const point of [{latitude:0,longitude:0},{latitude:-85.05112878,longitude:-180},{latitude:85.05112878,longitude:180}]){x=setup('?compare='+original[0].id,[{...original[0],approximateMapPoint:point}]);assert(x.fields['comparison-table'].innerHTML.includes('Show on atlas'));}
 const pairTasks=JSON.parse(fs.readFileSync('checks/related-pair-results.json')).tasks;let pairCount=0;for(const task of pairTasks){for(const pair of task.pairs){x=setup(new URL(pair.href,'https://microportmap.com').search);x.fields['comparison-json'].click();assert.deepEqual(JSON.parse(await x.blob.text()).records,pair.ids.map(id=>original.find(p=>p.id===id)));pairCount++;}}fs.writeFileSync('checks/related-pair-export-results.json',JSON.stringify({projects:pairTasks.length,pairs:pairCount,passed:true},null,2)+'\n');
 console.log('PASS: comparison selection/limit, semantic table, exact JSON for all 50 records, CSV, URL normalization/history, focus, clipboard races/denial, loading, escaping, source suppression and failures');
})().catch(e=>{console.error(e);process.exit(1);});
