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

  return {
    activePeriod: activePeriod,
    aggregateRegions: aggregateRegions,
    projectActiveCenters: projectActiveCenters
  };
}));
