(function (root, factory) {
  var quality = typeof module === 'object' && module.exports ? require('./data-quality.js') : root.ParallelWorldsDataQuality;
  var journey = typeof module === 'object' && module.exports ? require('./journey.js') : root.ParallelWorldsJourney;
  var api = factory(quality, journey);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsAcademicAudit = api;
}(typeof self !== 'undefined' ? self : this, function (quality, journey) {
  'use strict';

  var SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };

  function recordCoverage(records, sourceRegistry) {
    records = Array.isArray(records) ? records : [];
    return {
      total: records.length,
      sourced: records.filter(function (record) {
        return Array.isArray(record.sourceIds) && record.sourceIds.some(function (id) {
          return sourceIsExact(sourceRegistry && sourceRegistry[id]);
        });
      }).length,
      dated: records.filter(function (record) {
        return Boolean(record.dating && record.dating.precision && record.dating.basis);
      }).length
    };
  }

  function addCoverage(target, addition) {
    target.total += addition.total;
    target.sourced += addition.sourced;
    target.dated += addition.dated;
  }

  function sourceIsExact(source) {
    return quality.isExactSource(source);
  }

  function issue(severity, code, path, message, extra) {
    return Object.assign({ severity: severity, code: code, path: path, message: message }, extra || {});
  }

  function stableIssues(issues) {
    var seen = {};
    return issues.filter(function (item) {
      var key = [item.severity, item.code, item.path, item.message].join('|');
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).sort(function (left, right) {
      return SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity] ||
        left.code.localeCompare(right.code) || left.path.localeCompare(right.path);
    });
  }

  function trackIdForPath(path, tracks) {
    return tracks.map(function (track) { return track.id; }).filter(Boolean).sort(function (left, right) {
      return right.length - left.length;
    }).find(function (id) {
      return path === id || path.indexOf(id + '.') === 0 || path.indexOf(id + '[') === 0;
    });
  }

  function journeyIdForPath(path, journeys) {
    var match = /^routes\[(\d+)\](?:\.|$)/.exec(path);
    if (!match || !journeys || !Array.isArray(journeys.routes)) return undefined;
    var route = journeys.routes[Number(match[1])];
    return route && typeof route.id === 'string' && route.id ? route.id : undefined;
  }

  function buildSourceUsage(tracks) {
    var usage = {};
    tracks.forEach(function (track) {
      var ids = [];
      (track.sources || []).forEach(function (id) { ids.push(id); });
      (track.periods || []).concat(track.events || []).forEach(function (record) {
        (record.sourceIds || []).forEach(function (id) { ids.push(id); });
      });
      ids.filter(function (id, index) { return ids.indexOf(id) === index; }).forEach(function (id) {
        if (!usage[id]) usage[id] = { reviewed: [], legacy: [] };
        var bucket = track.reviewStatus === 'reviewed' ? usage[id].reviewed : usage[id].legacy;
        if (bucket.indexOf(track.id) === -1) bucket.push(track.id);
      });
    });
    return usage;
  }

  function buildAudit(data, journeys) {
    data = data || {};
    journeys = journeys || { version: 1, routes: [] };
    var tracks = (data.tracks || []).slice().sort(function (left, right) { return left.id.localeCompare(right.id); });
    var sourceRegistry = data.sources || {};
    var issues = [];
    var coverage = {
      periods: { total: 0, sourced: 0, dated: 0 },
      events: { total: 0, sourced: 0, dated: 0 }
    };

    var trackReports = tracks.map(function (track) {
      var periods = recordCoverage(track.periods, sourceRegistry);
      var events = recordCoverage(track.events, sourceRegistry);
      addCoverage(coverage.periods, periods);
      addCoverage(coverage.events, events);
      if (track.reviewStatus === 'legacy') {
        issues.push(issue('warning', 'legacy-track', track.id, 'Legacy track has not yet received record-level academic review', { trackId: track.id }));
      }
      return {
        id: track.id,
        reviewStatus: track.reviewStatus,
        type: track.type,
        periods: periods,
        events: events
      };
    });

    quality.validateDataset(data).forEach(function (validationIssue) {
      issues.push(issue('error', validationIssue.code, validationIssue.path, validationIssue.message, {
        trackId: trackIdForPath(validationIssue.path, tracks)
      }));
    });

    var usage = buildSourceUsage(tracks);
    var sourceReports = Object.keys(sourceRegistry).sort().map(function (id) {
      var source = sourceRegistry[id];
      var exact = sourceIsExact(source);
      if (!exact) {
        issues.push(issue('warning', 'generic-source', 'sources.' + id, 'Inherited source is not an exact academic record', { sourceId: id }));
      }
      return {
        id: id,
        title: source && source.title || '',
        url: source && source.url || '',
        exact: exact,
        usedByReviewed: usage[id] ? usage[id].reviewed.slice().sort() : [],
        usedByLegacy: usage[id] ? usage[id].legacy.slice().sort() : []
      };
    });

    var journeyValidation = journey.validateCollection(journeys, data);
    journeyValidation.issues.forEach(function (validationIssue) {
      var journeyId = journeyIdForPath(validationIssue.path, journeys);
      var extra = journeyId === undefined ? null : { journeyId: journeyId };
      issues.push(issue('error', validationIssue.code, 'journeys.' + validationIssue.path,
        validationIssue.message, extra));
    });
    var journeyReports = journeyValidation.routes.map(function (route) {
      return {
        id: route.id,
        stops: route.stops.length,
        reviewedStops: route.stops.filter(function (stop) {
          return stop.records.every(function (record) {
            return record.track.reviewStatus === 'reviewed';
          });
        }).length
      };
    }).sort(function (left, right) {
      return left.id.localeCompare(right.id);
    });
    var journeyCoverage = journeyReports.reduce(function (coverage, route) {
      coverage.routes += 1;
      coverage.stops += route.stops;
      coverage.reviewedStops += route.reviewedStops;
      return coverage;
    }, { routes: 0, stops: 0, reviewedStops: 0 });

    issues = stableIssues(issues);
    return {
      generatedFrom: 'parallel-worlds-data-v1',
      summary: {
        tracks: tracks.length,
        reviewedTracks: tracks.filter(function (track) { return track.reviewStatus === 'reviewed'; }).length,
        legacyTracks: tracks.filter(function (track) { return track.reviewStatus === 'legacy'; }).length,
        blockingIssues: issues.filter(function (item) { return item.severity === 'error'; }).length,
        warnings: issues.filter(function (item) { return item.severity === 'warning'; }).length
      },
      coverage: coverage,
      journeyCoverage: journeyCoverage,
      journeys: journeyReports,
      tracks: trackReports,
      sources: sourceReports,
      issues: issues
    };
  }

  return {
    buildAudit: buildAudit
  };
}));
