(() => {
  'use strict';
  const path = location.pathname.split('/').filter(Boolean);
  if (path[0] !== 'projects' || !path[1] || !/^[a-z0-9-]+$/.test(path[1])) return;
  const main = document.querySelector('main');
  if (!main || document.getElementById('mp-connect')) return;
  const id = path[1], canonical = 'https://microportmap.com/projects/' + encodeURIComponent(id) + '/';
  const contextQuery = new URLSearchParams(location.search || '').get('compare') || '';
  const requestedComparison = contextQuery.length <= 200 && contextQuery ? contextQuery.split(',') : [];
  const comparisonContext = requestedComparison.length <= 3 && requestedComparison.includes(id) && new Set(requestedComparison).size === requestedComparison.length && requestedComparison.every(value => /^[a-z0-9-]+$/.test(value)) ? requestedComparison : [];
  let returnFilters = '';
  if (comparisonContext.length) { const params = new URLSearchParams(location.search || ''); for (const key of ['q','country','type','region','year','sort']) { const value = params.get(key); if (value) returnFilters += '&' + key + '=' + encodeURIComponent(value); } }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const section = document.createElement('section'); section.id = 'mp-connect'; section.setAttribute('aria-label', 'Location contact and related projects');
  section.innerHTML = '<div class="mp-connect-head"><span class="mp-kicker">PROJECT DIRECTORY</span><h2>Location, contacts & related projects</h2><p>Research-level location and publicly sourced information. This directory does not establish site access, flight authorization, or a verified operator contact.</p></div>';
  const actions = document.createElement('div'); actions.className = 'mp-share-project';
  const button = (id, label) => { const el = document.createElement('button'); el.id = id; el.type = 'button'; el.className = 'mp-share-button'; el.textContent = label; actions.appendChild(el); return el; };
  const copy = button('project-copy-link', 'Copy project link');
  const download = button('project-download-json', 'Download project JSON ↓'); download.disabled = true;
  const compare = document.createElement('a'); compare.id = 'project-compare-link'; compare.className = 'mp-correct'; compare.href = '/directory/?compare=' + encodeURIComponent(comparisonContext.length ? comparisonContext.join(',') : id) + returnFilters + '#project-comparison'; compare.textContent = comparisonContext.length ? 'Return to comparison (' + comparisonContext.length + ') ↗' : 'Compare this project ↗'; compare.setAttribute('aria-label', comparisonContext.length ? 'Return to comparison of ' + comparisonContext.length + (comparisonContext.length === 1 ? ' project' : ' projects') : 'Compare this project in the directory'); actions.appendChild(compare);
  const correction = document.createElement('a'); correction.className = 'mp-correct'; correction.href = '/submit/?project=' + encodeURIComponent(id); correction.textContent = 'Suggest verified contact details ↗'; actions.appendChild(correction);
  const shareStatus = document.createElement('span'); shareStatus.className = 'mp-share-status'; shareStatus.setAttribute('role', 'status'); shareStatus.setAttribute('aria-live', 'polite'); actions.appendChild(shareStatus);
  section.appendChild(actions);
  const loadingStatus = document.createElement('p'); loadingStatus.className = 'mp-minor'; loadingStatus.id = 'project-data-status'; loadingStatus.setAttribute('role', 'status'); section.appendChild(loadingStatus);
  const retry = document.createElement('button'); retry.id = 'project-data-retry'; retry.type = 'button'; retry.className = 'mp-share-button'; retry.textContent = 'Retry project details'; retry.hidden = true; section.appendChild(retry);
  const details = document.createElement('div'); details.id = 'project-related-details'; section.appendChild(details);
  main.appendChild(section);
  let record = null, loading = false;
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(canonical); shareStatus.textContent = 'Project link copied'; }
    catch {
      shareStatus.textContent = 'Clipboard unavailable. Use this project link: ';
      const link = document.createElement('a'); link.href = canonical; link.textContent = canonical; shareStatus.appendChild(link);
    }
  });
  download.addEventListener('click', () => {
    if (!record) return;
    let url, link;
    try {
      const payload = {schemaVersion: '1.0', name: 'MicroportMap project research export', website: 'https://microportmap.com', exportedAt: new Date().toISOString(), count: 1, methodology: 'Public report only; location is an approximate project reference. Current operations, contacts, public access and flight permission are not independently verified.', records: [record]};
      url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json;charset=utf-8'}));
      link = document.createElement('a'); link.href = url; link.download = 'microportmap-project-' + id + '.json'; document.body.appendChild(link); link.click();
      shareStatus.textContent = 'Project JSON download requested. Your browser controls file saving. No data was submitted.';
    } catch { shareStatus.textContent = 'Project JSON download could not be started. Use the directory export instead.'; }
    finally { link?.remove(); if (url) setTimeout(() => URL.revokeObjectURL(url), 30000); }
  });
  function render(records, project) {
    let source = '';
    try { const u = new URL(project.source?.url); if (u.protocol === 'https:' && !u.username && !u.password) source = u.href; } catch {}
    const related = records.filter(p => p.id !== project.id).map(p => ({record: p, score: (project.country && p.country === project.country ? 4 : 0) + (project.infrastructureType && p.infrastructureType === project.infrastructureType ? 2 : 0) + (project.region && p.region === project.region ? 1 : 0)})).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.record.name.localeCompare(b.record.name)).slice(0, 6);
    details.innerHTML = '<div class="mp-connect-grid"><article class="mp-panel"><h3>Location & contact details</h3><dl><div><dt>Reported location</dt><dd>' + esc(project.where || project.country || 'Not stated') + '</dd></div><div><dt>Street address</dt><dd>Not publicly verified in our dataset</dd></div><div><dt>Reported operator</dt><dd>' + esc(project.reportedOperator || 'Not stated') + '</dd></div><div><dt>Phone / email</dt><dd>Not publicly verified in our dataset</dd></div><div><dt>Location precision</dt><dd>' + esc(project.locationPrecision || 'Not stated') + '</dd></div></dl><div class="mp-source">' + (source ? '<a href="' + esc(source) + '" target="_blank" rel="noopener noreferrer">Open original source ↗</a>' : 'Source link unavailable') + '</div></article><article class="mp-panel"><h3>Explore related projects</h3><p class="mp-minor">Projects grouped by reported country, type or region; not necessarily affiliated.</p>' + (related.length ? '<ul class="mp-related">' + related.map(({record: p}) => '<li><a href="/projects/' + encodeURIComponent(p.id) + '/"><strong>' + esc(p.name) + '</strong><small>' + esc(p.where || p.country || '') + ' · ' + esc(p.infrastructureType || 'Infrastructure') + '</small><span aria-hidden="true">↗</span></a><a class="mp-related-compare" href="/directory/?compare=' + encodeURIComponent([project.id,p.id].join(',')) + esc(returnFilters) + '#project-comparison" aria-label="Compare ' + esc(project.name) + ' with ' + esc(p.name) + '">Compare these two projects ↗</a></li>').join('') + '</ul>' : '<p>No other projects share this record’s country, category or region in the current dataset.</p>') + '<a class="mp-all" href="/directory/">See all projects →</a></article></div>';
    if (!comparisonContext.length) compare.setAttribute('aria-label', 'Compare ' + project.name + ' in the directory');
    copy.setAttribute('aria-label', 'Copy link to ' + project.name); download.setAttribute('aria-label', 'Download research JSON for ' + project.name); correction.setAttribute('aria-label', 'Suggest verified contact details for ' + project.name);
  }
  async function load() {
    if (loading) return;
    loading = true; record = null; download.disabled = true; retry.hidden = true; details.innerHTML = ''; details.setAttribute('aria-busy', 'true'); loadingStatus.textContent = 'Loading related project research details…';
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/data/projects.json', {signal: controller.signal});
      if (!response.ok) throw Error('Dataset unavailable');
      const data = await response.json();
      if (!Array.isArray(data.records) || data.records.some(p => !p || typeof p.id !== 'string' || !/^[a-z0-9-]+$/.test(p.id) || typeof p.name !== 'string' || !p.name.trim()) || new Set(data.records.map(p => p.id)).size !== data.records.length) throw Error('Invalid dataset');
      const project = data.records.find(p => p.id === id);
      if (!project) throw Error('Project missing from current catalog');
      render(data.records, project); record = project; download.disabled = false; loadingStatus.textContent = '';
    } catch {
      loadingStatus.textContent = 'Related research details could not be loaded. The published passport above remains readable. You can retry, copy its link, or prepare a correction.';
      retry.hidden = false;
    } finally { clearTimeout(timer); loading = false; details.setAttribute('aria-busy', 'false'); }
  }
  retry.addEventListener('click', load);
  load();
})();
