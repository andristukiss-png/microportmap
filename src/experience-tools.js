/* MicroportMap research-experience release: progressively enhanced, source-linked UI. */
(() => {
  'use strict';
  if (document.documentElement.dataset.mpResearchTools === 'ready') return;
  document.documentElement.dataset.mpResearchTools = 'ready';
  const $ = id => document.getElementById(id);
  const make = (tag, className, content) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content !== undefined) el.textContent = String(content);
    return el;
  };
  const link = (name, href, className='mpx-link') => {
    const el = make('a',className,name); el.href = href; return el;
  };
  const button = (name, handler, className='mpx-chip') => {
    const el = make('button',className,name);
    el.type = 'button'; el.addEventListener('click', handler); return el;
  };
  const add = (parent, children) => {
    for (const child of children) if(child) parent.appendChild(child);
    return parent;
  };
  const info = (tag,className,title,copy) => {
    const wrapper=make(tag,className);
    add(wrapper,[make('strong','',title),make('span','',copy)]);
    return wrapper;
  };
  const fold = value => String(value??'').normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const words = value => fold(value).trim().split(/\s+/).filter(Boolean);
  const isRecord = p => p && typeof p.id==='string' &&
    /^[a-z0-9-]+$/.test(p.id) && typeof p.name==='string' && p.name.trim();
  const matches = (p,q) => {
    const text=fold([p.name,p.where,p.country,p.region,p.infrastructureType,
      p.reportedOperator,p.reportedEquipment,p.description,p.source?.name].join(' '));
    return words(q).every(w=>text.includes(w));
  };
  const directoryURL = (key,value) => '/directory/?' + new URLSearchParams({[key]:value});
  const catalogueURL = id => '/projects/' + encodeURIComponent(id) + '/';
  const projectAtlasURL = id => '/?project=' + encodeURIComponent(id) + '#atlas';
  let request;
  function data() {
    if (!request) {
      request = fetch('/data/projects.json', {signal:AbortSignal.timeout?AbortSignal.timeout(12000):undefined})
        .then(r=>{if(!r.ok)throw Error('Cannot load research data');return r.json();})
        .then(d=>{
          const rows=d?.records;
          if(!Array.isArray(rows)||!rows.length||rows.some(p=>!isRecord(p))||
            new Set(rows.map(p=>p.id)).size!==rows.length)
            throw Error('Research data is unavailable');
          return rows;
        }).catch(error=>{request=undefined;throw error;});
    }
    return request;
  }
  const sortedCounts = (rows,key) => {
    const map = new Map();
    rows.forEach(p=>{const value=p[key];if(typeof value==='string'&&value.trim())
      map.set(value,(map.get(value)||0)+1);});
    return [...map].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  };
  // E01–E10: site-wide source-linked search with keyboard/assistive navigation.
  function finder() {
    const trigger = button('⌕ Find a project',open,'mpx-search-trigger');
    trigger.setAttribute('aria-haspopup','dialog');
    trigger.setAttribute('aria-controls','mpx-search-dialog');
    trigger.setAttribute('aria-expanded','false');
    trigger.setAttribute('aria-keyshortcuts','/ Control+K Meta+K');
    const cover=make('div','mpx-search-cover');
    cover.id='mpx-search-dialog';cover.hidden=true;
    cover.setAttribute('role','dialog');cover.setAttribute('aria-modal','true');
    cover.setAttribute('aria-labelledby','mpx-search-title');
    const panel=make('section','mpx-search-panel');
    const top=make('div','mpx-search-top');
    const close=button('Close ✕',dismiss,'mpx-close');
    const heading=make('h2','','Find a research project');heading.id='mpx-search-title';
    add(top,[heading,close]);
    const intro=make('p','mpx-note','Search the 50 public research references by place, project, type or reported operator. These are not verified landing sites.');
    const search=make('input','mpx-search-field');
    search.id='mpx-search-field';search.type='search';search.placeholder='Try Kiel, cargo, Chile…';
    search.autocomplete='off';search.setAttribute('aria-label','Find research projects');
    const count=make('p','mpx-search-count');count.id='mpx-search-count';count.setAttribute('role','status');
    count.setAttribute('aria-live','polite');
    const results=make('div','mpx-search-results');
    const bottom=make('div','mpx-search-footer');
    const all=link('Browse the complete directory','/directory/','mpx-action');
    add(bottom,[all,link('Understand evidence','/verification-guide/','mpx-link')]);
    add(panel,[top,intro,search,count,results,bottom]);cover.appendChild(panel);
    document.body.appendChild(trigger);document.body.appendChild(cover);
    let returnFocus=null,loaded=[],openNow=false,renderToken=0;
    function dismiss(){
      if(!openNow)return;
      cover.hidden=true;openNow=false;trigger.setAttribute('aria-expanded','false');
      document.body.classList.remove('mpx-dialog-open');
      (returnFocus?.isConnected?returnFocus:trigger).focus({preventScroll:true});
    }
    function paint(){
      const thisToken=++renderToken;results.replaceChildren();
      const q=search.value.trim();
      all.href=q?'/directory/?'+new URLSearchParams({q}):'/directory/';
      all.textContent=q?'See all matching projects in directory →':'Browse the complete directory →';
      const filtered=loaded.filter(p=>matches(p,q));
      if(!loaded.length){
        count.textContent='Research data is not loaded yet.';
        return;
      }
      count.textContent=filtered.length+' of '+loaded.length+' research records'+(q?' match this search.':'.');
      if(!filtered.length){
        add(results,[make('p','mpx-empty','No matching records. Try another name, place or technology.')]);
        return;
      }
      for (const p of filtered.slice(0,8)) {
        const row=make('article','mpx-search-row');
        add(row,[link(p.name,catalogueURL(p.id),'mpx-search-result'),
          make('small','',p.country+' · '+p.infrastructureType),
          link('View on atlas',projectAtlasURL(p.id),'mpx-search-atlas')]);
        results.appendChild(row);
      }
      if(filtered.length>8)results.appendChild(
        make('p','mpx-note','Showing the first 8 matches. Use the directory link below for the full list.'));
    }
    function load(){
      count.textContent='Loading research records…';results.replaceChildren();
      data().then(rows=>{if(!openNow)return;loaded=rows;paint();})
        .catch(()=>{
          if(!openNow)return;
          count.textContent='Project search is temporarily unavailable.';
          results.replaceChildren(button('Retry loading records',load,'mpx-action'));
        });
    }
    function open(){
      if(openNow)return;
      const atlasDrawer=$('detail');
      if(atlasDrawer&&!atlasDrawer.hidden)return;
      returnFocus=document.activeElement;openNow=true;
      cover.hidden=false;trigger.setAttribute('aria-expanded','true');
      document.body.classList.add('mpx-dialog-open');
      search.value='';search.focus({preventScroll:true});load();
    }
    search.addEventListener('input',paint);
    cover.addEventListener('pointerdown',e=>{if(e.target===cover)dismiss();});
    document.addEventListener('keydown',e=>{
      if(openNow) {
        if(e.key==='Escape'){e.preventDefault();dismiss();return;}
        if(e.key==='Tab'){
          const nodes=[...panel.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled)')];
          if(!nodes.length)return;
          if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1).focus();}
          else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}
        }
        if(e.key==='Enter'&&document.activeElement===search) {
          const first=results.querySelector('.mpx-search-result');if(first){e.preventDefault();location.href=first.href;}
        }
        return;
      }
      const t=e.target;
      if(e.altKey||e.shiftKey||t?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName||''))return;
      if(e.key==='/'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')){
        e.preventDefault();open();
      }
    });
  }

  function headline(parent,title,desc) {
    add(parent,[make('h2','',title),make('p','mpx-note',desc)]);return parent;
  }
  // E11–E20: new, data-derived homepage discovery hub.
  async function homepage(){
    const stats=document.querySelector('.stats');
    if(!stats||!$('atlas'))return;
    const root=make('section','mpx-home-hub');root.id='mpx-research-hub';
    root.setAttribute('aria-labelledby','mpx-home-title');
    const top=make('div','mpx-home-intro');
    const h=make('h2','','Explore the research by place and purpose');h.id='mpx-home-title';
    add(top,[make('p','mpx-kicker','NEW RESEARCH SHORTCUTS'),h,
      make('p','mpx-note','Start with a reported country, region or infrastructure type. Every shortcut leads to the source-linked directory.')]);
    const groups=make('div','mpx-home-groups');
    const actions=make('div','mpx-home-actions');
    add(actions,[link('Browse all 50 records','/directory/','mpx-action'),
      link('Check research limitations','/data-quality/','mpx-link'),
      link('Read the methodology','/methodology/','mpx-link')]);
    add(root,[top,groups,actions]);stats.insertAdjacentElement('afterend',root);
    const status=make('p','mpx-note','Preparing research shortcuts…');
    groups.appendChild(status);
    try {
      const rows=await data();status.remove();
      for(const [heading,key,param,limit] of [
        ['Top countries','country','country',6],
        ['Infrastructure types','infrastructureType','type',7],
        ['World regions','region','region',6]
      ]){
        const group=make('div','mpx-home-group');
        add(group,[make('h3','',heading)]);
        const chips=make('div','mpx-chip-grid');
        for(const [value,n] of sortedCounts(rows,key).slice(0,limit)){
          chips.appendChild(link(value+' · '+n,directoryURL(param,value),'mpx-stat-chip'));
        }
        group.appendChild(chips);groups.appendChild(group);
      }
    } catch {
      status.textContent='Live research shortcuts are temporarily unavailable. The project directory remains accessible.';
    }
  }
  // E21–E29: atlas filter-to-directory and actionable map guidance.
  function atlasExtras(){
    const atlas=$('atlas'),workspace=atlas?.querySelector('.map-workspace');
    if(!workspace)return;
    const root=make('section','mpx-atlas-actions');
    root.setAttribute('aria-label','Atlas view tools');
    const summary=make('p','mpx-atlas-summary','Use the atlas filters to find research references.');
    summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');
    const controls=make('div','mpx-inline-actions');
    const directoryLink=link('View these filters in directory','/directory/','mpx-action');
    const share=button('Copy atlas link',async()=>{
      const url=new URL(location.href);
      url.hash='atlas';
      try{
        await navigator.clipboard.writeText(url.toString());notice.textContent='Atlas link copied.';
      }catch{notice.textContent='Copy this atlas link: '+url.toString();}
    },'mpx-secondary');
    const reset=button('Clear atlas filters',()=>$('reset')?.click(),'mpx-secondary');
    const results=button('Jump to atlas results',()=>{
      $('results')?.scrollIntoView({behavior:'smooth',block:'center'});
      $('search')?.focus({preventScroll:true});
    },'mpx-secondary');
    const notice=make('span','mpx-hint');notice.setAttribute('role','status');
    add(controls,[directoryLink,share,reset,results]);
    const explanation=make('details','mpx-accordion');
    add(explanation,[make('summary','','Map reading guide'),
      make('p','mpx-note','Map pins mark approximate research references, not landing coordinates. The detailed online geography layer is optional; the default atlas is schematic.')]);
    add(root,[summary,controls,notice,explanation]);
    workspace.insertAdjacentElement('beforebegin',root);
    function sync(){
      const q=$('search')?.value.trim()||'',country=$('country')?.value||'all',
        type=$('category')?.value||'all';
      const params=new URLSearchParams();
      if(q)params.set('q',q);
      if(country!=='all')params.set('country',country);
      if(type!=='all')params.set('type',type);
      directoryLink.href='/directory/'+(params.size?'?'+params:'');
      const shown=$('shown-count')?.textContent||'';
      summary.textContent=shown&&!shown.includes('Loading')
        ?shown+' matching research records · pins are approximate.'
        :'Filtering the research atlas…';
      reset.disabled=!q&&country==='all'&&type==='all';
    }
    ['search','country','category'].forEach(id=>{
      $(id)?.addEventListener(id==='search'?'input':'change',sync);
    });
    if(typeof MutationObserver!=='undefined'&&$('shown-count'))
      new MutationObserver(sync).observe($('shown-count'),{childList:true,subtree:true,characterData:true});
    sync();
  }
  // E30–E41: directory shortcut and active-filter actions.
  function directoryExtras(){
    const directory=document.querySelector('section.directory');
    const controls=directory?.querySelector('.controls');
    if(!controls)return;
    const root=make('section','mpx-directory-tools');root.id='mpx-directory-tools';
    root.setAttribute('aria-label','Quick research filters');
    headline(root,'Explore the directory faster','Choose a research category or country, then refine the existing filters. These are reported projects, not certified operations.');
    const countryWrap=make('div','mpx-quick-wrap');
    add(countryWrap,[make('h3','','Frequent countries')]);
    const countryLinks=make('div','mpx-chip-grid');countryWrap.appendChild(countryLinks);
    const kindWrap=make('div','mpx-quick-wrap');
    add(kindWrap,[make('h3','','Infrastructure categories')]);
    const kindLinks=make('div','mpx-chip-grid');kindWrap.appendChild(kindLinks);
    const actions=make('div','mpx-inline-actions');
    const choice=(label,id,value)=>button(label,()=>{
      const el=$(id);if(!el||el.disabled)return;
      el.value=value;el.dispatchEvent(new Event(id==='search'?'input':'change',{bubbles:true}));
    });
    add(actions,[
      choice('Newest report year','sort','recent'),
      choice('Alphabetical','sort','name'),
      choice('Unspecified report year','year','unknown'),
      button('Clear all filters',()=>$('reset')?.click()),
      button('Focus search',()=>$('search')?.focus()),
      button('Copy filtered link',()=>$('share-filters')?.click()),
      button('Download filtered CSV',()=>$('export-csv')?.click()),
      button('Jump to results',()=>$('results')?.scrollIntoView({behavior:'smooth',block:'start'}))
    ]);
    const active=make('div','mpx-active-filters');active.setAttribute('aria-label','Active filters');
    const summary=make('p','mpx-dir-summary');summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');
    add(root,[countryWrap,kindWrap,actions,summary,active]);
    controls.insertAdjacentElement('beforebegin',root);
    let setup=false;
    function populate(rows) {
      if(setup)return;setup=true;
      const insert=(wrap,items,id)=>{
        for(const [value,count] of items){
          wrap.appendChild(choice(value+' · '+count,id,value));
        }
      };
      insert(countryLinks,sortedCounts(rows,'country').slice(0,6),'country');
      insert(kindLinks,sortedCounts(rows,'infrastructureType').slice(0,7),'kind');
    }
    function redraw(){
      active.replaceChildren();
      const attrs=[
        ['Search','search','input'],
        ['Country','country','change'],
        ['Type','kind','change'],
        ['Region','region','change'],
        ['Year','year','change'],
        ['Sort','sort','change']
      ];
      let n=0;
      for(const [name,id,ev] of attrs) {
        const el=$(id);
        if(!el||!el.value||id==='sort'&&el.value==='name')continue;
        n++;
        const label=el.selectedOptions?.[0]?.textContent||el.value;
        const chip=button(name+': '+label+' ✕',()=>{
          el.value=id==='sort'?'name':'';
          el.dispatchEvent(new Event(ev,{bubbles:true}));
          if(id==='search')el.focus({preventScroll:true});
        },'mpx-active-chip');
        chip.setAttribute('aria-label','Remove '+name+' filter '+label);
        active.appendChild(chip);
      }
      if(!n)active.appendChild(make('span','mpx-muted','No filters selected'));
      const rows=window.mpFilteredRecords;
      summary.textContent=Array.isArray(rows)
        ?rows.length+' of 50 reported projects shown. Refine or clear filters above.'
        :'Waiting for research records…';
    }
    window.addEventListener('mp-directory-state',event=>{
      const d=event.detail;
      if(d.ready&&!d.loading&&Array.isArray(d.records))populate(d.records);
      redraw();
    });
    ['search','country','kind','region','year','sort'].forEach(id=>{
      $(id)?.addEventListener(id==='search'?'input':'change',redraw);
    });
    redraw();
    // Existing directory scripts may have dispatched initial load before this listener attached.
    data().then(rows=>{populate(rows);redraw();}).catch(()=>redraw());
  }
  // E42–E48: per-passport, record-specific routes and practical reading guide.
  async function passportExtras(){
    const m=location.pathname.match(/^\/projects\/([a-z0-9-]+)\/?$/);
    const main=document.querySelector('main'),hero=main?.querySelector('.hero');
    if(!m||!main||!hero)return;
    const id=m[1];
    const root=make('section','mpx-passport-explore');
    root.id='mpx-passport-explore';
    root.setAttribute('aria-labelledby','mpx-passport-title');
    const title=make('h2','','Explore this project in context');title.id='mpx-passport-title';
    const hint=make('p','mpx-note','Jump between the report, broader research and its approximate map reference.');
    const links=make('div','mpx-passport-actions');
    add(root,[title,hint,links]);
    hero.insertAdjacentElement('afterend',root);
    const columns=main.querySelector('.columns');
    if(columns&&!columns.id)columns.id='mpx-passport-facts';
    add(links,[
      link('Read reported details','#mpx-passport-facts','mpx-action'),
      link('Approximate atlas reference',projectAtlasURL(id),'mpx-link'),
      link('Compare this project','/directory/?compare='+encodeURIComponent(id)+'#project-comparison','mpx-link'),
      link('Suggest a correction','/submit/?project='+encodeURIComponent(id),'mpx-link'),
      link('Verification guide','/verification-guide/','mpx-link')
    ]);
    const byPlace=make('div','mpx-passport-context');
    root.appendChild(byPlace);
    try{
      const rows=await data(),record=rows.find(p=>p.id===id);
      if(!record){hint.textContent='Project context is unavailable; the existing passport remains readable.';return;}
      hint.textContent='Research reference: '+record.country+' · '+record.infrastructureType+
        '. Current operations, access and flight permission are not independently verified.';
      add(byPlace,[
        link('Other projects in '+record.country,directoryURL('country',record.country),'mpx-stat-chip'),
        link('More '+record.infrastructureType,directoryURL('type',record.infrastructureType),'mpx-stat-chip'),
        link('Research in '+record.region,directoryURL('region',record.region),'mpx-stat-chip')
      ]);
      const follow=link('Jump to related projects','#mp-connect','mpx-link');
      links.appendChild(follow);
    }catch{
      hint.textContent='Project context shortcuts are unavailable; the original passport above is still readable.';
    }
  }
  // E49–E50: evidence reading orientation.
  function qualityExtras(){
    const target=$('review-queue');
    if(!target)return;
    const root=make('section','mpx-quality-guide');
    root.id='mpx-quality-guide';
    root.setAttribute('aria-labelledby','mpx-quality-title');
    const title=make('h2','','How to read this research');
    title.id='mpx-quality-title';
    add(root,[make('p','mpx-kicker','EVIDENCE FIRST'),title,
      make('p','mpx-note','A source link, map point or report date is a catalogued claim, not independent proof of current operation or permission to fly.')]);
    const nav=make('div','mpx-inline-actions');
    add(nav,[link('Jump to review queue','#review-queue','mpx-action'),
      link('Read verification rules','/verification-guide/','mpx-link'),
      link('Explore field definitions','/data-dictionary/','mpx-link'),
      link('Suggest a correction','/submit/','mpx-link')]);
    root.appendChild(nav);
    const details=make('details','mpx-accordion');
    add(details,[make('summary','','What do quality flags mean?'),
      make('p','mpx-note','Flags identify fields needing review. They do not establish whether a facility exists today, whether operations are authorized, or whether a site is publicly accessible.')]);
    root.appendChild(details);
    const main=document.querySelector('main');
    if(main)main.insertBefore(root,main.firstChild?.nextSibling||null);
  }
  finder();
  if($('atlas')){homepage();atlasExtras();}
  if(document.querySelector('section.directory'))directoryExtras();
  if(/^\/projects\//.test(location.pathname))passportExtras();
  if($('review-queue'))qualityExtras();
})();
