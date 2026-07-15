(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsExplorerState = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function numberParam(params, name) {
    if (!params.has(name)) return undefined;
    var value = Number(params.get(name));
    return Number.isFinite(value) ? value : undefined;
  }

  function normalizeFocus(value, tracks) {
    var validIds = (tracks || []).map(function (track) { return track.id; });
    var values = Array.isArray(value) ? value : String(value || '').split(',');
    return values.reduce(function (ids, id) {
      id = String(id).trim();
      if (id && validIds.indexOf(id) !== -1 && ids.indexOf(id) === -1 && ids.length < 2) ids.push(id);
      return ids;
    }, []);
  }

  function normalizeLocale(value, fallback) {
    return ['ru', 'en', 'zh'].indexOf(value) !== -1 ? value : fallback;
  }

  function normalizeYear(value, direction) {
    value = Math.round(Number(value));
    if (!Number.isFinite(value)) return direction < 0 ? -1 : 1;
    return value === 0 ? (direction < 0 ? -1 : 1) : value;
  }

  function scaleRange(mode, data) {
    var breakpoint = data.scale && data.scale.breakpoint || -3500;
    if (mode === 'deep') return { start: data.range.start, end: breakpoint };
    if (mode === 'historical') return { start: breakpoint, end: data.range.end };
    return { start: data.range.start, end: data.range.end };
  }

  function parse(params, defaults, data) {
    var state = Object.assign({}, defaults, { focus: (defaults.focus || []).slice() });
    var view = params.get('view');
    if (view === 'map' || view === 'chronology') state.view = view;
    var scaleMode = params.get('scale');
    if (['overview', 'deep', 'historical'].indexOf(scaleMode) !== -1) state.scaleMode = scaleMode;
    if (state.scaleMode && !params.has('start') && !params.has('end')) {
      var selectedRange = scaleRange(state.scaleMode, data);
      state.start = selectedRange.start;
      state.end = selectedRange.end;
    }
    if (params.has('q')) state.query = params.get('q').slice(0, 100);
    if ((data.regions || []).some(function (region) { return region.id === params.get('region'); })) state.region = params.get('region');
    if ((data.regions || []).some(function (region) { return region.id === params.get('panel'); })) state.selectedRegion = params.get('panel');
    var type = params.get('type');
    if (type === 'civilization') state.type = 'society';
    else if (['all', 'society', 'archaeological-culture', 'site', 'polity', 'regional-sequence', 'network', 'tradition', 'legacy'].indexOf(type) !== -1) state.type = type;

    var start = numberParam(params, 'start');
    var end = numberParam(params, 'end');
    var year = numberParam(params, 'year');
    var zoom = numberParam(params, 'zoom');
    if (start !== undefined) state.start = clamp(normalizeYear(start, -1), data.range.start, data.range.end - 1);
    if (end !== undefined) state.end = clamp(normalizeYear(end, 1), state.start + 1, data.range.end);
    if (year !== undefined) state.year = clamp(normalizeYear(year, state.end < 1 ? -1 : 1), state.start, state.end);
    else state.year = clamp(normalizeYear(state.year, state.end < 1 ? -1 : 1), state.start, state.end);
    if (zoom !== undefined) state.zoom = clamp(zoom, 75, 240);
    if (params.has('focus')) state.focus = normalizeFocus(params.get('focus'), data.tracks);
    if (params.has('lang')) state.lang = normalizeLocale(params.get('lang'), defaults.lang);
    return state;
  }

  function serialize(state, defaults) {
    var params = new URLSearchParams();
    if (state.lang) params.set('lang', state.lang);
    if (state.scaleMode && state.scaleMode !== defaults.scaleMode) params.set('scale', state.scaleMode);
    if (state.view !== defaults.view) params.set('view', state.view);
    if (state.query) params.set('q', state.query);
    if (state.region !== defaults.region) params.set('region', state.region);
    if (state.selectedRegion) params.set('panel', state.selectedRegion);
    if (state.type !== defaults.type) params.set('type', state.type);
    if (state.start !== defaults.start) params.set('start', state.start);
    if (state.end !== defaults.end) params.set('end', state.end);
    if (state.year !== defaults.year) params.set('year', state.year);
    if (state.zoom !== defaults.zoom) params.set('zoom', state.zoom);
    if (state.focus && state.focus.length) params.set('focus', state.focus.join(','));
    return params;
  }

  return {
    normalizeFocus: normalizeFocus,
    parse: parse,
    serialize: serialize
  };
}));
