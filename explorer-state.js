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

  function parse(params, defaults, data) {
    var state = Object.assign({}, defaults, { focus: (defaults.focus || []).slice() });
    var view = params.get('view');
    if (view === 'map' || view === 'chronology') state.view = view;
    if (params.has('q')) state.query = params.get('q').slice(0, 100);
    if ((data.regions || []).some(function (region) { return region.id === params.get('region'); })) state.region = params.get('region');
    if (['all', 'civilization', 'tradition'].indexOf(params.get('type')) !== -1) state.type = params.get('type');

    var start = numberParam(params, 'start');
    var end = numberParam(params, 'end');
    var year = numberParam(params, 'year');
    var zoom = numberParam(params, 'zoom');
    if (start !== undefined) state.start = clamp(start, data.range.start, data.range.end - 1);
    if (end !== undefined) state.end = clamp(end, state.start + 1, data.range.end);
    if (year !== undefined) state.year = clamp(year, state.start, state.end);
    if (zoom !== undefined) state.zoom = clamp(zoom, 75, 240);
    if (params.has('focus')) state.focus = normalizeFocus(params.get('focus'), data.tracks);
    if (params.has('lang')) state.lang = normalizeLocale(params.get('lang'), defaults.lang);
    return state;
  }

  function serialize(state, defaults) {
    var params = new URLSearchParams();
    if (state.lang) params.set('lang', state.lang);
    if (state.view !== defaults.view) params.set('view', state.view);
    if (state.query) params.set('q', state.query);
    if (state.region !== defaults.region) params.set('region', state.region);
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
