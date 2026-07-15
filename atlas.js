(function (root, factory) {
  var chronology = typeof module === 'object' && module.exports ? require('./chronology.js') : root.ParallelWorldsChronology;
  var api = factory(chronology);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsAtlas = api;
}(typeof self !== 'undefined' ? self : this, function (chronology) {
  'use strict';

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
        if (centerIsActive(center, year)) items.push({ track: track, center: center, period: period });
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
      if (geometry) items.push(Object.assign({}, region, geometry));
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
    return {
      year: year,
      activeTracks: activeTracks,
      projectedCenters: projectedCenters,
      regions: regions,
      selectedRegion: selectedRegion,
      regionTracks: regionTracks,
      focusIds: focusIds,
      stats: {
        tracks: activeTracks.length,
        societies: societyCount,
        civilizations: societyCount,
        traditions: activeTracks.length - societyCount,
        regions: activeRegionIds.length
      },
      insight: selectInsight(options.insights || [], activeTracks, year, options.locale, focusIds)
    };
  }

  return {
    activePeriod: activePeriod,
    aggregateRegions: aggregateRegions,
    buildModel: buildModel,
    nextPlaybackYear: nextPlaybackYear,
    projectActiveCenters: projectActiveCenters,
    selectInsight: selectInsight
  };
}));
