/* MicroportMap Passport Research Toolkit · 10 source-grounded actions on each of 50 passports. */
(()=>{
'use strict';
const matched=location.pathname.match(/^\/projects\/([a-z0-9-]+)\/?$/);
if(!matched || document.getElementById('mpp-toolkit'))return;
const id=matched[1],main=document.querySelector('main');
if(!main)return;
const E=(tag,cls,txt)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(txt!==undefined)el.textContent=String(txt);
  return el;
};
const action=(id,label,handler)=>{
  const b=E('button','mpp-action',label);b.type='button';
  b.dataset.mppAction=id;b.addEventListener('click',()=>loaded?handler():false);return b;
};
const href=(id,label,destination)=>{
  const a=E('a','mpp-action mpp-action-link',label);a.dataset.mppAction=id;
  a.href=destination;a.addEventListener('click',event=>{if(!loaded)event.preventDefault();});return a;
};
const sourceURL=p=>{
  try{
    const u=new URL(p.source?.url);
    return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;
  }catch{return null;}
};
const cleanText=v=>v.replace(/[\u0000-\u001f\u007f]/g,' ').trim();
const hasText=v=>typeof v==='string'&&cleanText(v).length>0;
const printable=v=>hasText(v)?cleanText(v):'Not stated';
const markdownText=v=>String(v).replace(/[\\`*_[\]<>|]/g,c=>'\\'+c);
const projectURL='https://microportmap.com/projects/'+encodeURIComponent(id)+'/';
const disclaimer='This is a source-linked public research reference, not independent verification of current operation, exact landing locations, site access, owner relationships or permission to fly.';
let record=null,busy=false,source=null,loaded=false,actionRequest=0;
const root=E('section','mpp-toolkit');root.id='mpp-toolkit';
root.setAttribute('aria-labelledby','mpp-heading');
const heading=E('div','mpp-heading');
const title=E('h2','','Research citation & evidence toolkit');title.id='mpp-heading';
const lead=E('p','mpp-lede','Reuse original published research fields without turning reported information into verified operational claims. Ten project-specific citation, export, review and discovery actions.');
heading.append(E('p','mpp-eyebrow','RESEARCH TOOLS / VERIFIED FIELD BOUNDARIES'),title,lead);
const info=E('div','mpp-overview');info.id='mpp-overview';
const toolbar=E('div','mpp-actions');toolbar.id='mpp-actions';
const status=E('p','mpp-status');status.id='mpp-status';
status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const fallback=E('div','mpp-copy-fallback');fallback.hidden=true;
const fallbackLabel=E('label','', 'Select and copy this text manually:');
const fallbackValue=E('textarea','mpp-copy-text');fallbackValue.readOnly=true;fallbackValue.rows=4;
fallbackValue.setAttribute('aria-label','Prepared text for manual copying');
fallbackLabel.append(fallbackValue);fallback.append(fallbackLabel);
const checks=E('div','mpp-evidence-fields');checks.id='mpp-evidence-fields';
const caveat=E('details','mpp-caveat');
caveat.append(E('summary','','What can these files actually prove?'),E('p','',disclaimer));
const retry=E('button','mpp-retry','Retry loading research record');
retry.type='button';retry.hidden=true;retry.addEventListener('click',load);
root.append(heading,info,toolbar,status,fallback,checks,caveat,retry);
const host=main.querySelector('.columns')||main.querySelector('.hero');
if(host)host.insertAdjacentElement('afterend',root);
else main.append(root);
const string=p=>({
  id:printable(p.id),
  name:printable(p.name),
  where:printable(p.where),
  country:printable(p.country),
  region:printable(p.region),
  category:printable(p.infrastructureType),
  operator:printable(p.reportedOperator),
  equipment:printable(p.reportedEquipment),
  precision:printable(p.locationPrecision),
  date:printable(p.reportDateLabel),
  verification:printable(p.verificationStatus),
  sourceName:printable(p.source?.name),
  sourceURL:sourceURL(p)||'Source URL not available',
  projectURL
});
function current(){return string(record);}
function citationPlain(){
  const p=current();
  return p.name+' — MicroportMap research record ('+p.country+'). Source attribution: '+
    p.sourceName+'. Source report label: '+p.date+'. Original source: '+p.sourceURL+
    '. Record: '+projectURL+'. Note: '+disclaimer;
}
function citationMarkdown(){
  const p=current();
  return '**'+markdownText(p.name)+'** — MicroportMap public research reference.\n\n'+
    '- **Reported country:** '+markdownText(p.country)+'\n'+
    '- **Reported infrastructure:** '+markdownText(p.category)+'\n'+
    '- **Original source attribution:** '+markdownText(p.sourceName)+'\n'+
    '- **Source report timing:** '+markdownText(p.date)+'\n'+
    '- **Source link:** '+markdownText(p.sourceURL)+'\n'+
    '- **Project passport:** '+projectURL+'\n\n> '+disclaimer;
}
function citationBibTeX(){
  const p=current();
  const bib=v=>String(v).replace(/[\\{}%&#_$~^]/g,c=>({
    '\\':'\\textbackslash{}','{':'\\{','}':'\\}','%':'\\%','&':'\\&',
    '#':'\\#','_':'\\_','$':'\\$','~':'\\textasciitilde{}','^':'\\textasciicircum{}'
  }[c])).replace(/[\r\n]+/g,' ');
  return '@misc{microportmap_'+id+',\n'+
    '  title = {'+bib(p.name)+'},\n'+
    '  howpublished = {MicroportMap research record; original source: '+bib(p.sourceName)+'},\n'+
    '  note = {'+bib('Source report label: '+p.date+'. '+disclaimer)+'},\n'+
    '  url = {'+bib(projectURL)+'}\n'+
    '}\n% This is a citation for the MicroportMap catalogue record, not an invented publisher/date attribution.';
}
const briefFields=[
  ['Project','name'],['Country','country'],['Region','region'],
  ['Reported location','where'],['Infrastructure category','category'],
  ['Reported operator attribution','operator'],['Reported equipment','equipment'],
  ['Location precision','precision'],['Source report label','date'],
  ['Evidence status','verification'],['Original source name','sourceName'],
  ['Original source URL','sourceURL'],['Research passport','projectURL']
];
function briefText(){
  const p=current();
  return 'MicroportMap · Source-linked Research Brief\n'+'='.repeat(40)+'\n\n'+
    briefFields.map(([label,k])=>label+': '+p[k]).join('\n')+
    '\n\nInterpretation\n--------------\n'+disclaimer+'\n';
}
function briefMarkdown(){
  const p=current();
  const escape=markdownText;
  return '# '+markdownText(p.name)+'\n\n**MicroportMap research brief · source-reported information**\n\n'+
    '| Published field | Reported value |\n| --- | --- |\n'+
    briefFields.map(([label,k])=>'| '+escape(label)+' | '+escape(p[k])+' |').join('\n')+
    '\n\n## Limitations\n\n'+disclaimer+'\n\n_Review the original source before sharing claims._\n';
}
function checklist(){
  const p=current();
  return [
    ['Original source link is valid HTTPS',!!source,p.sourceURL],
    ['Report label contains an explicit four-digit year',/\b20[0-9]{2}\b/.test(p.date),p.date],
    ['Reported country provided',hasText(record?.country),p.country],
    ['Reported operator attribution provided',hasText(record?.reportedOperator),p.operator],
    ['Reported equipment provided',hasText(record?.reportedEquipment),p.equipment],
    ['Location precision explicitly described',hasText(record?.locationPrecision),p.precision],
    ['Evidence limitation explicitly described',hasText(record?.verificationStatus),p.verification]
  ];
}
function reviewText(){
  return 'MicroportMap field-presence review for '+record.name+'\n'+
    checklist().map(([label,yes,value])=>(yes?'[Recorded] ':'[Review] ')+label+': '+value).join('\n')+
    '\n\nNote: [Recorded] describes a field being present; it does not independently authenticate the source or current operations.\n'+disclaimer;
}
function reviewCSV(){
  const rows=[['field_check','catalog_field_present','original_reported_value'],
    ['Research project','Recorded',record.name],
    ...checklist().map(([label,yes,value])=>[label,yes?'Recorded':'Review',value])];
  const safe=v=>{
    let s=String(v??'');if(/^[\s\uFEFF]*[=+@-]/.test(s))s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  };
  return '\uFEFF'+rows.map(r=>r.map(safe).join(',')).join('\r\n');
}
function quickFacts(){
  const p=current();
  return p.name+' | '+p.country+' · '+p.region+' | '+p.category+
    ' | Equipment: '+p.equipment+' | Report label: '+p.date+
    ' | Evidence: '+p.verification+' | '+projectURL+'\n'+disclaimer;
}
async function copyText(value,label){
  if(!loaded)return false;
  const request=++actionRequest;
  fallback.hidden=true;fallbackValue.value='';status.textContent='Copying '+label+'…';
  let timeout;
  try{
    if(!navigator.clipboard?.writeText)throw Error('Clipboard is unavailable');
    await Promise.race([
      navigator.clipboard.writeText(value),
      new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Clipboard timed out')),800);})
    ]);
    if(request!==actionRequest)return false;
    status.textContent=label+' copied. No information was submitted.';
    return true;
  }catch{
    if(request!==actionRequest)return false;
    fallbackValue.value=value;
    fallback.hidden=false;
    fallbackValue.focus({preventScroll:true});
    fallbackValue.select();
    status.textContent='Automatic copying unavailable. Select the prepared '+label+' text below.';
    return false;
  }finally{
    if(timeout)clearTimeout(timeout);
  }
}
function download(text,filename,type='text/plain;charset=utf-8'){
  if(!loaded)return false;
  actionRequest++;fallback.hidden=true;fallbackValue.value='';
  let url=null,a=null;
  try{
    url=URL.createObjectURL(new Blob([text],{type}));
    a=E('a');a.href=url;a.download=filename;document.body.append(a);a.click();
    status.textContent='Download requested: '+filename+'. Your browser controls file saving.';
    fallback.hidden=true;
    return true;
  }catch{
    fallbackValue.value=text;fallback.hidden=false;fallbackValue.focus({preventScroll:true});fallbackValue.select();
    status.textContent='Download could not start. You can copy the prepared text instead.';
    return false;
  }finally{
    a?.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
}
function revealInfo(){
  info.replaceChildren();
  const p=current();
  for(const [label,value] of [
    ['Country',p.country],['Category',p.category],['Report label',p.date],
    ['Source',p.sourceName]]){
    const row=E('div','mpp-quickfact');
    row.append(E('small','',label),E('strong','',value));info.append(row);
  }
}
function renderEvidence(){
  checks.replaceChildren();
  const title=E('h3','','Field-presence review (not independent verification)');
  const desc=E('p','mpp-description','“Recorded” means the original catalogue contains a field. It does not mean the record, operation or coordinates have been independently verified.');
  checks.append(title,desc);
  const list=E('ul','mpp-check-list');
  for(const [label,yes,value] of checklist()){
    const item=E('li','mpp-check');
    item.append(E('span','mpp-check-state',yes?'Recorded':'Review'),
      E('strong','',label),E('small','',value));list.append(item);
  }
  checks.append(list);
}
function render(){
  const p=current();
  toolbar.replaceChildren();
  const actions=[
    action('citation-plain','Copy citation',()=>copyText(citationPlain(),'citation')),
    action('citation-markdown','Copy Markdown citation',()=>copyText(citationMarkdown(),'Markdown citation')),
    action('citation-bibtex','Copy BibTeX',()=>copyText(citationBibTeX(),'BibTeX citation')),
    action('download-brief-txt','Download text brief',()=>download(briefText(),'microportmap-'+id+'-brief.txt')),
    action('download-brief-md','Download Markdown brief',()=>download(briefMarkdown(),'microportmap-'+id+'-brief.md','text/markdown;charset=utf-8')),
    action('copy-review','Copy field review',()=>copyText(reviewText(),'field-presence review')),
    action('download-review-csv','Download review CSV',()=>download(reviewCSV(),'microportmap-'+id+'-review.csv','text/csv;charset=utf-8')),
    action('copy-facts','Copy key facts',()=>copyText(quickFacts(),'key facts')),
    href('original-source','Open original source ↗',source||'#mpp-evidence-fields'),
    href('same-equipment','Find equipment mentions ↗','/directory/?'+new URLSearchParams({q:p.equipment==='Not stated'?'':p.equipment}))
  ];
  if(!source){
    actions[8].setAttribute('aria-disabled','true');
    actions[8].setAttribute('title','Original source URL is not available in this record');
    actions[8].addEventListener('click',e=>{e.preventDefault();status.textContent='Original source URL unavailable for this record.';});
  }else{actions[8].target='_blank';actions[8].rel='noopener noreferrer';}
  if(p.equipment==='Not stated'){
    actions[9].setAttribute('aria-disabled','true');
    actions[9].addEventListener('click',e=>{e.preventDefault();status.textContent='Reported equipment is not documented.';});
  }
  actions.forEach(el=>toolbar.append(el));
  revealInfo();renderEvidence();
  loaded=true;root.dataset.mppLoaded='true';
  status.textContent='Ten research actions available for '+p.name+'. No information is submitted to a server.';
}
function errorMessage(){
  loaded=false;record=null;source=null;toolbar.replaceChildren();info.replaceChildren();checks.replaceChildren();
  status.textContent='Could not load the source record. The original passport above remains readable.';
  retry.hidden=false;root.dataset.mppLoaded='false';
}
function load(){
  if(busy)return;
  busy=true;loaded=false;record=null;source=null;actionRequest++;
  toolbar.replaceChildren();info.replaceChildren();checks.replaceChildren();fallback.hidden=true;fallbackValue.value='';
  root.dataset.mppLoaded='false';root.setAttribute('aria-busy','true');
  retry.hidden=true;retry.disabled=true;
  status.textContent='Loading the original research record…';
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  fetch('/data/projects.json',{signal:controller.signal}).then(r=>{
    if(!r.ok)throw Error('Dataset unavailable');return r.json();
  }).then(data=>{
    const rows=data?.records;
    if(!Array.isArray(rows)||rows.length!==50||
      rows.some(r=>!r||typeof r.id!=='string'||!/^[a-z0-9-]+$/.test(r.id)||typeof r.name!=='string'||!r.name.trim())||
      new Set(rows.map(r=>r.id)).size!==50)throw Error('Invalid catalogue');
    const matched=rows.find(r=>r.id===id);
    if(!matched)throw Error('Record missing');
    record=matched;source=sourceURL(record);
    render();
  }).catch(errorMessage).finally(()=>{busy=false;retry.disabled=false;root.setAttribute('aria-busy','false');clearTimeout(timer);});
}
window.MicroportPassportToolkit=Object.freeze({
  getState:()=>({loaded,loading:busy,id,actions:toolbar.querySelectorAll('[data-mpp-action]').length}),
  getLabels:()=>[...toolbar.querySelectorAll('[data-mpp-action]')].map(x=>x.dataset.mppAction)
});
load();
})();