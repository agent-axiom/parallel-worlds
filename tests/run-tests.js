const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const data = require(path.join(root, 'data.js'));
const academicData = require(path.join(root, 'academic-data.js'));
const quality = require(path.join(root, 'data-quality.js'));
const journey = require(path.join(root, 'journey.js'));
const journeysData = require(path.join(root, 'journeys-data.js'));
const chronology = require(path.join(root, 'chronology.js'));
const timeline = require(path.join(root, 'timeline.js'));
const i18n = require(path.join(root, 'i18n.js'));
const atlas = require(path.join(root, 'atlas.js'));
const atlasData = require(path.join(root, 'atlas-data.js'));
const insights = require(path.join(root, 'insights.js'));
const explorerState = require(path.join(root, 'explorer-state.js'));
const atlasView = require(path.join(root, 'atlas-view.js'));

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
  sparseStops.routes[0].stops = new Array(6);
  const stopResult = journey.validateCollection(sparseStops, data);
  assert.deepStrictEqual(stopResult.routes, []);
  assert.ok(stopResult.issues.some(function (item) { return item.code === 'invalid-journey-id'; }));

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
  const script = path.join(root, 'scripts/build-academic-audit.mjs');
  const output = childProcess.spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(output.status, 0, output.stderr || output.stdout);
  const serialized = fs.readFileSync(path.join(root, 'academic-audit.json'), 'utf8');
  assert.ok(serialized.endsWith('\n'));
  assert.deepStrictEqual(JSON.parse(serialized), require(path.join(root, 'academic-audit.js')).buildAudit(data, journeysData));
});

test('academic data shell and source URL validation are explicit', function () {
  assert.ok(Array.isArray(academicData.tracks));
  assert.ok(academicData.tracks.some(function (track) { return track.id === 'uruk'; }));
  assert.ok(academicData.patches && academicData.patches.china && academicData.patches.korea && academicData.patches.sumer);
  assert.strictEqual(academicData.scale.breakpoint, -3500);
  assert.strictEqual(quality.isGenericHomepage('https://www.metmuseum.org/'), true);
  assert.strictEqual(quality.isGenericHomepage('https://www.metmuseum.org/essays/uruk-the-first-city'), false);
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

test('concise Russian and English launch posts include public links', function () {
  ['launch-ru.md', 'launch-en.md'].forEach(function (filename) {
    const postPath = path.join(root, 'docs/posts', filename);
    assert.ok(fs.existsSync(postPath), 'missing ' + filename);
    const post = fs.readFileSync(postPath, 'utf8');
    assert.ok(post.indexOf('https://agent-axiom.github.io/parallel-worlds/') !== -1, 'missing site link in ' + filename);
    assert.ok(post.indexOf('https://github.com/agent-axiom/parallel-worlds') !== -1, 'missing repository link in ' + filename);
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
