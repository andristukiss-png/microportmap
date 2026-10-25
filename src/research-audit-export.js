(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const csvButton = el('audit-download'), jsonButton = el('audit-json'), status = el('audit-status');
  if (!csvButton || !jsonButton || !status) return;
  let checks = [], reviewChecks = [], reviewFilters = {};
  window.addEventListener('mp-review-view', event => { reviewChecks = event.detail.checks; reviewFilters = event.detail.filters; if (el('audit-scope').value === 'review') status.textContent = reviewChecks.length + (reviewChecks.length === 1 ? ' record' : ' records') + ' in the current review view. No data has been submitted.'; });
  const disable = value => { csvButton.disabled = value; jsonButton.disabled = value; };
  window.addEventListener('mp-quality-loading', () => { checks = []; reviewChecks = []; disable(true); status.textContent = 'Preparing audit export…'; });
  window.addEventListener('mp-quality-error', () => { checks = []; reviewChecks = []; disable(true); status.textContent = 'Audit exports unavailable while the research dataset cannot be loaded.'; });
  window.addEventListener('mp-quality-ready', event => {
    checks = event.detail.checks;
    disable(!checks.length);
    status.textContent = el('audit-scope').value === 'review' ? reviewChecks.length + (reviewChecks.length === 1 ? ' record' : ' records') + ' in the current review view. No data has been submitted.' : checks.length + ' records ready; ' + checks.filter(c => c.flags.length).length + ' flagged for metadata review. Dates marked unverified are included.';
  });
  el('audit-scope').addEventListener('change', () => {
    if (checks.length) status.textContent = (el('audit-scope').value === 'flagged' ? checks.filter(c => c.flags.length).length + ' flagged records selected.' : el('audit-scope').value === 'review' ? reviewChecks.length + (reviewChecks.length === 1 ? ' record' : ' records') + ' in the current review view.' : checks.length + ' records selected.') + ' No data has been submitted.';
  });
  const cell = value => { let s = String(value ?? ''); if (/^[\s\uFEFF]*[=+@-]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  function download(format) {
    const flaggedOnly = el('audit-scope').value === 'flagged';
    const reviewOnly = el('audit-scope').value === 'review';
    const chosen = reviewOnly ? reviewChecks : flaggedOnly ? checks.filter(c => c.flags.length) : checks;
    if (!chosen.length) { status.textContent = 'No records in the selected export scope.'; return; }
    let url, link;
    try {
      let contents, type;
      if (format === 'json') {
        contents = JSON.stringify({schemaVersion: '1.0', name: 'MicroportMap research metadata audit', exportedAt: new Date().toISOString(), scope: reviewOnly ? 'review' : flaggedOnly ? 'flagged' : 'all', ...(reviewOnly ? {reviewFilters} : {}), count: chosen.length, limitations: 'Metadata checks only. An unverified date flag reflects the existing label; it does not independently establish a publication date or operational status. The absence of a flag does not establish accuracy.', records: chosen.map(c => ({record: c.record, flags: c.flags}))}, null, 2);
        type = 'application/json;charset=utf-8';
      } else {
        const header = ['Project ID','Project name','Country','Infrastructure type','Reported operator','Report-date label','Location precision','Evidence status','Source URL','Flag count','Data review flags','Passport URL'];
        const rows = chosen.map(({record: p, flags}) => [p.id || '',p.name || '',p.country || '',p.infrastructureType || '',p.reportedOperator || '',p.reportDateLabel || '',p.locationPrecision || '',p.verificationStatus || '',p.source?.url || '',String(flags.length),flags.join('; '),typeof p.id === 'string' && /^[a-z0-9-]+$/.test(p.id) && !flags.includes('Invalid project ID') && !flags.includes('Duplicate project ID') ? 'https://microportmap.com/projects/' + encodeURIComponent(p.id) + '/' : '']);
        contents = '\uFEFF' + [header, ...rows].map(row => row.map(cell).join(',')).join('\r\n');
        type = 'text/csv;charset=utf-8';
      }
      url = URL.createObjectURL(new Blob([contents], {type}));
      link = document.createElement('a'); link.href = url; link.download = 'microportmap-' + (reviewOnly ? 'review-view' : flaggedOnly ? 'flagged' : 'research') + '-audit.' + format;
      document.body.appendChild(link); link.click();
      status.textContent = chosen.length + (chosen.length === 1 ? ' record: ' : ' records: ') + format.toUpperCase() + ' download requested. Your browser controls file saving. No data was submitted.';
    } catch { status.textContent = format.toUpperCase() + ' download could not be started. Try the other format or the raw research dataset.'; }
    finally { link?.remove(); if (url) setTimeout(() => URL.revokeObjectURL(url), 30000); }
  }
  csvButton.addEventListener('click', () => download('csv'));
  jsonButton.addEventListener('click', () => download('json'));
})();
