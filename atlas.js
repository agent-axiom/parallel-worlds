(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsAtlas = api;
}(typeof self !== 'undefined' ? self : this, function () {
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
        civilizations: region.trackIds.filter(function (trackId) { return region.trackTypes[trackId] === 'civilization'; }).length,
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

  return {
    activePeriod: activePeriod,
    aggregateRegions: aggregateRegions,
    projectActiveCenters: projectActiveCenters,
    selectInsight: selectInsight
  };
}));
