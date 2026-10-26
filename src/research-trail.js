/* MicroportMap Research Trail: optional browser-local project shortlist. */
(() => {
  'use strict';
  if (document.documentElement.dataset.mptReady) return;
  document.documentElement.dataset.mptReady = '1';
  const LIMIT=5,KEY='microportmap.research-trail.v1';
  const byId=id=>document.getElementById(id);
  const safeId=id=>typeof id==='string'&&/^[a-z0-9-]+$/.test(id);
  const make=(tag,cls,txt)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(txt!==undefined)el.textContent=String(txt);
    return el;
  };
  const link=(title,url,cls='mpt-link')=>{
    const el=make('a',cls,title);el.href=url;return el;
  };
  const act=(title,callback,cls='mpt-button')=>{
    const el=make('button',cls,title);el.type='button';
    el.addEventListener('click',callback);return el;
  };
  const passport=id=>'/projects/'+encodeURIComponent(id)+'/';
  const atlas=id=>'/?project='+encodeURIComponent(id)+'#atlas';
  const directory=(key,value)=>'/directory/?'+new URLSearchParams({[key]:value});
  const status=make('span','mpt-live');status.setAttribute('role','status');
  status.setAttribute('aria-live','polite');
  let stored=false,records=[],selected=[],waiting=[],loaded=false,failed=false,
    opened=false,returnFocus=null,request=null,saveObserver=null,filter='',sort='saved',
    currentFiltered=[],pendingShare=[];
  function dedupe(ids){
    if(!Array.isArray(ids))return [];
    const out=[];
    for(const id of ids)if(safeId(id)&&!out.includes(id)&&out.length<LIMIT)out.push(id);
    return out;
  }
  function getStore() {
    try {
      const value=localStorage.getItem(KEY);
      if(value!==null){const parsed=JSON.parse(value);return dedupe(parsed);}
      localStorage.setItem(KEY,'[]');
      stored=true;return [];
    }catch {stored=false;return [];}
  }
  selected=getStore();
  function persist(){
    try{localStorage.setItem(KEY,JSON.stringify(selected));stored=true;}
    catch{stored=false;}
  }
  function announce(message){status.textContent=message;}
  function record(id){return records.find(p=>p.id===id);}
  function validate(raw){
    if(!raw||!Array.isArray(raw.records)||!raw.records.length)throw Error('Invalid catalog');
    const ids=new Set();
    for(const item of raw.records){
      if(!item||!safeId(item.id)||typeof item.name!=='string'||!item.name.trim()||ids.has(item.id))
        throw Error('Invalid record');
      ids.add(item.id);
    }
    return raw.records.slice();
  }
  function fetchRecords(){
    if(request)return request;
    request=fetch('/data/projects.json').then(r=>{
      if(!r.ok)throw Error('Catalog not available');
      return r.json();
    }).then(data=>{
      records=validate(data);loaded=true;failed=false;
      selected=selected.filter(id=>record(id));
      if(selected.length)persist();
      pendingShare=pendingShare.filter(id=>record(id));
      render();scan();return records;
    }).catch(error=>{failed=true;loaded=false;request=null;render();throw error;});
    return request;
  }
  const trigger=act('Saved research · 0',open,'mpt-trigger');
  trigger.id='mpt-open';trigger.setAttribute('aria-haspopup','dialog');
  trigger.setAttribute('aria-controls','mpt-drawer');trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-keyshortcuts','Alt+Shift+T');
  const backdrop=make('div','mpt-backdrop');backdrop.id='mpt-drawer';backdrop.hidden=true;
  backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');
  backdrop.setAttribute('aria-labelledby','mpt-title');
  const panel=make('section','mpt-panel');
  const heading=make('h2','', 'Your research trail');heading.id='mpt-title';
  const description=make('p','mpt-note',
    'Save up to five public research records. Your shortlist stays in this browser when storage is available; it is not a contact list, a verified operational map or a submission.');
  const top=make('div','mpt-head');
  const close=act('Close ✕',dismiss,'mpt-close');
  top.append(heading,close);
  const shared=make('div','mpt-shared');shared.hidden=true;
  const notice=make('p','mpt-storage');
  const tools=make('div','mpt-controls');
  const query=make('input','mpt-filter');
  query.type='search';query.placeholder='Find a saved record…';
  query.setAttribute('aria-label','Filter saved research projects');
  const order=make('select','mpt-sort');order.setAttribute('aria-label','Sort saved projects');
  for(const [value,name] of [['saved','Saved order'],['name','Name A–Z'],['country','Country A–Z']]){
    const opt=make('option','',name);opt.value=value;order.appendChild(opt);
  }
  tools.append(query,order);
  const summary=make('p','mpt-summary');summary.setAttribute('aria-live','polite');
  const list=make('div','mpt-list');list.id='mpt-list';
  const foot=make('div','mpt-footer');
  const recommendations=make('div','mpt-recommendations');
  const outputs=make('div','mpt-actions');
  const more=make('div','mpt-reads');
  more.append(link('Browse directory','/directory/'),link('Research methodology','/methodology/'),
    link('Data-quality review','/data-quality/'));
  panel.append(top,description,shared,notice,tools,summary,list,recommendations,outputs,more,status);
  backdrop.appendChild(panel);
  document.body.append(trigger,backdrop);
  const action= (title,fn,cls='mpt-button')=>{const b=act(title,fn,cls);outputs.appendChild(b);return b;};
  const compare=action('Compare saved projects',()=>navigateCompare());
  const json=action('Export trail JSON',()=>exportData('json'));
  const csv=action('Export trail CSV',()=>exportData('csv'));
  const share=action('Copy shareable trail',()=>shareLink());
  const clear=action('Clear saved trail',()=>clearAll(),'mpt-quiet');
  function updateCounter(){
    trigger.textContent='Saved research · '+selected.length;
    for(const b of document.querySelectorAll('[data-mpt-save]')){
      const id=b.getAttribute('data-mpt-save');
      const has=selected.includes(id);
      b.textContent=has?'✓ Saved to trail':'+ Save to trail';
      b.setAttribute('aria-pressed',String(has));
      b.disabled=!has&&selected.length>=LIMIT;
      b.title=b.disabled?'Your trail can hold up to five projects':'';
    }
  }
  function save(id) {
    if(!safeId(id)||loaded&&!record(id))return announce('That record is not available.');
    if(selected.includes(id)){selected=selected.filter(x=>x!==id);announce('Removed project from your trail.');}
    else {
      if(selected.length>=LIMIT){announce('Five project limit reached. Remove one before saving another.');return;}
      selected.push(id);announce('Project saved to your research trail.');
    }
    persist();render();
  }
  function visible(){
    let rows=selected.map(record).filter(Boolean);
    const q=query.value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(q)rows=rows.filter(p=>[p.name,p.country,p.region,p.infrastructureType].join(' ')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q));
    if(order.value==='name')rows.sort((a,b)=>a.name.localeCompare(b.name));
    if(order.value==='country')rows.sort((a,b)=>
      String(a.country).localeCompare(String(b.country))||a.name.localeCompare(b.name));
    return rows;
  }
  function savedCard(p,index){
    const box=make('article','mpt-card');
    const head=make('div','mpt-card-title');
    const num=make('span','mpt-order',String(selected.indexOf(p.id)+1).padStart(2,'0'));
    const name=make('h3','',p.name);head.append(num,name);
    const facts=make('p','mpt-card-facts',[
      p.country||'Country not stated',p.infrastructureType||'Type not stated',
      p.reportDateLabel||'Report date not stated'
    ].join(' · '));
    const evidence=make('p','mpt-caveat',p.verificationStatus||'Source status unverified');
    const buttons=make('div','mpt-row');
    buttons.append(
      link('Research passport',passport(p.id)),
      link('Approximate atlas view',atlas(p.id)),
      link('More in '+p.country,directory('country',p.country)),
      link('More '+p.infrastructureType,directory('type',p.infrastructureType)),
      act('Remove',()=>save(p.id),'mpt-remove')
    );
    box.append(head,facts,evidence,buttons);return box;
  }
  function renderSuggestions(){
    recommendations.replaceChildren();
    if(!loaded||!selected.length||selected.length>=LIMIT)return;
    const current=selected.map(record).filter(Boolean);
    const ranked=records.filter(p=>!selected.includes(p.id)).map(p=>{
      let score=0;
      for(const c of current) {
        if(p.country&&p.country===c.country)score+=3;
        if(p.infrastructureType&&p.infrastructureType===c.infrastructureType)score+=2;
        if(p.region&&p.region===c.region)score++;
      }
      return {p,score};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.p.name.localeCompare(b.p.name)).slice(0,3);
    if(!ranked.length)return;
    recommendations.appendChild(make('h3','','Explore nearby research topics'));
    recommendations.appendChild(make('p','mpt-note','Related by reported country, category or region, not verified affiliation.'));
    for(const {p} of ranked){
      const row=make('div','mpt-recommendation');
      row.append(make('span','',p.name+' · '+p.country),act('+ Save',()=>save(p.id),'mpt-add'));
      recommendations.appendChild(row);
    }
  }
  function renderShared(){
    shared.replaceChildren();
    shared.hidden=!pendingShare.length;
    if(!pendingShare.length)return;
    shared.appendChild(make('p','',pendingShare.length+' project IDs were shared with you. Review before importing; nothing has been saved automatically.'));
    shared.appendChild(act('Add shared projects',()=>{
      const fresh=pendingShare.filter(id=>record(id)&&!selected.includes(id));
      const available=LIMIT-selected.length;
      const adding=fresh.slice(0,available);
      selected=selected.concat(adding);
      pendingShare=[];persist();render();
      announce(adding.length+' projects imported into your research trail.');
    }));
    shared.appendChild(act('Dismiss shared trail',()=>{
      pendingShare=[];renderShared();
    },'mpt-quiet'));
  }
  function render(){
    updateCounter();if(!opened)return;
    notice.textContent=stored?'Saved locally in this browser. No account or tracking.':
      'Browser storage is unavailable. Your trail lasts only while this page stays open.';
    list.replaceChildren();recommendations.replaceChildren();
    if(!loaded){
      summary.textContent=failed?'Could not load research records.':'Loading published project records…';
      if(failed)list.appendChild(act('Retry research catalog',()=>{
        failed=false;render();fetchRecords().catch(()=>{});
      }));
      return;
    }
    const rows=visible();
    currentFiltered=rows;
    summary.textContent=rows.length+' visible · '+selected.length+' saved · '+LIMIT+' maximum';
    if(!selected.length){
      list.appendChild(make('p','mpt-empty','Your trail is empty. Save projects from the directory, atlas drawer, search results or a project passport.'));
    }else if(!rows.length){
      list.appendChild(make('p','mpt-empty','No saved projects match this filter.'));
    }else for(let i=0;i<rows.length;i++)list.appendChild(savedCard(rows[i],i));
    renderSuggestions();renderShared();
    for(const b of [json,csv,share,clear])b.disabled=!selected.length;
    compare.disabled=!selected.length;
  }
  function open(){
    if(opened||document.body.classList.contains('mpx-dialog-open')||
       byId('detail')&&!byId('detail').hidden)return;
    returnFocus=document.activeElement;opened=true;backdrop.hidden=false;
    trigger.setAttribute('aria-expanded','true');
    document.body.classList.add('mpt-open');
    query.value='';order.value='saved';
    render();close.focus({preventScroll:true});
    fetchRecords().catch(()=>{});
  }
  function dismiss(){
    if(!opened)return;opened=false;backdrop.hidden=true;
    document.body.classList.remove('mpt-open');
    trigger.setAttribute('aria-expanded','false');
    (returnFocus?.isConnected?returnFocus:trigger).focus({preventScroll:true});
  }
  close.addEventListener('click',dismiss);
  backdrop.addEventListener('pointerdown',e=>{if(e.target===backdrop)dismiss();});
  document.addEventListener('keydown',e=>{
    if(opened){
      if(e.key==='Escape'){e.preventDefault();dismiss();return;}
      if(e.key==='Tab'){
        const nodes=[...panel.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled)')]
          .filter(el=>el.getClientRects().length);
        if(!nodes.length)return;
        if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1).focus();}
        else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}
      }
      return;
    }
    if(e.altKey&&e.shiftKey&&e.key.toLowerCase()==='t'){
      e.preventDefault();open();
    }
  });
  query.addEventListener('input',render);
  order.addEventListener('change',render);
  function navigateCompare(){
    const ids=selected.filter(id=>record(id)).slice(0,3);
    if(!ids.length)return announce('Select a project first.');
    location.href='/directory/?'+new URLSearchParams({compare:ids.join(',')})+'#project-comparison';
  }
  function exportData(format){
    const rows=selected.map(record).filter(Boolean);
    if(!rows.length)return announce('Nothing to export.');
    let blob,filename;
    if(format==='json'){
      blob=new Blob([JSON.stringify({
        schemaVersion:'1.0',name:'MicroportMap research trail',count:rows.length,
        selectedProjectIds:rows.map(p=>p.id),records:rows,
        limitations:'Source-linked reported projects only. No current-operation, public-access or flight-permission confirmation.'
      },null,2)],{type:'application/json;charset=utf-8'});
      filename='microportmap-research-trail.json';
    }else{
      const keys=['id','name','country','region','infrastructureType','reportedOperator','verificationStatus'];
      const cell=value=>{
        let str=String(value??'');if(/^[\s\uFEFF]*[=+@-]/.test(str))str="'"+str;
        return '"'+str.replace(/"/g,'""')+'"';
      };
      const csv='\uFEFF'+[keys,...rows.map(p=>keys.map(k=>p[k]))].map(row=>row.map(cell).join(',')).join('\r\n');
      blob=new Blob([csv],{type:'text/csv;charset=utf-8'});filename='microportmap-research-trail.csv';
    }
    let objectURL,anchor;
    try{
      objectURL=URL.createObjectURL(blob);
      anchor=make('a');anchor.href=objectURL;anchor.download=filename;
      document.body.appendChild(anchor);anchor.click();
      announce(format.toUpperCase()+' trail export requested. Your browser controls saving.');
    }catch{announce('Download could not start. Try another format.');}
    finally{
      anchor?.remove();
      if(objectURL)setTimeout(()=>URL.revokeObjectURL(objectURL),30000);
    }
  }
  async function shareLink(){
    if(!selected.length)return announce('Save a project first.');
    const url=new URL('/',location.origin);
    url.searchParams.set('trail',selected.join(','));
    url.hash='atlas';
    try{
      await navigator.clipboard.writeText(url.href);
      announce('Shareable trail link copied. Only the selected public project IDs are included.');
    }catch{announce('Copy this link: '+url.href);}
  }
  function clearAll(){
    if(!selected.length)return;
    if(typeof window.confirm==='function'&&!window.confirm('Clear all projects from your research trail?'))return;
    selected=[];persist();render();announce('Research trail cleared.');
  }
  // Saved URLs are invitations; do not overwrite existing browser-local choices.
  function parseShare(){
    const raw=new URL(location.href).searchParams.get('trail');
    if(!raw||raw.length>250)return;
    pendingShare=dedupe(raw.split(','));
    if(pendingShare.length){
      trigger.title='A shared trail is available for review';
      trigger.setAttribute('aria-description','A shared research trail is available. Open to review it.');
    }
  }
  function inlineSave(id){
    const b=act('',()=>save(id),'mpt-save');
    b.setAttribute('data-mpt-save',id);
    b.setAttribute('aria-label','Add or remove project '+(record(id)?.name||id)+' from research trail');
    return b;
  }
  function scan(){
    if(!loaded)return;
    const section=byId('results');
    // Directory article cards: append to existing card without editing tested exports.
    if(location.pathname.startsWith('/directory/')&&section){
      for(const card of section.querySelectorAll('article[data-project-id]')){
        const id=card.getAttribute('data-project-id');
        if(record(id)&&!card.querySelector('[data-mpt-save]'))card.appendChild(inlineSave(id));
      }
    }
    // Atlas results themselves are buttons. Never nest another button inside.
    if(location.pathname==='/'&&section){
      for(const row of [...section.querySelectorAll('button[data-project-id]')]){
        const id=row.getAttribute('data-project-id');
        if(!record(id)||row.nextElementSibling?.matches('.mpt-atlas-row'))continue;
        const shell=make('div','mpt-atlas-row');shell.appendChild(inlineSave(id));
        row.insertAdjacentElement('afterend',shell);
      }
    }
    // Atlas drawer: full project can be saved from its source-linked detail.
    const detail=byId('detail-content');
    if(detail&&!byId('detail')?.hidden){
      const id=new URL(location.href).searchParams.get('project');
      if(record(id)&&!detail.querySelector('[data-mpt-save]'))detail.appendChild(inlineSave(id));
    }
    // Existing global finder uses separate result cards.
    const finder=byId('mpx-search-dialog');
    if(finder&&!finder.hidden){
      for(const card of finder.querySelectorAll('.mpx-search-row')){
        const first=card.querySelector('a[href^="/projects/"]');
        const id=first?.getAttribute('href')?.split('/')[2];
        if(record(id)&&!card.querySelector('[data-mpt-save]'))card.appendChild(inlineSave(id));
      }
    }
    updateCounter();
  }
  function observe(){
    // Restrict watching to child additions, never attributes (our aria states change).
    for(const target of [byId('results'),byId('detail-content'),byId('mpx-search-dialog')]){
      if(!target)continue;
      const observer=new MutationObserver(()=>scan());
      observer.observe(target,{childList:true,subtree:false});
      if(target.id==='mpx-search-dialog')observer.observe(target,{childList:true,subtree:true});
    }
  }
  function passportButton(){
    const id=location.pathname.match(/^\/projects\/([a-z0-9-]+)\/?$/)?.[1];
    const panel=byId('mpx-passport-explore')||document.querySelector('main .hero');
    if(id&&panel&&!panel.querySelector('[data-mpt-save]'))panel.appendChild(inlineSave(id));
  }
  window.addEventListener('storage',e=>{
    if(e.key!==KEY)return;
    try{selected=dedupe(e.newValue?JSON.parse(e.newValue):[]).filter(id=>!loaded||record(id));}
    catch{selected=[];}
    render();
    announce('Research trail updated in another tab.');
  });
  parseShare();updateCounter();
  // The document has already parsed because this script is deferred.
  passportButton();
  observe();
  fetchRecords().then(()=>{passportButton();scan();}).catch(()=>{
    announce('Research trail catalog is unavailable. Open the trail to retry.');
  });
  // Public test helper verifies invariants without mutating records.
  window.MicroportTrail=Object.freeze({getIds:()=>selected.slice(),max:LIMIT});
})();
