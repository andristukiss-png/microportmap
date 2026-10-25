(() => {
  'use strict';
  const fold = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const matches = (record, query) => {
    const terms = fold(query).trim().split(/\s+/).filter(Boolean);
    const text = fold([record.name, record.where, record.country, record.region,
      record.infrastructureType, record.reportedOperator, record.reportedEquipment,
      record.description, typeof record.source === 'string' ? record.source : record.source?.name].join(' '));
    return terms.every(term => text.includes(term));
  };
  window.MicroportSearch = Object.freeze({fold, matches});
})();
