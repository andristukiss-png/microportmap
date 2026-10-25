(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const search = $('search'), country = $('country'), kind = $('kind'), sort = $('sort'), region = $('region'), year = $('year');
  const results = $('results'), count = $('count'), status = $('share-status'), error = $('error');
  const controls = [search, country, kind, sort, region, year, $('reset'), $('export-csv'), $('share-filters')];
  const reportYear = p => (String(p.reportDateLabel || '').match(/\b20[0-9]{2}\b/) || [])[0] || 'unknown';
  let all = [], ready = false, generation = 0, loading = false;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sourceURL = p => {
    try { const u = new URL(p.source?.url); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; }
    catch { return ''; }
  };
  const recordURL = p => '/projects/' + encodeURIComponent(p.id) + '/';
  function setLoading(value) {
    loading = value;
    results.setAttribute('aria-busy', String(value));
    controls.forEach(el => { el.disabled = value || !ready; });
    window.dispatchEvent(new CustomEvent('mp-directory-state', {detail: {ready, loading: value, records: ready ? all : []}}));
  }
  function readURL() {
    const params = new URLSearchParams(location.search);
    search.value = params.get('q') || '';
    for (const [el, key, fallback] of [[country, 'country', ''], [kind, 'type', ''], [sort, 'sort', 'name'], [region, 'region', ''], [year, 'year', '']]) {
      const candidate = params.get(key);
      el.value = Array.from(el.options).some(o => o.value === candidate) ? candidate : fallback;
    }
  }
  function filterURL() {
    const u = new URL(location.href);
    for (const key of ['q', 'country', 'type', 'sort', 'region', 'year']) u.searchParams.delete(key);
    if (search.value.trim()) u.searchParams.set('q', search.value.trim());
    if (country.value) u.searchParams.set('country', country.value);
    if (kind.value) u.searchParams.set('type', kind.value);
    if (region.value) u.searchParams.set('region', region.value);
    if (year.value) u.searchParams.set('year', year.value);
    if (sort.value !== 'name') u.searchParams.set('sort', sort.value);
    return u;
  }
  function syncURL() {
    const u = filterURL();
    // URL state is useful but must not break filtering if browser history is unavailable.
    try { history.replaceState(null, '', u.pathname + u.search + u.hash); } catch {}
  }
  function render() {
    generation++;
    status.textContent = '';
    const filtered = all.filter(p => (!country.value || p.country === country.value) && (!kind.value || p.infrastructureType === kind.value) && (!region.value || p.region === region.value) && (!year.value || reportYear(p) === year.value) && window.MicroportSearch.matches(p, search.value));
    if (sort.value === 'recent') {
      const year = p => Number(reportYear(p)) || 0;
      filtered.sort((a, b) => year(b) - year(a) || a.name.localeCompare(b.name));
    } else if (sort.value === 'country') filtered.sort((a, b) => String(a.country || '').localeCompare(String(b.country || '')) || a.name.localeCompare(b.name));
    else filtered.sort((a, b) => a.name.localeCompare(b.name));
    window.mpFilteredRecords = filtered.slice();
    count.textContent = filtered.length + ' of ' + all.length + ' projects';
    results.innerHTML = filtered.length ? filtered.map(p => {
      const src = sourceURL(p);
      return '<article class="item" data-project-id="' + esc(p.id) + '"><span class="tag">' + esc(p.infrastructureType || 'Infrastructure') + '</span><h2>' + esc(p.name) + '</h2><p>' + esc(p.where || p.country || 'Location not stated') + '</p><p>' + esc(p.reportedOperator || 'Operator not stated') + '</p><p class="report-line">Report: ' + esc(p.reportDateLabel || 'Date not stated') + '</p><p class="evidence-line"><strong>Evidence:</strong> ' + esc(p.verificationStatus || 'Status not recorded') + '</p><div class="directory-card-links"><a href="' + recordURL(p) + '" aria-label="View research passport for ' + esc(p.name) + '">View research passport ↗</a>' + (src ? '<a class="source-link" href="' + esc(src) + '" target="_blank" rel="noopener noreferrer" aria-label="Original source for ' + esc(p.name) + ' (opens in a new tab)">Original source ↗</a>' : '') + '<a href="/submit/?project=' + encodeURIComponent(p.id) + '" aria-label="Suggest a correction for ' + esc(p.name) + '">Suggest correction ↗</a></div></article>';
    }).join('') : '<div class="empty"><p>No matching projects. Try clearing a filter.</p><button type="button" id="empty-reset">Clear all filters</button></div>';
    $('empty-reset')?.addEventListener('click', reset);
    window.dispatchEvent(new CustomEvent('mp-directory-state', {detail: {ready: true, loading: false, records: all, viewSearch: filterURL().search}}));
  }
  function update() { if (ready) { render(); syncURL(); } }
  function reset() { search.value = ''; country.value = ''; kind.value = ''; region.value = ''; year.value = ''; sort.value = 'name'; update(); search.focus(); }
  async function load() {
    if (loading) return;
    ready = false; error.hidden = true; count.textContent = 'Loading project directory…';
    setLoading(true);
    let timer;
    const controller = new AbortController();
    try {
      timer = setTimeout(() => controller.abort(), 15000);
      const response = await fetch('/data/projects.json', {signal: controller.signal});
      if (!response.ok) throw Error('Dataset unavailable');
      const data = await response.json();
      if (!Array.isArray(data.records) || !data.records.length || data.records.some(p => !p || typeof p.id !== 'string' || typeof p.name !== 'string' || !/^[a-z0-9-]+$/.test(p.id) || !p.name.trim()) || new Set(data.records.map(p => p.id)).size !== data.records.length) throw Error('Invalid research catalog');
      all = data.records.slice();
      for (const [el, key] of [[country, 'country'], [kind, 'infrastructureType'], [region, 'region']]) {
        while (el.options.length > 1) el.remove(1);
        [...new Set(all.map(p => p[key]).filter(Boolean))].sort().forEach(value => { const option = document.createElement('option'); option.value = value; option.textContent = value; el.appendChild(option); });
      }
      while (year.options.length > 1) year.remove(1);
      [...new Set(all.map(reportYear))].sort((a,b) => a === 'unknown' ? 1 : b === 'unknown' ? -1 : Number(b)-Number(a)).forEach(value => { const option = document.createElement('option'); option.value = value; option.textContent = value === 'unknown' ? 'Unspecified' : value; year.appendChild(option); });
      ready = true; readURL(); render(); syncURL();
    } catch {
      window.mpFilteredRecords = undefined;
      results.innerHTML = '';
      count.textContent = 'Directory temporarily unavailable';
      error.hidden = false;
    } finally { clearTimeout(timer); setLoading(false); }
  }
  $('retry-directory').addEventListener('click', load);
  search.addEventListener('input', update);
  [country, kind, sort, region, year].forEach(el => el.addEventListener('change', update));
  $('reset').addEventListener('click', reset);
  window.addEventListener('popstate', () => { if (ready) { readURL(); render(); } });
  $('export-csv').addEventListener('click', () => {
    const rows = window.mpFilteredRecords;
    if (!rows?.length) { status.textContent = 'No projects to export. Try clearing a filter.'; return; }
    let url, link;
    try {
      const columns = ['id','name','where','country','region','infrastructureType','reportedOperator','reportedEquipment','locationPrecision','reportDateLabel','verificationStatus','sourceUrl'];
      const quote = value => { let s = String(value ?? ''); if (/^[\s\uFEFF]*[=+@-]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
      const csv = '\uFEFF' + [columns.join(','), ...rows.map(p => columns.map(key => quote(key === 'sourceUrl' ? p.source?.url : p[key])).join(','))].join('\r\n');
      url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
      link = document.createElement('a'); link.href = url; link.download = 'microportmap-filtered-projects.csv';
      document.body.appendChild(link); link.click();
      status.textContent = rows.length + (rows.length === 1 ? ' record: ' : ' records: ') + 'CSV download requested. Your browser controls file saving. Locations may be approximate.';
    } catch { status.textContent = 'CSV download could not be started. Try the JSON export or the full dataset downloads.'; }
    finally { link?.remove(); if (url) setTimeout(() => URL.revokeObjectURL(url), 30000); }
  });
  $('share-filters').addEventListener('click', async () => {
    const url = filterURL().toString(), version = generation;
    try { await navigator.clipboard.writeText(url); if (version === generation) status.textContent = 'Link copied'; }
    catch { if (version === generation) status.textContent = 'Copy this filtered link: ' + url; }
  });
  load();
})();
