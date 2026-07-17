(function () {
  'use strict';

  var rawData = window.PARALLEL_WORLDS_DATA;
  var chronology = window.ParallelWorldsChronology;
  var timeline = window.ParallelTimeline;
  var i18n = window.ParallelWorldsI18n;
  var atlasData = window.PARALLEL_WORLDS_ATLAS_DATA;
  var worldMapData = window.PARALLEL_WORLDS_MAP_DATA;
  var insights = window.PARALLEL_WORLDS_INSIGHTS;
  var atlas = window.ParallelWorldsAtlas;
  var explorerState = window.ParallelWorldsExplorerState;
  var atlasView = window.ParallelWorldsAtlasView;
  var journeysData = window.PARALLEL_WORLDS_JOURNEYS;
  var journey = window.ParallelWorldsJourney;
  var journeyView = window.ParallelWorldsJourneyView;
  var validatedJourneys = journey.validateCollection(journeysData, rawData);
  var activeData = rawData;
  var regionNames = {};
  var regionColors = {
    mesopotamia: '#a7512d', 'west-asia': '#8d5b35', africa: '#b37a27', mediterranean: '#436b7b',
    'south-asia': '#9b3f62', 'east-asia': '#a63e36', 'central-asia': '#667348',
    'southeast-asia': '#258074', oceania: '#397e9c', americas: '#75609b'
  };

  function isSupportedLocale(value) {
    return i18n.locales.some(function (locale) { return locale.id === value; });
  }

  function initialLocale() {
    var requested = new URLSearchParams(window.location.search).get('lang');
    if (isSupportedLocale(requested)) return requested;
    var saved = localStorage.getItem('parallel-worlds-language');
    if (isSupportedLocale(saved)) return saved;
    return i18n.normalizeLocale(navigator.language || 'en');
  }

  var defaults = {
    query: '', region: 'all', type: 'all', start: rawData.range.start, end: rawData.range.end,
    year: -500, zoom: 100, lang: initialLocale(), view: 'map', focus: [], selectedRegion: '', scaleMode: 'overview', playing: false, filtersOpen: false,
    journey: '', stop: '', journeyMode: 'paused', journeyNotice: '',
    theme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  };
  var state = Object.assign({}, defaults);
  var elements = {};
  var toastTimer;
  var playbackTimer;
  var journeyTimer;
  var journeyTransitionTimer;
  var journeyTransitionStage = null;
  var journeyTransitionHandler = null;
  var journeyState = null;
  var journeyRoute = null;
  var journeyAutoplay = false;
  var preJourneyState = null;
  var journeyTrigger = null;
  var journeyTouchStart = null;
  var journeyCatalogNotice = '';
  var suppressJourneyFocusPause = false;
  var journeyProgrammaticFocus = false;
  var journeyFocusIdentity = '';
  var journeyAnnouncementGeneration = 0;
  var detailTrigger = null;
  var journeyRecovering = false;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  function get(id) { return document.getElementById(id); }
  function t(key, values) { return i18n.text(state.lang, key, values); }
  function formatYear(year) { return timeline.formatYear(year, state.lang); }
  function currentScale() {
    return chronology.createScale(state.start, state.end, state.scaleMode, rawData.scale.breakpoint, rawData.scale.deepWeight);
  }

  function yearFromSlider(value) {
    return chronology.unprojectYear(Number(value) / 10, currentScale());
  }

  function readUrlState() {
    var params = new URLSearchParams(window.location.search);
    state = explorerState.parse(params, defaults, rawData, journeysData);
    var savedTheme = localStorage.getItem('parallel-worlds-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') state.theme = savedTheme;
  }

  function writeUrlState() {
    var params = explorerState.serialize(state, defaults);
    history.replaceState(null, '', window.location.pathname + '?' + params.toString() + window.location.hash);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char];
    });
  }

  function collectElements() {
    ['search-input', 'region-select', 'type-select', 'zoom-input', 'zoom-output', 'preset-buttons',
      'export-button', 'range-start', 'range-end', 'year-input', 'year-output', 'contemporary-summary',
      'timeline', 'empty-state', 'reset-button', 'contemporary-list', 'detail-dialog', 'dialog-title',
      'dialog-meta', 'dialog-summary', 'dialog-periods', 'dialog-events', 'dialog-sources', 'dialog-close',
      'period-tooltip',
      'source-links', 'theme-button', 'language-select', 'share-button', 'toast', 'track-count', 'period-count', 'event-count',
      'filter-toggle', 'filters-content', 'scale-mode',
      'view-map-button', 'view-chronology-button', 'atlas-view', 'chronology-view', 'atlas-map', 'atlas-world',
      'atlas-regions', 'atlas-panel', 'atlas-region-list', 'atlas-play-button', 'atlas-year-input', 'atlas-year-output', 'atlas-map-summary',
      'journey-open', 'journey-dialog', 'journey-exit', 'journey-content', 'journey-announcement']
      .forEach(function (id) { elements[id] = get(id); });
  }

  function initializeSources() {
    Object.keys(rawData.sources).forEach(function (id) {
      var source = rawData.sources[id];
      var link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = source.title + ' ↗';
      elements['source-links'].appendChild(link);
    });
  }

  function applyStaticCopy() {
    var locale = i18n.locales.find(function (item) { return item.id === state.lang; });
    document.documentElement.lang = locale ? locale.htmlLang : state.lang;
    document.title = t('pageTitle');
    document.querySelector('meta[name="description"]').setAttribute('content', t('metaDescription'));
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (element) {
      element.textContent = t(element.dataset.i18n);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-placeholder]'), function (element) {
      element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-title]'), function (element) {
      element.setAttribute('title', t(element.dataset.i18nTitle));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-aria]'), function (element) {
      element.setAttribute('aria-label', t(element.dataset.i18nAria));
    });
  }

  function renderLocaleControls() {
    regionNames = {};
    elements['region-select'].innerHTML = '';
    activeData.regions.forEach(function (region) {
      regionNames[region.id] = region.name;
      var option = document.createElement('option');
      option.value = region.id;
      option.textContent = region.name;
      elements['region-select'].appendChild(option);
    });
    elements['preset-buttons'].innerHTML = '';
    activeData.presets.forEach(function (preset) {
      var button = document.createElement('button');
      button.className = 'preset-button';
      button.type = 'button';
      button.dataset.preset = preset.id;
      button.textContent = preset.name;
      elements['preset-buttons'].appendChild(button);
    });
  }

  function syncControls() {
    var scale = currentScale();
    elements['search-input'].value = state.query;
    elements['region-select'].value = state.region;
    elements['type-select'].value = state.type;
    elements['zoom-input'].value = state.zoom;
    elements['zoom-output'].value = state.zoom + '%';
    elements['range-start'].value = state.start;
    elements['range-end'].value = state.end;
    elements['year-input'].min = 0;
    elements['year-input'].max = 1000;
    elements['year-input'].step = 1;
    elements['year-input'].value = Math.round(chronology.projectYear(state.year, scale) * 10);
    elements['year-output'].textContent = formatYear(state.year);
    elements['atlas-year-input'].min = 0;
    elements['atlas-year-input'].max = 1000;
    elements['atlas-year-input'].step = 1;
    elements['atlas-year-input'].value = Math.round(chronology.projectYear(state.year, scale) * 10);
    elements['atlas-year-output'].textContent = formatYear(state.year);
    elements['language-select'].value = state.lang;
    elements['filters-content'].classList.toggle('open', state.filtersOpen);
    elements['filter-toggle'].setAttribute('aria-expanded', String(state.filtersOpen));
    elements['filter-toggle'].firstElementChild.textContent = t(state.filtersOpen ? 'hideFilters' : 'showFilters');
    Array.prototype.forEach.call(elements['scale-mode'].querySelectorAll('[data-scale]'), function (button) {
      var selected = button.dataset.scale === state.scaleMode;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    elements['atlas-view'].hidden = state.view !== 'map';
    elements['chronology-view'].hidden = state.view !== 'chronology';
    [['view-map-button', 'map'], ['view-chronology-button', 'chronology']].forEach(function (entry) {
      var selected = state.view === entry[1];
      elements[entry[0]].classList.toggle('active', selected);
      elements[entry[0]].setAttribute('aria-selected', String(selected));
      elements[entry[0]].tabIndex = selected ? 0 : -1;
    });
    var playbackLabel = t(state.playing ? 'pauseTime' : 'playTime');
    elements['atlas-play-button'].setAttribute('aria-label', playbackLabel);
    elements['atlas-play-button'].setAttribute('aria-pressed', String(state.playing));
    elements['atlas-play-button'].querySelector('[aria-hidden]').textContent = state.playing ? 'Ⅱ' : '▶';
    elements['atlas-play-button'].lastElementChild.textContent = playbackLabel;
    document.documentElement.dataset.theme = state.theme;
    document.querySelector('meta[name="theme-color"]').setAttribute('content', state.theme === 'dark' ? '#191d1b' : '#f1eadb');
    Array.prototype.forEach.call(elements['preset-buttons'].children, function (button) {
      var preset = activeData.presets.find(function (item) { return item.id === button.dataset.preset; });
      button.classList.toggle('active', preset.start === state.start && preset.end === state.end && (!preset.region || preset.region === state.region));
    });
  }

  function filteredTracks() {
    return timeline.filterTracks(activeData.tracks, state);
  }

  function typeLabel(type) {
    var keys = {
      civilization: 'legacySociety', 'archaeological-culture': 'archaeologicalCulture', site: 'siteType',
      polity: 'polityType', 'regional-sequence': 'regionalSequence', network: 'networkType', tradition: 'tradition'
    };
    return t(keys[type] || 'societies');
  }

  function precisionSymbol(precision) {
    return { exact: '●', approximate: '≈', range: '↔', traditional: '†', disputed: '?' }[precision] || '';
  }

  function precisionLabel(precision) {
    var keys = { exact: 'precisionExact', approximate: 'precisionApproximate', range: 'precisionRange', traditional: 'precisionTraditional', disputed: 'precisionDisputed' };
    return t(keys[precision] || 'precisionUnknown');
  }

  function basisLabel(basis) {
    var keys = {
      historical: 'basisHistorical', 'archaeological-chronology': 'basisArchaeological', radiocarbon: 'basisRadiocarbon',
      dendrochronology: 'basisDendrochronology', stratigraphy: 'basisStratigraphy', traditional: 'basisTraditional'
    };
    return t(keys[basis] || 'basisUnknown');
  }

  function reviewLabel(status) {
    return t({ reviewed: 'reviewedStatus', provisional: 'provisionalStatus', legacy: 'legacyStatus' }[status] || 'legacyStatus');
  }

  function confidenceLabel(confidence) {
    return t({ high: 'confidenceHigh', medium: 'confidenceMedium', low: 'confidenceLow' }[confidence] || 'confidenceUnknown');
  }

  function reviewStatusHtml(track) {
    var status = track.reviewStatus || 'legacy';
    return '<span class="review-status ' + escapeHtml(status) + '">' + escapeHtml(reviewLabel(status)) + '</span>';
  }

  function sourceLinksHtml(sourceIds) {
    return (sourceIds || []).map(function (sourceId) {
      var source = rawData.sources[sourceId];
      if (!source) return '';
      return '<a href="' + escapeHtml(source.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(source.title) + ' ↗</a>';
    }).filter(Boolean).join(', ');
  }

  function evidenceHtml(record) {
    if (!record.dating) return '';
    var dating = record.dating;
    var original = dating.original ? '<span><strong>' + escapeHtml(t('originalDating')) + '</strong> ' + escapeHtml(dating.original) + '</span>' : '';
    var sources = sourceLinksHtml(record.sourceIds);
    var confidence = dating.confidence ? '<span><strong>' + escapeHtml(t('confidenceLabel')) + '</strong> ' + escapeHtml(confidenceLabel(dating.confidence)) + '</span>' : '';
    var calibration = dating.calibrationCurve ? '<span><strong>' + escapeHtml(t('calibrationCurve')) + '</strong> ' + escapeHtml(dating.calibrationCurve) + '</span>' : '';
    var model = dating.model ? '<span><strong>' + escapeHtml(t('chronologyModel')) + '</strong> ' + escapeHtml(dating.model) + '</span>' : '';
    var alternatives = (dating.alternatives || []).map(function (alternative) {
      return escapeHtml(alternative.label || alternative.id) + ': ' + escapeHtml(formatYear(alternative.start) + ' — ' + formatYear(alternative.end));
    }).join('<br>');
    var alternativesHtml = alternatives ? '<span class="evidence-alternatives"><strong>' + escapeHtml(t('chronologyAlternatives')) + '</strong><br>' + alternatives + '</span>' : '';
    var dispute = dating.disputeNote ? '<span class="evidence-dispute"><strong>' + escapeHtml(t('disputeNote')) + '</strong> ' + escapeHtml(dating.disputeNote) + '</span>' : '';
    return '<div class="evidence-meta"><span class="precision-badge ' + escapeHtml(dating.precision) + '">' +
      escapeHtml(precisionSymbol(dating.precision) + ' ' + precisionLabel(dating.precision)) + '</span>' +
      '<span><strong>' + escapeHtml(t('datingBasis')) + '</strong> ' + escapeHtml(basisLabel(dating.basis)) + '</span>' + original + confidence + calibration + model + alternativesHtml + dispute +
      (sources ? '<span class="record-sources"><strong>' + escapeHtml(t('recordSources')) + '</strong> ' + sources + '</span>' : '') + '</div>';
  }

  function atlasCopy() {
    return {
      regionNames: regionNames,
      activeRegionLabel: t('activeRegionLabel'),
      comparisonConnectorLabel: t('comparisonConnectorLabel'),
      insightKicker: t('insightKicker'),
      openComparison: t('openComparison'),
      statsFallbackTitle: t('statsFallbackTitle'),
      statsTemplate: t('statsTemplate'),
      statTracks: t('statTracks'),
      statSocieties: t('statSocieties'),
      statTraditions: t('statTraditions'),
      noRegionTracks: t('noRegionTracks')
    };
  }

  function renderAtlas() {
    var model = atlas.buildModel({
      tracks: activeData.tracks,
      year: state.year,
      geography: atlasData,
      insights: insights,
      locale: state.lang,
      filters: state,
      selectedRegion: state.selectedRegion,
      focusIds: state.focus
    });
    var copy = atlasCopy();
    elements['atlas-map'].classList.toggle('has-selection', Boolean(state.selectedRegion));
    elements['atlas-world'].innerHTML = atlasView.worldSvg(worldMapData, t('atlasAria'), model.comparisonConnector, copy);
    elements['atlas-regions'].innerHTML = atlasView.renderRegions(model.regions, copy);
    elements['atlas-map-summary'].textContent = t('activeLines', { count: model.stats.tracks, year: formatYear(state.year) });

    Array.prototype.forEach.call(elements['atlas-regions'].querySelectorAll('[data-region]'), function (button) {
      var selected = button.dataset.region === state.selectedRegion;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.addEventListener('click', function () {
        state.selectedRegion = selected ? '' : button.dataset.region;
        render();
      });
    });

    if (state.selectedRegion) {
      var selectedName = regionNames[state.selectedRegion] || state.selectedRegion;
      elements['atlas-panel'].innerHTML = '<button class="atlas-panel-back" type="button" data-atlas-back>← ' + escapeHtml(t('backOverview')) + '</button>' +
        '<p class="atlas-panel-kicker">' + escapeHtml(t('selectedRegion')) + '</p><h3>' + escapeHtml(selectedName) + '</h3>' +
        '<p>' + escapeHtml(t('activeLines', { count: model.regionTracks.length, year: formatYear(state.year) })) + '</p>' +
        atlasView.renderRegionList(model, copy) +
        '<button class="atlas-panel-action" type="button" data-chronology>' + escapeHtml(t('openChronology')) + ' →</button>';
    } else {
      elements['atlas-panel'].innerHTML = atlasView.renderPanel(model, copy);
    }

    var backButton = elements['atlas-panel'].querySelector('[data-atlas-back]');
    if (backButton) backButton.addEventListener('click', function () { state.selectedRegion = ''; render(); });
    var chronologyButton = elements['atlas-panel'].querySelector('[data-chronology]');
    if (chronologyButton) chronologyButton.addEventListener('click', function () { setView('chronology'); });
    var focusButton = elements['atlas-panel'].querySelector('[data-focus]');
    if (focusButton) focusButton.addEventListener('click', function () {
      state.focus = explorerState.normalizeFocus(focusButton.dataset.focus, rawData.tracks);
      setView('chronology');
    });
    Array.prototype.forEach.call(elements['atlas-panel'].querySelectorAll('[data-track]'), function (button) {
      button.addEventListener('click', function () { openDetails(button.dataset.track); });
    });
  }

  function axisHtml() {
    var scale = currentScale();
    var ticks = chronology.ticks(scale, 10).map(function (year) {
      var percent = chronology.projectYear(year, scale);
      return '<div class="axis-tick" style="left:' + percent + '%"><span>' + escapeHtml(formatYear(year)) + '</span></div>';
    });
    var breakpoint = scale.piecewise ? '<div class="scale-breakpoint" style="left:' + (scale.deepWeight * 100) + '%"><span>' + escapeHtml(t('breakpointLabel')) + '</span></div>' : '';
    return '<div class="timeline-axis"><div class="axis-corner">' + escapeHtml(t('linePeriod')) + '</div><div class="axis-plot">' + ticks.join('') + breakpoint + '</div></div>';
  }

  function trackHtml(track, plotPixels) {
    var scale = currentScale();
    var periods = timeline.visiblePeriods(track, state.start, state.end).map(function (period) {
      var left = timeline.yearToPercent(period.clippedStart, scale);
      var width = timeline.yearToPercent(period.clippedEnd, scale) - left;
      if (width <= 0) return '';
      var density = timeline.periodDensity(width / 100 * plotPixels);
      var title = period.name + ': ' + formatYear(period.start) + ' — ' + formatYear(period.end) + (period.dating ? ' · ' + precisionLabel(period.dating.precision) : '');
      var openClass = track.continuesBeforeRange && period.clippedStart === state.start ? ' open-start' : '';
      var badge = density === 'wide' && period.dating ? '<span class="precision-badge compact ' + escapeHtml(period.dating.precision) + '" aria-hidden="true">' + escapeHtml(precisionSymbol(period.dating.precision)) + '</span>' : '';
      var label = density === 'wide' || density === 'medium' ? '<span class="period-label">' + escapeHtml(period.name) + '</span>' : '';
      var record = timeline.periodTooltipRecord(period);
      var range = formatYear(record.start) + ' — ' + formatYear(record.end);
      var precision = record.precision ? precisionLabel(record.precision) : '';
      var basis = record.basis ? basisLabel(record.basis) : '';
      return '<button class="period period-density-' + density + openClass + '" type="button" data-track="' + escapeHtml(track.id) + '" data-period="' + escapeHtml(record.id) + '" ' +
        'data-review="' + escapeHtml(track.reviewStatus || 'legacy') + '" data-tooltip-name="' + escapeHtml(record.name) + '" data-tooltip-range="' + escapeHtml(t('periodTooltipDates', { range: range })) + '" ' +
        'data-tooltip-precision="' + escapeHtml(precision ? t('periodTooltipPrecision', { precision: precision }) : '') + '" data-tooltip-basis="' + escapeHtml(basis ? t('periodTooltipBasis', { basis: basis }) : '') + '" ' +
        'style="left:' + left + '%;width:' + Math.max(width, .12) + '%" title="' + escapeHtml(title) + '" aria-label="' + escapeHtml(title) + '" aria-describedby="period-tooltip" tabindex="-1">' + badge + label + '</button>';
    }).join('');
    var events = track.events.filter(function (event) { return event.year >= state.start && event.year <= state.end; }).map(function (event) {
      var left = timeline.yearToPercent(event.year, scale);
      var precision = event.dating ? ' ' + event.dating.precision : '';
      return '<span class="event-marker' + precision + '" style="left:' + left + '%" title="' + escapeHtml(formatYear(event.year) + ' — ' + event.title) + '"></span>';
    }).join('');
    var yearLeft = timeline.yearToPercent(state.year, scale);
    var localizedType = typeLabel(track.type);
    var focusClass = state.focus.indexOf(track.id) !== -1 ? ' focused' : '';
    return '<div class="track-row ' + track.type + focusClass + '" role="listitem" style="--region-color:' + regionColors[track.region] + '">' +
      '<button class="track-label" type="button" data-track="' + track.id + '" title="' + escapeHtml(t('openDetails', { name: track.name })) + '">' +
      '<span class="track-label-marker"></span><span class="track-label-text"><strong>' + escapeHtml(track.name) + '</strong><small>' + escapeHtml(regionNames[track.region]) + ' · ' + escapeHtml(localizedType) + '</small></span></button>' +
      '<div class="track-plot"><div class="event-lane">' + events + '</div><div class="period-lane">' + periods + '<span class="current-year-line" style="left:' + yearLeft + '%"></span></div></div></div>';
  }

  function hidePeriodTooltip() {
    if (!elements['period-tooltip']) return;
    elements['period-tooltip'].hidden = true;
    elements['period-tooltip'].style.left = '';
    elements['period-tooltip'].style.top = '';
  }

  function positionPeriodTooltip(button) {
    var tooltip = elements['period-tooltip'];
    if (!tooltip || tooltip.hidden) return;
    var target = button.getBoundingClientRect();
    var box = tooltip.getBoundingClientRect();
    var position = timeline.tooltipPosition(target, box, { width: window.innerWidth, height: window.innerHeight });
    tooltip.style.left = position.left + 'px';
    tooltip.style.top = position.top + 'px';
  }

  function showPeriodTooltip(button) {
    var tooltip = elements['period-tooltip'];
    var lines = [button.dataset.tooltipName, button.dataset.tooltipRange, button.dataset.tooltipPrecision, button.dataset.tooltipBasis].filter(Boolean);
    tooltip.textContent = lines.join('\n');
    tooltip.hidden = false;
    positionPeriodTooltip(button);
  }

  function movePeriodFocus(button, key) {
    var row = button.closest('.track-row');
    var periods = Array.prototype.slice.call(row.querySelectorAll('.period[data-period]'));
    var index = periods.indexOf(button);
    var target = null;
    if (key === 'ArrowRight') target = periods[Math.min(periods.length - 1, index + 1)];
    if (key === 'ArrowLeft') target = periods[Math.max(0, index - 1)];
    if (key === 'Home') target = periods[0];
    if (key === 'End') target = periods[periods.length - 1];
    if (key === 'Escape') {
      button.tabIndex = -1;
      hidePeriodTooltip();
      row.querySelector('.track-label').focus();
      return true;
    }
    if (!target) return false;
    periods.forEach(function (period) { period.tabIndex = period === target ? 0 : -1; });
    target.focus();
    return true;
  }

  function renderTimeline() {
    var tracks = filteredTracks();
    var baseWidth = 1320;
    var plotPixels = Math.round(baseWidth * state.zoom / 100);
    hidePeriodTooltip();
    document.documentElement.style.setProperty('--plot-width', plotPixels + 'px');
    elements.timeline.innerHTML = axisHtml() + tracks.map(function (track) { return trackHtml(track, plotPixels); }).join('');
    elements.timeline.hidden = tracks.length === 0;
    elements['empty-state'].hidden = tracks.length !== 0;
    Array.prototype.forEach.call(elements.timeline.querySelectorAll('.track-label[data-track]'), function (button) {
      button.addEventListener('click', function () { openDetails(button.dataset.track); });
      button.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowRight') return;
        var first = button.closest('.track-row').querySelector('.period[data-period]');
        if (!first) return;
        event.preventDefault();
        first.tabIndex = 0;
        first.focus();
      });
    });
    Array.prototype.forEach.call(elements.timeline.querySelectorAll('.period[data-period]'), function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        openDetails(button.dataset.track, button.dataset.period);
      });
      button.addEventListener('pointerenter', function () { showPeriodTooltip(button); });
      button.addEventListener('pointerleave', hidePeriodTooltip);
      button.addEventListener('focus', function () { showPeriodTooltip(button); });
      button.addEventListener('blur', hidePeriodTooltip);
      button.addEventListener('keydown', function (event) {
        if (movePeriodFocus(button, event.key)) event.preventDefault();
      });
    });
  }

  function renderContemporaries() {
    var tracks = timeline.activeTracks(filteredTracks(), state.year);
    elements['contemporary-summary'].textContent = t('activeLines', { count: tracks.length, year: formatYear(state.year) });
    if (!tracks.length) {
      elements['contemporary-list'].innerHTML = '<span class="no-contemporaries">' + escapeHtml(t('noContemporaries')) + '</span>';
      return;
    }
    elements['contemporary-list'].innerHTML = tracks.map(function (track) {
      return '<button class="contemporary-chip" type="button" data-track="' + track.id + '">' + escapeHtml(track.name) + '</button>';
    }).join('');
    Array.prototype.forEach.call(elements['contemporary-list'].querySelectorAll('[data-track]'), function (button) {
      button.addEventListener('click', function () { openDetails(button.dataset.track); });
    });
  }

  function connectedFocusTarget(target) {
    return Boolean(target) && target !== document.body && target !== document.documentElement &&
      target.isConnected !== false && typeof target.focus === 'function';
  }

  function focusProgrammatically(target) {
    if (!connectedFocusTarget(target)) return false;
    var previous = journeyProgrammaticFocus;
    journeyProgrammaticFocus = true;
    try {
      target.focus();
    } catch (_) {
      return false;
    } finally {
      journeyProgrammaticFocus = previous;
    }
    return true;
  }

  function captureDetailTrigger(target) {
    if (isDetailOpen()) return;
    target = target || document.activeElement;
    detailTrigger = connectedFocusTarget(target) ? target : null;
  }

  function restoreDetailTrigger() {
    var target = detailTrigger;
    detailTrigger = null;
    focusProgrammatically(target);
  }

  function openDetails(id, recordId, trigger) {
    var track = activeData.tracks.find(function (item) { return item.id === id; });
    if (!track) return;
    captureDetailTrigger(trigger);
    elements['dialog-title'].textContent = track.name;
    elements['dialog-meta'].innerHTML = '<span>' + escapeHtml(regionNames[track.region]) + ' · ' + escapeHtml(typeLabel(track.type)) + '</span>' + reviewStatusHtml(track);
    elements['dialog-summary'].textContent = track.summary;
    elements['dialog-periods'].innerHTML = track.periods.map(function (period) {
      var selected = recordId && period.id === recordId;
      return '<li data-period="' + escapeHtml(period.id || '') + '" class="' + (selected ? 'emphasized' : '') + '"' + (selected ? ' tabindex="-1" aria-label="' + escapeHtml(t('selectedPeriodState') + ': ' + period.name) + '"' : '') + '><strong>' + escapeHtml(period.name) + '</strong><span>' + escapeHtml(formatYear(period.start)) + ' — ' + escapeHtml(formatYear(period.end)) + '</span>' +
        (period.note ? '<p>' + escapeHtml(period.note) + '</p>' : '') + evidenceHtml(period) + '</li>';
    }).join('');
    elements['dialog-events'].innerHTML = track.events.slice().sort(function (a, b) { return a.year - b.year; }).map(function (event) {
      var selected = recordId && event.id === recordId;
      return '<li data-event="' + escapeHtml(event.id || '') + '" class="' + (selected ? 'emphasized' : '') + '"' +
        (selected ? ' tabindex="-1" aria-label="' + escapeHtml(t('selectedPeriodState') + ': ' + event.title) + '"' : '') +
        '><strong>' + escapeHtml(formatYear(event.year)) + '</strong><span>' + escapeHtml(event.title) + '</span>' +
        (event.note ? '<p>' + escapeHtml(event.note) + '</p>' : '') + evidenceHtml(event) + '</li>';
    }).join('');
    elements['dialog-sources'].innerHTML = '<strong>' + escapeHtml(t('detailsSources')) + ' </strong>' + sourceLinksHtml(track.sources);
    if (typeof elements['detail-dialog'].showModal === 'function') elements['detail-dialog'].showModal();
    else elements['detail-dialog'].setAttribute('open', '');
    var emphasized = elements['dialog-periods'].querySelector('.emphasized') ||
      elements['dialog-events'].querySelector('.emphasized');
    if (emphasized) {
      if (typeof emphasized.scrollIntoView === 'function') emphasized.scrollIntoView({ block: 'nearest' });
      emphasized.focus();
    }
  }

  function closeDetails() {
    if (typeof elements['detail-dialog'].close === 'function') elements['detail-dialog'].close();
    else elements['detail-dialog'].removeAttribute('open');
    restoreDetailTrigger();
  }

  function renderStats() {
    var periodCount = rawData.tracks.reduce(function (sum, track) { return sum + track.periods.length; }, 0);
    var eventCount = rawData.tracks.reduce(function (sum, track) { return sum + track.events.length; }, 0);
    elements['track-count'].textContent = rawData.tracks.length;
    elements['period-count'].textContent = periodCount;
    elements['event-count'].textContent = eventCount;
  }

  function render() {
    activeData = i18n.localizeData(rawData, state.lang);
    applyStaticCopy();
    renderLocaleControls();
    syncControls();
    renderAtlas();
    renderTimeline();
    renderContemporaries();
    writeUrlState();
  }

  function stopPlayback(renderAfter) {
    if (playbackTimer) clearInterval(playbackTimer);
    playbackTimer = null;
    var changed = state.playing;
    state.playing = false;
    if (renderAfter && changed) render();
  }

  function startPlayback() {
    var step = chronology.recommendedStep(currentScale());
    if (reducedMotion && reducedMotion.matches) {
      state.year = atlas.nextPlaybackYear(state.year, state.start, state.end, step);
      render();
      return;
    }
    if (playbackTimer) clearInterval(playbackTimer);
    state.playing = true;
    render();
    playbackTimer = setInterval(function () {
      state.year = atlas.nextPlaybackYear(state.year, state.start, state.end, step);
      render();
    }, 560);
  }

  function setView(view) {
    if (view !== 'map' && view !== 'chronology') return;
    if (view !== 'map') stopPlayback(false);
    state.view = view;
    render();
  }

  function updateRange(start, end) {
    start = chronology.normalizeHistoricalYear(start, -1);
    end = chronology.normalizeHistoricalYear(end, 1);
    start = timeline.clamp(Number(start), rawData.range.start, rawData.range.end - 1);
    end = timeline.clamp(Number(end), start + 1, rawData.range.end);
    state.start = start;
    state.end = end;
    if (start === rawData.range.start && end === rawData.range.end) state.scaleMode = 'overview';
    else if (end <= rawData.scale.breakpoint) state.scaleMode = 'deep';
    else if (start >= rawData.scale.breakpoint) state.scaleMode = 'historical';
    else state.scaleMode = 'overview';
    state.year = chronology.normalizeHistoricalYear(timeline.clamp(state.year, start, end), state.year < 0 ? -1 : 1);
    render();
  }

  function setScaleMode(mode) {
    if (['overview', 'deep', 'historical'].indexOf(mode) === -1) return;
    stopPlayback(false);
    state.scaleMode = mode;
    var range = chronology.modeRange(mode, {
      start: rawData.range.start, end: rawData.range.end, breakpoint: rawData.scale.breakpoint
    });
    state.start = range.start;
    state.end = range.end;
    state.year = timeline.clamp(state.year, range.start, range.end);
    state.year = chronology.normalizeHistoricalYear(state.year, range.end < 1 ? -1 : 1);
    render();
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add('visible');
    toastTimer = setTimeout(function () { elements.toast.classList.remove('visible'); }, 2200);
  }

  function downloadCsv() {
    var options = {
      headers: [t('csvLine'), t('csvType'), t('csvRegion'), t('csvPeriod'), t('csvStart'), t('csvEnd'), t('csvNote'),
        t('csvPrecision'), t('csvDatingBasis'), t('csvOriginalDating'), t('csvReviewStatus'), t('csvSources'),
        t('csvConfidence'), t('csvChronologyModel'), t('csvCalibrationCurve'), t('csvAlternatives'), t('csvDisputeNote')],
      typeNames: {
        civilization: typeLabel('civilization'), tradition: typeLabel('tradition'),
        'archaeological-culture': typeLabel('archaeological-culture'), site: typeLabel('site'),
        polity: typeLabel('polity'), 'regional-sequence': typeLabel('regional-sequence'), network: typeLabel('network')
      },
      regionNames: regionNames,
      precisionNames: {
        exact: precisionLabel('exact'), approximate: precisionLabel('approximate'), range: precisionLabel('range'),
        traditional: precisionLabel('traditional'), disputed: precisionLabel('disputed')
      },
      basisNames: {
        historical: basisLabel('historical'), 'archaeological-chronology': basisLabel('archaeological-chronology'),
        radiocarbon: basisLabel('radiocarbon'), dendrochronology: basisLabel('dendrochronology'),
        stratigraphy: basisLabel('stratigraphy'), traditional: basisLabel('traditional')
      },
      reviewNames: { reviewed: reviewLabel('reviewed'), provisional: reviewLabel('provisional'), legacy: reviewLabel('legacy') },
      confidenceNames: { high: confidenceLabel('high'), medium: confidenceLabel('medium'), low: confidenceLabel('low') },
      sources: rawData.sources,
      includeEvidence: true,
      includeExtendedEvidence: true
    };
    var blob = new Blob(['\ufeff' + timeline.buildCsv(filteredTracks(), options)], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = t('csvFilename');
    link.click();
    URL.revokeObjectURL(url);
  }

  function prefersReducedMotion() {
    return Boolean(reducedMotion && reducedMotion.matches);
  }

  function journeyNow() {
    return window.performance && typeof window.performance.now === 'function'
      ? window.performance.now()
      : Date.now();
  }

  function journeyCopy() {
    return {
      catalogTitle: t('journeyCatalogTitle'),
      startJourney: t('journeyStart'),
      minutesTemplate: t('journeyDuration'),
      stopsTemplate: t('journeyStops'),
      previousStop: t('journeyPrevious'),
      nextStop: t('journeyNext'),
      pauseJourney: t('journeyPause'),
      resumeJourney: t('journeyResume'),
      shareJourney: t('journeyShare'),
      openEvidence: t('journeyEvidence'),
      stopTemplate: t('journeyStopProgress'),
      completeKicker: t('journeyCompleteKicker'),
      exploreMoment: t('journeyExplore'),
      replayJourney: t('journeyReplay'),
      backCatalog: t('journeyBackCatalog')
    };
  }

  function localizedJourneyRoutes() {
    return validatedJourneys.routes.map(function (route) {
      return journey.localizeRoute(route, state.lang);
    });
  }

  function isDialogOpen(dialog) {
    if (!dialog) return false;
    try {
      return dialog.open === true ||
        typeof dialog.hasAttribute === 'function' && dialog.hasAttribute('open');
    } catch (_) {
      return false;
    }
  }

  function isJourneyOpen() {
    return isDialogOpen(elements['journey-dialog']);
  }

  function isDetailOpen() {
    return isDialogOpen(elements['detail-dialog']);
  }

  function captureJourneyTrigger() {
    if (isJourneyOpen()) return;
    var target = document.activeElement;
    journeyTrigger = connectedFocusTarget(target) ? target : null;
  }

  function restoreJourneyTrigger() {
    var target = journeyTrigger;
    journeyTrigger = null;
    focusProgrammatically(target);
  }

  function cancelJourneyAnnouncement() {
    journeyAnnouncementGeneration += 1;
    if (elements['journey-announcement']) elements['journey-announcement'].textContent = '';
  }

  function showJourneyDialog() {
    if (!isJourneyOpen()) {
      if (typeof elements['journey-dialog'].showModal === 'function') elements['journey-dialog'].showModal();
      else elements['journey-dialog'].setAttribute('open', '');
    }
    document.body.classList.add('journey-open');
  }

  function closeJourneyDialog() {
    cancelJourneyAnnouncement();
    if (isJourneyOpen()) {
      if (typeof elements['journey-dialog'].close === 'function') elements['journey-dialog'].close();
      else elements['journey-dialog'].removeAttribute('open');
    }
    document.body.classList.remove('journey-open');
    journeyFocusIdentity = '';
  }

  function stopJourneyClock() {
    if (journeyTimer) clearInterval(journeyTimer);
    journeyTimer = null;
  }

  function clearJourneyTransition() {
    if (journeyTransitionStage && journeyTransitionHandler &&
        typeof journeyTransitionStage.removeEventListener === 'function') {
      journeyTransitionStage.removeEventListener('transitionend', journeyTransitionHandler);
    }
    journeyTransitionStage = null;
    journeyTransitionHandler = null;
    if (journeyTransitionTimer) clearTimeout(journeyTransitionTimer);
    journeyTransitionTimer = null;
  }

  function renderJourneyMap() {
    var worldTarget = elements['journey-content'].querySelector('[data-journey-world]');
    var regionsTarget = elements['journey-content'].querySelector('[data-journey-regions]');
    if (!worldTarget || !regionsTarget) return;
    var model = atlas.buildModel({
      tracks: activeData.tracks,
      year: state.year,
      geography: atlasData,
      insights: insights,
      locale: state.lang,
      filters: { query: '', region: 'all', type: 'all' },
      selectedRegion: '',
      focusIds: state.focus
    });
    var copy = atlasCopy();
    worldTarget.innerHTML = atlasView.worldSvg(worldMapData, t('atlasAria'), model.comparisonConnector, copy);
    regionsTarget.innerHTML = atlasView.renderRegions(model.regions, copy);
    neutralizeJourneyMap();
  }

  function neutralizeJourneyMap() {
    var layer = elements['journey-content'].querySelector('.journey-map-layer');
    if (!layer || typeof layer.querySelectorAll !== 'function') return;
    Array.prototype.forEach.call(layer.querySelectorAll('button, a[href], input, select, textarea, [tabindex]'), function (control) {
      control.tabIndex = -1;
      if ('disabled' in control) control.disabled = true;
    });
  }

  function copyJourneyAnnouncement(identity) {
    var source = elements['journey-content'].querySelector('[data-journey-announcement-source]');
    var announcement = elements['journey-announcement'];
    if (!source || !announcement) return;
    var message = source.textContent;
    var generation = journeyAnnouncementGeneration;
    setTimeout(function () {
      if (generation === journeyAnnouncementGeneration && identity === journeyFocusIdentity &&
          isJourneyOpen() && elements['journey-announcement'] === announcement) {
        announcement.textContent = message;
      }
    }, 0);
  }

  function journeySceneIdentity() {
    if (!journeyRoute || !journeyState || journeyState.status === 'catalog') return 'catalog';
    if (journeyState.status === 'complete') return 'complete:' + journeyRoute.id;
    var stop = journeyRoute.stops[journeyState.stopIndex];
    return stop ? journeyRoute.id + ':' + stop.id : '';
  }

  function focusJourneyHeading(identity) {
    if (!identity || identity === journeyFocusIdentity) return;
    journeyFocusIdentity = identity;
    var heading = elements['journey-content'].querySelector('h2[tabindex="-1"]');
    focusProgrammatically(heading);
  }

  function renderJourney() {
    var html;
    var identity = journeySceneIdentity();
    if (!journeyRoute || !journeyState || journeyState.status === 'catalog') {
      html = journeyView.catalogHtml(localizedJourneyRoutes(), journeyCopy());
      html = html.replace('</h2>', '</h2><p>' + journeyView.escapeHtml(t('journeyCatalogText')) + '</p>');
      if (journeyCatalogNotice) {
        html = html.replace('</h2>', '</h2><p role="status">' + journeyView.escapeHtml(journeyCatalogNotice) + '</p>');
      }
    } else if (journeyState.status === 'complete') {
      html = journeyView.completeHtml(journeyRoute, journeyCopy());
      html = html.replace('</div></article>', '<button type="button" data-journey-action="restore">' +
        journeyView.escapeHtml(t('journeyRestoreAtlas')) + '</button></div></article>');
    } else {
      html = journeyView.stageHtml(journeyRoute, journeyState, journeyCopy(), formatYear);
    }
    if (!html) throw new Error('Journey view returned no content');
    cancelJourneyAnnouncement();
    elements['journey-content'].innerHTML = html;
    if (journeyRoute && journeyState && journeyState.status !== 'complete') {
      renderJourneyMap();
      copyJourneyAnnouncement(identity);
    }
    focusJourneyHeading(identity);
    return true;
  }

  function applyJourneyStop() {
    if (!journeyRoute || !journeyState || !journeyRoute.stops[journeyState.stopIndex]) return;
    var stop = journeyRoute.stops[journeyState.stopIndex];
    state.year = stop.year;
    state.focus = stop.focusTrackIds.slice();
    state.view = 'map';
    state.scaleMode = stop.year <= rawData.scale.breakpoint ? 'deep' : 'historical';
    var range = chronology.modeRange(state.scaleMode, {
      start: rawData.range.start, end: rawData.range.end, breakpoint: rawData.scale.breakpoint
    });
    state.start = range.start;
    state.end = range.end;
    state.journey = journeyRoute.id;
    state.stop = stop.id;
    state.journeyMode = journeyState.status === 'playing' ? 'playing' : 'paused';
    state.journeyNotice = '';
  }

  function startJourneyClock() {
    stopJourneyClock();
    if (!journeyRoute || !journeyState || journeyState.status !== 'playing') return;
    var ownedTimer = setInterval(function () {
      if (journeyTimer !== ownedTimer) return;
      var clockValue = journey.clock(journeyState, journeyNow(), journeyRoute);
      journeyView.updateClock(elements['journey-content'], clockValue);
      if (clockValue.shouldAdvance) {
        stopJourneyClock();
        journeyAutoplay = true;
        dispatchJourney('next', journeyNow());
      }
    }, 250);
    journeyTimer = ownedTimer;
  }

  function armJourneyTransition() {
    clearJourneyTransition();
    if (!journeyState || journeyState.status !== 'transitioning') return;
    var stage = elements['journey-content'].querySelector('[data-journey-stop]');
    var stopIndex = journeyState.stopIndex;
    var completed = false;
    function completeTransition(event) {
      if (event && event.target !== stage) return;
      if (completed || !journeyState || journeyState.status !== 'transitioning' ||
          journeyState.stopIndex !== stopIndex) return;
      completed = true;
      clearJourneyTransition();
      dispatchJourney('transitionEnd', journeyNow(), !journeyAutoplay || prefersReducedMotion());
    }
    if (prefersReducedMotion()) {
      completeTransition();
      return;
    }
    if (stage) {
      journeyTransitionStage = stage;
      journeyTransitionHandler = completeTransition;
      stage.addEventListener('transitionend', completeTransition);
    }
    journeyTransitionTimer = setTimeout(completeTransition, 1400);
  }

  function dispatchJourney(type, now, forceReducedMotion) {
    try {
      if (!journeyRoute || !journeyState) return;
      stopJourneyClock();
      var event = typeof type === 'string' ? { type: type } : type;
      journeyState = journey.reduce(journeyState, event, journeyRoute, {
        now: Number.isFinite(now) ? now : journeyNow(),
        reducedMotion: Boolean(forceReducedMotion) || prefersReducedMotion()
      });
      if (journeyState.status !== 'transitioning') clearJourneyTransition();
      applyJourneyStop();
      writeUrlState();
      if (!renderJourney() || !journeyState) return;
      if (journeyState.status === 'transitioning') {
        armJourneyTransition();
      } else {
        journeyView.updateClock(elements['journey-content'], journey.clock(journeyState, journeyNow(), journeyRoute));
        startJourneyClock();
      }
    } catch (_) {
      failJourney();
    }
  }

  function cloneExplorerState(source) {
    return Object.assign({}, source, { focus: (source.focus || []).slice() });
  }

  function startJourney(routeId, stopId, autoplay) {
    try {
      var resolvedRoute = journey.findRoute(validatedJourneys, routeId);
      if (!resolvedRoute) {
        openJourneyCatalog(t('journeyUnknownRoute'));
        return;
      }
      captureJourneyTrigger();
      stopPlayback(false);
      if (!preJourneyState) {
        preJourneyState = cloneExplorerState(state);
        preJourneyState.journey = '';
        preJourneyState.stop = '';
        preJourneyState.journeyMode = 'paused';
        preJourneyState.journeyNotice = '';
      }
      journeyRoute = journey.localizeRoute(resolvedRoute, state.lang);
      var stopIndex = journeyRoute.stops.findIndex(function (stop) { return stop.id === stopId; });
      if (stopIndex < 0) stopIndex = 0;
      journeyState = journey.createState(journeyRoute, { stopIndex: stopIndex, status: 'paused' });
      journeyAutoplay = Boolean(autoplay) && !prefersReducedMotion();
      journeyCatalogNotice = '';
      showJourneyDialog();
      dispatchJourney({ type: 'start', stopIndex: stopIndex }, journeyNow());
    } catch (_) {
      failJourney();
    }
  }

  function openJourneyCatalog(notice) {
    try {
      stopJourneyClock();
      clearJourneyTransition();
      captureJourneyTrigger();
      journeyRoute = null;
      journeyState = null;
      journeyAutoplay = false;
      journeyCatalogNotice = notice || '';
      state.journey = '';
      state.stop = '';
      state.journeyMode = 'paused';
      state.journeyNotice = '';
      showJourneyDialog();
      writeUrlState();
      renderJourney();
    } catch (_) {
      failJourney();
    }
  }

  function resolveJourneyExitState(current, original, restoreOriginal) {
    var resolved = restoreOriginal && original
      ? cloneExplorerState(original)
      : cloneExplorerState(current);
    if (restoreOriginal && original) {
      resolved.theme = current.theme;
      resolved.lang = current.lang;
    }
    resolved.journey = '';
    resolved.stop = '';
    resolved.journeyMode = 'paused';
    resolved.journeyNotice = '';
    return resolved;
  }

  function runJourneyController(action) {
    try {
      return action();
    } catch (_) {
      failJourney();
      return undefined;
    }
  }

  function finishJourney(restoreOriginal) {
    return runJourneyController(function () {
      if (!isJourneyOpen() && !journeyState && !journeyRoute && !preJourneyState) {
        restoreJourneyTrigger();
        return;
      }
      stopJourneyClock();
      clearJourneyTransition();
      closeJourneyDialog();
      state = resolveJourneyExitState(state, preJourneyState, restoreOriginal);
      journeyState = null;
      journeyRoute = null;
      journeyAutoplay = false;
      journeyCatalogNotice = '';
      preJourneyState = null;
      restoreJourneyTrigger();
      render();
    });
  }

  function failJourney() {
    if (journeyRecovering) return;
    journeyRecovering = true;
    try {
      try { stopJourneyClock(); } catch (_) {}
      try { clearJourneyTransition(); } catch (_) {}
      try {
        closeJourneyDialog();
      } catch (_) {
        try { elements['journey-dialog'].removeAttribute('open'); } catch (__) {}
        try { document.body.classList.remove('journey-open'); } catch (__) {}
      }
      state.journey = '';
      state.stop = '';
      state.journeyMode = 'paused';
      state.journeyNotice = '';
      journeyState = null;
      journeyRoute = null;
      journeyAutoplay = false;
      journeyCatalogNotice = '';
      preJourneyState = null;
      restoreJourneyTrigger();
      try {
        render();
      } catch (_) {
        try { writeUrlState(); } catch (__) {}
      }
      try { showToast(t('journeyRenderError')); } catch (_) {}
    } finally {
      journeyRecovering = false;
    }
  }

  function shareJourney() {
    return runJourneyController(function () {
      var sharedState = Object.assign({}, state, { journeyMode: 'paused' });
      sharedState.focus = (state.focus || []).slice();
      var params = explorerState.serialize(sharedState, defaults);
      var url = window.location.origin + window.location.pathname + '?' + params.toString();
      function promptFallback() {
        try { window.prompt(t('copyLinkPrompt'), url); } catch (_) {}
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        var write;
        try {
          write = navigator.clipboard.writeText(url);
        } catch (_) {
          promptFallback();
          return url;
        }
        if (write && typeof write.then === 'function') {
          write.then(function () {
            try { showToast(t('journeyLinkCopied')); } catch (_) {}
          }, promptFallback);
        }
      } else {
        promptFallback();
      }
      return url;
    });
  }

  function openDirectJourney() {
    if (state.journeyNotice === 'unknown-route') {
      openJourneyCatalog(t('journeyUnknownRoute'));
      return;
    }
    if (!state.journey) return;
    var routeId = state.journey;
    var stopId = state.stop;
    var notice = state.journeyNotice;
    var autoplay = state.journeyMode === 'playing' && !prefersReducedMotion();
    startJourney(routeId, stopId, autoplay);
    if (notice === 'unknown-stop') showToast(t('journeyUnknownStop'));
  }

  function pauseJourneyForInteraction() {
    if (!journeyState || journeyState.status !== 'playing') return;
    journeyAutoplay = false;
    dispatchJourney('interact', journeyNow());
  }

  function journeyKeyboardIgnored(target) {
    if (!target) return false;
    var tagName = String(target.tagName || '').toLowerCase();
    return ['input', 'textarea', 'select', 'button'].indexOf(tagName) !== -1 || target.isContentEditable;
  }

  function currentJourneyEvidenceTrigger(trackId, recordId) {
    var content = elements['journey-content'];
    if (!content || typeof content.querySelectorAll !== 'function') return null;
    var controls;
    try {
      controls = content.querySelectorAll('[data-journey-evidence]');
    } catch (_) {
      return null;
    }
    for (var index = 0; index < Math.min(controls.length, 100); index += 1) {
      var control = controls[index];
      if (control && control.dataset && control.dataset.journeyEvidence === trackId &&
          control.dataset.recordId === recordId && connectedFocusTarget(control)) return control;
    }
    return null;
  }

  function activateJourneyEvidence(trackId, recordId, detailsOpener, trigger) {
    return runJourneyController(function () {
      journeyAutoplay = false;
      stopJourneyClock();
      if (journeyState && journeyState.status === 'transitioning') {
        clearJourneyTransition();
        dispatchJourney('transitionEnd', journeyNow(), true);
      }
      if (journeyState && (journeyState.status === 'playing' || journeyState.status === 'paused')) {
        dispatchJourney('interact', journeyNow());
      }
      var connectedTrigger = currentJourneyEvidenceTrigger(trackId, recordId) || trigger;
      captureDetailTrigger(connectedTrigger);
      (typeof detailsOpener === 'function' ? detailsOpener : openDetails)(trackId, recordId, connectedTrigger);
    });
  }

  function handleJourneyAction(action) {
    return runJourneyController(function () {
      if (!journeyState || !journeyRoute) return;
      if (action === 'previous' || action === 'next') {
        journeyAutoplay = journeyState.status === 'playing';
        dispatchJourney(action, journeyNow());
      } else if (action === 'toggle') {
        if (journeyState.status === 'playing') {
          journeyAutoplay = false;
          dispatchJourney('pause', journeyNow());
        } else {
          journeyAutoplay = !prefersReducedMotion();
          dispatchJourney('resume', journeyNow());
        }
      } else if (action === 'share') {
        return shareJourney();
      } else if (action === 'explore' || action === 'exit') {
        return finishJourney(false);
      } else if (action === 'restore') {
        return finishJourney(true);
      } else if (action === 'replay') {
        startJourney(journeyRoute.id, journeyRoute.stops[0].id, !prefersReducedMotion());
      } else if (action === 'catalog') {
        openJourneyCatalog('');
      }
    });
  }

  function handleJourneyContentClick(event) {
    var target = event.target && typeof event.target.closest === 'function' ? event.target : null;
    if (!target) return;
    var startButton = target.closest('[data-journey-start]');
    if (startButton) {
      startJourney(startButton.dataset.journeyStart, '', !prefersReducedMotion());
      return;
    }
    var progressButton = target.closest('[data-journey-go]');
    if (progressButton && journeyState) {
      journeyAutoplay = journeyState.status === 'playing';
      dispatchJourney({ type: 'start', stopIndex: Number(progressButton.dataset.journeyGo) }, journeyNow());
      return;
    }
    var evidenceButton = target.closest('[data-journey-evidence]');
    if (evidenceButton) {
      activateJourneyEvidence(evidenceButton.dataset.journeyEvidence, evidenceButton.dataset.recordId,
        undefined, evidenceButton);
      return;
    }
    var actionButton = target.closest('[data-journey-action]');
    if (actionButton) {
      handleJourneyAction(actionButton.dataset.journeyAction);
      return;
    }
    if (target === elements['journey-content'].querySelector('.journey-stage')) {
      pauseJourneyForInteraction();
    }
  }

  function handleJourneyFocusIn(event) {
    if (journeyProgrammaticFocus || suppressJourneyFocusPause || !event ||
        !event.target || !event.target.closest ||
        !event.target.closest('[data-journey-stop]')) return;
    pauseJourneyForInteraction();
  }

  function handleDocumentKeydown(event) {
    if (isDetailOpen()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDetails();
      }
      return;
    }
    if (isJourneyOpen()) {
      if (event.key === 'Tab') {
        journeyView.trapTab(event, elements['journey-dialog']);
        return;
      }
      if (journeyKeyboardIgnored(event.target)) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        finishJourney(false);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        journeyAutoplay = journeyState && journeyState.status === 'playing';
        dispatchJourney(event.key === 'ArrowLeft' ? 'previous' : 'next', journeyNow());
      } else if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        handleJourneyAction('toggle');
      }
      return;
    }
    var activeTag = document.activeElement && document.activeElement.tagName;
    if (event.key === '/' && activeTag !== 'INPUT') {
      event.preventDefault();
      elements['search-input'].focus();
    }
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      if (isJourneyOpen() && journeyState) {
        journeyAutoplay = false;
        dispatchJourney('visibilityHidden', journeyNow());
      } else {
        stopPlayback(true);
      }
    } else if (isJourneyOpen() && journeyState) {
      dispatchJourney('visibilityVisible', journeyNow());
    }
  }

  function handleReducedMotionChange(event) {
    if (event.matches && journeyState && journeyState.status === 'playing') {
      journeyAutoplay = false;
      dispatchJourney('pause', journeyNow());
    }
  }

  function bindEvents() {
    elements['filter-toggle'].addEventListener('click', function () {
      state.filtersOpen = !state.filtersOpen;
      syncControls();
    });
    elements['search-input'].addEventListener('input', function (event) { state.query = event.target.value; render(); });
    elements['region-select'].addEventListener('change', function (event) { state.region = event.target.value; render(); });
    elements['type-select'].addEventListener('change', function (event) { state.type = event.target.value; render(); });
    elements['zoom-input'].addEventListener('input', function (event) { state.zoom = Number(event.target.value); render(); });
    elements['year-input'].addEventListener('input', function (event) { stopPlayback(false); state.year = yearFromSlider(event.target.value); render(); });
    elements['atlas-year-input'].addEventListener('input', function (event) { stopPlayback(false); state.year = yearFromSlider(event.target.value); render(); });
    elements['atlas-play-button'].addEventListener('click', function () {
      if (state.playing) stopPlayback(true);
      else startPlayback();
    });
    elements['view-map-button'].addEventListener('click', function () { setView('map'); });
    elements['view-chronology-button'].addEventListener('click', function () { setView('chronology'); });
    elements['scale-mode'].addEventListener('click', function (event) {
      var button = event.target.closest('[data-scale]');
      if (!button) return;
      if (isJourneyOpen()) {
        pauseJourneyForInteraction();
        return;
      }
      setScaleMode(button.dataset.scale);
    });
    [elements['view-map-button'], elements['view-chronology-button']].forEach(function (button) {
      button.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        var view = button.dataset.view === 'map' ? 'chronology' : 'map';
        setView(view);
        elements[view === 'map' ? 'view-map-button' : 'view-chronology-button'].focus();
      });
    });
    elements['range-start'].addEventListener('change', function (event) { updateRange(event.target.value, state.end); });
    elements['range-end'].addEventListener('change', function (event) { updateRange(state.start, event.target.value); });
    elements['preset-buttons'].addEventListener('click', function (event) {
      var button = event.target.closest('[data-preset]');
      if (!button) return;
      var preset = activeData.presets.find(function (item) { return item.id === button.dataset.preset; });
      if (preset.region) state.region = preset.region;
      updateRange(preset.start, preset.end);
    });
    elements['reset-button'].addEventListener('click', function () {
      stopPlayback(false);
      state = Object.assign({}, defaults, { theme: state.theme, lang: state.lang });
      render();
    });
    elements['export-button'].addEventListener('click', downloadCsv);
    elements['language-select'].addEventListener('change', function (event) {
      if (!isSupportedLocale(event.target.value)) return;
      state.lang = event.target.value;
      state.query = '';
      localStorage.setItem('parallel-worlds-language', state.lang);
      render();
    });
    elements['theme-button'].addEventListener('click', function () {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('parallel-worlds-theme', state.theme);
      render();
    });
    elements['share-button'].addEventListener('click', function () {
      var url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { showToast(t('linkCopied')); });
      } else {
        window.prompt(t('copyLinkPrompt'), url);
      }
    });
    elements['dialog-close'].addEventListener('click', closeDetails);
    elements['detail-dialog'].addEventListener('close', restoreDetailTrigger);
    elements['detail-dialog'].addEventListener('click', function (event) {
      if (event.target === elements['detail-dialog']) closeDetails();
    });
    elements['journey-open'].addEventListener('click', function () { openJourneyCatalog(''); });
    elements['journey-exit'].addEventListener('click', function () { finishJourney(false); });
    elements['journey-dialog'].addEventListener('cancel', function (event) {
      event.preventDefault();
      finishJourney(false);
    });
    elements['journey-content'].addEventListener('click', handleJourneyContentClick);
    elements['journey-content'].addEventListener('pointerdown', function (event) {
      var target = event.target && event.target.closest ? event.target : null;
      if (!target) return;
      if (target.closest('[data-journey-action], [data-journey-go], [data-journey-evidence], [data-journey-start]')) {
        suppressJourneyFocusPause = true;
        setTimeout(function () { suppressJourneyFocusPause = false; }, 0);
        return;
      }
      if (target.closest('.journey-body')) pauseJourneyForInteraction();
    });
    elements['journey-content'].addEventListener('focusin', handleJourneyFocusIn);
    elements['journey-content'].addEventListener('touchstart', function (event) {
      journeyTouchStart = event.touches && event.touches.length === 1 ? event.touches[0].clientX : null;
    }, { passive: true });
    elements['journey-content'].addEventListener('touchend', function (event) {
      if (!Number.isFinite(journeyTouchStart) || !event.changedTouches || event.changedTouches.length !== 1) return;
      var direction = journeyView.swipeDirection(journeyTouchStart, event.changedTouches[0].clientX, 56);
      journeyTouchStart = null;
      if (direction === 'next' || direction === 'previous') {
        journeyAutoplay = journeyState && journeyState.status === 'playing';
        dispatchJourney(direction, journeyNow());
      }
    }, { passive: true });
    document.addEventListener('selectionchange', function () {
      if (!isJourneyOpen() || !journeyState || journeyState.status !== 'playing') return;
      var selection = typeof window.getSelection === 'function' ? window.getSelection() : null;
      if (selection && String(selection).trim()) pauseJourneyForInteraction();
    });
    document.addEventListener('keydown', handleDocumentKeydown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (reducedMotion && typeof reducedMotion.addEventListener === 'function') {
      reducedMotion.addEventListener('change', handleReducedMotionChange);
    } else if (reducedMotion && typeof reducedMotion.addListener === 'function') {
      reducedMotion.addListener(handleReducedMotionChange);
    }
  }

  function init() {
    collectElements();
    readUrlState();
    initializeSources();
    bindEvents();
    renderStats();
    render();
    openDirectJourney();
  }

  function installJourneyControllerTestApi(target) {
    target.api = {
      setContext: function (context) {
        context = context || {};
        if (Object.prototype.hasOwnProperty.call(context, 'state')) state = context.state;
        if (Object.prototype.hasOwnProperty.call(context, 'elements')) elements = context.elements;
        if (Object.prototype.hasOwnProperty.call(context, 'route')) journeyRoute = context.route;
        if (Object.prototype.hasOwnProperty.call(context, 'playerState')) journeyState = context.playerState;
        if (Object.prototype.hasOwnProperty.call(context, 'preJourneyState')) preJourneyState = context.preJourneyState;
        if (Object.prototype.hasOwnProperty.call(context, 'autoplay')) journeyAutoplay = context.autoplay;
        if (Object.prototype.hasOwnProperty.call(context, 'journeyTrigger')) journeyTrigger = context.journeyTrigger;
        if (Object.prototype.hasOwnProperty.call(context, 'detailTrigger')) detailTrigger = context.detailTrigger;
      },
      snapshot: function () {
        return {
          state: state,
          route: journeyRoute,
          playerState: journeyState,
          preJourneyState: preJourneyState,
          autoplay: journeyAutoplay,
          journeyTrigger: journeyTrigger,
          detailTrigger: detailTrigger,
          focusIdentity: journeyFocusIdentity,
          announcementGeneration: journeyAnnouncementGeneration
        };
      },
      armTransition: armJourneyTransition,
      activateEvidence: activateJourneyEvidence,
      closeDetails: closeDetails,
      closeJourneyDialog: closeJourneyDialog,
      dispatch: dispatchJourney,
      handleFocusIn: handleJourneyFocusIn,
      handleKeydown: handleDocumentKeydown,
      handleVisibilityChange: handleVisibilityChange,
      handleContentClick: handleJourneyContentClick,
      openCatalog: openJourneyCatalog,
      openDetails: openDetails,
      renderJourney: renderJourney,
      renderMap: renderJourneyMap,
      share: shareJourney,
      handleAction: handleJourneyAction,
      start: startJourney,
      startClock: startJourneyClock,
      finish: finishJourney,
      resolveExitState: resolveJourneyExitState
    };
  }

  if (window.__PARALLEL_WORLDS_CONTROLLER_TEST__ &&
      typeof window.__PARALLEL_WORLDS_CONTROLLER_TEST__ === 'object') {
    installJourneyControllerTestApi(window.__PARALLEL_WORLDS_CONTROLLER_TEST__);
  } else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
