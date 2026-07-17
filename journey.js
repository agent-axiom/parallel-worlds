(function (root, factory) {
  var quality = typeof module === 'object' && module.exports ? require('./data-quality.js') : root.ParallelWorldsDataQuality;
  var api = factory(quality);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsJourney = api;
}(typeof self !== 'undefined' ? self : this, function (quality) {
  'use strict';

  var LOCALES = ['ru', 'en', 'zh'];
  var SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  function issue(code, path, message) {
    return { code: code, path: path, message: message };
  }

  function isNonEmptyString(value) {
    return typeof value === 'string' && Boolean(value.trim());
  }

  function isHistoricalYear(value) {
    return Number.isFinite(value) && Math.floor(value) === value && value !== 0;
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function validateCopy(copy, fields, path, issues) {
    LOCALES.forEach(function (locale) {
      fields.forEach(function (field) {
        if (!copy || !copy[locale] || !isNonEmptyString(copy[locale][field])) {
          issues.push(issue('missing-localization', path + '.copy.' + locale + '.' + field,
            'Missing ' + locale + ' journey copy for ' + field));
        }
      });
    });
  }

  function trackIndex(data) {
    return (data.tracks || []).reduce(function (index, track) {
      if (track && isNonEmptyString(track.id) && !hasOwn(index, track.id)) index[track.id] = track;
      return index;
    }, Object.create(null));
  }

  function findRecord(track, recordType, recordId) {
    var records = recordType === 'period' ? track.periods : track.events;
    return (Array.isArray(records) ? records : []).filter(function (record) {
      return record && record.id === recordId;
    })[0] || null;
  }

  function exactSourceIds(record, sources) {
    return (Array.isArray(record.sourceIds) ? record.sourceIds : []).filter(function (id) {
      return quality && typeof quality.isExactSource === 'function' && quality.isExactSource(sources[id]);
    });
  }

  function validateTrack(trackId, path, tracks, issues) {
    var track = hasOwn(tracks, trackId) ? tracks[trackId] : null;
    if (!track) {
      issues.push(issue('unknown-track', path, 'Journey references an unknown track'));
      return null;
    }
    if (track.reviewStatus !== 'reviewed') {
      issues.push(issue('legacy-journey-track', path, 'Journey tracks must be reviewed'));
    }
    return track;
  }

  function resolveRef(ref, refPath, stop, tracks, sources, issues) {
    var hasPeriod = Boolean(ref) && Object.prototype.hasOwnProperty.call(ref, 'periodId');
    var hasEvent = Boolean(ref) && Object.prototype.hasOwnProperty.call(ref, 'eventId');
    if (!ref || !isNonEmptyString(ref.trackId) || hasPeriod === hasEvent ||
        hasPeriod && !isNonEmptyString(ref.periodId) || hasEvent && !isNonEmptyString(ref.eventId)) {
      issues.push(issue('invalid-record-ref', refPath, 'Record reference must name one track and exactly one period or event'));
      return null;
    }

    var track = validateTrack(ref.trackId, refPath + '.trackId', tracks, issues);
    if (!track) return null;

    var recordType = hasPeriod ? 'period' : 'event';
    var recordId = hasPeriod ? ref.periodId : ref.eventId;
    var record = findRecord(track, recordType, recordId);
    if (!record) {
      issues.push(issue('unknown-record', refPath + '.' + (hasPeriod ? 'periodId' : 'eventId'),
        'Journey references an unknown ' + recordType));
      return null;
    }

    var matchesYear = recordType === 'event'
      ? isHistoricalYear(stop.year) && Number.isFinite(record.year) && record.year === stop.year
      : isHistoricalYear(stop.year) && Number.isFinite(record.start) && Number.isFinite(record.end) &&
        stop.year >= record.start && stop.year <= record.end;
    if (!matchesYear) {
      issues.push(issue('journey-year-mismatch', refPath, 'Journey year does not match the referenced record'));
    }

    var exactIds = exactSourceIds(record, sources);
    if (!exactIds.length) {
      issues.push(issue('inexact-journey-source', refPath, 'Journey records require at least one exact academic source'));
    }

    return {
      ref: ref,
      track: track,
      record: record,
      recordType: recordType,
      exactSourceIds: exactIds
    };
  }

  function validateStop(stop, stopPath, duplicateStopIds, tracks, sources, issues) {
    stop = stop || {};
    if (!isNonEmptyString(stop.id) || !SLUG.test(stop.id)) {
      issues.push(issue('invalid-journey-id', stopPath + '.id', 'Journey and stop IDs must be stable slugs'));
    }
    if (isNonEmptyString(stop.id) && hasOwn(duplicateStopIds, stop.id) && duplicateStopIds[stop.id] > 1) {
      issues.push(issue('duplicate-stop-id', stopPath + '.id', 'Stop IDs must be unique within a route'));
    }
    if (!Number.isFinite(stop.holdMs) || stop.holdMs < 12000 || stop.holdMs > 18000) {
      issues.push(issue('invalid-hold', stopPath + '.holdMs', 'Stop hold must be between 12000 and 18000 milliseconds'));
    }
    validateCopy(stop.copy, ['headline', 'body'], stopPath, issues);

    var focusTrackIds = Array.isArray(stop.focusTrackIds) ? stop.focusTrackIds : [];
    var uniqueFocusIds = Object.create(null);
    var invalidFocus = !Array.isArray(stop.focusTrackIds) || focusTrackIds.length > 2;
    for (var focusIndex = 0; focusIndex < focusTrackIds.length; focusIndex += 1) {
      var trackId = focusTrackIds[focusIndex];
      if (!isNonEmptyString(trackId) || hasOwn(uniqueFocusIds, trackId)) invalidFocus = true;
      if (isNonEmptyString(trackId)) uniqueFocusIds[trackId] = true;
      if (isNonEmptyString(trackId)) {
        validateTrack(trackId, stopPath + '.focusTrackIds[' + focusIndex + ']', tracks, issues);
      }
    }
    if (invalidFocus) {
      issues.push(issue('invalid-focus', stopPath + '.focusTrackIds', 'Focus must contain zero to two unique track IDs'));
    }

    var refs = Array.isArray(stop.recordRefs) ? stop.recordRefs : [];
    if (!Array.isArray(stop.recordRefs) || !refs.length) {
      issues.push(issue('invalid-record-ref', stopPath + '.recordRefs', 'A journey stop needs at least one record reference'));
    }
    var records = [];
    for (var refIndex = 0; refIndex < refs.length; refIndex += 1) {
      var resolved = resolveRef(refs[refIndex], stopPath + '.recordRefs[' + refIndex + ']', stop, tracks, sources, issues);
      if (resolved) records.push(resolved);
    }

    return {
      id: stop.id,
      year: stop.year,
      holdMs: stop.holdMs,
      focusTrackIds: focusTrackIds.slice(),
      copy: stop.copy,
      records: records
    };
  }

  function validateCollection(collection, data) {
    collection = collection || {};
    data = data || {};
    if (!Array.isArray(data.tracks)) {
      return {
        routes: [],
        issues: [issue('invalid-dataset', 'data.tracks', 'Canonical data tracks must be an array')]
      };
    }
    if (!Array.isArray(collection.routes)) {
      return {
        routes: [],
        issues: [issue('invalid-journey-collection', 'routes', 'Journey collection routes must be an array')]
      };
    }
    var manifestRoutes = collection.routes;
    var tracks = trackIndex(data);
    var sources = data.sources || {};
    var routeIdCounts = manifestRoutes.reduce(function (counts, route) {
      if (route && isNonEmptyString(route.id)) {
        counts[route.id] = hasOwn(counts, route.id) ? counts[route.id] + 1 : 1;
      }
      return counts;
    }, Object.create(null));
    var routes = [];
    var issues = [];

    manifestRoutes.forEach(function (route, routeIndex) {
      route = route || {};
      var routePath = 'routes[' + routeIndex + ']';
      var routeIssues = [];
      if (!isNonEmptyString(route.id) || !SLUG.test(route.id)) {
        routeIssues.push(issue('invalid-journey-id', routePath + '.id', 'Journey and stop IDs must be stable slugs'));
      }
      if (isNonEmptyString(route.id) && hasOwn(routeIdCounts, route.id) && routeIdCounts[route.id] > 1) {
        routeIssues.push(issue('duplicate-journey-id', routePath + '.id', 'Journey IDs must be unique'));
      }
      validateCopy(route.copy, ['title', 'summary', 'conclusion'], routePath, routeIssues);

      var stops = Array.isArray(route.stops) ? route.stops : [];
      if (stops.length < 6 || stops.length > 8) {
        routeIssues.push(issue('invalid-stop-count', routePath + '.stops', 'Journey routes need six to eight stops'));
      }
      var stopIdCounts = stops.reduce(function (counts, stop) {
        if (stop && isNonEmptyString(stop.id)) {
          counts[stop.id] = hasOwn(counts, stop.id) ? counts[stop.id] + 1 : 1;
        }
        return counts;
      }, Object.create(null));
      var resolvedStops = [];
      for (var stopIndex = 0; stopIndex < stops.length; stopIndex += 1) {
        resolvedStops.push(validateStop(stops[stopIndex], routePath + '.stops[' + stopIndex + ']',
          stopIdCounts, tracks, sources, routeIssues));
      }

      issues = issues.concat(routeIssues);
      if (!routeIssues.length) {
        routes.push({
          id: route.id,
          durationSeconds: route.durationSeconds,
          copy: route.copy,
          stops: resolvedStops
        });
      }
    });

    issues.sort(function (left, right) {
      return left.code.localeCompare(right.code) || left.path.localeCompare(right.path) || left.message.localeCompare(right.message);
    });
    return { routes: routes, issues: issues };
  }

  function findRoute(collection, routeId) {
    var routes = collection && Array.isArray(collection.routes) ? collection.routes : [];
    return routes.filter(function (route) { return route && route.id === routeId; })[0] || null;
  }

  function localizedCopy(copy, locale, field) {
    var requested = copy && copy[locale];
    var fallback = copy && copy.ru;
    return requested && isNonEmptyString(requested[field]) ? requested[field] : fallback && fallback[field] || '';
  }

  function localizeRoute(route, locale) {
    if (!route) return null;
    return Object.assign({}, route, {
      title: localizedCopy(route.copy, locale, 'title'),
      summary: localizedCopy(route.copy, locale, 'summary'),
      conclusion: localizedCopy(route.copy, locale, 'conclusion'),
      stops: (Array.isArray(route.stops) ? route.stops : []).map(function (stop) {
        return Object.assign({}, stop, {
          headline: localizedCopy(stop.copy, locale, 'headline'),
          body: localizedCopy(stop.copy, locale, 'body')
        });
      })
    });
  }

  var PLAYER_STATUSES = {
    catalog: true,
    transitioning: true,
    playing: true,
    paused: true,
    exploring: true,
    complete: true
  };
  var PLAYER_EVENTS = {
    start: true,
    transitionEnd: true,
    pause: true,
    interact: true,
    resume: true,
    next: true,
    previous: true,
    finish: true,
    visibilityHidden: true,
    visibilityVisible: true
  };

  function safeCatalogState() {
    return Object.assign({}, {
      routeId: '',
      stopIndex: 0,
      status: 'catalog',
      deadline: 0,
      remainingMs: 0,
      pausedByVisibility: false
    });
  }

  function hasUsableRoute(route) {
    return Boolean(route) && typeof route === 'object' && isNonEmptyString(route.id) &&
      Array.isArray(route.stops) && route.stops.length > 0;
  }

  function boundedStopIndex(value, stopCount, fallback) {
    var candidate = Number.isFinite(value) && Math.floor(value) === value ? value : fallback;
    candidate = Number.isFinite(candidate) && Math.floor(candidate) === candidate ? candidate : 0;
    return Math.max(0, Math.min(stopCount - 1, candidate));
  }

  function stopHold(route, stopIndex) {
    var stop = hasUsableRoute(route) ? route.stops[stopIndex] : null;
    return stop && Number.isFinite(stop.holdMs) && stop.holdMs > 0 ? stop.holdMs : 0;
  }

  function isAllowedStatus(status) {
    return typeof status === 'string' && hasOwn(PLAYER_STATUSES, status);
  }

  function createState(route, options) {
    if (!hasUsableRoute(route)) return safeCatalogState();

    options = options && typeof options === 'object' ? options : {};
    var stopIndex = boundedStopIndex(options.stopIndex, route.stops.length, 0);
    var status = isAllowedStatus(options.status) ? options.status : 'paused';
    var deadline = Number.isFinite(options.deadline) && options.deadline > 0 ? options.deadline : 0;
    var remainingMs = Number.isFinite(options.remainingMs) && options.remainingMs >= 0
      ? options.remainingMs
      : 0;

    if (status === 'playing' && deadline === 0) status = 'paused';
    if ((status === 'paused' || status === 'transitioning') && remainingMs <= 0) {
      remainingMs = stopHold(route, stopIndex);
    }
    if (status !== 'playing') deadline = 0;
    if (status === 'catalog' || status === 'complete') remainingMs = 0;

    return Object.assign({}, {
      routeId: route.id,
      stopIndex: stopIndex,
      status: status,
      deadline: deadline,
      remainingMs: remainingMs,
      pausedByVisibility: (status === 'paused' || status === 'exploring') &&
        Boolean(options.pausedByVisibility)
    });
  }

  function normalizedStateOrOriginal(state, route) {
    var normalized = createState(route, state && typeof state === 'object' ? state : {});
    if (!state || typeof state !== 'object' || Object.keys(state).length !== 6) return normalized;
    var keys = ['routeId', 'stopIndex', 'status', 'deadline', 'remainingMs', 'pausedByVisibility'];
    var unchanged = keys.every(function (key) { return state[key] === normalized[key]; });
    return unchanged ? state : normalized;
  }

  function activeState(state) {
    return state.status === 'transitioning' || state.status === 'playing' ||
      state.status === 'paused' || state.status === 'exploring';
  }

  function transitionToStop(state, route, stopIndex) {
    return Object.assign({}, state, {
      stopIndex: stopIndex,
      status: 'transitioning',
      deadline: 0,
      remainingMs: stopHold(route, stopIndex),
      pausedByVisibility: false
    });
  }

  function completeState(state) {
    return Object.assign({}, state, {
      status: 'complete',
      deadline: 0,
      remainingMs: 0,
      pausedByVisibility: false
    });
  }

  function timeRemaining(state, now) {
    return Math.max(0, state.deadline - now);
  }

  function reduce(state, event, route, options) {
    if (!event || typeof event !== 'object' || typeof event.type !== 'string' ||
        !hasOwn(PLAYER_EVENTS, event.type)) {
      return state;
    }
    if (!hasUsableRoute(route)) return safeCatalogState();

    var current = normalizedStateOrOriginal(state, route);
    options = options && typeof options === 'object' ? options : {};
    var now = Number.isFinite(options.now) && options.now >= 0 ? options.now : 0;
    var reducedMotion = Boolean(options.reducedMotion);
    var hold;
    var remainingMs;
    var targetIndex;

    if (event.type === 'start') {
      targetIndex = hasOwn(event, 'stopIndex')
        ? boundedStopIndex(event.stopIndex, route.stops.length, current.stopIndex)
        : current.stopIndex;
      return transitionToStop(current, route, targetIndex);
    }

    if (event.type === 'transitionEnd') {
      if (current.status !== 'transitioning') return current;
      hold = stopHold(route, current.stopIndex);
      if (reducedMotion || hold === 0) {
        return Object.assign({}, current, {
          status: 'paused',
          deadline: 0,
          remainingMs: hold,
          pausedByVisibility: false
        });
      }
      return Object.assign({}, current, {
        status: 'playing',
        deadline: now + hold,
        remainingMs: 0,
        pausedByVisibility: false
      });
    }

    if (event.type === 'pause') {
      if (current.status !== 'playing') return current;
      return Object.assign({}, current, {
        status: 'paused',
        deadline: 0,
        remainingMs: timeRemaining(current, now),
        pausedByVisibility: false
      });
    }

    if (event.type === 'interact') {
      if (current.status === 'playing') {
        return Object.assign({}, current, {
          status: 'exploring',
          deadline: 0,
          remainingMs: timeRemaining(current, now),
          pausedByVisibility: false
        });
      }
      if (current.status === 'paused') {
        return Object.assign({}, current, { status: 'exploring', deadline: 0 });
      }
      return current;
    }

    if (event.type === 'resume') {
      if (current.status !== 'paused' && current.status !== 'exploring') return current;
      hold = stopHold(route, current.stopIndex);
      remainingMs = Number.isFinite(current.remainingMs) && current.remainingMs > 0
        ? current.remainingMs
        : hold;
      if (reducedMotion || hold === 0) {
        return Object.assign({}, current, {
          status: 'paused',
          deadline: 0,
          remainingMs: remainingMs,
          pausedByVisibility: false
        });
      }
      return Object.assign({}, current, {
        status: 'playing',
        deadline: now + remainingMs,
        remainingMs: 0,
        pausedByVisibility: false
      });
    }

    if (event.type === 'next') {
      if (!activeState(current)) return current;
      if (current.stopIndex >= route.stops.length - 1) return completeState(current);
      return transitionToStop(current, route, current.stopIndex + 1);
    }

    if (event.type === 'previous') {
      if (!activeState(current) || current.stopIndex === 0) return current;
      return transitionToStop(current, route, current.stopIndex - 1);
    }

    if (event.type === 'finish') {
      return activeState(current) ? completeState(current) : current;
    }

    if (event.type === 'visibilityHidden') {
      if (current.status !== 'playing') return current;
      return Object.assign({}, current, {
        status: 'paused',
        deadline: 0,
        remainingMs: timeRemaining(current, now),
        pausedByVisibility: true
      });
    }

    if ((current.status === 'paused' || current.status === 'exploring') && current.pausedByVisibility) {
      return Object.assign({}, current, { pausedByVisibility: false });
    }
    return current;
  }

  function safeClock(complete) {
    return {
      remainingMs: 0,
      countdownSeconds: null,
      shouldAdvance: false,
      stopProgress: complete ? 1 : 0
    };
  }

  function clock(state, now, route) {
    var complete = Boolean(state) && state.status === 'complete';
    if (complete) return safeClock(true);
    if (!state || typeof state !== 'object' || !isAllowedStatus(state.status) ||
        !Number.isFinite(now) || now < 0 || !hasUsableRoute(route) ||
        !Number.isFinite(state.stopIndex) || Math.floor(state.stopIndex) !== state.stopIndex ||
        state.stopIndex < 0 || state.stopIndex >= route.stops.length) {
      return safeClock(false);
    }

    var hold = stopHold(route, state.stopIndex);
    if (hold === 0 || state.status === 'playing' &&
        (!Number.isFinite(state.deadline) || state.deadline <= 0) ||
        state.status !== 'playing' && !Number.isFinite(state.remainingMs)) {
      return safeClock(false);
    }

    var remainingMs = state.status === 'playing'
      ? Math.max(0, state.deadline - now)
      : Math.max(0, state.remainingMs);
    return {
      remainingMs: remainingMs,
      countdownSeconds: remainingMs > 0 && remainingMs <= 5000
        ? Math.ceil(remainingMs / 1000)
        : null,
      shouldAdvance: state.status === 'playing' && remainingMs === 0,
      stopProgress: Math.max(0, Math.min(1, (hold - remainingMs) / hold))
    };
  }

  return {
    validateCollection: validateCollection,
    findRoute: findRoute,
    localizeRoute: localizeRoute,
    createState: createState,
    reduce: reduce,
    clock: clock
  };
}));
