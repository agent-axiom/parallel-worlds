(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsJourneyView = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAX_ROUTES = 100;
  var MAX_STOPS = 8;
  var FOCUSABLE_SELECTOR = 'button:not([disabled]), a[href], input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var FALLBACK_COPY = {
    catalogTitle: 'Journeys',
    startJourney: 'Start journey',
    minutesTemplate: '{minutes} min',
    stopsTemplate: '{count} stops',
    previousStop: 'Previous stop',
    nextStop: 'Next stop',
    pauseJourney: 'Pause journey',
    resumeJourney: 'Resume journey',
    shareJourney: 'Share journey',
    openEvidence: 'Open evidence',
    stopTemplate: 'Stop {current} of {total}',
    completeKicker: 'Journey complete',
    exploreMoment: 'Explore this moment',
    replayJourney: 'Replay journey',
    backCatalog: 'Back to journeys'
  };

  function read(value, key) {
    try {
      return { ok: true, value: value[key] };
    } catch (_) {
      return { ok: false, value: undefined };
    }
  }

  function own(value, key) {
    var descriptor;
    if (!value || typeof value !== 'object' && typeof value !== 'function') {
      return { ok: false, value: undefined };
    }
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch (_) {
      return { ok: false, value: undefined };
    }
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
      return { ok: false, value: undefined };
    }
    return { ok: true, value: descriptor.value };
  }

  function ownValue(value, key) {
    var result = own(value, key);
    return result.ok ? result.value : undefined;
  }

  function ownString(value, key) {
    var result = own(value, key);
    return result.ok && typeof result.value === 'string' ? result.value : '';
  }

  function ownNonEmptyString(value, key) {
    var result = own(value, key);
    return result.ok && typeof result.value === 'string' && Boolean(result.value.trim())
      ? result.value
      : '';
  }

  function safeString(value) {
    if (value === undefined || value === null) return '';
    try {
      return String(value);
    } catch (_) {
      return '';
    }
  }

  function escapeHtml(value) {
    return safeString(value).replace(/[&<>"']/g, function (character) {
      if (character === '&') return '&amp;';
      if (character === '<') return '&lt;';
      if (character === '>') return '&gt;';
      if (character === '"') return '&quot;';
      return '&#39;';
    });
  }

  function template(value, values) {
    return safeString(value).replace(/\{(\w+)\}/g, function (_, key) {
      var replacement = own(values, key);
      if (!replacement.ok || replacement.value === undefined) return '{' + key + '}';
      return safeString(replacement.value);
    });
  }

  function arrayLength(value, maximum) {
    var length;
    if (!Array.isArray(value)) return -1;
    length = ownValue(value, 'length');
    if (!Number.isFinite(length) || Math.floor(length) !== length || length < 0) return -1;
    return Math.min(length, maximum);
  }

  function arrayEntry(value, index) {
    return ownValue(value, String(index));
  }

  function copyText(copy, key) {
    var value = ownString(copy, key);
    return value && value.trim() ? value : ownString(FALLBACK_COPY, key);
  }

  function catalogHtml(routes, copy) {
    var routeCount = arrayLength(routes, MAX_ROUTES);
    var cards = [];
    var index;
    var route;
    var id;
    var title;
    var stops;
    var stopCount;
    var duration;
    var minutes;

    if (routeCount > 0) {
      for (index = 0; index < routeCount; index += 1) {
        route = arrayEntry(routes, index);
        id = ownNonEmptyString(route, 'id');
        title = ownNonEmptyString(route, 'title');
        stops = ownValue(route, 'stops');
        stopCount = arrayLength(stops, MAX_STOPS);
        if (!id || !title || stopCount < 0) continue;
        duration = ownValue(route, 'durationSeconds');
        minutes = Number.isFinite(duration) && duration > 0 ? Math.round(duration / 60) : 0;
        cards.push('<article class="journey-card">' +
          '<div class="journey-card-map" aria-hidden="true"></div>' +
          '<h3>' + escapeHtml(title) + '</h3>' +
          '<p class="journey-card-summary">' + escapeHtml(ownString(route, 'summary')) + '</p>' +
          '<p class="journey-card-meta"><span>' + escapeHtml(template(copyText(copy, 'minutesTemplate'), {
            minutes: minutes
          })) + '</span><span>' + escapeHtml(template(copyText(copy, 'stopsTemplate'), {
            count: stopCount
          })) + '</span></p>' +
          '<button type="button" data-journey-start="' + escapeHtml(id) + '">' +
          escapeHtml(copyText(copy, 'startJourney')) + '</button></article>');
      }
    }

    return '<section class="journey-catalog"><h2>' + escapeHtml(copyText(copy, 'catalogTitle')) +
      '</h2><div class="journey-cards">' + cards.join('') + '</div></section>';
  }

  function validStop(stop) {
    return Boolean(ownNonEmptyString(stop, 'id')) && typeof ownValue(stop, 'year') === 'number' &&
      Number.isFinite(ownValue(stop, 'year')) && typeof ownValue(stop, 'headline') === 'string' &&
      typeof ownValue(stop, 'body') === 'string';
  }

  function formattedYear(stop, formatYear) {
    var formatter = typeof formatYear === 'function' ? formatYear : safeString;
    try {
      return formatter(ownValue(stop, 'year'));
    } catch (_) {
      return '';
    }
  }

  function evidenceRecord(stop) {
    var records = ownValue(stop, 'records');
    var count = arrayLength(records, MAX_STOPS);
    var index;
    var resolved;
    var track;
    var ref;
    var record;
    var trackId;
    var recordId;
    if (count < 1) return null;
    for (index = 0; index < count; index += 1) {
      resolved = arrayEntry(records, index);
      track = ownValue(resolved, 'track');
      ref = ownValue(resolved, 'ref');
      record = ownValue(resolved, 'record');
      trackId = ownNonEmptyString(track, 'id');
      recordId = ownNonEmptyString(ref, 'periodId') || ownNonEmptyString(ref, 'eventId') ||
        ownNonEmptyString(record, 'id');
      if (trackId && recordId) return { trackId: trackId, recordId: recordId };
    }
    return null;
  }

  function progressHtml(stops, stopCount, currentIndex, stopTemplate) {
    var segments = [];
    var index;
    var stop;
    var label;
    for (index = 0; index < stopCount; index += 1) {
      stop = arrayEntry(stops, index);
      label = template(stopTemplate, { current: index + 1, total: stopCount });
      if (!label) label = ownString(stop, 'headline');
      segments.push('<button type="button" data-journey-go="' + index + '" aria-label="' +
        escapeHtml(label) + '"' + (index === currentIndex ? ' aria-current="step"' : '') + '></button>');
    }
    return segments.join('');
  }

  function stageHtml(route, state, copy, formatYear) {
    var title = ownNonEmptyString(route, 'title');
    var stops = ownValue(route, 'stops');
    var stopCount = arrayLength(stops, MAX_STOPS);
    var index = ownValue(state, 'stopIndex');
    var stop;
    var stopId;
    var headline;
    var body;
    var year;
    var progress;
    var status;
    var toggleLabel;
    var toggleDisabled;
    var evidence;
    var evidenceHtml = '';
    if (!title || stopCount < 1 || !Number.isFinite(index) || Math.floor(index) !== index ||
        index < 0 || index >= stopCount) return '';
    stop = arrayEntry(stops, index);
    if (!validStop(stop)) return '';

    stopId = ownNonEmptyString(stop, 'id');
    headline = ownString(stop, 'headline');
    body = ownString(stop, 'body');
    year = safeString(formattedYear(stop, formatYear));
    progress = template(copyText(copy, 'stopTemplate'), { current: index + 1, total: stopCount });
    status = ownValue(state, 'status');
    toggleLabel = status === 'playing' ? copyText(copy, 'pauseJourney') : copyText(copy, 'resumeJourney');
    toggleDisabled = status === 'transitioning';
    evidence = evidenceRecord(stop);
    if (evidence) {
      evidenceHtml = '<button type="button" data-journey-evidence="' + escapeHtml(evidence.trackId) +
        '" data-record-id="' + escapeHtml(evidence.recordId) + '">' +
        escapeHtml(copyText(copy, 'openEvidence')) + '</button>';
    }

    return '<article class="journey-stage" data-journey-stop="' + escapeHtml(stopId) + '">' +
      '<div class="journey-map-layer" aria-hidden="true"><div data-journey-world></div>' +
      '<div data-journey-regions></div></div>' +
      '<header class="journey-stage-header"><p class="journey-route-title">' + escapeHtml(title) + '</p>' +
      '<p class="journey-progress-text">' + escapeHtml(progress) + '</p>' +
      '<p class="journey-year">' + escapeHtml(year) + '</p></header>' +
      '<span data-journey-announcement-source hidden>' +
      escapeHtml(headline + ' · ' + year) + '</span>' +
      '<h2>' + escapeHtml(headline) + '</h2><p class="journey-body">' + escapeHtml(body) + '</p>' +
      '<nav class="journey-progress" aria-label="' + escapeHtml(progress) + '">' +
      progressHtml(stops, stopCount, index, copyText(copy, 'stopTemplate')) + '</nav>' +
      '<div class="journey-clock" data-journey-clock><span data-journey-countdown aria-hidden="true" hidden></span></div>' +
      '<div class="journey-controls">' +
      '<button type="button" data-journey-action="previous"' + (index === 0 ? ' disabled' : '') + '>' +
      escapeHtml(copyText(copy, 'previousStop')) + '</button>' +
      '<button type="button" data-journey-action="toggle"' +
      (toggleDisabled ? ' disabled aria-disabled="true"' : '') + '>' + escapeHtml(toggleLabel) + '</button>' +
      '<button type="button" data-journey-action="next">' + escapeHtml(copyText(copy, 'nextStop')) + '</button>' +
      '<button type="button" data-journey-action="share">' + escapeHtml(copyText(copy, 'shareJourney')) + '</button>' +
      evidenceHtml + '</div></article>';
  }

  function completeHtml(route, copy) {
    var title = ownNonEmptyString(route, 'title');
    var conclusion = ownNonEmptyString(route, 'conclusion');
    if (!title || !conclusion) return '';
    return '<article class="journey-complete"><p class="journey-complete-kicker">' +
      escapeHtml(copyText(copy, 'completeKicker')) + '</p><h2>' + escapeHtml(title) + '</h2><p>' +
      escapeHtml(conclusion) + '</p><div class="journey-complete-actions">' +
      '<button type="button" data-journey-action="explore">' + escapeHtml(copyText(copy, 'exploreMoment')) + '</button>' +
      '<button type="button" data-journey-action="replay">' + escapeHtml(copyText(copy, 'replayJourney')) + '</button>' +
      '<button type="button" data-journey-action="catalog">' + escapeHtml(copyText(copy, 'backCatalog')) + '</button>' +
      '<button type="button" data-journey-action="share">' + escapeHtml(copyText(copy, 'shareJourney')) + '</button>' +
      '</div></article>';
  }

  function query(root, selector) {
    var querySelector = read(root, 'querySelector');
    if (!querySelector.ok || typeof querySelector.value !== 'function') return null;
    try {
      return querySelector.value.call(root, selector);
    } catch (_) {
      return null;
    }
  }

  function assign(node, key, value) {
    try {
      node[key] = value;
    } catch (_) {
      return false;
    }
    return true;
  }

  function updateClock(root, value) {
    var countdown = query(root, '[data-journey-countdown]');
    var clock = query(root, '[data-journey-clock]');
    var rawProgress = ownValue(value, 'stopProgress');
    var rawCountdown = ownValue(value, 'countdownSeconds');
    var progress = Number.isFinite(rawProgress) ? Math.max(0, Math.min(1, rawProgress)) : 0;
    var visible = Number.isFinite(rawCountdown) && Math.floor(rawCountdown) === rawCountdown &&
      rawCountdown >= 1 && rawCountdown <= 5;
    var style;
    var setProperty;

    if (clock) {
      style = read(clock, 'style');
      if (style.ok && style.value) {
        setProperty = read(style.value, 'setProperty');
        if (setProperty.ok && typeof setProperty.value === 'function') {
          try {
            setProperty.value.call(style.value, '--journey-progress', String(progress));
          } catch (_) {
            // A malformed fake style object must not break journey playback.
          }
        }
      }
    }
    if (countdown) {
      assign(countdown, 'textContent', visible ? String(rawCountdown) : '');
      assign(countdown, 'hidden', !visible);
    }
  }

  function callable(value, key) {
    var property = read(value, key);
    return property.ok && typeof property.value === 'function' ? property.value : null;
  }

  function callSafely(receiver, fn, argument) {
    if (!fn) return;
    try {
      fn.call(receiver, argument);
    } catch (_) {
      // Focus and synthetic event fakes are allowed to reject calls.
    }
  }

  function hiddenAttribute(value) {
    return value === true || typeof value === 'string' && value.toLowerCase() === 'true';
  }

  function hasReference(values, candidate) {
    var index;
    for (index = 0; index < values.length; index += 1) {
      if (values[index] === candidate) return true;
    }
    return false;
  }

  function attributeBlocked(node) {
    var getAttribute = read(node, 'getAttribute');
    var ariaHidden;
    var hidden;
    var inert;
    if (!getAttribute.ok) return true;
    if (getAttribute.value === undefined || getAttribute.value === null) return false;
    if (typeof getAttribute.value !== 'function') return true;
    try {
      ariaHidden = getAttribute.value.call(node, 'aria-hidden');
      hidden = getAttribute.value.call(node, 'hidden');
      inert = getAttribute.value.call(node, 'inert');
    } catch (_) {
      return true;
    }
    return hiddenAttribute(ariaHidden) || hidden !== null && hidden !== undefined ||
      inert !== null && inert !== undefined;
  }

  function cssBlocked(node) {
    var ownerDocument = read(node, 'ownerDocument');
    var defaultView;
    var getComputedStyle;
    var style;
    var display;
    var visibility;
    if (!ownerDocument.ok) return true;
    if (!ownerDocument.value) return false;
    defaultView = read(ownerDocument.value, 'defaultView');
    if (!defaultView.ok) return true;
    if (!defaultView.value) return false;
    getComputedStyle = read(defaultView.value, 'getComputedStyle');
    if (!getComputedStyle.ok) return true;
    if (typeof getComputedStyle.value !== 'function') return false;
    try {
      style = getComputedStyle.value.call(defaultView.value, node);
    } catch (_) {
      return true;
    }
    if (!style) return false;
    display = read(style, 'display');
    visibility = read(style, 'visibility');
    if (!display.ok || !visibility.ok) return true;
    return display.value === 'none' || visibility.value === 'hidden';
  }

  function treeBlocked(node) {
    var current = node;
    var visited = [];
    var hidden;
    var inert;
    var connected;
    var parent;
    while (current && (typeof current === 'object' || typeof current === 'function')) {
      if (visited.length >= 100 || hasReference(visited, current)) return true;
      visited.push(current);
      hidden = read(current, 'hidden');
      inert = read(current, 'inert');
      connected = read(current, 'isConnected');
      if (!hidden.ok || !inert.ok || !connected.ok) return true;
      if (hidden.value || inert.value || connected.value === false || attributeBlocked(current) ||
          cssBlocked(current)) return true;
      parent = read(current, 'parentElement');
      if (!parent.ok) return true;
      if (parent.value === undefined) {
        parent = read(current, 'parentNode');
        if (!parent.ok) return true;
      }
      current = parent.value;
    }
    return false;
  }

  function focusable(node, order) {
    var disabled;
    var tabIndex;
    var focus;
    if (!node || typeof node !== 'object' && typeof node !== 'function') return false;
    disabled = read(node, 'disabled');
    tabIndex = read(node, 'tabIndex');
    focus = read(node, 'focus');
    if (!disabled.ok || !tabIndex.ok || !focus.ok || disabled.value ||
        typeof focus.value !== 'function') return null;
    if (typeof tabIndex.value === 'number' && (!Number.isFinite(tabIndex.value) || tabIndex.value < 0)) return null;
    if (treeBlocked(node)) return null;
    return {
      node: node,
      tabIndex: typeof tabIndex.value === 'number' ? tabIndex.value : 0,
      order: order
    };
  }

  function compareFocusOrder(left, right) {
    var leftPositive = left.tabIndex > 0;
    var rightPositive = right.tabIndex > 0;
    if (leftPositive !== rightPositive) return leftPositive ? -1 : 1;
    if (leftPositive && left.tabIndex !== right.tabIndex) return left.tabIndex - right.tabIndex;
    return left.order - right.order;
  }

  function focusTransferred(target, fallbackDocument) {
    var connected = read(target, 'isConnected');
    var focus = read(target, 'focus');
    var ownerDocument;
    var activeElement;
    if (!connected.ok || connected.value === false || !focus.ok || typeof focus.value !== 'function') return false;
    try {
      focus.value.call(target);
    } catch (_) {
      return false;
    }
    connected = read(target, 'isConnected');
    if (!connected.ok || connected.value === false) return false;
    ownerDocument = read(target, 'ownerDocument');
    if (!ownerDocument.ok) return false;
    ownerDocument = ownerDocument.value || fallbackDocument;
    if (!ownerDocument) return true;
    activeElement = read(ownerDocument, 'activeElement');
    if (!activeElement.ok) return false;
    return activeElement.value === undefined || activeElement.value === target;
  }

  function preventTab(event) {
    callSafely(event, callable(event, 'preventDefault'));
  }

  function trapTab(event, dialog) {
    var key = read(event, 'key');
    var querySelectorAll;
    var nodeList;
    var length;
    var nodes = [];
    var controls = [];
    var index;
    var node;
    var ownerDocument;
    var activeElement;
    var shiftKey;
    var activeIndex = -1;
    var direction;
    var startIndex;
    var attemptCount;
    var attempt;
    var candidate;
    if (!key.ok || key.value !== 'Tab') return false;
    querySelectorAll = callable(dialog, 'querySelectorAll');
    if (!querySelectorAll) return false;
    try {
      nodeList = querySelectorAll.call(dialog, FOCUSABLE_SELECTOR);
    } catch (_) {
      return false;
    }
    length = read(nodeList, 'length');
    if (!length.ok || !Number.isFinite(length.value) || Math.floor(length.value) !== length.value ||
        length.value < 0) return false;
    length = Math.min(length.value, 1000);
    for (index = 0; index < length; index += 1) {
      node = read(nodeList, String(index));
      if (!node.ok || hasReference(nodes, node.value)) continue;
      nodes.push(node.value);
      candidate = focusable(node.value, index);
      if (candidate) controls.push(candidate);
    }
    controls.sort(compareFocusOrder);

    ownerDocument = read(dialog, 'ownerDocument');
    ownerDocument = ownerDocument.ok ? ownerDocument.value : null;

    if (!controls.length) {
      if (!focusTransferred(dialog, ownerDocument)) return false;
      preventTab(event);
      return true;
    }

    if (ownerDocument) {
      activeElement = read(ownerDocument, 'activeElement');
      activeElement = activeElement.ok ? activeElement.value : undefined;
    }
    for (index = 0; index < controls.length; index += 1) {
      if (controls[index].node === activeElement) {
        activeIndex = index;
        break;
      }
    }
    shiftKey = read(event, 'shiftKey');
    shiftKey = shiftKey.ok && Boolean(shiftKey.value);
    direction = shiftKey ? -1 : 1;
    if (activeIndex < 0) {
      startIndex = shiftKey ? controls.length - 1 : 0;
      attemptCount = controls.length;
    } else if (shiftKey && activeIndex === 0) {
      startIndex = controls.length - 1;
      attemptCount = controls.length === 1 ? 1 : controls.length - 1;
    } else if (!shiftKey && activeIndex === controls.length - 1) {
      startIndex = 0;
      attemptCount = controls.length === 1 ? 1 : controls.length - 1;
    } else {
      return false;
    }

    for (attempt = 0; attempt < attemptCount; attempt += 1) {
      index = (startIndex + direction * attempt + controls.length) % controls.length;
      if (focusTransferred(controls[index].node, ownerDocument)) {
        preventTab(event);
        return true;
      }
    }
    if (focusTransferred(dialog, ownerDocument)) {
      preventTab(event);
      return true;
    }
    return false;
  }

  function swipeDirection(startX, endX, threshold) {
    if (!Number.isFinite(startX) || !Number.isFinite(endX)) return 'none';
    if (arguments.length < 3) threshold = 56;
    if (!Number.isFinite(threshold) || threshold <= 0 || startX === endX) return 'none';
    if (Math.abs(endX - startX) < threshold) return 'none';
    return endX < startX ? 'next' : 'previous';
  }

  return {
    escapeHtml: escapeHtml,
    template: template,
    catalogHtml: catalogHtml,
    stageHtml: stageHtml,
    completeHtml: completeHtml,
    updateClock: updateClock,
    trapTab: trapTab,
    swipeDirection: swipeDirection
  };
}));
