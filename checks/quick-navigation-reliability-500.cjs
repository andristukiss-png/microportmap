/* Ten navigation transition scenarios on each original passport. No browser/device claims. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=JSON.parse(fs.readFileSync('src/data/projects.json','utf8'));
const source=fs.readFileSync('src/passport-quick-navigation.js','utf8');
class El{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.events={};this.open=false;this.scrolls=0;this.focuses=0;this.clicks=0;this._text='';}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 append(...nodes){for(const n of nodes){this.children.push(n);n.parentElement=this;}}
 insertAdjacentElement(_,node){this.append(node);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 hasAttribute(k){return k in this.attrs;}
 addEventListener(k,f){this.events[k]=f;}
 click(){this.clicks++;return this.events.click?.();}
 matches(){return ['A','BUTTON','INPUT','SELECT','TEXTAREA','SUMMARY'].includes(this.tagName);}
 focus(){this.focuses++;}
 scrollIntoView(){this.scrolls++;}
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(p){
 const main=new El('main'),hero=new El(),facts=new El(),saved=new El('button'),timers=[];
 const targets={'main .hero':hero,'main .columns':facts,'#mp-connect':new El(),'#mpp-toolkit':new El(),'#mpf-inspector':new El('details'),'#mpd-compare':new El('details'),'#mpl-location':new El('details'),'#mpr-workspace':new El()};
 main.querySelector=s=>s==='.hero'?hero:s==='.columns'?facts:null;
 let savedAvailable=true,focused=false;
 const location={pathname:'/projects/'+p.id+'/',href:'https://microportmap.com/projects/'+p.id+'/'};
 const document={querySelector:s=>s==='main'?main:targets[s]||null,getElementById:id=>id==='mpt-open'&&savedAvailable?saved:null,createElement:t=>new El(t)};
 const window={MicroportReading:{activate:k=>{assert.equal(k,'tools');focused=false;}}};
 const context={document,window,location,URLSearchParams,AbortController,setTimeout:(fn,ms)=>{if(ms===100)timers.push(fn);return 1;},clearTimeout:()=>{},fetch:async()=>({ok:true,json:async()=>data})};
 vm.runInNewContext(source,context);
 await tick();
 const api=window.MicroportQuickNav;
 assert.equal(api.getState().projectId,p.id);assert.equal(api.getState().ready,true);
 const root=hero.children.find(n=>n.id==='mpq-navigation'),panel=root.children[1],status=panel.children[2];
 assert.equal(root.open,false);
 async function drain(){for(let n=0;n<20&&timers.length;n++){timers.splice(0).forEach(fn=>fn());await tick();}}
 return {api,targets,saved,location,status,root,drain,focus:()=>{focused=true;},isFocused:()=>focused,removeSaved:()=>{savedAvailable=false;}};
}
const scenarios={
 'leave-focus-for-tools':async f=>{f.focus();assert.equal(await f.api.activate('inspector'),true);assert.equal(f.isFocused(),false);assert.equal(f.targets['#mpf-inspector'].open,true);},
 'retain-focus-for-original':async f=>{f.focus();await f.api.activate('overview');await f.api.activate('facts');assert.equal(f.isFocused(),true);},
 'open-nested-disclosures':async f=>{const outer=new El('details'),inner=new El('details'),target=f.targets['#mpp-toolkit'];outer.append(inner);inner.append(target);await f.api.activate('citation');assert.ok(outer.open&&inner.open);assert.equal(target.focuses,1);},
 'preserve-existing-tabindex':async f=>{const target=f.targets['#mp-connect'];target.setAttribute('tabindex','0');await f.api.activate('related');assert.equal(target.attrs.tabindex,'0');assert.equal(target.focuses,1);},
 'focus-section-and-ignore-invalid':async f=>{await f.api.activate('overview');const target=f.targets['main .hero'];assert.equal(target.attrs.tabindex,'-1');assert.equal(target.focuses,1);const text=f.status.textContent;assert.equal(await f.api.activate('unknown'),false);assert.equal(f.status.textContent,text);},
 'newest-shortcut-wins':async f=>{const target=f.targets['#mpf-inspector'];delete f.targets['#mpf-inspector'];const pending=f.api.activate('inspector');await f.api.activate('overview');f.targets['#mpf-inspector']=target;await f.drain();assert.equal(await pending,false);assert.equal(target.scrolls,0);assert.match(f.status.textContent,/overview/);},
 'saved-cancels-delayed-shortcut':async f=>{const target=f.targets['#mpd-compare'];delete f.targets['#mpd-compare'];const pending=f.api.activate('comparison');await f.api.activate('saved');f.targets['#mpd-compare']=target;await f.drain();assert.equal(await pending,false);assert.equal(target.focuses,0);assert.equal(f.saved.clicks,1);},
 'country-cancels-delayed-shortcut':async(f,p)=>{const target=f.targets['#mpl-location'];delete f.targets['#mpl-location'];const pending=f.api.activate('geography');await f.api.activate('country');f.targets['#mpl-location']=target;await f.drain();assert.equal(await pending,false);assert.equal(target.scrolls,0);assert.equal(f.location.href,'/directory/?'+new URLSearchParams({country:p.country}));},
 'missing-destination-recovers':async f=>{delete f.targets['#mpr-workspace'];const pending=f.api.activate('review');await f.drain();assert.equal(await pending,false);assert.match(f.status.textContent,/unavailable/);f.removeSaved();assert.equal(await f.api.activate('saved'),false);assert.match(f.status.textContent,/unavailable/);assert.equal(await f.api.activate('facts'),true);assert.equal(f.targets['main .columns'].focuses,1);},
 'late-destination-retry':async f=>{const target=f.targets['#mpf-inspector'];delete f.targets['#mpf-inspector'];const pending=f.api.activate('inspector');f.targets['#mpf-inspector']=target;await f.drain();assert.equal(await pending,true);assert.equal(target.scrolls,1);assert.equal(target.open,true);}
};
(async()=>{
 const cases=[];assert.equal(data.records.length,50);
 for(const p of data.records)for(const [scenario,run] of Object.entries(scenarios)){
  await run(await fixture(p),p);
  cases.push({taskId:'QN'+String(cases.length+1).padStart(3,'0'),projectId:p.id,route:'/projects/'+p.id+'/',scenario,passed:true});
 }
 assert.equal(cases.length,500);
 fs.writeFileSync('checks/quick-navigation-reliability-500-results.json',JSON.stringify({total:500,passed:500,failed:0,scope:'Controlled DOM/VM navigation transitions, not browser/device or production tests',cases},null,2)+'\n');
 console.log('PASS: 500 quick-navigation reliability scenarios across 50 original passports');
})().catch(e=>{console.error(e);process.exitCode=1;});
