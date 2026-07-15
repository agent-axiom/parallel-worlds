(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsAtlasView = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function template(value, values) {
    return String(value || '').replace(/\{(\w+)\}/g, function (_, key) {
      return values && values[key] !== undefined ? values[key] : '{' + key + '}';
    });
  }

  function worldSvg(label) {
    return '<svg class="atlas-world" viewBox="0 0 1000 520" role="img" aria-label="' + escapeHtml(label) + '" preserveAspectRatio="xMidYMid meet">' +
      '<g class="atlas-graticule" aria-hidden="true"><path d="M0 130H1000M0 260H1000M0 390H1000M250 0V520M500 0V520M750 0V520"/></g>' +
      '<g class="atlas-land" aria-hidden="true">' +
      '<path d="M72 114L128 76l88 13 64 47-13 52-50 19-16 55-55 13-31-42-54-28-24-56z"/>' +
      '<path d="M223 286l46 18 31 54-12 76-35 66-25-34 5-64-28-64z"/>' +
      '<path d="M431 101l68-31 103 18 53 30 65-10 96 34 49 56-26 43-77-5-46 30-69-23-57 16-45-31-53 11-61-37-42-47z"/>' +
      '<path d="M487 258l82-13 55 47-9 81-48 104-48-29-7-79-41-61z"/>' +
      '<path d="M790 373l61-25 75 25 8 47-61 28-76-20z"/>' +
      '<path d="M888 277l19-17 20 14-7 24-23 7z"/>' +
      '</g></svg>';
  }

  function renderRegions(regions, copy) {
    return (regions || []).map(function (region) {
      var name = copy.regionNames[region.id] || region.id;
      var label = template(copy.activeRegionLabel, { name: name, count: region.count });
      return '<button class="atlas-region" type="button" data-region="' + escapeHtml(region.id) + '" ' +
        'style="--atlas-x:' + Number(region.x) + '%;--atlas-y:' + Number(region.y) + '%;--atlas-radius:' + Number(region.radius) + '" ' +
        'aria-label="' + escapeHtml(label) + '"><span aria-hidden="true">' + Number(region.count) + '</span><small aria-hidden="true">' + escapeHtml(name) + '</small></button>';
    }).join('');
  }

  function statsHtml(stats, copy) {
    return '<div class="atlas-stats" aria-label="' + escapeHtml(copy.statsFallbackTitle) + '">' +
      '<span><strong>' + Number(stats.tracks || 0) + '</strong><small>' + escapeHtml(copy.statTracks || '') + '</small></span>' +
      '<span><strong>' + Number(stats.civilizations || 0) + '</strong><small>' + escapeHtml(copy.statCivilizations || '') + '</small></span>' +
      '<span><strong>' + Number(stats.traditions || 0) + '</strong><small>' + escapeHtml(copy.statTraditions || '') + '</small></span>' +
      '</div>';
  }

  function renderPanel(model, copy) {
    var stats = model.stats || {};
    if (model.insight) {
      return '<article class="atlas-insight"><p class="atlas-panel-kicker">' + escapeHtml(copy.insightKicker) + '</p>' +
        '<h3>' + escapeHtml(model.insight.title) + '</h3><p>' + escapeHtml(model.insight.summary) + '</p>' +
        statsHtml(stats, copy) +
        '<button class="atlas-panel-action" type="button" data-focus="' + escapeHtml(model.insight.trackIds.join(',')) + '">' + escapeHtml(copy.openComparison) + ' →</button></article>';
    }
    return '<article class="atlas-insight atlas-insight-fallback"><p class="atlas-panel-kicker">' + escapeHtml(copy.insightKicker) + '</p>' +
      '<h3>' + escapeHtml(copy.statsFallbackTitle) + '</h3><p>' + escapeHtml(template(copy.statsTemplate, { tracks: stats.tracks || 0, regions: stats.regions || 0 })) + '</p>' +
      statsHtml(stats, copy) + '</article>';
  }

  function renderRegionList(model, copy) {
    var tracks = model.regionTracks || [];
    if (!tracks.length) return '<p class="atlas-region-empty">' + escapeHtml(copy.noRegionTracks || '') + '</p>';
    return '<div class="atlas-region-list">' + tracks.map(function (item) {
      return '<button type="button" data-track="' + escapeHtml(item.track.id) + '"><strong>' + escapeHtml(item.track.name) + '</strong>' +
        '<span>' + escapeHtml(item.period ? item.period.name : '') + '</span></button>';
    }).join('') + '</div>';
  }

  return {
    escapeHtml: escapeHtml,
    renderPanel: renderPanel,
    renderRegionList: renderRegionList,
    renderRegions: renderRegions,
    worldSvg: worldSvg
  };
}));
