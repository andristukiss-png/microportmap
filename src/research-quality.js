(() => {
  'use strict';
  const present = value => value != null && String(value).trim().length > 0;
  const sourceOK = record => {
    try { const u = new URL(record.source?.url || ''); return u.protocol === 'https:' && Boolean(u.hostname) && !u.username && !u.password; }
    catch { return false; }
  };
  const coordinatesOK = record => {
    const p = record.approximateMapPoint;
    return Boolean(p) && typeof p.latitude === 'number' && typeof p.longitude === 'number' && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude) <= 85.05112878 && Math.abs(p.longitude) <= 180;
  };
  const dateMarkedUnverified = record => /\bunverified\b/i.test(String(record.reportDateLabel || ''));
  const fields = [['name', 'Missing project name'], ['reportDateLabel', 'Missing report-date label'], ['country', 'Missing country'], ['reportedOperator', 'Missing operator'], ['verificationStatus', 'Missing evidence status'], ['reportedEquipment', 'Missing equipment'], ['locationPrecision', 'Missing location precision'], ['description', 'Missing description'], ['infrastructureType', 'Missing infrastructure type']];
  function inspect(data) {
    if (!Array.isArray(data.records) || data.records.some(p => !p || typeof p !== 'object' || Array.isArray(p))) throw Error('Invalid research catalog');
    const ids = new Map();
    data.records.forEach(p => { if (present(p.id)) ids.set(p.id, (ids.get(p.id) || 0) + 1); });
    return data.records.map(record => {
      const flags = fields.filter(([key]) => !present(record[key])).map(([, label]) => label);
      if (!present(record.id)) flags.push('Missing project ID');
      else {
        if (typeof record.id !== 'string' || !/^[a-z0-9-]+$/.test(record.id)) flags.push('Invalid project ID');
        if (ids.get(record.id) > 1) flags.push('Duplicate project ID');
      }
      if (!sourceOK(record)) flags.push('Missing or invalid HTTPS source URL');
      if (record.approximateMapPoint == null) flags.push('Missing map point');
      else if (!coordinatesOK(record)) flags.push('Invalid map point');
      if (dateMarkedUnverified(record)) flags.push('Report date explicitly marked unverified');
      return {record, flags};
    });
  }
  window.MicroportQuality = Object.freeze({inspect, present, sourceOK, coordinatesOK, dateMarkedUnverified});
})();
