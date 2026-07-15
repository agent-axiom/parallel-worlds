# Luminous Atlas and Adaptive Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the schematic map with a bundled Equal Earth/Natural Earth atlas and make dense timeline rows readable through adaptive period rendering, accessible tooltips, and period-level navigation.

**Architecture:** Keep the site dependency-free at runtime. Generate a static `world-map-data.js` asset from Natural Earth GeoJSON at build time, project all atlas anchors from longitude/latitude through pure helpers in `atlas.js`, and keep HTML generation in `atlas-view.js`. Add pure density and tooltip helpers to `timeline.js`, while `app.js` owns DOM state, tooltip positioning, roving focus, and detail-dialog emphasis.

**Tech Stack:** Static HTML/CSS, ES5-compatible JavaScript UMD modules, Node.js build/test scripts, Natural Earth 1:110m GeoJSON, Equal Earth projection, GitHub Pages.

---

## File map

- Create `world-map-data.js`: generated coastline path, graticule path, viewport, projection metadata, source URL, and version.
- Create `scripts/build-world-map.mjs`: deterministic GeoJSON-to-SVG asset generator using only Node built-ins.
- Modify `atlas-data.js`: store real longitude/latitude anchors and bounded marker radii.
- Modify `atlas.js`: Equal Earth projection, projected center/region models, and eligible comparison connectors.
- Modify `atlas-view.js`: layered Natural Earth SVG, connector markup, and projected region controls.
- Modify `timeline.js`: four-state density classifier and period tooltip record helper.
- Modify `app.js`: adaptive three-lane rows, shared tooltip lifecycle, roving focus, and detail-period emphasis.
- Modify `i18n.js`: complete RU/EN/ZH strings for map comparison and period interaction.
- Modify `index.html`: load the generated map asset and add one shared tooltip element.
- Modify `styles.css`: B2 luminous map tokens, adaptive timeline palette/lanes, focus, mobile, and reduced motion.
- Modify `tests/run-tests.js`: pure behavior, rendering contracts, localization parity, asset budget, and static deployment tests.
- Modify `scripts/validate.sh`: syntax and artifact checks for the new asset and generator.
- Modify `.github/workflows/deploy-pages.yml`: include `world-map-data.js` in the Pages artifact.
- Modify `README.md`: Natural Earth source/credit and interaction notes.

### Task 1: Equal Earth projection and geographic atlas schema

**Files:**
- Modify: `tests/run-tests.js`
- Modify: `atlas.js`
- Modify: `atlas-data.js`

- [ ] **Step 1: Write failing projection and schema tests**

Add assertions that `projectGeoPoint(0, 0)` is centered, representative edge coordinates are finite and bounded, invalid coordinates return `null`, and every region/center has valid `longitude` and `latitude` with no legacy `x`/`y` fields:

```js
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
```

- [ ] **Step 2: Run the suite and confirm the red state**

Run: `npm test`

Expected: FAIL because `atlas.projectGeoPoint` is absent and `atlas-data.js` still exposes `x`/`y`.

- [ ] **Step 3: Implement the pure Equal Earth projection**

Add to `atlas.js` and export it:

```js
var MAP_PADDING = 4;
var EQUAL_EARTH_MAX_X = 2.70663;
var EQUAL_EARTH_MAX_Y = 1.31737;

function projectGeoPoint(longitude, latitude) {
  longitude = Number(longitude);
  latitude = Number(latitude);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;
  var A1 = 1.340264;
  var A2 = -0.081106;
  var A3 = 0.000893;
  var A4 = 0.003796;
  var M = Math.sqrt(3) / 2;
  var lambda = longitude * Math.PI / 180;
  var phi = latitude * Math.PI / 180;
  var theta = Math.asin(M * Math.sin(phi));
  var theta2 = theta * theta;
  var theta6 = theta2 * theta2 * theta2;
  var rawX = lambda * Math.cos(theta) / (M * (A1 + 3 * A2 * theta2 + theta6 * (7 * A3 + 9 * A4 * theta2)));
  var rawY = theta * (A1 + A2 * theta2 + theta6 * (A3 + A4 * theta2));
  var span = 100 - MAP_PADDING * 2;
  return {
    x: Number((MAP_PADDING + ((rawX + EQUAL_EARTH_MAX_X) / (2 * EQUAL_EARTH_MAX_X)) * span).toFixed(4)),
    y: Number((MAP_PADDING + ((EQUAL_EARTH_MAX_Y - rawY) / (2 * EQUAL_EARTH_MAX_Y)) * span).toFixed(4))
  };
}
```

- [ ] **Step 4: Migrate atlas anchors to real geography**

Change the center helper to:

```js
function c(id, longitude, latitude, start, end) {
  return { id: id, longitude: longitude, latitude: latitude, start: start, end: end };
}
```

Use geographic anchors for all existing centers. Preserve every id/start/end. Representative required values are:

```js
regions: {
  mesopotamia: { longitude: 44.4, latitude: 33.2, radius: 7 },
  'west-asia': { longitude: 51, latitude: 34, radius: 11 },
  africa: { longitude: 20, latitude: 5, radius: 15 },
  mediterranean: { longitude: 18, latitude: 39, radius: 10 },
  'south-asia': { longitude: 78, latitude: 23, radius: 11 },
  'east-asia': { longitude: 118, latitude: 34, radius: 14 },
  'central-asia': { longitude: 70, latitude: 44, radius: 14 },
  'southeast-asia': { longitude: 105, latitude: 12, radius: 11 },
  oceania: { longitude: 150, latitude: -15, radius: 14 },
  americas: { longitude: -75, latitude: 15, radius: 20 }
}
```

Use named-site coordinates where the center id names a site (`Göbekli Tepe 38.92/37.22`, `Çatalhöyük 32.83/37.67`, `Uruk 45.64/31.32`, `Babylon 44.42/32.54`, `Rome 12.50/41.90`, `Constantinople 28.98/41.01`, `Chang'an 108.94/34.34`, `Teotihuacan -98.84/19.69`, `Tenochtitlan -99.13/19.43`, `Cusco -72.55/-13.52`). Use regional centroids for regional centers and keep them within the named region.

- [ ] **Step 5: Project centers and regions inside `buildModel`**

When a center is active, merge the projected `{x, y}` into it. When aggregating a region, project its regional anchor and skip only invalid geometry:

```js
var projected = projectGeoPoint(center.longitude, center.latitude);
if (centerIsActive(center, year) && projected) {
  items.push({ track: track, center: Object.assign({}, center, projected), period: period });
}
```

- [ ] **Step 6: Run tests and commit**

Run: `npm test`

Expected: all tests PASS.

```bash
git add atlas.js atlas-data.js tests/run-tests.js
git commit -m "feat: project atlas from geographic coordinates"
```

### Task 2: Deterministic Natural Earth map asset

**Files:**
- Create: `scripts/build-world-map.mjs`
- Create: `world-map-data.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Write failing generated-asset tests**

```js
const worldMap = require(path.join(root, 'world-map-data.js'));

test('bundled Natural Earth map metadata and paths are production ready', function () {
  assert.strictEqual(worldMap.projection, 'Equal Earth');
  assert.strictEqual(worldMap.source.version, '5.1.2');
  assert.ok(worldMap.source.url.indexOf('ne_110m_land.geojson') !== -1);
  assert.deepStrictEqual(worldMap.viewBox, [0, 0, 1000, 520]);
  assert.ok(worldMap.landPath.length > 10000);
  assert.ok(worldMap.graticulePath.length > 100);
  assert.ok(fs.statSync(path.join(root, 'world-map-data.js')).size < 120 * 1024);
});
```

- [ ] **Step 2: Run the suite and confirm the missing-module failure**

Run: `npm test`

Expected: FAIL with `Cannot find module 'world-map-data.js'`.

- [ ] **Step 3: Create the generator with a pinned primary source**

Use:

```js
const SOURCE = {
  name: 'Natural Earth 1:110m Physical Vectors — Land',
  version: '5.1.2',
  url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_land.geojson'
};
```

The script accepts `--input path.geojson` for offline regeneration; otherwise it downloads `SOURCE.url` with `https.get`. It validates `FeatureCollection`, accepts `Polygon` and `MultiPolygon`, projects each coordinate with the same Equal Earth constants as `atlas.js`, rounds SVG coordinates to one decimal, drops consecutive duplicate points, closes each ring with `Z`, creates graticule lines at longitudes `-120,-60,0,60,120` and latitudes `-60,-30,0,30,60`, and writes a UMD module to `world-map-data.js`.

Serialize the computed values into the generated module with:

```js
const mapData = {
  projection: 'Equal Earth',
  viewBox: [0, 0, 1000, 520],
  source: SOURCE,
  landPath,
  graticulePath
};
const output = `(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.PARALLEL_WORLDS_MAP_DATA = data;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return ${JSON.stringify(mapData)};
}));\n`;
```

The generator serializes its computed `landPath` and `graticulePath` strings with `JSON.stringify` when it emits this module.

- [ ] **Step 4: Generate and verify the asset**

Run: `node scripts/build-world-map.mjs`

Expected: `Generated world-map-data.js from Natural Earth 5.1.2` and a file below 120 KB.

Run: `node --check world-map-data.js && npm test`

Expected: syntax check and tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-world-map.mjs world-map-data.js tests/run-tests.js
git commit -m "feat: bundle Natural Earth map geometry"
```

### Task 3: Comparison connector model

**Files:**
- Modify: `tests/run-tests.js`
- Modify: `atlas.js`

- [ ] **Step 1: Write failing connector tests**

Test one selected eligible insight with two active projected centers, overview without selection, and missing second center:

```js
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
```

- [ ] **Step 2: Confirm failure, implement, and expose in the model**

Run: `npm test`

Expected: FAIL because `buildComparisonConnector` is absent.

Implement exact eligibility: the selected/focused ids must contain both insight track ids; select the first projected center for each track; reject non-finite coordinates. Return `comparisonConnector` from `buildModel` after selecting the insight.

- [ ] **Step 3: Verify and commit**

Run: `npm test`

Expected: PASS.

```bash
git add atlas.js tests/run-tests.js
git commit -m "feat: model editorial comparison connectors"
```

### Task 4: Layered B2 map renderer

**Files:**
- Modify: `tests/run-tests.js`
- Modify: `atlas-view.js`
- Modify: `app.js`
- Modify: `index.html`

- [ ] **Step 1: Write failing renderer contracts**

Require `worldSvg(mapData, label, connector, copy)` to render `atlas-ocean`, graticule, glow coastline, crisp coastline, and an optional connector labeled as a comparison. Require region controls to use projected positions and selected state.

```js
const svg = atlasView.worldSvg(worldMap, 'World map', { from: { x: 25, y: 40 }, to: { x: 75, y: 35 }, title: 'Alpha and Beta' }, { comparisonConnectorLabel: 'Comparison: {title}' });
assert.ok(svg.indexOf('class="atlas-ocean"') !== -1);
assert.ok(svg.indexOf('class="atlas-coast atlas-coast-glow"') !== -1);
assert.ok(svg.indexOf('class="atlas-coast atlas-coast-line"') !== -1);
assert.ok(svg.indexOf('aria-label="Comparison: Alpha and Beta"') !== -1);
assert.strictEqual(atlasView.worldSvg(worldMap, 'World map', null, {}).indexOf('atlas-comparison'), -1);
```

- [ ] **Step 2: Confirm failure and implement safe SVG output**

Run: `npm test`

Expected: FAIL because the old renderer uses hand-drawn polygons and the old signature.

Render the generated paths only from the trusted bundled module. Escape all labels. Convert percentage connector points to the `1000 × 520` viewBox. Use a quadratic curve whose control point is the midpoint lifted by 7% of map height; render no arrows or moving particles.

- [ ] **Step 3: Wire map data into the browser**

In `index.html`, load `world-map-data.js` before `atlas-view.js`. In `app.js`, read `window.PARALLEL_WORLDS_MAP_DATA` and call:

```js
elements['atlas-world'].innerHTML = atlasView.worldSvg(worldMapData, t('atlasAria'), model.comparisonConnector, copy);
elements['atlas-regions'].innerHTML = atlasView.renderRegions(model.regions, copy, state.selectedRegion);
```

Keep the existing textual panel when map geometry is missing.

- [ ] **Step 4: Verify and commit**

Run: `node --check atlas-view.js && node --check app.js && npm test`

Expected: PASS.

```bash
git add atlas-view.js app.js index.html tests/run-tests.js
git commit -m "feat: render the luminous Natural Earth atlas"
```

### Task 5: Pure adaptive timeline helpers

**Files:**
- Modify: `tests/run-tests.js`
- Modify: `timeline.js`

- [ ] **Step 1: Write threshold and tooltip-record tests**

```js
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
```

- [ ] **Step 2: Confirm failure and implement minimal pure helpers**

```js
function periodDensity(width) {
  width = Number(width);
  if (width >= 112) return 'wide';
  if (width >= 64) return 'medium';
  if (width >= 32) return 'compact';
  return 'node';
}

function periodTooltipRecord(period) {
  var dating = period.dating || {};
  return { id: period.id || '', name: period.name, start: period.start, end: period.end, precision: dating.precision || '', basis: dating.basis || '' };
}
```

Run: `npm test`

Expected: PASS after exporting both helpers.

- [ ] **Step 3: Commit**

```bash
git add timeline.js tests/run-tests.js
git commit -m "feat: classify adaptive timeline periods"
```

### Task 6: Three-lane timeline and period interactions

**Files:**
- Modify: `tests/run-tests.js`
- Modify: `index.html`
- Modify: `app.js`

- [ ] **Step 1: Add static markup tests for the shared tooltip**

Require one `#period-tooltip[role="tooltip"]` outside the timeline and app hooks for `data-period`, `periodDensity`, `showPeriodTooltip`, `movePeriodFocus`, and emphasized dialog entries.

- [ ] **Step 2: Add the shared tooltip element**

Insert before the detail dialog:

```html
<div id="period-tooltip" class="period-tooltip" role="tooltip" hidden></div>
```

Register it in the cached `elements` list in `app.js`.

- [ ] **Step 3: Render event and period lanes**

Use plot pixels `1320 * state.zoom / 100`. For each period, compute `widthPixels = Math.max(0, widthPercent / 100 * plotPixels)`, classify with `timeline.periodDensity`, and render a semantic button:

```html
<button class="period period-density-medium" type="button" data-track="china" data-period="period-id" tabindex="-1" aria-describedby="period-tooltip">
  <span class="period-label">Localized period name</span>
</button>
```

Only `wide` and `medium` include `.period-label`; only `wide` includes the compact precision badge. Wrap event markers in `.event-lane` and period buttons/current-year line in `.period-lane`. Use `data-tooltip-name`, `data-tooltip-range`, `data-tooltip-precision`, and `data-tooltip-basis` with escaped values so tooltip content can be assigned with `textContent`.

- [ ] **Step 4: Implement pointer tooltip and clamped positioning**

Create `showPeriodTooltip(button)`, `positionPeriodTooltip(button)`, and `hidePeriodTooltip()`. Compose four text lines from dataset values. Position with `getBoundingClientRect()`, clamp left/right to an 8px viewport inset, prefer above the segment, and fall below when the top would be negative. Close on pointerleave, blur, Escape, rerender, range change, and locale change.

- [ ] **Step 5: Implement roving focus**

On ArrowRight from `.track-label`, focus the first period in the row. Within period buttons, Left/Right moves to the adjacent button, Home/End moves to row boundaries, and Escape restores focus to the row label. Set `tabIndex = 0` only on the currently focused period in that row and restore all periods to `-1` after Escape.

- [ ] **Step 6: Open and emphasize a selected period**

Change `openDetails(id)` to `openDetails(id, periodId)`. Add `data-period` to every dialog period `<li>`, add class `emphasized` when ids match, call `scrollIntoView({ block: 'nearest' })` after opening when available, and focus the emphasized list item with `tabindex="-1"`. A period click calls `openDetails(button.dataset.track, button.dataset.period)` without triggering the track-label handler.

- [ ] **Step 7: Verify and commit**

Run: `node --check app.js && npm test`

Expected: PASS and no inline labels inside compact/node period markup.

```bash
git add index.html app.js tests/run-tests.js
git commit -m "feat: add adaptive timeline interactions"
```

### Task 7: B2 visual system, localization, and accessible fallbacks

**Files:**
- Modify: `tests/run-tests.js`
- Modify: `i18n.js`
- Modify: `styles.css`

- [ ] **Step 1: Add localization parity and CSS-contract tests**

Require these keys in RU/EN/ZH: `comparisonConnectorLabel`, `periodTooltipDates`, `periodTooltipPrecision`, `periodTooltipBasis`, `selectedPeriodState`. Require CSS selectors for `atlas-coast-glow`, `atlas-comparison`, all four density classes, `event-lane`, `period-lane`, `.dialog-periods li.emphasized`, a `prefers-reduced-motion: reduce` block, and mobile document-overflow protection.

- [ ] **Step 2: Add complete localized copy**

Use these translations:

```js
ru: {
  comparisonConnectorLabel: 'Сравнение: {title}',
  periodTooltipDates: 'Даты: {range}',
  periodTooltipPrecision: 'Точность: {precision}',
  periodTooltipBasis: 'Основание: {basis}',
  selectedPeriodState: 'Выбранный период'
}
en: {
  comparisonConnectorLabel: 'Comparison: {title}',
  periodTooltipDates: 'Dates: {range}',
  periodTooltipPrecision: 'Precision: {precision}',
  periodTooltipBasis: 'Dating basis: {basis}',
  selectedPeriodState: 'Selected period'
}
zh: {
  comparisonConnectorLabel: '比较：{title}',
  periodTooltipDates: '年代：{range}',
  periodTooltipPrecision: '精度：{precision}',
  periodTooltipBasis: '断代依据：{basis}',
  selectedPeriodState: '已选时期'
}
```

- [ ] **Step 3: Implement the luminous B2 map CSS**

Use a deep-teal ocean/vignette, graphite-teal land, cyan coastline, amber-coral active regions, bounded marker sizes, and a non-directional gradient connector. Keep glow under active markers. Add `.atlas-map.has-selection .atlas-region:not(.selected)` attenuation. Disable pulse/connector transitions under reduced motion and reduce filters below 680px.

- [ ] **Step 4: Implement adaptive timeline CSS**

Set the sticky label column to `clamp(220px, 20vw, 300px)`, allow two-line names, create a 22px event lane and 38px period lane, and use type variables for archaeology/site/civilization/regional/network/tradition/legacy. Wide periods show normal text; medium uses one ellipsis; compact is a clean segment; node uses `min-width: 6px`, circular/rounded geometry, and no text. Give focused period buttons a high-contrast outline and emphasize selected detail entries without relying only on color.

- [ ] **Step 5: Verify and commit**

Run: `npm test && npm run validate`

Expected: all tests and validation PASS.

```bash
git add i18n.js styles.css tests/run-tests.js
git commit -m "feat: apply luminous map and timeline visual system"
```

### Task 8: Static deployment and source documentation

**Files:**
- Modify: `tests/run-tests.js`
- Modify: `scripts/validate.sh`
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `README.md`

- [ ] **Step 1: Extend artifact tests**

Add `world-map-data.js` to required static assets, relative script checks, validator checks, workflow checks, and the runtime-network prohibition. Check the map asset remains below 120 KB and contains no `fetch(` or `XMLHttpRequest`.

- [ ] **Step 2: Update validation and Pages packaging**

Add `node --check world-map-data.js` to `scripts/validate.sh`, include it in the asset loop and absolute-path rejection expression, and add it to the workflow `cp` list between `atlas-data.js` and `insights.js`.

- [ ] **Step 3: Document source and interaction**

Add a README section stating: the browser uses a generated static asset; source is Natural Earth 1:110m Land v5.1.2; Natural Earth data is public domain; regeneration command is `node scripts/build-world-map.mjs`; comparison curves are editorial comparisons, not routes or claims of contact; short timeline periods intentionally become semantic nodes with tooltip/detail access.

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run validate`

Expected: all tests and validation PASS.

```bash
git add tests/run-tests.js scripts/validate.sh .github/workflows/deploy-pages.yml README.md
git commit -m "docs: document atlas data and Pages packaging"
```

### Task 9: Browser, accessibility, and production verification

**Files:**
- Modify only if verification exposes a reproducible defect: `styles.css`, `app.js`, `atlas-view.js`, or `tests/run-tests.js`

- [ ] **Step 1: Start a local server**

Run: `npm run serve`

Expected: static server available at `http://localhost:8080/`.

- [ ] **Step 2: Verify desktop states**

At 1440×900 and 1024×768, inspect RU/EN/ZH, light/dark themes, overview/deep/historical modes, the dense China row, one sparse row, map overview, region selection, one focused comparison, year playback, pointer tooltip, keyboard Arrow/Home/End/Escape navigation, and detail emphasis. Expected: recognizable continents, subordinate coastline glow, no clipped period fragments, no console errors.

- [ ] **Step 3: Verify mobile states**

At 390×844 and 360×800, repeat map and China-row checks. Evaluate `document.documentElement.scrollWidth === document.documentElement.clientWidth`. Expected: the document does not overflow; only the timeline viewport scrolls; labels remain two-line; compact/node periods have no inline text; tooltip stays inside the viewport.

- [ ] **Step 4: Verify reduced motion and fallback**

Emulate `prefers-reduced-motion: reduce`; confirm halos and connector transitions stop. Temporarily evaluate `atlasView.worldSvg(null, 'World map', null, copy)` in the console; expected: safe SVG fallback with graticule and no broken path.

- [ ] **Step 5: Run the final automated gate**

Run:

```bash
npm test
npm run validate
git diff --check
git status --short
```

Expected: tests and validation PASS, no whitespace errors, and only intended files changed.

- [ ] **Step 6: Commit any verification fixes**

If verification required a code correction, add a regression assertion and commit exactly those files:

```bash
git add tests/run-tests.js app.js atlas-view.js styles.css
git commit -m "fix: refine responsive atlas interactions"
```

If no correction was required, do not create an empty commit.

### Task 10: Review, integration, and deployment

**Files:**
- No source changes expected.

- [ ] **Step 1: Review the complete branch diff**

Run: `git diff main...HEAD --stat && git diff --check main...HEAD`

Expected: only the approved atlas/timeline files, tests, docs, and deployment packaging are present; no `.superpowers/` files are tracked.

- [ ] **Step 2: Merge after the verification gate**

Run from the primary workspace:

```bash
git checkout main
git merge --ff-only codex/luminous-atlas
```

Expected: fast-forward merge succeeds.

- [ ] **Step 3: Push and watch GitHub Pages**

```bash
git push origin main
gh run list --workflow deploy-pages.yml --limit 1
gh run watch --exit-status
```

Expected: push succeeds and the latest `Deploy GitHub Pages` run completes successfully.

- [ ] **Step 4: Verify production**

Open `https://agent-axiom.github.io/parallel-worlds/`, confirm the response references `world-map-data.js`, and visually recheck the map plus China row. Expected: production matches the local verified build.
