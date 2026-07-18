(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsExplorerState = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAX_JOURNEY_ROUTES = 100;
  var MAX_JOURNEY_STOPS = 8;
  var MAX_EDITION_WINDOWS = 100;
  var MAX_MEDIA_ENTRIES = 1000;
  var MAX_MEDIA_LINKS = 100;
  var EDITION_WINDOW_ID = /^window-[0-9]{2}$/;
  var EDITION_MEDIA_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

  function ownDataProperty(object, key) {
    if (!object || typeof object !== 'object' && typeof object !== 'function') return null;
    try {
      var descriptor = Object.getOwnPropertyDescriptor(object, key);
      return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value') ? descriptor : null;
    } catch (error) {
      return null;
    }
  }

  function ownValue(object, key) {
    var property = ownDataProperty(object, key);
    return property ? property.value : undefined;
  }

  function ownArray(object, key) {
    var value = ownValue(object, key);
    try {
      return Array.isArray(value) ? value : null;
    } catch (error) {
      return null;
    }
  }

  function arrayLength(value) {
    var length = ownValue(value, 'length');
    return Number.isFinite(length) && Math.floor(length) === length && length >= 0 ? length : 0;
  }

  function routeStopIds(journeys, routeId) {
    var routes = ownArray(journeys, 'routes');
    if (!routes) return null;
    var routeCount = arrayLength(routes);
    if (routeCount > MAX_JOURNEY_ROUTES) return null;
    var routeEntries = [];
    for (var routeIndex = 0; routeIndex < routeCount; routeIndex += 1) {
      var routeProperty = ownDataProperty(routes, String(routeIndex));
      if (!routeProperty) return null;
      routeEntries.push(routeProperty.value);
    }
    for (var routeIndex = 0; routeIndex < routeEntries.length; routeIndex += 1) {
      var route = routeEntries[routeIndex];
      if (ownValue(route, 'id') !== routeId) continue;
      var stops = ownArray(route, 'stops');
      if (!stops) return null;
      var stopCount = arrayLength(stops);
      if (stopCount < 1 || stopCount > MAX_JOURNEY_STOPS) return null;
      var stopEntries = [];
      for (var stopIndex = 0; stopIndex < stopCount; stopIndex += 1) {
        var stopProperty = ownDataProperty(stops, String(stopIndex));
        if (!stopProperty) return null;
        stopEntries.push(stopProperty.value);
      }
      var stopIds = [];
      for (var stopIndex = 0; stopIndex < stopEntries.length; stopIndex += 1) {
        var stopId = ownValue(stopEntries[stopIndex], 'id');
        if (typeof stopId === 'string' && stopId) stopIds.push(stopId);
      }
      return stopIds.length ? stopIds : null;
    }
    return null;
  }

  function restoreJourney(params, state, journeys) {
    var journeyId = params.get('journey');
    state.journey = '';
    state.stop = '';
    state.journeyMode = 'paused';
    state.journeyNotice = '';
    if (!journeyId) return;

    var stopIds = routeStopIds(journeys, journeyId);
    if (!stopIds) {
      state.journeyNotice = 'unknown-route';
      return;
    }

    state.journey = journeyId;
    state.stop = stopIds[0];
    var requestedStop = params.get('stop');
    if (requestedStop) {
      var knownStop = false;
      for (var stopIndex = 0; stopIndex < stopIds.length; stopIndex += 1) {
        if (stopIds[stopIndex] === requestedStop) {
          knownStop = true;
          break;
        }
      }
      if (!knownStop) {
        state.journeyNotice = 'unknown-stop';
        return;
      }
      state.stop = requestedStop;
    }
    state.journeyMode = params.get('journeyMode') === 'playing' ? 'playing' : 'paused';
  }

  function editionWindowExists(manifest, requestedId) {
    if (typeof requestedId !== 'string' || !EDITION_WINDOW_ID.test(requestedId)) return false;
    var windows = ownArray(manifest, 'windows');
    if (!windows) return false;
    var count = arrayLength(windows);
    if (count < 1 || count > MAX_EDITION_WINDOWS) return false;
    for (var index = 0; index < count; index += 1) {
      var windowProperty = ownDataProperty(windows, String(index));
      if (!windowProperty) return false;
      if (ownValue(windowProperty.value, 'id') === requestedId) return true;
    }
    return false;
  }

  function mediaBelongsToWindow(registry, requestedMedia, requestedWindow) {
    if (typeof requestedMedia !== 'string' || !EDITION_MEDIA_ID.test(requestedMedia)) return false;
    var entries = ownArray(registry, 'entries');
    if (!entries) return false;
    var entryCount = arrayLength(entries);
    if (entryCount > MAX_MEDIA_ENTRIES) return false;
    for (var entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
      var entryProperty = ownDataProperty(entries, String(entryIndex));
      if (!entryProperty) return false;
      var entry = entryProperty.value;
      if (ownValue(entry, 'id') !== requestedMedia) continue;
      var links = ownArray(entry, 'links');
      if (!links) return false;
      var linkCount = arrayLength(links);
      if (linkCount < 1 || linkCount > MAX_MEDIA_LINKS) return false;
      for (var linkIndex = 0; linkIndex < linkCount; linkIndex += 1) {
        var linkProperty = ownDataProperty(links, String(linkIndex));
        if (!linkProperty) return false;
        if (ownValue(linkProperty.value, 'windowId') === requestedWindow) return true;
      }
      return false;
    }
    return false;
  }

  function restoreEdition(params, state, manifest, registry) {
    state.editionWindow = '';
    state.editionMedia = '';
    state.editionNotice = '';
    var requestedWindow = params.get('editionWindow');
    if (!requestedWindow) return;
    if (!editionWindowExists(manifest, requestedWindow)) {
      state.editionNotice = 'unknown-edition-window';
      return;
    }
    state.editionWindow = requestedWindow;
    state.playing = false;
    state.journeyMode = 'paused';
    var requestedMedia = params.get('editionMedia');
    if (!requestedMedia) return;
    if (!mediaBelongsToWindow(registry, requestedMedia, requestedWindow)) {
      state.editionNotice = 'unknown-edition-media';
      return;
    }
    state.editionMedia = requestedMedia;
  }

  function parse(params, defaults, data, journeys, editionManifest, mediaRegistry) {
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
    else if (['all', 'society', 'archaeological-culture', 'site', 'polity', 'regional-sequence', 'network', 'tradition', 'reviewed', 'legacy'].indexOf(type) !== -1) state.type = type;

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
    restoreJourney(params, state, journeys);
    restoreEdition(params, state, editionManifest, mediaRegistry);
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
    var journeyId = ownValue(state, 'journey');
    if (typeof journeyId === 'string' && journeyId) {
      var stopId = ownValue(state, 'stop');
      var journeyMode = ownValue(state, 'journeyMode');
      params.set('journey', journeyId);
      params.set('stop', typeof stopId === 'string' ? stopId : '');
      params.set('journeyMode', journeyMode === 'playing' ? 'playing' : 'paused');
    }
    var editionWindow = ownValue(state, 'editionWindow');
    if (typeof editionWindow === 'string' && EDITION_WINDOW_ID.test(editionWindow)) {
      params.set('editionWindow', editionWindow);
      var editionMedia = ownValue(state, 'editionMedia');
      if (typeof editionMedia === 'string' && EDITION_MEDIA_ID.test(editionMedia)) {
        params.set('editionMedia', editionMedia);
      }
    }
    return params;
  }

  return {
    normalizeFocus: normalizeFocus,
    parse: parse,
    serialize: serialize
  };
}));
