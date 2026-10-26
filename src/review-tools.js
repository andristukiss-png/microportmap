(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const search = $('review-search'), country = $('review-country'), flag = $('review-flag');
  const status = $('review-filter-status'), queue = $('review-records'), reset = $('review-reset'), copy = $('review-copy');
  if (!search || !country || !flag || !status || !queue || !reset || !copy) return;
  let all = [], ready = false, generation = 0, copyRequest = 0;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const controls = [search, country, flag, reset, copy];
  const filters = () => ({search: search.value.trim(), country: country.value, flag: flag.value});
  function url() {
    const u = new URL(location.href);
    for (const key of ['q','country','flag']) u.searchParams.delete(key);
    for (const [key,value] of [['q',search.value.trim()],['country',country.value],['flag',flag.value]]) if (value) u.searchParams.set(key,value);
    u.hash = 'review-queue'; return u;
  }
  function readURL() {
    const params = new URLSearchParams(location.search); search.value = params.get('q') || '';
    for (const [control,key] of [[country,'country'],[flag,'flag']]) {
      const value = params.get(key); control.value = Array.from(control.options).some(o => o.value === value) ? value : '';
    }
  }
  function render(sync = true) {
    if (!ready) return;
    generation++;
    const flagged = all.filter(c => c.flags.length);
    const chosen = flagged.filter(c => (!country.value || c.record.country === country.value) && (!flag.value || c.flags.includes(flag.value)) && window.MicroportSearch.matches(c.record,search.value)).sort((a,b) => b.flags.length-a.flags.length || String(a.record.name||'').localeCompare(String(b.record.name||'')));
    const row = ({record:p,flags}) => {
      const linkable = typeof p.id === 'string' && /^[a-z0-9-]+$/.test(p.id) && !flags.includes('Duplicate project ID');
      return '<li><div><strong>'+esc(p.name||'Unnamed record')+'</strong><small>'+esc(flags.join(' · '))+'</small></div>'+(linkable?'<span class="review-actions"><a href="/projects/'+encodeURIComponent(p.id)+'/" aria-label="Research passport for '+esc(p.name||'this project')+'">Passport ↗</a><a href="/submit/?project='+encodeURIComponent(p.id)+'" aria-label="Suggest a correction for '+esc(p.name||'this project')+'">Suggest correction ↗</a></span>':'<span>Project ID needs review before linking</span>')+'</li>';
    };
    queue.innerHTML = chosen.length ? '<p><strong>'+chosen.length+(chosen.length===1?' record flagged':' records flagged')+'</strong> in this review view ('+flagged.length+' total flagged).</p><ul class="review-list">'+chosen.slice(0,25).map(row).join('')+'</ul>'+(chosen.length>25?'<details><summary>Show remaining '+(chosen.length-25)+' flagged records</summary><ul class="review-list">'+chosen.slice(25).map(row).join('')+'</ul></details>':'') : '<p>No flagged records match this review view. Clear review filters to see the full queue. These checks do not establish operational accuracy.</p>';
    status.textContent = chosen.length+' of '+flagged.length+' flagged records in this view.';
    window.dispatchEvent(new CustomEvent('mp-review-view',{detail:{checks:chosen,filters:filters()}}));
    if (sync) { const u=url(); try { history.replaceState(null,'',u.pathname+u.search+u.hash); } catch {} }
  }
  function populate(control,values) {
    while(control.options.length>1)control.remove(1);
    [...new Set(values.filter(Boolean))].sort().forEach(value => { const option=document.createElement('option');option.value=value;option.textContent=value;control.appendChild(option); });
  }
  function unavailable(message) { ready=false;all=[];generation++;controls.forEach(c=>c.disabled=true);status.textContent=message;window.dispatchEvent(new CustomEvent('mp-review-view',{detail:{checks:[],filters:{}}})); }
  window.addEventListener('mp-quality-loading',()=>unavailable('Loading review filters…'));
  window.addEventListener('mp-quality-error',()=>unavailable('Review filters unavailable while the dataset cannot be loaded.'));
  window.addEventListener('mp-quality-ready',event=>{
    all=event.detail.checks;
    const flagged=all.filter(c=>c.flags.length);
    populate(country,flagged.map(c=>c.record.country));populate(flag,flagged.flatMap(c=>c.flags));
    ready=true;controls.forEach(c=>c.disabled=false);readURL();render(['q','country','flag'].some(key=>new URLSearchParams(location.search).has(key)));
  });
  search.addEventListener('input',()=>render());[country,flag].forEach(c=>c.addEventListener('change',()=>render()));
  reset.addEventListener('click',()=>{search.value='';country.value='';flag.value='';render();search.focus();});
  copy.addEventListener('click',async()=>{
    if(!ready)return;
    const value=url().href,version=generation,request=++copyRequest;
    const current=()=>version===generation&&request===copyRequest;
    let timer;
    try{
      await Promise.race([navigator.clipboard.writeText(value),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Clipboard timed out')),5000);})]);
      if(current())status.textContent='Review link copied. Export scope is chosen separately.';
    }catch{if(current())status.textContent='Copy this review link: '+value;}
    finally{clearTimeout(timer);}
  });
  window.addEventListener('popstate',()=>{if(ready){readURL();render(false);}});
})();
