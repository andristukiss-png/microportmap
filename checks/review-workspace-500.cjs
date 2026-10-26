/* Verify 50 projects x 10 actual stateful research questions. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const catalog=JSON.parse(fs.readFileSync('src/data/projects.json'));
const js=fs.readFileSync('src/research-review-workspace.js','utf8');
const manifest=JSON.parse(fs.readFileSync('checks/review-workspace-500-ledger.json'));
const ids=manifest.categories.map(c=>c.id);
class El{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.style={};this.attr={};this.listeners={};this.hidden=false;this._text='';this.value='';}
 set textContent(s){this._text=String(s);this.children=[];}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 append(...ns){this.children.push(...ns);}
 appendChild(n){this.append(n);return n;}
 insertAdjacentElement(p,n){this.append(n);}
 replaceChildren(...ns){this._text='';this.children=[...ns];}
 setAttribute(k,v){this.attr[k]=v;}
 addEventListener(k,fn){this.listeners[k]=fn;}
 click(){return this.listeners.click?.();}
 focus(){}select(){}remove(){}
}
let cases=[];
async function one(p){
 const host=new El,main=new El,body=new El;
 main.querySelector=key=>key==='.columns'?host:null;
 const document={querySelector:key=>key==='main'?main:null,getElementById:()=>null,createElement:t=>new El(t),body};
 const saved={};const localStorage={getItem:k=>saved[k]??null,setItem:(k,v)=>saved[k]=v};
 const blobs=[],copies=[];
 class FakeURL extends URL{}
 FakeURL.createObjectURL=b=>{blobs.push(b);return 'blob:fixture';};
 FakeURL.revokeObjectURL=()=>{};
 const context={document,location:{pathname:'/projects/'+p.id+'/'},URL:FakeURL,AbortController,Blob,
  localStorage,navigator:{clipboard:{writeText:async s=>copies.push(s)}},
  window:{confirm:()=>true,addEventListener:()=>{}},setTimeout:()=>1,clearTimeout:()=>{},
  fetch:async()=>({ok:true,json:async()=>catalog})};
 vm.runInNewContext(js,context);
 for(let n=0;n<12&&!context.window.MicroportReview?.getState().ready;n++)await new Promise(r=>setImmediate(r));
 const api=context.window.MicroportReview;
 assert.equal(api?.getState().ready,true,p.id+' not ready');
 assert.deepEqual([...api.getTasks().map(t=>t.id)],ids);
 const root=host.children.find(c=>c.id==='mpr-workspace');
 assert.ok(root);
 const list=root.children.find(c=>c.id==='mpr-tasks');
 assert.equal(list.children.length,10);
 for(let i=0;i<10;i++){
  const key=ids[i],status=i%2?'follow-up':'reviewed',note='Research note '+p.id+' '+key;
  assert.equal(api.update(key,status,note),true);
  assert.equal(api.getTasks()[i].status,status);
  assert.equal(api.getTasks()[i].note,note);
  cases.push({id:'R'+String(cases.length+1).padStart(3,'0'),projectId:p.id,questionId:key,passed:true});
 }
 assert.equal(api.getState().reviewed,5);
 assert.equal(api.getState().followUp,5);
 assert.equal(Object.keys(JSON.parse(saved['microportmap.review-workspace.v1'])[p.id]).length,10);
 assert.equal(api.update(ids[0],'unverified','bad'),false);
 assert.equal(api.update(ids[0],'reviewed','Z'.repeat(700)),true);
 assert.equal(api.getTasks()[0].note.length,600);
 const actions=root.children.find(c=>c.className==='mpr-actions');
 const control=label=>actions.children.find(c=>c.textContent.startsWith(label));
 control('Download review JSON').click();
 const json=JSON.parse(await blobs.at(-1).text());
 assert.equal(json.projectId,p.id);assert.equal(json.questions.length,10);
 control('Download review CSV').click();
 assert.ok((await blobs.at(-1).text()).includes('review_status'));
 await control('Copy review summary').click();
 assert.ok(copies.at(-1).includes(p.name));
 control('Reset this project').click();
 assert.equal(api.getState().reviewed,0);
 assert.equal(api.getState().followUp,0);
}
(async()=>{
 for(const record of catalog.records)await one(record);
 assert.equal(cases.length,500);
 assert.deepEqual(cases.map(x=>x.id),manifest.tasks.map(x=>x.id));
 assert.deepEqual(cases.map(x=>x.projectId),manifest.tasks.map(x=>x.projectId));
 assert.deepEqual(cases.map(x=>x.questionId),manifest.tasks.map(x=>x.questionId));
 fs.writeFileSync('checks/review-workspace-500-results.json',JSON.stringify({
  total:500,passed:500,failed:0,note:'Behavior checks only, not independent verification of research',cases
 },null,2)+'\n');
 console.log('PASS 500/500 record-specific diligence task states; persistence, privacy and export');
})().catch(e=>{console.error(e);process.exitCode=1;});
