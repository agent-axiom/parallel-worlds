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
      if (filters.type === 'society' && track.type === 'tradition') return false;
      if (filters.type === 'reviewed' && track.reviewStatus !== 'reviewed') return false;
      if (filters.type === 'legacy' && track.reviewStatus !== 'legacy') return false;
      if (filters.type && filters.type !== 'all' && filters.type !== 'society' && filters.type !== 'reviewed' && filters.type !== 'legacy' && track.type !== filters.type) return false;
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

  function periodDensity(width) {
    width = Number(width);
    if (width >= 112) return 'wide';
    if (width >= 64) return 'medium';
    if (width >= 32) return 'compact';
    return 'node';
  }

  function periodTooltipRecord(period) {
    var dating = period.dating || {};
    return {
      id: period.id || '',
      name: period.name,
      start: period.start,
      end: period.end,
      precision: dating.precision || '',
      basis: dating.basis || ''
    };
  }

  function tooltipPosition(target, box, viewport) {
    var margin = 8;
    var gap = 10;
    var maxLeft = Math.max(margin, Number(viewport.width) - Number(box.width) - margin);
    var maxTop = Math.max(margin, Number(viewport.height) - Number(box.height) - margin);
    var left = Number(target.left) + Number(target.width) / 2 - Number(box.width) / 2;
    var top = Number(target.top) - Number(box.height) - gap;
    if (top < margin) top = Math.min(maxTop, Number(target.bottom) + gap);
    return {
      left: Math.round(clamp(left, margin, maxLeft)),
      top: Math.round(clamp(top, margin, maxTop))
    };
  }

  function buildCsv(tracks, options) {
    options = options || {};
    var headers = options.headers || ['Линия', 'Тип', 'Регион', 'Период', 'Начало', 'Конец', 'Примечание'];
    var includeEvidence = Boolean(options.includeEvidence || headers.length > 7);
    var rows = [headers];
    tracks.forEach(function (track) {
      track.periods.forEach(function (period) {
        var row = [
          track.name,
          options.typeNames && options.typeNames[track.type] || track.type,
          options.regionNames && options.regionNames[track.region] || track.region,
          period.name, period.start, period.end, period.note || ''
        ];
        if (includeEvidence) {
          var dating = period.dating || {};
          var sourceIds = period.sourceIds && period.sourceIds.length ? period.sourceIds : track.sources || [];
          var sourceUrls = sourceIds.map(function (sourceId) {
            var source = options.sources && options.sources[sourceId];
            return source && source.url ? source.url : '';
          }).filter(Boolean);
          row.push(
            options.precisionNames && options.precisionNames[dating.precision] || dating.precision || '',
            options.basisNames && options.basisNames[dating.basis] || dating.basis || '',
            dating.original || '',
            options.reviewNames && options.reviewNames[track.reviewStatus] || track.reviewStatus || '',
            sourceUrls.join(' | ')
          );
        }
        rows.push(row);
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
    periodDensity: periodDensity,
    periodTooltipRecord: periodTooltipRecord,
    tooltipPosition: tooltipPosition,
    visiblePeriods: visiblePeriods,
    yearToPercent: yearToPercent
  };
}));
