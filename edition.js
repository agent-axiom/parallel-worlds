(function (root, factory) {
  var chronology = typeof module === 'object' && module.exports
    ? require('./chronology.js')
    : root.ParallelWorldsChronology;
  var api = factory(chronology);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsEdition = api;
}(typeof self !== 'undefined' ? self : this, function (chronology) {
  'use strict';

  var SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var WINDOW_PATH = /^window-[0-9]{2}$/;
  var LOCALES = ['ru', 'en', 'zh'];
  var EXPECTED_ANCHORS = [-18000, -9500, -6500, -3500, -2500, -1200, -500, 200, 650, 1000, 1250, 1450];
  var EXPECTED_INTERLUDES = [
    'settlement', 'domestication', 'cities', 'writing',
    'belief', 'trade-networks', 'empires-law', 'knowledge-transfer'
  ];

  function own(value, key) {
    return !!value && Object.prototype.hasOwnProperty.call(value, key);
  }

  function ownValue(value, key) {
    if (!value || typeof value !== 'object') return undefined;
    var descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch (_) {
      return undefined;
    }
    return descriptor && own(descriptor, 'value') ? descriptor.value : undefined;
  }

  function ownArrayValues(value) {
    if (!Array.isArray(value)) return [];
    var result = [];
    for (var index = 0; index < value.length; index += 1) {
      if (own(value, index)) result.push(ownValue(value, index));
    }
    return result;
  }

  function validateManifest(manifest) {
    var issues = [];
    function add(code, path, message) {
      issues.push({ code: code, path: path, message: message });
    }

    if (!manifest || typeof manifest !== 'object') {
      add('invalid-manifest', '', 'Edition manifest must be an object');
      return { issues: issues, windows: [] };
    }

    if (ownValue(manifest, 'version') !== 1) {
      add('invalid-version', 'version', 'Edition manifest version must be 1');
    }
    if (ownValue(manifest, 'id') !== 'hardcover-ru-first-edition') {
      add('invalid-edition-id', 'id', 'Edition id must match the approved first edition');
    }

    var rawWindows = ownValue(manifest, 'windows');
    var windows = ownArrayValues(rawWindows);
    if (!Array.isArray(rawWindows)) {
      add('invalid-windows', 'windows', 'Edition windows must be an own array');
    }

    var ids = Object.create(null);
    var paths = Object.create(null);
    windows.forEach(function (window, index) {
      var base = 'windows[' + index + ']';
      if (!window || typeof window !== 'object') {
        add('invalid-window', base, 'Window must be an object');
        return;
      }
      var id = ownValue(window, 'id');
      var anchorYear = ownValue(window, 'anchorYear');
      var companionPath = ownValue(window, 'companionPath');
      var localizedCopy = ownValue(window, 'copy');
      var requirements = ownValue(window, 'requirements');

      if (typeof id !== 'string' || !SAFE_ID.test(id)) {
        add('invalid-id', base + '.id', 'Window id must be a safe slug');
      } else if (ids[id]) {
        add('duplicate-id', base + '.id', 'Window id must be unique');
      } else {
        ids[id] = true;
      }
      if (!chronology || !chronology.isValidHistoricalYear(anchorYear)) {
        add('invalid-anchor-year', base + '.anchorYear', 'Anchor must be a non-zero historical integer');
      }
      if (typeof companionPath !== 'string' || !WINDOW_PATH.test(companionPath)) {
        add('invalid-companion-path', base + '.companionPath', 'Companion path must match window-NN');
      } else if (paths[companionPath]) {
        add('duplicate-companion-path', base + '.companionPath', 'Companion path must be unique');
      } else {
        paths[companionPath] = true;
      }
      if (ownValue(window, 'chapterPages') !== 16) {
        add('invalid-chapter-pages', base + '.chapterPages', 'Every window must use 16 pages');
      }
      if (ownValue(requirements, 'reviewedTracks') !== 6 || ownValue(requirements, 'regions') !== 3) {
        add('invalid-window-requirements', base + '.requirements', 'Every window requires six reviewed tracks across three regions');
      }
      LOCALES.forEach(function (locale) {
        var localized = ownValue(localizedCopy, locale);
        var title = ownValue(localized, 'title');
        var question = ownValue(localized, 'question');
        if (typeof title !== 'string' || !title.trim() ||
            typeof question !== 'string' || !question.trim()) {
          add('missing-window-copy', base + '.copy.' + locale, 'Window title and question are required');
        }
      });
    });

    if (windows.length !== 12) {
      add('window-count', 'windows', 'Edition must contain exactly 12 windows');
    }
    var anchorsMatch = windows.length === EXPECTED_ANCHORS.length && windows.every(function (window, index) {
      return ownValue(window, 'anchorYear') === EXPECTED_ANCHORS[index] &&
        ownValue(window, 'id') === 'window-' + String(index + 1).padStart(2, '0') &&
        ownValue(window, 'companionPath') === 'window-' + String(index + 1).padStart(2, '0');
    });
    if (!anchorsMatch) {
      add('anchor-sequence', 'windows', 'Edition windows must preserve the approved order and anchors');
    }

    var pagePlan = ownValue(manifest, 'pagePlan') || {};
    var opening = ownValue(pagePlan, 'opening');
    var windowPages = ownValue(pagePlan, 'windows');
    var interludePages = ownValue(pagePlan, 'interludes');
    var apparatus = ownValue(pagePlan, 'apparatus');
    var computedPages = Number(opening) + Number(windowPages) + Number(interludePages) + Number(apparatus);
    if (opening !== 16 || windowPages !== 192 || interludePages !== 32 || apparatus !== 48 ||
        ownValue(pagePlan, 'total') !== 288 || computedPages !== 288 || windowPages !== windows.length * 16) {
      add('page-plan-mismatch', 'pagePlan', 'Page plan must resolve to the approved 288 pages');
    }

    var format = ownValue(manifest, 'format') || {};
    if (ownValue(format, 'widthMm') !== 300 || ownValue(format, 'heightMm') !== 240 ||
        ownValue(format, 'orientation') !== 'landscape' || ownValue(format, 'language') !== 'ru') {
      add('invalid-format', 'format', 'Edition format must remain 300 × 240 mm, landscape, Russian');
    }

    var rawInterludes = ownValue(manifest, 'interludes');
    var interludes = ownArrayValues(rawInterludes);
    var interludesMatch = interludes.length === EXPECTED_INTERLUDES.length && interludes.every(function (interlude, index) {
      return interlude && ownValue(interlude, 'id') === EXPECTED_INTERLUDES[index] &&
        ownValue(interlude, 'pages') === 4;
    });
    if (!interludesMatch) {
      add('interlude-count', 'interludes', 'Edition must contain the eight approved four-page interludes');
    }

    var printRun = ownValue(manifest, 'printRun') || {};
    var minimum = ownValue(printRun, 'minimum');
    var quoteQuantities = ownValue(printRun, 'quoteQuantities');
    if (!Number.isInteger(minimum) || minimum < 500 || !Array.isArray(quoteQuantities) ||
        quoteQuantities.length !== 3 || ownValue(quoteQuantities, 0) !== 500 ||
        ownValue(quoteQuantities, 1) !== 750 || ownValue(quoteQuantities, 2) !== 1000) {
      add('invalid-print-run', 'printRun', 'Print quotations must cover 500, 750, and 1000 copies');
    }

    return { issues: issues, windows: issues.length ? [] : windows.slice() };
  }

  function activeAt(record, year) {
    if (!record || !chronology || !chronology.isValidHistoricalYear(year)) return false;
    var start = ownValue(record, 'start');
    var end = ownValue(record, 'end');
    if (!chronology.isValidHistoricalYear(start) || !chronology.isValidHistoricalYear(end)) return false;
    var target = chronology.toOrdinal(year);
    return chronology.toOrdinal(start) <= target && target <= chronology.toOrdinal(end);
  }

  function exactRecord(record, sources) {
    var sourceIds = ownArrayValues(ownValue(record, 'sourceIds'));
    var dating = ownValue(record, 'dating');
    var basis = ownValue(dating, 'basis');
    var precision = ownValue(dating, 'precision');
    var original = ownValue(dating, 'original');
    if (!sourceIds.length || typeof basis !== 'string' || !basis.trim() ||
        typeof precision !== 'string' || !precision.trim() ||
        typeof original !== 'string' || !original.trim()) return false;
    return sourceIds.every(function (sourceId) {
      var source = ownValue(sources, sourceId);
      var url = ownValue(source, 'url');
      var title = ownValue(source, 'title');
      var tier = ownValue(source, 'tier');
      return source && typeof url === 'string' && /^https:\/\//.test(url) &&
        typeof title === 'string' && title.trim() && (tier === 'A' || tier === 'B');
    });
  }

  function uniqueSorted(values) {
    return values.filter(function (value, index) {
      return typeof value === 'string' && value && values.indexOf(value) === index;
    }).sort();
  }

  function buildReadiness(manifest, dataset) {
    var windows = ownArrayValues(ownValue(manifest, 'windows'));
    var tracks = ownArrayValues(ownValue(dataset, 'tracks'));
    var sources = ownValue(dataset, 'sources') || {};
    return {
      windows: windows.map(function (window) {
        var anchorYear = ownValue(window, 'anchorYear');
        var activeTracks = tracks.filter(function (track) {
          return ownArrayValues(ownValue(track, 'periods')).some(function (period) {
            return activeAt(period, anchorYear);
          });
        });
        var reviewedTracks = activeTracks.filter(function (track) {
          if (ownValue(track, 'reviewStatus') !== 'reviewed') return false;
          return ownArrayValues(ownValue(track, 'periods')).some(function (period) {
            return activeAt(period, anchorYear) && exactRecord(period, sources);
          });
        });
        var unqualifiedReviewedTracks = activeTracks.filter(function (track) {
          return ownValue(track, 'reviewStatus') === 'reviewed' && reviewedTracks.indexOf(track) === -1;
        });
        var requirements = ownValue(window, 'requirements') || {};
        var neededTracks = ownValue(requirements, 'reviewedTracks');
        var neededRegions = ownValue(requirements, 'regions');
        if (!Number.isInteger(neededTracks) || neededTracks < 1) neededTracks = 6;
        if (!Number.isInteger(neededRegions) || neededRegions < 1) neededRegions = 3;
        var reviewedTrackIds = uniqueSorted(reviewedTracks.map(function (track) { return ownValue(track, 'id'); }));
        var legacyTrackIds = uniqueSorted(activeTracks.filter(function (track) {
          return ownValue(track, 'reviewStatus') !== 'reviewed';
        }).map(function (track) { return ownValue(track, 'id'); }));
        var regions = uniqueSorted(reviewedTracks.map(function (track) { return ownValue(track, 'region'); }));
        var gaps = [];
        if (reviewedTrackIds.length < neededTracks) {
          gaps.push('reviewed-tracks:' + reviewedTrackIds.length + '/' + neededTracks);
        }
        if (regions.length < neededRegions) {
          gaps.push('regions:' + regions.length + '/' + neededRegions);
        }
        return {
          id: ownValue(window, 'id'),
          anchorYear: anchorYear,
          status: gaps.length ? 'needs-review' : 'ready',
          reviewedTrackIds: reviewedTrackIds,
          unqualifiedReviewedTrackIds: uniqueSorted(unqualifiedReviewedTracks.map(function (track) {
            return ownValue(track, 'id');
          })),
          legacyTrackIds: legacyTrackIds,
          regions: regions,
          gaps: gaps
        };
      })
    };
  }

  return {
    buildReadiness: buildReadiness,
    validateManifest: validateManifest
  };
}));
