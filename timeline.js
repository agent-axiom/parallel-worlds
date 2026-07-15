(function (root, factory) {
  var chronology = typeof module === 'object' && module.exports ? require('./chronology.js') : root.ParallelWorldsChronology;
  var api = factory(chronology);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelTimeline = api;
}(typeof self !== 'undefined' ? self : this, function (chronology) {
  'use strict';

  function normalize(value) {
    return String(value || '').toLocaleLowerCase('ru-RU').trim();
  }

  function searchableText(track) {
    return [track.name, track.summary]
      .concat(track.periods.map(function (period) { return period.name + ' ' + (period.note || ''); }))
      .concat(track.events.map(function (event) { return event.title + ' ' + (event.note || ''); }))
      .join(' ');
  }

  function filterTracks(tracks, filters) {
    var query = normalize(filters.query);
    return tracks.filter(function (track) {
      if (filters.region && filters.region !== 'all' && track.region !== filters.region) return false;
      if (filters.type && filters.type !== 'all' && track.type !== filters.type) return false;
      return !query || normalize(searchableText(track)).indexOf(query) !== -1;
    });
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function yearToPercent(year, start, end) {
    if (start && typeof start === 'object') return chronology.projectYear(year, start);
    if (end === start) return 0;
    return clamp(((year - start) / (end - start)) * 100, 0, 100);
  }

  function formatYear(year, locale) {
    var lang = String(locale || 'ru').toLowerCase();
    if (lang.indexOf('zh') === 0) return year < 0 ? '公元前' + Math.abs(year) + '年' : '公元' + (year === 0 ? 1 : year) + '年';
    var english = lang.indexOf('en') === 0;
    if (year < 0) return Math.abs(year) + (english ? ' BCE' : ' до н. э.');
    return (year === 0 ? 1 : year) + (english ? ' CE' : ' н. э.');
  }

  function activeTracks(tracks, year) {
    return tracks.filter(function (track) {
      return track.periods.some(function (period) {
        return year >= period.start && year <= period.end;
      });
    });
  }

  function numericParam(params, name) {
    if (!params.has(name)) return undefined;
    var value = Number(params.get(name));
    return Number.isFinite(value) ? value : undefined;
  }

  function visiblePeriods(track, start, end) {
    return track.periods.filter(function (period) {
      return period.end >= start && period.start <= end;
    }).map(function (period) {
      return Object.assign({}, period, {
        clippedStart: Math.max(period.start, start),
        clippedEnd: Math.min(period.end, end)
      });
    });
  }

  function buildCsv(tracks, options) {
    options = options || {};
    var headers = options.headers || ['Линия', 'Тип', 'Регион', 'Период', 'Начало', 'Конец', 'Примечание'];
    var rows = [headers];
    tracks.forEach(function (track) {
      track.periods.forEach(function (period) {
        rows.push([
          track.name,
          options.typeNames && options.typeNames[track.type] || track.type,
          options.regionNames && options.regionNames[track.region] || track.region,
          period.name, period.start, period.end, period.note || ''
        ]);
      });
    });
    return rows.map(function (row) {
      return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
  }

  return {
    activeTracks: activeTracks,
    buildCsv: buildCsv,
    clamp: clamp,
    filterTracks: filterTracks,
    formatYear: formatYear,
    numericParam: numericParam,
    visiblePeriods: visiblePeriods,
    yearToPercent: yearToPercent
  };
}));
