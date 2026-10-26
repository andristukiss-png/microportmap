/* MicroportMap Insights: research record summaries, not verified infrastructure claims. */
(()=>{
'use strict';
if(document.documentElement.dataset.mpInsights)return;
document.documentElement.dataset.mpInsights='ready';
const make=(t,c,s)=>{const n=document.createElement(t);if(c)n.className=c;if(s!==undefined)n.textContent=String(s);return n;};
const a=(s,url,c='mpi-link')=>{const n=make('a',c,s);n.href=url;return n;};
const btn=(s,action,c='mpi-button')=>{const n=make('button',c,s);n.type='button';n.addEventListener('click',action);return n;};
const opt=(value,label)=>{const n=make('option','',label);n.value=value;return n;};
const dims=[['country','Country','ins_country'],['type','Infrastructure','ins_type'],['region','Region','ins_region'],['year','Report year','ins_year']];
const values={country:'',type:'',region:'',year:'',q:''};
let all=[],match=[],loaded=false,loading=false,by='count',display='count',maxCountries=8,limit=6,ordering='name';
const field=p=>({country:p.country||'Unspecified',type:p.infrastructureType||'Unspecified',region:p.region||'Unspecified',
 year:(String(p.reportDateLabel||'').match(/\b20[0-9]{2}\b/)||[])[0]||'Unspecified'});
const counts=(rows,key)=>{const d=new Map();for(const p of rows){const v=field(p)[key];d.set(v,(d.get(v)||0)+1);}return [...d].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));};
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const src=r=>{try{const x=new URL(r?.source?.url);return x.protocol==='https:'&&!x.username&&!x.password?x.href:null;}catch{return null;}};
const root=make('section','mpi-insights');root.id='insights';root.setAttribute('aria-labelledby','mpi-title');
const intro=make('header','mpi-intro');
const text=make('div','mpi-intro-copy');
text.append(make('p','mpi-eyebrow','RESEARCH COVERAGE / INTERACTIVE'),
 make('h2','','What does the research actually cover?'),
 make('p','mpi-intro-text','Explore the 50 published research references by place, infrastructure, region and source report year. These are reports, not independently verified operational facilities.'));
text.querySelector('h2').id='mpi-title';
intro.append(text,a('Browse all project records','/directory/','mpi-primary'));
const stats=make('div','mpi-stats');stats.id='mpi-stats';
const filters=make('div','mpi-filters');
const searchLabel=make('label','mpi-field');searchLabel.append(make('span','','Search evidence'));
const query=make('input','mpi-input');query.id='mpi-search';query.type='search';query.placeholder='Project, operator, equipment…';query.autocomplete='off';searchLabel.append(query);filters.append(searchLabel);
const selects={};
for(const [key,label] of dims){const wrap=make('label','mpi-field'),sel=make('select','mpi-select');sel.id='mpi-'+key;sel.append(opt('','All '+label.toLowerCase()+'s'));wrap.append(make('span','',label),sel);filters.append(wrap);selects[key]=sel;}
const reset=btn('Clear insight filters',()=>{Object.assign(values,{country:'',type:'',region:'',year:'',q:''});limit=6;updateInputs();filter();query.focus();},'mpi-secondary');filters.append(reset);
const active=make('div','mpi-active');active.id='mpi-active';
const summary=make('p','mpi-summary');summary.id='mpi-summary';summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');
const displayBar=make('div','mpi-display');
const countButton=btn('Counts',()=>setDisplay('count'),'mpi-tab');
const shareButton=btn('Percentages',()=>setDisplay('share'),'mpi-tab');
const mostButton=btn('Most first',()=>setOrder('count'),'mpi-tab');
const alphaButton=btn('A–Z',()=>setOrder('alpha'),'mpi-tab');
displayBar.append(make('span','mpi-small','CHART VIEW'),countButton,shareButton,mostButton,alphaButton);
const charts=make('div','mpi-charts');charts.id='mpi-charts';
const results=make('section','mpi-results');results.id='mpi-results';
const head=make('div','mpi-results-head');
head.append(make('h3','','Research records behind these numbers'),make('p','','Open a passport or the original source to evaluate the claim.'));
const orderingSelect=make('select','mpi-select');orderingSelect.id='mpi-record-sort';orderingSelect.setAttribute('aria-label','Sort matching research records');
for(const [v,l] of [['name','Project A–Z'],['country','Country A–Z'],['year','Newest source report year']])orderingSelect.append(opt(v,l));
head.append(orderingSelect);
const cards=make('div','mpi-cards');cards.id='mpi-cards';
const showMore=btn('Show more projects',()=>{limit+=6;renderRecords();},'mpi-secondary');
const showLess=btn('Show fewer projects',()=>{limit=6;renderRecords();},'mpi-secondary');
const pageActions=make('div','mpi-page-actions');pageActions.append(showMore,showLess);
results.append(head,cards,pageActions);
const outputs=make('div','mpi-outputs');
const json=btn('Export JSON',()=>download('json'),'mpi-primary');
const csv=btn('Export CSV',()=>download('csv'),'mpi-primary');
const copyBtn=btn('Copy insights link',copyLink,'mpi-secondary');
const directoryLink=a('Open filtered directory','/directory/','mpi-secondary');directoryLink.id='mpi-directory-link';
outputs.append(json,csv,copyBtn,directoryLink);
const notice=make('p','mpi-notice');notice.id='mpi-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
const disclosure=make('details','mpi-disclosure');disclosure.append(make('summary','','How to read these results'),
 make('p','','Counts cover published research records only. A year in a report label does not establish an installation or opening year; “Unspecified” means no explicit year in the label. Current operations, public access, exact coordinates and flight permission are not independently verified.'));
const error=make('section','mpi-error');error.hidden=true;error.setAttribute('role','alert');
error.append(make('p','','Insights could not load the catalogue; directory and map remain available.'),btn('Retry insight data',load,'mpi-secondary'));
root.append(intro,stats,filters,active,summary,displayBar,charts,results,outputs,notice,disclosure,error);
function place(){
 document.querySelectorAll('.mp-continue-topics').forEach(nav=>{
  if(nav.querySelector('[data-mpi-link]'))return;
  const l=a('Research insights','/#insights');l.dataset.mpiLink='1';nav.append(l);
 });
 const directory=document.querySelector('.mpx-directory-tools');
 if(directory&&!directory.querySelector('[data-mpi-link]')){
  const l=a('Explore the global research picture','/#insights','mpi-secondary');l.dataset.mpiLink='1';directory.append(l);
 }
 const quality=document.querySelector('.mpx-quality-guide');
 if(quality&&!quality.querySelector('[data-mpi-link]')){
  const l=a('Explore research coverage','/#insights','mpi-secondary');l.dataset.mpiLink='1';quality.append(l);
 }
 const passport=document.querySelector('.mpx-passport-explore');
 if(passport&&!passport.querySelector('[data-mpi-link]')){
  const l=a('Research insights by country','/#insights','mpi-secondary');l.dataset.mpiLink='1';passport.append(l);
 }
 if(!document.getElementById('atlas'))return;
 const anchor=document.getElementById('mpx-research-hub')||document.querySelector('.stats');
 anchor?.insertAdjacentElement('afterend',root);
 const heroActions=document.querySelector('.hero-actions');
 if(heroActions&&!heroActions.querySelector('[data-mpi-hero]')){
  const entry=a('Research insights ↓','#insights','ghost');
  entry.dataset.mpiHero='1';
  heroActions.append(entry);
 }
 const reveal=()=>{if(location.hash==='#insights')root.scrollIntoView({behavior:'instant',block:'start'});};
 requestAnimationFrame(reveal);
 setTimeout(reveal,250);
 setTimeout(reveal,1200);
 window.addEventListener('hashchange',reveal);
}
function getLink(){
 const u=new URL('/',location.origin);
 for(const [k,,param] of dims)if(values[k])u.searchParams.set(param,values[k]);
 if(values.q)u.searchParams.set('ins_q',values.q);
 u.hash='insights';return u;
}
function readLink(){
 const qs=new URLSearchParams(location.search);
 for(const [k,,param] of dims)values[k]=qs.get(param)||'';
 values.q=qs.get('ins_q')||'';
}
function syncLink(){
 const u=new URL(location.href);
 for(const [k,,param] of dims){u.searchParams.delete(param);if(values[k])u.searchParams.set(param,values[k]);}
 u.searchParams.delete('ins_q');if(values.q)u.searchParams.set('ins_q',values.q);
 try{history.replaceState(null,'',u.pathname+u.search+u.hash);}catch{}
}
function fillOptions(){
 for(const [k,label] of dims){
  const allowed=counts(all,k).map(x=>x[0]);selects[k].replaceChildren(opt('','All '+label.toLowerCase()+'s'));
  allowed.forEach(v=>selects[k].append(opt(v,k==='year'&&v==='Unspecified'?'Year unspecified':v)));
  if(!allowed.includes(values[k]))values[k]='';
 }
}
function updateInputs(){query.value=values.q;dims.forEach(([k])=>{selects[k].value=values[k];});}
function filter(){
 if(!loaded)return;
 match=all.filter(p=>{
  const d=field(p);
  if(dims.some(([k])=>values[k]&&values[k]!==d[k]))return false;
  const content=fold([p.name,p.where,p.country,p.region,p.infrastructureType,p.reportedOperator,p.reportedEquipment,p.description,p.verificationStatus].join(' '));
  return fold(values.q).split(/\s+/).filter(Boolean).every(w=>content.includes(w));
 });
 summary.textContent=match.length+' of '+all.length+' research records match your filters.';
 const cards=[
 [match.length,'Matching records'],
 [counts(match,'country').length,'Countries'],
 [counts(match,'type').length,'Infrastructure types'],
 [counts(match,'region').length,'Regions'],
 [match.filter(p=>field(p).year!=='Unspecified').length,'With report year']
 ];
 stats.replaceChildren();
 for(const [n,name] of cards){const c=make('div','mpi-stat');c.append(make('strong','',n),make('span','',name));stats.append(c);}
 renderActive();renderCharts();renderRecords();
 const dest=new URL('/directory/',location.origin);
 for(const [k,p] of [['q','q'],['country','country'],['type','type'],['region','region'],['year','year']])if(values[k])dest.searchParams.set(p,values[k]);
 directoryLink.href=dest.pathname+dest.search;
 reset.disabled=!values.q&&!dims.some(([k])=>values[k]);
 json.disabled=csv.disabled=!match.length;
 syncLink();
}
function renderActive(){
 active.replaceChildren();
 for(const [k,name] of [['q','Search'],...dims.map(([k,l])=>[k,l])]){
  if(!values[k])continue;
  const label=values[k];const b=btn(name+': '+label+' ✕',()=>{values[k]='';limit=6;updateInputs();filter();},'mpi-chip');
  b.setAttribute('aria-label','Remove '+name+' filter '+label);active.append(b);
 }
 if(!active.childElementCount)active.append(make('span','mpi-muted','All research records · no filters applied'));
}
function setDisplay(v){display=v;renderCharts();countButton.setAttribute('aria-pressed',String(v==='count'));shareButton.setAttribute('aria-pressed',String(v==='share'));}
function setOrder(v){by=v;renderCharts();mostButton.setAttribute('aria-pressed',String(v==='count'));alphaButton.setAttribute('aria-pressed',String(v==='alpha'));}
function choose(k,v){values[k]=values[k]===v?'':v;limit=6;updateInputs();filter();}
function renderCharts(){
 charts.replaceChildren();
 for(const [k,label] of dims){
  const group=make('section','mpi-chart');
  group.append(make('h3','',k==='year'?'Source report years':label+' distribution'));
  const bars=make('div','mpi-bars');let entries=counts(match,k);if(by==='alpha')entries.sort((a,b)=>a[0].localeCompare(b[0]));
  const full=entries.length;if(k==='country')entries=entries.slice(0,maxCountries);
  if(!entries.length)bars.append(make('p','mpi-muted','No records for these filters.'));
  const max=Math.max(1,...entries.map(x=>x[1]));
  for(const [labelText,n] of entries){
   const row=btn('',()=>choose(k,labelText),'mpi-bar');
   row.setAttribute('aria-label','Filter '+label+' by '+labelText+': '+n+' matching records');
   row.setAttribute('aria-pressed',String(values[k]===labelText));
   const top=make('span','mpi-bar-labels');
   top.append(make('span','',k==='year'&&labelText==='Unspecified'?'No explicit year':labelText),
     make('strong','',display==='share'?(match.length?(100*n/match.length).toFixed(1)+'%':'0%'):n+' / '+match.length));
   const track=make('span','mpi-bar-track'),fill=make('span','mpi-bar-fill');
   fill.style.width=(100*n/max).toFixed(1)+'%';track.append(fill);row.append(top,track);bars.append(row);
  }
  group.append(bars);
  if(k==='country'&&full>8)group.append(btn(maxCountries===8?'Show all countries':'Show top countries',
   ()=>{maxCountries=maxCountries===8?100:8;renderCharts();},'mpi-more'));
  charts.append(group);
 }
}
function renderRecords(){
 cards.replaceChildren();
 const list=match.slice();
 if(ordering==='year')list.sort((a,b)=>(Number(field(b).year)||0)-(Number(field(a).year)||0)||a.name.localeCompare(b.name));
 else if(ordering==='country')list.sort((a,b)=>String(a.country).localeCompare(String(b.country))||a.name.localeCompare(b.name));
 else list.sort((a,b)=>a.name.localeCompare(b.name));
 if(!list.length)cards.append(make('p','mpi-empty','No records match these filters; clear a selection above.'));
 for(const p of list.slice(0,limit)){
  const item=make('article','mpi-card');
  item.append(make('small','',p.country+' · '+p.infrastructureType),make('h4','',p.name),
   make('p','',p.where||p.region||'Location not stated'),make('span','mpi-report-date',p.reportDateLabel||'Report date not stated'));
  const action=make('div','mpi-card-actions');action.append(a('Research passport','/projects/'+encodeURIComponent(p.id)+'/'));
  const source=src(p);if(source){const s=a('Original evidence ↗',source);s.rel='noopener noreferrer';s.target='_blank';action.append(s);}
  item.append(action);cards.append(item);
 }
 showMore.hidden=list.length<=limit;showLess.hidden=limit<=6;
}
function notify(m){notice.textContent=m;}
function exportCSV(rows,keys){
 const cell=value=>{let s=String(value??'');if(/^[\s\uFEFF]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return '\uFEFF'+[keys,...rows.map(p=>keys.map(k=>k==='sourceUrl'?src(p)||'':p[k]))].map(row=>row.map(cell).join(',')).join('\r\n');
}
function download(format){
 if(!match.length)return;
 const filename='microportmap-insights.'+format;
 const content=format==='json'?JSON.stringify({title:'MicroportMap research coverage',
   filters:{...values},count:match.length,
   caveat:'Source-linked reports only; operations, public access, flight permission unverified.',
   records:match},null,2):
   exportCSV(match,['id','name','country','region','infrastructureType','reportDateLabel','verificationStatus','reportedOperator','sourceUrl']);
 const type=format==='json'?'application/json;charset=utf-8':'text/csv;charset=utf-8';
 let object,anchor;
 try{
  object=URL.createObjectURL(new Blob([content],{type}));anchor=make('a');anchor.href=object;anchor.download=filename;
  document.body.append(anchor);anchor.click();notify(format.toUpperCase()+' export requested for '+match.length+' records.');
 }catch{notify('Export could not start; try the directory.');}
 finally{anchor?.remove();if(object)setTimeout(()=>URL.revokeObjectURL(object),30000);}
}
async function copyLink(){
 const url=getLink().toString();
 try{await navigator.clipboard.writeText(url);notify('Research insights link copied.');}
 catch{notify('Copy this link: '+url);}
}
function load(){
 if(loading)return;loading=true;error.hidden=true;summary.textContent='Loading published research records…';
 fetch('/data/projects.json').then(r=>{if(!r.ok)throw Error('Fetch failed');return r.json();}).then(data=>{
  if(!Array.isArray(data.records)||data.records.length!==50||
   data.records.some(p=>!p||typeof p.id!=='string'||!/^[a-z0-9-]+$/.test(p.id)||typeof p.name!=='string'||!p.name.trim())||
   new Set(data.records.map(p=>p.id)).size!==50)throw Error('Invalid catalog');
  all=data.records.slice();loaded=true;loading=false;readLink();fillOptions();updateInputs();setDisplay('count');setOrder('count');filter();
  document.documentElement.dataset.mpInsightsLoaded='1';
 }).catch(()=>{loading=false;error.hidden=false;summary.textContent='Research insights are currently unavailable.';});
}
query.addEventListener('input',()=>{values.q=query.value.trim();limit=6;filter();});
for(const [k] of dims)selects[k].addEventListener('change',()=>{values[k]=selects[k].value;limit=6;filter();});
orderingSelect.addEventListener('change',()=>{ordering=orderingSelect.value;limit=6;renderRecords();});
window.addEventListener('popstate',()=>{if(loaded){readLink();updateInputs();filter();}});
place();
if(document.getElementById('atlas'))load();
window.MicroportInsights=Object.freeze({
 getState:()=>({...values,matching:match.length,loaded}),
 getMatches:()=>match.map(x=>x.id),
 countBy:key=>dims.some(d=>d[0]===key)?counts(match,key):[]
});
})();
