# Hardcover Gift Edition Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic publishing-data foundation for the hardcover edition: twelve audited time windows, a rights-aware media registry, stable QR routes, and an accessible trilingual web-companion entry point.

**Architecture:** Keep the edition, media, companion routing, and audit concerns in separate dependency-free UMD/CommonJS modules so the browser, Node tests, and build scripts consume the same canonical data. Generate deterministic audit and QR-route artifacts from those modules; integrate only a compact companion banner into the existing atlas, leaving full editorial layouts and print production to later plans.

**Tech Stack:** Vanilla JavaScript (UMD + CommonJS), Node.js build scripts, the existing `tests/run-tests.js` harness, Bash validation, static HTML/CSS, GitHub Pages.

---

## 1. Program boundary

The approved specification contains three independently testable releases. This plan implements only Release A.

| Release | Deliverable | Gate to start |
|---|---|---|
| **A — Publishing foundation** | audited window manifest, media schema, deterministic audit, stable QR routes, accessible companion banner | approved design specification |
| **B — Test chapter** | one complete 16-page chapter using real cleared images, one bound material dummy, corresponding web gallery | Release A passes; image budget and rights authority approved |
| **C — Full edition** | all 288 pages, complete media library, prepress package, proofing and 500+ copy production | Release B physical and editorial prototype approved |

Release B and Release C receive their own implementation plans after their preceding gate. No image purchase, domain purchase, printer order, or external message is authorized by this plan.

## 2. File structure

### Create

- `edition-data.js` — canonical physical specification, page plan, twelve windows, and eight interludes.
- `edition.js` — strict manifest validation, historical-window lookup, and academic readiness analysis.
- `media-data.js` — canonical public-safe media registry; starts empty until assets are separately cleared.
- `media-registry.js` — strict rights, provenance, localization, master, and derivative validation.
- `edition-audit.js` — combines edition, academic, media, and route checks into one deterministic report.
- `edition-audit.json` — committed deterministic readiness snapshot.
- `companion.js` — creates stable internal companion routes and safe static redirect documents.
- `companion-routes.json` — committed deterministic route manifest.
- `edition-view.js` — pure accessible companion-banner HTML rendering.
- `scripts/build-edition-audit.mjs` — regenerates `edition-audit.json`.
- `scripts/build-companion-routes.mjs` — generates or checks the static `go/` route tree.
- `docs/edition-method.md` — contributor and release-gate documentation.
- `go/window-01/index.html` through `go/window-12/index.html` — generated, stable QR entry pages.

### Modify

- `explorer-state.js` — parse and serialize `editionWindow` without weakening existing journey-state handling.
- `index.html` — add the companion banner shell and load the new static modules in dependency order.
- `app.js` — resolve direct edition links after normal atlas rendering and support closing the banner.
- `i18n.js` — add RU/EN/ZH companion labels.
- `styles.css` — responsive, print-inspired banner styling with visible focus and no page overflow.
- `tests/run-tests.js` — unit, integration, build, accessibility, and deployment assertions.
- `scripts/validate.sh` — syntax checks, deterministic audit freshness, QR-route freshness, and asset coverage.
- `.github/workflows/deploy-pages.yml` — publish the new modules, snapshots, and generated `go/` directory.
- `README.md` — explain the edition foundation and commands without claiming that the book is production-ready.

## 3. Invariants

- The canonical edition has exactly 12 windows, 8 interludes, and 288 interior pages.
- Every anchor is a non-zero historical integer and matches the approved list.
- Readiness is calculated from `data.js`; the edition manifest cannot copy historical facts into a second source of truth.
- A window is editorially ready only when at least 6 active `reviewed` tracks cover at least 3 regions and every selected record has exact registered sources.
- Structural errors block CI. Missing editorial coverage and missing media are readiness gaps, not CI failures during Release A.
- The canonical media registry may be empty. Fabricated licenses or invented image records are forbidden.
- Production QR codes eventually require a publisher-controlled domain, but Release A generates host-independent `/go/.../` paths and tests them on GitHub Pages.
- Direct companion URLs are passive: they never start animation or a directed journey.
- The book companion enhances the atlas but never hides canonical evidence or turns a reconstruction into evidence.

### Task 1: Canonical edition manifest and validation

**Files:**
- Create: `edition-data.js`
- Create: `edition.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Add failing manifest tests**

At the imports near the top of `tests/run-tests.js`, add:

```js
const edition = require(path.join(root, 'edition.js'));
const editionData = require(path.join(root, 'edition-data.js'));
```

Add these tests before the existing academic-audit tests:

```js
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

test('edition manifest validation rejects unsafe ids, year zero, duplicate routes and bad page math', function () {
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

test('edition validation ignores inherited collection entries and never throws on malformed input', function () {
  assert.doesNotThrow(function () { edition.validateManifest(null); });
  const inherited = Object.create({ windows: editionData.windows });
  inherited.version = 1;
  assert.ok(edition.validateManifest(inherited).issues.some(function (issue) {
    return issue.code === 'invalid-windows';
  }));
  const accessor = {};
  Object.defineProperty(accessor, 'windows', { get: function () { throw new Error('windows getter called'); } });
  assert.doesNotThrow(function () { edition.validateManifest(accessor); });
});
```

- [ ] **Step 2: Run the tests and verify the module-not-found failure**

Run:

```bash
npm test
```

Expected: FAIL with `Cannot find module 'edition.js'`.

- [ ] **Step 3: Create the canonical manifest**

Create `edition-data.js` as a UMD/CommonJS data module. Use this exact canonical structure and copy:

```js
(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.PARALLEL_WORLDS_EDITION_DATA = data;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function copy(ruTitle, ruQuestion, enTitle, enQuestion, zhTitle, zhQuestion) {
    return {
      ru: { title: ruTitle, question: ruQuestion },
      en: { title: enTitle, question: enQuestion },
      zh: { title: zhTitle, question: zhQuestion }
    };
  }

  var windows = [
    ['window-01', -18000, 'window-01', copy('Миры ледникового времени', 'Что уже существовало задолго до городов?', 'Worlds of the Ice Age', 'What already existed long before cities?', '冰期世界', '在城市出现很久以前，哪些社会已经存在？')],
    ['window-02', -9500, 'window-02', copy('Монументы до городов', 'Что меняется, когда люди собираются вместе?', 'Monuments before cities', 'What changes when people gather?', '城市之前的纪念性建筑', '当人们聚集时，会发生什么变化？')],
    ['window-03', -6500, 'window-03', copy('Оседлые ландшафты', 'Сколько разных путей ведёт к жизни на одном месте?', 'Settled landscapes', 'How many paths lead to living in one place?', '定居景观', '通往定居生活的道路有多少种？')],
    ['window-04', -3500, 'window-04', copy('Города, реки и управление', 'Когда плотность превращается в городской мир?', 'Cities, rivers, and administration', 'When does density become an urban world?', '城市、河流与治理', '人口密度何时转化为城市世界？')],
    ['window-05', -2500, 'window-05', copy('Монументальные общества', 'Как власть становится видимой в материале?', 'Monumental societies', 'How does power become visible in material form?', '纪念性社会', '权力如何在物质形态中变得可见？')],
    ['window-06', -1200, 'window-06', copy('После бронзового века', 'Почему одни системы распадаются, а другие продолжаются?', 'After the Bronze Age', 'Why do some systems fragment while others continue?', '青铜时代之后', '为什么有些体系瓦解，而另一些延续？')],
    ['window-07', -500, 'window-07', copy('Миры спора и учения', 'Почему новые политические и философские языки возникают одновременно?', 'Worlds of debate and teaching', 'Why do new political and philosophical languages emerge at the same time?', '论辩与思想的世界', '新的政治与哲学语言为何同时出现？')],
    ['window-08', 200, 'window-08', copy('Связанные империи', 'Что соединяет огромные пространства без единого центра?', 'Connected empires', 'What connects vast spaces without a single center?', '相连的帝国', '没有单一中心，广阔空间如何彼此连接？')],
    ['window-09', 650, 'window-09', copy('Новые религиозные географии', 'Как верования меняют карты принадлежности?', 'New religious geographies', 'How do beliefs redraw maps of belonging?', '新的宗教地理', '信仰如何重塑归属的地图？')],
    ['window-10', 1000, 'window-10', copy('Сети первого тысячелетия', 'Как знания и товары проходят через множество границ?', 'Networks at the millennium', 'How do knowledge and goods cross many boundaries?', '千年之际的网络', '知识与商品如何穿越多重边界？')],
    ['window-11', 1250, 'window-11', copy('Континенты в движении', 'Как мобильность перестраивает далёкие общества?', 'Continents in motion', 'How does mobility reshape distant societies?', '流动中的大陆', '流动性如何重塑遥远的社会？')],
    ['window-12', 1450, 'window-12', copy('Мир перед новым соединением', 'Какие сложные миры существовали накануне атлантического перелома?', 'A world before new convergence', 'What complex worlds existed on the eve of the Atlantic rupture?', '新汇合之前的世界', '大西洋转折前夕存在哪些复杂世界？')]
  ].map(function (entry) {
    return {
      id: entry[0], anchorYear: entry[1], companionPath: entry[2], chapterPages: 16,
      requirements: { reviewedTracks: 6, regions: 3 }, copy: entry[3]
    };
  });

  var interludeIds = [
    'settlement', 'domestication', 'cities', 'writing',
    'belief', 'trade-networks', 'empires-law', 'knowledge-transfer'
  ];

  return {
    version: 1,
    id: 'hardcover-ru-first-edition',
    format: { widthMm: 300, heightMm: 240, orientation: 'landscape', language: 'ru' },
    printRun: { minimum: 500, quoteQuantities: [500, 750, 1000] },
    pagePlan: { opening: 16, windows: 192, interludes: 32, apparatus: 48, total: 288 },
    windows: windows,
    interludes: interludeIds.map(function (id) { return { id: id, pages: 4 }; })
  };
}));
```

- [ ] **Step 4: Implement strict manifest validation**

Create `edition.js` as a UMD module receiving `ParallelWorldsChronology` in the browser and `require('./chronology.js')` in Node. Implement and export:

```js
function validateManifest(manifest) {
  var issues = [];
  function add(code, path, message) { issues.push({ code: code, path: path, message: message }); }
  if (!manifest || typeof manifest !== 'object') {
    add('invalid-manifest', '', 'Edition manifest must be an object');
    return { issues: issues, windows: [] };
  }
  var rawWindows = ownValue(manifest, 'windows');
  var windows = Array.isArray(rawWindows)
    ? rawWindows.filter(function (_, index) { return own(rawWindows, index); })
    : [];
  if (!Array.isArray(rawWindows)) {
    add('invalid-windows', 'windows', 'Edition windows must be an own array');
  }
  var ids = Object.create(null);
  var paths = Object.create(null);
  windows.forEach(function (window, index) {
    var base = 'windows[' + index + ']';
    if (!window || typeof window !== 'object') return add('invalid-window', base, 'Window must be an object');
    var id = ownValue(window, 'id');
    var anchorYear = ownValue(window, 'anchorYear');
    var companionPath = ownValue(window, 'companionPath');
    var copy = ownValue(window, 'copy');
    if (typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      add('invalid-id', base + '.id', 'Window id must be a safe slug');
    } else if (ids[id]) add('duplicate-id', base + '.id', 'Window id must be unique');
    else ids[id] = true;
    if (!chronology.isValidHistoricalYear(anchorYear)) {
      add('invalid-anchor-year', base + '.anchorYear', 'Anchor must be a non-zero historical integer');
    }
    if (typeof companionPath !== 'string' || !/^window-[0-9]{2}$/.test(companionPath)) {
      add('invalid-companion-path', base + '.companionPath', 'Companion path must match window-NN');
    } else if (paths[companionPath]) {
      add('duplicate-companion-path', base + '.companionPath', 'Companion path must be unique');
    } else paths[companionPath] = true;
    if (ownValue(window, 'chapterPages') !== 16) add('invalid-chapter-pages', base + '.chapterPages', 'Every window is 16 pages');
    ['ru', 'en', 'zh'].forEach(function (locale) {
      var localized = ownValue(copy, locale);
      var title = ownValue(localized, 'title');
      var question = ownValue(localized, 'question');
      if (typeof title !== 'string' || !title.trim() || typeof question !== 'string' || !question.trim()) {
        add('missing-window-copy', base + '.copy.' + locale, 'Window title and question are required');
      }
    });
  });
  var pagePlan = ownValue(manifest, 'pagePlan') || {};
  var computed = Number(ownValue(pagePlan, 'opening')) + Number(ownValue(pagePlan, 'windows')) +
    Number(ownValue(pagePlan, 'interludes')) + Number(ownValue(pagePlan, 'apparatus'));
  if (computed !== 288 || ownValue(pagePlan, 'total') !== 288 || ownValue(pagePlan, 'windows') !== windows.length * 16) {
    add('page-plan-mismatch', 'pagePlan', 'Page plan must resolve to 288 pages');
  }
  if (windows.length !== 12) add('window-count', 'windows', 'Edition must contain exactly 12 windows');
  var format = ownValue(manifest, 'format') || {};
  if (ownValue(format, 'widthMm') !== 300 || ownValue(format, 'heightMm') !== 240 ||
      ownValue(format, 'orientation') !== 'landscape' || ownValue(format, 'language') !== 'ru') {
    add('invalid-format', 'format', 'Edition format must remain 300 × 240 mm, landscape, Russian');
  }
  var rawInterludes = ownValue(manifest, 'interludes');
  var interludes = Array.isArray(rawInterludes) ? rawInterludes.filter(function (_, index) { return own(rawInterludes, index); }) : [];
  if (interludes.length !== 8 || interludes.some(function (interlude) { return !interlude || ownValue(interlude, 'pages') !== 4; })) {
    add('interlude-count', 'interludes', 'Edition must contain eight four-page interludes');
  }
  var printRun = ownValue(manifest, 'printRun') || {};
  var quoteQuantities = ownValue(printRun, 'quoteQuantities');
  if (!Number.isInteger(ownValue(printRun, 'minimum')) || ownValue(printRun, 'minimum') < 500 ||
      !Array.isArray(quoteQuantities) || quoteQuantities.length !== 3 ||
      ownValue(quoteQuantities, 0) !== 500 || ownValue(quoteQuantities, 1) !== 750 || ownValue(quoteQuantities, 2) !== 1000) {
    add('invalid-print-run', 'printRun', 'Print quotations must cover 500, 750, and 1000 copies');
  }
  return { issues: issues, windows: issues.length ? [] : windows.slice() };
}
```

Define these helpers before `validateManifest`:

```js
function own(value, key) {
  return !!value && Object.prototype.hasOwnProperty.call(value, key);
}

function ownValue(value, key) {
  if (!value || typeof value !== 'object') return undefined;
  var descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(value, key); } catch (_) { return undefined; }
  return descriptor && own(descriptor, 'value') ? descriptor.value : undefined;
}
```

Return the API as `{ validateManifest: validateManifest }`.

- [ ] **Step 5: Run the focused suite and commit**

Run `npm test`. Expected: all tests pass with three new edition tests.

Commit:

```bash
git add edition-data.js edition.js tests/run-tests.js
git commit -m "feat: define hardcover edition manifest"
```

### Task 2: Academic readiness for twelve windows

**Files:**
- Modify: `edition.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Add failing readiness tests**

Add fixtures that include reviewed and legacy tracks active at one anchor:

```js
test('edition readiness reports reviewed active tracks, regions and exact-source coverage', function () {
  const fixtureData = {
    sources: {
      exact: { tier: 'A', kind: 'peer-reviewed-article', title: 'Exact', url: 'https://doi.org/10.1/example' }
    },
    tracks: [
      { id: 'a', region: 'africa', reviewStatus: 'reviewed', periods: [
        { id: 'a-period', start: -600, end: -400, sourceIds: ['exact'],
          dating: { basis: 'radiocarbon', precision: 'range', original: '600–400 BCE' } }
      ], events: [] },
      { id: 'b', region: 'east-asia', reviewStatus: 'legacy', periods: [
        { id: 'b-period', start: -600, end: -400, sourceIds: ['exact'] }
      ], events: [] }
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
```

- [ ] **Step 2: Verify the missing-function failure**

Run `npm test`. Expected: FAIL because `buildReadiness` is not exported.

- [ ] **Step 3: Implement historical containment and readiness**

Add these pure functions to `edition.js`:

```js
function activeAt(record, year) {
  if (!record || !own(record, 'start') || !own(record, 'end')) return false;
  if (!chronology.isValidHistoricalYear(record.start) || !chronology.isValidHistoricalYear(record.end)) return false;
  var target = chronology.toOrdinal(year);
  return chronology.toOrdinal(record.start) <= target && target <= chronology.toOrdinal(record.end);
}

function exactRecord(record, sources) {
  if (!record || !Array.isArray(record.sourceIds) || !record.sourceIds.length) return false;
  if (!record.dating || typeof record.dating.basis !== 'string' || typeof record.dating.precision !== 'string' ||
      typeof record.dating.original !== 'string' || !record.dating.original.trim()) return false;
  return record.sourceIds.every(function (sourceId) {
    var source = own(sources, sourceId) && sources[sourceId];
    return source && typeof source.url === 'string' && /^https:\/\//.test(source.url) &&
      typeof source.title === 'string' && source.title.trim() && ['A', 'B'].indexOf(source.tier) !== -1;
  });
}

function buildReadiness(manifest, dataset) {
  var windows = manifest && own(manifest, 'windows') && Array.isArray(manifest.windows) ? manifest.windows : [];
  var tracks = dataset && own(dataset, 'tracks') && Array.isArray(dataset.tracks) ? dataset.tracks : [];
  var sources = dataset && own(dataset, 'sources') && dataset.sources || {};
  return {
    windows: windows.filter(function (_, index) { return own(windows, index); }).map(function (window) {
      var active = tracks.filter(function (track, index) {
        return own(tracks, index) && track && Array.isArray(track.periods) &&
          track.periods.some(function (period, periodIndex) {
            return own(track.periods, periodIndex) && activeAt(period, window.anchorYear);
          });
      });
      var reviewed = active.filter(function (track) {
        return track.reviewStatus === 'reviewed' && track.periods.some(function (period) {
          return activeAt(period, window.anchorYear) && exactRecord(period, sources);
        });
      });
      var reviewedIds = reviewed.map(function (track) { return track.id; }).filter(Boolean).sort();
      var legacyIds = active.filter(function (track) { return track.reviewStatus !== 'reviewed'; })
        .map(function (track) { return track.id; }).filter(Boolean).sort();
      var regions = reviewed.map(function (track) { return track.region; }).filter(Boolean)
        .filter(function (region, index, values) { return values.indexOf(region) === index; }).sort();
      var neededTracks = window.requirements && window.requirements.reviewedTracks || 6;
      var neededRegions = window.requirements && window.requirements.regions || 3;
      var gaps = [];
      if (reviewedIds.length < neededTracks) gaps.push('reviewed-tracks:' + reviewedIds.length + '/' + neededTracks);
      if (regions.length < neededRegions) gaps.push('regions:' + regions.length + '/' + neededRegions);
      return {
        id: window.id, anchorYear: window.anchorYear, status: gaps.length ? 'needs-review' : 'ready',
        reviewedTrackIds: reviewedIds, legacyTrackIds: legacyIds, regions: regions, gaps: gaps
      };
    })
  };
}
```

Export `buildReadiness` alongside `validateManifest`.

- [ ] **Step 4: Run tests and commit**

Run `npm test`. Expected: PASS.

```bash
git add edition.js tests/run-tests.js
git commit -m "feat: audit edition window readiness"
```

### Task 3: Rights-aware media registry

**Files:**
- Create: `media-data.js`
- Create: `media-registry.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Add failing registry tests**

Import the modules, then add:

```js
test('canonical edition media registry starts empty rather than inventing image rights', function () {
  const mediaData = require(path.join(root, 'media-data.js'));
  const mediaRegistry = require(path.join(root, 'media-registry.js'));
  assert.deepStrictEqual(mediaData, { version: 1, entries: [] });
  assert.deepStrictEqual(mediaRegistry.validateRegistry(mediaData).issues, []);
});

test('media registry accepts a fully cleared trilingual documentary image', function () {
  const mediaRegistry = require(path.join(root, 'media-registry.js'));
  const fixture = { version: 1, entries: [{
    id: 'object-example', kind: 'source', academicRefs: ['track.period'],
    copy: {
      ru: { caption: 'Предмет', alt: 'Краткое описание предмета' },
      en: { caption: 'Object', alt: 'A concise description of the object' },
      zh: { caption: '器物', alt: '器物的简要说明' }
    },
    provenance: { creator: 'Museum', owner: 'Museum', sourceUrl: 'https://example.org/object', credit: 'Museum' },
    rights: {
      print: { status: 'cleared', maxCopies: 1000, territory: 'worldwide', expiresOn: '2036-07-18' },
      web: { status: 'cleared', territory: 'worldwide', expiresOn: '2036-07-18' }
    },
    master: { ref: 'private://object-example.tif', sha256: 'a'.repeat(64) },
    derivatives: { web: { avif: 'assets/media/object-example.avif', webp: 'assets/media/object-example.webp', fallback: 'assets/media/object-example.jpg' } },
    reconstruction: { isReconstruction: false, basis: '' },
    links: [{ windowId: 'window-04', role: 'object' }]
  }] };
  assert.deepStrictEqual(mediaRegistry.validateRegistry(fixture).issues, []);
});

test('media registry blocks unclear rights, missing alt text, weak hashes and ungrounded reconstruction', function () {
  const mediaRegistry = require(path.join(root, 'media-registry.js'));
  const broken = { version: 1, entries: [{
    id: 'broken', kind: 'reconstruction', academicRefs: [], copy: { ru: {}, en: {}, zh: {} },
    provenance: { creator: '', owner: '', sourceUrl: 'javascript:alert(1)', credit: '' },
    rights: { print: { status: 'candidate' }, web: { status: 'candidate' } },
    master: { ref: '', sha256: 'abc' }, derivatives: { web: {} },
    reconstruction: { isReconstruction: true, basis: '' }, links: []
  }] };
  const codes = mediaRegistry.validateRegistry(broken).issues.map(function (issue) { return issue.code; });
  [
    'missing-copy', 'invalid-source-url', 'uncleared-rights', 'invalid-master',
    'missing-basis', 'missing-academic-ref', 'invalid-derivatives'
  ].forEach(function (code) {
    assert.ok(codes.indexOf(code) !== -1, 'missing ' + code);
  });
});
```

- [ ] **Step 2: Verify failure**

Run `npm test`. Expected: FAIL because both media modules are absent.

- [ ] **Step 3: Create the intentionally empty canonical registry**

Create `media-data.js`:

```js
(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.PARALLEL_WORLDS_MEDIA_DATA = data;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return { version: 1, entries: [] };
}));
```

- [ ] **Step 4: Implement strict registry validation**

Create `media-registry.js` as a UMD/CommonJS module. Export `validateRegistry`. It must:

```js
var SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var KINDS = ['source', 'map', 'infographic', 'reconstruction'];
var LOCALES = ['ru', 'en', 'zh'];
var ROLES = ['hero', 'object', 'comparison', 'interlude'];

function validateEntry(entry, index, ids, issues) {
  var path = 'entries[' + index + ']';
  function add(code, suffix, message) {
    issues.push({ code: code, path: path + suffix, message: message });
  }
  if (!entry || typeof entry !== 'object') return add('invalid-entry', '', 'Media entry must be an object');
  if (!Object.prototype.hasOwnProperty.call(entry, 'id') || !SAFE_ID.test(entry.id)) add('invalid-id', '.id', 'Media id must be a safe slug');
  else if (ids[entry.id]) add('duplicate-id', '.id', 'Media id must be unique');
  else ids[entry.id] = true;
  if (KINDS.indexOf(entry.kind) === -1) add('invalid-kind', '.kind', 'Media kind is not supported');
  LOCALES.forEach(function (locale) {
    var localized = entry.copy && Object.prototype.hasOwnProperty.call(entry.copy, locale) && entry.copy[locale];
    if (!localized || typeof localized.caption !== 'string' || !localized.caption.trim() ||
        typeof localized.alt !== 'string' || !localized.alt.trim()) add('missing-copy', '.copy.' + locale, 'Caption and alt are required');
  });
  if (!entry.provenance || !/^https:\/\//.test(String(entry.provenance.sourceUrl || ''))) add('invalid-source-url', '.provenance.sourceUrl', 'HTTPS provenance URL required');
  ['creator', 'owner', 'credit'].forEach(function (field) {
    if (!entry.provenance || typeof entry.provenance[field] !== 'string' || !entry.provenance[field].trim()) add('missing-provenance', '.provenance.' + field, 'Provenance field required');
  });
  var print = entry.rights && entry.rights.print;
  var web = entry.rights && entry.rights.web;
  if (!print || print.status !== 'cleared' || !Number.isInteger(print.maxCopies) || print.maxCopies < 500 ||
      typeof print.territory !== 'string' || !print.territory || !/^\d{4}-\d{2}-\d{2}$/.test(String(print.expiresOn || '')) ||
      !web || web.status !== 'cleared' || typeof web.territory !== 'string' || !web.territory ||
      !/^\d{4}-\d{2}-\d{2}$/.test(String(web.expiresOn || ''))) add('uncleared-rights', '.rights', 'Print and web rights must be cleared');
  if (!entry.master || typeof entry.master.ref !== 'string' || !entry.master.ref ||
      typeof entry.master.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.master.sha256)) add('invalid-master', '.master', 'Opaque master ref and SHA-256 required');
  if (!Array.isArray(entry.academicRefs) || !entry.academicRefs.length || entry.academicRefs.some(function (ref) {
    return typeof ref !== 'string' || !/^[a-z0-9_-]+\.[a-z0-9_-]+$/.test(ref);
  })) add('missing-academic-ref', '.academicRefs', 'At least one canonical track.record reference is required');
  var webFiles = entry.derivatives && entry.derivatives.web;
  if (!webFiles || ['avif', 'webp', 'fallback'].some(function (format) {
    return typeof webFiles[format] !== 'string' || !/^assets\/media\/[a-z0-9][a-z0-9._-]+$/.test(webFiles[format]);
  })) add('invalid-derivatives', '.derivatives.web', 'Safe local AVIF, WebP, and fallback paths are required');
  if (entry.kind === 'reconstruction' && (!entry.reconstruction || entry.reconstruction.isReconstruction !== true ||
      typeof entry.reconstruction.basis !== 'string' || !entry.reconstruction.basis.trim())) add('missing-basis', '.reconstruction', 'Reconstruction basis required');
  if (!Array.isArray(entry.links) || !entry.links.length) add('invalid-link', '.links', 'At least one edition link is required');
  if (Array.isArray(entry.links)) entry.links.forEach(function (link, linkIndex) {
    if (!link || !/^window-[0-9]{2}$/.test(link.windowId) || ROLES.indexOf(link.role) === -1) add('invalid-link', '.links[' + linkIndex + ']', 'Window and role required');
  });
}
```

`validateRegistry` must reject inherited `entries`, sparse arrays, accessors, and duplicate IDs without throwing. It returns `{ issues, entries }`, where `entries` is populated only when there are no issues.

- [ ] **Step 5: Run tests and commit**

Run `npm test`. Expected: PASS.

```bash
git add media-data.js media-registry.js tests/run-tests.js
git commit -m "feat: validate edition media rights"
```

### Task 4: Deterministic edition audit

**Files:**
- Create: `edition-audit.js`
- Create: `edition-audit.json`
- Create: `scripts/build-edition-audit.mjs`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Add failing audit tests**

```js
const editionAudit = require(path.join(root, 'edition-audit.js'));
const mediaData = require(path.join(root, 'media-data.js'));

test('edition audit is deterministic and distinguishes blockers from readiness gaps', function () {
  const first = editionAudit.buildAudit(data, editionData, mediaData);
  const second = editionAudit.buildAudit(data, editionData, mediaData);
  assert.deepStrictEqual(first, second);
  assert.strictEqual(first.summary.windows, 12);
  assert.strictEqual(first.summary.mediaEntries, 0);
  assert.strictEqual(first.summary.blockingIssues, 0);
  assert.strictEqual(first.summary.releaseReady, false);
  assert.ok(first.summary.readinessGaps > 0);
});

test('edition audit build script serializes the canonical deterministic report', function () {
  const artifact = path.join(root, 'edition-audit.json');
  const committed = fs.existsSync(artifact) ? fs.readFileSync(artifact, 'utf8') : '';
  childProcess.execFileSync(process.execPath, [path.join(root, 'scripts/build-edition-audit.mjs')], { cwd: root });
  const expected = JSON.stringify(editionAudit.buildAudit(data, editionData, mediaData), null, 2) + '\n';
  assert.strictEqual(fs.readFileSync(artifact, 'utf8'), expected);
  if (committed) fs.writeFileSync(artifact, committed);
});
```

- [ ] **Step 2: Verify failure**

Run `npm test`. Expected: FAIL because `edition-audit.js` does not exist.

- [ ] **Step 3: Implement audit composition**

Create `edition-audit.js` as a UMD/CommonJS module depending on `edition.js` and `media-registry.js`. `buildAudit(dataset, manifest, registry)` must:

```js
function blocking(scope) {
  return function (issue) {
    return {
      severity: 'error',
      code: scope + '-' + issue.code,
      path: scope + (issue.path ? '.' + issue.path : ''),
      message: issue.message
    };
  };
}

var manifestResult = edition.validateManifest(manifest);
var mediaResult = mediaRegistry.validateRegistry(registry);
var readiness = manifestResult.issues.length ? { windows: [] } : edition.buildReadiness(manifest, dataset);
var acceptedMedia = mediaResult.issues.length ? [] : mediaResult.entries;
var issues = manifestResult.issues.map(blocking('edition'))
  .concat(mediaResult.issues.map(blocking('media')));

readiness.windows.forEach(function (window) {
  window.gaps.forEach(function (gap) {
    issues.push({ severity: 'warning', code: 'window-readiness', path: 'windows.' + window.id, message: gap });
  });
  ['hero', 'object'].forEach(function (role) {
    var found = acceptedMedia.some(function (entry) {
      return entry.links.some(function (link) { return link.windowId === window.id && link.role === role; });
    });
    if (!found) issues.push({ severity: 'warning', code: 'missing-media-slot', path: 'windows.' + window.id + '.' + role, message: 'Cleared media slot is empty' });
  });
});
```

Sort issues by severity, code, and path. Return `generatedFrom: 'parallel-worlds-hardcover-v1'`, the physical/page plan summary, window readiness, public media summary, issues, and:

```js
summary: {
  windows: readiness.windows.length,
  readyWindows: readiness.windows.filter(function (window) { return window.status === 'ready'; }).length,
  mediaEntries: acceptedMedia.length,
  blockingIssues: issues.filter(function (issue) { return issue.severity === 'error'; }).length,
  readinessGaps: issues.filter(function (issue) { return issue.severity === 'warning'; }).length,
  releaseReady: issues.length === 0 && readiness.windows.length === 12
}
```

- [ ] **Step 4: Add deterministic builder and generate snapshot**

Create `scripts/build-edition-audit.mjs` following `scripts/build-academic-audit.mjs` and requiring `data.js`, `edition-data.js`, `media-data.js`, and `edition-audit.js`. Write exactly `JSON.stringify(report, null, 2) + '\n'` to `edition-audit.json`.

Run:

```bash
node scripts/build-edition-audit.mjs
npm test
```

Expected: `edition-audit.json` exists; all tests pass; `releaseReady` is `false` without any structural blocker.

- [ ] **Step 5: Commit**

```bash
git add edition-audit.js edition-audit.json scripts/build-edition-audit.mjs tests/run-tests.js
git commit -m "feat: publish edition readiness audit"
```

### Task 5: Stable generated companion routes

**Files:**
- Create: `companion.js`
- Create: `companion-routes.json`
- Create: `scripts/build-companion-routes.mjs`
- Create: `go/window-01/index.html` through `go/window-12/index.html`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Add failing route and rendering tests**

```js
const companion = require(path.join(root, 'companion.js'));

test('companion route manifest has one safe stable route per edition window', function () {
  const routes = companion.buildRoutes(editionData, { version: 1, entries: [] });
  assert.strictEqual(routes.length, 12);
  assert.deepStrictEqual(routes.map(function (route) { return route.path; }),
    editionData.windows.map(function (window) { return 'go/' + window.companionPath + '/'; }));
  routes.forEach(function (route) {
    assert.ok(/^go\/window-[0-9]{2}\/$/.test(route.path));
    assert.ok(/^\?lang=ru&editionWindow=window-[0-9]{2}$/.test(route.target));
  });
});

test('companion redirect HTML is internal, escaped and usable without JavaScript', function () {
  const html = companion.renderRedirect({ path: 'go/window-04/', target: '?lang=ru&editionWindow=window-04' });
  assert.ok(html.indexOf('http-equiv="refresh"') !== -1);
  assert.ok(html.indexOf('<a href="../../?lang=ru&amp;editionWindow=window-04">') !== -1);
  assert.strictEqual(html.indexOf('https://'), -1);
  assert.strictEqual(html.indexOf('<script src='), -1);
});

test('companion route builder rejects unsafe paths and external targets', function () {
  assert.throws(function () { companion.renderRedirect({ path: '../bad/', target: 'https://evil.example/' }); });
});
```

- [ ] **Step 2: Verify failure**

Run `npm test`. Expected: FAIL because `companion.js` is absent.

- [ ] **Step 3: Implement route generation and safe HTML**

Create `companion.js` as a UMD/CommonJS pure module. Export:

```js
function buildRoutes(manifest, registry) {
  var windows = manifest && Array.isArray(manifest.windows) ? manifest.windows : [];
  var routes = windows.map(function (window) {
    return {
      id: window.id,
      kind: 'window',
      path: 'go/' + window.companionPath + '/',
      target: '?lang=ru&editionWindow=' + encodeURIComponent(window.id)
    };
  });
  (registry && Array.isArray(registry.entries) ? registry.entries : []).forEach(function (entry) {
    entry.links.forEach(function (link) {
      routes.push({
        id: entry.id, kind: 'media',
        path: 'go/' + link.windowId + '/' + entry.id + '/',
        target: '?lang=ru&editionWindow=' + encodeURIComponent(link.windowId) + '&editionMedia=' + encodeURIComponent(entry.id)
      });
    });
  });
  routes.sort(function (left, right) { return left.path.localeCompare(right.path); });
  var seen = Object.create(null);
  routes.forEach(function (route) {
    if (seen[route.path]) throw new RangeError('Duplicate companion route');
    seen[route.path] = true;
  });
  return routes;
}

function renderRedirect(route) {
  if (!route || !/^go\/(?:window-[0-9]{2})(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?\/$/.test(route.path) ||
      !/^\?lang=ru&editionWindow=window-[0-9]{2}(?:&editionMedia=[a-z0-9]+(?:-[a-z0-9]+)*)?$/.test(route.target)) {
    throw new RangeError('Unsafe companion route');
  }
  var depth = route.path.split('/').filter(Boolean).length;
  var relativeRoot = new Array(depth + 1).join('../');
  var href = relativeRoot + route.target;
  var escapedHref = href.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return '<!doctype html>\n<html lang="ru"><head><meta charset="utf-8">' +
    '<meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=' + escapedHref + '">' +
    '<title>Параллельные миры</title></head><body><p><a href="' + escapedHref + '">' +
    'Открыть цифровое сопровождение книги</a></p></body></html>\n';
}
```

Reject duplicates after sorting before returning routes.

- [ ] **Step 4: Create generator with write and `--check` modes**

Create `scripts/build-companion-routes.mjs`. It must:

- build routes from canonical edition/media data;
- render `companion-routes.json` deterministically;
- write each HTML file under `go/` in normal mode;
- in `--check` mode, compare every expected file and fail on missing, changed, or extra generated route files without writing;
- never delete paths outside `go/window-*`;
- never follow symlinks inside `go/`.

Use this complete build/check structure:

```js
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const editionData = require(path.join(root, 'edition-data.js'));
const mediaData = require(path.join(root, 'media-data.js'));
const companion = require(path.join(root, 'companion.js'));
const checkOnly = process.argv.slice(2).includes('--check');
const routes = companion.buildRoutes(editionData, mediaData);
const expected = new Map();

expected.set(path.join(root, 'companion-routes.json'),
  JSON.stringify({ version: 1, routes: routes }, null, 2) + '\n');
routes.forEach(function (route) {
  expected.set(path.join(root, route.path, 'index.html'), companion.renderRedirect(route));
});

function routeFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).reduce(function (files, entry) {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Symlink is not allowed in generated routes: ' + target);
    if (entry.isDirectory()) return files.concat(routeFiles(target));
    if (entry.isFile() && entry.name === 'index.html') files.push(target);
    return files;
  }, []);
}

if (checkOnly) {
  const actualRouteFiles = routeFiles(path.join(root, 'go'));
  const expectedRouteFiles = Array.from(expected.keys()).filter(function (file) {
    return file.endsWith(path.sep + 'index.html');
  });
  const errors = [];
  expected.forEach(function (content, file) {
    if (!fs.existsSync(file)) errors.push('missing ' + path.relative(root, file));
    else if (fs.readFileSync(file, 'utf8') !== content) errors.push('stale ' + path.relative(root, file));
  });
  actualRouteFiles.forEach(function (file) {
    if (expectedRouteFiles.indexOf(file) === -1) errors.push('extra ' + path.relative(root, file));
  });
  if (errors.length) {
    errors.forEach(function (error) { console.error(error); });
    process.exit(1);
  }
} else {
  expected.forEach(function (content, file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
  });
}
```

Run:

```bash
node scripts/build-companion-routes.mjs
node scripts/build-companion-routes.mjs --check
npm test
```

Expected: 12 route pages and `companion-routes.json` are generated; check mode exits 0; tests pass.

- [ ] **Step 5: Commit**

```bash
git add companion.js companion-routes.json scripts/build-companion-routes.mjs go tests/run-tests.js
git commit -m "feat: generate stable edition companion routes"
```

### Task 6: URL state for edition deep links

**Files:**
- Modify: `explorer-state.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Add failing parse/serialize tests**

```js
test('explorer state round-trips a valid passive edition window', function () {
  const defaults = controllerState({ lang: 'ru', editionWindow: '', editionMedia: '', editionNotice: '' });
  const parsed = explorerState.parse(new URLSearchParams('lang=ru&editionWindow=window-04'),
    defaults, data, journeysData, editionData, { version: 1, entries: [] });
  assert.deepStrictEqual([parsed.editionWindow, parsed.editionMedia, parsed.editionNotice], ['window-04', '', '']);
  assert.strictEqual(explorerState.serialize(parsed, defaults).toString(), 'lang=ru&editionWindow=window-04');
});

test('explorer state rejects unknown edition windows and media without throwing', function () {
  const defaults = controllerState({ lang: 'ru', editionWindow: '', editionMedia: '', editionNotice: '' });
  const unknownWindow = explorerState.parse(new URLSearchParams('editionWindow=nope'),
    defaults, data, journeysData, editionData, { version: 1, entries: [] });
  assert.deepStrictEqual([unknownWindow.editionWindow, unknownWindow.editionNotice], ['', 'unknown-edition-window']);
  const unknownMedia = explorerState.parse(new URLSearchParams('editionWindow=window-04&editionMedia=nope'),
    defaults, data, journeysData, editionData, { version: 1, entries: [] });
  assert.deepStrictEqual([unknownMedia.editionWindow, unknownMedia.editionMedia, unknownMedia.editionNotice],
    ['window-04', '', 'unknown-edition-media']);
});

test('edition deep links never enable atlas or journey playback', function () {
  const defaults = controllerState({ editionWindow: '', editionMedia: '', editionNotice: '' });
  const parsed = explorerState.parse(new URLSearchParams('editionWindow=window-04&playing=1&journeyMode=playing'),
    defaults, data, journeysData, editionData, { version: 1, entries: [] });
  assert.strictEqual(parsed.playing, false);
  assert.strictEqual(parsed.journeyMode, 'paused');
});
```

- [ ] **Step 2: Run tests and observe failure**

Run `npm test`. Expected: FAIL because edition parameters are ignored.

- [ ] **Step 3: Extend parse and serialize defensively**

Add optional `editionManifest` and `mediaManifest` arguments after the existing journey manifest. Build own-property-safe lookup maps from canonical arrays. Parse only safe slug values. Rules:

```js
state.editionWindow = validWindowId || '';
state.editionMedia = validWindowId && validMediaLinkedToWindow ? mediaId : '';
state.editionNotice = unknownWindow ? 'unknown-edition-window' :
  (requestedMedia && !validMediaLinkedToWindow ? 'unknown-edition-media' : '');
if (state.editionWindow) {
  state.playing = false;
  state.journeyMode = 'paused';
}
```

Serialize `editionWindow` and `editionMedia` only as own string properties matching safe slugs. Never serialize `editionNotice`. Extend `controllerState()` defaults in tests with the three fields.

- [ ] **Step 4: Run tests and commit**

Run `npm test`. Expected: PASS, including all prior journey prototype-pollution tests.

```bash
git add explorer-state.js tests/run-tests.js
git commit -m "feat: preserve edition companion links"
```

### Task 7: Accessible web-companion banner

**Files:**
- Create: `edition-view.js`
- Modify: `index.html`
- Modify: `i18n.js`
- Modify: `styles.css`
- Modify: `app.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Add failing pure-renderer tests**

```js
const editionView = require(path.join(root, 'edition-view.js'));

test('edition companion banner renders canonical localized copy and no fake image', function () {
  const html = editionView.renderBanner(editionData.windows[3], 'ru', null, function (key) { return key; });
  assert.ok(html.indexOf('Города, реки и управление') !== -1);
  assert.ok(html.indexOf('window-04') !== -1);
  assert.ok(html.indexOf('<img') === -1);
  assert.ok(/<h2[^>]*tabindex="-1"/.test(html));
  assert.ok(/button[^>]*data-edition-close/.test(html));
});

test('edition companion banner escapes manifest and media copy', function () {
  const unsafe = JSON.parse(JSON.stringify(editionData.windows[0]));
  unsafe.copy.ru.title = '<img src=x onerror=alert(1)>';
  const html = editionView.renderBanner(unsafe, 'ru', null, function (key) { return key; });
  assert.strictEqual(html.indexOf('<img src=x'), -1);
  assert.ok(html.indexOf('&lt;img') !== -1);
});

test('edition companion shell and all three locales expose accessible labels', function () {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.indexOf('id="edition-companion"') !== -1);
  ['ru', 'en', 'zh'].forEach(function (locale) {
    ['editionCompanionLabel', 'editionCompanionClose', 'editionCompanionOpenAtlas'].forEach(function (key) {
      assert.ok(i18n.text(locale, key), locale + ' misses ' + key);
    });
  });
});
```

- [ ] **Step 2: Verify failure**

Run `npm test`. Expected: FAIL because `edition-view.js` is absent and the shell is missing.

- [ ] **Step 3: Implement pure rendering**

Create `edition-view.js` as a UMD/CommonJS module. Export `escapeHtml` and `renderBanner(window, locale, media, translate)`. The renderer must:

- select only own RU/EN/ZH copy, falling back to Russian;
- render the anchor through a provided localized formatter or escaped numeric fallback;
- render `<img>` only when a cleared media entry and a safe local derivative exist;
- put caption, credit, and reconstruction label in real HTML;
- render a focusable `h2`, edition label, question, close button, and atlas action;
- never use `innerHTML` from unescaped values.

- [ ] **Step 4: Add the shell and localization**

Before the existing journey dialog in `index.html`, add:

```html
<section id="edition-companion" class="edition-companion" aria-labelledby="edition-companion-title" hidden>
  <div id="edition-companion-content"></div>
</section>
```

Load modules in this order before `app.js`:

```html
<script src="edition-data.js"></script>
<script src="edition.js"></script>
<script src="media-data.js"></script>
<script src="media-registry.js"></script>
<script src="edition-view.js"></script>
```

Add exact RU/EN/ZH keys to `i18n.js`: label, close, open atlas, reconstruction, source, and unavailable-image text.

- [ ] **Step 5: Integrate the passive companion controller**

In `app.js`:

- pass edition/media manifests to `explorerState.parse`;
- add the three edition fields to defaults and controller state;
- after ordinary atlas rendering, resolve the edition window by ID;
- set the atlas year to the anchor only for a direct edition URL that did not supply an explicit year;
- render and reveal the companion section;
- keep atlas and journey playback paused;
- focus the banner heading without scrolling after direct navigation;
- close by clearing only edition fields, preserving the current year/view/focus;
- restore focus to a connected trigger when opened from an in-page link, otherwise leave focus on a safe document target;
- ignore unknown or malformed manifests without throwing.

Expose only a small `__PARALLEL_WORLDS_EDITION_TEST__` controller hook following the existing journey harness pattern, and remove it from production behavior when tests do not request it.

- [ ] **Step 6: Style and test responsive behavior**

Add `.edition-companion` styles using the approved dark-green, warm-paper, copper-accent system. Requirements:

- max content width 1180 px;
- no fixed height and no overflow clipping;
- controls at least 44 px on touch screens;
- visible `:focus-visible` outline;
- one-column layout below 720 px;
- `prefers-reduced-motion` disables decorative transitions;
- no selectors may target a generic `body.open` or leak into journey classes.

Add static tests for those invariants and controller tests for direct URL, close, focus, and no autoplay.

- [ ] **Step 7: Run tests and commit**

Run `npm test`. Expected: PASS.

```bash
git add edition-view.js index.html i18n.js styles.css app.js explorer-state.js tests/run-tests.js
git commit -m "feat: add edition web companion entry"
```

### Task 8: Validation, deployment, and contributor docs

**Files:**
- Create: `docs/edition-method.md`
- Modify: `scripts/validate.sh`
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `README.md`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Add failing release-wiring tests**

```js
test('edition foundation is included in validation and Pages deployment', function () {
  const validator = fs.readFileSync(path.join(root, 'scripts/validate.sh'), 'utf8');
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/deploy-pages.yml'), 'utf8');
  [
    'edition-data.js', 'edition.js', 'media-data.js', 'media-registry.js',
    'edition-audit.js', 'edition-audit.json', 'edition-view.js',
    'companion.js', 'companion-routes.json'
  ].forEach(function (asset) {
    assert.ok(validator.indexOf(asset) !== -1, 'validator misses ' + asset);
    assert.ok(workflow.indexOf(asset) !== -1, 'Pages artifact misses ' + asset);
  });
  assert.ok(validator.indexOf('build-edition-audit.mjs') !== -1);
  assert.ok(validator.indexOf('build-companion-routes.mjs --check') !== -1);
  assert.ok(workflow.indexOf('cp -R go _site/') !== -1);
});

test('edition method documents release gaps without claiming print readiness', function () {
  const method = fs.readFileSync(path.join(root, 'docs/edition-method.md'), 'utf8');
  ['reviewed', 'mediaId', 'print', 'web', 'QR', 'releaseReady', '500', 'npm run validate'].forEach(function (marker) {
    assert.ok(method.indexOf(marker) !== -1, 'edition method misses ' + marker);
  });
  assert.strictEqual(method.indexOf('готово к печати'), -1);
});
```

- [ ] **Step 2: Verify failure**

Run `npm test`. Expected: FAIL because validation, deployment, and docs are not wired.

- [ ] **Step 3: Make edition audit freshness non-destructive**

Extend `scripts/validate.sh` using the same secure snapshot/trap approach as `academic-audit.json`:

1. copy `edition-audit.json` to a `mktemp` snapshot;
2. arm restoration before generation;
3. run `node scripts/build-edition-audit.mjs`;
4. fail with an actionable message when `cmp -s` detects a stale artifact;
5. restore the worktree file on every exit path;
6. run `node scripts/build-companion-routes.mjs --check` without writing.

Add `node --check` for all new JS modules and add all new static files to the asset loop.

- [ ] **Step 4: Publish the edition foundation**

In `.github/workflows/deploy-pages.yml`, add the new root assets to the existing `cp` command and then:

```yaml
          cp -R go _site/
```

Do not publish private masters, contracts, `.superpowers/`, or `docs/` in the Pages artifact.

- [ ] **Step 5: Document the workflow**

Create `docs/edition-method.md` with:

- the 12-window and 288-page invariants;
- the difference between structural blockers and readiness gaps;
- the `reviewed`-only academic gate;
- the public/private boundary of `mediaId` records;
- independent print and web rights;
- stable host-independent QR paths;
- commands to rebuild and validate;
- an explicit statement that `releaseReady: false` is expected until Release C.

Add a README section headed `## Подарочное печатное издание` linking the design, this plan, method, and `edition-audit.json`. State that Release A is a production foundation, not a printable book.

- [ ] **Step 6: Run full validation and commit**

Run:

```bash
node scripts/build-edition-audit.mjs
node scripts/build-companion-routes.mjs
npm run validate
git diff --check
```

Expected: all tests pass; both generated artifacts are current; route check passes; static site validation passes.

```bash
git add scripts/validate.sh .github/workflows/deploy-pages.yml README.md docs/edition-method.md tests/run-tests.js edition-audit.json companion-routes.json go
git commit -m "chore: gate edition publishing foundation"
```

### Task 9: Browser QA and release checkpoint

**Files:**
- Modify only if QA exposes a verified defect.

- [ ] **Step 1: Start the local static server**

Run:

```bash
npm run serve
```

Expected: the site is available at `http://localhost:8080/`.

- [ ] **Step 2: Verify direct companion routes**

Open:

```text
http://localhost:8080/go/window-04/
```

Expected:

- redirect remains inside the project;
- the Russian companion banner opens for `window-04`;
- year becomes 3500 BCE only when the URL did not already include a year;
- atlas and journey autoplay remain paused;
- closing the banner preserves the current atlas state.

- [ ] **Step 3: Verify responsive and localized behavior**

At 1280 × 720 and 390 × 844:

- no horizontal page overflow;
- heading, question, close, and atlas action are visible;
- touch controls are at least 44 px;
- RU/EN/ZH switching changes banner text without changing the window;
- keyboard focus is visible and Escape does not accidentally close an unrelated dialog;
- browser console has zero errors.

- [ ] **Step 4: Run final automated evidence**

Run:

```bash
npm test
npm run validate
node scripts/build-companion-routes.mjs --check
git diff --check
git status --short --branch
```

Expected: all commands exit 0; only deliberately untracked `.superpowers/` visual-companion files remain outside Git.

- [ ] **Step 5: Commit any verified QA correction separately**

If QA required a correction, stage only its exact files and use:

```bash
git commit -m "fix: harden edition companion release"
```

If QA found no defect, do not create an empty commit.

## 4. Release A completion criteria

- canonical 12-window manifest passes strict validation;
- `edition-audit.json` deterministically reports academic and media readiness;
- empty media registry is valid and does not fabricate rights;
- 12 stable QR route pages are generated and checked for staleness;
- direct routes open a passive, accessible RU/EN/ZH companion banner;
- no new runtime dependency or network request is introduced;
- GitHub Pages contains all public companion assets and no private master data;
- the project passes the complete test and validation suite;
- Release A documentation explicitly says the physical edition is not yet ready to print.
