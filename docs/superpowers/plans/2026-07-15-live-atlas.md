# Live Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dependency-free living world atlas that shares year, filters, focus, and URL state with the existing comparative chronology.

**Architecture:** Keep `data.js` as the historical source of truth and add reviewed geography and editorial comparisons in separate static UMD modules. Pure projection, state, and HTML-rendering modules remain testable in Node; `app.js` coordinates them with the DOM. Map and chronology consume one state object and deploy as the same static GitHub Pages artifact.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, UMD/CommonJS-compatible data modules, inline SVG, Node `assert` tests, GitHub Actions and GitHub Pages.

---

## File structure

- Create `atlas-data.js`: reviewed region coordinates, influence radii, and per-track centers.
- Create `insights.js`: approximately 30 reviewed contemporaries comparisons with RU/EN/ZH text.
- Create `atlas.js`: validation, active-center projection, region aggregation, insight selection, and playback helpers.
- Create `explorer-state.js`: parsing and serialization for shared Map/Chronology URL state.
- Create `atlas-view.js`: pure localized SVG, region control, statistics, and insight markup builders.
- Modify `index.html`: synchronized explorer shell, view tabs, atlas canvas, side panel, playback controls, and new scripts.
- Modify `styles.css`: living-atlas visual system, responsive bottom sheet, focus states, dark theme, and reduced motion.
- Modify `app.js`: shared state, atlas rendering, mode switching, focus, playback, and fallbacks.
- Modify `i18n.js`: all new interface strings in Russian, English, and Simplified Chinese.
- Modify `tests/run-tests.js`: schema, projection, URL, localization, static integration, and fallback tests.
- Modify `scripts/validate.sh`: syntax and asset checks for every new module.
- Modify `.github/workflows/deploy-pages.yml`: publish every new module.
- Modify `README.md`: document the new explorer and shareable Map URLs.

### Task 1: Pure atlas projection

**Files:**
- Create: `atlas.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Write failing tests for active centers and region aggregation**

Add a CommonJS import and tests using a small real-shaped fixture:

```js
const atlas = require(path.join(root, 'atlas.js'));

test('atlas projects active centers and aggregates filtered regions', function () {
  const tracks = [
    { id: 'alpha', region: 'east-asia', type: 'civilization', periods: [{ start: -600, end: -400 }] },
    { id: 'beta', region: 'east-asia', type: 'tradition', periods: [{ start: -550, end: -300 }] },
    { id: 'gamma', region: 'americas', type: 'civilization', periods: [{ start: 100, end: 500 }] }
  ];
  const geography = {
    tracks: {
      alpha: [{ id: 'alpha-core', x: 72, y: 38, start: -600, end: -400 }],
      beta: [{ id: 'beta-core', x: 70, y: 39, start: -550, end: -300 }]
    }
  };
  const projected = atlas.projectActiveCenters(tracks, -500, geography);
  assert.deepStrictEqual(projected.map(function (item) { return item.track.id; }), ['alpha', 'beta']);
  assert.deepStrictEqual(atlas.aggregateRegions(projected), [
    { id: 'east-asia', count: 2, civilizations: 1, traditions: 1, trackIds: ['alpha', 'beta'] }
  ]);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test`

Expected: FAIL because `atlas.js` does not exist.

- [ ] **Step 3: Implement the UMD module and projection functions**

Expose:

```js
projectActiveCenters(tracks, year, geography)
aggregateRegions(projectedCenters)
activePeriod(track, year)
```

`projectActiveCenters` must include only tracks active in the selected year and only centers whose optional `start`/`end` range includes that year. It returns `{ track, center, period }` records and tolerates missing optional geography by omitting the map item.

- [ ] **Step 4: Add and pass boundary/fallback tests**

Test an exact period start, an exact period end, an empty geography entry, and a track with no geography. Run `npm test`; expect all tests to pass.

- [ ] **Step 5: Commit**

```bash
git add atlas.js tests/run-tests.js
git commit -m "feat: add atlas projection model"
```

### Task 2: Reviewed geography and comparison data

**Files:**
- Create: `atlas-data.js`
- Create: `insights.js`
- Modify: `atlas.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Write failing schema and coverage tests**

Require both modules and assert:

```js
test('atlas geography covers every historical track with valid coordinates', function () {
  const trackIds = new Set(data.tracks.map(function (track) { return track.id; }));
  assert.deepStrictEqual(Object.keys(atlasData.tracks).sort(), Array.from(trackIds).sort());
  Object.keys(atlasData.tracks).forEach(function (trackId) {
    assert.ok(atlasData.tracks[trackId].length >= 1 && atlasData.tracks[trackId].length <= 3);
    atlasData.tracks[trackId].forEach(function (center) {
      assert.ok(center.x >= 0 && center.x <= 100);
      assert.ok(center.y >= 0 && center.y <= 100);
      assert.ok(center.start < center.end);
    });
  });
});

test('editorial comparisons are valid and complete in three locales', function () {
  assert.ok(insights.length >= 30);
  insights.forEach(function (insight) {
    assert.ok(insight.id && insight.start < insight.end);
    assert.strictEqual(insight.trackIds.length, 2);
    insight.trackIds.forEach(function (id) { assert.ok(data.tracks.some(function (track) { return track.id === id; })); });
    ['ru', 'en', 'zh'].forEach(function (locale) {
      assert.ok(insight.copy[locale].title && insight.copy[locale].summary);
    });
    insight.sourceIds.forEach(function (id) { assert.ok(data.sources[id]); });
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test`

Expected: FAIL because the data modules do not exist.

- [ ] **Step 3: Add reviewed atlas data for all 49 tracks**

Create a UMD atlas dataset with:

```js
{
  regions: {
    mesopotamia: { x: 56, y: 39, radius: 8 },
    'west-asia': { x: 57, y: 40, radius: 11 },
    africa: { x: 51, y: 56, radius: 15 },
    mediterranean: { x: 50, y: 39, radius: 10 },
    'south-asia': { x: 65, y: 49, radius: 11 },
    'east-asia': { x: 76, y: 40, radius: 14 },
    'central-asia': { x: 65, y: 35, radius: 14 },
    'southeast-asia': { x: 75, y: 57, radius: 11 },
    oceania: { x: 86, y: 68, radius: 14 },
    americas: { x: 24, y: 49, radius: 20 }
  },
  tracks: {
    sumer: [{ id: 'uruk', x: 56.7, y: 42.2, start: -3500, end: -1750 }]
  }
}
```

Add one to three deliberately approximate centers for every canonical track. Use period-aware centers for tracks whose political or ritual center materially moves, including Rome, Byzantium, the steppe, India, China, Maya, the Andes, Christianity, Islam, Buddhism, and Manichaeism.

- [ ] **Step 4: Add the 30 editorial comparison records**

Use these reviewed IDs and pairs, with ranges constrained to periods where both referenced tracks are active:

1. `sumer-egypt-cities`: Sumer / Egypt
2. `akkad-indus-networks`: Akkadia / Indus
3. `babylon-egypt-bronze`: Babylonia / Egypt
4. `hittites-new-kingdom`: Hittites / Egypt
5. `assyria-greece`: Assyria / Greece
6. `confucius-greek-polis`: Confucianism / Greece
7. `persia-greek-world`: Persia / Greece
8. `buddhism-achaemenids`: Buddhism / Persia
9. `rome-han-china`: Rome / China
10. `maya-roman-world`: Maya / Rome
11. `aksum-rome`: Ethiopia / Rome
12. `christianity-buddhist-asia`: Christianity / Buddhism
13. `byzantium-tang`: Byzantium / China
14. `islam-tang`: Islam / China
15. `abbasids-charlemagne-world`: Islam / Christianity
16. `baghdad-maya-classic`: Islam / Maya
17. `viking-age-heian`: Christianity / Japan
18. `song-china-mississippi`: China / North America
19. `byzantium-inca-beginnings`: Byzantium / Inca
20. `mongols-mali`: Steppe / West Africa
21. `mansa-musa-yuan`: West Africa / China
22. `aztec-byzantium`: Aztec / Byzantium
23. `inca-ming`: Inca / China
24. `sikhism-aztec`: Sikhism / Aztec
25. `jainism-buddhism`: Jainism / Buddhism
26. `zoroastrianism-judaism`: Zoroastrianism / Judaism
27. `manichaeism-christianity`: Manichaeism / Christianity
28. `daoism-roman-religion`: Daoism / Roman religion
29. `shinto-maya`: Shinto / Maya
30. `andean-mesoamerican-ritual`: Andean religion / Mesoamerican religion

Each record contains localized `title` and two-sentence-or-shorter `summary`, plus one or more existing source IDs. Avoid claims of direct contact unless the supplied sources support it.

- [ ] **Step 5: Add insight selection and fallback tests**

Test that `selectInsight(insights, activeTracks, -500, 'ru', [])` returns an eligible approved comparison, that focused track IDs are preferred, that an unsupported locale falls back to English, and that no eligible record returns `null`.

- [ ] **Step 6: Implement and pass insight selection**

Expose `selectInsight(insights, activeTracks, year, locale, focusIds)`. Sort eligible records deterministically by focused-track matches and then ID. Run `npm test`; expect all tests to pass.

- [ ] **Step 7: Commit**

```bash
git add atlas-data.js insights.js atlas.js tests/run-tests.js
git commit -m "feat: add atlas geography and insights"
```

### Task 3: Shared explorer URL state

**Files:**
- Create: `explorer-state.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Write failing URL round-trip tests**

```js
test('explorer state round-trips map view and focused tracks', function () {
  const defaults = { view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all' };
  const parsed = explorerState.parse(new URLSearchParams('view=chronology&year=1200&focus=china,byzantium'), defaults, data);
  assert.strictEqual(parsed.view, 'chronology');
  assert.strictEqual(parsed.year, 1200);
  assert.deepStrictEqual(parsed.focus, ['china', 'byzantium']);
  const params = explorerState.serialize(parsed, defaults);
  assert.strictEqual(params.get('view'), 'chronology');
  assert.strictEqual(params.get('focus'), 'china,byzantium');
});
```

Also test unknown view, unknown track IDs, duplicate focus IDs, more than two focus IDs, and years outside the canonical range.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test`

Expected: FAIL because `explorer-state.js` does not exist.

- [ ] **Step 3: Implement parse and serialize**

Expose:

```js
parse(params, defaults, data)
serialize(state, defaults)
normalizeFocus(value, tracks)
```

Accept only `map` and `chronology`; preserve a maximum of two unique canonical track IDs; clamp the year; keep the existing query, region, type, start, end, zoom, and language contract.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add explorer-state.js tests/run-tests.js
git commit -m "feat: add shared explorer URL state"
```

### Task 4: Pure atlas markup renderer

**Files:**
- Create: `atlas-view.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Write failing accessible-markup tests**

Build a localized projection and assert that `renderRegions` returns exactly one button per active aggregate, includes `data-region`, localized region names, counts, and an accessible label. Assert that `renderPanel` produces either the selected insight or localized fallback statistics.

```js
const html = atlasView.renderRegions([{ id: 'east-asia', count: 3, x: 76, y: 40, radius: 14 }], {
  regionNames: { 'east-asia': 'East Asia' },
  activeRegionLabel: '{name}: {count} active tracks'
});
assert.ok(html.indexOf('data-region="east-asia"') !== -1);
assert.ok(html.indexOf('East Asia: 3 active tracks') !== -1);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test`

Expected: FAIL because `atlas-view.js` does not exist.

- [ ] **Step 3: Implement safe pure renderers**

Expose:

```js
worldSvg()
renderRegions(regions, copy)
renderPanel(model, copy)
renderRegionList(model, copy)
```

Escape every dynamic string and emit native `<button>` overlays for keyboard accessibility. `worldSvg()` contains simplified bundled land contours with no modern national borders.

- [ ] **Step 4: Pass escaping and fallback tests**

Test hostile text such as `<img onerror=alert(1)>`, empty regions, missing insight, and plural-neutral localized templates. Run `npm test`; expect all tests to pass.

- [ ] **Step 5: Commit**

```bash
git add atlas-view.js tests/run-tests.js
git commit -m "feat: add accessible atlas renderers"
```

### Task 5: Synchronized explorer shell and styling

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `i18n.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Write failing static integration and localization tests**

Require these IDs and assets in `index.html`:

```text
explorer
view-map-button
view-chronology-button
atlas-view
atlas-map
atlas-regions
atlas-panel
atlas-play-button
atlas-year-input
chronology-view
```

Require relative scripts in dependency order: `atlas-data.js`, `insights.js`, `atlas.js`, `explorer-state.js`, `atlas-view.js`, then `app.js`. Extend the existing Chinese interface-key test so every new `data-i18n` key must have RU/EN/ZH copy.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test`

Expected: FAIL on missing explorer IDs and assets.

- [ ] **Step 3: Replace the disconnected timeline section with the explorer shell**

Keep the global filters and detail dialog. Move existing year controls and timeline frame inside `chronology-view`. Add Map/Chronology tab buttons with `aria-selected`, an atlas header, SVG container, active-region list, side panel, Play/Pause, and the shared year slider. Preserve existing IDs where app logic already depends on them.

- [ ] **Step 4: Add localized interface copy**

Add RU/EN/ZH values for view names, atlas labels, Play/Pause, active-region label, comparison headings, statistics, fallback, open chronology, back to overview, selected region, and reduced-motion-neutral instructions. The Chinese coverage test must detect any fallback.

- [ ] **Step 5: Add balanced editorial styling**

Implement the approved light editorial layout, dark theme, soft influence fields, focused region state, synchronized tab control, fixed visual hierarchy, and mobile bottom sheet. Add `@media (prefers-reduced-motion: reduce)` that removes map and panel transitions. The page must retain a 320 px minimum and keep atlas overflow internal.

- [ ] **Step 6: Run tests and commit**

Run: `npm test`

Expected: all tests pass.

```bash
git add index.html styles.css i18n.js tests/run-tests.js
git commit -m "feat: add synchronized atlas shell"
```

### Task 6: Application integration and playback

**Files:**
- Modify: `app.js`
- Modify: `atlas.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Write failing playback and selection tests**

Add pure tests:

```js
test('playback advances proportionally and wraps at the visible range', function () {
  assert.strictEqual(atlas.nextPlaybackYear(-500, -3500, 1600, 20), -480);
  assert.strictEqual(atlas.nextPlaybackYear(1590, -3500, 1600, 20), -3500);
});
```

Test `atlas.buildModel` with query, region, and type filters; selected region; focused track IDs; missing geography; and absent insight.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test`

Expected: FAIL because playback/model helpers are not implemented.

- [ ] **Step 3: Implement model and playback helpers**

Expose `nextPlaybackYear` and `buildModel`. `buildModel` combines filtered active tracks, projected centers, aggregates, selected region detail, focus, statistics, and selected insight into one immutable view model.

- [ ] **Step 4: Integrate modules into shared app state**

Use `explorer-state.js` for initial URL and writes. Add `view`, `focus`, `selectedRegion`, and `playing` to application state. Both atlas and chronology read the same `state.year`, query, region, type, and focus.

Implement:

- tab switching with `aria-selected` and hidden panels;
- region selection and overview restoration;
- track focus from insight and region controls;
- Map-to-Chronology switch without losing state;
- Play/Pause using one timer, twenty historical years per tick, and wrap at the visible range;
- automatic pause on `document.visibilitychange`;
- automatic pause when leaving Map;
- no timer start when reduced motion is preferred;
- keyboard activation through native buttons;
- focused detail links that reuse the existing dialog.

- [ ] **Step 5: Run tests and commit**

Run: `npm test`

Expected: all tests pass.

```bash
git add app.js atlas.js tests/run-tests.js
git commit -m "feat: synchronize atlas interactions"
```

### Task 7: Static deployment, documentation, and validation

**Files:**
- Modify: `scripts/validate.sh`
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `README.md`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Write failing artifact tests**

Extend the required-file and workflow assertions to cover `atlas-data.js`, `insights.js`, `atlas.js`, `explorer-state.js`, and `atlas-view.js`. Assert that each asset is copied into `_site` and loaded relatively from `index.html`.

Add a static performance budget assertion: the combined byte size of the five new JavaScript modules must stay below 180 KB uncompressed, and none of those modules may contain runtime `fetch(`, `XMLHttpRequest`, or external script imports.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test`

Expected: FAIL because validation and deployment do not include the new assets.

- [ ] **Step 3: Update validation and deployment**

Run `node --check` on every new module. Add them to the required asset loop, absolute-path guard, and GitHub Pages copy command.

- [ ] **Step 4: Document the living atlas**

Update README features and add direct examples:

```text
?lang=ru&view=map&year=-500
?lang=en&view=chronology&year=1200&focus=china,byzantium
?lang=zh&view=map&year=1368&focus=china,inca
```

- [ ] **Step 5: Run the full validator and commit**

Run: `npm run validate`

Expected: all tests and static validation pass.

```bash
git add scripts/validate.sh .github/workflows/deploy-pages.yml README.md tests/run-tests.js
git commit -m "chore: publish live atlas assets"
```

### Task 8: Browser verification and release integration

**Files:**
- Modify only if a browser test exposes a defect; every defect begins with a failing regression test.

- [ ] **Step 1: Run clean automated verification**

Run:

```bash
git diff --check
npm test
npm run validate
```

Expected: no diff errors, all tests pass, static validation passes.

- [ ] **Step 2: Verify desktop behavior in a real browser**

At 1440 px verify direct `?lang=ru&view=map&year=-500`, Map/Chronology state preservation, one region selection, one insight focus action, Play/Pause, URL updates, detail dialog, theme, language switch, and zero console errors.

- [ ] **Step 3: Verify mobile and reduced motion**

At 390 × 844 verify no page-level horizontal overflow, accessible atlas controls, usable bottom sheet, internal chronology scrolling, and language selection. Enable reduced motion and verify Play remains opt-in and transitions convey no unique information.

- [ ] **Step 4: Verify GitHub Pages subpath locally**

Serve the project and confirm every new asset returns HTTP 200 from `/parallel-worlds/`-equivalent relative paths.

- [ ] **Step 5: Fix only evidence-backed defects through RED/GREEN**

For each browser defect, add the smallest failing automated regression test, confirm RED, patch the implementation, and confirm GREEN.

- [ ] **Step 6: Final commit when browser fixes were required**

```bash
git add app.js atlas.js atlas-view.js explorer-state.js index.html styles.css tests/run-tests.js
git commit -m "fix: polish live atlas behavior"
```

- [ ] **Step 7: Complete branch workflow**

Use `superpowers:verification-before-completion`, request review, merge to `main`, rerun `npm run validate`, push `main`, watch the GitHub Pages workflow, and verify the public Map URL serves the deployed commit.
