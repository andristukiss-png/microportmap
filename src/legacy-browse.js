(() => {
  'use strict';
  const incoming = new URL(location.href);
  // Older coverage links used filters the current atlas cannot display.
  if ((!incoming.searchParams.has('year') && !incoming.searchParams.has('region')) || incoming.searchParams.has('project')) return;
  const destination = new URL('/directory/', incoming.origin);
  for (const key of ['q', 'country', 'type', 'sort', 'region', 'year']) {
    if (incoming.searchParams.has(key)) destination.searchParams.set(key, incoming.searchParams.get(key));
  }
  destination.hash = 'results';
  location.replace(destination.href);
})();
