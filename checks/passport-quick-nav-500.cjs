/* Verify 50 genuine records × ten user-driven passport navigation shortcuts. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('checks/passport-quick-nav-500-ledger.json','utf8'));
const src=fs.readFileSync('src/passport-quick-navigation.js','utf8');
const ids=ledger.actions.map(x=>x.key);
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};this.events={};this.style={};this.open=false;this._text='';this.scrolls=0;this.clicked=0;}
 set className(x){this._class=x;}get className(){return this._class||'';}
 set textContent(t){this._text=String(t);this.children=[];}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 append(...n){this.children.push(...n.filter(Boolean));}
 appendChild(n){this.append(n);return n;}
 insertAdjacentElement(where,n){this.append(n);}
 setAttribute(k,v){this.attributes[k]=String(v);}
 addEventListener(k,f){this.events[k]=f;}
 click(){this.clicked++;return this.events.click?.();}
 matches(){return false;}closest(){return null;}hasAttribute(){return false;}
 focus(){}scrollIntoView(){this.scrolls++;}
}
let passed=[];
async function checkOne(record){
 const main=new El('main'),hero=new El('div'),facts=new El('div'),body=new El('body');
 main.querySelector=s=>s==='.hero'?hero:s==='.columns'?facts:null;
 const targets={
  'main .hero':hero,'main .columns':facts,
  '#mp-connect':new El('div'),
  '#mpp-toolkit':new El('details'),
  '#mpf-inspector':new El('details'),
  '#mpd-compare':new El('details'),
  '#mpl-location':new El('details'),
  '#mpr-workspace':new El('div')
 };
 const saved=new El('button');
 const document={getElementById:key=>key==='mpq-navigation'?null:key==='mpt-open'?saved:null,
   querySelector:key=>key==='main'?main:targets[key]||null,createElement:t=>new El(t),body};
 const location={pathname:'/projects/'+record.id+'/',href:'https://microportmap.com/projects/'+record.id+'/'};
 const context={document,location,AbortController,URLSearchParams,window:{},setTimeout:(fn,ms)=>1,clearTimeout:()=>{},
  fetch:async path=>{assert.equal(path,'/data/projects.json');return {ok:true,json:async()=>data};}};
 vm.runInNewContext(src,context);
 for(let n=0;n<12&&!context.window.MicroportQuickNav?.getState().ready;n++)
  await new Promise(done=>setImmediate(done));
 const api=context.window.MicroportQuickNav;
 assert.equal(api?.getState().ready,true,record.id+' not initialized');
 assert.equal(api.getState().projectId,record.id);
 assert.equal(api.getState().country,record.country);
 assert.equal(api.getState().actions,10);
 assert.deepEqual([...api.getActions()],ids);
 const root=hero.children.find(x=>x.id==='mpq-navigation');
 assert.ok(root&&root.tagName==='DETAILS','compact accordion absent');
 const nav=root.children.find(x=>x.className==='mpq-panel').children.find(x=>x.id==='mpq-list');
 assert.equal(nav.children.length,10);
 for(let i=0;i<ids.length;i++){
  const id=ids[i],ctrl=nav.children[i];
  assert.equal(ctrl.dataset.mpqAction,id);
  await ctrl.click();
  if(id==='country'){
    assert.equal(location.href,'/directory/?country='+encodeURIComponent(record.country).replace(/%20/g,'+'));
    assert.equal(api.getCountryURL(),location.href);
  }else if(id==='saved'){
    assert.equal(saved.clicked,1);
  }else {
    assert.ok(targets[['main .hero','main .columns','#mp-connect','#mpp-toolkit','#mpf-inspector','#mpd-compare','#mpl-location','#mpr-workspace'][i]].scrolls>=1);
    if(targets[['main .hero','main .columns','#mp-connect','#mpp-toolkit','#mpf-inspector','#mpd-compare','#mpl-location','#mpr-workspace'][i]].tagName==='DETAILS')
     assert.equal(targets[['main .hero','main .columns','#mp-connect','#mpp-toolkit','#mpf-inspector','#mpd-compare','#mpl-location','#mpr-workspace'][i]].open,true);
  }
  passed.push({id:'N'+String(passed.length+1).padStart(3,'0'),projectId:record.id,actionId:id,passed:true});
 }
}
(async()=>{
 for(const row of data.records)await checkOne(row);
 assert.equal(passed.length,500);
 assert.deepEqual(passed.map(x=>x.id),ledger.tasks.map(x=>x.id));
 assert.deepEqual(passed.map(x=>x.actionId),ledger.tasks.map(x=>x.actionId));
 assert.deepEqual(passed.map(x=>x.projectId),ledger.tasks.map(x=>x.projectId));
 fs.writeFileSync('checks/passport-quick-nav-500-results.json',JSON.stringify({
  total:500,passed:500,failed:0,note:'Simulated browser navigation and source-link behavior, real-browser checks run separately',cases:passed
 },null,2)+'\n');
 console.log('PASS: 500/500 project-specific navigation actions across original 50 records');
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
