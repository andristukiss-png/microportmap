(() => {
  'use strict';
  const requested = new URLSearchParams(location.search).get('project');
  if (!requested) return;
  const form = document.getElementById('proposal');
  if (!form) return;
  const id = requested.slice(0, 150);
  form.dataset.requestedProjectId = id;
  form.dataset.requestedReferenceTruncated = String(requested.length > 150);
  const submit = form.querySelector('button[type=submit]'), type = document.getElementById('type');
  let loading = false;
  const edited = new Set(), clean = value => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim() : '';
  if (type?.value) edited.add('type');
  for (const key of ['name', 'city', 'country', 'operator', 'type']) {
    const field = document.getElementById(key);
    for (const event of ['input', 'change']) field?.addEventListener(event, () => edited.add(key));
  }
  const status = document.createElement('p'); status.className = 'notice'; status.id = 'correction-context-status'; status.setAttribute('role', 'status');
  form.insertBefore(status, form.firstChild);
  const retry = document.createElement('button'); retry.type = 'button'; retry.id = 'correction-retry'; retry.textContent = 'Retry project lookup';
  const heading = document.querySelector('.intro h1');
  if (heading) heading.textContent = 'Prepare a project correction';
  const descriptionLabel = document.querySelector('label[for="desc"]');
  if (descriptionLabel) descriptionLabel.textContent = 'What needs correcting, and what does your source support? *';
  function context(state) {
    form.dataset.contextResolution = state;
    form.dispatchEvent(new CustomEvent('mp-correction-context'));
  }
  function unresolved(state, message, canRetry) {
    context(state); status.setAttribute('role', 'alert');
    status.textContent = message + ' Your prepared report will retain this unresolved correction reference; it will not be labeled a new project suggestion.';
    if (canRetry) status.appendChild(retry);
    const directory = document.createElement('a'); directory.href = '/directory/'; directory.textContent = 'Find the project in the directory ↗';
    status.appendChild(document.createElement('br')); status.appendChild(directory);
  }
  if (requested.length > 150 || !/^[a-z0-9-]+$/.test(requested)) {
    unresolved('invalid-reference', requested.length > 150 ? 'The project reference is too long and has been truncated in the report.' : 'The project reference is not a valid directory identifier.', false);
    return;
  }
  async function lookup() {
    if (loading) return;
    loading = true;
    delete form.dataset.projectId;
    for (const key of ['originalInfrastructureType', 'originalOperator', 'originalLocation', 'originalEvidenceStatus']) delete form.dataset[key];
    document.getElementById('correction-original-source')?.remove();
    const wasDisabled = Boolean(submit?.disabled);
    retry.disabled = true;
    context('loading'); status.setAttribute('role', 'status'); status.textContent = 'Loading the original project details…';
    if (submit) submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    const controller = new AbortController(); let timeout;
    try {
      const operation = fetch('/data/projects.json', {signal: controller.signal}).then(response => {
        if (!response.ok) throw Error('Dataset unavailable');
        return response.json();
      });
      const deadline = new Promise((_, reject) => { timeout = setTimeout(() => {
        controller.abort(); reject(Error('Project lookup timed out'));
      }, 15000); });
      const data = await Promise.race([operation, deadline]);
      if (!Array.isArray(data.records)) throw Error('Invalid dataset');
      const matches = data.records.filter(p => p && p.id === id);
      if (!matches.length) { unresolved('not-found', 'Project not found in the current research directory.', true); return; }
      if (matches.length !== 1 || typeof matches[0].name !== 'string' || !matches[0].name.trim()) throw Error('Ambiguous project reference');
      const record = matches[0];
      form.dataset.projectId = record.id;
      for (const [key, value] of Object.entries({originalInfrastructureType: record.infrastructureType, originalOperator: record.reportedOperator, originalLocation: record.where, originalEvidenceStatus: record.verificationStatus})) form.dataset[key] = clean(value);
      const set = (id, value) => { const field = document.getElementById(id); if (field && !edited.has(id) && !field.value && clean(value)) field.value = clean(value).slice(0, field.maxLength > 0 ? field.maxLength : 500); };
      set('name', record.name);
      const place = clean(record.where), country = clean(record.country), suffix = country ? ', ' + country : '';
      set('city', suffix && place.toLowerCase().endsWith(suffix.toLowerCase()) ? place.slice(0, -suffix.length).trim() : place);
      set('country', country); set('operator', record.reportedOperator);
      if (type && clean(record.infrastructureType) && !edited.has('type')) {
        const value = clean(record.infrastructureType);
        if (!Array.from(type.options).some(option => option.value === value)) {
          const option = document.createElement('option'); option.value = value; option.textContent = value + ' (recorded category)'; type.appendChild(option);
          const help = document.getElementById('recorded-type-help') || document.createElement('p'); help.id = 'recorded-type-help'; help.className = 'notice'; help.textContent = 'The original recorded category is preserved. Change it only if your correction requires it.';
          type.insertAdjacentElement('afterend', help); type.setAttribute('aria-describedby', [...new Set([...(type.getAttribute('aria-describedby') || '').split(/\s+/), help.id].filter(Boolean))].join(' '));
        }
        type.value = value;
      }
      status.textContent = 'Editing reported project: ' + record.name + '. Check all prefilled details and provide supporting evidence.';
      const passport = document.createElement('a'); passport.href = '/projects/' + encodeURIComponent(record.id) + '/'; passport.textContent = 'Review original project passport ↗'; passport.className = 'small-back'; passport.setAttribute('aria-label', 'Review ' + record.name + ' research passport');
      status.appendChild(document.createElement('br')); status.appendChild(passport);
      const original = clean(record.source?.url), source = document.getElementById('source');
      if (original && source) {
        const reference = document.createElement('p'); reference.id = 'correction-original-source'; reference.className = 'notice'; reference.textContent = 'Existing cited source (reference only): ';
        try { const url = new URL(original); if (url.protocol === 'https:' && !url.username && !url.password) { const a = document.createElement('a'); a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'View original source ↗'; reference.appendChild(a); } } catch {}
        reference.appendChild(document.createTextNode(' Enter evidence supporting your proposed correction above.')); source.insertAdjacentElement('afterend', reference);
      }
      context('resolved');
    } catch { unresolved('unavailable', 'Project details could not be loaded automatically. You can complete the report manually or retry the lookup.', true); }
    finally { clearTimeout(timeout); loading = false; retry.disabled = false; if (submit) submit.disabled = wasDisabled; form.removeAttribute('aria-busy'); }
  }
  retry.addEventListener('click', lookup);
  lookup();
})();
