(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const quality = window.MicroportQuality;
  let loading = false;
  function render(data) {
    const checks = quality.inspect(data), records = checks.map(c => c.record), total = records.length;
    const count = predicate => records.filter(predicate).length;
    const has = key => record => quality.present(record[key]);
    const flagged = flag => checks.filter(c => c.flags.includes(flag)).length;
    const items = [
      ['Records', total, 'Research entries, not verified operational sites'],
      ['With source URL', count(quality.sourceOK), 'A citation, not proof of current operation'],
      ['With map point', count(quality.coordinatesOK), 'Coordinates may only be approximate'],
      ['With report-date label', count(has('reportDateLabel')), 'A text label may explicitly state that its date is unverified'],
      ['Report dates marked unverified', count(quality.dateMarkedUnverified), 'The existing record explicitly labels the report date as unverified'],
      ['With country', count(has('country')), 'Country attribution in the record'],
      ['With operator name', count(has('reportedOperator')), 'Reported, not independently confirmed'],
      ['With evidence status', count(has('verificationStatus')), 'Read each status carefully'],
      ['Missing or invalid source URL', count(p => !quality.sourceOK(p)), 'Requires citation-format review'],
      ['Missing report-date label', flagged('Missing report-date label'), 'Date context has not been recorded'],
      ['Missing operator name', flagged('Missing operator'), 'Operator has not been recorded'],
      ['Missing country', flagged('Missing country'), 'Country attribution is needed for geographic filtering'],
      ['Missing evidence status', flagged('Missing evidence status'), 'Verification limitations should be documented'],
      ['Missing equipment detail', flagged('Missing equipment'), 'Equipment information is not documented'],
      ['Missing location precision', flagged('Missing location precision'), 'Location uncertainty should be explained'],
      ['Missing project description', flagged('Missing description'), 'The reported project needs a clear description'],
      ['Missing infrastructure type', flagged('Missing infrastructure type'), 'Classification is needed for directory filtering'],
      ['Records with duplicate IDs', flagged('Duplicate project ID'), 'Each affected record appears in the review queue'],
      ['Missing map points', flagged('Missing map point'), 'No project reference point has been recorded'],
      ['Invalid map points', flagged('Invalid map point'), 'Malformed or out-of-range coordinates require review'],
      ['Missing project IDs', flagged('Missing project ID'), 'Each record needs a stable identifier'],
      ['Invalid project IDs', flagged('Invalid project ID'), 'Identifiers must safely match project URLs'],
      ['Missing project names', flagged('Missing project name'), 'Each record needs a readable name']
    ];
    el('summary').innerHTML = items.map(([name, value, note]) => {
      const affected = /^(Missing|Invalid|Records with duplicate|Report dates marked)/.test(name);
      return '<article class="stat"><strong>' + value + '</strong><span>' + esc(name) + '</span><small>' + esc(note) + '</small>' + (name === 'Records' ? '' : '<small>' + (affected ? 'Records affected: ' : 'Coverage: ') + (total ? Math.round(100 * value / total) : 0) + '% of records</small>') + '</article>';
    }).join('');
    const review = checks.filter(c => c.flags.length).sort((a, b) => b.flags.length - a.flags.length || String(a.record.name || '').localeCompare(String(b.record.name || '')));
    const row = ({record: p, flags}) => '<li><div><strong>' + esc(p.name || 'Unnamed record') + '</strong><small>' + esc(flags.join(' · ')) + '</small></div>' + (quality.present(p.id) && !flags.includes('Invalid project ID') && !flags.includes('Duplicate project ID') ? '<span class="review-actions"><a href="/projects/' + encodeURIComponent(p.id) + '/" aria-label="Research passport for ' + esc(p.name || 'this project') + '">Passport ↗</a><a href="/submit/?project=' + encodeURIComponent(p.id) + '" aria-label="Suggest a correction for ' + esc(p.name || 'this project') + '">Suggest correction ↗</a></span>' : '<span>Project ID needs review before linking</span>') + '</li>';
    el('review-records').innerHTML = review.length ? '<p><strong>' + review.length + ' records flagged</strong> for metadata review.</p><ul class="review-list">' + review.slice(0, 25).map(row).join('') + '</ul>' + (review.length > 25 ? '<details class="review-more"><summary>Show remaining ' + (review.length - 25) + ' flagged records</summary><ul class="review-list">' + review.slice(25).map(row).join('') + '</ul></details>' : '') : '<p>No records flagged by these metadata checks. This is not independent verification of operations.</p>';
    const countries = new Map();
    records.forEach(p => { const key = p.country || 'Unspecified'; countries.set(key, (countries.get(key) || 0) + 1); });
    el('countries').innerHTML = Array.from(countries).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).map(([name, n]) => '<div class="country"><a href="/directory/?country=' + encodeURIComponent(name) + '" aria-label="Browse ' + esc(name) + ' projects">' + esc(name) + ' ↗</a><strong>' + n + '</strong></div>').join('');
    window.dispatchEvent(new CustomEvent('mp-quality-ready', {detail: {checks, records}}));
  }
  async function load() {
    if (loading) return;
    loading = true; el('error').hidden = true; el('quality-retry').disabled = true;
    el('summary').setAttribute('aria-busy', 'true');
    window.dispatchEvent(new CustomEvent('mp-quality-loading'));
    const controller = new AbortController();
    let timer;
    try {
      const deadline = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(Error('Metadata lookup timed out')); }, 15000); });
      const data = await Promise.race([deadline, (async () => {
        const response = await fetch('/data/projects.json', {signal: controller.signal});
        if (!response.ok) throw Error('Dataset unavailable');
        return response.json();
      })()]);
      render(data);
    } catch {
      el('summary').textContent = 'Coverage indicators unavailable.';
      el('countries').textContent = 'Country coverage unavailable.';
      el('review-records').textContent = 'Record checks unavailable while the dataset cannot be loaded.';
      el('error').hidden = false;
      window.dispatchEvent(new CustomEvent('mp-quality-error'));
    } finally { clearTimeout(timer); loading = false; el('quality-retry').disabled = false; el('summary').setAttribute('aria-busy', 'false'); }
  }
  el('quality-retry').addEventListener('click', load);
  load();
})();
