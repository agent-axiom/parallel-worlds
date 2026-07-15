(function (root, factory) {
  var chronology = typeof module === 'object' && module.exports ? require('./chronology.js') : root.ParallelWorldsChronology;
  var api = factory(chronology);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsAtlas = api;
}(typeof self !== 'undefined' ? self : this, function (chronology) {
  'use strict';

  var MAP_PADDING = 4;
  var EQUAL_EARTH_MAX_X = 2.70663;
  var EQUAL_EARTH_MAX_Y = 1.31737;

  function projectGeoPoint(longitude, latitude) {
    longitude = Number(longitude);
    latitude = Number(latitude);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;
    var A1 = 1.340264;
    var A2 = -0.081106;
    var A3 = 0.000893;
    var A4 = 0.003796;
    var M = Math.sqrt(3) / 2;
    var lambda = longitude * Math.PI / 180;
    var phi = latitude * Math.PI / 180;
    var theta = Math.asin(M * Math.sin(phi));
    var theta2 = theta * theta;
    var theta6 = theta2 * theta2 * theta2;
    var rawX = lambda * Math.cos(theta) / (M * (A1 + 3 * A2 * theta2 + theta6 * (7 * A3 + 9 * A4 * theta2)));
    var rawY = theta * (A1 + A2 * theta2 + theta6 * (A3 + A4 * theta2));
    var span = 100 - MAP_PADDING * 2;
    return {
      x: Number((MAP_PADDING + ((rawX + EQUAL_EARTH_MAX_X) / (2 * EQUAL_EARTH_MAX_X)) * span).toFixed(4)),
      y: Number((MAP_PADDING + ((EQUAL_EARTH_MAX_Y - rawY) / (2 * EQUAL_EARTH_MAX_Y)) * span).toFixed(4))
    };
  }

  function activePeriod(track, year) {
    return (track.periods || []).find(function (period) {
      return year >= period.start && year <= period.end;
    }) || null;
  }

  function centerIsActive(center, year) {
    var startsInTime = center.start === undefined || year >= center.start;
    var endsInTime = center.end === undefined || year <= center.end;
    return startsInTime && endsInTime;
  }

  function projectActiveCenters(tracks, year, geography) {
    var centersByTrack = geography && geography.tracks ? geography.tracks : {};
    return (tracks || []).reduce(function (items, track) {
      var period = activePeriod(track, year);
      if (!period) return items;
      (centersByTrack[track.id] || []).forEach(function (center) {
        var projected = projectGeoPoint(center.longitude, center.latitude);
        if (centerIsActive(center, year) && projected) {
          items.push({ track: track, center: Object.assign({}, center, projected), period: period });
        }
      });
      return items;
    }, []);
  }

  function aggregateRegions(projectedCenters) {
    var regions = {};
    (projectedCenters || []).forEach(function (item) {
      var regionId = item.track.region;
      if (!regions[regionId]) {
        regions[regionId] = { id: regionId, trackIds: [], trackTypes: {} };
      }
      var region = regions[regionId];
      if (region.trackIds.indexOf(item.track.id) === -1) {
        region.trackIds.push(item.track.id);
        region.trackTypes[item.track.id] = item.track.type;
      }
    });
    return Object.keys(regions).sort().map(function (id) {
      var region = regions[id];
      return {
        id: id,
        count: region.trackIds.length,
        societies: region.trackIds.filter(function (trackId) { return region.trackTypes[trackId] !== 'tradition'; }).length,
        civilizations: region.trackIds.filter(function (trackId) { return region.trackTypes[trackId] !== 'tradition'; }).length,
        traditions: region.trackIds.filter(function (trackId) { return region.trackTypes[trackId] === 'tradition'; }).length,
        trackIds: region.trackIds
      };
    });
  }

  function insightLocale(locale) {
    var value = String(locale || '').toLowerCase();
    if (value.indexOf('ru') === 0) return 'ru';
    if (value === 'zh' || value.indexOf('zh-') === 0) return 'zh';
    return 'en';
  }

  function selectInsight(insights, activeTracks, year, locale, focusIds) {
    var activeIds = (activeTracks || []).map(function (track) { return track.id; });
    var focus = focusIds || [];
    var eligible = (insights || []).filter(function (item) {
      return year >= item.start && year <= item.end && item.trackIds.every(function (id) {
        return activeIds.indexOf(id) !== -1;
      });
    }).map(function (item) {
      return {
        item: item,
        focusScore: item.trackIds.filter(function (id) { return focus.indexOf(id) !== -1; }).length
      };
    }).sort(function (a, b) {
      return b.focusScore - a.focusScore || a.item.id.localeCompare(b.item.id);
    });
    if (!eligible.length) return null;
    var selected = eligible[0].item;
    var copy = selected.copy[insightLocale(locale)] || selected.copy.en;
    return Object.assign({}, selected, copy);
  }

  function buildComparisonConnector(insight, projectedCenters, focusIds) {
    if (!insight || !Array.isArray(insight.trackIds) || insight.trackIds.length !== 2) return null;
    var focus = focusIds || [];
    if (!insight.trackIds.every(function (id) { return focus.indexOf(id) !== -1; })) return null;
    var centers = insight.trackIds.map(function (trackId) {
      var item = (projectedCenters || []).find(function (candidate) { return candidate.track.id === trackId; });
      return item && item.center;
    });
    if (!centers[0] || !centers[1] || !centers.every(function (center) {
      return Number.isFinite(center.x) && Number.isFinite(center.y);
    })) return null;
    return {
      id: insight.id,
      from: { x: centers[0].x, y: centers[0].y },
      to: { x: centers[1].x, y: centers[1].y },
      title: insight.title || ''
    };
  }

  function nextPlaybackYear(year, start, end, step) {
    var next = chronology.addHistoricalYears(Number(year), Math.max(1, Number(step) || 1));
    return next > end ? start : next;
  }

  function matchesFilters(track, filters) {
    filters = filters || {};
    if (filters.region && filters.region !== 'all' && track.region !== filters.region) return false;
    if (filters.type === 'society' && track.type === 'tradition') return false;
    if (filters.type === 'legacy' && track.type !== 'civilization') return false;
    if (filters.type && filters.type !== 'all' && filters.type !== 'society' && filters.type !== 'legacy' && track.type !== filters.type) return false;
    var query = String(filters.query || '').trim().toLocaleLowerCase();
    if (!query) return true;
    var searchable = [track.name, track.summary]
      .concat((track.periods || []).reduce(function (values, period) { return values.concat(period.name, period.note || ''); }, []))
      .concat((track.events || []).reduce(function (values, event) { return values.concat(event.title, event.note || ''); }, []))
      .join(' ').toLocaleLowerCase();
    return searchable.indexOf(query) !== -1;
  }

  function buildModel(options) {
    options = options || {};
    var year = Number(options.year);
    var filteredTracks = (options.tracks || []).filter(function (track) {
      return matchesFilters(track, options.filters);
    });
    var activeTracks = filteredTracks.filter(function (track) { return Boolean(activePeriod(track, year)); });
    var projectedCenters = projectActiveCenters(activeTracks, year, options.geography || {});
    var regionGeometry = options.geography && options.geography.regions ? options.geography.regions : {};
    var regions = aggregateRegions(projectedCenters).reduce(function (items, region) {
      var geometry = regionGeometry[region.id];
      var projected = geometry && projectGeoPoint(geometry.longitude, geometry.latitude);
      if (geometry && projected) items.push(Object.assign({}, region, geometry, projected));
      return items;
    }, []);
    var selectedRegion = options.selectedRegion || '';
    var regionTracks = activeTracks.filter(function (track) {
      return selectedRegion && track.region === selectedRegion;
    }).map(function (track) {
      return { track: track, period: activePeriod(track, year) };
    });
    var societyCount = activeTracks.filter(function (track) { return track.type !== 'tradition'; }).length;
    var activeRegionIds = activeTracks.reduce(function (ids, track) {
      if (ids.indexOf(track.region) === -1) ids.push(track.region);
      return ids;
    }, []);
    var focusIds = (options.focusIds || []).slice(0, 2);
    var insight = selectInsight(options.insights || [], activeTracks, year, options.locale, focusIds);
    return {
      year: year,
      activeTracks: activeTracks,
      projectedCenters: projectedCenters,
      regions: regions,
      selectedRegion: selectedRegion,
      regionTracks: regionTracks,
      focusIds: focusIds,
      comparisonConnector: buildComparisonConnector(insight, projectedCenters, focusIds),
      stats: {
        tracks: activeTracks.length,
        societies: societyCount,
        civilizations: societyCount,
        traditions: activeTracks.length - societyCount,
        regions: activeRegionIds.length
      },
      insight: insight
    };
  }

  return {
    activePeriod: activePeriod,
    aggregateRegions: aggregateRegions,
    buildComparisonConnector: buildComparisonConnector,
    buildModel: buildModel,
    nextPlaybackYear: nextPlaybackYear,
    projectGeoPoint: projectGeoPoint,
    projectActiveCenters: projectActiveCenters,
    selectInsight: selectInsight
  };
}));
