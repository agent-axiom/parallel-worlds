(function (root, factory) {
  var chronology = typeof module === 'object' && module.exports ? require('./chronology.js') : root.ParallelWorldsChronology;
  var api = factory(chronology);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsDataQuality = api;
}(typeof self !== 'undefined' ? self : this, function (chronology) {
  'use strict';

  var TYPES = ['archaeological-culture', 'site', 'polity', 'regional-sequence', 'network', 'tradition'];
  var PRECISIONS = ['exact', 'approximate', 'range', 'traditional', 'disputed'];
  var BASES = ['historical', 'archaeological-chronology', 'radiocarbon', 'dendrochronology', 'stratigraphy', 'traditional'];
  var LOCALES = ['ru', 'en', 'zh'];

  function issue(code, path, message) {
    return { code: code, path: path, message: message };
  }

  function isGenericHomepage(value) {
    try {
      var url = new URL(value);
      var path = url.pathname.replace(/\/+$/, '') || '/';
      return path === '/' || ['/collection', '/education', '/toah/chronology', '/toah/chronology/'].indexOf(path) !== -1;
    } catch (error) {
      return true;
    }
  }

  function validateSource(source, path) {
    var issues = [];
    ['tier', 'kind', 'title', 'publisher', 'year', 'url', 'accessed'].forEach(function (field) {
      if (!source || source[field] === undefined || source[field] === '') issues.push(issue('missing-source-field', path + '.' + field, 'Missing source field ' + field));
    });
    if (source && ['A', 'B', 'C'].indexOf(source.tier) === -1) issues.push(issue('invalid-source-tier', path + '.tier', 'Unknown evidence tier'));
    if (source && (!/^https:\/\//.test(source.url || '') || isGenericHomepage(source.url))) issues.push(issue('generic-source-url', path + '.url', 'Reviewed sources must use an exact HTTPS page or DOI'));
    return issues;
  }

  function validateSources(sources) {
    return Object.keys(sources || {}).reduce(function (issues, id) {
      return issues.concat(validateSource(sources[id], 'sources.' + id));
    }, []);
  }

  function validateCopy(copy, kind, path) {
    var issues = [];
    LOCALES.forEach(function (locale) {
      var localized = copy && copy[locale];
      var primary = kind === 'event' ? 'title' : 'name';
      if (!localized || !localized[primary]) issues.push(issue('missing-localization', path + '.copy.' + locale, 'Missing ' + locale + ' ' + primary));
      if (kind === 'track' && (!localized || !localized.summary)) issues.push(issue('missing-localization', path + '.copy.' + locale + '.summary', 'Missing ' + locale + ' summary'));
    });
    return issues;
  }

  function validateDating(dating, path) {
    var issues = [];
    if (!dating || PRECISIONS.indexOf(dating.precision) === -1) issues.push(issue('invalid-precision', path + '.dating.precision', 'Missing or invalid dating precision'));
    if (!dating || BASES.indexOf(dating.basis) === -1) issues.push(issue('invalid-dating-basis', path + '.dating.basis', 'Missing or invalid dating basis'));
    return issues;
  }

  function validateSourceIds(sourceIds, sources, path) {
    if (!Array.isArray(sourceIds) || !sourceIds.length) return [issue('missing-source', path + '.sourceIds', 'Reviewed record has no source')];
    return sourceIds.reduce(function (issues, id) {
      if (!sources[id]) issues.push(issue('unknown-source', path + '.sourceIds', 'Unknown source ' + id));
      else issues = issues.concat(validateSource(sources[id], 'sources.' + id));
      return issues;
    }, []);
  }

  function validateYear(year, range, path) {
    var issues = [];
    if (!chronology.isValidHistoricalYear(year)) issues.push(issue(year === 0 ? 'year-zero' : 'invalid-year', path, 'Historical years must be non-zero integers'));
    if (Number.isFinite(year) && (year < range.start || year > range.end)) issues.push(issue('out-of-range', path, 'Date is outside the canonical range'));
    return issues;
  }

  function validateReviewedTrack(track, sources, range) {
    var issues = [];
    var ids = {};
    if (!track || !track.id) return [issue('missing-id', 'track', 'Track ID is required')];
    if (TYPES.indexOf(track.type) === -1) issues.push(issue('invalid-type', track.id + '.type', 'Unknown academic track type'));
    if (track.reviewStatus !== 'reviewed') issues.push(issue('invalid-review-status', track.id + '.reviewStatus', 'Academic validation expects a reviewed track'));
    issues = issues.concat(validateCopy(track.copy, 'track', track.id));
    if (!Array.isArray(track.periods) || !track.periods.length) issues.push(issue('missing-period', track.id + '.periods', 'Track must contain a period'));
    if (!Array.isArray(track.events) || !track.events.length) issues.push(issue('missing-event', track.id + '.events', 'Track must contain an event'));

    (track.periods || []).forEach(function (period, index) {
      var path = track.id + '.periods[' + index + ']';
      if (!period.id || ids[period.id]) issues.push(issue(period.id ? 'duplicate-id' : 'missing-id', path + '.id', 'Period ID must be unique'));
      if (period.id) ids[period.id] = true;
      issues = issues.concat(validateYear(period.start, range, path + '.start'));
      issues = issues.concat(validateYear(period.end, range, path + '.end'));
      if (Number.isFinite(period.start) && Number.isFinite(period.end) && period.start >= period.end) issues.push(issue('invalid-range', path, 'Period start must precede end'));
      issues = issues.concat(validateDating(period.dating, path));
      issues = issues.concat(validateSourceIds(period.sourceIds, sources, path));
      issues = issues.concat(validateCopy(period.copy, 'period', path));
    });

    (track.events || []).forEach(function (event, index) {
      var path = track.id + '.events[' + index + ']';
      if (!event.id || ids[event.id]) issues.push(issue(event.id ? 'duplicate-id' : 'missing-id', path + '.id', 'Event ID must be unique'));
      if (event.id) ids[event.id] = true;
      issues = issues.concat(validateYear(event.year, range, path + '.year'));
      issues = issues.concat(validateDating(event.dating, path));
      issues = issues.concat(validateSourceIds(event.sourceIds, sources, path));
      issues = issues.concat(validateCopy(event.copy, 'event', path));
    });
    return issues;
  }

  function validateDataset(data) {
    var ids = {};
    return (data.tracks || []).reduce(function (issues, track) {
      if (ids[track.id]) issues.push(issue('duplicate-track-id', track.id, 'Track ID must be unique'));
      ids[track.id] = true;
      if (track.reviewStatus === 'reviewed') issues = issues.concat(validateReviewedTrack(track, data.sources || {}, data.range));
      else if (track.reviewStatus !== 'legacy' && track.reviewStatus !== 'provisional') issues.push(issue('missing-review-status', track.id + '.reviewStatus', 'Track review status is required'));
      return issues;
    }, []);
  }

  return {
    BASES: BASES,
    PRECISIONS: PRECISIONS,
    TYPES: TYPES,
    isGenericHomepage: isGenericHomepage,
    validateDataset: validateDataset,
    validateReviewedTrack: validateReviewedTrack,
    validateSources: validateSources
  };
}));
