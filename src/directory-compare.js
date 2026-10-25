(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const panel=$('project-comparison'), table=$('comparison-table'), status=$('comparison-status'), help=$('comparison-help');
  if(!panel||!table||!status||!help)return;
  const controls=['comparison-copy','comparison-json','comparison-csv','comparison-clear'].map($);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeSource=p=>{try{const u=new URL(p.source?.url);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
  const hasMapPoint=p=>{const point=p.approximateMapPoint;return point&&typeof point.latitude==='number'&&typeof point.longitude==='number'&&Number.isFinite(point.latitude)&&Number.isFinite(point.longitude)&&Math.abs(point.latitude)<=85.05112878&&Math.abs(point.longitude)<=180;};
  const fields=[['Country','country'],['Region','region'],['Reported location','where'],['Infrastructure type','infrastructureType'],['Reported operator','reportedOperator'],['Reported equipment','reportedEquipment'],['Location precision','locationPrecision'],['Report-date label','reportDateLabel'],['Evidence status','verificationStatus']];
  const limitation='Reported research characteristics only. No independent confirmation of compatibility, current operations, contacts, public access or flight permission.';
  let viewSearch=null;
  function passportURL(id){const params=new URL('https://microportmap.com/directory/'+(viewSearch??new URL(location.href).search)).searchParams;let href='/projects/'+encodeURIComponent(id)+'/?compare='+encodeURIComponent(selected.join(','));for(const key of ['q','country','type','region','year','sort']){const value=params.get(key);if(value)href+='&'+key+'='+encodeURIComponent(value);}return href;}
  let records=[],selected=[],ready=false,generation=0,anchorPending=new URL(location.href).hash==='#project-comparison',selectionLoaded=false,observedSelection,selectionNotice='';
  const chosen=()=>selected.map(id=>records.find(p=>p.id===id)).filter(Boolean);
  function syncURL(){const u=new URL(location.href);u.searchParams.delete('compare');if(selected.length)u.searchParams.set('compare',selected.join(','));else if(u.hash==='#project-comparison')u.hash='results';try{history.replaceState(null,'',u.pathname+u.search+u.hash);}catch{}observedSelection=new URL(location.href).searchParams.get('compare');}
  function readSelection(){const requested=(new URL(location.href).searchParams.get('compare')||'').split(',').filter(Boolean);selected=[...new Set(requested)].filter(id=>/^[a-z0-9-]+$/.test(id)&&records.some(p=>p.id===id)).slice(0,3);return requested.length!==selected.length;}
  function render(message=''){
    generation++;
    const list=chosen();panel.hidden=!ready||!list.length;controls.forEach(c=>c.disabled=!ready||!list.length);
    help.textContent='Choose Compare on up to three project cards. Selection stays available while you change directory filters. '+selected.length+' of 3 selected.'+(selectionNotice?' '+selectionNotice:'');
    if(!ready){table.innerHTML='';return;}
    table.innerHTML=list.length?'<table><caption>Reported project comparison — '+list.length+' selected. Not an operational certification.</caption><thead><tr><th scope="col">Reported attribute</th>'+list.map(p=>'<th scope="col"><a href="'+esc(passportURL(p.id))+'">'+esc(p.name)+'</a><button type="button" class="comparison-remove" data-remove-project="'+esc(p.id)+'" aria-label="Remove '+esc(p.name)+' from comparison">Remove</button></th>').join('')+'</tr></thead><tbody>'+fields.map(([label,key])=>'<tr><th scope="row">'+label+'</th>'+list.map(p=>'<td>'+esc(p[key]||'Not recorded')+'</td>').join('')+'</tr>').join('')+'<tr><th scope="row">Approximate map reference</th>'+list.map(p=>'<td>'+(hasMapPoint(p)?'<a href="/?project='+encodeURIComponent(p.id)+'#atlas" aria-label="Show approximate map reference for '+esc(p.name)+'">Show on atlas ↗</a>':'Map reference unavailable')+'</td>').join('')+'</tr><tr><th scope="row">Public source</th>'+list.map(p=>{const url=safeSource(p);return '<td>'+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer" aria-label="Original source for '+esc(p.name)+' (opens in a new tab)">Original report ↗</a>':'Source unavailable')+'</td>';}).join('')+'</tr></tbody></table>':'';
    status.textContent=message||list.length+' of 3 projects selected. '+limitation;
    table.querySelectorAll('[data-remove-project]').forEach(button=>button.addEventListener('click',()=>{selectionNotice='';selected=selected.filter(id=>id!==button.dataset.removeProject);syncURL();render();(selected.length?$('comparison-heading'):$('search')).focus();}));
    $('results').querySelectorAll('article[data-project-id]').forEach(card=>{
      const id=card.dataset.projectId,p=records.find(r=>r.id===id);if(!p)return;
      let button=card.querySelector('.comparison-toggle');
      if(!button){button=document.createElement('button');button.type='button';button.className='comparison-toggle';button.dataset.compareProject=id;card.appendChild(button);button.addEventListener('click',()=>{selectionNotice='';if(selected.includes(id))selected=selected.filter(value=>value!==id);else if(selected.length<3)selected.push(id);syncURL();render();button.focus({preventScroll:true});});}
      const active=selected.includes(id);button.textContent=active?'✓ Comparing':'Compare';button.setAttribute('aria-label',(active?'Remove ':'Compare ')+p.name+(active?' from comparison':''));button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-controls','project-comparison');button.disabled=!active&&selected.length>=3;button.title=button.disabled?'Compare up to three projects':'';
    });
  }
  window.addEventListener('mp-directory-state',event=>{
    const state=event.detail;
    if(!state.ready||state.loading){ready=false;records=[];generation++;panel.hidden=true;table.innerHTML='';controls.forEach(c=>c.disabled=true);return;}
    viewSearch=typeof state.viewSearch==='string'?state.viewSearch:null;records=state.records||[];ready=true;const incoming=new URL(location.href).searchParams.get('compare');
    if(!selectionLoaded||incoming!==observedSelection){const removed=readSelection();selectionLoaded=true;selectionNotice=removed?'Unavailable, repeated or excess comparison selections were removed. Choose up to three current projects.':'';}
    const retained=selected.filter(id=>records.some(p=>p.id===id));if(retained.length!==selected.length)selectionNotice='Unavailable comparison selections were removed from the current dataset.';selected=retained;
    syncURL();render(selectionNotice);
    if(anchorPending){anchorPending=false;const target=selected.length?panel:help;target.scrollIntoView({behavior:'auto',block:'start'});(selected.length?$('comparison-heading'):help).focus({preventScroll:true});}
  });
  $('comparison-clear').addEventListener('click',()=>{selectionNotice='';selected=[];syncURL();render();$('search').focus();});
  $('comparison-copy').addEventListener('click',async()=>{
    if(!ready||!selected.length)return;
    const u=new URL('/directory/',location.origin);u.searchParams.set('compare',selected.join(','));u.hash='project-comparison';const version=generation;
    try{await navigator.clipboard.writeText(u.href);if(version===generation)status.textContent='Comparison link copied. '+limitation;}
    catch{if(version===generation)status.textContent='Copy this comparison link: '+u.href;}
  });
  function download(format){
    const list=chosen();if(!ready||!list.length){status.textContent='Choose projects before exporting a comparison.';return;}
    let url,link;
    try{
      let text,type;
      if(format==='json'){text=JSON.stringify({schemaVersion:'1.0',name:'MicroportMap project comparison',exportedAt:new Date().toISOString(),count:list.length,selectedProjectIds:list.map(p=>p.id),limitations:limitation,records:list},null,2);type='application/json;charset=utf-8';}
      else{const columns=['id','name',...fields.map(([,key])=>key),'sourceUrl'];const cell=value=>{let s=String(value??'');if(/^[\s\uFEFF]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};text='\uFEFF'+[columns,...list.map(p=>columns.map(key=>key==='sourceUrl'?p.source?.url:p[key]))].map(row=>row.map(cell).join(',')).join('\r\n');type='text/csv;charset=utf-8';}
      url=URL.createObjectURL(new Blob([text],{type}));link=document.createElement('a');link.href=url;link.download='microportmap-comparison.'+format;document.body.appendChild(link);link.click();status.textContent='Comparison '+format.toUpperCase()+' download requested. Your browser controls saving. '+limitation;
    }catch{status.textContent='Comparison download could not be started. Try the other format or the directory export.';}
    finally{link?.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),30000);}
  }
  $('comparison-json').addEventListener('click',()=>download('json'));
  $('comparison-csv').addEventListener('click',()=>download('csv'));
})();
