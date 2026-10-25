const fs=require('fs'),vm=require('vm'),assert=require('assert');
const records=JSON.parse(fs.readFileSync('src/data/projects.json')).records;
let checks=[];function check(task,ok){checks.push({task,status:ok?'verified':'failed',evidence:'JavaScript behavior test'});assert(ok,task)}
function element(value=''){return {value,textContent:'',dataset:{},maxLength:500,options:[],attrs:{},listeners:{},children:[],setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]||null},removeAttribute(k){delete this.attrs[k]},appendChild(n){this.children.push(n);return n},insertBefore(n){this.children.unshift(n)},insertAdjacentElement(){},querySelector(){return this.button},addEventListener(e,fn){this.listeners[e]=fn},dispatchEvent(e){this.listeners[e.type]?.(e)},remove(){},click(){this.clicked=true}}}
async function prefill(id,{data={records},error=false,typed='',selectedType='',duringType='',timeout=false}={}){
 const fields=Object.fromEntries(['proposal','name','city','country','operator','type','source'].map(k=>[k,element()]));fields.heading=element();fields.descLabel=element();fields.type.value=selectedType;fields.name.value=typed;fields.proposal.button=element();fields.type.options=['','Other documented infrastructure'].map(v=>({value:v,textContent:v}));
 let resolve,reject,abortTimer,fetchCount=0;const created=[];const pending=new Promise((r,j)=>{resolve=r;reject=j});
 const doc={querySelector:s=>s==='.intro h1'?fields.heading:s==='label[for="desc"]'?fields.descLabel:null,getElementById:id=>fields[id],createElement:()=>{const n=element();created.push(n);return n},createTextNode:s=>({textContent:s})};
 vm.runInNewContext(fs.readFileSync('src/correction-prefill.js','utf8'),{URLSearchParams,URL,AbortController,CustomEvent:class{constructor(type){this.type=type}},setTimeout:timeout?fn=>{abortTimer=fn;return 1}:setTimeout,clearTimeout:timeout?()=>{}:clearTimeout,location:{search:'?project='+id},document:doc,fetch:(url,{signal})=>{fetchCount++;if(fetchCount>1)return Promise.resolve({ok:true,json:async()=>({records})});signal.addEventListener('abort',()=>reject(Error('timeout')));return pending}});
 const disabled=fields.proposal.button.disabled,busy=fields.proposal.attrs['aria-busy'];if(duringType){fields.type.value=duringType;fields.type.listeners.change()}if(timeout)abortTimer();else resolve(error?Promise.reject(Error('offline')):{ok:true,json:()=>Promise.resolve(data)});await new Promise(r=>setImmediate(r));return {fields,disabled,busy,created};
}
(async()=>{
 let r=await prefill('shenzhen');
 check('Use correction-specific page heading',r.fields.heading.textContent==='Prepare a project correction');
 check('Use correction-specific evidence prompt',r.fields.descLabel.textContent.includes('What needs correcting'));
 check('Disable prepare while correction prefill is pending',r.disabled===true);
 check('Expose busy state during prefill',r.busy==='true');
 check('Restore prepare after successful prefill',r.fields.proposal.button.disabled===false&&!r.fields.proposal.attrs['aria-busy']);
 check('Retain correction project ID',r.fields.proposal.dataset.projectId==='shenzhen');
 check('Preserve recorded category in correction',r.fields.type.value==='Street-pole network');
 check('Offer recorded category as a selectable option',r.fields.type.children.some(x=>x.value==='Street-pole network'));
 check('Remove repeated country suffix from city',r.fields.city.value==='Shenzhen');
 check('Preserve original location in correction metadata',r.fields.proposal.dataset.originalLocation==='Shenzhen, China');
 check('Preserve original operator in correction metadata',r.fields.proposal.dataset.originalOperator==='Shenzhen traffic police');
 check('Keep correction evidence input empty',r.fields.source.value==='');
 r=await prefill('shenzhen',{typed:'User edited title'});check('Preserve user text during asynchronous prefill',r.fields.name.value==='User edited title');
 r=await prefill('not-a-project');check('Handle unknown project without false correction ID',!r.fields.proposal.dataset.projectId&&r.fields.proposal.children.some(x=>/not found/.test(x.textContent)));
 check('Restore form after unknown project',r.fields.proposal.button.disabled===false);
 r=await prefill('shenzhen',{error:true});check('Show readable dataset-load failure',r.fields.proposal.children.some(x=>/could not be loaded/.test(x.textContent)));
 check('Restore form after failed prefill',r.fields.proposal.button.disabled===false);
 r=await prefill('shenzhen',{selectedType:'Industrial drone station'});check('Preserve user-selected category during prefill',r.fields.type.value==='Industrial drone station');
 r=await prefill('x'.repeat(151));check('Explain oversized correction references',r.fields.proposal.children.some(x=>/too long/.test(x.textContent)));check('Bound and disclose truncated references',r.fields.proposal.dataset.requestedProjectId.length===150&&r.fields.proposal.dataset.requestedReferenceTruncated==='true');
 r=await prefill('shenzhen',{data:{records:'invalid'}});check('Handle malformed correction dataset',r.fields.proposal.children.some(x=>/could not be loaded/.test(x.textContent)));
 r=await prefill('shenzhen',{timeout:true});check('Recover form when prefill times out',r.fields.proposal.button.disabled===false&&r.fields.proposal.children.some(x=>/could not be loaded/.test(x.textContent)));
 r=await prefill('shenzhen',{duringType:'Testing infrastructure'});check('Preserve category changed while request is pending',r.fields.type.value==='Testing infrastructure');
 r=await prefill('shenzhen',{error:true});r.fields.name.value='User-edited name';r.fields.city.value='Edited city';await r.created.find(n=>n.id==='correction-retry').listeners.click();check('Retry resolves a failed correction reference',r.fields.proposal.dataset.contextResolution==='resolved'&&r.fields.proposal.dataset.projectId==='shenzhen');check('Retry preserves user edits',r.fields.name.value==='User-edited name'&&r.fields.city.value==='Edited city');
 r=await prefill('not-a-project');check('Retain unresolved requested ID',r.fields.proposal.dataset.requestedProjectId==='not-a-project'&&r.fields.proposal.dataset.contextResolution==='not-found');
 r=await prefill('shenzhen',{data:{records:[records[0],records[0]]}});check('Reject ambiguous correction ID',!r.fields.proposal.dataset.projectId&&r.fields.proposal.dataset.contextResolution==='unavailable');
 for(const record of records){r=await prefill(record.id);assert.equal(r.fields.type.value,record.infrastructureType);assert.equal(r.fields.proposal.dataset.projectId,record.id)}
 check('Verify category and ID preservation across all 50 corrections',true);
 fs.writeFileSync('checks/behavior-results.json',JSON.stringify(checks,null,2));console.log(JSON.stringify({checks:checks.length,failures:checks.filter(x=>x.status!=='verified')}));
})().catch(e=>{console.error(e);process.exit(1)});
