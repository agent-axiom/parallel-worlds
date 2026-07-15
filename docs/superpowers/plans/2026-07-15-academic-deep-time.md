# Academic Deep-Time Timeline Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend Parallel Worlds to 20,000 BCE–1600 CE with a two-scale chronology, evidence-aware dates and sources, a balanced reviewed deep-time corpus, and corrected China/Korea/Mesopotamia chronology.

**Architecture:** Keep the zero-dependency static-site architecture. Add one chronology module for no-year-zero arithmetic, scale projection, and validation; add a separate academic dataset module containing reviewed multilingual records and patches; merge it into the existing dataset so legacy content remains visible with an explicit review status. Update the existing UI, atlas, exporter, and URL state to consume the richer schema while preserving GitHub Pages compatibility.

**Tech Stack:** Vanilla JavaScript UMD modules, semantic HTML, CSS, Node `assert` tests, Bash static validation, GitHub Actions/Pages.

---

## Task 1: Add no-year-zero chronology primitives

**Files:**
- Create: `chronology.js`
- Modify: `tests/run-tests.js`
- Modify: `index.html`

**Step 1: Write failing tests**

Add tests for:

```js
assert.strictEqual(chronology.isValidHistoricalYear(0), false);
assert.strictEqual(chronology.nextYear(-1, 1), 1);
assert.strictEqual(chronology.nextYear(1, -1), -1);
assert.strictEqual(chronology.historicalDistance(-1, 1), 1);
assert.strictEqual(chronology.addHistoricalYears(-2, 2), 1);
```

Also assert mode ranges:

```js
assert.deepStrictEqual(chronology.modeRange('deep', data.range), { start: -20000, end: -3500 });
assert.deepStrictEqual(chronology.modeRange('historical', data.range), { start: -3500, end: 1600 });
```

**Step 2: Run tests to verify RED**

Run: `npm test`  
Expected: failure because `chronology.js` does not exist.

**Step 3: Implement the minimal module**

Expose:

- `isValidHistoricalYear(year)`
- `normalizeHistoricalYear(year, direction)`
- `nextYear(year, step)`
- `addHistoricalYears(year, amount)`
- `historicalDistance(start, end)`
- `modeRange(mode, range)`

Use signed BCE/CE storage, reject zero, and cross `-1 → 1` without inserting an extra year.

**Step 4: Load the module before `timeline.js`**

Add `<script src="chronology.js"></script>` to `index.html`.

**Step 5: Run tests to verify GREEN**

Run: `npm test`  
Expected: all tests pass.

**Step 6: Commit**

```bash
git add chronology.js index.html tests/run-tests.js
git commit -m "feat: add historical calendar primitives"
```

## Task 2: Implement the two-scale projection

**Files:**
- Modify: `chronology.js`
- Modify: `timeline.js`
- Modify: `tests/run-tests.js`

**Step 1: Write failing projection tests**

Cover Overview, Deep time, and Historical time:

```js
const scale = { start: -20000, breakpoint: -3500, end: 1600, deepWeight: 0.30 };
assert.strictEqual(chronology.projectYear(-20000, scale), 0);
assert.ok(Math.abs(chronology.projectYear(-3500, scale) - 30) < 0.001);
assert.strictEqual(chronology.projectYear(1600, scale), 100);
[-20000, -12000, -3500, -1, 1, 1600].forEach(year => {
  assert.ok(Math.abs(chronology.unprojectYear(chronology.projectYear(year, scale), scale) - year) <= 1);
});
```

Test adaptive ticks and assert that no tick equals zero.

**Step 2: Run tests to verify RED**

Run: `npm test`  
Expected: missing projection API.

**Step 3: Implement piecewise projection**

Add:

- `createScale(start, end, mode, breakpoint, deepWeight)`
- `projectYear(year, scale)`
- `unprojectYear(percent, scale)`
- `ticks(scale, targetCount)`
- `recommendedStep(scale)`

Overview uses 30% width for `-20000…-3500` and 70% for `-3500…1600`. Deep and historical modes use a linear projection within their window.

**Step 4: Delegate legacy calls through the scale**

Extend `timeline.yearToPercent` to accept either `(year, start, end)` for backward compatibility or `(year, scale)` for the new UI.

**Step 5: Run tests to verify GREEN**

Run: `npm test`  
Expected: all tests pass.

**Step 6: Commit**

```bash
git add chronology.js timeline.js tests/run-tests.js
git commit -m "feat: add deep-time scale projection"
```

## Task 3: Define and validate the academic record schema

**Files:**
- Create: `academic-data.js`
- Create: `data-quality.js`
- Modify: `data.js`
- Modify: `index.html`
- Modify: `tests/run-tests.js`

**Step 1: Write failing schema tests**

Test a small fixture and the real dataset:

```js
const issues = quality.validateReviewedTrack(reviewedFixture, sources, { start: -20000, end: 1600 });
assert.deepStrictEqual(issues, []);
assert.ok(quality.validateReviewedTrack(missingSourcesFixture, sources, range).some(i => i.code === 'missing-source'));
assert.ok(quality.validateReviewedTrack(yearZeroFixture, sources, range).some(i => i.code === 'year-zero'));
```

Assert unique period/event IDs, required dating metadata, exact source URLs, valid source tiers, valid type taxonomy, and all three inline locales.

**Step 2: Run tests to verify RED**

Run: `npm test`  
Expected: modules do not exist.

**Step 3: Implement `data-quality.js`**

Expose pure validators:

- `validateSources(sources)`
- `validateReviewedTrack(track, sources, range)`
- `validateDataset(data)`
- `isGenericHomepage(url)`

Allowed types are:

```js
['archaeological-culture', 'site', 'polity', 'regional-sequence', 'network', 'tradition']
```

Legacy `civilization` records remain permitted only when `reviewStatus === 'legacy'`.

**Step 4: Create the academic data shell**

Create a UMD module exporting:

```js
{ sources: {}, tracks: [], patches: {}, scale: { breakpoint: -3500, deepWeight: 0.30 } }
```

**Step 5: Merge academic records in `data.js`**

- Change range start to `-20000`.
- Add `scale` metadata.
- Mark unreviewed existing tracks as `reviewStatus: 'legacy'`.
- Merge exact sources, patches, and new reviewed tracks.
- Preserve the existing public export shape.

**Step 6: Add browser script order**

Load `academic-data.js` before `data.js`, and `data-quality.js` before application boot.

**Step 7: Run tests to verify GREEN**

Run: `npm test`  
Expected: all tests pass with an empty reviewed corpus.

**Step 8: Commit**

```bash
git add academic-data.js data-quality.js data.js index.html tests/run-tests.js
git commit -m "feat: add evidence-aware data schema"
```

## Task 4: Add the reviewed source registry

**Files:**
- Modify: `academic-data.js`
- Modify: `tests/run-tests.js`
- Modify: `README.md`

**Step 1: Write failing source tests**

Assert the source registry contains exact, structured records for the initial corpus. Minimum required source families:

- Xianrendong early pottery peer-reviewed article/DOI
- East Asian Neolithic peer-reviewed or scholarly museum chronologies
- Liangzhu UNESCO nomination/official chronology
- Natufian and Pre-Pottery Neolithic academic sources
- Göbekli Tepe, Jericho, Çatalhöyük official excavation or peer-reviewed sources
- Nile/Predynastic Egypt scholarly museum chronology
- Mehrgarh/Indus scholarly chronology
- European Upper Palaeolithic/Mesolithic academic synthesis
- late Pleistocene Americas peer-reviewed evidence
- Sahul settlement peer-reviewed evidence
- Korean National Museum/Met scholarly chronology
- Met scholarly essays for Uruk and Chinese dynastic transitions

For each required ID, assert `tier`, `kind`, `title`, `publisher`, `year`, and an exact HTTPS DOI/page URL.

**Step 2: Run tests to verify RED**

Run: `npm test`  
Expected: required source IDs are missing.

**Step 3: Add verified source records**

Record accessed date `2026-07-15`. Do not use generic institutional landing pages for reviewed claims.

**Step 4: Document the evidence policy**

Add a concise “Evidence and uncertainty” section to `README.md` linking to the full design specification.

**Step 5: Run tests to verify GREEN**

Run: `npm test`  
Expected: source validation passes.

**Step 6: Commit**

```bash
git add academic-data.js README.md tests/run-tests.js
git commit -m "data: add reviewed chronology sources"
```

## Task 5: Correct Sumer, China, and Korea

**Files:**
- Modify: `academic-data.js`
- Modify: `i18n.js`
- Modify: `tests/run-tests.js`

**Step 1: Write failing editorial tests**

Assert:

```js
const china = data.tracks.find(t => t.id === 'china');
assert.ok(china.periods.some(p => p.id === 'china-three-kingdoms' && p.start === 220 && p.end === 280));
assert.ok(china.periods.some(p => p.id === 'china-northern-southern-dynasties'));

const korea = data.tracks.find(t => t.id === 'korea');
assert.ok(korea.periods.some(p => /Goguryeo|Когурё/.test(p.copy.en.name + p.copy.ru.name)));
assert.ok(korea.periods.every(p => p.name !== 'Три царства'));

const sumer = data.tracks.find(t => t.id === 'sumer');
assert.ok(!/oldest|древнейш|最古/i.test(JSON.stringify(sumer)));
assert.ok(!sumer.periods.some(p => /Uruk|Урук|乌鲁克/.test(JSON.stringify(p))));
assert.ok(data.tracks.some(t => t.id === 'uruk' && t.type === 'site'));
```

Assert all patched periods/events have exact sources and dating metadata.

**Step 2: Run tests to verify RED**

Run: `npm test`  
Expected: missing Chinese sequence and bare Korean label.

**Step 3: Add reviewed patches**

- Sumer: start at Early Dynastic city-states; keep Uruk as a separate site/urban process.
- China: Shang, Zhou, Qin, Han, Chinese Three Kingdoms, Jin/Sixteen Kingdoms, Northern and Southern Dynasties, Sui, Tang, Five Dynasties, Song/Liao/Jin, Yuan, Ming.
- Korea: make “Korean Three Kingdoms — Goguryeo, Baekje, Silla” explicit; describe Unified Silla and Balhae; retain Goryeo and Joseon.
- Add all RU/EN/ZH inline copy.

**Step 4: Teach localization to prefer inline copy**

Update `i18n.localizeData` so reviewed records can carry `copy.ru`, `copy.en`, and `copy.zh`, while legacy records continue using the existing translation tables.

**Step 5: Run tests to verify GREEN**

Run: `npm test`  
Expected: editorial and localization tests pass.

**Step 6: Commit**

```bash
git add academic-data.js i18n.js tests/run-tests.js
git commit -m "data: correct East Asian and Sumer chronology"
```

## Task 6: Add the balanced reviewed deep-time corpus

**Files:**
- Modify: `academic-data.js`
- Modify: `atlas-data.js`
- Modify: `tests/run-tests.js`

**Step 1: Write failing coverage tests**

Require reviewed deep-time records in at least seven macroregions, including:

- `xianrendong` or equivalent early pottery context
- `jomon`
- `liangzhu`
- `natufian`
- `gobekli-tepe`
- `catalhoyuk`
- `predynastic-egypt`
- `mehrgarh`
- a European Late Upper Palaeolithic/Mesolithic sequence
- a late Pleistocene Americas evidence track marked approximate/disputed as appropriate
- `sahul-continuity` with `continuesBeforeRange: true`
- `lapita`

Assert no track name uses a modern nation as the owner of prehistoric evidence, and every reviewed record has complete copy, geography, sources, and dating metadata.

**Step 2: Run tests to verify RED**

Run: `npm test`  
Expected: corpus IDs are missing.

**Step 3: Add reviewed records**

Keep the corpus selective. Use neutral names and notes such as “present-day China” only as geography. Mark evidence interpretation and wide chronology explicitly.

**Step 4: Add atlas centers**

Add one to three dated centers per new track. Geography dates must intersect track periods and respect the 20,000 BCE range.

**Step 5: Update aggregate statistics**

Change atlas grouping from civilization/tradition to:

- `societies`: all non-tradition types
- `traditions`: tradition

Keep legacy compatibility aliases in the model for one release.

**Step 6: Run tests to verify GREEN**

Run: `npm test`  
Expected: corpus, source, localization, and geography validation passes.

**Step 7: Commit**

```bash
git add academic-data.js atlas-data.js atlas.js tests/run-tests.js
git commit -m "data: add balanced deep-time chronology"
```

## Task 7: Add scale controls and evidence-aware timeline rendering

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `explorer-state.js`
- Modify: `tests/run-tests.js`

**Step 1: Write failing DOM/state tests**

Assert:

- the page contains an accessible mode group with Overview, Deep time, Historical time;
- URL state parses/serializes `scale=overview|deep|historical`;
- invalid scale values fall back safely;
- the HTML includes the “earliest shown ≠ first civilization” note;
- rendered period markup exposes precision and review status;
- Overview markup can render a breakpoint.

**Step 2: Run tests to verify RED**

Run: `npm test`  
Expected: controls and state are missing.

**Step 3: Add semantic controls**

Add a segmented button group above presets and a short explanatory note. Use native buttons with `aria-pressed`.

**Step 4: Integrate scale state**

- Add `scaleMode` to application defaults and URL state.
- Switching mode updates range, slider step, ticks, playback step, and active preset.
- Range editing can create a custom linear scale without losing the selected year.

**Step 5: Render through the new projection**

- Replace direct linear `yearToPercent` calls with a current scale object.
- Render breakpoint only in Overview.
- Generate ticks through `chronology.ticks`.
- Show open range edges and precision markers.

**Step 6: Show evidence in details**

For each period/event render:

- normalized date/range;
- precision label;
- dating basis;
- original notation when present;
- exact source links;
- track review-status badge.

**Step 7: Style desktop and mobile states**

Add compact controls, breakpoint label, open-edge treatment, precision badges, reviewed/provisional/legacy badges, and a readable source list.

**Step 8: Run tests to verify GREEN**

Run: `npm test`  
Expected: all tests pass.

**Step 9: Commit**

```bash
git add index.html app.js styles.css explorer-state.js tests/run-tests.js
git commit -m "feat: add evidence-aware deep-time explorer"
```

## Task 8: Complete RU/EN/ZH interface localization and CSV provenance

**Files:**
- Modify: `i18n.js`
- Modify: `timeline.js`
- Modify: `app.js`
- Modify: `tests/run-tests.js`

**Step 1: Write failing localization/export tests**

Require all three locales for:

- scale modes;
- new track types;
- precision states;
- dating bases;
- review states;
- breakpoint and earliest-shown notes;
- source and original-notation labels;
- society/tradition statistics.

Assert CSV includes `Precision`, `Dating basis`, `Review status`, and `Sources` (localized header names) and source URLs.

**Step 2: Run tests to verify RED**

Run: `npm test`  
Expected: missing keys and columns.

**Step 3: Add interface copy**

Add concise RU/EN/ZH wording. Avoid “civilization” as the umbrella term in new controls.

**Step 4: Extend CSV export**

Export one row per period with normalized dates, original notation, precision, dating basis, review state, and joined exact source URLs.

**Step 5: Run tests to verify GREEN**

Run: `npm test`  
Expected: all localization and export tests pass.

**Step 6: Commit**

```bash
git add i18n.js timeline.js app.js tests/run-tests.js
git commit -m "feat: localize evidence and provenance UI"
```

## Task 9: Adapt the live atlas and editorial comparisons

**Files:**
- Modify: `atlas.js`
- Modify: `atlas-view.js`
- Modify: `insights.js`
- Modify: `app.js`
- Modify: `tests/run-tests.js`

**Step 1: Write failing atlas tests**

Test a deep-time year with multiple regions, non-polity track types, localized insight copy, and no legacy `civilizations` dependency.

**Step 2: Run tests to verify RED**

Run: `npm test`  
Expected: old aggregation model fails.

**Step 3: Update atlas model and view**

- Aggregate `societies` and `traditions`.
- Render type labels for archaeological cultures, sites, polities, regional sequences, networks, and traditions.
- Preserve keyboard-accessible region and track controls.

**Step 4: Add a small reviewed deep-time insight set**

Use process comparisons rather than national comparisons. Only publish an insight when all referenced records are active and all source IDs resolve.

**Step 5: Run tests to verify GREEN**

Run: `npm test`  
Expected: all atlas tests pass.

**Step 6: Commit**

```bash
git add atlas.js atlas-view.js insights.js app.js tests/run-tests.js
git commit -m "feat: synchronize deep time with live atlas"
```

## Task 10: Static, browser, and deployment verification

**Files:**
- Modify: `scripts/validate.sh`
- Modify: `.github/workflows/deploy-pages.yml` if asset list is explicit
- Modify: `README.md`

**Step 1: Add failing static checks**

Require new modules in the Pages artifact and run dataset validation from Node.

**Step 2: Run validation to verify RED**

Run: `npm run validate`  
Expected: new asset/module checks fail until the script is updated.

**Step 3: Update validation and documentation**

- Add new files to static asset checks and Pages artifact assembly.
- Update counts, range, taxonomy, academic caveats, and source policy in README.

**Step 4: Run full automated verification**

```bash
npm test
npm run validate
git diff --check
```

Expected: all commands pass.

**Step 5: Run local browser verification**

Serve the worktree and inspect at desktop and mobile widths:

```bash
python3 -m http.server 8080
```

Verify RU/EN/ZH, scale switching, 20,000 BCE, the 3500 BCE breakpoint, 1 BCE/1 CE playback, exact sources, filters, details, map, URL restoration, CSV, keyboard interaction, and no console errors.

**Step 6: Commit**

```bash
git add scripts/validate.sh .github/workflows/deploy-pages.yml README.md
git commit -m "chore: validate academic deep-time release"
```

## Task 11: Review, integrate, and deploy

**Files:** None unless review finds issues.

**Step 1: Review the complete diff**

Run a focused review for data integrity, year-zero behavior, missing localization, accessibility, and Pages paths.

**Step 2: Re-run verification after review fixes**

```bash
npm test
npm run validate
git status --short
```

**Step 3: Merge to `main`**

From the main worktree, use a non-destructive merge after confirming it is still clean and current.

**Step 4: Push and watch Pages**

```bash
git push origin main
gh run list --workflow deploy-pages.yml --limit 1
gh run watch <run-id> --exit-status
```

**Step 5: Verify production**

Open `https://agent-axiom.github.io/parallel-worlds/`, confirm the deployed commit and run the critical desktop/mobile smoke checks.
