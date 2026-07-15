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

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function modeRange(mode, range) {
    var start = normalizeHistoricalYear(range.start, 1);
    var end = normalizeHistoricalYear(range.end, -1);
    var breakpoint = Math.max(start, Math.min(end, range.breakpoint || DEFAULT_BREAKPOINT));
    if (mode === 'deep') return { start: start, end: breakpoint };
    if (mode === 'historical') return { start: breakpoint, end: end };
    return { start: start, end: end };
  }

  function createScale(start, end, mode, breakpoint, deepWeight) {
    start = normalizeHistoricalYear(start, 1);
    end = normalizeHistoricalYear(end, -1);
    if (toOrdinal(start) >= toOrdinal(end)) throw new RangeError('Chronology scale start must precede end');
    breakpoint = normalizeHistoricalYear(breakpoint === undefined ? DEFAULT_BREAKPOINT : breakpoint, 1);
    var hasBreakpoint = mode === 'overview' && toOrdinal(breakpoint) > toOrdinal(start) && toOrdinal(breakpoint) < toOrdinal(end);
    return {
      start: start,
      end: end,
      mode: mode || 'overview',
      breakpoint: breakpoint,
      deepWeight: clamp(Number(deepWeight === undefined ? 0.30 : deepWeight), 0.1, 0.9),
      piecewise: hasBreakpoint
    };
  }

  function linearPercent(year, start, end) {
    var total = toOrdinal(end) - toOrdinal(start);
    return total ? ((toOrdinal(year) - toOrdinal(start)) / total) * 100 : 0;
  }

  function projectYear(year, scale) {
    year = normalizeHistoricalYear(year, year < 0 ? -1 : 1);
    if (!scale.piecewise) return clamp(linearPercent(year, scale.start, scale.end), 0, 100);
    if (toOrdinal(year) <= toOrdinal(scale.breakpoint)) {
      return clamp(linearPercent(year, scale.start, scale.breakpoint) * scale.deepWeight, 0, scale.deepWeight * 100);
    }
    var historicalPercent = linearPercent(year, scale.breakpoint, scale.end);
    return clamp((scale.deepWeight + historicalPercent / 100 * (1 - scale.deepWeight)) * 100, scale.deepWeight * 100, 100);
  }

  function interpolateYear(percent, start, end) {
    var value = toOrdinal(start) + (toOrdinal(end) - toOrdinal(start)) * clamp(percent, 0, 100) / 100;
    return fromOrdinal(Math.round(value));
  }

  function unprojectYear(percent, scale) {
    percent = clamp(Number(percent) || 0, 0, 100);
    if (!scale.piecewise) return interpolateYear(percent, scale.start, scale.end);
    var boundary = scale.deepWeight * 100;
    if (percent <= boundary) return interpolateYear(percent / scale.deepWeight, scale.start, scale.breakpoint);
    return interpolateYear((percent - boundary) / (1 - scale.deepWeight), scale.breakpoint, scale.end);
  }

  function roundTick(year, scale) {
    var magnitude = scale.mode === 'historical' ? 100 : (year < scale.breakpoint ? 500 : 100);
    var rounded = Math.round(year / magnitude) * magnitude;
    return normalizeHistoricalYear(rounded, year < 0 ? -1 : 1);
  }

  function ticks(scale, targetCount) {
    var count = Math.max(2, Math.round(Number(targetCount) || 10));
    var values = [];
    for (var index = 0; index <= count; index += 1) {
      var year = index === 0 ? scale.start : (index === count ? scale.end : roundTick(unprojectYear(index / count * 100, scale), scale));
      if (values.indexOf(year) === -1) values.push(year);
    }
    if (scale.piecewise && values.indexOf(scale.breakpoint) === -1) values.push(scale.breakpoint);
    return values.sort(function (a, b) { return toOrdinal(a) - toOrdinal(b); });
  }

  function recommendedStep(scale) {
    if (scale.mode === 'overview') return 500;
    if (scale.mode === 'deep') return 100;
    return 20;
  }

  return {
    addHistoricalYears: addHistoricalYears,
    createScale: createScale,
    fromOrdinal: fromOrdinal,
    historicalDistance: historicalDistance,
    isValidHistoricalYear: isValidHistoricalYear,
    modeRange: modeRange,
    nextYear: nextYear,
    normalizeHistoricalYear: normalizeHistoricalYear,
    projectYear: projectYear,
    recommendedStep: recommendedStep,
    ticks: ticks,
    unprojectYear: unprojectYear,
    toOrdinal: toOrdinal
  };
}));
