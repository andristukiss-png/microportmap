/* MicroportMap compact passport quick navigation: 50 passports x 10 contextual actions. */
(()=>{
'use strict';
const route=location.pathname.match(/^\/projects\/([a-z0-9-]+)\/?$/);
if(!route||document.getElementById('mpq-navigation'))return;
const id=route[1],main=document.querySelector('main');if(!main)return;
const E=(tag,cls,label)=>{
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(label!==undefined)el.textContent=String(label);
 return el;
};
const notices={
  overview:'Published project overview',
  facts:'Original reported research fields',
  related:'Research connections and original source',
  citation:'Citation and research brief tools',
  inspector:'Source-qualified individual field inspector',
  comparison:'Compare original evidence with another research record',
  geography:'Approximate location research, not navigation or permission',
  review:'Private visitor research review workspace',
  saved:'Open browser-local saved research',
  country:'Browse the original catalogue for the reported country'
};
const steps=[
 ['overview','Overview','main .hero'],
 ['facts','Reported facts','main .columns'],
 ['related','Source & related','#mp-connect'],
 ['citation','Citations & briefs','#mpp-toolkit'],
 ['inspector','Field inspector','#mpf-inspector'],
 ['comparison','Compare evidence','#mpd-compare'],
 ['geography','Approximate location','#mpl-location'],
 ['review','My review','#mpr-workspace'],
 ['saved','Saved research','#mpt-open'],
 ['country','Same-country directory',null]
];
const root=E('details','mpq-navigation');root.id='mpq-navigation';
const summary=E('summary','mpq-summary','Project quick navigation · 10 shortcuts');
summary.setAttribute('aria-controls','mpq-list');
const panel=E('div','mpq-panel');
const description=E('p','mpq-description','Open a research section, your saved projects, or related country records. Research references are not verified operating facilities or flight permissions.');
const nav=E('nav','mpq-list');nav.id='mpq-list';nav.setAttribute('aria-label','Project research destinations');
const status=E('p','mpq-status');status.id='mpq-status';
status.setAttribute('role','status');status.setAttribute('aria-live','polite');
panel.append(description,nav,status);root.append(summary,panel);
const hero=main.querySelector('.hero'),facts=main.querySelector('.columns');
if(hero)hero.insertAdjacentElement('afterend',root);
else main.insertBefore(root,main.firstChild);
let country='',ready=false,loading=false,latestRequest=0;
const create=(key,title)=>{
 const action=E('button','mpq-link',title);action.type='button';action.dataset.mpqAction=key;
 action.setAttribute('aria-label',notices[key]);
 action.addEventListener('click',()=>activate(key));
 return action;
};
for(const [key,title] of steps)nav.append(create(key,title));
function targetFor(key){
 const step=steps.find(s=>s[0]===key);
 if(!step||!step[2])return null;
 return document.querySelector(step[2]);
}
async function waitForTarget(key){
 const request=latestRequest;
 for(let i=0;i<16;i++){
  if(request!==latestRequest)return null;
  const found=targetFor(key);
  if(found)return found;
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 return null;
}
function reveal(el){
 // Open every enclosing disclosure before scrolling or transferring keyboard focus.
 for(let ancestor=el;ancestor;ancestor=ancestor.parentElement){
  if(ancestor.tagName==='DETAILS')ancestor.open=true;
 }
 if(!el.matches?.('a,button,input,select,textarea,summary')&&!el.hasAttribute?.('tabindex'))
  el.setAttribute('tabindex','-1');
 el.scrollIntoView?.({behavior:'auto',block:'start'});
 el.focus?.({preventScroll:true});
}
async function activate(key){
 if(!steps.some(s=>s[0]===key))return false;
 const request=++latestRequest;
 status.textContent='';
 if(key==='country'){
  const search=new URLSearchParams();
  if(country)search.set('country',country);
  location.href='/directory/'+(search.size?'?'+search:'');
  return true;
 }
 if(key==='saved'){
  const toggle=document.getElementById('mpt-open');
  if(!toggle){status.textContent='Saved research is currently unavailable on this page.';return false;}
  toggle.click();return true;
 }
 const target=await waitForTarget(key);
 if(request!==latestRequest)return false;
 if(!target){status.textContent=notices[key]+' is currently unavailable. The original passport remains readable.';return false;}
 // A supplementary destination must be visible even when reading focus mode was enabled.
 if(key!=='overview'&&key!=='facts')window.MicroportReading?.activate('tools');
 reveal(target);
 status.textContent='Opened '+notices[key].toLowerCase()+'.';
 return true;
}
function updateCountry(project){
 country=typeof project?.country==='string'?project.country:'';
 for(const item of nav.children){
  if(item.dataset.mpqAction==='country'){
   item.setAttribute('aria-label','Browse '+(country||'all reported')+' country research records');
   item.title=country?'Directory filtered to '+country:'Browse complete directory';
  }
 }
}
function load(){
 if(loading)return;loading=true;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 fetch('/data/projects.json',{signal:controller.signal})
 .then(response=>{if(!response.ok)throw Error('Catalogue unavailable');return response.json();})
 .then(data=>{
  const rows=data?.records;
  if(!Array.isArray(rows)||rows.length<50||rows.some(p=>!p||typeof p.id!=='string'||!/^[a-z0-9-]+$/.test(p.id)||typeof p.name!=='string'||!p.name.trim())||new Set(rows.map(p=>p.id)).size!==rows.length)
   throw Error('Invalid catalogue');
  const record=rows.find(p=>p.id===id);if(!record)throw Error('Project unavailable');
  updateCountry(record);
  ready=true;root.dataset.mpqReady='true';
 }).catch(()=>{
  root.dataset.mpqReady='false';
  status.textContent='Country context unavailable; the other shortcuts remain usable.';
 }).finally(()=>{loading=false;clearTimeout(timer);});
}
window.MicroportQuickNav=Object.freeze({
 getState:()=>({ready,projectId:id,actions:nav.children.length,country}),
 getActions:()=>steps.map(s=>s[0]),
 getCountryURL:()=>'/directory/'+(country?'?'+new URLSearchParams({country}):''),
 activate
});
load();
})();