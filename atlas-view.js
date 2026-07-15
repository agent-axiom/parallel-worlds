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

  function safePath(value) {
    value = String(value || '');
    return /^[MLZ0-9.\-\s]+$/i.test(value) ? value : '';
  }

  function comparisonPath(connector, copy) {
    if (!connector || !connector.from || !connector.to) return '';
    var x1 = Number(connector.from.x) * 10;
    var y1 = Number(connector.from.y) * 5.2;
    var x2 = Number(connector.to.x) * 10;
    var y2 = Number(connector.to.y) * 5.2;
    if (![x1, y1, x2, y2].every(Number.isFinite)) return '';
    var controlX = (x1 + x2) / 2;
    var controlY = Math.max(20, (y1 + y2) / 2 - 36);
    var label = template(copy && copy.comparisonConnectorLabel, { title: connector.title || '' });
    return '<g class="atlas-comparison" role="img" aria-label="' + escapeHtml(label) + '">' +
      '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'Q' + controlX.toFixed(1) + ' ' + controlY.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '"/></g>';
  }

  function worldSvg(mapData, label, connector, copy) {
    mapData = mapData || {};
    var viewBox = Array.isArray(mapData.viewBox) && mapData.viewBox.length === 4 ? mapData.viewBox.join(' ') : '0 0 1000 520';
    var land = safePath(mapData.landPath);
    var graticule = safePath(mapData.graticulePath) || 'M0 130L1000 130M0 260L1000 260M0 390L1000 390M250 0L250 520M500 0L500 520M750 0L750 520';
    var coast = land ? '<path class="atlas-coast atlas-coast-glow" d="' + land + '"/><path class="atlas-coast atlas-coast-line" d="' + land + '"/>' : '';
    return '<svg class="atlas-world" viewBox="' + escapeHtml(viewBox) + '" role="img" aria-label="' + escapeHtml(label) + '" preserveAspectRatio="xMidYMid meet">' +
      '<defs><linearGradient id="atlas-link-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0"/><stop offset=".5"/><stop offset="1"/></linearGradient></defs>' +
      '<rect class="atlas-ocean" width="1000" height="520" rx="30"/>' +
      '<path class="atlas-graticule" aria-hidden="true" d="' + graticule + '"/>' +
      (land ? '<path class="atlas-land" aria-hidden="true" d="' + land + '"/>' : '') + coast +
      comparisonPath(connector, copy || {}) + '</svg>';
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
      '<span><strong>' + Number(stats.societies || 0) + '</strong><small>' + escapeHtml(copy.statSocieties || '') + '</small></span>' +
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
    safePath: safePath,
    worldSvg: worldSvg
  };
}));
