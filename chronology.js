(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsChronology = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_BREAKPOINT = -3500;

  function isValidHistoricalYear(year) {
    return Number.isInteger(year) && year !== 0;
  }

  function normalizeHistoricalYear(year, direction) {
    var value = Math.round(Number(year));
    if (!Number.isFinite(value)) return direction < 0 ? -1 : 1;
    if (value === 0) return direction < 0 ? -1 : 1;
    return value;
  }

  function toOrdinal(year) {
    if (!isValidHistoricalYear(year)) throw new RangeError('Historical year must be a non-zero integer');
    return year < 0 ? year + 1 : year;
  }

  function fromOrdinal(ordinal) {
    var value = Math.round(Number(ordinal));
    if (!Number.isFinite(value)) throw new RangeError('Historical ordinal must be finite');
    return value <= 0 ? value - 1 : value;
  }

  function addHistoricalYears(year, amount) {
    return fromOrdinal(toOrdinal(year) + Math.round(Number(amount) || 0));
  }

  function nextYear(year, step) {
    return addHistoricalYears(year, step);
  }

  function historicalDistance(start, end) {
    return Math.abs(toOrdinal(end) - toOrdinal(start));
  }

  function modeRange(mode, range) {
    var start = normalizeHistoricalYear(range.start, 1);
    var end = normalizeHistoricalYear(range.end, -1);
    var breakpoint = Math.max(start, Math.min(end, range.breakpoint || DEFAULT_BREAKPOINT));
    if (mode === 'deep') return { start: start, end: breakpoint };
    if (mode === 'historical') return { start: breakpoint, end: end };
    return { start: start, end: end };
  }

  return {
    addHistoricalYears: addHistoricalYears,
    fromOrdinal: fromOrdinal,
    historicalDistance: historicalDistance,
    isValidHistoricalYear: isValidHistoricalYear,
    modeRange: modeRange,
    nextYear: nextYear,
    normalizeHistoricalYear: normalizeHistoricalYear,
    toOrdinal: toOrdinal
  };
}));
