(function () {
  'use strict';

  var rawData = window.PARALLEL_WORLDS_DATA;
  var timeline = window.ParallelTimeline;
  var i18n = window.ParallelWorldsI18n;
  var atlasData = window.PARALLEL_WORLDS_ATLAS_DATA;
  var insights = window.PARALLEL_WORLDS_INSIGHTS;
  var atlas = window.ParallelWorldsAtlas;
  var explorerState = window.ParallelWorldsExplorerState;
  var atlasView = window.ParallelWorldsAtlasView;
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
    year: -500, zoom: 100, lang: initialLocale(), view: 'map', focus: [], selectedRegion: '', playing: false, filtersOpen: false,
    theme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  };
  var state = Object.assign({}, defaults);
  var elements = {};
  var toastTimer;
  var playbackTimer;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  function get(id) { return document.getElementById(id); }
  function t(key, values) { return i18n.text(state.lang, key, values); }
  function formatYear(year) { return timeline.formatYear(year, state.lang); }

  function readUrlState() {
    var params = new URLSearchParams(window.location.search);
    state = explorerState.parse(params, defaults, rawData);
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
      'source-links', 'theme-button', 'language-select', 'share-button', 'toast', 'track-count', 'period-count', 'event-count',
      'filter-toggle', 'filters-content',
      'view-map-button', 'view-chronology-button', 'atlas-view', 'chronology-view', 'atlas-map', 'atlas-world',
      'atlas-regions', 'atlas-panel', 'atlas-region-list', 'atlas-play-button', 'atlas-year-input', 'atlas-year-output', 'atlas-map-summary']
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
    elements['search-input'].value = state.query;
    elements['region-select'].value = state.region;
    elements['type-select'].value = state.type;
    elements['zoom-input'].value = state.zoom;
    elements['zoom-output'].value = state.zoom + '%';
    elements['range-start'].value = state.start;
    elements['range-end'].value = state.end;
    elements['year-input'].min = state.start;
    elements['year-input'].max = state.end;
    elements['year-input'].value = state.year;
    elements['year-output'].textContent = formatYear(state.year);
    elements['atlas-year-input'].min = state.start;
    elements['atlas-year-input'].max = state.end;
    elements['atlas-year-input'].value = state.year;
    elements['atlas-year-output'].textContent = formatYear(state.year);
    elements['language-select'].value = state.lang;
    elements['filters-content'].classList.toggle('open', state.filtersOpen);
    elements['filter-toggle'].setAttribute('aria-expanded', String(state.filtersOpen));
    elements['filter-toggle'].firstElementChild.textContent = t(state.filtersOpen ? 'hideFilters' : 'showFilters');
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

  function atlasCopy() {
    return {
      regionNames: regionNames,
      activeRegionLabel: t('activeRegionLabel'),
      insightKicker: t('insightKicker'),
      openComparison: t('openComparison'),
      statsFallbackTitle: t('statsFallbackTitle'),
      statsTemplate: t('statsTemplate'),
      statTracks: t('statTracks'),
      statCivilizations: t('statCivilizations'),
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
    elements['atlas-world'].innerHTML = atlasView.worldSvg(t('atlasAria'));
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
    var ticks = [];
    for (var index = 0; index <= 10; index += 1) {
      var percent = index * 10;
      var year = Math.round(state.start + (state.end - state.start) * (index / 10));
      ticks.push('<div class="axis-tick" style="left:' + percent + '%"><span>' + escapeHtml(formatYear(year)) + '</span></div>');
    }
    return '<div class="timeline-axis"><div class="axis-corner">' + escapeHtml(t('linePeriod')) + '</div><div class="axis-plot">' + ticks.join('') + '</div></div>';
  }

  function trackHtml(track) {
    var periods = timeline.visiblePeriods(track, state.start, state.end).map(function (period) {
      var left = timeline.yearToPercent(period.clippedStart, state.start, state.end);
      var width = timeline.yearToPercent(period.clippedEnd, state.start, state.end) - left;
      var title = period.name + ': ' + formatYear(period.start) + ' — ' + formatYear(period.end);
      return '<div class="period" style="left:' + left + '%;width:' + Math.max(width, .12) + '%" title="' + escapeHtml(title) + '">' + escapeHtml(period.name) + '</div>';
    }).join('');
    var events = track.events.filter(function (event) { return event.year >= state.start && event.year <= state.end; }).map(function (event) {
      var left = timeline.yearToPercent(event.year, state.start, state.end);
      return '<span class="event-marker" style="left:' + left + '%" title="' + escapeHtml(formatYear(event.year) + ' — ' + event.title) + '"></span>';
    }).join('');
    var yearLeft = timeline.yearToPercent(state.year, state.start, state.end);
    var typeLabel = track.type === 'tradition' ? t('tradition') : t('civilization');
    var focusClass = state.focus.indexOf(track.id) !== -1 ? ' focused' : '';
    return '<div class="track-row ' + track.type + focusClass + '" role="listitem" style="--region-color:' + regionColors[track.region] + '">' +
      '<button class="track-label" type="button" data-track="' + track.id + '" title="' + escapeHtml(t('openDetails', { name: track.name })) + '">' +
      '<span class="track-label-marker"></span><span class="track-label-text"><strong>' + escapeHtml(track.name) + '</strong><small>' + escapeHtml(regionNames[track.region]) + ' · ' + typeLabel + '</small></span></button>' +
      '<div class="track-plot">' + periods + events + '<span class="current-year-line" style="left:' + yearLeft + '%"></span></div></div>';
  }

  function renderTimeline() {
    var tracks = filteredTracks();
    var baseWidth = Math.max(920, Math.round(((state.end - state.start) / (rawData.range.end - rawData.range.start)) * 1320));
    document.documentElement.style.setProperty('--plot-width', Math.round(baseWidth * state.zoom / 100) + 'px');
    elements.timeline.innerHTML = axisHtml() + tracks.map(trackHtml).join('');
    elements.timeline.hidden = tracks.length === 0;
    elements['empty-state'].hidden = tracks.length !== 0;
    Array.prototype.forEach.call(elements.timeline.querySelectorAll('[data-track]'), function (button) {
      button.addEventListener('click', function () { openDetails(button.dataset.track); });
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

  function openDetails(id) {
    var track = activeData.tracks.find(function (item) { return item.id === id; });
    if (!track) return;
    elements['dialog-title'].textContent = track.name;
    elements['dialog-meta'].textContent = regionNames[track.region] + ' · ' + (track.type === 'tradition' ? t('traditionMeta') : t('civilizationMeta'));
    elements['dialog-summary'].textContent = track.summary;
    elements['dialog-periods'].innerHTML = track.periods.map(function (period) {
      return '<li><strong>' + escapeHtml(period.name) + '</strong><span>' + escapeHtml(formatYear(period.start)) + ' — ' + escapeHtml(formatYear(period.end)) + '</span>' + (period.note ? '<p>' + escapeHtml(period.note) + '</p>' : '') + '</li>';
    }).join('');
    elements['dialog-events'].innerHTML = track.events.slice().sort(function (a, b) { return a.year - b.year; }).map(function (event) {
      return '<li><strong>' + escapeHtml(formatYear(event.year)) + '</strong><span>' + escapeHtml(event.title) + '</span>' + (event.note ? '<p>' + escapeHtml(event.note) + '</p>' : '') + '</li>';
    }).join('');
    elements['dialog-sources'].innerHTML = '<strong>' + escapeHtml(t('detailsSources')) + ' </strong>' + track.sources.map(function (sourceId) {
      var source = rawData.sources[sourceId];
      return '<a href="' + source.url + '" target="_blank" rel="noreferrer">' + escapeHtml(source.title) + ' ↗</a>';
    }).join(', ');
    if (typeof elements['detail-dialog'].showModal === 'function') elements['detail-dialog'].showModal();
    else elements['detail-dialog'].setAttribute('open', '');
  }

  function closeDetails() {
    if (typeof elements['detail-dialog'].close === 'function') elements['detail-dialog'].close();
    else elements['detail-dialog'].removeAttribute('open');
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
    if (reducedMotion && reducedMotion.matches) {
      state.year = atlas.nextPlaybackYear(state.year, state.start, state.end, 20);
      render();
      return;
    }
    if (playbackTimer) clearInterval(playbackTimer);
    state.playing = true;
    render();
    playbackTimer = setInterval(function () {
      state.year = atlas.nextPlaybackYear(state.year, state.start, state.end, 20);
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
    start = timeline.clamp(Number(start), rawData.range.start, rawData.range.end - 1);
    end = timeline.clamp(Number(end), start + 1, rawData.range.end);
    state.start = start;
    state.end = end;
    state.year = timeline.clamp(state.year, start, end);
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
      headers: [t('csvLine'), t('csvType'), t('csvRegion'), t('csvPeriod'), t('csvStart'), t('csvEnd'), t('csvNote')],
      typeNames: { civilization: t('civilization'), tradition: t('tradition') },
      regionNames: regionNames
    };
    var blob = new Blob(['\ufeff' + timeline.buildCsv(filteredTracks(), options)], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = t('csvFilename');
    link.click();
    URL.revokeObjectURL(url);
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
    elements['year-input'].addEventListener('input', function (event) { stopPlayback(false); state.year = Number(event.target.value); render(); });
    elements['atlas-year-input'].addEventListener('input', function (event) { stopPlayback(false); state.year = Number(event.target.value); render(); });
    elements['atlas-play-button'].addEventListener('click', function () {
      if (state.playing) stopPlayback(true);
      else startPlayback();
    });
    elements['view-map-button'].addEventListener('click', function () { setView('map'); });
    elements['view-chronology-button'].addEventListener('click', function () { setView('chronology'); });
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
    elements['detail-dialog'].addEventListener('click', function (event) {
      if (event.target === elements['detail-dialog']) closeDetails();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === '/' && document.activeElement.tagName !== 'INPUT') {
        event.preventDefault();
        elements['search-input'].focus();
      }
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopPlayback(true);
    });
  }

  function init() {
    collectElements();
    readUrlState();
    initializeSources();
    bindEvents();
    renderStats();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
