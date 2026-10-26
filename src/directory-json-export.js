(() => {
  'use strict';
  const csv = document.getElementById('export-csv');
  const status = document.getElementById('share-status');
  if (!csv || !status) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'export-json';
  button.textContent = 'Export filtered JSON ↓';
  button.disabled = true;
  csv.insertAdjacentElement('afterend', button);
  const updateState = event => { button.disabled = event?.detail?.loading === true || !Array.isArray(window.mpFilteredRecords) || !window.mpFilteredRecords.length; };
  window.addEventListener('mp-directory-state', updateState);
  updateState();
  button.addEventListener('click', () => {
    const records = window.mpFilteredRecords;
    if (!Array.isArray(records) || !records.length) {
      status.textContent = 'No projects to export. Try clearing a filter.';
      return;
    }
    let url, link;
    try {
      const payload = {
        schemaVersion: '1.0',
        name: 'MicroportMap filtered research export',
        website: 'https://microportmap.com',
        exportedAt: new Date().toISOString(),
        filters: Object.fromEntries(['search', 'country', 'kind', 'sort', 'region', 'year'].map(id => [id, document.getElementById(id).value.trim()])),
        methodology: 'Public reports only; locations are approximate project references. Current operations, public access and flight permission are not independently verified.',
        count: records.length,
        records
      };
      url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json;charset=utf-8'}));
      link = document.createElement('a');
      link.href = url;
      link.download = 'microportmap-filtered-projects.json';
      document.body.appendChild(link);
      link.click();
      status.textContent = records.length + (records.length === 1 ? ' record: JSON download requested.' : ' records: JSON download requested.') + ' Your browser controls file saving.';
    } catch {
      status.textContent = 'JSON download could not be started. Try again or use the full dataset download.';
    } finally {
      link?.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
  });
})();
