const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const data = require(path.join(root, 'data.js'));
const academicData = require(path.join(root, 'academic-data.js'));
const quality = require(path.join(root, 'data-quality.js'));
const journey = require(path.join(root, 'journey.js'));
const journeyView = require(path.join(root, 'journey-view.js'));
const journeysData = require(path.join(root, 'journeys-data.js'));
const chronology = require(path.join(root, 'chronology.js'));
const timeline = require(path.join(root, 'timeline.js'));
const i18n = require(path.join(root, 'i18n.js'));
const atlas = require(path.join(root, 'atlas.js'));
const atlasData = require(path.join(root, 'atlas-data.js'));
const worldMapData = require(path.join(root, 'world-map-data.js'));
const insights = require(path.join(root, 'insights.js'));
const explorerState = require(path.join(root, 'explorer-state.js'));
const atlasView = require(path.join(root, 'atlas-view.js'));
const edition = require(path.join(root, 'edition.js'));
const editionData = require(path.join(root, 'edition-data.js'));

let passed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('✓ ' + name);
  } catch (error) {
    console.error('✗ ' + name);
    throw error;
  }
}

function withInheritedArrayIndex(values, index, value) {
  const prototype = Object.create(Array.prototype);
  Object.defineProperty(prototype, String(index), { configurable: true, value: value });
  Object.setPrototypeOf(values, prototype);
  return values;
}

function arrayWithInheritedValue(value) {
  return withInheritedArrayIndex(new Array(1), 0, value);
}

function withObjectPrototypeProperties(properties, fn) {
  const keys = Object.keys(properties);
  const previous = Object.create(null);
  const defined = [];
  try {
    keys.forEach(function (key) {
      previous[key] = Object.getOwnPropertyDescriptor(Object.prototype, key);
      Object.defineProperty(Object.prototype, key, {
        configurable: true, writable: true, value: properties[key]
      });
      defined.push(key);
    });
    return fn();
  } finally {
    defined.reverse().forEach(function (key) {
      if (previous[key]) Object.defineProperty(Object.prototype, key, previous[key]);
      else delete Object.prototype[key];
    });
  }
}

function nullPrototypeClone(value) {
  if (Array.isArray(value)) return value.map(nullPrototypeClone);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).reduce(function (clone, key) {
    clone[key] = nullPrototypeClone(value[key]);
    return clone;
  }, Object.create(null));
}

function controllerState(overrides) {
  return Object.assign({
    query: '', region: 'all', type: 'all', start: data.range.start, end: data.range.end,
    year: -500, zoom: 100, lang: 'en', view: 'map', focus: [], selectedRegion: '',
    scaleMode: 'overview', playing: false, filtersOpen: false, theme: 'dark',
    journey: '', stop: '', journeyMode: 'paused', journeyNotice: ''
  }, overrides || {});
}

function makeJourneyControllerHarness() {
  const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const timers = { timeouts: [], intervals: [] };
  const reducerEvents = [];
  const serializedStates = [];
  const clipboardUrls = [];
  const historyUrls = [];
  const prompts = [];
  const control = {
    now: 100, rejectClipboard: false, throwClipboard: false, throwSerialize: false,
    reducedMotion: false
  };
  const bodyClasses = new Set(['journey-open']);
  const focusedHeadings = [];
  let documentObject;
  let windowObject;
  const stage = {
    listeners: {}, listenerOptions: {}, removed: [],
    closest: function (selector) { return selector === '.journey-stage' ? this : null; },
    addEventListener: function (type, listener, options) {
      this.listeners[type] = listener;
      this.listenerOptions[type] = options;
    },
    removeEventListener: function (type, listener) {
      if (this.listeners[type] === listener) delete this.listeners[type];
      this.removed.push([type, listener]);
    }
  };
  const worldTarget = { innerHTML: '' };
  const regionsTarget = { innerHTML: '' };
  const mapMarker = { tagName: 'BUTTON', tabIndex: 0, disabled: false };
  const mapLayer = {
    querySelectorAll: function () { return [mapMarker]; }
  };
  const announcementSource = { textContent: 'A stop · 18,000 BCE' };
  function decodeHtml(value) {
    return String(value || '')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }
  function focusNode(kind, stopId) {
    return {
      kind: kind,
      stopId: stopId || '',
      isConnected: true,
      tabIndex: -1,
      focusCount: 0,
      closest: function (selector) {
        return selector === '[data-journey-stop]' && kind === 'stage' ? stage : null;
      },
      focus: function () {
        this.focusCount += 1;
        if (documentObject) documentObject.activeElement = this;
        focusedHeadings.push(this);
        var controller = windowObject && windowObject.__PARALLEL_WORLDS_CONTROLLER_TEST__;
        if (controller && controller.api && controller.api.handleFocusIn) {
          controller.api.handleFocusIn({ target: this });
        }
      }
    };
  }
  let contentHtml = '';
  const content = {
    renderCount: 0,
    currentHeading: null,
    currentEvidenceTrigger: null,
    currentControls: [],
    currentCatalogMaps: [],
    set innerHTML(value) {
      this.renderCount += 1;
      if (this.currentHeading) this.currentHeading.isConnected = false;
      this.currentControls.forEach(function (control) { control.isConnected = false; });
      contentHtml = String(value || '');
      this.currentCatalogMaps = Array.from(contentHtml.matchAll(/class="journey-card-map"/g)).map(function () {
        return { innerHTML: '' };
      });
      const sourceMatch = /data-journey-announcement-source hidden>([\s\S]*?)<\/span>/.exec(contentHtml);
      announcementSource.textContent = sourceMatch ? decodeHtml(sourceMatch[1]) : '';
      const stopMatch = /data-journey-stop="([^"]+)"/.exec(contentHtml);
      if (contentHtml.indexOf('class="journey-catalog"') !== -1) {
        this.currentHeading = focusNode('catalog');
      } else if (stopMatch) {
        this.currentHeading = focusNode('stage', decodeHtml(stopMatch[1]));
      } else if (contentHtml.indexOf('class="journey-complete"') !== -1) {
        this.currentHeading = focusNode('complete');
      } else {
        this.currentHeading = null;
      }
      this.currentControls = Array.from(contentHtml.matchAll(/<button([^>]*)>/g)).map(function (match) {
        const attributes = match[1];
        function attribute(name) {
          const result = new RegExp('\\s' + name + '="([^"]*)"').exec(attributes);
          return result ? decodeHtml(result[1]) : undefined;
        }
        const control = focusNode('control');
        control.dataset = {
          journeyAction: attribute('data-journey-action'),
          journeyGo: attribute('data-journey-go'),
          journeyEvidence: attribute('data-journey-evidence'),
          recordId: attribute('data-record-id'),
          journeyStart: attribute('data-journey-start')
        };
        control.closest = function (selector) {
          return selector === '[data-journey-stop]' && stopMatch ? stage : null;
        };
        return control;
      }).filter(function (control) {
        return Object.keys(control.dataset).some(function (key) { return control.dataset[key] !== undefined; });
      });
      this.currentEvidenceTrigger = this.currentControls.filter(function (control) {
        return control.dataset.journeyEvidence !== undefined;
      })[0] || null;
    },
    get innerHTML() { return contentHtml; },
    contains: function (node) {
      return node === this.currentHeading || this.currentControls.indexOf(node) !== -1;
    },
    querySelector: function (selector) {
      return {
        '[data-journey-stop]': stage,
        '.journey-stage': stage,
        '.journey-map-layer': mapLayer,
        '[data-journey-world]': worldTarget,
        '[data-journey-regions]': regionsTarget,
        '[data-journey-announcement-source]': announcementSource,
        'h2[tabindex="-1"]': this.currentHeading
      }[selector] || null;
    },
    querySelectorAll: function (selector) {
      if (selector === '[data-journey-evidence]') {
        return this.currentControls.filter(function (control) {
          return control.dataset.journeyEvidence !== undefined;
        });
      }
      if (selector === '[data-journey-action], [data-journey-go], [data-journey-evidence], [data-journey-start]') {
        return this.currentControls.slice();
      }
      if (selector === '.journey-card-map') return this.currentCatalogMaps.slice();
      return [];
    }
  };
  const dialog = {
    open: true,
    hasAttribute: function (name) { return name === 'open' && this.open; },
    setAttribute: function (name) { if (name === 'open') this.open = true; },
    removeAttribute: function (name) { if (name === 'open') this.open = false; },
    showModal: function () { this.open = true; },
    close: function () { this.open = false; }
  };
  const detailDialog = {
    open: false,
    hasAttribute: function (name) { return name === 'open' && this.open; },
    setAttribute: function (name) { if (name === 'open') this.open = true; },
    removeAttribute: function (name) { if (name === 'open') this.open = false; },
    showModal: function () { this.open = true; },
    close: function () { this.open = false; }
  };
  const selectedPeriodNode = {
    focused: false, scrolled: false,
    focus: function () { this.focused = true; },
    scrollIntoView: function () { this.scrolled = true; }
  };
  const selectedEventNode = {
    focused: false, scrolled: false,
    focus: function () { this.focused = true; },
    scrollIntoView: function () { this.scrolled = true; }
  };
  function detailList(selectedNode) {
    return {
      innerHTML: '',
      querySelector: function (selector) {
        return selector === '.emphasized' && this.innerHTML.indexOf('emphasized') !== -1
          ? selectedNode
          : null;
      }
    };
  }
  const periodList = detailList(selectedPeriodNode);
  const eventList = detailList(selectedEventNode);
  const toast = {
    textContent: '',
    classList: {
      add: function () {},
      remove: function () {}
    }
  };
  const elements = {
    'journey-dialog': dialog,
    'journey-content': content,
    'journey-announcement': { textContent: '' },
    'detail-dialog': detailDialog,
    'dialog-title': { textContent: '' },
    'dialog-meta': { innerHTML: '' },
    'dialog-summary': { textContent: '' },
    'dialog-periods': periodList,
    'dialog-events': eventList,
    'dialog-sources': { innerHTML: '' },
    toast: toast
  };
  const journeyModule = Object.assign({}, journey, {
    reduce: function (state, event, route, options) {
      reducerEvents.push(event.type);
      return journey.reduce(state, event, route, options);
    }
  });
  const explorerModule = Object.assign({}, explorerState, {
    serialize: function (value, defaults) {
      if (control.throwSerialize) throw new Error('serialize failed');
      serializedStates.push(JSON.parse(JSON.stringify(value)));
      return explorerState.serialize(value, defaults);
    }
  });
  function addTimer(collection, fn, ms) {
    const timer = { fn: fn, ms: ms, active: true };
    collection.push(timer);
    return timer;
  }
  windowObject = {
    PARALLEL_WORLDS_DATA: data,
    PARALLEL_WORLDS_JOURNEYS: journeysData,
    ParallelWorldsChronology: chronology,
    ParallelTimeline: timeline,
    ParallelWorldsI18n: i18n,
    PARALLEL_WORLDS_ATLAS_DATA: atlasData,
    PARALLEL_WORLDS_MAP_DATA: worldMapData,
    PARALLEL_WORLDS_INSIGHTS: insights,
    ParallelWorldsAtlas: atlas,
    ParallelWorldsExplorerState: explorerModule,
    ParallelWorldsAtlasView: atlasView,
    ParallelWorldsJourney: journeyModule,
    ParallelWorldsJourneyView: journeyView,
    __PARALLEL_WORLDS_CONTROLLER_TEST__: {},
    location: { search: '', pathname: '/parallel-worlds/', origin: 'https://example.test', hash: '' },
    prompt: function (_, url) { prompts.push(url); },
    matchMedia: function (query) {
      return {
        get matches() { return query === '(prefers-reduced-motion: reduce)' ? control.reducedMotion : false; },
        addEventListener: function () {}
      };
    },
    performance: { now: function () { return control.now; } },
    getSelection: function () { return ''; },
    innerWidth: 1200,
    innerHeight: 800
  };
  documentObject = {
    readyState: 'loading',
    addEventListener: function () {},
    body: {
      classList: {
        add: function (name) { bodyClasses.add(name); },
        remove: function (name) { bodyClasses.delete(name); }
      }
    },
    activeElement: null,
    hidden: false,
    documentElement: { dataset: {}, style: { setProperty: function () {} } },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; }
  };
  const navigatorObject = {
    language: 'en',
    clipboard: {
      writeText: function (url) {
        clipboardUrls.push(url);
        if (control.throwClipboard) throw new Error('clipboard unavailable');
        return {
          then: function (resolve, reject) {
            if (control.rejectClipboard) {
              if (reject) reject(new Error('clipboard denied'));
            } else if (resolve) {
              resolve();
            }
            return { catch: function () {} };
          }
        };
      }
    }
  };
  const context = {
    window: windowObject,
    document: documentObject,
    navigator: navigatorObject,
    localStorage: { getItem: function () { return null; }, setItem: function () {} },
    history: { replaceState: function (_, __, url) { historyUrls.push(url); } },
    URLSearchParams: URLSearchParams,
    Date: Date,
    Number: Number,
    Object: Object,
    String: String,
    Boolean: Boolean,
    Math: Math,
    Array: Array,
    Error: Error,
    setTimeout: function (fn, ms) { return addTimer(timers.timeouts, fn, ms); },
    clearTimeout: function (timer) { if (timer) timer.active = false; },
    setInterval: function (fn, ms) { return addTimer(timers.intervals, fn, ms); },
    clearInterval: function (timer) { if (timer) timer.active = false; }
  };
  windowObject.document = documentObject;
  windowObject.navigator = navigatorObject;
  vm.runInNewContext(source, context, { filename: 'app.js' });
  const api = windowObject.__PARALLEL_WORLDS_CONTROLLER_TEST__.api;
  return {
    api: api,
    bodyClasses: bodyClasses,
    clipboardUrls: clipboardUrls,
    content: content,
    control: control,
    dialog: dialog,
    detailDialog: detailDialog,
    document: documentObject,
    elements: elements,
    eventList: eventList,
    historyUrls: historyUrls,
    focusedHeadings: focusedHeadings,
    prompts: prompts,
    mapMarker: mapMarker,
    periodList: periodList,
    reducerEvents: reducerEvents,
    serializedStates: serializedStates,
    stage: stage,
    selectedEventNode: selectedEventNode,
    selectedPeriodNode: selectedPeriodNode,
    timers: timers
  };
}

test('directed journey resolves seven reviewed and exactly sourced stops', function () {
  const result = journey.validateCollection(journeysData, data);
  assert.deepStrictEqual(result.issues, []);
  assert.deepStrictEqual(result.routes[0].stops.map(function (stop) { return stop.year; }),
    [-18000, -9500, -7400, -7000, -3200, -3085, -3000]);
  assert.ok(result.routes[0].stops.every(function (stop) {
    return stop.records.every(function (record) { return record.track.reviewStatus === 'reviewed' && record.exactSourceIds.length > 0; });
  }));
});

test('directed journey validation fails closed for legacy tracks and bad dates', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  fixture.routes[0].stops[0].focusTrackIds = ['indus'];
  fixture.routes[0].stops[0].year = -17000;
  const codes = journey.validateCollection(fixture, data).issues.map(function (item) { return item.code; });
  assert.ok(codes.indexOf('legacy-journey-track') !== -1);
  assert.ok(codes.indexOf('journey-year-mismatch') !== -1);
});

test('directed journey validation requires complete RU EN ZH editorial copy', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  fixture.routes[0].stops[2].copy.zh.body = '   ';
  assert.ok(journey.validateCollection(fixture, data).issues.some(function (item) {
    return item.code === 'missing-localization' && item.path === 'routes[0].stops[2].copy.zh.body';
  }));
});

test('directed journey validation rejects equal non-finite event years', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  const fixtureData = JSON.parse(JSON.stringify(data));
  fixture.routes[0].stops[0].year = Infinity;
  fixtureData.tracks.filter(function (track) { return track.id === 'xianrendong'; })[0].events[0].year = Infinity;
  const result = journey.validateCollection(fixture, fixtureData);
  assert.deepStrictEqual(result.routes, []);
  assert.ok(result.issues.some(function (item) { return item.code === 'journey-year-mismatch'; }));
});

test('directed journey validation rejects sparse stop focus and record lists', function () {
  const sparseStops = JSON.parse(JSON.stringify(journeysData));
  delete sparseStops.routes[0].stops[0];
  const stopResult = journey.validateCollection(sparseStops, data);
  assert.deepStrictEqual(stopResult.routes, []);
  assert.ok(stopResult.issues.some(function (item) {
    return item.code === 'invalid-journey-entry' && item.path === 'routes[0].stops[0]';
  }));

  const sparseFocus = JSON.parse(JSON.stringify(journeysData));
  sparseFocus.routes[0].stops[0].focusTrackIds = new Array(1);
  const focusResult = journey.validateCollection(sparseFocus, data);
  assert.deepStrictEqual(focusResult.routes, []);
  assert.ok(focusResult.issues.some(function (item) { return item.code === 'invalid-focus'; }));

  const sparseRefs = JSON.parse(JSON.stringify(journeysData));
  sparseRefs.routes[0].stops[0].recordRefs = new Array(1);
  const refResult = journey.validateCollection(sparseRefs, data);
  assert.deepStrictEqual(refResult.routes, []);
  assert.ok(refResult.issues.some(function (item) { return item.code === 'invalid-record-ref'; }));
});

test('directed journey validation safely detects prototype-like duplicate ids', function () {
  const duplicateRoutes = JSON.parse(JSON.stringify(journeysData));
  duplicateRoutes.routes[0].id = 'constructor';
  duplicateRoutes.routes.push(JSON.parse(JSON.stringify(duplicateRoutes.routes[0])));
  const routeResult = journey.validateCollection(duplicateRoutes, data);
  assert.deepStrictEqual(routeResult.routes, []);
  assert.strictEqual(routeResult.issues.filter(function (item) {
    return item.code === 'duplicate-journey-id';
  }).length, 2);

  const duplicateStops = JSON.parse(JSON.stringify(journeysData));
  duplicateStops.routes[0].stops[0].id = 'constructor';
  duplicateStops.routes[0].stops[1].id = 'constructor';
  const stopResult = journey.validateCollection(duplicateStops, data);
  assert.deepStrictEqual(stopResult.routes, []);
  assert.strictEqual(stopResult.issues.filter(function (item) {
    return item.code === 'duplicate-stop-id';
  }).length, 2);
});

test('directed journey validation resolves a reviewed prototype-like track id', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  const fixtureData = JSON.parse(JSON.stringify(data));
  fixture.routes[0].stops[0].focusTrackIds = ['constructor'];
  fixture.routes[0].stops[0].recordRefs[0].trackId = 'constructor';
  fixtureData.tracks.filter(function (track) { return track.id === 'xianrendong'; })[0].id = 'constructor';
  const result = journey.validateCollection(fixture, fixtureData);
  assert.deepStrictEqual(result.issues, []);
  assert.strictEqual(result.routes[0].stops[0].records[0].track.id, 'constructor');
});

test('directed journey validation fails closed for malformed canonical tracks', function () {
  assert.deepStrictEqual(journey.validateCollection(journeysData, { tracks: {}, sources: data.sources }), {
    routes: [],
    issues: [{
      code: 'invalid-dataset',
      path: 'data.tracks',
      message: 'Canonical data tracks must be an array'
    }]
  });
});

test('directed journey validation fails closed for malformed collection routes', function () {
  [{ routes: {} }, {}].forEach(function (collection) {
    assert.deepStrictEqual(journey.validateCollection(collection, data), {
      routes: [],
      issues: [{
        code: 'invalid-journey-collection',
        path: 'routes',
        message: 'Journey collection routes must be an array'
      }]
    });
  });
});

test('directed journey validation requires a plain collection with own routes', function () {
  const inheritedRoutes = Object.create({
    routes: JSON.parse(JSON.stringify(journeysData.routes))
  });
  const nonPlainCollection = Object.create({ marker: true });
  nonPlainCollection.routes = JSON.parse(JSON.stringify(journeysData.routes));
  const objectPrototypeRoutes = withObjectPrototypeProperties({
    routes: JSON.parse(JSON.stringify(journeysData.routes))
  }, function () {
    return journey.validateCollection({}, data);
  });
  const expected = {
    routes: [],
    issues: [{
      code: 'invalid-journey-collection',
      path: 'routes',
      message: 'Journey collection routes must be an array'
    }]
  };

  [{ label: 'inherited routes', result: journey.validateCollection(inheritedRoutes, data) },
    { label: 'non-plain collection', result: journey.validateCollection(nonPlainCollection, data) },
    { label: 'Object.prototype routes', result: objectPrototypeRoutes }].forEach(function (fixture) {
    assert.deepStrictEqual(fixture.result, expected, fixture.label);
  });
});

test('directed journey validation requires own route structural fields', function () {
  ['id', 'durationSeconds', 'copy', 'stops'].forEach(function (field) {
    const fixture = JSON.parse(JSON.stringify(journeysData));
    delete fixture.routes[0][field];
    const result = journey.validateCollection(fixture, data);
    assert.deepStrictEqual(result.routes, [], field);
    assert.ok(result.issues.some(function (item) {
      return item.code === 'invalid-journey-entry' && item.path === 'routes[0].' + field;
    }), field);
  });

  const route = JSON.parse(JSON.stringify(journeysData.routes[0]));
  const inheritedResult = withObjectPrototypeProperties({
    id: route.id,
    durationSeconds: route.durationSeconds,
    copy: route.copy,
    stops: route.stops
  }, function () {
    return journey.validateCollection({ version: 1, routes: [{}] }, data);
  });
  assert.deepStrictEqual(inheritedResult.routes, []);
  assert.deepStrictEqual(inheritedResult.issues.map(function (item) {
    return [item.code, item.path];
  }).sort(), [
    ['invalid-journey-entry', 'routes[0].copy'],
    ['invalid-journey-entry', 'routes[0].durationSeconds'],
    ['invalid-journey-entry', 'routes[0].id'],
    ['invalid-journey-entry', 'routes[0].stops']
  ]);
});

test('directed journey validation accepts only finite integer durations from two to three minutes', function () {
  const canonical = journey.validateCollection(JSON.parse(JSON.stringify(journeysData)), data);
  assert.strictEqual(journeysData.routes[0].durationSeconds, 120);
  assert.strictEqual(canonical.routes.length, 1);
  assert.strictEqual(canonical.issues.some(function (item) {
    return item.code === 'invalid-journey-duration';
  }), false);

  [
    { label: 'string', value: '120' },
    { label: 'NaN', value: NaN },
    { label: 'fractional', value: 120.5 },
    { label: 'below range', value: 119 },
    { label: 'above range', value: 181 }
  ].forEach(function (fixture) {
    const collection = JSON.parse(JSON.stringify(journeysData));
    collection.routes[0].durationSeconds = fixture.value;
    const result = journey.validateCollection(collection, data);
    assert.deepStrictEqual(result.routes, [], fixture.label);
    assert.ok(result.issues.some(function (item) {
      return item.code === 'invalid-journey-duration' &&
        item.path === 'routes[0].durationSeconds';
    }), fixture.label);
  });
});

test('directed journey validation rejects an inherited route copy field', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  const inheritedCopy = fixture.routes[0].copy;
  delete fixture.routes[0].copy;
  const result = withObjectPrototypeProperties({ copy: inheritedCopy }, function () {
    return journey.validateCollection(fixture, data);
  });
  assert.deepStrictEqual(result.routes, []);
  assert.ok(result.issues.some(function (item) {
    return item.code === 'invalid-journey-entry' && item.path === 'routes[0].copy';
  }));
});

test('directed journey validation rejects sparse and inherited stop entries', function () {
  const inheritedObject = JSON.parse(JSON.stringify(journeysData));
  inheritedObject.routes[0].stops[0] = Object.create(inheritedObject.routes[0].stops[0]);

  const inheritedIndex = JSON.parse(JSON.stringify(journeysData));
  const inheritedStop = inheritedIndex.routes[0].stops[0];
  delete inheritedIndex.routes[0].stops[0];
  withInheritedArrayIndex(inheritedIndex.routes[0].stops, 0, inheritedStop);

  [{ label: 'inherited object', collection: inheritedObject },
    { label: 'inherited array index', collection: inheritedIndex }].forEach(function (fixture) {
    const result = journey.validateCollection(fixture.collection, data);
    assert.deepStrictEqual(result.routes, [], fixture.label);
    assert.ok(result.issues.some(function (item) {
      return item.code === 'invalid-journey-entry' && item.path === 'routes[0].stops[0]';
    }), fixture.label);
  });
});

test('directed journey validation requires own stop structural fields', function () {
  const fields = ['id', 'year', 'focusTrackIds', 'recordRefs', 'holdMs', 'copy'];
  fields.forEach(function (field) {
    const fixture = JSON.parse(JSON.stringify(journeysData));
    delete fixture.routes[0].stops[0][field];
    const result = journey.validateCollection(fixture, data);
    assert.deepStrictEqual(result.routes, [], field);
    assert.ok(result.issues.some(function (item) {
      return item.code === 'invalid-journey-entry' && item.path === 'routes[0].stops[0].' + field;
    }), field);
  });

  const stop = JSON.parse(JSON.stringify(journeysData.routes[0].stops[0]));
  const inheritedValues = fields.reduce(function (values, field) {
    values[field] = stop[field];
    return values;
  }, {});
  const fixture = JSON.parse(JSON.stringify(journeysData));
  fixture.routes[0].stops[0] = {};
  const inheritedResult = withObjectPrototypeProperties(inheritedValues, function () {
    return journey.validateCollection(fixture, data);
  });
  assert.deepStrictEqual(inheritedResult.routes, []);
  fields.forEach(function (field) {
    assert.ok(inheritedResult.issues.some(function (item) {
      return item.code === 'invalid-journey-entry' && item.path === 'routes[0].stops[0].' + field;
    }), field);
  });
});

test('directed journey validation rejects inherited copy containers locales and fields', function () {
  const inheritedContainer = JSON.parse(JSON.stringify(journeysData));
  inheritedContainer.routes[0].copy = Object.create(inheritedContainer.routes[0].copy);

  const inheritedLocaleObject = JSON.parse(JSON.stringify(journeysData));
  inheritedLocaleObject.routes[0].copy.ru = Object.create(inheritedLocaleObject.routes[0].copy.ru);

  const inheritedLocale = JSON.parse(JSON.stringify(journeysData));
  const russianCopy = inheritedLocale.routes[0].copy.ru;
  delete inheritedLocale.routes[0].copy.ru;
  const inheritedLocaleResult = withObjectPrototypeProperties({ ru: russianCopy }, function () {
    return journey.validateCollection(inheritedLocale, data);
  });

  const inheritedField = JSON.parse(JSON.stringify(journeysData));
  const title = inheritedField.routes[0].copy.ru.title;
  delete inheritedField.routes[0].copy.ru.title;
  const inheritedFieldResult = withObjectPrototypeProperties({ title: title }, function () {
    return journey.validateCollection(inheritedField, data);
  });

  [{ label: 'copy container', result: journey.validateCollection(inheritedContainer, data), path: 'routes[0].copy.ru.title' },
    { label: 'locale object', result: journey.validateCollection(inheritedLocaleObject, data), path: 'routes[0].copy.ru.title' },
    { label: 'inherited locale', result: inheritedLocaleResult, path: 'routes[0].copy.ru.title' },
    { label: 'inherited field', result: inheritedFieldResult, path: 'routes[0].copy.ru.title' }].forEach(function (fixture) {
    assert.deepStrictEqual(fixture.result.routes, [], fixture.label);
    assert.ok(fixture.result.issues.some(function (item) {
      return item.code === 'missing-localization' && item.path === fixture.path;
    }), fixture.label);
  });
});

test('directed journey validation rejects inherited and sparse focus and reference data', function () {
  const sparseFocus = JSON.parse(JSON.stringify(journeysData));
  sparseFocus.routes[0].stops[0].focusTrackIds = new Array(1);
  const inheritedFocus = JSON.parse(JSON.stringify(journeysData));
  inheritedFocus.routes[0].stops[0].focusTrackIds = arrayWithInheritedValue('xianrendong');

  [sparseFocus, inheritedFocus].forEach(function (fixture) {
    const result = journey.validateCollection(fixture, data);
    assert.deepStrictEqual(result.routes, []);
    assert.ok(result.issues.some(function (item) {
      return item.code === 'invalid-focus' && item.path === 'routes[0].stops[0].focusTrackIds';
    }));
  });

  const canonicalRef = JSON.parse(JSON.stringify(journeysData.routes[0].stops[0].recordRefs[0]));
  const sparseRefs = JSON.parse(JSON.stringify(journeysData));
  sparseRefs.routes[0].stops[0].recordRefs = new Array(1);
  const inheritedRefIndex = JSON.parse(JSON.stringify(journeysData));
  inheritedRefIndex.routes[0].stops[0].recordRefs = arrayWithInheritedValue(canonicalRef);
  const inheritedRefObject = JSON.parse(JSON.stringify(journeysData));
  inheritedRefObject.routes[0].stops[0].recordRefs[0] = Object.create(canonicalRef);

  const inheritedTrackId = JSON.parse(JSON.stringify(journeysData));
  const trackId = inheritedTrackId.routes[0].stops[0].recordRefs[0].trackId;
  delete inheritedTrackId.routes[0].stops[0].recordRefs[0].trackId;
  const inheritedTrackResult = withObjectPrototypeProperties({ trackId: trackId }, function () {
    return journey.validateCollection(inheritedTrackId, data);
  });

  const inheritedEventId = JSON.parse(JSON.stringify(journeysData));
  const eventId = inheritedEventId.routes[0].stops[0].recordRefs[0].eventId;
  delete inheritedEventId.routes[0].stops[0].recordRefs[0].eventId;
  const inheritedEventResult = withObjectPrototypeProperties({ eventId: eventId }, function () {
    return journey.validateCollection(inheritedEventId, data);
  });

  [{ label: 'sparse refs', result: journey.validateCollection(sparseRefs, data) },
    { label: 'inherited ref index', result: journey.validateCollection(inheritedRefIndex, data) },
    { label: 'inherited ref object', result: journey.validateCollection(inheritedRefObject, data) },
    { label: 'inherited trackId', result: inheritedTrackResult },
    { label: 'inherited eventId', result: inheritedEventResult }].forEach(function (fixture) {
    assert.deepStrictEqual(fixture.result.routes, [], fixture.label);
    assert.ok(fixture.result.issues.some(function (item) {
      return item.code === 'invalid-record-ref' && item.path === 'routes[0].stops[0].recordRefs[0]';
    }), fixture.label);
  });
});

test('directed journey validation copies focus without invoking manifest slice', function () {
  [{
    label: 'own substitute',
    install: function (focus, calls) {
      focus.slice = function () {
        calls.count += 1;
        return ['indus'];
      };
    }
  }, {
    label: 'inherited substitute',
    install: function (focus, calls) {
      const prototype = Object.create(Array.prototype);
      Object.defineProperty(prototype, 'slice', {
        configurable: true,
        value: function () {
          calls.count += 1;
          return ['indus'];
        }
      });
      Object.setPrototypeOf(focus, prototype);
    }
  }, {
    label: 'null slice',
    install: function (focus) { focus.slice = null; }
  }, {
    label: 'non-callable slice',
    install: function (focus) { focus.slice = { substitute: ['indus'] }; }
  }, {
    label: 'throwing slice',
    install: function (focus, calls) {
      focus.slice = function () {
        calls.count += 1;
        throw new Error('manifest slice must not execute');
      };
    }
  }].forEach(function (variant) {
    const fixture = JSON.parse(JSON.stringify(journeysData));
    const focus = fixture.routes[0].stops[0].focusTrackIds;
    const calls = { count: 0 };
    variant.install(focus, calls);
    const result = journey.validateCollection(fixture, data);
    assert.strictEqual(calls.count, 0, variant.label);
    assert.deepStrictEqual(result.issues, [], variant.label);
    assert.deepStrictEqual(result.routes[0].stops[0].focusTrackIds, ['xianrendong'], variant.label);
  });
});

test('directed journey validation accepts fully null-prototype manifest data', function () {
  const fixture = nullPrototypeClone(journeysData);
  assert.strictEqual(Object.getPrototypeOf(fixture), null);
  assert.strictEqual(Object.getPrototypeOf(fixture.routes[0]), null);
  assert.strictEqual(Object.getPrototypeOf(fixture.routes[0].stops[0]), null);
  assert.strictEqual(Object.getPrototypeOf(fixture.routes[0].stops[0].recordRefs[0]), null);
  assert.strictEqual(Object.getPrototypeOf(fixture.routes[0].copy.ru), null);
  const result = journey.validateCollection(fixture, data);
  assert.deepStrictEqual(result.issues, []);
  assert.deepStrictEqual(result.routes.map(function (route) { return route.id; }), ['birth-of-cities']);
});

test('directed journey validation rejects sparse and inherited route entries', function () {
  const sparse = { version: 1, routes: new Array(1) };
  const inheritedObject = JSON.parse(JSON.stringify(journeysData));
  inheritedObject.routes[0] = Object.create(inheritedObject.routes[0]);
  const inheritedIndex = {
    version: 1,
    routes: arrayWithInheritedValue(JSON.parse(JSON.stringify(journeysData.routes[0])))
  };

  [{ label: 'sparse', collection: sparse },
    { label: 'inherited object', collection: inheritedObject },
    { label: 'inherited array index', collection: inheritedIndex }].forEach(function (fixture) {
    assert.deepStrictEqual(journey.validateCollection(fixture.collection, data), {
      routes: [],
      issues: [{
        code: 'invalid-journey-entry',
        path: 'routes[0]',
        message: 'Journey route entries must be own plain objects'
      }]
    }, fixture.label);
  });
});

test('directed journey validation accepts a null-prototype route object', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  fixture.routes[0] = Object.assign(Object.create(null), fixture.routes[0]);
  const result = journey.validateCollection(fixture, data);
  assert.deepStrictEqual(result.issues, []);
  assert.deepStrictEqual(result.routes.map(function (route) { return route.id; }), ['birth-of-cities']);
});

test('directed journey duplicate counting ignores invalid inherited entries', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  fixture.routes.push(Object.create(fixture.routes[0]));
  const result = journey.validateCollection(fixture, data);
  assert.deepStrictEqual(result.routes.map(function (route) { return route.id; }), ['birth-of-cities']);
  assert.deepStrictEqual(result.issues, [{
    code: 'invalid-journey-entry',
    path: 'routes[1]',
    message: 'Journey route entries must be own plain objects'
  }]);
});

test('directed journey validation accepts an explicit empty collection', function () {
  assert.deepStrictEqual(journey.validateCollection({ version: 1, routes: [] }, data), {
    routes: [],
    issues: []
  });
});

test('directed journey validation rejects fractional and year-zero period stop years', function () {
  const fractional = JSON.parse(JSON.stringify(journeysData));
  fractional.routes[0].stops[0].recordRefs = [{ trackId: 'xianrendong', periodId: 'xianrendong-pottery' }];
  fractional.routes[0].stops[0].year = -18000.5;
  const fractionalResult = journey.validateCollection(fractional, data);

  const yearZero = JSON.parse(JSON.stringify(journeysData));
  const yearZeroData = JSON.parse(JSON.stringify(data));
  yearZero.routes[0].stops[0].recordRefs = [{ trackId: 'xianrendong', periodId: 'xianrendong-pottery' }];
  yearZero.routes[0].stops[0].year = 0;
  const xianrendong = yearZeroData.tracks.filter(function (track) { return track.id === 'xianrendong'; })[0];
  xianrendong.periods[0].start = -1;
  xianrendong.periods[0].end = 1;
  const yearZeroResult = journey.validateCollection(yearZero, yearZeroData);

  assert.deepStrictEqual([fractionalResult.routes.length, yearZeroResult.routes.length], [0, 0]);
  [fractionalResult, yearZeroResult].forEach(function (result) {
    assert.ok(result.issues.some(function (item) { return item.code === 'journey-year-mismatch'; }));
  });
});

test('directed journey route lookup returns existing routes and null for unknown ids', function () {
  assert.strictEqual(journey.findRoute(journeysData, 'birth-of-cities'), journeysData.routes[0]);
  assert.strictEqual(journey.findRoute(journeysData, 'unknown-route'), null);
});

test('directed journey localization falls back to RU and preserves resolved records without mutation', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const before = JSON.parse(JSON.stringify(route));
  const english = journey.localizeRoute(route, 'en');
  const fallback = journey.localizeRoute(route, 'unsupported');

  assert.deepStrictEqual({
    title: english.title,
    summary: english.summary,
    conclusion: english.conclusion,
    headline: english.stops[0].headline,
    body: english.stops[0].body
  }, {
    title: journeysData.routes[0].copy.en.title,
    summary: journeysData.routes[0].copy.en.summary,
    conclusion: journeysData.routes[0].copy.en.conclusion,
    headline: journeysData.routes[0].stops[0].copy.en.headline,
    body: journeysData.routes[0].stops[0].copy.en.body
  });
  assert.strictEqual(fallback.title, journeysData.routes[0].copy.ru.title);
  assert.strictEqual(fallback.stops[0].body, journeysData.routes[0].stops[0].copy.ru.body);
  assert.strictEqual(english.stops[0].records, route.stops[0].records);
  assert.strictEqual(english.stops[0].records[0].ref, route.stops[0].records[0].ref);
  assert.deepStrictEqual(route, before);
});

test('journey state creation normalizes its stable shape, bounds, and defaults without mutation', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const routeBefore = JSON.parse(JSON.stringify(route));
  const options = {
    status: 'transitioning', stopIndex: 99, deadline: 1234, remainingMs: NaN,
    pausedByVisibility: false, extra: 'discard me'
  };
  const optionKeys = Object.keys(options);

  assert.deepStrictEqual(journey.createState(route, options), {
    routeId: route.id,
    stopIndex: route.stops.length - 1,
    status: 'transitioning',
    deadline: 0,
    remainingMs: route.stops[route.stops.length - 1].holdMs,
    pausedByVisibility: false
  });
  assert.deepStrictEqual(journey.createState(route, { status: 'paused', stopIndex: -4 }), {
    routeId: route.id,
    stopIndex: 0,
    status: 'paused',
    deadline: 0,
    remainingMs: route.stops[0].holdMs,
    pausedByVisibility: false
  });
  assert.strictEqual(journey.createState(route, { status: 'paused', stopIndex: 1.5 }).stopIndex, 0);
  assert.deepStrictEqual(route, routeBefore);
  assert.deepStrictEqual(Object.keys(options), optionKeys);
  assert.ok(Number.isNaN(options.remainingMs));
});

test('journey state creation safely handles absent routes and invalid statuses and deadlines', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  assert.deepStrictEqual(journey.createState(null, {
    routeId: 'forged', stopIndex: 4, status: 'playing', deadline: 9000, remainingMs: 1000,
    pausedByVisibility: true
  }), {
    routeId: '', stopIndex: 0, status: 'catalog', deadline: 0, remainingMs: 0,
    pausedByVisibility: false
  });
  assert.deepStrictEqual(journey.createState({}, { status: 'playing', deadline: 9000 }), {
    routeId: '', stopIndex: 0, status: 'catalog', deadline: 0, remainingMs: 0,
    pausedByVisibility: false
  });
  assert.deepStrictEqual(journey.createState(route), {
    routeId: route.id, stopIndex: 0, status: 'paused', deadline: 0,
    remainingMs: route.stops[0].holdMs, pausedByVisibility: false
  });
  assert.deepStrictEqual(journey.createState(route, { status: 'bogus', stopIndex: 1 }), {
    routeId: route.id, stopIndex: 1, status: 'paused', deadline: 0,
    remainingMs: route.stops[1].holdMs, pausedByVisibility: false
  });
  assert.deepStrictEqual(journey.createState(route, { status: 'playing', stopIndex: 1, deadline: Infinity }), {
    routeId: route.id, stopIndex: 1, status: 'paused', deadline: 0,
    remainingMs: route.stops[1].holdMs, pausedByVisibility: false
  });
});

test('journey player pauses exactly and resumes from remaining time', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  let state = journey.createState(route, { status: 'transitioning', stopIndex: 0 });
  state = journey.reduce(state, { type: 'transitionEnd' }, route, { now: 1000, reducedMotion: false });
  assert.strictEqual(state.status, 'playing');
  assert.strictEqual(state.deadline, 16000);
  state = journey.reduce(state, { type: 'pause' }, route, { now: 6000, reducedMotion: false });
  assert.deepStrictEqual({ status: state.status, remainingMs: state.remainingMs }, { status: 'paused', remainingMs: 10000 });
  state = journey.reduce(state, { type: 'resume' }, route, { now: 9000, reducedMotion: false });
  assert.deepStrictEqual({ status: state.status, deadline: state.deadline }, { status: 'playing', deadline: 19000 });
});

test('journey player preserves an explicit zero remainder at the deadline', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const hold = route.stops[0].holdMs;
  assert.strictEqual(journey.createState(route, {
    status: 'paused', stopIndex: 0, remainingMs: 0
  }).remainingMs, 0);

  const playing = journey.createState(route, { status: 'playing', stopIndex: 0, deadline: 6000 });
  const paused = journey.reduce(playing, { type: 'pause' }, route, { now: 6000 });
  assert.deepStrictEqual({ status: paused.status, deadline: paused.deadline, remainingMs: paused.remainingMs }, {
    status: 'paused', deadline: 0, remainingMs: 0
  });
  assert.strictEqual(journey.reduce(paused, { type: 'pause' }, route, { now: 6000 }), paused);
  assert.strictEqual(journey.reduce(paused, { type: 'visibilityHidden' }, route, { now: 6000 }), paused);
  assert.strictEqual(journey.reduce(paused, { type: 'visibilityVisible' }, route, { now: 6000 }), paused);
  assert.deepStrictEqual(journey.clock(paused, 6000, route), {
    remainingMs: 0, countdownSeconds: null, shouldAdvance: false, stopProgress: 1
  });

  const hidden = journey.reduce(playing, { type: 'visibilityHidden' }, route, { now: 6000 });
  assert.deepStrictEqual({ remainingMs: hidden.remainingMs, pausedByVisibility: hidden.pausedByVisibility }, {
    remainingMs: 0, pausedByVisibility: true
  });
  const visible = journey.reduce(hidden, { type: 'visibilityVisible' }, route, { now: 7000 });
  assert.deepStrictEqual({ status: visible.status, remainingMs: visible.remainingMs,
    pausedByVisibility: visible.pausedByVisibility }, {
    status: 'paused', remainingMs: 0, pausedByVisibility: false
  });

  const resumed = journey.reduce(paused, { type: 'resume' }, route, { now: 7000 });
  assert.deepStrictEqual({ status: resumed.status, deadline: resumed.deadline, remainingMs: resumed.remainingMs }, {
    status: 'playing', deadline: 7000 + hold, remainingMs: 0
  });
});

test('journey interaction and hidden tab stop autoplay until explicit resume', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  let state = journey.createState(route, { status: 'playing', stopIndex: 1, deadline: 20000 });
  state = journey.reduce(state, { type: 'interact' }, route, { now: 12000, reducedMotion: false });
  assert.strictEqual(state.status, 'exploring');
  assert.strictEqual(state.remainingMs, 8000);
  assert.strictEqual(journey.reduce(state, { type: 'visibilityVisible' }, route, { now: 30000, reducedMotion: false }).status, 'exploring');
});

test('journey reduced motion never starts autoplay', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  let state = journey.createState(route, { status: 'transitioning', stopIndex: 0 });
  state = journey.reduce(state, { type: 'transitionEnd' }, route, { now: 1000, reducedMotion: true });
  assert.strictEqual(state.status, 'paused');
  state = journey.reduce(state, { type: 'resume' }, route, { now: 2000, reducedMotion: true });
  assert.strictEqual(state.status, 'paused');
});

test('journey player bounds durations and fails safely when deadlines are not representable', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const hold = route.stops[0].holdMs;
  [Number.MAX_VALUE, Infinity, NaN, -1].forEach(function (remainingMs) {
    assert.strictEqual(journey.createState(route, {
      status: 'paused', stopIndex: 0, remainingMs: remainingMs
    }).remainingMs, hold);
  });
  const hugeExploring = journey.createState(route, {
    status: 'exploring', stopIndex: 0, remainingMs: Number.MAX_VALUE
  });
  assert.strictEqual(hugeExploring.remainingMs, hold);
  const boundedResume = journey.reduce(hugeExploring, { type: 'resume' }, route, { now: 1000 });
  assert.deepStrictEqual({
    status: boundedResume.status,
    deadline: boundedResume.deadline
  }, { status: 'playing', deadline: 1000 + hold });

  const transitioning = journey.createState(route, { status: 'transitioning', stopIndex: 0 });
  const extremeTransition = journey.reduce(transitioning, { type: 'transitionEnd' }, route, {
    now: Number.MAX_VALUE
  });
  assert.deepStrictEqual({
    status: extremeTransition.status, deadline: extremeTransition.deadline,
    remainingMs: extremeTransition.remainingMs
  }, { status: 'paused', deadline: 0, remainingMs: hold });

  const extremeResume = journey.reduce(journey.createState(route, {
    status: 'paused', stopIndex: 0, remainingMs: hold
  }), { type: 'resume' }, route, { now: Number.MAX_VALUE });
  assert.deepStrictEqual({
    status: extremeResume.status, deadline: extremeResume.deadline,
    remainingMs: extremeResume.remainingMs
  }, { status: 'paused', deadline: 0, remainingMs: hold });
  assert.strictEqual(journey.clock(extremeResume, Number.MAX_VALUE, route).shouldAdvance, false);

  [NaN, Infinity].forEach(function (now) {
    const safelyTimed = journey.reduce(transitioning, { type: 'transitionEnd' }, route, { now: now });
    assert.deepStrictEqual({ status: safelyTimed.status, deadline: safelyTimed.deadline }, {
      status: 'playing', deadline: hold
    });
  });
});

test('journey player clamps every deadline-derived remainder to the current hold', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const hold = route.stops[0].holdMs;
  const distant = journey.createState(route, {
    status: 'playing', stopIndex: 0, deadline: Number.MAX_VALUE
  });
  [
    { type: 'pause', status: 'paused' },
    { type: 'interact', status: 'exploring' },
    { type: 'visibilityHidden', status: 'paused' }
  ].forEach(function (fixture) {
    const result = journey.reduce(distant, { type: fixture.type }, route, { now: 0 });
    assert.strictEqual(result.status, fixture.status, fixture.type);
    assert.strictEqual(result.remainingMs, hold, fixture.type);
    assert.strictEqual(journey.clock(result, 0, route).remainingMs, hold, fixture.type);
  });
  assert.deepStrictEqual(journey.clock(distant, 0, route), {
    remainingMs: hold, countdownSeconds: null, shouldAdvance: false, stopProgress: 0
  });

  const largeNow = 1e20;
  assert.ok(largeNow + hold - largeNow > hold, 'fixture must exercise upward deadline rounding');
  const transitioning = journey.createState(route, { status: 'transitioning', stopIndex: 0 });
  const roundedTransition = journey.reduce(transitioning, { type: 'transitionEnd' }, route, {
    now: largeNow
  });
  assert.deepStrictEqual({
    status: roundedTransition.status, deadline: roundedTransition.deadline,
    remainingMs: roundedTransition.remainingMs
  }, { status: 'paused', deadline: 0, remainingMs: hold });

  const paused = journey.createState(route, { status: 'paused', stopIndex: 0, remainingMs: hold });
  const roundedResume = journey.reduce(paused, { type: 'resume' }, route, { now: largeNow });
  assert.deepStrictEqual({
    status: roundedResume.status, deadline: roundedResume.deadline,
    remainingMs: roundedResume.remainingMs
  }, { status: 'paused', deadline: 0, remainingMs: hold });

  const roundedPlaying = journey.createState(route, {
    status: 'playing', stopIndex: 0, deadline: largeNow + hold
  });
  assert.deepStrictEqual(journey.clock(roundedPlaying, largeNow, route), {
    remainingMs: hold, countdownSeconds: null, shouldAdvance: false, stopProgress: 0
  });
});

test('journey clock exposes countdown and advances only at deadline', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const state = journey.createState(route, { status: 'playing', stopIndex: 0, deadline: 15000 });
  assert.deepStrictEqual(journey.clock(state, 11000, route), {
    remainingMs: 4000, countdownSeconds: 4, shouldAdvance: false, stopProgress: 11 / 15
  });
  assert.strictEqual(journey.clock(state, 15000, route).shouldAdvance, true);
});

test('journey start selects a bounded stop and initializes its transition clock', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const paused = journey.createState(route, { status: 'paused', stopIndex: 2, remainingMs: 3000 });
  assert.deepStrictEqual(journey.reduce(paused, { type: 'start', stopIndex: -20 }, route, {
    now: 500, reducedMotion: false
  }), {
    routeId: route.id, stopIndex: 0, status: 'transitioning', deadline: 0,
    remainingMs: route.stops[0].holdMs, pausedByVisibility: false
  });
  assert.strictEqual(journey.reduce(paused, { type: 'start' }, route, {
    now: 500, reducedMotion: false
  }).stopIndex, 2);
  assert.strictEqual(journey.reduce(journey.createState(route), { type: 'start', stopIndex: 100 }, route, {
    now: 500, reducedMotion: false
  }).stopIndex, route.stops.length - 1);
});

test('journey next, previous, and finish respect route bounds and active states', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const middle = journey.createState(route, { status: 'playing', stopIndex: 1, deadline: 10000 });
  const next = journey.reduce(middle, { type: 'next' }, route, { now: 2000, reducedMotion: false });
  assert.deepStrictEqual({
    stopIndex: next.stopIndex, status: next.status, deadline: next.deadline,
    remainingMs: next.remainingMs
  }, {
    stopIndex: 2, status: 'transitioning', deadline: 0, remainingMs: route.stops[2].holdMs
  });
  const previous = journey.reduce(middle, { type: 'previous' }, route, { now: 2000, reducedMotion: false });
  assert.deepStrictEqual({ stopIndex: previous.stopIndex, status: previous.status }, {
    stopIndex: 0, status: 'transitioning'
  });

  const first = journey.createState(route, { status: 'paused', stopIndex: 0 });
  assert.strictEqual(journey.reduce(first, { type: 'previous' }, route, { now: 0 }), first);
  const last = journey.createState(route, { status: 'paused', stopIndex: route.stops.length - 1 });
  const complete = journey.reduce(last, { type: 'next' }, route, { now: 0 });
  assert.deepStrictEqual({
    stopIndex: complete.stopIndex, status: complete.status, deadline: complete.deadline,
    remainingMs: complete.remainingMs
  }, {
    stopIndex: route.stops.length - 1, status: 'complete', deadline: 0, remainingMs: 0
  });
  assert.strictEqual(journey.reduce(complete, { type: 'next' }, route, { now: 0 }), complete);
  assert.strictEqual(journey.reduce(journey.createState(route, { status: 'catalog' }), {
    type: 'finish'
  }, route, { now: 0 }).status, 'catalog');
  assert.strictEqual(journey.reduce(first, { type: 'finish' }, route, { now: 0 }).status, 'complete');
});

test('journey visibility pause stays paused after returning until explicit resume', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const playing = journey.createState(route, { status: 'playing', stopIndex: 2, deadline: 20000 });
  const hidden = journey.reduce(playing, { type: 'visibilityHidden' }, route, {
    now: 12000, reducedMotion: false
  });
  assert.deepStrictEqual({
    status: hidden.status, deadline: hidden.deadline, remainingMs: hidden.remainingMs,
    pausedByVisibility: hidden.pausedByVisibility
  }, {
    status: 'paused', deadline: 0, remainingMs: 8000, pausedByVisibility: true
  });
  const visible = journey.reduce(hidden, { type: 'visibilityVisible' }, route, {
    now: 30000, reducedMotion: false
  });
  assert.deepStrictEqual({
    status: visible.status, remainingMs: visible.remainingMs,
    pausedByVisibility: visible.pausedByVisibility
  }, {
    status: 'paused', remainingMs: 8000, pausedByVisibility: false
  });
  assert.strictEqual(journey.reduce(visible, { type: 'resume' }, route, {
    now: 30000, reducedMotion: false
  }).deadline, 38000);
  assert.strictEqual(journey.reduce(visible, { type: 'visibilityHidden' }, route, { now: 30000 }), visible);
});

test('journey interaction, pause, and resume are idempotent outside their source states', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const paused = journey.createState(route, { status: 'paused', stopIndex: 1, remainingMs: 7000 });
  assert.strictEqual(journey.reduce(paused, { type: 'pause' }, route, { now: 1000 }), paused);
  const exploring = journey.reduce(paused, { type: 'interact' }, route, { now: 1000 });
  assert.deepStrictEqual({ status: exploring.status, remainingMs: exploring.remainingMs }, {
    status: 'exploring', remainingMs: 7000
  });
  assert.strictEqual(journey.reduce(exploring, { type: 'interact' }, route, { now: 1000 }), exploring);
  const noRemainder = journey.createState(route, { status: 'exploring', stopIndex: 1, remainingMs: 0 });
  const resumed = journey.reduce(noRemainder, { type: 'resume' }, route, { now: 4000 });
  assert.strictEqual(resumed.deadline, 4000 + route.stops[1].holdMs);
});

test('journey reducer ignores unknown and malformed events by exact identity', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const state = journey.createState(route, { status: 'playing', stopIndex: 0, deadline: 20000 });
  [null, {}, { type: 12 }, { type: 'unknown' }].forEach(function (event) {
    assert.strictEqual(journey.reduce(state, event, route, { now: 1000 }), state);
  });
});

test('journey reducer is immutable and normalizes malformed route and time inputs safely', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const state = journey.createState(route, { status: 'playing', stopIndex: 0, deadline: 20000 });
  const event = { type: 'pause' };
  const options = { now: NaN, reducedMotion: false };
  const stateBefore = Object.assign({}, state);
  const eventBefore = Object.assign({}, event);
  const routeBefore = JSON.parse(JSON.stringify(route));
  const result = journey.reduce(state, event, route, options);
  assert.deepStrictEqual(result, {
    routeId: route.id, stopIndex: 0, status: 'paused', deadline: 0,
    remainingMs: route.stops[0].holdMs, pausedByVisibility: false
  });
  assert.deepStrictEqual(state, stateBefore);
  assert.deepStrictEqual(event, eventBefore);
  assert.deepStrictEqual(route, routeBefore);
  assert.ok(Number.isNaN(options.now));
  assert.deepStrictEqual(journey.reduce(null, { type: 'start' }, null, null), {
    routeId: '', stopIndex: 0, status: 'catalog', deadline: 0, remainingMs: 0,
    pausedByVisibility: false
  });
});

test('journey reducer isolates mismatched routes except for an explicit fresh start', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const otherRoute = Object.assign({}, route, {
    id: 'other-route',
    stops: route.stops.map(function (stop, index) {
      return Object.assign({}, stop, { holdMs: index === 0 ? 12000 : stop.holdMs });
    })
  });
  const playing = journey.createState(route, { status: 'playing', stopIndex: 1, deadline: 20000 });
  const paused = journey.createState(route, { status: 'paused', stopIndex: 1, remainingMs: 7000 });
  [
    { state: playing, event: { type: 'pause' } },
    { state: playing, event: { type: 'interact' } },
    { state: paused, event: { type: 'resume' } },
    { state: playing, event: { type: 'next' } },
    { state: playing, event: { type: 'previous' } }
  ].forEach(function (fixture) {
    assert.strictEqual(journey.reduce(fixture.state, fixture.event, otherRoute, { now: 1000 }),
      fixture.state, fixture.event.type);
  });

  const rebound = journey.reduce(playing, { type: 'start' }, otherRoute, { now: 1000 });
  assert.deepStrictEqual(rebound, {
    routeId: otherRoute.id,
    stopIndex: 0,
    status: 'transitioning',
    deadline: 0,
    remainingMs: otherRoute.stops[0].holdMs,
    pausedByVisibility: false
  });
  const selected = journey.reduce(playing, { type: 'start', stopIndex: 2 }, otherRoute, { now: 1000 });
  assert.deepStrictEqual({
    routeId: selected.routeId, stopIndex: selected.stopIndex, deadline: selected.deadline,
    remainingMs: selected.remainingMs
  }, {
    routeId: otherRoute.id, stopIndex: 2, deadline: 0, remainingMs: otherRoute.stops[2].holdMs
  });
});

test('journey clock handles paused progress, countdown boundaries, and malformed inputs', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const paused = journey.createState(route, { status: 'paused', stopIndex: 0, remainingMs: 5000 });
  assert.deepStrictEqual(journey.clock(paused, 1000, route), {
    remainingMs: 5000, countdownSeconds: 5, shouldAdvance: false,
    stopProgress: 2 / 3
  });
  assert.strictEqual(Object.prototype.hasOwnProperty.call(journey.clock(paused, 1000, route), 'running'), false);
  assert.deepStrictEqual(journey.clock({ status: 'playing', deadline: 1000 }, 1000, null), {
    remainingMs: 0, countdownSeconds: null, shouldAdvance: false, stopProgress: 0
  });
  assert.deepStrictEqual(journey.clock(paused, Infinity, route), {
    remainingMs: 0, countdownSeconds: null, shouldAdvance: false, stopProgress: 0
  });
  assert.deepStrictEqual(journey.clock({ status: 'invalid' }, 1000, route), {
    remainingMs: 0, countdownSeconds: null, shouldAdvance: false, stopProgress: 0
  });
});

test('journey clock rejects malformed stable state, mismatched routes, and invalid clock inputs', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const playing = journey.createState(route, { status: 'playing', stopIndex: 0, deadline: 5000 });
  const incomplete = Object.assign({}, playing);
  delete incomplete.routeId;
  const invalidHoldRoute = { id: 'invalid-hold', stops: [{ holdMs: NaN }] };
  const invalidHoldState = {
    routeId: invalidHoldRoute.id, stopIndex: 0, status: 'playing', deadline: 5000,
    remainingMs: 0, pausedByVisibility: false
  };
  const safe = {
    remainingMs: 0, countdownSeconds: null, shouldAdvance: false, stopProgress: 0
  };
  const cases = [
    { name: 'partial state', state: { status: 'playing', deadline: 5000 }, now: 1000, route: route },
    { name: 'missing stable key', state: incomplete, now: 1000, route: route },
    { name: 'extra stable key', state: Object.assign({}, playing, { extra: true }), now: 1000, route: route },
    { name: 'invalid status', state: Object.assign({}, playing, { status: 'invalid' }), now: 1000, route: route },
    { name: 'route id mismatch', state: Object.assign({}, playing, { routeId: 'other-route' }), now: 1000, route: route },
    { name: 'non-finite time', state: playing, now: Infinity, route: route },
    { name: 'missing current stop', state: Object.assign({}, playing, { stopIndex: route.stops.length }), now: 1000, route: route },
    { name: 'invalid current hold', state: invalidHoldState, now: 1000, route: invalidHoldRoute },
    { name: 'negative paused remainder', state: Object.assign({}, playing, {
      status: 'paused', deadline: 0, remainingMs: -1
    }), now: 1000, route: route },
    { name: 'malformed complete state', state: { status: 'complete' }, now: NaN, route: null }
  ];

  cases.forEach(function (fixture) {
    assert.deepStrictEqual(journey.clock(fixture.state, fixture.now, fixture.route), safe, fixture.name);
  });
});

test('journey clock reserves inactive terminal progress for a valid complete state', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const catalog = journey.createState(route, { status: 'catalog', stopIndex: 0 });
  const complete = journey.createState(route, { status: 'complete', stopIndex: 0 });
  assert.deepStrictEqual(journey.clock(catalog, 1000, route), {
    remainingMs: 0, countdownSeconds: null, shouldAdvance: false, stopProgress: 0
  });
  assert.deepStrictEqual(journey.clock(complete, 1000, route), {
    remainingMs: 0, countdownSeconds: null, shouldAdvance: false, stopProgress: 1
  });
});

test('journey view escapes editorial copy and exposes accessible controls', function () {
  const html = journeyView.catalogHtml([{ id: 'x', title: '<b>X</b>', summary: 'A & B', durationSeconds: 120, stops: new Array(7) }], {
    catalogTitle: 'Routes', startJourney: 'Start', minutesTemplate: '{minutes} min', stopsTemplate: '{count} stops'
  });
  assert.ok(html.indexOf('&lt;b&gt;X&lt;/b&gt;') !== -1);
  assert.ok(html.indexOf('data-journey-start="x"') !== -1);
  assert.strictEqual(html.indexOf('<b>X</b>'), -1);
});

test('journey view escapes HTML and substitutes only owned word placeholders', function () {
  assert.strictEqual(journeyView.escapeHtml(null), '');
  assert.strictEqual(journeyView.escapeHtml(undefined), '');
  assert.strictEqual(journeyView.escapeHtml('&<>"\''), '&amp;&lt;&gt;&quot;&#39;');
  assert.strictEqual(journeyView.template('{known} {missing} {not-valid!}', { known: 7 }),
    '7 {missing} {not-valid!}');
  assert.strictEqual(journeyView.template('{polluted}', Object.create({ polluted: 'unsafe' })), '{polluted}');
  assert.strictEqual(journeyView.template(null, { known: 7 }), '');
});

test('journey catalog skips malformed entries and bounds controlled collections', function () {
  const controlledStops = new Array(99);
  const malformedRoutes = [
    null,
    { id: '', title: 'Empty id', summary: '', durationSeconds: 60, stops: [] },
    { id: 'no-title', summary: '', durationSeconds: 60, stops: [] },
    { id: 'bad-stops', title: 'Bad stops', summary: '', durationSeconds: 60, stops: {} },
    Object.create({ id: 'inherited', title: 'Inherited', stops: [] })
  ];
  const routes = [{ id: 'first', title: 'First', summary: 'Safe', durationSeconds: Infinity, stops: controlledStops }];
  for (let index = 1; index < 101; index += 1) {
    routes.push({ id: 'route-' + index, title: 'Route ' + index, summary: '', durationSeconds: 30, stops: [] });
  }
  ['find', 'findIndex', 'forEach', 'map', 'reduce', 'some'].forEach(function (method) {
    routes[method] = controlledStops[method] = function () { throw new Error('controlled method called: ' + method); };
  });
  const html = journeyView.catalogHtml(routes, {
    catalogTitle: '<Catalog & routes>', startJourney: 'Start "now"',
    minutesTemplate: '<i>{minutes}</i>', stopsTemplate: '<b>{count}</b>'
  });
  const malformedHtml = journeyView.catalogHtml(malformedRoutes, {
    catalogTitle: 'Routes', startJourney: 'Start', minutesTemplate: '{minutes}', stopsTemplate: '{count}'
  });
  assert.strictEqual((html.match(/<article class="journey-card">/g) || []).length, 100);
  assert.strictEqual(malformedHtml.indexOf('Empty id'), -1);
  assert.strictEqual(malformedHtml.indexOf('no-title'), -1);
  assert.strictEqual(malformedHtml.indexOf('Bad stops'), -1);
  assert.strictEqual(malformedHtml.indexOf('Inherited'), -1);
  assert.ok(html.indexOf('&lt;Catalog &amp; routes&gt;') !== -1);
  assert.ok(html.indexOf('&lt;i&gt;0&lt;/i&gt;') !== -1);
  assert.ok(html.indexOf('&lt;b&gt;8&lt;/b&gt;') !== -1);
  assert.ok(html.indexOf('Start &quot;now&quot;') !== -1);
  assert.strictEqual(html.indexOf('route-100'), -1);
  assert.doesNotThrow(function () { journeyView.catalogHtml(null, null); });
  assert.doesNotThrow(function () { journeyView.catalogHtml({}, Object.create(null)); });
});

test('journey catalog escapes route identifiers and rejects accessor-controlled entries', function () {
  const route = { id: 'route" onfocus="bad', title: '<Title>', summary: '<Summary>', durationSeconds: 91, stops: [] };
  const accessorRoute = {};
  Object.defineProperty(accessorRoute, 'id', { enumerable: true, get: function () { throw new Error('id read'); } });
  Object.defineProperty(accessorRoute, 'title', { enumerable: true, value: 'Accessor title' });
  Object.defineProperty(accessorRoute, 'stops', { enumerable: true, value: [] });
  const html = journeyView.catalogHtml([accessorRoute, route], {
    catalogTitle: 'Routes', startJourney: '<Start>', minutesTemplate: '{minutes} min', stopsTemplate: '{count} stops'
  });
  assert.strictEqual(html.indexOf('Accessor title'), -1);
  assert.ok(html.indexOf('data-journey-start="route&quot; onfocus=&quot;bad"') !== -1);
  assert.strictEqual(html.indexOf('<Title>'), -1);
  assert.strictEqual(html.indexOf('<Summary>'), -1);
  assert.ok(html.indexOf('2 min') !== -1);
});

test('journey view supplies non-empty English fallbacks for missing or blank interface copy', function () {
  const route = {
    id: 'safe-route', title: 'Safe route', summary: 'Summary', conclusion: 'Conclusion', durationSeconds: 60,
    stops: [{
      id: 'safe-stop', year: 1, headline: 'Safe stop', body: 'Safe body',
      records: [{ track: { id: 'safe-track' }, ref: { eventId: 'safe-event' }, record: { id: 'safe-event' } }]
    }]
  };
  const keys = [
    'catalogTitle', 'startJourney', 'minutesTemplate', 'stopsTemplate', 'previousStop', 'nextStop',
    'pauseJourney', 'resumeJourney', 'shareJourney', 'openEvidence', 'stopTemplate', 'completeKicker',
    'exploreMoment', 'replayJourney', 'backCatalog'
  ];
  const blankCopy = keys.reduce(function (result, key) { result[key] = '   '; return result; }, {});
  [null, blankCopy].forEach(function (copy) {
    const catalog = journeyView.catalogHtml([route], copy);
    assert.ok(catalog.indexOf('<h2 tabindex="-1">Journeys</h2>') !== -1);
    assert.ok(catalog.indexOf('1 min') !== -1);
    assert.ok(catalog.indexOf('1 stops') !== -1);
    assert.ok(/data-journey-start="safe-route"[^>]*>Start journey<\/button>/.test(catalog));

    const stage = journeyView.stageHtml(route, { stopIndex: 0, status: 'paused' }, copy, String);
    assert.ok(stage.indexOf('Stop 1 of 1') !== -1);
    assert.ok(/data-journey-action="previous"[^>]*>Previous stop<\/button>/.test(stage));
    assert.ok(/data-journey-action="toggle"[^>]*>Resume journey<\/button>/.test(stage));
    assert.ok(/data-journey-action="next"[^>]*>Next stop<\/button>/.test(stage));
    assert.ok(/data-journey-action="share"[^>]*>Share journey<\/button>/.test(stage));
    assert.ok(/data-journey-evidence="safe-track"[^>]*>Open evidence<\/button>/.test(stage));
    const playingStage = journeyView.stageHtml(route, { stopIndex: 0, status: 'playing' }, copy, String);
    assert.ok(/data-journey-action="toggle"[^>]*>Pause journey<\/button>/.test(playingStage));

    const complete = journeyView.completeHtml(route, copy);
    assert.ok(complete.indexOf('Journey complete') !== -1);
    assert.ok(/data-journey-action="explore"[^>]*>Explore this moment<\/button>/.test(complete));
    assert.ok(/data-journey-action="replay"[^>]*>Replay journey<\/button>/.test(complete));
    assert.ok(/data-journey-action="catalog"[^>]*>Back to journeys<\/button>/.test(complete));
    assert.ok(/data-journey-action="share"[^>]*>Share journey<\/button>/.test(complete));
  });
});

test('journey stage exposes a hidden announcement source but no replaceable live region', function () {
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const html = journeyView.stageHtml(route, journey.createState(route, { status: 'paused' }), {
    previousStop: 'Previous', nextStop: 'Next', pauseJourney: 'Pause', resumeJourney: 'Resume',
    shareJourney: 'Share', exitJourney: 'Exit', openEvidence: 'Open evidence', stopTemplate: 'Stop {current} of {total}'
  }, function (year) { return String(year); });
  assert.strictEqual(html.indexOf('aria-live='), -1);
  assert.ok(/<span data-journey-announcement-source hidden>Pottery before cities · -18000<\/span>/.test(html));
  assert.ok(/data-journey-countdown[^>]*aria-hidden="true"/.test(html));
  assert.ok(/data-journey-evidence="xianrendong"/.test(html));
});

test('journey stage escapes route stop copy templates years and attribute values', function () {
  const route = {
    id: 'route',
    title: '<Route & title>',
    stops: [{
      id: 'stop" onclick="bad', year: -100, headline: '<Headline>', body: 'Body & <em>detail</em>',
      records: [{
        track: { id: 'track" onmouseover="bad' },
        record: { id: 'record" autofocus="bad' },
        ref: { eventId: 'record" autofocus="bad' }
      }]
    }, {
      id: 'second', year: -50, headline: 'Second & final', body: 'Second body', records: []
    }]
  };
  const html = journeyView.stageHtml(route, { stopIndex: 0, status: 'paused' }, {
    previousStop: '<Previous>', nextStop: '<Next>', pauseJourney: '<Pause>', resumeJourney: '<Resume>',
    shareJourney: '<Share>', openEvidence: '<Evidence>',
    stopTemplate: '<Stop {current} of {total}>'
  }, function () { return '<Year & "unsafe">'; });
  assert.ok(html.indexOf('data-journey-stop="stop&quot; onclick=&quot;bad"') !== -1);
  assert.ok(html.indexOf('&lt;Route &amp; title&gt;') !== -1);
  assert.ok(html.indexOf('&lt;Headline&gt;') !== -1);
  assert.ok(html.indexOf('Body &amp; &lt;em&gt;detail&lt;/em&gt;') !== -1);
  assert.ok(html.indexOf('&lt;Year &amp; &quot;unsafe&quot;&gt;') !== -1);
  assert.ok(html.indexOf('<span data-journey-announcement-source hidden>&lt;Headline&gt; · ' +
    '&lt;Year &amp; &quot;unsafe&quot;&gt;</span>') !== -1);
  assert.ok(html.indexOf('&lt;Stop 1 of 2&gt;') !== -1);
  assert.ok(html.indexOf('data-journey-evidence="track&quot; onmouseover=&quot;bad"') !== -1);
  assert.ok(html.indexOf('data-record-id="record&quot; autofocus=&quot;bad"') !== -1);
  ['Previous', 'Next', 'Resume', 'Share', 'Evidence'].forEach(function (label) {
    assert.ok(html.indexOf('&lt;' + label + '&gt;') !== -1, label);
  });
  ['<Route', '<Headline>', '<em>', '<Year', '<Stop', '<Previous>'].forEach(function (raw) {
    assert.strictEqual(html.indexOf(raw), -1, raw);
  });
});

test('journey stage renders exact progress and control states', function () {
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const copy = {
    previousStop: 'Previous', nextStop: 'Next', pauseJourney: 'Pause', resumeJourney: 'Resume',
    shareJourney: 'Share', openEvidence: 'Open evidence', stopTemplate: 'Stop {current} of {total}'
  };
  const first = journeyView.stageHtml(route, { stopIndex: 0, status: 'playing' }, copy, String);
  assert.strictEqual((first.match(/data-journey-go="/g) || []).length, 7);
  assert.strictEqual((first.match(/aria-current="step"/g) || []).length, 1);
  assert.ok(/data-journey-go="0"[^>]*aria-current="step"/.test(first));
  assert.ok(/data-journey-action="previous"[^>]*disabled/.test(first));
  assert.ok(/data-journey-action="toggle"[^>]*>Pause<\/button>/.test(first));
  assert.ok(/data-journey-action="next"[^>]*>Next<\/button>/.test(first));
  assert.ok(/data-journey-action="share"[^>]*>Share<\/button>/.test(first));
  assert.ok(first.indexOf('data-journey-world') !== -1);
  assert.ok(first.indexOf('data-journey-regions') !== -1);
  assert.ok(first.indexOf('data-journey-clock') !== -1);
  assert.strictEqual(first.indexOf('data-journey-action="exit"'), -1);
  assert.strictEqual(first.indexOf('>Exit<'), -1);

  const middle = journeyView.stageHtml(route, { stopIndex: 3, status: 'exploring' }, copy, String);
  assert.ok(/data-journey-go="3"[^>]*aria-current="step"/.test(middle));
  assert.ok(!/data-journey-action="previous"[^>]*disabled/.test(middle));
  assert.ok(/data-journey-action="toggle"[^>]*>Resume<\/button>/.test(middle));
});

test('journey stage disables only the transitioning toggle', function () {
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const copy = {
    previousStop: 'Previous', nextStop: 'Next', pauseJourney: 'Pause', resumeJourney: 'Resume',
    shareJourney: 'Share', openEvidence: 'Open evidence', stopTemplate: 'Stop {current} of {total}'
  };
  const transitioning = journeyView.stageHtml(route, { stopIndex: 1, status: 'transitioning' }, copy, String);
  assert.ok(/data-journey-action="toggle"[^>]*disabled[^>]*aria-disabled="true"[^>]*>Resume<\/button>/.test(transitioning));
  ['playing', 'paused', 'exploring'].forEach(function (status) {
    const html = journeyView.stageHtml(route, { stopIndex: 1, status: status }, copy, String);
    const toggle = html.match(/<button[^>]*data-journey-action="toggle"[^>]*>/)[0];
    assert.strictEqual(/\sdisabled(?:\s|>)/.test(toggle), false, status);
    assert.strictEqual(toggle.indexOf('aria-disabled='), -1, status);
  });
});

test('journey stage announcement source contains only escaped headline separator and year', function () {
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const html = journeyView.stageHtml(route, { stopIndex: 1, status: 'paused' }, {
    previousStop: 'Previous', nextStop: 'Next', pauseJourney: 'Pause', resumeJourney: 'Resume',
    shareJourney: 'Share', openEvidence: 'Evidence', stopTemplate: 'Stop {current} of {total}'
  }, String);
  const source = html.match(/<span data-journey-announcement-source hidden>([\s\S]*?)<\/span>/);
  assert.ok(source);
  assert.strictEqual(source[1], 'Monuments without a city · -9500');
  assert.strictEqual(source[1].indexOf('data-journey-countdown'), -1);
  assert.strictEqual(source[1].indexOf(route.stops[1].body), -1);
  assert.strictEqual(html.indexOf('aria-live='), -1);
});

test('journey stage omits evidence and fails closed for malformed current stops', function () {
  const safeRoute = {
    id: 'safe', title: 'Safe route',
    stops: [{ id: 'safe-stop', year: 1, headline: 'Safe stop', body: 'Safe body', records: [] }]
  };
  const copy = {
    previousStop: 'Previous', nextStop: 'Next', pauseJourney: 'Pause', resumeJourney: 'Resume',
    shareJourney: 'Share', openEvidence: 'Evidence', stopTemplate: 'Stop {current} of {total}'
  };
  const html = journeyView.stageHtml(safeRoute, { stopIndex: 0, status: 'paused' }, copy, String);
  assert.strictEqual(html.indexOf('data-journey-evidence'), -1);
  [null, {}, { stops: {} }, safeRoute].forEach(function (route, index) {
    const state = index === 3 ? { stopIndex: 4, status: 'paused' } : { stopIndex: 0, status: 'paused' };
    assert.doesNotThrow(function () { journeyView.stageHtml(route, state, null, function () { throw new Error('year'); }); });
    assert.strictEqual(journeyView.stageHtml(route, state, null, function () { throw new Error('year'); }), '');
  });
  const throwingState = {};
  Object.defineProperty(throwingState, 'stopIndex', { get: function () { throw new Error('state read'); } });
  assert.strictEqual(journeyView.stageHtml(safeRoute, throwingState, copy, String), '');
});

test('journey completion escapes editorial copy and renders exact actions', function () {
  const html = journeyView.completeHtml({ title: '<Finished>', conclusion: 'Safe & <strong>done</strong>' }, {
    completeKicker: '<Complete>', exploreMoment: '<Explore>', replayJourney: '<Replay>',
    backCatalog: '<Catalog>', shareJourney: '<Share>'
  });
  assert.ok(html.indexOf('&lt;Finished&gt;') !== -1);
  assert.ok(html.indexOf('Safe &amp; &lt;strong&gt;done&lt;/strong&gt;') !== -1);
  ['explore', 'replay', 'catalog', 'share'].forEach(function (action) {
    assert.strictEqual((html.match(new RegExp('data-journey-action="' + action + '"', 'g')) || []).length, 1, action);
  });
  ['Complete', 'Explore', 'Replay', 'Catalog', 'Share'].forEach(function (label) {
    assert.ok(html.indexOf('&lt;' + label + '&gt;') !== -1, label);
  });
  [null, {}, { title: 'Only title' }, Object.create({ title: 'Inherited', conclusion: 'Inherited' })]
    .forEach(function (route) { assert.strictEqual(journeyView.completeHtml(route, null), ''); });
});

test('journey clock view clamps progress and reveals only deliberate countdown values', function () {
  const countdown = { textContent: 'old', hidden: false };
  const calls = [];
  const clock = { style: { setProperty: function (name, value) { calls.push([name, value]); } } };
  const rootNode = { querySelector: function (selector) {
    return selector === '[data-journey-countdown]' ? countdown : clock;
  } };
  journeyView.updateClock(rootNode, { stopProgress: 1.5, countdownSeconds: 5 });
  assert.deepStrictEqual(calls.pop(), ['--journey-progress', '1']);
  assert.strictEqual(countdown.textContent, '5');
  assert.strictEqual(countdown.hidden, false);

  journeyView.updateClock(rootNode, { stopProgress: -2, countdownSeconds: 0 });
  assert.deepStrictEqual(calls.pop(), ['--journey-progress', '0']);
  assert.strictEqual(countdown.textContent, '');
  assert.strictEqual(countdown.hidden, true);

  journeyView.updateClock(rootNode, { stopProgress: 0.25, countdownSeconds: 2.5 });
  assert.deepStrictEqual(calls.pop(), ['--journey-progress', '0.25']);
  assert.strictEqual(countdown.textContent, '');
  assert.strictEqual(countdown.hidden, true);
});

test('journey clock view never throws for hostile roots values or fake DOM nodes', function () {
  [null, {}, { querySelector: 1 }, {
    querySelector: function () { throw new Error('selector failure'); }
  }].forEach(function (rootNode) {
    assert.doesNotThrow(function () { journeyView.updateClock(rootNode, null); });
  });
  const hostileValue = {};
  Object.defineProperty(hostileValue, 'stopProgress', { get: function () { throw new Error('progress read'); } });
  Object.defineProperty(hostileValue, 'countdownSeconds', { get: function () { throw new Error('countdown read'); } });
  const hostileNode = {};
  Object.defineProperty(hostileNode, 'style', { get: function () { throw new Error('style read'); } });
  const rootNode = { querySelector: function (selector) {
    return selector === '[data-journey-countdown]' ? Object.freeze({}) : hostileNode;
  } };
  assert.doesNotThrow(function () { journeyView.updateClock(rootNode, hostileValue); });
});

test('journey focus trap wraps forward reverse and outside focus', function () {
  const focused = [];
  const ownerDocument = { activeElement: null };
  function node(id) {
    return {
      id: id, disabled: false, hidden: false, tabIndex: 0,
      getAttribute: function () { return null; },
      focus: function () { focused.push(id); ownerDocument.activeElement = this; }
    };
  }
  const first = node('first');
  const middle = node('middle');
  const last = node('last');
  ownerDocument.activeElement = last;
  const dialog = {
    ownerDocument: ownerDocument,
    querySelectorAll: function (selector) {
      assert.strictEqual(selector, 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      return { 0: first, 1: middle, 2: last, length: 3, forEach: function () { throw new Error('NodeList method called'); } };
    }
  };
  let prevented = 0;
  const forward = { key: 'Tab', shiftKey: false, preventDefault: function () { prevented += 1; } };
  assert.strictEqual(journeyView.trapTab(forward, dialog), true);
  ownerDocument.activeElement = first;
  assert.strictEqual(journeyView.trapTab({ key: 'Tab', shiftKey: true, preventDefault: forward.preventDefault }, dialog), true);
  ownerDocument.activeElement = middle;
  assert.strictEqual(journeyView.trapTab(forward, dialog), false);
  ownerDocument.activeElement = { id: 'outside' };
  assert.strictEqual(journeyView.trapTab(forward, dialog), true);
  ownerDocument.activeElement = { id: 'outside' };
  assert.strictEqual(journeyView.trapTab({ key: 'Tab', shiftKey: true, preventDefault: forward.preventDefault }, dialog), true);
  assert.deepStrictEqual(focused, ['first', 'last', 'first', 'last']);
  assert.strictEqual(prevented, 4);
});

test('journey focus trap leaves native tab order when a focused heading remains inside the dialog', function () {
  const ownerDocument = { activeElement: null };
  let controls = [];
  const heading = { tabIndex: -1, isConnected: true };
  const first = {
    tabIndex: 0, disabled: false, hidden: false, isConnected: true,
    ownerDocument: ownerDocument,
    getAttribute: function () { return null; },
    focus: function () { ownerDocument.activeElement = this; }
  };
  const dialog = {
    isConnected: true,
    ownerDocument: ownerDocument,
    contains: function (node) { return node === heading || node === first; },
    querySelectorAll: function () {
      return controls.length ? { 0: first, length: 1 } : { length: 0 };
    },
    focus: function () { ownerDocument.activeElement = this; }
  };
  let prevented = 0;
  ownerDocument.activeElement = heading;
  assert.strictEqual(journeyView.trapTab({
    key: 'Tab', preventDefault: function () { prevented += 1; }
  }, dialog), false);
  assert.strictEqual(journeyView.trapTab({
    key: 'Tab', shiftKey: true, preventDefault: function () { prevented += 1; }
  }, dialog), false);
  assert.strictEqual(ownerDocument.activeElement, heading);
  assert.strictEqual(prevented, 0);

  heading.isConnected = false;
  controls = [first];
  assert.strictEqual(journeyView.trapTab({
    key: 'Tab', preventDefault: function () { prevented += 1; }
  }, dialog), true);
  assert.strictEqual(ownerDocument.activeElement, first);
  assert.strictEqual(prevented, 1);
});

test('journey focus trap filters unavailable controls and handles empty or hostile dialogs', function () {
  function unavailable(properties) {
    return Object.assign({
      disabled: false, hidden: false, tabIndex: 0, getAttribute: function () { return null; }, focus: function () {}
    }, properties);
  }
  const good = unavailable({ id: 'good' });
  const nodes = [
    unavailable({ disabled: true }), unavailable({ hidden: true }),
    unavailable({ getAttribute: function () { return 'true'; } }), unavailable({ tabIndex: -1 }), good
  ];
  let focused = 0;
  const ownerDocument = { activeElement: {} };
  good.focus = function () { focused += 1; ownerDocument.activeElement = good; };
  const dialog = {
    ownerDocument: ownerDocument,
    querySelectorAll: function () { return { 0: nodes[0], 1: nodes[1], 2: nodes[2], 3: nodes[3], 4: nodes[4], length: 5 }; }
  };
  assert.strictEqual(journeyView.trapTab({ key: 'Tab', preventDefault: function () {} }, dialog), true);
  assert.strictEqual(focused, 1);

  let dialogFocused = 0;
  let prevented = 0;
  const empty = {
    ownerDocument: { activeElement: null },
    querySelectorAll: function () { return { length: 0 }; },
    focus: function () { dialogFocused += 1; this.ownerDocument.activeElement = this; }
  };
  assert.strictEqual(journeyView.trapTab({ key: 'Tab', preventDefault: function () { prevented += 1; } }, empty), true);
  assert.deepStrictEqual([dialogFocused, prevented], [1, 1]);
  assert.strictEqual(journeyView.trapTab({ key: 'Enter' }, empty), false);
  [null, {}, { querySelectorAll: function () { throw new Error('query failure'); } }].forEach(function (hostile) {
    assert.doesNotThrow(function () { journeyView.trapTab({ key: 'Tab' }, hostile); });
    assert.strictEqual(journeyView.trapTab({ key: 'Tab' }, hostile), false);
  });
  const hostileEvent = {};
  Object.defineProperty(hostileEvent, 'key', { get: function () { throw new Error('key read'); } });
  assert.strictEqual(journeyView.trapTab(hostileEvent, empty), false);
});

test('journey focus trap follows native positive tabindex order and deduplicates nodes', function () {
  const ownerDocument = { activeElement: {} };
  const attempts = [];
  function node(id, tabIndex, transfers) {
    return {
      id: id, disabled: false, hidden: false, tabIndex: tabIndex, isConnected: true,
      ownerDocument: ownerDocument,
      getAttribute: function () { return null; },
      focus: function () {
        attempts.push(id);
        if (transfers) ownerDocument.activeElement = this;
      }
    };
  }
  const zeroFirst = node('zero-first', 0, true);
  const positiveThree = node('positive-three', 3, true);
  const positiveOneFailed = node('positive-one-failed', 1, false);
  const positiveOne = node('positive-one', 1, true);
  const zeroLast = node('zero-last', 0, true);
  const candidates = [zeroFirst, positiveThree, positiveOneFailed, positiveOneFailed, positiveOne, zeroLast];
  const dialog = {
    ownerDocument: ownerDocument,
    querySelectorAll: function () {
      return { 0: candidates[0], 1: candidates[1], 2: candidates[2], 3: candidates[3],
        4: candidates[4], 5: candidates[5], length: 6 };
    }
  };
  let prevented = 0;
  assert.strictEqual(journeyView.trapTab({
    key: 'Tab', preventDefault: function () { prevented += 1; }
  }, dialog), true);
  assert.strictEqual(ownerDocument.activeElement, positiveOne);
  assert.deepStrictEqual(attempts, ['positive-one-failed', 'positive-one']);
  assert.strictEqual(prevented, 1);

  attempts.length = 0;
  ownerDocument.activeElement = {};
  assert.strictEqual(journeyView.trapTab({
    key: 'Tab', shiftKey: true, preventDefault: function () { prevented += 1; }
  }, dialog), true);
  assert.strictEqual(ownerDocument.activeElement, zeroLast);
  assert.deepStrictEqual(attempts, ['zero-last']);
  assert.strictEqual(prevented, 2);
});

test('journey focus trap filters disconnected CSS-hidden inert and hostile candidates', function () {
  const ownerDocument = {
    activeElement: {},
    defaultView: {
      getComputedStyle: function (node) {
        return node.computedStyle || { display: 'block', visibility: 'visible' };
      }
    }
  };
  const focused = [];
  function node(id, properties) {
    return Object.assign({
      id: id, disabled: false, hidden: false, inert: false, tabIndex: 0, isConnected: true,
      ownerDocument: ownerDocument, parentElement: null,
      getAttribute: function (name) { return this.attributes && this.attributes[name] !== undefined ? this.attributes[name] : null; },
      focus: function () { focused.push(id); ownerDocument.activeElement = this; }
    }, properties || {});
  }
  const disconnected = node('disconnected', { isConnected: false });
  const displayNone = node('display-none', { computedStyle: { display: 'none', visibility: 'visible' } });
  const visibilityHidden = node('visibility-hidden', { computedStyle: { display: 'block', visibility: 'hidden' } });
  const inertAncestor = node('inert-ancestor', { inert: true });
  const underInert = node('under-inert', { parentElement: inertAncestor });
  const hiddenAncestor = node('hidden-ancestor', { hidden: true });
  const underHidden = node('under-hidden', { parentElement: hiddenAncestor });
  const ariaAncestor = node('aria-ancestor', { attributes: { 'aria-hidden': 'true' } });
  const underAriaHidden = node('under-aria-hidden', { parentElement: ariaAncestor });
  const cssAncestor = node('css-ancestor', { computedStyle: { display: 'none', visibility: 'visible' } });
  const underCssHidden = node('under-css-hidden', { parentElement: cssAncestor });
  const noFocus = node('no-focus', { focus: null });
  const throwing = node('throwing');
  Object.defineProperty(throwing, 'inert', { get: function () { throw new Error('inert read'); } });
  const throwingFocus = node('throwing-focus');
  Object.defineProperty(throwingFocus, 'focus', { get: function () { throw new Error('focus read'); } });
  const good = node('good');
  const candidates = [
    disconnected, displayNone, visibilityHidden, underInert, underHidden, underAriaHidden,
    underCssHidden, noFocus, throwing, throwingFocus, good
  ];
  const list = { length: candidates.length };
  candidates.forEach(function (candidate, index) { list[index] = candidate; });
  const dialog = { ownerDocument: ownerDocument, querySelectorAll: function () { return list; } };
  assert.doesNotThrow(function () {
    assert.strictEqual(journeyView.trapTab({ key: 'Tab', preventDefault: function () {} }, dialog), true);
  });
  assert.deepStrictEqual(focused, ['good']);
  assert.strictEqual(ownerDocument.activeElement, good);
});

test('journey focus trap verifies focus and falls back without trapping dead targets', function () {
  const ownerDocument = { activeElement: {} };
  const attempts = [];
  function node(id, focus) {
    return {
      id: id, disabled: false, hidden: false, inert: false, tabIndex: 0, isConnected: true,
      ownerDocument: ownerDocument, parentElement: null,
      getAttribute: function () { return null; }, focus: focus
    };
  }
  const throws = node('throws', function () { attempts.push('throws'); throw new Error('focus failed'); });
  const noTransfer = node('no-transfer', function () { attempts.push('no-transfer'); });
  const disconnects = node('disconnects', function () {
    attempts.push('disconnects'); this.isConnected = false; ownerDocument.activeElement = this;
  });
  const good = node('good', function () { attempts.push('good'); ownerDocument.activeElement = this; });
  function dialogFor(candidates) {
    const list = { length: candidates.length };
    candidates.forEach(function (candidate, index) { list[index] = candidate; });
    return { ownerDocument: ownerDocument, querySelectorAll: function () { return list; } };
  }
  let prevented = 0;
  assert.strictEqual(journeyView.trapTab({
    key: 'Tab', preventDefault: function () { prevented += 1; }
  }, dialogFor([throws, noTransfer, disconnects, good])), true);
  assert.deepStrictEqual(attempts, ['throws', 'no-transfer', 'disconnects', 'good']);
  assert.strictEqual(ownerDocument.activeElement, good);
  assert.strictEqual(prevented, 1);

  attempts.length = 0;
  ownerDocument.activeElement = {};
  const exhausted = dialogFor([throws, noTransfer]);
  exhausted.isConnected = true;
  exhausted.focus = function () { attempts.push('dialog'); ownerDocument.activeElement = exhausted; };
  assert.strictEqual(journeyView.trapTab({
    key: 'Tab', preventDefault: function () { prevented += 1; }
  }, exhausted), true);
  assert.deepStrictEqual(attempts, ['throws', 'no-transfer', 'dialog']);
  assert.strictEqual(ownerDocument.activeElement, exhausted);
  assert.strictEqual(prevented, 2);

  const empty = dialogFor([]);
  empty.focus = function () { attempts.push('dialog-no-transfer'); };
  assert.strictEqual(journeyView.trapTab({
    key: 'Tab', preventDefault: function () { prevented += 1; }
  }, empty), false);
  assert.strictEqual(prevented, 2);
});

test('journey focus trap retains the dialog when candidate focus synchronously replaces its subtree', function () {
  const ownerDocument = { activeElement: {} };
  const attempts = [];
  let queries = 0;
  function node(id) {
    return {
      id: id, disabled: false, hidden: false, inert: false, tabIndex: 0, isConnected: true,
      ownerDocument: ownerDocument, parentElement: null,
      getAttribute: function () { return null; },
      focus: function () { attempts.push(id); }
    };
  }
  const first = node('first');
  const second = node('second');
  first.focus = function () {
    attempts.push('first');
    first.isConnected = false;
    second.isConnected = false;
    ownerDocument.activeElement = first;
  };
  const dialog = {
    isConnected: true,
    ownerDocument: ownerDocument,
    querySelectorAll: function () {
      queries += 1;
      return { 0: first, 1: second, length: 2 };
    },
    focus: function () { attempts.push('dialog'); ownerDocument.activeElement = dialog; }
  };
  let prevented = 0;
  assert.strictEqual(journeyView.trapTab({
    key: 'Tab', preventDefault: function () { prevented += 1; }
  }, dialog), true);
  assert.deepStrictEqual(attempts, ['first', 'dialog']);
  assert.strictEqual(ownerDocument.activeElement, dialog);
  assert.strictEqual(queries, 1);
  assert.strictEqual(prevented, 1);
});

test('journey view maps swipes only beyond the deliberate threshold', function () {
  assert.strictEqual(journeyView.swipeDirection(300, 210, 56), 'next');
  assert.strictEqual(journeyView.swipeDirection(210, 300, 56), 'previous');
  assert.strictEqual(journeyView.swipeDirection(200, 170, 56), 'none');
});

test('journey view swipe direction validates inputs and includes the threshold boundary', function () {
  assert.strictEqual(journeyView.swipeDirection(100, 44), 'next');
  assert.strictEqual(journeyView.swipeDirection(44, 100), 'previous');
  assert.strictEqual(journeyView.swipeDirection(100, 100, 56), 'none');
  assert.strictEqual(journeyView.swipeDirection(100, 45, 56), 'none');
  [NaN, Infinity, '100', null, {}].forEach(function (value) {
    assert.strictEqual(journeyView.swipeDirection(value, 0, 56), 'none');
    assert.strictEqual(journeyView.swipeDirection(0, value, 56), 'none');
  });
  [0, -1, NaN, Infinity, '56', null].forEach(function (threshold) {
    assert.strictEqual(journeyView.swipeDirection(100, 0, threshold), 'none');
  });
});

test('journey view exposes the exact UMD API without touching the DOM at initialization', function () {
  const expected = [
    'catalogHtml', 'completeHtml', 'escapeHtml', 'stageHtml', 'swipeDirection', 'template', 'trapTab', 'updateClock'
  ];
  assert.deepStrictEqual(Object.keys(journeyView).sort(), expected);
  const source = fs.readFileSync(path.join(root, 'journey-view.js'), 'utf8');
  const browserRoot = {};
  Object.defineProperty(browserRoot, 'document', { get: function () { throw new Error('DOM accessed during initialization'); } });
  const browserContext = { self: browserRoot };
  vm.runInNewContext(source, browserContext, { filename: 'journey-view.js' });
  assert.deepStrictEqual(Object.keys(browserRoot.ParallelWorldsJourneyView).sort(), expected);

  const commonRoot = {};
  const commonContext = { self: commonRoot, module: { exports: {} } };
  vm.runInNewContext(source, commonContext, { filename: 'journey-view.js' });
  assert.strictEqual(commonRoot.ParallelWorldsJourneyView, commonContext.module.exports);
  assert.deepStrictEqual(Object.keys(commonContext.module.exports).sort(), expected);
});

test('journey view contains no inline handlers or network calls', function () {
  const source = fs.readFileSync(path.join(root, 'journey-view.js'), 'utf8');
  ['fetch(', 'XMLHttpRequest', '<script src="http', 'http://', 'https://'].forEach(function (marker) {
    assert.strictEqual(source.indexOf(marker), -1, marker);
  });
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const copy = {
    catalogTitle: 'Routes', startJourney: 'Start', minutesTemplate: '{minutes} min', stopsTemplate: '{count} stops',
    previousStop: 'Previous', nextStop: 'Next', pauseJourney: 'Pause', resumeJourney: 'Resume',
    shareJourney: 'Share', openEvidence: 'Evidence', stopTemplate: 'Stop {current} of {total}',
    completeKicker: 'Complete', exploreMoment: 'Explore', replayJourney: 'Replay', backCatalog: 'Catalog'
  };
  const outputs = [
    journeyView.catalogHtml([route], copy), journeyView.stageHtml(route, { stopIndex: 0, status: 'paused' }, copy, String),
    journeyView.completeHtml(route, copy)
  ];
  outputs.forEach(function (html) {
    assert.strictEqual(/\son[a-z]+\s*=/.test(html), false);
    assert.strictEqual(/\sstyle\s*=/.test(html), false);
    assert.strictEqual(/<(?:script|iframe|object|embed)\b/i.test(html), false);
  });
});

test('historical calendar skips year zero in both directions', function () {
  assert.strictEqual(chronology.isValidHistoricalYear(-1), true);
  assert.strictEqual(chronology.isValidHistoricalYear(1), true);
  assert.strictEqual(chronology.isValidHistoricalYear(0), false);
  assert.strictEqual(chronology.nextYear(-1, 1), 1);
  assert.strictEqual(chronology.nextYear(1, -1), -1);
  assert.strictEqual(chronology.historicalDistance(-1, 1), 1);
  assert.strictEqual(chronology.addHistoricalYears(-2, 2), 1);
});

test('chronology exposes deep-time and historical mode ranges', function () {
  const range = { start: -20000, end: 1600 };
  assert.deepStrictEqual(chronology.modeRange('overview', range), range);
  assert.deepStrictEqual(chronology.modeRange('deep', range), { start: -20000, end: -3500 });
  assert.deepStrictEqual(chronology.modeRange('historical', range), { start: -3500, end: 1600 });
});

test('piecewise chronology projects and reverses deep and historical time', function () {
  const scale = chronology.createScale(-20000, 1600, 'overview', -3500, 0.30);
  assert.strictEqual(chronology.projectYear(-20000, scale), 0);
  assert.ok(Math.abs(chronology.projectYear(-3500, scale) - 30) < 0.001);
  assert.strictEqual(chronology.projectYear(1600, scale), 100);
  [-20000, -12000, -3500, -1, 1, 1600].forEach(function (year) {
    const projected = chronology.projectYear(year, scale);
    assert.ok(Math.abs(chronology.unprojectYear(projected, scale) - year) <= 1, 'round-trip failed for ' + year);
  });
  const deep = chronology.createScale(-20000, -3500, 'deep');
  assert.strictEqual(chronology.projectYear(-11750, deep), 50);
  const historical = chronology.createScale(-3500, 1600, 'historical');
  assert.ok(chronology.projectYear(1, historical) > chronology.projectYear(-1, historical));
});

test('adaptive chronology ticks never manufacture year zero', function () {
  const overview = chronology.createScale(-20000, 1600, 'overview', -3500, 0.30);
  const ticks = chronology.ticks(overview, 10);
  assert.ok(ticks.length >= 8 && ticks.length <= 14);
  assert.strictEqual(ticks.indexOf(0), -1);
  assert.ok(ticks.indexOf(-3500) !== -1);
  assert.strictEqual(chronology.recommendedStep(overview), 500);
  assert.strictEqual(chronology.recommendedStep(chronology.createScale(-3500, 1600, 'historical')), 20);
});

test('academic schema accepts sourced reviewed records and rejects missing evidence', function () {
  const sources = {
    exact: {
      id: 'exact', tier: 'A', kind: 'peer-reviewed-article', title: 'Exact chronology',
      publisher: 'Journal of Tests', year: 2025, url: 'https://doi.org/10.1000/example', accessed: '2026-07-15'
    }
  };
  const copy = {
    ru: { name: 'Запись', summary: 'Описание' },
    en: { name: 'Record', summary: 'Description' },
    zh: { name: '记录', summary: '说明' }
  };
  const recordCopy = {
    ru: { name: 'Период', note: 'Примечание' },
    en: { name: 'Period', note: 'Note' },
    zh: { name: '时期', note: '说明' }
  };
  const eventCopy = {
    ru: { title: 'Событие', note: 'Примечание' },
    en: { title: 'Event', note: 'Note' },
    zh: { title: '事件', note: '说明' }
  };
  const track = {
    id: 'reviewed-fixture', region: 'east-asia', type: 'site', reviewStatus: 'reviewed', copy: copy,
    periods: [{ id: 'reviewed-period', start: -12000, end: -11000, dating: { precision: 'range', basis: 'radiocarbon', original: '12,000–11,000 BCE' }, sourceIds: ['exact'], copy: recordCopy }],
    events: [{ id: 'reviewed-event', year: -11500, dating: { precision: 'approximate', basis: 'radiocarbon' }, sourceIds: ['exact'], copy: eventCopy }]
  };
  assert.deepStrictEqual(quality.validateReviewedTrack(track, sources, { start: -20000, end: 1600 }), []);

  const missingSources = JSON.parse(JSON.stringify(track));
  missingSources.periods[0].sourceIds = [];
  assert.ok(quality.validateReviewedTrack(missingSources, sources, { start: -20000, end: 1600 }).some(function (issue) { return issue.code === 'missing-source'; }));

  const yearZero = JSON.parse(JSON.stringify(track));
  yearZero.events[0].year = 0;
  assert.ok(quality.validateReviewedTrack(yearZero, sources, { start: -20000, end: 1600 }).some(function (issue) { return issue.code === 'year-zero'; }));
});

test('academic schema validates confidence and alternative chronology models', function () {
  const sources = {
    exact: {
      id: 'exact', tier: 'A', kind: 'peer-reviewed-article', title: 'Exact chronology',
      publisher: 'Journal of Tests', year: 2025, url: 'https://doi.org/10.1000/example', accessed: '2026-07-16'
    }
  };
  const track = {
    id: 'dating-fixture', region: 'west-asia', type: 'site', reviewStatus: 'reviewed',
    copy: {
      ru: { name: 'Запись', summary: 'Описание' }, en: { name: 'Record', summary: 'Description' }, zh: { name: '记录', summary: '说明' }
    },
    periods: [{
      id: 'dating-period', start: -12000, end: -11000, sourceIds: ['exact'],
      dating: {
        precision: 'range', basis: 'radiocarbon', original: '12,000–11,000 BCE', confidence: 'high',
        calibrationCurve: 'IntCal20', model: 'preferred',
        alternatives: [{
          id: 'short-model', start: -11900, end: -11100, label: 'Short model',
          copy: { ru: { label: 'Короткая модель' }, en: { label: 'Short model' }, zh: { label: '短模型' } }
        }],
        disputeNote: 'The alternative uses a narrower posterior interval.',
        copy: {
          ru: { model: 'предпочтительная', disputeNote: 'Альтернатива использует более узкий апостериорный интервал.' },
          en: { model: 'preferred', disputeNote: 'The alternative uses a narrower posterior interval.' },
          zh: { model: '首选模型', disputeNote: '备选方案使用更窄的后验区间。' }
        }
      },
      copy: {
        ru: { name: 'Период', note: 'Примечание' }, en: { name: 'Period', note: 'Note' }, zh: { name: '时期', note: '说明' }
      }
    }],
    events: [{
      id: 'dating-event', year: -11500, sourceIds: ['exact'],
      dating: { precision: 'approximate', basis: 'radiocarbon', confidence: 'medium', calibrationCurve: 'IntCal20' },
      copy: {
        ru: { title: 'Событие', note: 'Примечание' }, en: { title: 'Event', note: 'Note' }, zh: { title: '事件', note: '说明' }
      }
    }]
  };
  const range = { start: -20000, end: 1600 };
  assert.deepStrictEqual(quality.validateReviewedTrack(track, sources, range), []);

  function issueCodes(mutator) {
    const invalid = JSON.parse(JSON.stringify(track));
    mutator(invalid.periods[0].dating);
    return quality.validateReviewedTrack(invalid, sources, range).map(function (item) { return item.code; });
  }

  assert.ok(issueCodes(function (dating) { dating.confidence = 'certain'; }).indexOf('invalid-confidence') !== -1);
  assert.ok(issueCodes(function (dating) { dating.alternatives.push(Object.assign({}, dating.alternatives[0])); }).indexOf('duplicate-alternative-id') !== -1);
  assert.ok(issueCodes(function (dating) { dating.alternatives[0].start = 0; }).indexOf('year-zero') !== -1);
  assert.ok(issueCodes(function (dating) { dating.alternatives[0].start = -11000; dating.alternatives[0].end = -11900; }).indexOf('invalid-alternative-range') !== -1);
  assert.ok(issueCodes(function (dating) { delete dating.disputeNote; }).indexOf('missing-dispute-note') !== -1);
  assert.ok(issueCodes(function (dating) { dating.precision = 'disputed'; dating.alternatives = []; delete dating.disputeNote; }).indexOf('missing-dispute-note') !== -1);
  assert.ok(issueCodes(function (dating) { delete dating.copy.ru.model; }).indexOf('missing-localization') !== -1);
  assert.ok(issueCodes(function (dating) { delete dating.copy.zh.disputeNote; }).indexOf('missing-localization') !== -1);
  assert.ok(issueCodes(function (dating) { delete dating.alternatives[0].copy.ru.label; }).indexOf('missing-localization') !== -1);
  assert.ok(issueCodes(function (dating) { dating.copy.ru.model = '   '; }).indexOf('missing-localization') !== -1);
  assert.ok(issueCodes(function (dating) { dating.copy.zh.disputeNote = '   '; }).indexOf('missing-localization') !== -1);
  assert.ok(issueCodes(function (dating) { dating.alternatives[0].copy.en.label = '   '; }).indexOf('missing-localization') !== -1);
});

test('hardcover edition manifest fixes the approved physical and editorial structure', function () {
  const validation = edition.validateManifest(editionData);
  assert.deepStrictEqual(validation.issues, []);
  assert.strictEqual(editionData.id, 'hardcover-ru-first-edition');
  assert.deepStrictEqual(editionData.format, {
    widthMm: 300, heightMm: 240, orientation: 'landscape', language: 'ru'
  });
  assert.deepStrictEqual(editionData.pagePlan, {
    opening: 16, windows: 192, interludes: 32, apparatus: 48, total: 288
  });
  assert.strictEqual(editionData.windows.length, 12);
  assert.strictEqual(editionData.interludes.length, 8);
  assert.deepStrictEqual(editionData.windows.map(function (window) { return window.anchorYear; }),
    [-18000, -9500, -6500, -3500, -2500, -1200, -500, 200, 650, 1000, 1250, 1450]);
});

test('edition manifest validation rejects unsafe ids, year zero, duplicate routes and bad production invariants', function () {
  const fixture = JSON.parse(JSON.stringify(editionData));
  fixture.windows[0].id = '<script>';
  fixture.windows[1].anchorYear = 0;
  fixture.windows[2].companionPath = fixture.windows[3].companionPath;
  fixture.pagePlan.total = 287;
  fixture.format.widthMm = 301;
  fixture.interludes.pop();
  fixture.printRun.minimum = 499;
  const codes = edition.validateManifest(fixture).issues.map(function (issue) { return issue.code; });
  [
    'invalid-id', 'invalid-anchor-year', 'duplicate-companion-path', 'page-plan-mismatch',
    'invalid-format', 'interlude-count', 'invalid-print-run'
  ].forEach(function (code) {
    assert.ok(codes.indexOf(code) !== -1, 'missing ' + code);
  });
});

test('edition validation ignores inherited and accessor-controlled collections without throwing', function () {
  assert.doesNotThrow(function () { edition.validateManifest(null); });
  const inherited = Object.create({ windows: editionData.windows });
  inherited.version = 1;
  assert.ok(edition.validateManifest(inherited).issues.some(function (issue) {
    return issue.code === 'invalid-windows';
  }));
  const accessor = {};
  Object.defineProperty(accessor, 'windows', {
    get: function () { throw new Error('windows getter called'); }
  });
  assert.doesNotThrow(function () { edition.validateManifest(accessor); });
});

test('edition readiness reports reviewed active tracks, regions and exact-source coverage', function () {
  const fixtureData = {
    sources: {
      exact: {
        tier: 'A', kind: 'peer-reviewed-article', title: 'Exact chronology',
        url: 'https://doi.org/10.1000/edition-fixture'
      }
    },
    tracks: [
      {
        id: 'a', region: 'africa', reviewStatus: 'reviewed',
        periods: [{
          id: 'a-period', start: -600, end: -400, sourceIds: ['exact'],
          dating: { basis: 'radiocarbon', precision: 'range', original: '600–400 BCE' }
        }], events: []
      },
      {
        id: 'b', region: 'east-asia', reviewStatus: 'legacy',
        periods: [{ id: 'b-period', start: -600, end: -400, sourceIds: ['exact'] }], events: []
      }
    ]
  };
  const fixtureManifest = {
    windows: [{ id: 'window-07', anchorYear: -500, requirements: { reviewedTracks: 1, regions: 1 } }]
  };
  const report = edition.buildReadiness(fixtureManifest, fixtureData);
  assert.deepStrictEqual(report.windows[0].reviewedTrackIds, ['a']);
  assert.deepStrictEqual(report.windows[0].legacyTrackIds, ['b']);
  assert.deepStrictEqual(report.windows[0].regions, ['africa']);
  assert.strictEqual(report.windows[0].status, 'ready');
});

test('edition readiness exposes deterministic gaps instead of treating legacy data as ready', function () {
  const report = edition.buildReadiness(editionData, data);
  assert.strictEqual(report.windows.length, 12);
  report.windows.forEach(function (window) {
    assert.ok(['ready', 'needs-review'].includes(window.status));
    assert.deepStrictEqual(window.reviewedTrackIds, window.reviewedTrackIds.slice().sort());
    assert.deepStrictEqual(window.regions, window.regions.slice().sort());
    assert.ok(Array.isArray(window.gaps));
  });
  assert.deepStrictEqual(report, edition.buildReadiness(editionData, data));
});

test('academic audit is deterministic and separates reviewed coverage from legacy warnings', function () {
  const audit = require(path.join(root, 'academic-audit.js'));
  const source = {
    tier: 'A', kind: 'peer-reviewed-article', title: 'Fixture chronology', publisher: 'Journal of Tests',
    year: 2025, url: 'https://doi.org/10.1000/audit-fixture', accessed: '2026-07-16'
  };
  const trackCopy = {
    ru: { name: 'Запись', summary: 'Описание' }, en: { name: 'Record', summary: 'Description' }, zh: { name: '记录', summary: '说明' }
  };
  const periodCopy = {
    ru: { name: 'Период', note: '' }, en: { name: 'Period', note: '' }, zh: { name: '时期', note: '' }
  };
  const eventCopy = {
    ru: { title: 'Событие', note: '' }, en: { title: 'Event', note: '' }, zh: { title: '事件', note: '' }
  };
  const fixture = {
    range: { start: -20000, end: 1600 },
    sources: {
      exact: source,
      legacyHome: { title: 'Legacy homepage', url: 'https://example.org/' },
      malformed: {
        tier: 'Z', kind: 'personal-blog', title: 'Plausible-looking non-academic source', publisher: 'Example',
        year: 2025, url: 'https://example.org/chronology/article', accessed: '2026-07-16'
      }
    },
    tracks: [{
      id: 'reviewed', region: 'west-asia', type: 'site', reviewStatus: 'reviewed', copy: trackCopy,
      periods: [{ id: 'reviewed-period', start: -1000, end: -900, dating: { precision: 'range', basis: 'historical' }, sourceIds: ['exact'], copy: periodCopy }],
      events: [{ id: 'reviewed-event', year: -950, dating: { precision: 'approximate', basis: 'historical' }, sourceIds: ['exact'], copy: eventCopy }]
    }, {
      id: 'legacy', region: 'west-asia', type: 'civilization', reviewStatus: 'legacy', sources: ['legacyHome'],
      periods: [{ start: -800, end: -700, sourceIds: ['legacyHome', 'malformed'] }],
      events: [{ year: -750, sourceIds: ['missing'] }]
    }]
  };

  const first = audit.buildAudit(fixture);
  const second = audit.buildAudit(fixture);
  assert.deepStrictEqual(first, second);
  assert.strictEqual(first.generatedAt, undefined);
  assert.deepStrictEqual(first.summary, {
    tracks: 2, reviewedTracks: 1, legacyTracks: 1, blockingIssues: 0, warnings: 3
  });
  assert.deepStrictEqual(first.coverage, {
    periods: { total: 2, sourced: 1, dated: 1 }, events: { total: 2, sourced: 1, dated: 1 }
  });
  assert.strictEqual(first.issues.filter(function (item) { return item.code === 'legacy-track'; }).length, 1);
  assert.strictEqual(first.issues.filter(function (item) { return item.code === 'generic-source'; }).length, 2);
});

test('academic audit reports reviewed directed journey coverage', function () {
  const report = require(path.join(root, 'academic-audit.js')).buildAudit(data, journeysData);
  assert.deepStrictEqual(report.journeyCoverage, { routes: 1, stops: 7, reviewedStops: 7 });
  assert.deepStrictEqual(report.journeys, [{ id: 'birth-of-cities', stops: 7, reviewedStops: 7 }]);
  assert.strictEqual(report.summary.blockingIssues, 0);
});

test('academic audit promotes invalid journey references to blockers', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  fixture.routes[0].stops[0].recordRefs[0].trackId = 'missing-track';
  const report = require(path.join(root, 'academic-audit.js')).buildAudit(data, fixture);
  assert.ok(report.summary.blockingIssues > 0);
  assert.ok(report.issues.some(function (item) { return item.code === 'unknown-track'; }));
});

test('academic audit promotes invalid journey duration to a blocker', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  fixture.routes[0].durationSeconds = 181;
  const report = require(path.join(root, 'academic-audit.js')).buildAudit(data, fixture);
  assert.ok(report.summary.blockingIssues > 0);
  assert.ok(report.issues.some(function (item) {
    return item.severity === 'error' && item.code === 'invalid-journey-duration' &&
      item.path === 'journeys.routes[0].durationSeconds';
  }));
});

test('academic audit fails closed for malformed journey collections', function () {
  const report = require(path.join(root, 'academic-audit.js')).buildAudit(data, { version: 1, routes: {} });
  assert.deepStrictEqual(report.journeys, []);
  assert.deepStrictEqual(report.journeyCoverage, { routes: 0, stops: 0, reviewedStops: 0 });
  assert.ok(report.summary.blockingIssues > 0);
  const collectionIssue = report.issues.find(function (item) {
    return item.code === 'invalid-journey-collection';
  });
  assert.deepStrictEqual(collectionIssue, {
    severity: 'error',
    code: 'invalid-journey-collection',
    path: 'journeys.routes',
    message: 'Journey collection routes must be an array'
  });
});

test('academic audit blocks sparse and inherited route entries without inherited metadata', function () {
  const sparse = { version: 1, routes: new Array(1) };
  const inheritedObject = JSON.parse(JSON.stringify(journeysData));
  inheritedObject.routes[0] = Object.create(inheritedObject.routes[0]);
  const inheritedIndex = {
    version: 1,
    routes: arrayWithInheritedValue(JSON.parse(JSON.stringify(journeysData.routes[0])))
  };
  const audit = require(path.join(root, 'academic-audit.js'));

  [{ label: 'sparse', collection: sparse },
    { label: 'inherited object', collection: inheritedObject },
    { label: 'inherited array index', collection: inheritedIndex }].forEach(function (fixture) {
    const report = audit.buildAudit(data, fixture.collection);
    assert.ok(report.summary.blockingIssues > 0, fixture.label);
    assert.deepStrictEqual(report.journeys, [], fixture.label);
    assert.deepStrictEqual(report.journeyCoverage, {
      routes: 0, stops: 0, reviewedStops: 0
    }, fixture.label);
    assert.deepStrictEqual(report.issues.find(function (item) {
      return item.code === 'invalid-journey-entry';
    }), {
      severity: 'error',
      code: 'invalid-journey-entry',
      path: 'journeys.routes[0]',
      message: 'Journey route entries must be own plain objects'
    }, fixture.label);
  });
});

test('academic audit preserves canonical paths from journey validation', function () {
  const audit = require(path.join(root, 'academic-audit.js'));
  const report = audit.buildAudit({
    range: { start: -20000, end: 1600 }, sources: {}, tracks: null
  }, { version: 1, routes: [] });
  assert.deepStrictEqual(report.issues.find(function (item) { return item.code === 'invalid-dataset'; }), {
    severity: 'error',
    code: 'invalid-dataset',
    path: 'data.tracks',
    message: 'Canonical data tracks must be an array'
  });
});

test('academic audit blocks inherited manifest routes without journey metadata', function () {
  const fixture = Object.create({ routes: JSON.parse(JSON.stringify(journeysData.routes)) });
  const report = require(path.join(root, 'academic-audit.js')).buildAudit(data, fixture);
  assert.ok(report.summary.blockingIssues > 0);
  assert.deepStrictEqual(report.journeys, []);
  assert.deepStrictEqual(report.issues.find(function (item) {
    return item.code === 'invalid-journey-collection';
  }), {
    severity: 'error',
    code: 'invalid-journey-collection',
    path: 'journeys.routes',
    message: 'Journey collection routes must be an array'
  });
});

test('academic audit rejects explicit falsy journey manifests', function () {
  const audit = require(path.join(root, 'academic-audit.js'));
  [{ label: 'null', value: null }, { label: 'false', value: false },
    { label: 'zero', value: 0 }, { label: 'empty string', value: '' }].forEach(function (fixture) {
    const report = audit.buildAudit(data, fixture.value);
    assert.deepStrictEqual(report.journeys, [], fixture.label);
    assert.deepStrictEqual(report.journeyCoverage, {
      routes: 0, stops: 0, reviewedStops: 0
    }, fixture.label);
    assert.ok(report.summary.blockingIssues > 0, fixture.label);
    assert.ok(report.issues.some(function (item) {
      return item.severity === 'error' && item.code === 'invalid-journey-collection' &&
        item.path === 'journeys.routes' && item.journeyId === undefined;
    }), fixture.label);
  });
});

test('academic audit defaults missing journeys to an explicit valid empty collection', function () {
  const audit = require(path.join(root, 'academic-audit.js'));
  [audit.buildAudit(data), audit.buildAudit(data, undefined)].forEach(function (report) {
    assert.deepStrictEqual(report.journeyCoverage, { routes: 0, stops: 0, reviewedStops: 0 });
    assert.deepStrictEqual(report.journeys, []);
    assert.deepStrictEqual(report.summary, {
      tracks: 62, reviewedTracks: 25, legacyTracks: 37, blockingIssues: 0, warnings: 42
    });
    assert.ok(!report.issues.some(function (item) { return item.path.indexOf('journeys.') === 0; }));
  });
});

test('academic audit orders valid journey reports deterministically', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  const later = fixture.routes[0];
  later.id = 'z-route';
  const earlier = JSON.parse(JSON.stringify(later));
  earlier.id = 'a-route';
  fixture.routes = [later, earlier];
  const audit = require(path.join(root, 'academic-audit.js'));
  const first = audit.buildAudit(data, fixture);
  const second = audit.buildAudit(data, fixture);
  assert.deepStrictEqual(first, second);
  assert.deepStrictEqual(first.journeys, [
    { id: 'a-route', stops: 7, reviewedStops: 7 },
    { id: 'z-route', stops: 7, reviewedStops: 7 }
  ]);
  assert.deepStrictEqual(first.journeyCoverage, { routes: 2, stops: 14, reviewedStops: 14 });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(first.journeys)), first.journeys);
});

test('academic audit prefixes journey issue paths and identifies their route', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  fixture.routes[0].stops[0].recordRefs[0].trackId = 'missing-track';
  const report = require(path.join(root, 'academic-audit.js')).buildAudit(data, fixture);
  assert.deepStrictEqual(report.issues.find(function (item) { return item.code === 'unknown-track'; }), {
    severity: 'error',
    code: 'unknown-track',
    path: 'journeys.routes[0].stops[0].recordRefs[0].trackId',
    message: 'Journey references an unknown track',
    journeyId: 'birth-of-cities'
  });
  assert.deepStrictEqual(report.journeys, []);
});

test('academic audit promotes invalid reviewed records to blocking errors', function () {
  const audit = require(path.join(root, 'academic-audit.js'));
  const report = audit.buildAudit({
    range: { start: -20000, end: 1600 }, sources: {}, tracks: [{
      id: 'broken-reviewed', region: 'west-asia', type: 'site', reviewStatus: 'reviewed',
      copy: {}, periods: [], events: []
    }]
  });
  assert.ok(report.summary.blockingIssues > 0);
  assert.ok(report.issues.some(function (item) { return item.severity === 'error' && item.trackId === 'broken-reviewed'; }));
});

test('academic audit build script serializes the canonical deterministic report', function () {
  const audit = require(path.join(root, 'academic-audit.js'));
  const script = path.join(root, 'scripts/build-academic-audit.mjs');
  const artifact = path.join(root, 'academic-audit.json');
  const expected = JSON.stringify(audit.buildAudit(data, journeysData), null, 2) + '\n';
  const committed = fs.readFileSync(artifact, 'utf8');
  assert.strictEqual(committed, expected);
  const output = childProcess.spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(output.status, 0, output.stderr || output.stdout);
  const serialized = fs.readFileSync(artifact, 'utf8');
  assert.strictEqual(serialized, committed);
});

test('academic data shell and source URL validation are explicit', function () {
  assert.ok(Array.isArray(academicData.tracks));
  assert.ok(academicData.tracks.some(function (track) { return track.id === 'uruk'; }));
  assert.ok(academicData.patches && academicData.patches.china && academicData.patches.korea && academicData.patches.sumer);
  assert.strictEqual(academicData.scale.breakpoint, -3500);
  assert.strictEqual(quality.isGenericHomepage('https://www.metmuseum.org/'), true);
  assert.strictEqual(quality.isGenericHomepage('https://www.metmuseum.org/essays/uruk-the-first-city'), false);
});

test('Mehrgarh journey evidence identifies Kenoyer publication metadata exactly', function () {
  const source = academicData.sources['kenoyer-indus-2011'];
  assert.strictEqual(source.title, 'Changing Perspectives of the Indus Civilization: New Discoveries and Challenges');
  assert.strictEqual(source.publisher, 'Indian Archaeological Society (Puratattva 41)');
  assert.strictEqual(source.year, 2011);
  const mehrgarh = academicData.tracks.find(function (track) { return track.id === 'mehrgarh'; });
  const event = mehrgarh.events.find(function (item) { return item.id === 'mehrgarh-food-production'; });
  assert.strictEqual(event.year, -7000);
  assert.deepStrictEqual(event.sourceIds, ['kenoyer-indus-2011']);
});

test('reviewed source registry covers every first-release region with exact records', function () {
  const required = [
    'science-xianrendong-2012', 'met-east-asia-neolithic-2000', 'unesco-liangzhu-2019', 'met-jomon-2002',
    'cambridge-natufian-2017', 'radiocarbon-near-east-2001', 'unesco-gobekli-2018', 'unesco-catalhoyuk-2012',
    'british-early-egypt', 'kenoyer-indus-2011', 'cambridge-mesolithic-europe-2008',
    'nature-americas-2020', 'nature-madjedbebe-2022', 'nature-lapita-2022',
    'met-korea-1998', 'nm-korea-unified-silla', 'met-china-three-kingdoms', 'met-uruk-2003',
    'science-egypt-chronology-2010', 'royal-society-early-egypt-2013',
    'met-egypt-old-kingdom-2019', 'met-egypt-middle-kingdom-2019', 'met-egypt-new-kingdom-2000',
    'met-akkadian-period-2004',
    'plos-mesopotamian-chronology-2016', 'met-old-babylonian-2017',
    'met-kassite-babylonia-2016', 'met-babylon-2016',
    'met-old-assyrian-2017', 'met-assyria-2004',
    'met-hittites-2002',
    'iranica-chronology-2004', 'iranica-arsacid-dynasty-1986', 'iranica-sasanian-dynasty-2005',
    'met-greek-prehistoric-classical-2000', 'met-greek-archaic-2003',
    'met-greek-classical-2008', 'met-greek-hellenistic-2007', 'met-greek-athletics-2002',
    'met-roman-republic-2000', 'met-roman-empire-2000', 'met-roman-kings-1989',
    'met-byzantium-2001'
  ];
  required.forEach(function (id) {
    const source = academicData.sources[id];
    assert.ok(source, 'missing source ' + id);
    ['tier', 'kind', 'title', 'publisher', 'year', 'url', 'accessed'].forEach(function (field) {
      assert.ok(source[field], id + ' missing ' + field);
    });
    assert.ok(/^https:\/\//.test(source.url), id + ' must use HTTPS');
    assert.strictEqual(quality.isGenericHomepage(source.url), false, id + ' uses a generic homepage');
  });
  assert.deepStrictEqual(quality.validateSources(academicData.sources), []);
});

test('dataset covers the requested world history scope', function () {
  assert.strictEqual(data.range.start, -20000);
  assert.strictEqual(data.range.end, 1600);
  assert.ok(data.tracks.length >= 49, 'expected at least 49 tracks');
  const ids = data.tracks.map(function (track) { return track.id; });
  ['sumer', 'egypt', 'byzantium', 'china', 'aztec', 'inca', 'christianity', 'islam', 'buddhism']
    .forEach(function (id) { assert.ok(ids.indexOf(id) !== -1, 'missing ' + id); });
});

test('priority chronology distinguishes Chinese and Korean Three Kingdoms and separates Uruk', function () {
  const china = data.tracks.find(function (track) { return track.id === 'china'; });
  const korea = data.tracks.find(function (track) { return track.id === 'korea'; });
  const sumer = data.tracks.find(function (track) { return track.id === 'sumer'; });
  const uruk = data.tracks.find(function (track) { return track.id === 'uruk'; });

  assert.ok(china.periods.some(function (period) { return period.id === 'china-three-kingdoms' && period.start === 220 && period.end === 280; }));
  assert.ok(china.periods.some(function (period) { return period.id === 'china-northern-southern-dynasties'; }));
  assert.ok(timeline.activeTracks([china], 350).length, 'China should not have a 220–581 gap');

  const koreanKingdoms = korea.periods.find(function (period) { return period.id === 'korea-three-kingdoms'; });
  assert.ok(koreanKingdoms);
  assert.ok(/Когурё.*Пэкче.*Силла/.test(koreanKingdoms.copy.ru.name));
  assert.ok(/Goguryeo.*Baekje.*Silla/.test(koreanKingdoms.copy.en.name));
  assert.ok(/高句丽.*百济.*新罗/.test(koreanKingdoms.copy.zh.name));
  assert.ok(korea.periods.every(function (period) { return period.name !== 'Три царства'; }));

  assert.ok(!/oldest|древнейш|最古/i.test(JSON.stringify(sumer)));
  assert.ok(!sumer.periods.some(function (period) { return /Uruk|Урук|乌鲁克/.test(JSON.stringify(period)); }));
  assert.ok(uruk && uruk.type === 'site');
});

test('priority corrected tracks pass full academic validation and inline localization', function () {
  ['sumer', 'china', 'korea', 'uruk'].forEach(function (id) {
    const track = data.tracks.find(function (item) { return item.id === id; });
    assert.deepStrictEqual(quality.validateReviewedTrack(track, data.sources, data.range), [], id + ' validation failed');
  });
  const english = i18n.localizeData(data, 'en');
  const chinese = i18n.localizeData(data, 'zh');
  assert.strictEqual(english.tracks.find(function (track) { return track.id === 'china'; }).periods.find(function (period) { return period.id === 'china-three-kingdoms'; }).name, 'Chinese Three Kingdoms');
  assert.strictEqual(chinese.tracks.find(function (track) { return track.id === 'korea'; }).periods.find(function (period) { return period.id === 'korea-three-kingdoms'; }).name, '朝鲜半岛三国：高句丽、百济、新罗');
});

function assertReviewedBatch(ids) {
  ids.forEach(function (id) {
    const track = data.tracks.find(function (item) { return item.id === id; });
    assert.ok(track, 'missing reviewed track ' + id);
    assert.strictEqual(track.reviewStatus, 'reviewed', id + ' remains legacy');
    assert.notStrictEqual(track.type, 'civilization', id + ' uses the obsolete civilization type');
    assert.strictEqual(track.periods.length, 4, id + ' must expose four explicit periods');
    assert.strictEqual(track.events.length, 3, id + ' must expose three evidence-backed events');
    assert.deepStrictEqual(quality.validateReviewedTrack(track, data.sources, data.range), [], id + ' validation failed');
    ['ru', 'en', 'zh'].forEach(function (locale) {
      assert.ok(track.copy[locale].name && track.copy[locale].summary, id + ' missing ' + locale + ' track copy');
      track.periods.forEach(function (period) {
        assert.ok(period.id && period.copy[locale].name, id + ' missing localized period');
      });
      track.events.forEach(function (event) {
        assert.ok(event.id && event.copy[locale].title, id + ' missing localized event');
      });
    });
    track.periods.concat(track.events).forEach(function (record) {
      assert.ok(record.dating && record.dating.precision && record.dating.basis, id + ' missing dating evidence');
      assert.ok(record.sourceIds && record.sourceIds.length, id + ' missing record sources');
      record.sourceIds.forEach(function (sourceId) {
        assert.ok(data.sources[sourceId], id + ' references unknown source ' + sourceId);
        assert.strictEqual(quality.isGenericHomepage(data.sources[sourceId].url), false, id + ' depends on a generic homepage');
      });
    });
  });
}

test('Egypt, Akkad, Babylonia, and Assyria use reviewed source-backed scopes', function () {
  assertReviewedBatch(['egypt', 'akkadia', 'babylonia', 'assyria']);

  const egypt = data.tracks.find(function (track) { return track.id === 'egypt'; });
  assert.deepStrictEqual(egypt.periods.map(function (period) { return [period.id, period.start, period.end]; }), [
    ['egypt-early-dynastic', -3111, -2649], ['egypt-old-kingdom', -2649, -2130],
    ['egypt-middle-kingdom', -2030, -1650], ['egypt-new-kingdom', -1550, -1070]
  ]);
  assert.ok(egypt.periods.every(function (period) { return period.end <= -1070; }), 'Egypt must not merge the New Kingdom with later dynasties');

  const akkad = data.tracks.find(function (track) { return track.id === 'akkadia'; });
  assert.strictEqual(akkad.periods[0].start, -2340);
  assert.strictEqual(akkad.periods[akkad.periods.length - 1].end, -2150);

  const babylonia = data.tracks.find(function (track) { return track.id === 'babylonia'; });
  assert.deepStrictEqual(babylonia.periods.map(function (period) { return period.id; }), [
    'babylonia-old-babylonian', 'babylonia-kassite', 'babylonia-second-isin', 'babylonia-neo-babylonian'
  ]);
  assert.strictEqual(babylonia.periods[0].dating.model, 'Middle chronology');
  assert.ok(babylonia.periods[0].dating.alternatives.some(function (alternative) { return alternative.id === 'low-middle'; }));

  const russianBabylonia = i18n.localizeData(data, 'ru').tracks.find(function (track) { return track.id === 'babylonia'; });
  const chineseBabylonia = i18n.localizeData(data, 'zh').tracks.find(function (track) { return track.id === 'babylonia'; });
  assert.strictEqual(russianBabylonia.periods[0].dating.model, 'Средняя хронология');
  assert.strictEqual(russianBabylonia.periods[0].dating.alternatives[0].label, 'Низко-средняя хронология (на 8 лет позднее)');
  assert.match(russianBabylonia.periods[0].dating.disputeNote, /Дендрохронологические/);
  assert.strictEqual(chineseBabylonia.periods[0].dating.model, '中年表');
  assert.strictEqual(chineseBabylonia.periods[0].dating.alternatives[0].label, '低中年表（晚8年）');
  assert.match(chineseBabylonia.periods[0].dating.disputeNote, /树轮/);

  const assyria = data.tracks.find(function (track) { return track.id === 'assyria'; });
  assert.deepStrictEqual(assyria.periods.map(function (period) { return [period.id, period.start, period.end]; }), [
    ['assyria-old', -2000, -1600], ['assyria-middle', -1365, -1100],
    ['assyria-neo-early', -883, -721], ['assyria-neo-late', -721, -609]
  ]);
});

test('Hittite and Persian tracks expose bounded polities and honest alternatives', function () {
  assertReviewedBatch(['hittites', 'persia']);

  const hittites = data.tracks.find(function (track) { return track.id === 'hittites'; });
  assert.deepStrictEqual(hittites.periods.map(function (period) { return [period.id, period.start, period.end]; }), [
    ['hittites-rise', -1750, -1650], ['hittites-old-kingdom', -1650, -1430],
    ['hittites-empire', -1430, -1200], ['hittites-successors', -1200, -700]
  ]);
  assert.strictEqual(hittites.periods[0].dating.precision, 'approximate');
  assert.strictEqual(hittites.periods[2].dating.precision, 'approximate');

  const persia = data.tracks.find(function (track) { return track.id === 'persia'; });
  assert.deepStrictEqual(persia.periods.map(function (period) { return [period.id, period.start, period.end]; }), [
    ['persia-median', -708, -550], ['persia-achaemenid', -550, -330],
    ['persia-arsacid', -247, 224], ['persia-sasanian', 224, 651]
  ]);
  assert.strictEqual(timeline.activeTracks([persia], -300).length, 0, 'Seleucid gap must remain explicit');
  assert.ok(persia.periods[2].dating.alternatives.some(function (alternative) { return alternative.id === 'parthava-conquest'; }));
  assert.ok(persia.periods[2].dating.disputeNote);
});

test('Greek, Roman, and Byzantine chronology preserves conventional boundaries', function () {
  assertReviewedBatch(['greece', 'rome', 'byzantium']);

  const greece = data.tracks.find(function (track) { return track.id === 'greece'; });
  assert.deepStrictEqual(greece.periods.map(function (period) { return [period.id, period.start, period.end]; }), [
    ['greece-aegean-bronze', -3000, -1100], ['greece-archaic', -700, -480],
    ['greece-classical', -480, -323], ['greece-hellenistic', -323, -31]
  ]);
  const olympics = greece.events.find(function (event) { return event.id === 'greece-olympics-traditional'; });
  assert.strictEqual(olympics.year, -776);
  assert.strictEqual(olympics.dating.precision, 'traditional');
  assert.strictEqual(olympics.dating.basis, 'traditional');

  const rome = data.tracks.find(function (track) { return track.id === 'rome'; });
  assert.deepStrictEqual(rome.periods.map(function (period) { return [period.id, period.start, period.end]; }), [
    ['rome-kings', -753, -509], ['rome-republic', -509, -27],
    ['rome-principate', -27, 284], ['rome-late-empire', 284, 476]
  ]);
  assert.strictEqual(rome.periods[0].dating.precision, 'traditional');
  assert.strictEqual(rome.events.find(function (event) { return event.id === 'rome-republic-traditional'; }).dating.precision, 'traditional');
  assert.strictEqual(rome.events.find(function (event) { return event.id === 'rome-augustus'; }).dating.precision, 'exact');

  const byzantium = data.tracks.find(function (track) { return track.id === 'byzantium'; });
  assert.deepStrictEqual(byzantium.periods.map(function (period) { return [period.id, period.start, period.end]; }), [
    ['byzantium-early', 330, 843], ['byzantium-middle', 843, 1204],
    ['byzantium-latin', 1204, 1261], ['byzantium-late', 1261, 1453]
  ]);
  assert.ok(byzantium.periods.every(function (period) { return period.start !== 610 && period.end !== 610; }));
});

test('first academic migration milestone has exact auditable coverage', function () {
  const audit = require(path.join(root, 'academic-audit.js')).buildAudit(data);
  assert.deepStrictEqual(audit.summary, {
    tracks: 62, reviewedTracks: 25, legacyTracks: 37, blockingIssues: 0, warnings: 42
  });
  assert.deepStrictEqual(audit.coverage, {
    periods: { total: 217, sourced: 69, dated: 69 },
    events: { total: 161, sourced: 50, dated: 50 }
  });
});

test('reviewed deep-time corpus is balanced across seven macroregions', function () {
  const required = [
    'xianrendong', 'jomon', 'liangzhu', 'natufian', 'gobekli-tepe', 'catalhoyuk',
    'predynastic-nile', 'mehrgarh', 'european-palaeolithic-mesolithic',
    'late-pleistocene-americas', 'sahul-continuity', 'lapita'
  ];
  const reviewed = required.map(function (id) {
    const track = data.tracks.find(function (item) { return item.id === id; });
    assert.ok(track, 'missing deep-time track ' + id);
    assert.strictEqual(track.reviewStatus, 'reviewed');
    assert.deepStrictEqual(quality.validateReviewedTrack(track, data.sources, data.range), [], id + ' validation failed');
    return track;
  });
  assert.ok(new Set(reviewed.map(function (track) { return track.region; })).size >= 7, 'deep-time corpus lacks regional balance');
  assert.strictEqual(reviewed.find(function (track) { return track.id === 'sahul-continuity'; }).continuesBeforeRange, true);
  assert.ok(reviewed.every(function (track) { return !/Ancient China|Ancient Australia|Древний Китай|Древняя Австралия|古代中国|古代澳大利亚/.test(JSON.stringify(track.copy)); }));
});

test('reviewed deep-time geography intersects records and atlas counts societies', function () {
  const reviewed = data.tracks.filter(function (track) { return track.reviewStatus === 'reviewed'; });
  reviewed.forEach(function (track) {
    assert.ok(atlasData.tracks[track.id] && atlasData.tracks[track.id].length, 'missing geography for ' + track.id);
    atlasData.tracks[track.id].forEach(function (center) {
      assert.ok(track.periods.some(function (period) { return center.end >= period.start && center.start <= period.end; }), 'geography does not intersect ' + track.id);
    });
  });
  const projected = atlas.projectActiveCenters([
    { id: 'site', region: 'west-asia', type: 'site', periods: [{ start: -10000, end: -9000 }] },
    { id: 'culture', region: 'west-asia', type: 'archaeological-culture', periods: [{ start: -10000, end: -9000 }] },
    { id: 'tradition', region: 'west-asia', type: 'tradition', periods: [{ start: -10000, end: -9000 }] }
  ], -9500, { tracks: {
    site: [{ id: 'site', longitude: 38, latitude: 37, start: -10000, end: -9000 }],
    culture: [{ id: 'culture', longitude: 39, latitude: 37, start: -10000, end: -9000 }],
    tradition: [{ id: 'tradition', longitude: 40, latitude: 37, start: -10000, end: -9000 }]
  } });
  const aggregate = atlas.aggregateRegions(projected)[0];
  assert.strictEqual(aggregate.societies, 2);
  assert.strictEqual(aggregate.traditions, 1);
});

test('track ids and period ids are unique and valid', function () {
  const trackIds = new Set();
  const periodIds = new Set();
  let periodCount = 0;
  let eventCount = 0;

  data.tracks.forEach(function (track) {
    assert.ok(track.id && track.name && track.region && track.type && track.summary);
    assert.ok(!trackIds.has(track.id), 'duplicate track id ' + track.id);
    trackIds.add(track.id);
    assert.ok(track.periods.length >= 1, 'no periods for ' + track.id);
    assert.ok(track.events.length >= 1, 'no events for ' + track.id);
    track.periods.forEach(function (period) {
      assert.ok(period.start < period.end, 'invalid range in ' + track.id);
      assert.ok(period.start >= data.range.start && period.end <= data.range.end);
      const periodId = track.id + ':' + period.name + ':' + period.start;
      assert.ok(!periodIds.has(periodId), 'duplicate period ' + periodId);
      periodIds.add(periodId);
      periodCount += 1;
    });
    track.events.forEach(function (event) {
      assert.ok(event.year >= data.range.start && event.year <= data.range.end);
      assert.ok(event.title);
      eventCount += 1;
    });
  });

  assert.ok(periodCount >= 160, 'expected a rich periodization');
  assert.ok(eventCount >= 120, 'expected a rich event set');
});

test('filtering searches periods and respects region and type', function () {
  const byPeriod = timeline.filterTracks(data.tracks, { query: 'Старовавилонский', region: 'all', type: 'all' });
  assert.deepStrictEqual(byPeriod.map(function (track) { return track.id; }), ['babylonia']);
  const asiaTraditions = timeline.filterTracks(data.tracks, { query: '', region: 'east-asia', type: 'tradition' });
  assert.ok(asiaTraditions.some(function (track) { return track.id === 'confucianism'; }));
  assert.ok(asiaTraditions.every(function (track) { return track.region === 'east-asia' && track.type === 'tradition'; }));
});

test('review-state filters distinguish reviewed and legacy tracks from academic type', function () {
  const fixture = [{
    id: 'reviewed-polity', reviewStatus: 'reviewed', type: 'polity', region: 'west-asia', name: 'Reviewed', summary: '', periods: [], events: []
  }, {
    id: 'legacy-polity', reviewStatus: 'legacy', type: 'polity', region: 'west-asia', name: 'Legacy', summary: '', periods: [], events: []
  }, {
    id: 'legacy-tradition', reviewStatus: 'legacy', type: 'tradition', region: 'west-asia', name: 'Tradition', summary: '', periods: [], events: []
  }];
  assert.deepStrictEqual(timeline.filterTracks(fixture, { query: '', region: 'all', type: 'reviewed' }).map(function (track) { return track.id; }), ['reviewed-polity']);
  assert.deepStrictEqual(timeline.filterTracks(fixture, { query: '', region: 'all', type: 'legacy' }).map(function (track) { return track.id; }), ['legacy-polity', 'legacy-tradition']);
});

test('year projection and active-track lookup handle BCE and CE', function () {
  assert.strictEqual(timeline.yearToPercent(-3500, -3500, 1600), 0);
  assert.strictEqual(timeline.yearToPercent(1600, -3500, 1600), 100);
  assert.strictEqual(timeline.formatYear(-753), '753 до н. э.');
  assert.strictEqual(timeline.formatYear(0), '1 н. э.');
  assert.strictEqual(timeline.formatYear(1453), '1453 н. э.');
  const active = timeline.activeTracks(data.tracks, 1200).map(function (track) { return track.id; });
  assert.ok(active.indexOf('byzantium') !== -1);
  assert.ok(active.indexOf('inca') === -1);
});

test('Equal Earth projection is centered, finite, bounded, and defensive', function () {
  assert.deepStrictEqual(atlas.projectGeoPoint(0, 0), { x: 50, y: 50 });
  [[-180, 0], [180, 0], [0, 90], [0, -90], [116.31, 28.95], [-72.55, -13.52]].forEach(function (point) {
    const projected = atlas.projectGeoPoint(point[0], point[1]);
    assert.ok(Number.isFinite(projected.x) && projected.x >= 4 && projected.x <= 96);
    assert.ok(Number.isFinite(projected.y) && projected.y >= 4 && projected.y <= 96);
  });
  assert.strictEqual(atlas.projectGeoPoint(181, 0), null);
  assert.strictEqual(atlas.projectGeoPoint(0, -91), null);
  assert.strictEqual(atlas.projectGeoPoint('east', 20), null);
});

test('atlas geography uses inspectable longitude and latitude', function () {
  Object.keys(atlasData.regions).forEach(function (id) {
    const region = atlasData.regions[id];
    assert.ok(region.longitude >= -180 && region.longitude <= 180, id);
    assert.ok(region.latitude >= -90 && region.latitude <= 90, id);
    assert.strictEqual(region.x, undefined);
    assert.strictEqual(region.y, undefined);
  });
  Object.keys(atlasData.tracks).forEach(function (trackId) {
    atlasData.tracks[trackId].forEach(function (center) {
      assert.ok(center.longitude >= -180 && center.longitude <= 180, center.id);
      assert.ok(center.latitude >= -90 && center.latitude <= 90, center.id);
      assert.strictEqual(center.x, undefined);
      assert.strictEqual(center.y, undefined);
    });
  });
});

test('bundled Natural Earth map metadata and paths are production ready', function () {
  const mapPath = path.join(root, 'world-map-data.js');
  assert.ok(fs.existsSync(mapPath), 'missing generated Natural Earth map asset');
  const worldMap = require(mapPath);
  assert.strictEqual(worldMap.projection, 'Equal Earth');
  assert.strictEqual(worldMap.source.version, '5.1.2');
  assert.ok(worldMap.source.url.indexOf('ne_110m_land.geojson') !== -1);
  assert.deepStrictEqual(worldMap.viewBox, [0, 0, 1000, 520]);
  assert.ok(worldMap.landPath.length > 10000);
  assert.ok(worldMap.graticulePath.length > 100);
  assert.ok(fs.statSync(mapPath).size < 120 * 1024);
});

test('atlas projects active centers and aggregates filtered regions', function () {
  const tracks = [
    { id: 'alpha', region: 'east-asia', type: 'civilization', periods: [{ start: -600, end: -400 }] },
    { id: 'beta', region: 'east-asia', type: 'tradition', periods: [{ start: -550, end: -300 }] },
    { id: 'gamma', region: 'americas', type: 'civilization', periods: [{ start: 100, end: 500 }] }
  ];
  const geography = {
    tracks: {
      alpha: [{ id: 'alpha-core', longitude: 116, latitude: 35, start: -600, end: -400 }],
      beta: [{ id: 'beta-core', longitude: 113, latitude: 34, start: -550, end: -300 }]
    }
  };
  const projected = atlas.projectActiveCenters(tracks, -500, geography);
  assert.deepStrictEqual(projected.map(function (item) { return item.track.id; }), ['alpha', 'beta']);
  assert.deepStrictEqual(atlas.aggregateRegions(projected), [
    { id: 'east-asia', count: 2, societies: 1, civilizations: 1, traditions: 1, trackIds: ['alpha', 'beta'] }
  ]);
});

test('atlas projection handles boundaries and missing optional geography', function () {
  const track = { id: 'alpha', region: 'west-asia', type: 'civilization', periods: [{ start: -100, end: 100 }] };
  const geography = { tracks: { alpha: [{ id: 'core', longitude: 45, latitude: 33, start: -100, end: 100 }] } };
  assert.strictEqual(atlas.projectActiveCenters([track], -100, geography).length, 1);
  assert.strictEqual(atlas.projectActiveCenters([track], 100, geography).length, 1);
  assert.deepStrictEqual(atlas.projectActiveCenters([track], 101, geography), []);
  assert.deepStrictEqual(atlas.projectActiveCenters([track], 0, { tracks: {} }), []);
  assert.deepStrictEqual(atlas.projectActiveCenters([track], 0, {}), []);
});

test('atlas geography covers every historical track with valid coordinates', function () {
  const trackIds = new Set(data.tracks.map(function (track) { return track.id; }));
  assert.deepStrictEqual(Object.keys(atlasData.tracks).sort(), Array.from(trackIds).sort());
  Object.keys(atlasData.regions).forEach(function (regionId) {
    const region = atlasData.regions[regionId];
    assert.ok(region.longitude >= -180 && region.longitude <= 180, 'invalid region longitude for ' + regionId);
    assert.ok(region.latitude >= -90 && region.latitude <= 90, 'invalid region latitude for ' + regionId);
    assert.ok(region.radius > 0 && region.radius <= 25, 'invalid region radius for ' + regionId);
  });
  const regionIds = Object.keys(atlasData.regions);
  regionIds.forEach(function (regionId, index) {
    regionIds.slice(index + 1).forEach(function (otherId) {
      const region = atlasData.regions[regionId];
      const other = atlasData.regions[otherId];
      const projected = atlas.projectGeoPoint(region.longitude, region.latitude);
      const otherProjected = atlas.projectGeoPoint(other.longitude, other.latitude);
      const distance = Math.hypot(projected.x - otherProjected.x, projected.y - otherProjected.y);
      assert.ok(distance >= 5, 'atlas markers overlap: ' + regionId + ' and ' + otherId);
    });
  });
  Object.keys(atlasData.tracks).forEach(function (trackId) {
    assert.ok(atlasData.tracks[trackId].length >= 1 && atlasData.tracks[trackId].length <= 3, 'invalid center count for ' + trackId);
    atlasData.tracks[trackId].forEach(function (center) {
      assert.ok(center.id, 'missing center id for ' + trackId);
      assert.ok(center.longitude >= -180 && center.longitude <= 180, 'invalid center longitude for ' + trackId);
      assert.ok(center.latitude >= -90 && center.latitude <= 90, 'invalid center latitude for ' + trackId);
      assert.ok(center.start < center.end, 'invalid center dates for ' + trackId);
    });
  });
});

test('editorial comparisons are valid and complete in three locales', function () {
  assert.ok(insights.length >= 30);
  ['gobekli-jomon', 'catalhoyuk-mehrgarh', 'liangzhu-uruk'].forEach(function (id) {
    assert.ok(insights.some(function (item) { return item.id === id; }), 'missing reviewed deep-time comparison ' + id);
  });
  const insightIds = new Set();
  insights.forEach(function (insight) {
    assert.ok(insight.id && insight.start < insight.end, 'invalid insight range');
    assert.ok(!insightIds.has(insight.id), 'duplicate insight ' + insight.id);
    insightIds.add(insight.id);
    assert.strictEqual(insight.trackIds.length, 2, 'comparison must reference two tracks');
    insight.trackIds.forEach(function (id) {
      assert.ok(data.tracks.some(function (track) { return track.id === id; }), 'unknown insight track ' + id);
    });
    [insight.start, Math.floor((insight.start + insight.end) / 2), insight.end].forEach(function (year) {
      const activeIds = timeline.activeTracks(data.tracks, year).map(function (track) { return track.id; });
      insight.trackIds.forEach(function (id) {
        assert.ok(activeIds.indexOf(id) !== -1, insight.id + ' references inactive ' + id + ' in ' + year);
      });
    });
    ['ru', 'en', 'zh'].forEach(function (locale) {
      assert.ok(insight.copy[locale].title && insight.copy[locale].summary, 'missing ' + locale + ' copy for ' + insight.id);
    });
    insight.sourceIds.forEach(function (id) { assert.ok(data.sources[id], 'unknown source ' + id); });
  });
});

test('atlas selects eligible localized insights and prefers focused tracks', function () {
  const active = timeline.activeTracks(data.tracks, -500);
  const defaultInsight = atlas.selectInsight(insights, active, -500, 'ru', []);
  assert.ok(defaultInsight && defaultInsight.title && defaultInsight.summary);
  const focused = atlas.selectInsight(insights, active, -500, 'ru', ['greece']);
  assert.strictEqual(focused.id, 'confucius-greek-polis');
  const englishFallback = atlas.selectInsight(insights, active, -500, 'xx', ['greece']);
  assert.strictEqual(englishFallback.title, insights.find(function (item) { return item.id === 'confucius-greek-polis'; }).copy.en.title);
  assert.strictEqual(atlas.selectInsight(insights, timeline.activeTracks(data.tracks, -3500), -3500, 'en', []), null);
});

test('comparison connector exists only for a selected eligible pair', function () {
  const connector = atlas.buildComparisonConnector(
    { id: 'pair', trackIds: ['alpha', 'beta'], title: 'Alpha and Beta' },
    [
      { track: { id: 'alpha' }, center: { x: 30, y: 40 } },
      { track: { id: 'beta' }, center: { x: 70, y: 35 } }
    ],
    ['alpha', 'beta']
  );
  assert.deepStrictEqual(connector, { id: 'pair', from: { x: 30, y: 40 }, to: { x: 70, y: 35 }, title: 'Alpha and Beta' });
  assert.strictEqual(atlas.buildComparisonConnector({ id: 'pair', trackIds: ['alpha', 'beta'] }, [], []), null);
  assert.strictEqual(atlas.buildComparisonConnector({ id: 'pair', trackIds: ['alpha', 'beta'] }, [{ track: { id: 'alpha' }, center: { x: 30, y: 40 } }], ['alpha', 'beta']), null);
});

test('playback advances by a fixed historical step and wraps at the visible range', function () {
  assert.strictEqual(atlas.nextPlaybackYear(-500, -3500, 1600, 20), -480);
  assert.strictEqual(atlas.nextPlaybackYear(-1, -3500, 1600, 1), 1);
  assert.strictEqual(atlas.nextPlaybackYear(1590, -3500, 1600, 20), -3500);
});

test('atlas model combines filters, region selection, focus, and missing geography', function () {
  const tracks = [
    { id: 'alpha', name: 'Alpha Empire', summary: 'River cities', region: 'east-asia', type: 'polity', reviewStatus: 'reviewed', periods: [{ name: 'Early Alpha', start: -600, end: -400 }], events: [] },
    { id: 'beta', name: 'Beta tradition', summary: 'Ritual teaching', region: 'east-asia', type: 'tradition', reviewStatus: 'legacy', periods: [{ name: 'Oracle schools', start: -550, end: -300 }], events: [] },
    { id: 'gamma', name: 'Gamma', summary: 'Later society', region: 'americas', type: 'civilization', reviewStatus: 'legacy', periods: [{ name: 'Gamma age', start: 100, end: 500 }], events: [] }
  ];
  const geography = {
    regions: { 'east-asia': { longitude: 118, latitude: 34, radius: 14 } },
    tracks: { alpha: [{ id: 'alpha-core', longitude: 116, latitude: 35, start: -600, end: -400 }] }
  };
  const comparisons = [{
    id: 'alpha-beta', start: -540, end: -410, trackIds: ['alpha', 'beta'], sourceIds: [],
    copy: { en: { title: 'Alpha and Beta', summary: 'Two active tracks.' } }
  }];
  const model = atlas.buildModel({
    tracks: tracks, year: -500, geography: geography, insights: comparisons, locale: 'en',
    filters: { query: '', region: 'all', type: 'all' }, selectedRegion: 'east-asia', focusIds: ['beta']
  });
  assert.deepStrictEqual(model.activeTracks.map(function (track) { return track.id; }), ['alpha', 'beta']);
  assert.deepStrictEqual(model.regions.map(function (region) { return [region.id, region.count, region.x]; }), [['east-asia', 1, atlas.projectGeoPoint(118, 34).x]]);
  assert.deepStrictEqual(model.regionTracks.map(function (item) { return item.track.id; }), ['alpha', 'beta']);
  assert.deepStrictEqual(model.stats, { tracks: 2, societies: 1, civilizations: 1, traditions: 1, regions: 1 });
  assert.strictEqual(model.insight.id, 'alpha-beta');
  assert.deepStrictEqual(model.focusIds, ['beta']);

  const filtered = atlas.buildModel({
    tracks: tracks, year: -500, geography: geography, insights: [], locale: 'en',
    filters: { query: 'oracle', region: 'east-asia', type: 'tradition' }, selectedRegion: 'east-asia', focusIds: []
  });
  assert.deepStrictEqual(filtered.activeTracks.map(function (track) { return track.id; }), ['beta']);
  assert.deepStrictEqual(filtered.regions, []);
  assert.strictEqual(filtered.insight, null);
  assert.strictEqual(filtered.stats.regions, 1);

  const reviewed = atlas.buildModel({
    tracks: tracks, year: -500, geography: geography, filters: { query: '', region: 'all', type: 'reviewed' }
  });
  assert.deepStrictEqual(reviewed.activeTracks.map(function (track) { return track.id; }), ['alpha']);

  const legacy = atlas.buildModel({
    tracks: tracks, year: -500, geography: geography, filters: { query: '', region: 'all', type: 'legacy' }
  });
  assert.deepStrictEqual(legacy.activeTracks.map(function (track) { return track.id; }), ['beta']);
});

test('missing URL numbers stay absent instead of becoming year zero', function () {
  const empty = new URLSearchParams('');
  const explicitZero = new URLSearchParams('start=0');
  assert.strictEqual(timeline.numericParam(empty, 'start'), undefined);
  assert.strictEqual(timeline.numericParam(explicitZero, 'start'), 0);
  assert.strictEqual(timeline.numericParam(new URLSearchParams('zoom=nope'), 'zoom'), undefined);
});

test('period density follows the approved four thresholds', function () {
  assert.strictEqual(timeline.periodDensity(112), 'wide');
  assert.strictEqual(timeline.periodDensity(111.99), 'medium');
  assert.strictEqual(timeline.periodDensity(64), 'medium');
  assert.strictEqual(timeline.periodDensity(63.99), 'compact');
  assert.strictEqual(timeline.periodDensity(32), 'compact');
  assert.strictEqual(timeline.periodDensity(31.99), 'node');
});

test('period tooltip record preserves full evidence metadata', function () {
  const record = timeline.periodTooltipRecord({ id: 'p1', name: 'Full name', start: -200, end: -100, dating: { precision: 'approximate', basis: 'historical' } });
  assert.deepStrictEqual(record, { id: 'p1', name: 'Full name', start: -200, end: -100, precision: 'approximate', basis: 'historical' });
});

test('period tooltip position stays inside the viewport for offscreen targets', function () {
  const position = timeline.tooltipPosition(
    { left: 300, right: 340, top: 1180, bottom: 1210, width: 40, height: 30 },
    { width: 214, height: 88 },
    { width: 360, height: 800 }
  );
  assert.deepStrictEqual(position, { left: 138, top: 704 });
  const above = timeline.tooltipPosition(
    { left: 10, right: 30, top: -40, bottom: -10, width: 20, height: 30 },
    { width: 160, height: 80 },
    { width: 360, height: 800 }
  );
  assert.deepStrictEqual(above, { left: 8, top: 8 });
});

test('explorer state round-trips view, year, filters, and focused tracks', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'en', selectedRegion: ''
  };
  const parsed = explorerState.parse(new URLSearchParams('view=chronology&year=1200&focus=china,byzantium&q=empire&region=east-asia&type=civilization&zoom=125&lang=zh&panel=east-asia'), defaults, data);
  assert.strictEqual(parsed.view, 'chronology');
  assert.strictEqual(parsed.year, 1200);
  assert.deepStrictEqual(parsed.focus, ['china', 'byzantium']);
  assert.strictEqual(parsed.query, 'empire');
  assert.strictEqual(parsed.region, 'east-asia');
  assert.strictEqual(parsed.type, 'society');
  assert.strictEqual(parsed.zoom, 125);
  assert.strictEqual(parsed.lang, 'zh');
  assert.strictEqual(parsed.selectedRegion, 'east-asia');
  const params = explorerState.serialize(parsed, defaults);
  assert.strictEqual(params.get('view'), 'chronology');
  assert.strictEqual(params.get('focus'), 'china,byzantium');
  assert.strictEqual(params.get('year'), '1200');
  assert.strictEqual(params.get('panel'), 'east-asia');
});

test('explorer state round-trips the reviewed evidence filter', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: -20000, end: 1600, zoom: 100, lang: 'ru', scaleMode: 'overview'
  };
  const parsed = explorerState.parse(new URLSearchParams('type=reviewed'), defaults, data);
  assert.strictEqual(parsed.type, 'reviewed');
  assert.strictEqual(explorerState.serialize(parsed, defaults).get('type'), 'reviewed');
});

test('explorer state round-trips a paused directed journey stop', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru',
    journey: '', stop: '', journeyMode: 'paused', journeyNotice: ''
  };
  const parsed = explorerState.parse(
    new URLSearchParams('journey=birth-of-cities&stop=uruk-urban-center&journeyMode=paused'),
    defaults, data, journeysData
  );
  assert.deepStrictEqual([parsed.journey, parsed.stop, parsed.journeyMode],
    ['birth-of-cities', 'uruk-urban-center', 'paused']);
  assert.strictEqual(explorerState.serialize(parsed, defaults).toString(),
    'lang=ru&journey=birth-of-cities&stop=uruk-urban-center&journeyMode=paused');
});

test('explorer state rejects unknown journeys and normalizes unknown stops', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru',
    journey: '', stop: '', journeyMode: 'paused', journeyNotice: ''
  };
  const unknownRoute = explorerState.parse(new URLSearchParams('journey=nope'), defaults, data, journeysData);
  assert.deepStrictEqual([unknownRoute.journey, unknownRoute.journeyNotice], ['', 'unknown-route']);
  const unknownStop = explorerState.parse(new URLSearchParams('journey=birth-of-cities&stop=nope&journeyMode=playing'), defaults, data, journeysData);
  assert.deepStrictEqual([unknownStop.stop, unknownStop.journeyMode, unknownStop.journeyNotice],
    ['xianrendong-pottery', 'paused', 'unknown-stop']);
});

test('explorer state round-trips a playing directed journey stop', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru'
  };
  const parsed = explorerState.parse(
    new URLSearchParams('journey=birth-of-cities&stop=gobekli-monuments&journeyMode=playing'),
    defaults, data, journeysData
  );
  assert.deepStrictEqual([parsed.journey, parsed.stop, parsed.journeyMode, parsed.journeyNotice],
    ['birth-of-cities', 'gobekli-monuments', 'playing', '']);
  assert.strictEqual(explorerState.serialize(parsed, defaults).toString(),
    'lang=ru&journey=birth-of-cities&stop=gobekli-monuments&journeyMode=playing');
});

test('explorer state selects the first journey stop when the URL omits it', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru'
  };
  const parsed = explorerState.parse(
    new URLSearchParams('journey=birth-of-cities&journeyMode=playing'),
    defaults, data, journeysData
  );
  assert.deepStrictEqual([parsed.stop, parsed.journeyMode, parsed.journeyNotice],
    ['xianrendong-pottery', 'playing', '']);
});

test('explorer state normalizes empty and invalid journey modes to paused', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru'
  };
  const empty = explorerState.parse(
    new URLSearchParams('journey=birth-of-cities&stop=uruk-urban-center&journeyMode='),
    defaults, data, journeysData
  );
  const invalid = explorerState.parse(
    new URLSearchParams('journey=birth-of-cities&stop=uruk-urban-center&journeyMode=auto'),
    defaults, data, journeysData
  );
  assert.strictEqual(empty.journeyMode, 'paused');
  assert.strictEqual(invalid.journeyMode, 'paused');
});

test('explorer state normalizes a missing journey mode to paused', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru'
  };
  const parsed = explorerState.parse(
    new URLSearchParams('journey=birth-of-cities&stop=uruk-urban-center'),
    defaults, data, journeysData
  );
  assert.deepStrictEqual([parsed.journeyMode, parsed.journeyNotice], ['paused', '']);
  assert.strictEqual(explorerState.serialize(parsed, defaults).toString(),
    'lang=ru&journey=birth-of-cities&stop=uruk-urban-center&journeyMode=paused');
});

test('explorer state clears journey defaults when the URL has no journey', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru',
    journey: 'birth-of-cities', stop: 'uruk-urban-center', journeyMode: 'playing', journeyNotice: 'stale'
  };
  [new URLSearchParams(''), new URLSearchParams('journey=')].forEach(function (params) {
    const parsed = explorerState.parse(params, defaults, data, journeysData);
    assert.deepStrictEqual([parsed.journey, parsed.stop, parsed.journeyMode, parsed.journeyNotice],
      ['', '', 'paused', '']);
    const serialized = explorerState.serialize(parsed, defaults);
    assert.strictEqual(serialized.has('journey'), false);
    assert.strictEqual(serialized.has('stop'), false);
    assert.strictEqual(serialized.has('journeyMode'), false);
  });
});

test('explorer state parsing ignores inherited journey default accessors', function () {
  const prototype = {};
  ['journey', 'stop', 'journeyMode', 'journeyNotice'].forEach(function (field) {
    Object.defineProperty(prototype, field, {
      get: function () { throw new Error('inherited default getter called: ' + field); }
    });
  });
  const defaults = Object.assign(Object.create(prototype), {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru'
  });
  const parsed = explorerState.parse(new URLSearchParams(''), defaults, data, journeysData);
  assert.deepStrictEqual([parsed.journey, parsed.stop, parsed.journeyMode, parsed.journeyNotice],
    ['', '', 'paused', '']);
});

test('explorer state never serializes a journey notice', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru'
  };
  const state = Object.assign({}, defaults, {
    journey: 'birth-of-cities', stop: 'uruk-urban-center', journeyMode: 'paused', journeyNotice: 'unknown-stop'
  });
  const params = explorerState.serialize(state, defaults);
  assert.strictEqual(params.has('journeyNotice'), false);
  assert.strictEqual(params.get('stop'), 'uruk-urban-center');
});

test('explorer state serialization ignores inherited journey values', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru'
  };
  const state = Object.assign(Object.create({
    journey: 'birth-of-cities', stop: 'uruk-urban-center', journeyMode: 'playing'
  }), defaults);
  assert.strictEqual(explorerState.serialize(state, defaults).toString(), 'lang=ru');
});

test('explorer state serialization never invokes journey accessors', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru'
  };
  [Object.create(null), Object.create({
    get journey() { throw new Error('inherited journey getter called'); },
    get stop() { throw new Error('inherited stop getter called'); },
    get journeyMode() { throw new Error('inherited journey mode getter called'); }
  })].forEach(function (state, index) {
    Object.assign(state, defaults);
    if (index === 0) {
      ['journey', 'stop', 'journeyMode'].forEach(function (field) {
        Object.defineProperty(state, field, {
          get: function () { throw new Error('own ' + field + ' getter called'); }
        });
      });
    }
    assert.strictEqual(explorerState.serialize(state, defaults).toString(), 'lang=ru');
  });
});

test('explorer state serialization normalizes accessor stop and mode for an own journey', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru'
  };
  const state = Object.assign({}, defaults, { journey: 'birth-of-cities' });
  Object.defineProperty(state, 'stop', {
    get: function () { throw new Error('stop getter called'); }
  });
  Object.defineProperty(state, 'journeyMode', {
    get: function () { throw new Error('journey mode getter called'); }
  });
  assert.strictEqual(explorerState.serialize(state, defaults).toString(),
    'lang=ru&journey=birth-of-cities&stop=&journeyMode=paused');
});

test('explorer state rejects malformed and inherited journey manifest entries without throwing', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru'
  };
  const canonicalStop = { id: 'xianrendong-pottery' };
  const inheritedRoutes = Object.create({ routes: [{ id: 'birth-of-cities', stops: [canonicalStop] }] });
  const inheritedRouteIndex = { routes: arrayWithInheritedValue({ id: 'birth-of-cities', stops: [canonicalStop] }) };
  const inheritedRouteId = { routes: [Object.assign(Object.create({ id: 'birth-of-cities' }), { stops: [canonicalStop] })] };
  const inheritedStops = { routes: [Object.assign(Object.create({ stops: [canonicalStop] }), { id: 'birth-of-cities' })] };
  const inheritedStopIndex = { routes: [{ id: 'birth-of-cities', stops: arrayWithInheritedValue(canonicalStop) }] };
  const inheritedStopId = {
    routes: [{ id: 'birth-of-cities', stops: [Object.create({ id: 'xianrendong-pottery' })] }]
  };
  const sparseRoutes = new Array(2);
  sparseRoutes[1] = { id: 'birth-of-cities', stops: [canonicalStop] };
  const accessorRoutes = [];
  Object.defineProperty(accessorRoutes, '0', {
    get: function () { throw new Error('route entry getter called'); }
  });
  const accessorStops = [];
  Object.defineProperty(accessorStops, '0', {
    get: function () { throw new Error('stop entry getter called'); }
  });
  const throwingRoutes = {};
  Object.defineProperty(throwingRoutes, 'routes', {
    get: function () { throw new Error('routes getter called'); }
  });
  const throwingRouteId = { stops: [canonicalStop] };
  Object.defineProperty(throwingRouteId, 'id', {
    get: function () { throw new Error('route id getter called'); }
  });
  const throwingRouteStops = { id: 'birth-of-cities' };
  Object.defineProperty(throwingRouteStops, 'stops', {
    get: function () { throw new Error('route stops getter called'); }
  });
  const throwingStopId = {};
  Object.defineProperty(throwingStopId, 'id', {
    get: function () { throw new Error('stop id getter called'); }
  });
  const malformed = [
    undefined, null, {}, { routes: null }, { routes: {} }, { routes: new Array(1) },
    inheritedRoutes, inheritedRouteIndex, inheritedRouteId, inheritedStops, inheritedStopIndex, inheritedStopId,
    { routes: sparseRoutes }, { routes: accessorRoutes },
    { routes: [{ id: 'birth-of-cities', stops: accessorStops }] },
    throwingRoutes, { routes: [throwingRouteId] }, { routes: [throwingRouteStops] },
    { routes: [{ id: 'birth-of-cities', stops: [throwingStopId] }] },
    { routes: [null, 1, 'birth-of-cities'] },
    { routes: [{ id: 'birth-of-cities', stops: {} }] },
    { routes: [{ id: 'birth-of-cities', stops: [{ id: 7 }] }] },
    { routes: [{ id: 'birth-of-cities', stops: [] }] }
  ];
  malformed.forEach(function (manifest) {
    const parsed = explorerState.parse(new URLSearchParams('journey=birth-of-cities'), defaults, data, manifest);
    assert.deepStrictEqual([parsed.journey, parsed.stop, parsed.journeyMode, parsed.journeyNotice],
      ['', '', 'paused', 'unknown-route']);
  });

  const stops = new Array(3);
  stops[0] = null;
  withInheritedArrayIndex(stops, 1, canonicalStop);
  stops[2] = { id: 'uruk-urban-center' };
  const parsed = explorerState.parse(
    new URLSearchParams('journey=birth-of-cities'), defaults, data,
    { routes: [{ id: 'birth-of-cities', stops: stops }] }
  );
  assert.deepStrictEqual([parsed.journey, parsed.stop, parsed.journeyNotice], ['', '', 'unknown-route']);
});

test('explorer state does not invoke journey manifest controlled array methods', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru'
  };
  const stops = [{ id: 'xianrendong-pottery' }];
  const routes = [{ id: 'birth-of-cities', stops: stops }];
  ['find', 'findIndex', 'forEach', 'map', 'reduce', 'some'].forEach(function (method) {
    routes[method] = stops[method] = function () { throw new Error('manifest method called: ' + method); };
  });
  const parsed = explorerState.parse(
    new URLSearchParams('journey=birth-of-cities&journeyMode=playing'), defaults, data, { routes: routes }
  );
  assert.deepStrictEqual([parsed.journey, parsed.stop, parsed.journeyMode],
    ['birth-of-cities', 'xianrendong-pottery', 'playing']);
});

test('explorer state caps journey route scans and accepts exactly 100 routes', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru'
  };
  const hugeRoutes = [{ id: 'birth-of-cities', stops: [{ id: 'xianrendong-pottery' }] }];
  hugeRoutes.length = 0xfffffffe;
  let hugeNumericReads = 0;
  const hugeProxy = new Proxy(hugeRoutes, {
    getOwnPropertyDescriptor: function (target, field) {
      if (typeof field === 'string' && /^\d+$/.test(field)) hugeNumericReads += 1;
      return Reflect.getOwnPropertyDescriptor(target, field);
    }
  });
  const rejected = explorerState.parse(
    new URLSearchParams('journey=birth-of-cities'), defaults, data, { routes: hugeProxy }
  );
  assert.deepStrictEqual([rejected.journey, rejected.stop, rejected.journeyNotice], ['', '', 'unknown-route']);
  assert.strictEqual(hugeNumericReads, 0);

  const boundaryRoutes = [];
  for (let index = 0; index < 99; index += 1) {
    boundaryRoutes.push({ id: 'route-' + index, stops: [{ id: 'stop-' + index }] });
  }
  boundaryRoutes.push({ id: 'boundary-route', stops: [{ id: 'boundary-stop' }] });
  let boundaryNumericReads = 0;
  const boundaryProxy = new Proxy(boundaryRoutes, {
    getOwnPropertyDescriptor: function (target, field) {
      if (field === '100') throw new Error('read route beyond configured boundary');
      if (typeof field === 'string' && /^\d+$/.test(field)) boundaryNumericReads += 1;
      return Reflect.getOwnPropertyDescriptor(target, field);
    }
  });
  const accepted = explorerState.parse(
    new URLSearchParams('journey=boundary-route&stop=boundary-stop&journeyMode=playing'),
    defaults, data, { routes: boundaryProxy }
  );
  assert.deepStrictEqual([accepted.journey, accepted.stop, accepted.journeyMode, accepted.journeyNotice],
    ['boundary-route', 'boundary-stop', 'playing', '']);
  assert.strictEqual(boundaryNumericReads, 100);
});

test('explorer state caps journey stop scans and accepts exactly eight stops', function () {
  const probe = [
    'const explorerState = require(' + JSON.stringify(path.join(root, 'explorer-state.js')) + ');',
    "const URLSearchParams = require('url').URLSearchParams;",
    "const data = { range: { start: -10, end: 10 }, regions: [], tracks: [] };",
    "const defaults = { view: 'map', year: -1, focus: [], query: '', region: 'all', type: 'all', start: -10, end: 10, zoom: 100, lang: 'ru' };",
    "const rawStops = [{ id: 'first-stop' }];",
    'rawStops.length = 0xfffffffe;',
    'let numericReads = 0;',
    'const stops = new Proxy(rawStops, { getOwnPropertyDescriptor: function (target, field) {',
    "  if (typeof field === 'string' && /^\\d+$/.test(field)) numericReads += 1;",
    '  return Reflect.getOwnPropertyDescriptor(target, field);',
    '} });',
    "const parsed = explorerState.parse(new URLSearchParams('journey=huge-route'), defaults, data,",
    "  { routes: [{ id: 'huge-route', stops: stops }] });",
    'process.stdout.write(JSON.stringify({',
    '  numericReads: numericReads,',
    '  fields: [parsed.journey, parsed.stop, parsed.journeyNotice]',
    '}));'
  ].join('\n');
  const result = childProcess.spawnSync(process.execPath, ['-e', probe], {
    encoding: 'utf8', timeout: 2000
  });
  assert.ifError(result.error);
  assert.strictEqual(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout);
  assert.deepStrictEqual(summary.fields, ['', '', 'unknown-route']);
  assert.strictEqual(summary.numericReads, 0);

  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru'
  };
  const boundaryStops = [];
  for (let index = 0; index < 8; index += 1) boundaryStops.push({ id: 'boundary-stop-' + index });
  let boundaryNumericReads = 0;
  const boundaryProxy = new Proxy(boundaryStops, {
    getOwnPropertyDescriptor: function (target, field) {
      if (field === '8') throw new Error('read stop beyond configured boundary');
      if (typeof field === 'string' && /^\d+$/.test(field)) boundaryNumericReads += 1;
      return Reflect.getOwnPropertyDescriptor(target, field);
    }
  });
  const accepted = explorerState.parse(
    new URLSearchParams('journey=boundary-route&stop=boundary-stop-7&journeyMode=playing'),
    defaults, data, { routes: [{ id: 'boundary-route', stops: boundaryProxy }] }
  );
  assert.deepStrictEqual([accepted.journey, accepted.stop, accepted.journeyMode, accepted.journeyNotice],
    ['boundary-route', 'boundary-stop-7', 'playing', '']);
  assert.strictEqual(boundaryNumericReads, 8);
});

test('explorer state preserves existing fields and does not mutate parse inputs', function () {
  const defaults = {
    view: 'map', scaleMode: 'overview', year: -500, focus: [], query: '', region: 'all', selectedRegion: '', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru',
    journey: '', stop: '', journeyMode: 'paused', journeyNotice: ''
  };
  const defaultsBefore = JSON.parse(JSON.stringify(defaults));
  const dataBefore = JSON.stringify(data);
  const journeysBefore = JSON.stringify(journeysData);
  const parsed = explorerState.parse(
    new URLSearchParams('view=chronology&scale=deep&year=-3200&focus=china,byzantium&q=city&region=east-asia&type=reviewed&start=-10000&end=1000&zoom=125&lang=zh&panel=east-asia&journey=birth-of-cities&stop=uruk-urban-center&journeyMode=playing'),
    defaults, data, journeysData
  );
  assert.deepStrictEqual({
    view: parsed.view, scaleMode: parsed.scaleMode, year: parsed.year, focus: parsed.focus,
    query: parsed.query, region: parsed.region, selectedRegion: parsed.selectedRegion, type: parsed.type,
    start: parsed.start, end: parsed.end, zoom: parsed.zoom, lang: parsed.lang,
    journey: parsed.journey, stop: parsed.stop, journeyMode: parsed.journeyMode, journeyNotice: parsed.journeyNotice
  }, {
    view: 'chronology', scaleMode: 'deep', year: -3200, focus: ['china', 'byzantium'],
    query: 'city', region: 'east-asia', selectedRegion: 'east-asia', type: 'reviewed',
    start: -10000, end: 1000, zoom: 125, lang: 'zh',
    journey: 'birth-of-cities', stop: 'uruk-urban-center', journeyMode: 'playing', journeyNotice: ''
  });
  assert.deepStrictEqual(defaults, defaultsBefore);
  assert.strictEqual(JSON.stringify(data), dataBefore);
  assert.strictEqual(JSON.stringify(journeysData), journeysBefore);
});

test('explorer state rejects invalid values and bounds shared focus', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'en', selectedRegion: ''
  };
  const parsed = explorerState.parse(new URLSearchParams('view=globe&year=9999&focus=china,unknown,china,rome,inca&region=moon&type=other&zoom=999&lang=de&panel=moon'), defaults, data);
  assert.strictEqual(parsed.view, 'map');
  assert.strictEqual(parsed.year, data.range.end);
  assert.deepStrictEqual(parsed.focus, ['china', 'rome']);
  assert.strictEqual(parsed.region, 'all');
  assert.strictEqual(parsed.type, 'all');
  assert.strictEqual(parsed.zoom, 240);
  assert.strictEqual(parsed.lang, 'en');
  assert.strictEqual(parsed.selectedRegion, '');
});

test('scale mode state is shareable, bounded, and never restores year zero', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'en', selectedRegion: '', scaleMode: 'overview'
  };
  const deep = explorerState.parse(new URLSearchParams('scale=deep&year=0'), defaults, data);
  assert.strictEqual(deep.scaleMode, 'deep');
  assert.strictEqual(deep.start, -20000);
  assert.strictEqual(deep.end, -3500);
  assert.strictEqual(deep.year, -3500);
  const historical = explorerState.parse(new URLSearchParams('scale=historical'), defaults, data);
  assert.strictEqual(historical.start, -3500);
  assert.strictEqual(historical.end, 1600);
  const invalid = explorerState.parse(new URLSearchParams('scale=cosmic'), defaults, data);
  assert.strictEqual(invalid.scaleMode, 'overview');
  const custom = explorerState.parse(new URLSearchParams('start=0&end=10'), defaults, data);
  assert.strictEqual(custom.start, -1);
  assert.strictEqual(custom.end, 10);
  assert.strictEqual(explorerState.serialize(deep, defaults).get('scale'), 'deep');
});

test('page exposes accessible scale modes, evidence note, and evidence rendering hooks', function () {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.ok(/id="scale-mode"[^>]*role="group"/.test(html));
  ['overview', 'deep', 'historical'].forEach(function (mode) {
    assert.ok(new RegExp('data-scale="' + mode + '"').test(html), 'missing scale control ' + mode);
  });
  assert.ok(/data-i18n="earliestShownNote"/.test(html));
  assert.ok(/scale-breakpoint/.test(app));
  assert.ok(/precision-badge/.test(app));
  assert.ok(/review-status/.test(app));
  ['confidenceLabel', 'calibrationCurve', 'chronologyModel', 'chronologyAlternatives', 'disputeNote'].forEach(function (marker) {
    assert.ok(app.indexOf(marker) !== -1, 'missing extended evidence hook ' + marker);
  });
  assert.ok(/href="academic-audit\.json"[^>]*data-i18n="academicAudit"/.test(html));
});

test('adaptive timeline exposes one shared tooltip and period interaction hooks', function () {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.ok(/id="period-tooltip"[^>]*role="tooltip"/.test(html));
  ['data-period', 'periodDensity', 'showPeriodTooltip', 'movePeriodFocus', 'emphasized'].forEach(function (marker) {
    assert.ok(app.indexOf(marker) !== -1, 'missing adaptive timeline hook ' + marker);
  });
  assert.ok(app.indexOf('event-lane') !== -1);
  assert.ok(app.indexOf('period-lane') !== -1);
});

test('luminous atlas and adaptive timeline CSS expose the approved visual states', function () {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  ['.atlas-coast-glow', '.atlas-comparison', '.period-density-wide', '.period-density-medium',
    '.period-density-compact', '.period-density-node', '.event-lane', '.period-lane',
    '.detail-list li.emphasized', '.period-tooltip'].forEach(function (selector) {
    assert.ok(css.indexOf(selector) !== -1, 'missing CSS contract ' + selector);
  });
  assert.ok(/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css));
  assert.ok(/overflow-x:\s*(clip|hidden)/.test(css));
  assert.ok(/class="atlas-geography"[\s\S]*id="atlas-world"[\s\S]*id="atlas-regions"/.test(html), 'map and markers must share one projected geography layer');
  assert.ok(/\.atlas-geography\s*\{[^}]*aspect-ratio:\s*1000\s*\/\s*520/s.test(css), 'geography layer must preserve the Natural Earth viewBox ratio');
  assert.ok(/--pulse-size:\s*clamp\([^;]+,\s*3\.5rem\)/.test(css), 'dense atlas pulses must remain compact');
  ['mediterranean', 'west-asia'].forEach(function (region) {
    assert.ok(css.indexOf('.atlas-region[data-region="' + region + '"] small') !== -1, 'dense atlas label needs a collision offset: ' + region);
  });
});

test('directed journey assets are loaded in dependency order and shipped by Pages', function () {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/deploy-pages.yml'), 'utf8');
  const validator = fs.readFileSync(path.join(root, 'scripts/validate.sh'), 'utf8');

  ['journeys-data.js', 'journey.js', 'journey-view.js'].forEach(function (asset) {
    assert.ok(fs.existsSync(path.join(root, asset)), asset + ' is missing');
    assert.ok(html.indexOf('<script src="' + asset + '"></script>') !== -1, asset + ' is not loaded relatively');
    assert.ok(workflow.indexOf(asset) !== -1, asset + ' is not packaged by Pages');
    assert.ok(validator.indexOf('node --check ' + asset) !== -1, asset + ' is not validated');
  });

  assert.ok(/<script src="atlas-view\.js"><\/script>\s*<script src="journeys-data\.js"><\/script>\s*<script src="journey\.js"><\/script>\s*<script src="journey-view\.js"><\/script>\s*<script src="app\.js"><\/script>/.test(html),
    'journey scripts must load after atlas-view and before app in dependency order');
});

test('page exposes an inert accessible journey launcher and persistent dialog shell', function () {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const launcherIndex = html.indexOf('class="journey-launch"');
  const headingIndex = html.indexOf('class="explorer-heading"');
  const explorerIndex = html.indexOf('class="explorer-shell"');
  const dialogIndex = html.indexOf('id="journey-dialog"');
  const toastIndex = html.indexOf('id="toast"');

  assert.ok(headingIndex < launcherIndex && launcherIndex < explorerIndex,
    'journey launcher must sit between the explorer heading and atlas');
  assert.ok(/<section class="journey-launch" aria-labelledby="journey-launch-title">/.test(html));
  assert.ok(/id="journey-open"/.test(html));
  ['journeyKicker', 'journeyLaunchTitle', 'journeyLaunchText', 'journeyOpen'].forEach(function (key) {
    assert.ok(html.indexOf('data-i18n="' + key + '"') !== -1, 'missing launcher copy hook ' + key);
  });

  assert.ok(/<dialog id="journey-dialog"[^>]*aria-labelledby="journey-dialog-title"/.test(html));
  ['journey-dialog-title', 'journey-exit', 'journey-announcement', 'journey-content'].forEach(function (id) {
    assert.ok(html.indexOf('id="' + id + '"') !== -1, 'missing journey dialog hook ' + id);
  });
  assert.ok(dialogIndex < toastIndex, 'journey dialog must precede the toast');
  assert.ok(/<p id="journey-announcement" class="sr-only" aria-live="polite" aria-atomic="true"><\/p>\s*<div id="journey-content" class="journey-content"><\/div>/.test(html),
    'persistent empty announcement must be the content target sibling');
  assert.strictEqual(/id="journey-content"[^>]*>[\s\S]*id="journey-announcement"/.test(html), false,
    'persistent live region must not be rendered inside replaceable journey content');
  ['siteName', 'journeyDialogTitle', 'journeyExit'].forEach(function (key) {
    assert.ok(html.substring(dialogIndex, toastIndex).indexOf('data-i18n="' + key + '"') !== -1,
      'missing dialog copy hook ' + key);
  });

  assert.strictEqual(/\son[a-z]+\s*=/.test(html), false, 'inline event handlers are forbidden');
  assert.strictEqual(/<script(?![^>]*\bsrc=)[^>]*>/.test(html), false, 'inline scripts are forbidden');
  assert.strictEqual(/<script[^>]+src=["'](?:https?:)?\/\//.test(html), false, 'external scripts are forbidden');
  assert.strictEqual(/<link[^>]+href=["'](?:https?:)?\/\//.test(html), false, 'external stylesheets are forbidden');
  assert.strictEqual(/(?:src|href)=["']\/(?!\/)/.test(html), false, 'absolute asset paths are forbidden');
});

test('journey CSS covers the luminous full-screen stage and generated view hooks', function () {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  const hooks = [
    '.journey-launch', '.journey-open', '.journey-dialog', '.journey-shell', '.journey-topbar',
    '.journey-brand', '.journey-content', '.journey-catalog', '.journey-cards', '.journey-card',
    '.journey-card-map', '.journey-card-summary', '.journey-card-meta', '.journey-stage',
    '.journey-map-layer', '.journey-stage-header', '.journey-route-title', '.journey-progress-text',
    '.journey-year', '.journey-body', '.journey-progress', '.journey-clock', '.journey-controls',
    '.journey-complete', '.journey-complete-kicker', '.journey-complete-actions'
  ];
  hooks.forEach(function (selector) {
    assert.ok(css.indexOf(selector) !== -1, 'missing journey CSS hook ' + selector);
  });

  const dialogRule = /\.journey-dialog\s*\{([^}]*)\}/.exec(css);
  assert.ok(dialogRule, 'missing journey dialog rule');
  ['width:\\s*100dvw', 'height:\\s*100dvh', 'max-width:\\s*none', 'max-height:\\s*none',
    'margin:\\s*0', 'padding:\\s*0', 'border:\\s*0', 'border-radius:\\s*0'].forEach(function (pattern) {
    assert.ok(new RegExp(pattern).test(dialogRule[1]), 'journey dialog is not full screen: ' + pattern);
  });
  assert.ok(/\.journey-dialog::backdrop\s*\{[^}]*background:\s*#[0-9a-f]{3,8}/i.test(css),
    'journey backdrop must be an opaque dark color');
  assert.ok(/body\.journey-open\s*\{[^}]*overflow:\s*hidden/.test(css));
  assert.ok(/\.journey-shell\s*\{[^}]*min-height:\s*100dvh[^}]*grid-template-rows:\s*auto\s+1fr/s.test(css));
  assert.ok(/\.journey-topbar\s*\{[^}]*min-height:\s*(?:6[4-9]|7[0-2])px[^}]*z-index:/s.test(css));
  assert.ok(/\.journey-content\s*\{[^}]*min-width:\s*0[^}]*min-height:\s*0/s.test(css));
  assert.ok(/\.journey-open\s*\{[^}]*min-height:\s*44px/s.test(css));
  assert.ok(/\.journey-dialog[\s\S]*:focus-visible\s*\{[^}]*outline:\s*[23]px/s.test(css));
  assert.ok(/\.journey-cards\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(/s.test(css));
  assert.ok(/\.journey-map-layer\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0[^}]*pointer-events:\s*none/s.test(css));
  assert.ok(/\.journey-stage\s*\{[^}]*min-height:\s*calc\(100dvh\s*-\s*(?:6[4-9]|7[0-2])px\)/s.test(css));
  assert.ok(/\.journey-body\s*\{[^}]*max-(?:width|inline-size):\s*60ch/s.test(css));
  assert.ok(/\.journey-clock\s*\{[^}]*--journey-progress:[^}]*conic-gradient\(/s.test(css));
  assert.ok(/\.journey-(?:controls|complete-actions)[\s\S]*button\s*\{[^}]*min-height:\s*44px/s.test(css));
  assert.ok(/@keyframes\s+journey-[\w-]+\s*\{[\s\S]*transform:[^;}]+;[\s\S]*opacity:/s.test(css));
  assert.ok(/@media \(max-width: 620px\)[\s\S]*\.journey-/s.test(css));
  assert.ok(/@media \(max-width: 390px\)[\s\S]*\.journey-/s.test(css));
  assert.ok(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.journey-dialog/.test(css));
  assert.ok(/\.journey-dialog \*,\s*\.journey-dialog::before,\s*\.journey-dialog::after/.test(css));
  assert.ok(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.journey-dialog[\s\S]*transform:\s*none\s*!important/.test(css));
});

test('390px journey controls keep five and four button variants to two rows', function () {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  const compactStart = css.indexOf('@media (max-width: 390px)');
  const compactEnd = css.indexOf('@media (prefers-reduced-motion: reduce)', compactStart);
  const compactCss = css.substring(compactStart, compactEnd);

  assert.ok(compactStart !== -1 && compactEnd > compactStart, 'missing bounded 390px journey rules');
  assert.ok(/\.journey-controls\s*\{[^}]*grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/s.test(compactCss),
    '390px controls need six layout tracks');
  assert.ok(/\.journey-controls\s*>\s*button\s*\{[^}]*grid-column:\s*span\s+2/s.test(compactCss),
    'canonical controls must place three buttons on the first row');
  assert.ok(/\.journey-controls\s*>\s*button:nth-child\(n\s*\+\s*4\)\s*\{[^}]*grid-column:\s*span\s+3/s.test(compactCss),
    'canonical controls 4 and 5 must share the second row');
  assert.ok(/button:first-child:nth-last-child\(4\)[\s\S]*~\s*button\s*\{[^}]*grid-column:\s*span\s+3/s.test(compactCss),
    'four-button fallback must form a balanced two-by-two grid');
});

test('journey reduced motion preserves injected atlas positioning transforms', function () {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  const reducedStart = css.indexOf('@media (prefers-reduced-motion: reduce)');
  const reducedCss = css.substring(reducedStart);
  const broadRule = /\.journey-dialog,\s*\.journey-dialog \*,\s*\.journey-dialog::before,\s*\.journey-dialog::after,\s*\.journey-dialog \*::before,\s*\.journey-dialog \*::after\s*\{([^}]*)\}/.exec(reducedCss);

  assert.ok(reducedStart !== -1 && broadRule, 'missing broad journey reduced-motion rule');
  assert.strictEqual(/transform\s*:/.test(broadRule[1]), false,
    'descendant-wide transform reset destroys atlas marker and label positioning');
  assert.ok(/\.journey-stage,\s*\.journey-map-layer\s*\{[^}]*transform:\s*none\s*!important/s.test(reducedCss),
    'only spatially animated journey layers should reset transforms');
});

test('journey shell constrains its scroll row to the dynamic viewport', function () {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  const shellRule = /\.journey-shell\s*\{([^}]*)\}/.exec(css);

  assert.ok(shellRule, 'missing journey shell layout rule');
  assert.ok(/(?:^|;)\s*height:\s*100dvh\s*;/s.test(shellRule[1]),
    'journey shell needs a definite viewport height for its 1fr row');
  assert.ok(/grid-template-rows:\s*auto\s+1fr/.test(shellRule[1]));
  assert.ok(/\.journey-content\s*\{[^}]*min-height:\s*0[^}]*overflow-y:\s*auto/s.test(css));
});

test('journey primary controls meet WCAG AA text contrast', function () {
  function luminance(hex) {
    const channels = hex.substring(1).match(/../g).map(function (value) {
      const channel = parseInt(value, 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function contrast(foreground, background) {
    const foregroundLuminance = luminance(foreground);
    const backgroundLuminance = luminance(background);
    return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
      (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
  }

  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  const launcherRule = /\.journey-open\s*\{([^}]*)\}/.exec(css);
  const buttonRule = /\.journey-topbar button,\s*\.journey-dialog button\s*\{([^}]*)\}/.exec(css);
  const primaryRule = /\.journey-controls button\[data-journey-action="next"\],\s*\.journey-complete-actions button:first-child\s*\{([^}]*)\}/.exec(css);
  assert.ok(launcherRule && buttonRule && primaryRule, 'missing journey primary control rules');

  const launcherForeground = /color:\s*(#[0-9a-f]{6})/i.exec(launcherRule[1])[1];
  const launcherGradient = /background:\s*linear-gradient\(([^;]+)\)/.exec(launcherRule[1])[1];
  const launcherColors = launcherGradient.match(/#[0-9a-f]{6}/gi);
  const launcherEndpoint = launcherColors[launcherColors.length - 1];
  const primaryForeground = /color:\s*(#[0-9a-f]{6})/i.exec(buttonRule[1])[1];
  const primaryBackground = /background:\s*(#[0-9a-f]{6})/i.exec(primaryRule[1])[1];

  assert.ok(contrast(launcherForeground, launcherEndpoint) >= 4.5,
    'journey launcher gradient endpoint is below 4.5:1');
  assert.ok(contrast(primaryForeground, primaryBackground) >= 4.5,
    'journey primary action is below 4.5:1');
});

test('atlas view renders accessible region controls and bundled world SVG', function () {
  const html = atlasView.renderRegions([{ id: 'east-asia', count: 3, x: 76, y: 40, radius: 14 }], {
    regionNames: { 'east-asia': 'East Asia' },
    activeRegionLabel: '{name}: {count} active tracks'
  });
  assert.ok(html.indexOf('data-region="east-asia"') !== -1);
  assert.ok(html.indexOf('aria-label="East Asia: 3 active tracks"') !== -1);
  assert.ok(html.indexOf('--atlas-x:76%') !== -1);
  const worldMap = require(path.join(root, 'world-map-data.js'));
  const svg = atlasView.worldSvg(worldMap, 'World map', {
    from: { x: 25, y: 40 }, to: { x: 75, y: 35 }, title: 'Alpha and Beta'
  }, { comparisonConnectorLabel: 'Comparison: {title}' });
  assert.ok(svg.indexOf('<svg') === 0);
  assert.ok(svg.indexOf('aria-label="World map"') !== -1);
  assert.ok(svg.indexOf('class="atlas-ocean"') !== -1);
  assert.ok(svg.indexOf('class="atlas-coast atlas-coast-glow"') !== -1);
  assert.ok(svg.indexOf('class="atlas-coast atlas-coast-line"') !== -1);
  assert.ok(svg.indexOf('class="atlas-comparison"') !== -1);
  assert.ok(svg.indexOf('aria-label="Comparison: Alpha and Beta"') !== -1);
  assert.strictEqual(atlasView.worldSvg(worldMap, 'World map', null, {}).indexOf('atlas-comparison'), -1);
  assert.strictEqual(svg.indexOf('<script'), -1);
});

test('atlas view escapes dynamic copy and renders insight or statistics fallback', function () {
  const hostile = '<img src=x onerror=alert(1)>';
  const insightHtml = atlasView.renderPanel({
    insight: { title: hostile, summary: 'Safe & sound', trackIds: ['china', 'greece'] },
    stats: { tracks: 2, societies: 1, traditions: 1, regions: 2 }
  }, { insightKicker: 'At the same time', openComparison: 'Open comparison', statsFallbackTitle: 'World overview', statsTemplate: '{tracks} tracks · {regions} regions', statSocieties: 'societies' });
  assert.strictEqual(insightHtml.indexOf('<img'), -1);
  assert.ok(insightHtml.indexOf('&lt;img') !== -1);
  assert.ok(insightHtml.indexOf('data-focus="china,greece"') !== -1);
  const fallback = atlasView.renderPanel({ insight: null, stats: { tracks: 7, societies: 4, traditions: 3, regions: 5 } }, {
    insightKicker: 'At the same time', openComparison: 'Open comparison', statsFallbackTitle: 'World overview', statsTemplate: '{tracks} tracks · {regions} regions', statSocieties: 'societies'
  });
  assert.ok(fallback.indexOf('World overview') !== -1);
  assert.ok(fallback.indexOf('7 tracks · 5 regions') !== -1);
  assert.ok(fallback.indexOf('<strong>4</strong><small>societies</small>') !== -1);
  assert.strictEqual(atlasView.renderRegions([], { regionNames: {}, activeRegionLabel: '{name}: {count}' }), '');
});

test('locale normalization and interface copy support Russian and English', function () {
  assert.strictEqual(i18n.normalizeLocale('en-US'), 'en');
  assert.strictEqual(i18n.normalizeLocale('ru-RU'), 'ru');
  assert.strictEqual(i18n.normalizeLocale('de-DE'), 'en');
  assert.strictEqual(i18n.text('ru', 'siteName'), 'Параллельные миры');
  assert.strictEqual(i18n.text('en', 'siteName'), 'Parallel Worlds');
  assert.strictEqual(i18n.text('xx', 'siteName'), 'Parallel Worlds');
});

test('locale metadata and normalization support Simplified Chinese', function () {
  assert.strictEqual(i18n.normalizeLocale('zh'), 'zh');
  assert.strictEqual(i18n.normalizeLocale('zh-CN'), 'zh');
  assert.strictEqual(i18n.normalizeLocale('zh-SG'), 'zh');
  assert.strictEqual(i18n.normalizeLocale('zh-TW'), 'en');
  assert.deepStrictEqual(i18n.locales.map(function (locale) { return locale.id; }), ['ru', 'en', 'zh']);
  assert.strictEqual(i18n.locales.find(function (locale) { return locale.id === 'zh'; }).htmlLang, 'zh-CN');
  assert.strictEqual(i18n.text('zh', 'siteName'), '平行世界');
});

test('journey interface copy is complete and exact in Russian English and Chinese', function () {
  const expected = {
    ru: {
      journeyKicker: 'Режиссёрские маршруты',
      journeyLaunchTitle: 'Пройдите историю как путешествие',
      journeyLaunchText: 'Карта проведёт по семи проверенным остановкам, а исследование всегда останется под вашим контролем.',
      journeyOpen: 'Начать путешествие · 2 минуты',
      journeyDialogTitle: 'Путешествия во времени',
      journeyCatalogTitle: 'Выберите маршрут',
      journeyCatalogText: 'Короткие истории, составленные только из проверенных хронологических записей.',
      journeyStart: 'Начать маршрут',
      journeyDuration: '{minutes} мин',
      journeyStops: '{count} остановок',
      journeyStopProgress: 'Остановка {current} из {total}',
      journeyPrevious: 'Назад',
      journeyNext: 'Далее',
      journeyPause: 'Пауза',
      journeyResume: 'Продолжить',
      journeyShare: 'Поделиться',
      journeyExit: 'Выйти',
      journeyEvidence: 'Открыть источники',
      journeyExplore: 'Исследовать этот момент',
      journeyReplay: 'Пройти ещё раз',
      journeyBackCatalog: 'К выбору маршрутов',
      journeyRestoreAtlas: 'Вернуться к исходному виду',
      journeyUnknownRoute: 'Этот маршрут недоступен. Выберите другой.',
      journeyUnknownStop: 'Остановка не найдена — маршрут открыт с начала.',
      journeyRenderError: 'Не удалось открыть путешествие. Атлас восстановлен.',
      journeyLinkCopied: 'Ссылка на остановку скопирована',
      journeyCompleteKicker: 'Маршрут завершён'
    },
    en: {
      journeyKicker: 'Directed journeys',
      journeyLaunchTitle: 'Travel through history',
      journeyLaunchText: 'The map guides you through seven reviewed stops, while exploration stays under your control.',
      journeyOpen: 'Start journey · 2 minutes',
      journeyDialogTitle: 'Time journeys',
      journeyCatalogTitle: 'Choose a journey',
      journeyCatalogText: 'Short guided stories built only from reviewed chronological records.',
      journeyStart: 'Start journey',
      journeyDuration: '{minutes} min',
      journeyStops: '{count} stops',
      journeyStopProgress: 'Stop {current} of {total}',
      journeyPrevious: 'Previous',
      journeyNext: 'Next',
      journeyPause: 'Pause',
      journeyResume: 'Resume',
      journeyShare: 'Share',
      journeyExit: 'Exit',
      journeyEvidence: 'Open evidence',
      journeyExplore: 'Explore this moment',
      journeyReplay: 'Replay journey',
      journeyBackCatalog: 'Back to journeys',
      journeyRestoreAtlas: 'Restore the original atlas view',
      journeyUnknownRoute: 'This journey is unavailable. Choose another.',
      journeyUnknownStop: 'That stop was not found, so the journey opened at the beginning.',
      journeyRenderError: 'The journey could not be opened. The atlas has been restored.',
      journeyLinkCopied: 'Stop link copied',
      journeyCompleteKicker: 'Journey complete'
    },
    zh: {
      journeyKicker: '导演式路线',
      journeyLaunchTitle: '像旅行一样穿越历史',
      journeyLaunchText: '地图将带你走过七个已审核的站点，探索节奏始终由你掌控。',
      journeyOpen: '开始旅程 · 2分钟',
      journeyDialogTitle: '时间之旅',
      journeyCatalogTitle: '选择一条路线',
      journeyCatalogText: '仅依据已审核年代记录编排的简短导览故事。',
      journeyStart: '开始路线',
      journeyDuration: '{minutes}分钟',
      journeyStops: '{count}个站点',
      journeyStopProgress: '第{current}站，共{total}站',
      journeyPrevious: '上一站',
      journeyNext: '下一站',
      journeyPause: '暂停',
      journeyResume: '继续',
      journeyShare: '分享',
      journeyExit: '退出',
      journeyEvidence: '查看证据',
      journeyExplore: '探索这一时刻',
      journeyReplay: '重新开始',
      journeyBackCatalog: '返回路线',
      journeyRestoreAtlas: '恢复原始地图视图',
      journeyUnknownRoute: '此路线不可用，请选择其他路线。',
      journeyUnknownStop: '未找到该站点，已从路线起点打开。',
      journeyRenderError: '无法打开旅程，已恢复地图。',
      journeyLinkCopied: '站点链接已复制',
      journeyCompleteKicker: '旅程完成'
    }
  };

  Object.keys(expected).forEach(function (locale) {
    Object.keys(expected[locale]).forEach(function (key) {
      assert.strictEqual(i18n.text(locale, key), expected[locale][key], locale + ' journey copy mismatch: ' + key);
      assert.ok(i18n.text(locale, key).trim(), locale + ' journey copy is blank: ' + key);
    });
  });

  const source = fs.readFileSync(path.join(root, 'i18n.js'), 'utf8');
  const blocks = {
    ru: /var copy = \{\s*ru:\s*\{([\s\S]*?)\n\s*\},\s*en:/.exec(source),
    en: /\n\s*en:\s*\{([\s\S]*?)\n\s*\},\s*zh:/.exec(source),
    zh: /\n\s*zh:\s*\{([\s\S]*?)\n\s*\}\s*\n\s*\};/.exec(source)
  };
  const localeKeys = {};
  Object.keys(blocks).forEach(function (locale) {
    assert.ok(blocks[locale], 'could not inspect ' + locale + ' interface copy');
    localeKeys[locale] = Array.from(blocks[locale][1].matchAll(/(?:^|,)\s*([A-Za-z][A-Za-z0-9]*):\s*'/g))
      .map(function (match) { return match[1]; }).sort();
  });
  assert.deepStrictEqual(localeKeys.ru, localeKeys.en, 'Russian and English interface keys differ');
  assert.deepStrictEqual(localeKeys.en, localeKeys.zh, 'English and Chinese interface keys differ');
});

test('Simplified Chinese covers every interface key used by the site', function () {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const keys = new Set();
  html.replace(/data-i18n(?:-[a-z]+)?="([^"]+)"/g, function (_, key) { keys.add(key); return _; });
  app.replace(/\bt\('([^']+)'/g, function (_, key) { keys.add(key); return _; });
  keys.forEach(function (key) {
    const value = i18n.text('zh', key, { name: '名称', count: 1, year: '公元1年' });
    assert.notStrictEqual(value, i18n.text('en', key), 'Chinese falls back to English for ' + key);
    if (key !== 'csvFilename') assert.ok(/[\u3400-\u9fff]/.test(value), 'missing Chinese interface copy for ' + key);
  });
});

test('English localization covers every historical track, period, note, and event', function () {
  const english = i18n.localizeData(data, 'en');
  assert.strictEqual(english.tracks.length, data.tracks.length);
  assert.strictEqual(english.tracks.find(function (track) { return track.id === 'byzantium'; }).name, 'Byzantine Empire');
  assert.strictEqual(english.tracks.find(function (track) { return track.id === 'babylonia'; }).periods[0].name, 'Old Babylonian period');
  assert.strictEqual(english.tracks.find(function (track) { return track.id === 'egypt'; }).events[1].title, 'Pyramids of Giza');

  english.tracks.forEach(function (track, trackIndex) {
    const original = data.tracks[trackIndex];
    assert.ok(track.name && track.summary, 'missing English track copy for ' + track.id);
    assert.strictEqual(track.periods.length, original.periods.length, 'period count drift for ' + track.id);
    assert.strictEqual(track.events.length, original.events.length, 'event count drift for ' + track.id);
    track.periods.forEach(function (period, index) {
      assert.ok(period.name, 'missing English period ' + track.id + ':' + index);
      if (original.periods[index].note) assert.ok(period.note, 'missing English note ' + track.id + ':' + index);
    });
    track.events.forEach(function (event, index) {
      assert.ok(event.title, 'missing English event ' + track.id + ':' + index);
      if (original.events[index].note) assert.ok(event.note, 'missing English event note ' + track.id + ':' + index);
    });
    const englishCopy = [track.name, track.summary]
      .concat(track.periods.map(function (period) { return period.name + ' ' + period.note; }))
      .concat(track.events.map(function (event) { return event.title + ' ' + event.note; }))
      .join(' ');
    assert.ok(!/[А-Яа-яЁё]/.test(englishCopy), 'Cyrillic fallback remains in ' + track.id);
  });
});

test('Simplified Chinese localization covers every historical track, period, note, and event', function () {
  const chinese = i18n.localizeData(data, 'zh');
  assert.strictEqual(chinese.tracks.length, data.tracks.length);
  assert.strictEqual(chinese.tracks.find(function (track) { return track.id === 'china'; }).name, '中国历史政权');
  assert.strictEqual(chinese.tracks.find(function (track) { return track.id === 'babylonia'; }).periods[0].name, '古巴比伦时期');
  assert.strictEqual(chinese.tracks.find(function (track) { return track.id === 'egypt'; }).events[1].title, '吉萨金字塔');

  chinese.tracks.forEach(function (track, trackIndex) {
    const original = data.tracks[trackIndex];
    assert.strictEqual(track.periods.length, original.periods.length, 'Chinese period count drift for ' + track.id);
    assert.strictEqual(track.events.length, original.events.length, 'Chinese event count drift for ' + track.id);
    [track.name, track.summary].forEach(function (value) {
      assert.ok(/[\u3400-\u9fff]/.test(value), 'missing Chinese track copy for ' + track.id);
    });
    track.periods.forEach(function (period, index) {
      assert.ok(/[\u3400-\u9fff]/.test(period.name), 'missing Chinese period ' + track.id + ':' + index);
      if (original.periods[index].note) assert.ok(/[\u3400-\u9fff]/.test(period.note), 'missing Chinese note ' + track.id + ':' + index);
    });
    track.events.forEach(function (event, index) {
      assert.ok(/[\u3400-\u9fff]/.test(event.title), 'missing Chinese event ' + track.id + ':' + index);
    });
  });
});

test('localized data drives English search and era notation', function () {
  const english = i18n.localizeData(data, 'en');
  const result = timeline.filterTracks(english.tracks, { query: 'Old Babylonian', region: 'all', type: 'all' });
  assert.deepStrictEqual(result.map(function (track) { return track.id; }), ['babylonia']);
  assert.strictEqual(timeline.formatYear(-753, 'en'), '753 BCE');
  assert.strictEqual(timeline.formatYear(0, 'en'), '1 CE');
  assert.strictEqual(timeline.formatYear(1453, 'en'), '1453 CE');
  assert.strictEqual(timeline.formatYear(-753, 'ru'), '753 до н. э.');
});

test('localized data drives Chinese search and era notation', function () {
  const chinese = i18n.localizeData(data, 'zh');
  const result = timeline.filterTracks(chinese.tracks, { query: '古巴比伦', region: 'all', type: 'all' });
  assert.deepStrictEqual(result.map(function (track) { return track.id; }), ['babylonia']);
  assert.strictEqual(timeline.formatYear(-753, 'zh'), '公元前753年');
  assert.strictEqual(timeline.formatYear(0, 'zh'), '公元1年');
  assert.strictEqual(timeline.formatYear(1453, 'zh'), '公元1453年');
});

test('CSV export accepts localized headers, types, regions, and historical copy', function () {
  const english = i18n.localizeData(data, 'en');
  const babylonia = english.tracks.filter(function (track) { return track.id === 'babylonia'; });
  const csv = timeline.buildCsv(babylonia, {
    headers: ['Track', 'Type', 'Region', 'Period', 'Start', 'End', 'Note'],
    typeNames: { polity: 'polity', tradition: 'tradition' },
    regionNames: { mesopotamia: 'Mesopotamia' }
  });
  assert.ok(csv.indexOf('"Track","Type","Region"') === 0);
  assert.ok(csv.indexOf('"Babylonian dynasties","polity","Mesopotamia","Old Babylonian period"') !== -1);
});

test('CSV export supports Chinese headers and values', function () {
  const chinese = i18n.localizeData(data, 'zh');
  const babylonia = chinese.tracks.filter(function (track) { return track.id === 'babylonia'; });
  const csv = timeline.buildCsv(babylonia, {
    headers: ['历史线', '类型', '地区', '时期', '开始', '结束', '说明'],
    typeNames: { polity: '政体', tradition: '传统' },
    regionNames: { mesopotamia: '美索不达米亚' }
  });
  assert.ok(csv.indexOf('"历史线","类型","地区"') === 0);
  assert.ok(csv.indexOf('"巴比伦诸王朝","政体","美索不达米亚","古巴比伦时期"') !== -1);
});

test('CSV export carries reviewed dating evidence and exact source links', function () {
  const english = i18n.localizeData(data, 'en');
  const xianrendong = english.tracks.filter(function (track) { return track.id === 'xianrendong'; });
  const csv = timeline.buildCsv(xianrendong, {
    headers: ['Track', 'Type', 'Region', 'Period', 'Start', 'End', 'Note', 'Precision', 'Dating basis', 'Original dating', 'Review status', 'Sources'],
    typeNames: { site: 'Site / settlement' },
    regionNames: { 'east-asia': 'East Asia' },
    precisionNames: { range: 'range' },
    basisNames: { radiocarbon: 'radiocarbon dating' },
    reviewNames: { reviewed: 'reviewed' },
    sources: data.sources,
    includeEvidence: true
  });
  assert.ok(csv.indexOf('"Precision","Dating basis","Original dating","Review status","Sources"') !== -1);
  assert.ok(csv.indexOf('"range","radiocarbon dating","ca. 20,000–19,000 cal BP (approximately 18,050–17,050 cal BCE)","reviewed"') !== -1);
  assert.ok(csv.indexOf('"https://doi.org/10.1126/science.1218643"') !== -1);
});

test('CSV export includes confidence, model, calibration, alternatives, and dispute note', function () {
  const csv = timeline.buildCsv([{
    name: 'Test track', type: 'site', region: 'west-asia', reviewStatus: 'reviewed', sources: ['exact'],
    periods: [{
      name: 'Test period', start: -12000, end: -11000, note: '', sourceIds: ['exact'],
      dating: {
        precision: 'range', basis: 'radiocarbon', original: '12,000–11,000 BCE', confidence: 'high',
        model: 'preferred', calibrationCurve: 'IntCal20',
        alternatives: [{ id: 'short-model', label: 'Short model', start: -11900, end: -11100 }],
        disputeNote: 'A narrower posterior interval is also published.'
      }
    }]
  }], {
    headers: ['Track', 'Type', 'Region', 'Period', 'Start', 'End', 'Note', 'Precision', 'Dating basis', 'Original dating', 'Review status', 'Sources', 'Confidence', 'Model', 'Calibration curve', 'Alternatives', 'Dispute note'],
    sources: { exact: { url: 'https://doi.org/10.1000/example' } }, includeEvidence: true
  });
  assert.ok(csv.indexOf('"Confidence","Model","Calibration curve","Alternatives","Dispute note"') !== -1);
  assert.ok(csv.indexOf('"high","preferred","IntCal20","Short model: -11900–-11100","A narrower posterior interval is also published."') !== -1);
});

test('localized chronology evidence flows into Russian and Chinese CSV exports', function () {
  function exportBabylonia(locale) {
    const localized = i18n.localizeData(data, locale);
    const babylonia = localized.tracks.filter(function (track) { return track.id === 'babylonia'; });
    return timeline.buildCsv(babylonia, {
      headers: ['Track', 'Type', 'Region', 'Period', 'Start', 'End', 'Note', 'Precision', 'Dating basis', 'Original dating', 'Review status', 'Sources', 'Confidence', 'Model', 'Calibration curve', 'Alternatives', 'Dispute note'],
      sources: data.sources,
      includeEvidence: true
    });
  }

  const russian = exportBabylonia('ru');
  assert.ok(russian.indexOf('Средняя хронология') !== -1);
  assert.ok(russian.indexOf('Низко-средняя хронология (на 8 лет позднее)') !== -1);
  assert.ok(russian.indexOf('Дендрохронологические') !== -1);

  const chinese = exportBabylonia('zh');
  assert.ok(chinese.indexOf('中年表') !== -1);
  assert.ok(chinese.indexOf('低中年表（晚8年）') !== -1);
  assert.ok(chinese.indexOf('树轮与放射性碳证据') !== -1);
});

test('academic migration status and audit workflow are documented without overclaiming', function () {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.ok(readme.indexOf('25 рецензированных / 37 унаследованных') !== -1);
  assert.ok(readme.indexOf('node scripts/build-academic-audit.mjs') !== -1);
  assert.ok(readme.indexOf('docs/academic-method.md') !== -1);
  assert.ok(readme.indexOf('полностью академически проверены') === -1);

  const methodPath = path.join(root, 'docs/academic-method.md');
  assert.ok(fs.existsSync(methodPath), 'missing academic method document');
  const method = fs.readFileSync(methodPath, 'utf8');
  ['Tier A', 'Tier B', 'Tier C', 'confidence', 'alternatives', '37'].forEach(function (term) {
    assert.ok(method.indexOf(term) !== -1, 'academic method omits ' + term);
  });

  const deploymentPath = path.join(root, 'DEPLOYMENT_TASK.md');
  assert.ok(fs.existsSync(deploymentPath), 'missing deployment acceptance document');
  assert.ok(fs.readFileSync(deploymentPath, 'utf8').indexOf('academic-audit.json') !== -1);
});

test('directed journey documentation covers safe sharing, interaction and contribution workflow', function () {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const sectionMatch = /## Режиссёрские путешествия\n([\s\S]*?)(?=\n## )/.exec(readme);
  assert.ok(sectionMatch, 'README omits the directed journey section');
  const section = sectionMatch[1];
  [
    'journey=birth-of-cities',
    'journeyMode=paused',
    'prefers-reduced-motion',
    'journeys-data.js',
    'journey.js',
    'journey-view.js',
    'Space',
    'Escape',
    'свайп',
    'RU / EN / ZH',
    'node scripts/build-academic-audit.mjs',
    'npm test',
    'bash scripts/validate.sh'
  ].forEach(function (marker) {
    assert.ok(section.indexOf(marker) !== -1, 'directed journey README omits ' + marker);
  });
  assert.ok(/7[^\n]{0,40}останов/i.test(section), 'README does not state the route length');
  assert.ok(/общ[^\n]{0,100}ссыл[^\n]{0,100}paused/i.test(section),
    'README does not explain paused shared links');
  assert.ok(/manifest[^\n]{0,100}аудит[^\n]{0,100}тест/i.test(section),
    'README does not document the manifest-to-audit contribution path');
});

test('academic method defines a blocking evidence gate for directed journeys', function () {
  const method = fs.readFileSync(path.join(root, 'docs', 'academic-method.md'), 'utf8');
  const sectionMatch = /## Гейт режиссёрских путешествий\n([\s\S]*?)(?=\n## )/.exec(method);
  assert.ok(sectionMatch, 'academic method omits the directed journey gate');
  const section = sectionMatch[1];
  [
    '`reviewed`',
    '6–8',
    'RU / EN / ZH',
    'резюме',
    'итог',
    'текст каждой остановки',
    '`journeys`',
    '`journeyCoverage`',
    'керамика',
    'монументы',
    'земледелие',
    'node scripts/build-academic-audit.mjs',
    'npm test',
    'bash scripts/validate.sh'
  ].forEach(function (marker) {
    assert.ok(section.indexOf(marker) !== -1, 'academic journey gate omits ' + marker);
  });
  assert.ok(/точн[^\n]{0,80}источник/i.test(section), 'journey gate lacks the exact-source rule');
  assert.ok(/год[^\n]{0,100}событ[^\n]{0,100}период/i.test(section), 'journey gate lacks the stop-date rule');
  assert.ok(/ошиб[^\n]{0,100}блокир[^\n]{0,100}Pages/i.test(section), 'journey validation does not block Pages');
  assert.strictEqual(section.indexOf('переходы'), -1, 'journey gate documents a field the manifest does not contain');
  assert.strictEqual(section.indexOf('`journeys` и `coverage`'), -1,
    'journey gate names the wrong audit coverage section');
});

test('committed academic audit records complete reviewed journey coverage', function () {
  const report = JSON.parse(fs.readFileSync(path.join(root, 'academic-audit.json'), 'utf8'));
  assert.strictEqual(report.summary.blockingIssues, 0);
  assert.deepStrictEqual(report.journeyCoverage, { routes: 1, stops: 7, reviewedStops: 7 });
  assert.deepStrictEqual(report.journeys, [{ id: 'birth-of-cities', stops: 7, reviewedStops: 7 }]);
});

test('validation rejects a stale academic audit before tests and restores the worktree copy', function () {
  const validator = fs.readFileSync(path.join(root, 'scripts', 'validate.sh'), 'utf8');
  const snapshotIndex = validator.indexOf('mktemp');
  const snapshotCopyIndex = validator.indexOf('cp academic-audit.json');
  const trapIndex = validator.indexOf('trap restore_academic_audit EXIT');
  const buildIndex = validator.indexOf('node scripts/build-academic-audit.mjs');
  const compareIndex = validator.indexOf('cmp -s');
  const testsIndex = validator.indexOf('node tests/run-tests.js');

  assert.ok(snapshotIndex !== -1, 'validator does not create a secure audit snapshot');
  assert.ok(snapshotCopyIndex > snapshotIndex, 'validator does not snapshot the committed audit');
  assert.ok(trapIndex > snapshotCopyIndex && trapIndex < buildIndex,
    'validator must arm restoration before regenerating the audit');
  assert.ok(buildIndex < compareIndex && compareIndex < testsIndex,
    'validator must compare the regenerated audit before running tests');
  assert.ok(/function restore_academic_audit\(\)[\s\S]*cp "\$audit_snapshot" academic-audit\.json[\s\S]*rm -f "\$audit_snapshot"/.test(validator),
    'validator trap does not restore and remove the audit snapshot');
  assert.ok(/academic-audit\.json is stale[\s\S]*build-academic-audit\.mjs/.test(validator),
    'validator does not explain how to regenerate a stale audit');
});

test('required static site and Pages files exist and use relative assets', function () {
  const evidenceAssets = ['chronology.js', 'academic-data.js', 'data-quality.js'];
  const auditAssets = ['academic-audit.js', 'academic-audit.json'];
  const atlasAssets = ['atlas-data.js', 'insights.js', 'atlas.js', 'explorer-state.js', 'atlas-view.js'];
  const mapAssets = ['world-map-data.js'];
  ['index.html', 'styles.css', 'app.js', 'data.js', 'i18n.js', 'timeline.js'].concat(evidenceAssets).concat(auditAssets).concat(atlasAssets).concat(mapAssets).concat(['.nojekyll',
    '.github/workflows/deploy-pages.yml', 'scripts/validate.sh', 'README.md']
    ).forEach(function (file) { assert.ok(fs.existsSync(path.join(root, file)), 'missing ' + file); });
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  ['styles.css', 'data.js', 'i18n.js', 'timeline.js', 'app.js'].concat(evidenceAssets).concat(atlasAssets).concat(mapAssets).forEach(function (asset) {
    assert.ok(html.indexOf('="' + asset + '"') !== -1, 'asset is not relative: ' + asset);
  });
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/deploy-pages.yml'), 'utf8');
  evidenceAssets.concat(auditAssets).forEach(function (asset) {
    assert.ok(workflow.indexOf(asset) !== -1, 'Pages artifact omits evidence asset ' + asset);
  });
  assert.ok(html.indexOf('id="timeline"') !== -1);
  assert.ok(html.indexOf('id="detail-dialog"') !== -1);
  assert.ok(html.indexOf('id="language-select"') !== -1);
  assert.ok(html.indexOf('<option value="zh">中文</option>') !== -1);
  assert.ok(html.indexOf('<option value="reviewed" data-i18n="reviewedRecords">') !== -1);
  ['ru', 'en', 'zh'].forEach(function (locale) {
    assert.ok(i18n.text(locale, 'reviewedRecords'));
  });
  assert.strictEqual(html.indexOf('id="language-button"'), -1, 'binary language toggle should be removed');
  assert.ok(html.indexOf('data-i18n="heroTitleLead"') !== -1);
  ['explorer', 'view-map-button', 'view-chronology-button', 'atlas-view', 'atlas-map', 'atlas-regions',
    'atlas-panel', 'atlas-play-button', 'atlas-year-input', 'chronology-view'].forEach(function (id) {
    assert.ok(html.indexOf('id="' + id + '"') !== -1, 'missing explorer element ' + id);
  });
  atlasAssets.concat(mapAssets).forEach(function (asset) {
    assert.ok(html.indexOf('src="' + asset + '"') !== -1, 'missing atlas asset ' + asset);
  });
  assert.ok(workflow.indexOf('i18n.js') !== -1, 'Pages artifact does not include i18n.js');
  const validator = fs.readFileSync(path.join(root, 'scripts/validate.sh'), 'utf8');
  assert.ok(validator.indexOf('scripts/build-academic-audit.mjs') !== -1, 'validator does not regenerate the academic audit');
  auditAssets.forEach(function (asset) {
    assert.ok(validator.indexOf(asset) !== -1, 'validator does not cover audit asset ' + asset);
  });
  atlasAssets.concat(mapAssets).forEach(function (asset) {
    assert.ok(workflow.indexOf(asset) !== -1, 'Pages artifact does not include ' + asset);
    assert.ok(validator.indexOf(asset) !== -1, 'validator does not cover ' + asset);
  });
  const atlasBytes = atlasAssets.reduce(function (sum, asset) { return sum + fs.statSync(path.join(root, asset)).size; }, 0);
  assert.ok(atlasBytes < 180 * 1024, 'atlas modules exceed the 180 KB static budget');
  assert.ok(fs.statSync(path.join(root, 'world-map-data.js')).size < 120 * 1024, 'Natural Earth map asset exceeds 120 KB');
  atlasAssets.concat(mapAssets).forEach(function (asset) {
    const source = fs.readFileSync(path.join(root, asset), 'utf8');
    ['fetch(', 'XMLHttpRequest', '<script src="http'].forEach(function (marker) {
      assert.strictEqual(source.indexOf(marker), -1, asset + ' contains forbidden runtime dependency: ' + marker);
    });
  });
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.ok(app.indexOf('explorerState.serialize(state, defaults)') !== -1, 'shared explorer state is not persisted in the URL');
  assert.ok(app.indexOf("i18n.locales.some") !== -1, 'app does not validate locales through the locale registry');
});

test('journey controller transition ignores descendants then completes and cleans up exactly once', function () {
  const harness = makeJourneyControllerHarness();
  assert.ok(harness.api, 'missing gated journey controller test seam');
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const initial = journey.createState(route, { stopIndex: 0, status: 'paused' });
  const transitioning = journey.reduce(initial, { type: 'start', stopIndex: 0 }, route, { now: 100 });
  harness.api.setContext({
    state: controllerState(), elements: harness.elements, route: route,
    playerState: transitioning, autoplay: true
  });

  harness.api.armTransition();
  const animationListener = harness.stage.listeners.animationend;
  const transitionListener = harness.stage.listeners.transitionend;
  const fallback = harness.timers.timeouts.filter(function (timer) { return timer.ms === 1400; })[0];
  assert.strictEqual(typeof animationListener, 'function');
  assert.strictEqual(typeof transitionListener, 'function');
  assert.strictEqual(animationListener, transitionListener,
    'animation and transition completion must share one exactly-once guard');
  assert.ok(!harness.stage.listenerOptions.transitionend || !harness.stage.listenerOptions.transitionend.once,
    'descendant events must not consume a once listener');
  assert.ok(!harness.stage.listenerOptions.animationend || !harness.stage.listenerOptions.animationend.once,
    'descendant animation events must not consume a once listener');

  animationListener({ target: {} });
  assert.deepStrictEqual(harness.reducerEvents, []);
  assert.strictEqual(harness.stage.listeners.animationend, animationListener);
  assert.strictEqual(harness.stage.listeners.transitionend, transitionListener);
  assert.strictEqual(fallback.active, true);

  animationListener({ target: harness.stage });
  assert.deepStrictEqual(harness.reducerEvents, ['transitionEnd']);
  assert.strictEqual(harness.stage.listeners.animationend, undefined);
  assert.strictEqual(harness.stage.listeners.transitionend, undefined);
  assert.strictEqual(fallback.active, false);
  transitionListener({ target: harness.stage });
  fallback.fn();
  assert.deepStrictEqual(harness.reducerEvents, ['transitionEnd']);
});

test('journey controller preserves clock render URL and announcement on exact reducer no-op', function () {
  const harness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const playing = journey.createState(route, {
    stopIndex: 0, status: 'playing', deadline: 10000, remainingMs: 0
  });
  harness.api.setContext({
    state: controllerState({ journey: route.id, stop: route.stops[0].id, journeyMode: 'playing' }),
    elements: harness.elements, route: route, playerState: playing, autoplay: true
  });
  harness.api.renderJourney();
  const announcement = harness.timers.timeouts.filter(function (timer) { return timer.ms === 0; }).slice(-1)[0];
  announcement.fn();
  harness.api.startClock();
  const interval = harness.timers.intervals.slice(-1)[0];
  const before = {
    renderCount: harness.content.renderCount,
    historyCount: harness.historyUrls.length,
    timeoutCount: harness.timers.timeouts.length,
    announcement: harness.elements['journey-announcement'].textContent
  };

  harness.api.dispatch('visibilityVisible', 200);

  assert.strictEqual(harness.api.snapshot().playerState, playing);
  assert.strictEqual(interval.active, true, 'exact no-op stopped the owned journey clock');
  assert.strictEqual(harness.content.renderCount, before.renderCount, 'exact no-op rerendered the scene');
  assert.strictEqual(harness.historyUrls.length, before.historyCount, 'exact no-op rewrote URL state');
  assert.strictEqual(harness.timers.timeouts.length, before.timeoutCount, 'exact no-op rescheduled announcement');
  assert.strictEqual(harness.elements['journey-announcement'].textContent, before.announcement,
    'exact no-op cleared the live announcement');
});

test('journey live region survives same-scene status renders and announces the next stop once', function () {
  const harness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const paused = journey.createState(route, { stopIndex: 0, status: 'paused' });
  harness.api.setContext({
    state: controllerState({ journey: route.id, stop: route.stops[0].id }),
    elements: harness.elements, route: route, playerState: paused, autoplay: false
  });
  harness.api.renderJourney();
  const firstAnnouncements = harness.timers.timeouts.filter(function (timer) { return timer.ms === 0; });
  assert.strictEqual(firstAnnouncements.length, 1);
  firstAnnouncements[0].fn();
  const firstMessage = harness.elements['journey-announcement'].textContent;
  const firstRenderCount = harness.content.renderCount;

  harness.api.dispatch('interact', 200);
  assert.strictEqual(harness.content.renderCount, firstRenderCount + 1, 'status change did not render controls');
  assert.strictEqual(harness.elements['journey-announcement'].textContent, firstMessage,
    'same-scene status render cleared the live region');
  assert.strictEqual(harness.timers.timeouts.filter(function (timer) { return timer.ms === 0; }).length, 1,
    'same-scene status render reannounced the current stop');

  harness.api.dispatch('next', 250);
  const nextAnnouncements = harness.timers.timeouts.filter(function (timer) { return timer.ms === 0; });
  assert.strictEqual(nextAnnouncements.length, 2, 'next stop must schedule exactly one announcement');
  assert.strictEqual(harness.elements['journey-announcement'].textContent, '',
    'the previous stop message must clear when the scene changes');
  nextAnnouncements[1].fn();
  assert.ok(harness.elements['journey-announcement'].textContent.indexOf(route.stops[1].headline) !== -1);
});

test('journey keyboard routing leaves anchors to their native keyboard behavior', function () {
  [' ', 'ArrowLeft', 'ArrowRight'].forEach(function (key) {
    const harness = makeJourneyControllerHarness();
    const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
    const paused = journey.createState(route, { stopIndex: 0, status: 'paused' });
    harness.api.setContext({
      state: controllerState({ journey: route.id, stop: route.stops[0].id }),
      elements: harness.elements, route: route, playerState: paused, autoplay: false
    });
    const event = {
      key: key,
      target: { tagName: 'A', isContentEditable: false },
      prevented: false,
      preventDefault: function () { this.prevented = true; }
    };
    harness.api.handleKeydown(event);
    assert.strictEqual(event.prevented, false, key + ' was intercepted on an anchor');
    assert.deepStrictEqual(harness.reducerEvents, [], key + ' dispatched a journey action from an anchor');
    assert.strictEqual(harness.api.snapshot().playerState, paused);
  });
});

test('journey touch handlers require a dominant horizontal swipe and reset on cancellation', function () {
  const harness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const paused = journey.createState(route, { stopIndex: 0, status: 'paused' });
  harness.api.setContext({
    state: controllerState({ journey: route.id, stop: route.stops[0].id }),
    elements: harness.elements, route: route, playerState: paused, autoplay: false
  });
  assert.strictEqual(typeof harness.api.handleTouchStart, 'function');
  assert.strictEqual(typeof harness.api.handleTouchEnd, 'function');
  assert.strictEqual(typeof harness.api.handleTouchCancel, 'function');
  function start(x, y) {
    harness.api.handleTouchStart({ touches: [{ clientX: x, clientY: y }] });
  }
  function end(x, y) {
    harness.api.handleTouchEnd({ changedTouches: [{ clientX: x, clientY: y }] });
  }

  start(100, 100);
  end(20, 190);
  start(100, 100);
  end(90, 20);
  assert.deepStrictEqual(harness.reducerEvents, [], 'vertical or diagonal movement changed stops');

  start(100, 100);
  end(20, 110);
  assert.deepStrictEqual(harness.reducerEvents, ['next']);

  start(100, 100);
  harness.api.handleTouchCancel();
  end(20, 100);
  assert.deepStrictEqual(harness.reducerEvents, ['next'], 'touchcancel left stale swipe coordinates');
});

test('journey evidence deterministically converts a transition into exploring state', function () {
  const harness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const transitioning = journey.reduce(journey.createState(route, { status: 'paused' }), {
    type: 'start', stopIndex: 0
  }, route, { now: 100 });
  let opened = null;
  harness.api.setContext({
    state: controllerState(), elements: harness.elements, route: route,
    playerState: transitioning, autoplay: true
  });
  harness.api.armTransition();
  const fallback = harness.timers.timeouts.filter(function (timer) { return timer.ms === 1400; })[0];

  harness.api.activateEvidence('xianrendong', 'xianrendong-pottery-evidence', function (trackId, recordId) {
    opened = [trackId, recordId];
  });

  assert.deepStrictEqual(harness.reducerEvents, ['transitionEnd', 'interact']);
  assert.strictEqual(harness.api.snapshot().playerState.status, 'exploring');
  assert.strictEqual(fallback.active, false);
  assert.strictEqual(harness.dialog.open, true);
  assert.deepStrictEqual(opened, ['xianrendong', 'xianrendong-pottery-evidence']);
});

test('journey share serializes and returns a paused clone without mutating active state', function () {
  const harness = makeJourneyControllerHarness();
  const active = controllerState({
    year: -3200, focus: ['uruk'], journey: 'birth-of-cities', stop: 'uruk-urban-center',
    journeyMode: 'playing'
  });
  const before = JSON.stringify(active);
  harness.api.setContext({ state: active, elements: harness.elements });

  const url = harness.api.share();

  assert.strictEqual(JSON.stringify(active), before);
  assert.strictEqual(harness.serializedStates.length, 1);
  assert.strictEqual(harness.serializedStates[0].journeyMode, 'paused');
  assert.deepStrictEqual(harness.serializedStates[0].focus, ['uruk']);
  assert.strictEqual(harness.clipboardUrls[0], url);
  assert.ok(/^https:\/\/example\.test\/parallel-worlds\/\?/.test(url));
});

test('journey share handles clipboard rejection without closing or pausing the journey', function () {
  const harness = makeJourneyControllerHarness();
  const active = controllerState({
    journey: 'birth-of-cities', stop: 'uruk-urban-center', journeyMode: 'playing'
  });
  harness.control.rejectClipboard = true;
  harness.api.setContext({ state: active, elements: harness.elements });

  const url = harness.api.share();

  assert.strictEqual(harness.prompts[0], url);
  assert.strictEqual(active.journeyMode, 'playing');
  assert.strictEqual(active.journey, 'birth-of-cities');
  assert.strictEqual(harness.dialog.open, true);
  assert.strictEqual(harness.bodyClasses.has('journey-open'), true);
});

test('journey action and exit exceptions recover without leaking timers or modal state', function () {
  const shareHarness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const playing = journey.createState(route, { stopIndex: 0, status: 'playing', deadline: 1000 });
  shareHarness.api.setContext({
    state: controllerState({ journey: route.id, stop: route.stops[0].id, journeyMode: 'playing' }),
    elements: shareHarness.elements, route: route, playerState: playing, autoplay: true
  });
  shareHarness.api.startClock();
  const interval = shareHarness.timers.intervals[0];
  shareHarness.control.throwSerialize = true;
  assert.doesNotThrow(function () { shareHarness.api.handleAction('share'); });
  const recoveredShare = shareHarness.api.snapshot();
  assert.strictEqual(interval.active, false);
  assert.strictEqual(recoveredShare.state.journey, '');
  assert.strictEqual(recoveredShare.state.stop, '');
  assert.strictEqual(recoveredShare.state.journeyMode, 'paused');
  assert.strictEqual(shareHarness.dialog.open, false);
  assert.strictEqual(shareHarness.bodyClasses.has('journey-open'), false);

  const exitHarness = makeJourneyControllerHarness();
  const transitioning = journey.reduce(journey.createState(route, { status: 'paused' }), {
    type: 'start', stopIndex: 0
  }, route, { now: 100 });
  exitHarness.api.setContext({
    state: controllerState({ journey: route.id, stop: route.stops[0].id }),
    elements: exitHarness.elements, route: route, playerState: transitioning,
    preJourneyState: controllerState({ year: -7000 }), autoplay: false
  });
  exitHarness.api.armTransition();
  const fallback = exitHarness.timers.timeouts.filter(function (timer) { return timer.ms === 1400; })[0];
  assert.doesNotThrow(function () { exitHarness.api.finish(false); });
  assert.strictEqual(fallback.active, false);
  assert.strictEqual(exitHarness.dialog.open, false);
  assert.strictEqual(exitHarness.api.snapshot().state.journey, '');
  assert.ok(exitHarness.historyUrls.length > 0, 'recovery did not attempt to write the cleared URL state');
});

test('journey clock owns one interval and advances once at its deadline', function () {
  const harness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const playing = journey.createState(route, { stopIndex: 0, status: 'playing', deadline: 150 });
  harness.control.now = 200;
  harness.api.setContext({
    state: controllerState({ journey: route.id, stop: route.stops[0].id, journeyMode: 'playing' }),
    elements: harness.elements, route: route, playerState: playing, autoplay: true
  });

  harness.api.startClock();
  assert.strictEqual(harness.timers.intervals.length, 1);
  const interval = harness.timers.intervals[0];
  interval.fn();

  assert.strictEqual(interval.active, false);
  assert.deepStrictEqual(harness.reducerEvents, ['next']);
  assert.strictEqual(harness.api.snapshot().playerState.stopIndex, 1);
  assert.strictEqual(harness.api.snapshot().playerState.status, 'transitioning');
  interval.fn();
  assert.deepStrictEqual(harness.reducerEvents, ['next']);
});

test('journey exit state keeps the stop context by default and restores the snapshot on request', function () {
  const harness = makeJourneyControllerHarness();
  const current = controllerState({
    year: -3000, focus: ['liangzhu'], start: data.scale.breakpoint, end: data.range.end,
    scaleMode: 'historical', theme: 'dark', lang: 'zh', journey: 'birth-of-cities',
    stop: 'liangzhu-regional-center', journeyMode: 'playing'
  });
  const original = controllerState({
    year: -9500, focus: ['gobekli-tepe'], start: data.range.start, end: data.scale.breakpoint,
    scaleMode: 'deep', theme: 'light', lang: 'ru'
  });
  const kept = JSON.parse(JSON.stringify(harness.api.resolveExitState(current, original, false)));
  const restored = JSON.parse(JSON.stringify(harness.api.resolveExitState(current, original, true)));

  assert.strictEqual(kept.year, -3000);
  assert.deepStrictEqual(kept.focus, ['liangzhu']);
  assert.strictEqual(kept.scaleMode, 'historical');
  assert.strictEqual(kept.journey, '');
  assert.strictEqual(kept.stop, '');
  assert.strictEqual(kept.journeyMode, 'paused');

  assert.strictEqual(restored.year, -9500);
  assert.deepStrictEqual(restored.focus, ['gobekli-tepe']);
  assert.strictEqual(restored.scaleMode, 'deep');
  assert.strictEqual(restored.theme, 'dark');
  assert.strictEqual(restored.lang, 'zh');
});

test('nested detail dialog exclusively owns journey keyboard routing', function () {
  const harness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const playing = journey.createState(route, { stopIndex: 0, status: 'playing', deadline: 1000 });
  harness.detailDialog.open = true;
  harness.api.setContext({
    state: controllerState({ journey: route.id, stop: route.stops[0].id, journeyMode: 'playing' }),
    elements: harness.elements, route: route, playerState: playing, autoplay: true
  });
  function keyEvent(key) {
    return {
      key: key,
      target: { tagName: 'DIV', isContentEditable: false },
      prevented: false,
      preventDefault: function () { this.prevented = true; }
    };
  }

  const tab = keyEvent('Tab');
  harness.api.handleKeydown(tab);
  assert.strictEqual(tab.prevented, false, 'native Tab must remain with the top modal');
  [' ', 'ArrowLeft', 'ArrowRight'].forEach(function (key) {
    const event = keyEvent(key);
    harness.api.handleKeydown(event);
    assert.strictEqual(event.prevented, false, key + ' leaked to the underlying journey');
  });
  assert.deepStrictEqual(harness.reducerEvents, []);

  const escape = keyEvent('Escape');
  harness.api.handleKeydown(escape);
  assert.strictEqual(escape.prevented, true);
  assert.strictEqual(harness.detailDialog.open, false);
  assert.strictEqual(harness.dialog.open, true);
  assert.strictEqual(harness.api.snapshot().playerState.status, 'playing');
  assert.deepStrictEqual(harness.reducerEvents, []);
});

test('journey event evidence is emphasized scrolled and focused in details', function () {
  const harness = makeJourneyControllerHarness();
  harness.api.setContext({ state: controllerState(), elements: harness.elements });

  harness.api.openDetails('xianrendong', 'xianrendong-pottery-evidence');

  assert.ok(/data-event="xianrendong-pottery-evidence"[^>]*class="emphasized"/.test(harness.eventList.innerHTML),
    'selected journey event is not marked in event evidence');
  assert.strictEqual(harness.periodList.innerHTML.indexOf('class="emphasized"'), -1,
    'event id incorrectly selects a period');
  assert.strictEqual(harness.selectedEventNode.scrolled, true);
  assert.strictEqual(harness.selectedEventNode.focused, true);
  assert.strictEqual(harness.selectedPeriodNode.focused, false);
  assert.strictEqual(harness.detailDialog.open, true);
});

test('decorative journey map is inert and a real stage background click pauses playback', function () {
  const harness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const playing = journey.createState(route, { stopIndex: 0, status: 'playing', deadline: 1000 });
  harness.api.setContext({
    state: controllerState({ journey: route.id, stop: route.stops[0].id, journeyMode: 'playing' }),
    elements: harness.elements, route: route, playerState: playing, autoplay: true
  });

  harness.api.renderMap();
  assert.strictEqual(harness.mapMarker.tabIndex, -1);
  assert.strictEqual(harness.mapMarker.disabled, true);

  harness.api.handleContentClick({ target: harness.stage });
  assert.deepStrictEqual(harness.reducerEvents, ['interact']);
  assert.strictEqual(harness.api.snapshot().playerState.status, 'exploring');
});

test('synchronous clipboard failure falls back locally without recovering the journey', function () {
  const harness = makeJourneyControllerHarness();
  const active = controllerState({
    journey: 'birth-of-cities', stop: 'uruk-urban-center', journeyMode: 'playing'
  });
  harness.control.throwClipboard = true;
  harness.api.setContext({ state: active, elements: harness.elements });

  const url = harness.api.share();

  assert.strictEqual(harness.prompts[0], url);
  assert.strictEqual(active.journeyMode, 'playing');
  assert.strictEqual(active.journey, 'birth-of-cities');
  assert.strictEqual(harness.dialog.open, true);
  assert.strictEqual(harness.bodyClasses.has('journey-open'), true);
});

test('journey rendered headings are focus targets and every silent control is named', function () {
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const copy = {
    catalogTitle: 'Journeys', startJourney: 'Start', minutesTemplate: '{minutes} min',
    stopsTemplate: '{count} stops', previousStop: 'Previous', nextStop: 'Next',
    pauseJourney: 'Pause', resumeJourney: 'Resume', shareJourney: 'Share',
    openEvidence: 'Evidence', stopTemplate: 'Stop {current} of {total}'
  };
  const catalog = journeyView.catalogHtml([route], copy);
  const stageHtml = journeyView.stageHtml(route, { stopIndex: 2, status: 'playing' }, copy, String);

  assert.ok(/<h2 tabindex="-1">Journeys<\/h2>/.test(catalog), 'catalog heading is not programmatically focusable');
  assert.ok(/<h2 tabindex="-1">/.test(stageHtml), 'current stop heading is not programmatically focusable');
  assert.strictEqual((stageHtml.match(/aria-current="step"/g) || []).length, 1,
    'the stage must expose exactly one current progress segment');
  assert.ok(/data-journey-countdown aria-hidden="true"/.test(stageHtml),
    'the visual countdown must stay outside the accessibility tree');
  const controls = Array.from(stageHtml.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g));
  assert.ok(controls.length > 0);
  controls.forEach(function (match) {
    const visibleText = match[2].replace(/<[^>]+>/g, '').trim();
    assert.ok(visibleText || /aria-label="[^"]+"/.test(match[1]), 'unnamed journey control: ' + match[0]);
  });
  assert.strictEqual(/\son[a-z]+\s*=/i.test(catalog + stageHtml), false, 'inline event handler found');
});

test('journey catalog and changed stops focus headings without treating programmatic focus as interaction', function () {
  const harness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const trigger = {
    isConnected: true, focusCount: 0,
    focus: function () { this.focusCount += 1; harness.document.activeElement = this; }
  };
  harness.dialog.open = false;
  harness.document.activeElement = trigger;
  harness.api.setContext({ state: controllerState(), elements: harness.elements });

  harness.api.openCatalog('');
  assert.strictEqual(harness.content.currentHeading.kind, 'catalog');
  assert.strictEqual(harness.content.currentHeading.focusCount, 1);

  harness.api.start(route.id, route.stops[0].id, false);
  assert.strictEqual(harness.content.currentHeading.kind, 'stage');
  assert.strictEqual(harness.content.currentHeading.stopId, route.stops[0].id);
  assert.strictEqual(harness.content.currentHeading.focusCount, 1);
  assert.strictEqual(harness.reducerEvents.indexOf('interact'), -1,
    'programmatic stop focus paused playback');

  const focusCount = harness.focusedHeadings.length;
  const focusedHeading = harness.content.currentHeading;
  harness.api.renderJourney();
  assert.strictEqual(focusedHeading.isConnected, false);
  assert.strictEqual(harness.focusedHeadings.length, focusCount + 1,
    'a status-only rerender did not restore the intentionally focused heading');
  assert.strictEqual(harness.document.activeElement, harness.content.currentHeading);

  const playing = journey.createState(route, {
    stopIndex: 1, status: 'playing', deadline: 10000, remainingMs: route.stops[1].holdMs
  });
  harness.api.setContext({ route: route, playerState: playing, autoplay: true });
  harness.api.renderJourney();
  assert.strictEqual(harness.content.currentHeading.stopId, route.stops[1].id);
  assert.strictEqual(harness.content.currentHeading.focusCount, 1);
  assert.strictEqual(harness.api.snapshot().playerState.status, 'playing',
    'synchronous heading focus was interpreted as user focus');

  harness.api.handleFocusIn({ target: harness.content.currentHeading });
  assert.strictEqual(harness.api.snapshot().playerState.status, 'exploring',
    'real user focus inside a playing stop did not pause playback');
  assert.strictEqual(harness.reducerEvents[harness.reducerEvents.length - 1], 'interact');
});

test('same-stop transition rerender retains intentional heading focus on its connected replacement', function () {
  const harness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const transitioning = journey.reduce(journey.createState(route, { status: 'paused' }), {
    type: 'start', stopIndex: 0
  }, route, { now: 100, reducedMotion: false });
  harness.api.setContext({
    state: controllerState({ journey: route.id, stop: route.stops[0].id }),
    elements: harness.elements, route: route, playerState: transitioning, autoplay: true
  });

  harness.api.renderJourney();
  const heading = harness.content.currentHeading;
  assert.strictEqual(harness.document.activeElement, heading, 'new stop heading was not focused');
  assert.strictEqual(heading.focusCount, 1);

  harness.api.dispatch('transitionEnd', 200, false);

  const replacement = harness.content.currentHeading;
  assert.notStrictEqual(replacement, heading, 'status render did not replace the heading subtree');
  assert.strictEqual(heading.isConnected, false);
  assert.strictEqual(replacement.isConnected, true);
  assert.strictEqual(harness.document.activeElement, replacement,
    'focus remained on the disconnected stop heading');
  assert.strictEqual(replacement.focusCount, 1);
  assert.deepStrictEqual(harness.reducerEvents, ['transitionEnd']);

  const space = {
    key: ' ', target: replacement, prevented: false,
    preventDefault: function () { this.prevented = true; }
  };
  harness.api.handleKeydown(space);
  const pausedHeading = harness.content.currentHeading;
  assert.strictEqual(space.prevented, true);
  assert.notStrictEqual(pausedHeading, replacement);
  assert.strictEqual(replacement.isConnected, false);
  assert.strictEqual(harness.document.activeElement, pausedHeading,
    'Space pause lost intentional stop-heading focus');
  assert.deepStrictEqual(harness.reducerEvents, ['transitionEnd', 'pause']);
});

test('status-only journey dispatch restores the active control replacement without a focus pause loop', function () {
  const harness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const playing = journey.createState(route, {
    stopIndex: 0, status: 'playing', deadline: 10000, remainingMs: route.stops[0].holdMs
  });
  harness.api.setContext({
    state: controllerState({ journey: route.id, stop: route.stops[0].id, journeyMode: 'playing' }),
    elements: harness.elements, route: route, playerState: playing, autoplay: true
  });
  harness.api.renderJourney();
  const toggle = harness.content.currentControls.filter(function (control) {
    return control.dataset.journeyAction === 'toggle';
  })[0];
  assert.ok(toggle && toggle.isConnected, 'test stage did not render its Pause control');

  toggle.focus();

  const replacement = harness.content.currentControls.filter(function (control) {
    return control.dataset.journeyAction === 'toggle';
  })[0];
  assert.notStrictEqual(replacement, toggle, 'status render did not replace the control subtree');
  assert.strictEqual(toggle.isConnected, false);
  assert.strictEqual(harness.document.activeElement, replacement,
    'focus remained on the disconnected Pause control');
  assert.strictEqual(replacement.focusCount, 1, 'replacement Resume control was not focused exactly once');
  assert.strictEqual(harness.content.currentHeading.focusCount, 0,
    'control restoration incorrectly moved focus to the replacement heading');
  assert.strictEqual(harness.api.snapshot().playerState.status, 'exploring');
  assert.deepStrictEqual(harness.reducerEvents, ['interact'],
    'restoring the replacement caused a second user-interaction pause');
});

test('journey close restores only a connected meaningful trigger and repeated close is harmless', function () {
  function opener(connected) {
    const harness = makeJourneyControllerHarness();
    const trigger = {
      isConnected: true, focusCount: 0,
      focus: function () { this.focusCount += 1; harness.document.activeElement = this; }
    };
    harness.dialog.open = false;
    harness.document.activeElement = trigger;
    harness.api.setContext({ state: controllerState(), elements: harness.elements });
    harness.api.openCatalog('');
    trigger.isConnected = connected;
    assert.doesNotThrow(function () { harness.api.finish(false); });
    assert.doesNotThrow(function () { harness.api.finish(false); });
    return trigger.focusCount;
  }

  assert.strictEqual(opener(true), 1, 'connected trigger was not restored exactly once');
  assert.strictEqual(opener(false), 0, 'disconnected trigger received focus');

  const direct = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  direct.dialog.open = false;
  direct.document.activeElement = direct.document.body;
  direct.api.setContext({ state: controllerState(), elements: direct.elements });
  assert.doesNotThrow(function () { direct.api.start(route.id, route.stops[0].id, false); });
  assert.doesNotThrow(function () { direct.api.finish(false); });
});

test('nested evidence detail restores its connected trigger without pausing the underlying journey', function () {
  const harness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const playing = journey.createState(route, {
    stopIndex: 0, status: 'playing', deadline: 10000, remainingMs: route.stops[0].holdMs
  });
  harness.api.setContext({
    state: controllerState({ journey: route.id, stop: route.stops[0].id, journeyMode: 'playing' }),
    elements: harness.elements, route: route, playerState: playing, autoplay: true
  });
  harness.api.renderJourney();
  const evidence = harness.content.currentEvidenceTrigger;
  assert.ok(evidence && evidence.isConnected, 'test stage did not render its evidence trigger');

  harness.api.activateEvidence('xianrendong', 'xianrendong-pottery-evidence', undefined, evidence);
  assert.strictEqual(harness.detailDialog.open, true);
  const replacementEvidence = harness.content.currentEvidenceTrigger;
  assert.notStrictEqual(replacementEvidence, evidence, 'journey rerender did not replace its evidence control');
  harness.api.setContext({ playerState: playing, autoplay: true });
  const eventCount = harness.reducerEvents.length;
  harness.api.closeDetails();

  assert.strictEqual(evidence.focusCount, 0, 'disconnected evidence trigger received focus');
  assert.strictEqual(replacementEvidence.focusCount, 1, 'connected replacement evidence trigger was not restored');
  assert.strictEqual(harness.api.snapshot().playerState.status, 'playing');
  assert.strictEqual(harness.reducerEvents.length, eventCount,
    'restoring evidence focus dispatched a journey pause');
  assert.strictEqual(harness.dialog.open, true, 'closing nested details also closed the journey');
});

test('ordinary detail click helper restores the actual connected launcher', function () {
  const harness = makeJourneyControllerHarness();
  const launcher = {
    isConnected: true,
    focusCount: 0,
    dataset: { track: 'xianrendong', period: 'xianrendong-pottery-evidence' },
    focus: function () { this.focusCount += 1; harness.document.activeElement = this; }
  };
  harness.api.setContext({ state: controllerState(), elements: harness.elements });
  harness.document.activeElement = harness.document.body;

  harness.api.openDetailsFromTrigger(launcher);
  assert.strictEqual(harness.detailDialog.open, true);
  harness.api.closeDetails();

  assert.strictEqual(launcher.focusCount, 1,
    'ordinary pointer launcher was not restored when activeElement never became the button');
  assert.strictEqual(harness.document.activeElement, launcher);

  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.ok((app.match(/openDetailsFromTrigger\(button\)/g) || []).length >= 4,
    'atlas, track, period, and contemporary click handlers must pass their concrete button');
});

test('journey live announcements reject stale stop and closed-dialog callbacks', function () {
  const harness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const first = journey.createState(route, { stopIndex: 0, status: 'paused' });
  const second = journey.createState(route, { stopIndex: 1, status: 'paused' });
  harness.api.setContext({
    state: controllerState(), elements: harness.elements, route: route, playerState: first, autoplay: false
  });
  harness.api.renderJourney();
  const firstAnnouncement = harness.timers.timeouts.filter(function (timer) { return timer.ms === 0; }).slice(-1)[0];

  harness.api.setContext({ playerState: second });
  harness.api.renderJourney();
  const secondAnnouncement = harness.timers.timeouts.filter(function (timer) { return timer.ms === 0; }).slice(-1)[0];
  firstAnnouncement.fn();
  assert.strictEqual(harness.elements['journey-announcement'].textContent, '', 'stale stop was announced');
  secondAnnouncement.fn();
  assert.ok(harness.elements['journey-announcement'].textContent.indexOf(route.stops[1].headline) !== -1);

  harness.api.setContext({ playerState: first });
  harness.api.renderJourney();
  const closingAnnouncement = harness.timers.timeouts.filter(function (timer) { return timer.ms === 0; }).slice(-1)[0];
  harness.api.closeJourneyDialog();
  closingAnnouncement.fn();
  assert.strictEqual(harness.elements['journey-announcement'].textContent, '',
    'a closed journey announced stale scene copy');
});

test('reduced motion and repeated lifecycle calls never create an autoplay deadline', function () {
  const harness = makeJourneyControllerHarness();
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  harness.control.reducedMotion = true;
  harness.dialog.open = false;
  harness.api.setContext({ state: controllerState(), elements: harness.elements });
  harness.api.start(route.id, route.stops[0].id, true);
  assert.strictEqual(harness.api.snapshot().playerState.deadline, 0);
  assert.notStrictEqual(harness.api.snapshot().playerState.status, 'playing');
  assert.strictEqual(harness.timers.intervals.filter(function (timer) { return timer.active; }).length, 0);
  assert.strictEqual(harness.timers.timeouts.filter(function (timer) { return timer.active && timer.ms === 1400; }).length, 0);

  harness.document.hidden = true;
  assert.doesNotThrow(function () {
    harness.api.handleVisibilityChange();
    harness.api.handleVisibilityChange();
    harness.api.dispatch('pause', 500);
    harness.api.dispatch('pause', 500);
    harness.api.closeJourneyDialog();
    harness.api.closeJourneyDialog();
  });
  assert.strictEqual(harness.api.snapshot().playerState.deadline, 0);
  assert.strictEqual(harness.timers.intervals.filter(function (timer) { return timer.active; }).length, 0);
});

test('journey CSS exposes focus targets and compact content without overflow masking', function () {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  const journeyCss = css.slice(css.indexOf('/* Directed journeys'), css.indexOf('@keyframes journey-stage-in'));
  assert.strictEqual(/overflow-x:\s*hidden/.test(css), false, 'horizontal overflow is hidden instead of fixed');
  const stageRule = /\.journey-stage\s*\{([^}]*)\}/.exec(journeyCss);
  assert.ok(stageRule, 'missing journey stage rule');
  assert.strictEqual(/overflow(?:-x)?:\s*(?:hidden|clip)/.test(stageRule[1]), false,
    'journey stage masks horizontal content overflow');
  assert.ok(/\.journey-dialog[\s\S]*:focus-visible[\s\S]*outline:\s*3px/.test(journeyCss));
  assert.ok(/\.journey-(?:catalog\s*>\s*h2|stage\s*>\s*h2):focus-visible/.test(css),
    'programmatically focused headings lack a strong visible focus style');
  assert.ok(/\.journey-progress\s*\{[^}]*gap:\s*(?:\.5rem|8px)/s.test(journeyCss),
    'progress targets need an eight-pixel gap');
  assert.ok(/\.journey-progress button\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/s.test(journeyCss),
    'progress controls do not meet the 44px target size');
  ['journey-map-layer', 'journey-stage > h2', 'journey-body', 'journey-controls'].forEach(function (selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
    assert.ok(new RegExp('\\.' + escaped + '[\\s\\S]{0,700}min-width:\\s*0[\\s\\S]{0,700}' +
      'max-inline-size:[\\s\\S]{0,700}overflow-wrap:\\s*anywhere').test(journeyCss),
    selector + ' lacks compact overflow safeguards');
  });
  assert.ok(/@media \(max-width: 390px\)/.test(css));
  const fixedWidths = Array.from(journeyCss.matchAll(/(?:min-|max-)?width:\s*(\d+)px/g))
    .map(function (match) { return Number(match[1]); });
  assert.ok(fixedWidths.every(function (width) { return width <= 390; }), 'journey CSS fixes a width beyond 390px');
});

test('journey launcher styles cannot leak onto the body scroll-lock class', function () {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  const bodyRule = /body\.journey-open\s*\{([^}]*)\}/.exec(css);
  assert.ok(bodyRule, 'missing journey body scroll lock');
  assert.deepStrictEqual(bodyRule[1].split(';').map(function (declaration) {
    return declaration.trim().replace(/\s+/g, ' ');
  }).filter(Boolean), ['overflow: hidden']);
  assert.strictEqual(/(^|})\s*\.journey-open(?=[\s:{])/m.test(css), false,
    'an unscoped launcher selector can style body.journey-open');
  ['.journey-launch .journey-open {', '.journey-launch .journey-open:hover',
    '.journey-launch .journey-open:focus-visible'].forEach(function (selector) {
    assert.ok(css.indexOf(selector) !== -1, 'missing scoped launcher selector ' + selector);
  });
  assert.ok(/@media \(max-width: 620px\)[\s\S]*\.journey-launch \.journey-open\s*\{[^}]*width:\s*100%/s.test(css),
    'mobile launcher width is not scoped to the launcher');
});

test('app controller validates directed journeys and restores their URL state through the manifest', function () {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

  ['PARALLEL_WORLDS_JOURNEYS', 'ParallelWorldsJourney', 'ParallelWorldsJourneyView'].forEach(function (globalName) {
    assert.ok(app.indexOf('window.' + globalName) !== -1, 'missing journey dependency ' + globalName);
  });
  assert.ok(/journey\.validateCollection\(\s*journeysData\s*,\s*rawData\s*\)/.test(app),
    'journey routes are not validated against the canonical corpus');
  assert.ok(/journey:\s*''/.test(app) && /stop:\s*''/.test(app) && /journeyMode:\s*'paused'/.test(app) &&
    /journeyNotice:\s*''/.test(app), 'journey URL defaults are incomplete or unexpectedly autoplay');
  assert.ok(/explorerState\.parse\(\s*params\s*,\s*defaults\s*,\s*rawData\s*,\s*journeysData\s*\)/.test(app),
    'URL parser does not receive the journey manifest');
  ['journey-open', 'journey-dialog', 'journey-exit', 'journey-content', 'journey-announcement'].forEach(function (id) {
    assert.ok(app.indexOf("'" + id + "'") !== -1, 'controller does not collect ' + id);
  });
});

test('app controller delegates journey state and timing to the pure modules', function () {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const intervals = app.match(/setInterval\s*\(/g) || [];

  assert.ok(/journey\.reduce\s*\(/.test(app), 'controller bypasses the journey reducer');
  assert.ok(/journey\.clock\s*\(/.test(app), 'controller bypasses the journey clock');
  assert.ok(/journeyView\.updateClock\s*\(/.test(app), 'clock DOM updates bypass journey-view');
  assert.strictEqual(intervals.length, 2, 'app must own one atlas interval and one journey interval');
  assert.ok(/setInterval\s*\([\s\S]*?,\s*250\s*\)/.test(app), 'journey clock does not tick every 250ms');
  assert.ok(/visibilityHidden/.test(app) && /visibilityVisible/.test(app),
    'visibility lifecycle is not dispatched through the journey reducer');
  assert.ok(/transitionend/.test(app) && /1400/.test(app),
    'journey transitions need an event completion path and bounded fallback');
  assert.ok(/event\s*&&\s*event\.target\s*!==\s*stage/.test(app),
    'bubbled descendant transitions must not advance the journey');
  assert.strictEqual(app.indexOf('fetch('), -1, 'journey controller must remain a static-site runtime');
});

test('app controller syncs journey stops through the existing atlas and persistent live region', function () {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

  assert.ok(/stop\.focusTrackIds\.slice\s*\(\s*\)/.test(app), 'stop focus is not defensively cloned');
  assert.ok(/chronology\.modeRange\s*\(/.test(app), 'stop scale does not use chronology mode ranges');
  assert.ok(/atlas\.buildModel\s*\(/.test(app), 'journey scene does not use the atlas model');
  assert.ok(/atlasView\.worldSvg\s*\(/.test(app), 'journey scene does not reuse the world renderer');
  assert.ok(/atlasView\.renderRegions\s*\(/.test(app), 'journey scene does not reuse region rendering');
  assert.ok(/data-journey-announcement-source/.test(app) && /journey-announcement/.test(app) &&
    /setTimeout\s*\([\s\S]*announcement[\s\S]*textContent/.test(app),
    'stage announcements are not copied asynchronously into the persistent live region');
  assert.ok(/journeyView\.catalogHtml\s*\(/.test(app) && /journeyView\.stageHtml\s*\(/.test(app) &&
    /journeyView\.completeHtml\s*\(/.test(app), 'controller does not use all journey view renderers');
  assert.ok(/journeyCatalogText/.test(app), 'catalog omits the localized introduction');
});

test('journey catalog cards render the bundled world contour through the atlas renderer', function () {
  const harness = makeJourneyControllerHarness();
  harness.dialog.open = false;
  harness.api.setContext({ state: controllerState(), elements: harness.elements });

  harness.api.openCatalog('');

  assert.strictEqual(harness.content.currentCatalogMaps.length, 1,
    'validated journey catalog did not emit exactly one map target');
  const mapHtml = harness.content.currentCatalogMaps[0].innerHTML;
  assert.ok(mapHtml.indexOf('class="atlas-world"') !== -1,
    'catalog card omitted the shared atlas SVG');
  assert.ok(mapHtml.indexOf('class="atlas-land"') !== -1,
    'catalog card omitted the bundled land contour');
  assert.ok(mapHtml.indexOf(worldMapData.landPath.slice(0, 80)) !== -1,
    'catalog card did not use the bundled Natural Earth land path');
});

test('journey catalog scopes its world contour to the card viewport', function () {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.ok(/\.journey-card-map \.atlas-world\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0[^}]*width:\s*100%[^}]*height:\s*100%/s.test(css),
    'catalog atlas SVG does not fill the journey card map');
  assert.ok(/\.journey-card-map \.atlas-land\s*\{[^}]*fill:\s*#[0-9a-f]{3,8}/is.test(css),
    'catalog land contour has no scoped visible fill');
  assert.ok(/\.journey-card-map \.atlas-coast-line\s*\{[^}]*stroke:\s*rgba?\(/s.test(css),
    'catalog coast contour has no scoped visible stroke');
});

test('journey sharing serializes a paused clone without mutating active playback', function () {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const shareFunction = /function shareJourney\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/.exec(app);

  assert.ok(shareFunction, 'missing journey share controller');
  assert.ok(/Object\.assign\(\s*\{\}\s*,\s*state\s*,\s*\{\s*journeyMode:\s*'paused'\s*\}\s*\)/.test(shareFunction[1]),
    'journey share must clone state with paused playback');
  assert.ok(/explorerState\.serialize\(\s*sharedState\s*,\s*defaults\s*\)/.test(shareFunction[1]),
    'journey share does not serialize its paused clone');
  assert.strictEqual(/state\.journeyMode\s*=\s*'paused'/.test(shareFunction[1]), false,
    'journey sharing mutates active state');
  assert.ok(/window\.location\.origin[\s\S]*window\.location\.pathname/.test(shareFunction[1]),
    'journey share does not build a same-page permalink');
});

test('direct journey URLs open only after the ordinary render and never surprise-autoplay', function () {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const init = /function init\(\)\s*\{([\s\S]*?)\n\s*\}/.exec(app);

  assert.ok(init, 'missing application initialization');
  const renderIndex = init[1].indexOf('render();');
  const directIndex = init[1].indexOf('openDirectJourney');
  assert.ok(renderIndex !== -1 && directIndex > renderIndex,
    'direct journeys must open after the ordinary explorer render');
  assert.ok(/function openDirectJourney\([^)]*\)\s*\{[\s\S]*state\.journeyMode\s*===\s*'playing'[\s\S]*startJourney\([^;]+autoplay\s*\)/.test(app),
    'direct journey links must autoplay only when the URL explicitly requests playing mode');
});

test('landing layout explicitly uses the compact atlas-first hero', function () {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.ok(html.indexOf('class="hero hero-compact"') !== -1, 'landing hero is not marked as compact');
  assert.ok(css.indexOf('.hero-compact .hero-grid') !== -1, 'compact hero does not have an explicit layout contract');
});

test('mobile filters use an accessible collapsed disclosure', function () {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.ok(html.indexOf('id="filter-toggle"') !== -1, 'missing mobile filter disclosure');
  assert.ok(html.indexOf('aria-controls="filters-content"') !== -1, 'filter disclosure is not connected to its panel');
  assert.ok(html.indexOf('aria-expanded="false"') !== -1, 'filters should be collapsed initially');
  assert.ok(app.indexOf("setAttribute('aria-expanded'") !== -1, 'filter disclosure state is not synchronized');
});

test('concise Russian and English launch posts derive current corpus counts and language coverage', function () {
  const counts = {
    tracks: data.tracks.length,
    periods: data.tracks.reduce(function (total, track) { return total + (track.periods || []).length; }, 0),
    events: data.tracks.reduce(function (total, track) { return total + (track.events || []).length; }, 0)
  };
  const expected = {
    'launch-ru.md': [
      counts.tracks + ' исторические линии',
      counts.periods + ' периодов',
      counts.events + ' хронологический ориентир',
      'упрощённом китайском'
    ],
    'launch-en.md': [
      counts.tracks + ' historical tracks',
      counts.periods + ' periods',
      counts.events + ' milestones',
      'Simplified Chinese'
    ]
  };
  ['launch-ru.md', 'launch-en.md'].forEach(function (filename) {
    const postPath = path.join(root, 'docs/posts', filename);
    assert.ok(fs.existsSync(postPath), 'missing ' + filename);
    const post = fs.readFileSync(postPath, 'utf8');
    assert.ok(post.indexOf('https://agent-axiom.github.io/parallel-worlds/') !== -1, 'missing site link in ' + filename);
    assert.ok(post.indexOf('https://github.com/agent-axiom/parallel-worlds') !== -1, 'missing repository link in ' + filename);
    expected[filename].forEach(function (marker) {
      assert.ok(post.indexOf(marker) !== -1, filename + ' is stale or omits language coverage: ' + marker);
    });
    assert.strictEqual(new RegExp(counts.tracks + '\\s+(?:цивилизац|civilizations)', 'i').test(post), false,
      filename + ' incorrectly calls every historical track a civilization');
    assert.ok(post.split(/\s+/).length <= 130, filename + ' is not concise');
  });
});

test('language roadmap records evidence-based priorities beyond Chinese', function () {
  const roadmapPath = path.join(root, 'docs', 'LANGUAGE_ROADMAP.md');
  assert.ok(fs.existsSync(roadmapPath), 'missing language roadmap');
  const roadmap = fs.readFileSync(roadmapPath, 'utf8');
  ['Spanish', 'Arabic', 'Portuguese', '10%'].forEach(function (marker) {
    assert.ok(roadmap.indexOf(marker) !== -1, 'missing roadmap marker: ' + marker);
  });
});

console.log('\nAll tests passed (' + passed + ')');
