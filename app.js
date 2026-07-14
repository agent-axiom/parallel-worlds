(function () {
  'use strict';

  var data = window.PARALLEL_WORLDS_DATA;
  var timeline = window.ParallelTimeline;
  var regionColors = {
    mesopotamia: '#a7512d', 'west-asia': '#8d5b35', africa: '#b37a27', mediterranean: '#436b7b',
    'south-asia': '#9b3f62', 'east-asia': '#a63e36', 'central-asia': '#667348',
    'southeast-asia': '#258074', oceania: '#397e9c', americas: '#75609b'
  };
  var regionNames = {};
  data.regions.forEach(function (region) { regionNames[region.id] = region.name; });

  var defaults = {
    query: '', region: 'all', type: 'all', start: data.range.start, end: data.range.end,
    year: -500, zoom: 100, theme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  };
  var state = Object.assign({}, defaults);
  var elements = {};
  var toastTimer;

  function get(id) { return document.getElementById(id); }

  function readUrlState() {
    var params = new URLSearchParams(window.location.search);
    if (params.has('q')) state.query = params.get('q').slice(0, 100);
    if (data.regions.some(function (region) { return region.id === params.get('region'); })) state.region = params.get('region');
    if (['all', 'civilization', 'tradition'].indexOf(params.get('type')) !== -1) state.type = params.get('type');
    var start = timeline.numericParam(params, 'start');
    var end = timeline.numericParam(params, 'end');
    var year = timeline.numericParam(params, 'year');
    var zoom = timeline.numericParam(params, 'zoom');
    if (start !== undefined) state.start = timeline.clamp(start, data.range.start, data.range.end - 1);
    if (end !== undefined) state.end = timeline.clamp(end, state.start + 1, data.range.end);
    if (year !== undefined) state.year = timeline.clamp(year, state.start, state.end);
    if (zoom !== undefined) state.zoom = timeline.clamp(zoom, 75, 240);
    var savedTheme = localStorage.getItem('parallel-worlds-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') state.theme = savedTheme;
  }

  function writeUrlState() {
    var params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    if (state.region !== defaults.region) params.set('region', state.region);
    if (state.type !== defaults.type) params.set('type', state.type);
    if (state.start !== defaults.start) params.set('start', state.start);
    if (state.end !== defaults.end) params.set('end', state.end);
    if (state.year !== defaults.year) params.set('year', state.year);
    if (state.zoom !== defaults.zoom) params.set('zoom', state.zoom);
    var query = params.toString();
    history.replaceState(null, '', window.location.pathname + (query ? '?' + query : '') + window.location.hash);
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
      'source-links', 'theme-button', 'share-button', 'toast', 'track-count', 'period-count', 'event-count']
      .forEach(function (id) { elements[id] = get(id); });
  }

  function initializeControls() {
    data.regions.forEach(function (region) {
      var option = document.createElement('option');
      option.value = region.id;
      option.textContent = region.name;
      elements['region-select'].appendChild(option);
    });
    data.presets.forEach(function (preset) {
      var button = document.createElement('button');
      button.className = 'preset-button';
      button.type = 'button';
      button.dataset.preset = preset.id;
      button.textContent = preset.name;
      elements['preset-buttons'].appendChild(button);
    });
    Object.keys(data.sources).forEach(function (id) {
      var source = data.sources[id];
      var link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = source.title + ' ↗';
      elements['source-links'].appendChild(link);
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
    elements['year-output'].textContent = timeline.formatYear(state.year);
    document.documentElement.dataset.theme = state.theme;
    document.querySelector('meta[name="theme-color"]').setAttribute('content', state.theme === 'dark' ? '#191d1b' : '#f1eadb');
    Array.prototype.forEach.call(elements['preset-buttons'].children, function (button) {
      var preset = data.presets.find(function (item) { return item.id === button.dataset.preset; });
      button.classList.toggle('active', preset.start === state.start && preset.end === state.end && (!preset.region || preset.region === state.region));
    });
  }

  function filteredTracks() {
    return timeline.filterTracks(data.tracks, state);
  }

  function axisHtml() {
    var ticks = [];
    for (var index = 0; index <= 10; index += 1) {
      var percent = index * 10;
      var year = Math.round(state.start + (state.end - state.start) * (index / 10));
      ticks.push('<div class="axis-tick" style="left:' + percent + '%"><span>' + escapeHtml(timeline.formatYear(year)) + '</span></div>');
    }
    return '<div class="timeline-axis"><div class="axis-corner">Линия / период</div><div class="axis-plot">' + ticks.join('') + '</div></div>';
  }

  function trackHtml(track) {
    var periods = timeline.visiblePeriods(track, state.start, state.end).map(function (period) {
      var left = timeline.yearToPercent(period.clippedStart, state.start, state.end);
      var width = timeline.yearToPercent(period.clippedEnd, state.start, state.end) - left;
      var title = period.name + ': ' + timeline.formatYear(period.start) + ' — ' + timeline.formatYear(period.end);
      return '<div class="period" style="left:' + left + '%;width:' + Math.max(width, .12) + '%" title="' + escapeHtml(title) + '">' + escapeHtml(period.name) + '</div>';
    }).join('');
    var events = track.events.filter(function (event) { return event.year >= state.start && event.year <= state.end; }).map(function (event) {
      var left = timeline.yearToPercent(event.year, state.start, state.end);
      return '<span class="event-marker" style="left:' + left + '%" title="' + escapeHtml(timeline.formatYear(event.year) + ' — ' + event.title) + '"></span>';
    }).join('');
    var yearLeft = timeline.yearToPercent(state.year, state.start, state.end);
    var typeLabel = track.type === 'tradition' ? 'традиция' : 'цивилизация';
    return '<div class="track-row ' + track.type + '" role="listitem" style="--region-color:' + regionColors[track.region] + '">' +
      '<button class="track-label" type="button" data-track="' + track.id + '" title="Открыть подробности: ' + escapeHtml(track.name) + '">' +
      '<span class="track-label-marker"></span><span class="track-label-text"><strong>' + escapeHtml(track.name) + '</strong><small>' + escapeHtml(regionNames[track.region]) + ' · ' + typeLabel + '</small></span></button>' +
      '<div class="track-plot">' + periods + events + '<span class="current-year-line" style="left:' + yearLeft + '%"></span></div></div>';
  }

  function renderTimeline() {
    var tracks = filteredTracks();
    var baseWidth = Math.max(920, Math.round(((state.end - state.start) / (data.range.end - data.range.start)) * 1320));
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
    elements['contemporary-summary'].textContent = tracks.length + ' линий активны в ' + timeline.formatYear(state.year);
    if (!tracks.length) {
      elements['contemporary-list'].innerHTML = '<span class="no-contemporaries">В текущей выборке нет линий для этого года.</span>';
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
    var track = data.tracks.find(function (item) { return item.id === id; });
    if (!track) return;
    elements['dialog-title'].textContent = track.name;
    elements['dialog-meta'].textContent = regionNames[track.region] + ' · ' + (track.type === 'tradition' ? 'религия / традиция' : 'цивилизация / общество');
    elements['dialog-summary'].textContent = track.summary;
    elements['dialog-periods'].innerHTML = track.periods.map(function (period) {
      return '<li><strong>' + escapeHtml(period.name) + '</strong><span>' + escapeHtml(timeline.formatYear(period.start)) + ' — ' + escapeHtml(timeline.formatYear(period.end)) + '</span>' + (period.note ? '<p>' + escapeHtml(period.note) + '</p>' : '') + '</li>';
    }).join('');
    elements['dialog-events'].innerHTML = track.events.slice().sort(function (a, b) { return a.year - b.year; }).map(function (event) {
      return '<li><strong>' + escapeHtml(timeline.formatYear(event.year)) + '</strong><span>' + escapeHtml(event.title) + '</span>' + (event.note ? '<p>' + escapeHtml(event.note) + '</p>' : '') + '</li>';
    }).join('');
    elements['dialog-sources'].innerHTML = '<strong>Обзорные источники: </strong>' + track.sources.map(function (sourceId) {
      var source = data.sources[sourceId];
      return '<a href="' + source.url + '" target="_blank" rel="noreferrer">' + escapeHtml(source.title) + ' ↗</a>';
    }).join(', ');
    if (typeof elements['detail-dialog'].showModal === 'function') elements['detail-dialog'].showModal();
    else elements['detail-dialog'].setAttribute('open', '');
  }

  function renderStats() {
    var periodCount = data.tracks.reduce(function (sum, track) { return sum + track.periods.length; }, 0);
    var eventCount = data.tracks.reduce(function (sum, track) { return sum + track.events.length; }, 0);
    elements['track-count'].textContent = data.tracks.length;
    elements['period-count'].textContent = periodCount;
    elements['event-count'].textContent = eventCount;
  }

  function render() {
    syncControls();
    renderTimeline();
    renderContemporaries();
    writeUrlState();
  }

  function updateRange(start, end) {
    start = timeline.clamp(Number(start), data.range.start, data.range.end - 1);
    end = timeline.clamp(Number(end), start + 1, data.range.end);
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
    var blob = new Blob(['\ufeff' + timeline.buildCsv(filteredTracks())], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'parallel-worlds.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function bindEvents() {
    elements['search-input'].addEventListener('input', function (event) { state.query = event.target.value; render(); });
    elements['region-select'].addEventListener('change', function (event) { state.region = event.target.value; render(); });
    elements['type-select'].addEventListener('change', function (event) { state.type = event.target.value; render(); });
    elements['zoom-input'].addEventListener('input', function (event) { state.zoom = Number(event.target.value); render(); });
    elements['year-input'].addEventListener('input', function (event) { state.year = Number(event.target.value); render(); });
    elements['range-start'].addEventListener('change', function (event) { updateRange(event.target.value, state.end); });
    elements['range-end'].addEventListener('change', function (event) { updateRange(state.start, event.target.value); });
    elements['preset-buttons'].addEventListener('click', function (event) {
      var button = event.target.closest('[data-preset]');
      if (!button) return;
      var preset = data.presets.find(function (item) { return item.id === button.dataset.preset; });
      if (preset.region) state.region = preset.region;
      updateRange(preset.start, preset.end);
    });
    elements['reset-button'].addEventListener('click', function () {
      state = Object.assign({}, defaults, { theme: state.theme });
      render();
    });
    elements['export-button'].addEventListener('click', downloadCsv);
    elements['theme-button'].addEventListener('click', function () {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('parallel-worlds-theme', state.theme);
      render();
    });
    elements['share-button'].addEventListener('click', function () {
      var url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { showToast('Ссылка скопирована'); });
      } else {
        window.prompt('Скопируйте ссылку', url);
      }
    });
    elements['dialog-close'].addEventListener('click', function () { elements['detail-dialog'].close(); });
    elements['detail-dialog'].addEventListener('click', function (event) {
      if (event.target === elements['detail-dialog']) elements['detail-dialog'].close();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === '/' && document.activeElement.tagName !== 'INPUT') {
        event.preventDefault();
        elements['search-input'].focus();
      }
    });
  }

  function init() {
    collectElements();
    readUrlState();
    initializeControls();
    bindEvents();
    renderStats();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
