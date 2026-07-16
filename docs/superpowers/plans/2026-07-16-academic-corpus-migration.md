# Academic Corpus Migration — Implementation Plan

> **Execution rule:** implement every behavior test-first, keep the audit deterministic, and commit after each green task.

**Goal:** ship the first source-backed corpus migration: reproducible audit, richer dating evidence, reviewed-only exploration, and nine corrected polity tracks in Russian, English, and Simplified Chinese.

**Architecture:** `academic-data.js` remains the reviewed-data layer over the inherited corpus in `data.js`. A new pure `academic-audit.js` computes coverage and issues from the assembled dataset; a small Node script serializes its deterministic result. Existing UI modules consume the richer optional dating fields without making them mandatory for legacy records.

**Stack:** dependency-free UMD JavaScript, Node test runner, static HTML/CSS, GitHub Pages Actions.

---

## Task 1: Validate the extended dating model

**Files:**

- Modify: `tests/run-tests.js`
- Modify: `data-quality.js`

1. Add failing tests for valid `confidence`, `calibrationCurve`, `model`, and `alternatives` metadata.
2. Add failing tests for invalid confidence, duplicate alternative IDs, reversed alternative ranges, year zero in alternatives, and a missing `disputeNote` when alternatives exist or precision is `disputed`.
3. Run `node tests/run-tests.js` and verify the new assertions fail in `validateDating`.
4. Extend `validateDating(dating, path, range)` with:

```js
var CONFIDENCE = ['high', 'medium', 'low'];

if (dating.confidence && CONFIDENCE.indexOf(dating.confidence) === -1) {
  issues.push(issue('invalid-confidence', path + '.dating.confidence', 'Unknown dating confidence'));
}
```

5. Validate every alternative with stable unique ID, non-zero in-range start/end, and `start < end`; require `disputeNote` where the schema says it is explanatory rather than optional.
6. Export `CONFIDENCE`, rerun the whole suite, and commit:

```bash
git add data-quality.js tests/run-tests.js
git commit -m "feat: validate chronology evidence"
```

## Task 2: Build the deterministic academic audit

**Files:**

- Create: `academic-audit.js`
- Modify: `tests/run-tests.js`

1. Add failing tests for a fixture containing one reviewed and one legacy track. Assert stable summary, coverage, one `legacy-track` warning, and no generated timestamp.
2. Add failing tests for an invalid reviewed record becoming an `error`, an inherited generic source becoming one `generic-source` warning, and repeat calls producing deep-equal output.
3. Run the suite and verify failure because `academic-audit.js` does not exist.
4. Implement a pure UMD module with `buildAudit(data)`. Reuse `data-quality.validateDataset`, count record-level source/dating coverage, and sort tracks, sources, and issues by stable IDs/paths.
5. Use one warning per legacy track and one per generic inherited source; do not emit hundreds of redundant legacy-record warnings.
6. Rerun the full suite and commit:

```bash
git add academic-audit.js tests/run-tests.js
git commit -m "feat: add deterministic academic audit"
```

## Task 3: Generate and package the audit asset

**Files:**

- Create: `scripts/build-academic-audit.mjs`
- Create/generated: `academic-audit.json`
- Modify: `scripts/validate.sh`
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `tests/run-tests.js`

1. Add a failing static-packaging test that requires `academic-audit.js` and `academic-audit.json` in validation and Pages copy lists.
2. Add a failing integration test that executes the build script and compares parsed JSON with `buildAudit(require('../data.js'))`.
3. Implement the Node script using `createRequire`, stable two-space JSON serialization, and a terminal newline.
4. Run `node scripts/build-academic-audit.mjs` to create the committed static artifact.
5. Add both assets to JavaScript checks and Pages packaging; run `bash scripts/validate.sh` twice to prove regeneration is clean and deterministic.
6. Commit:

```bash
git add academic-audit.js academic-audit.json scripts/build-academic-audit.mjs scripts/validate.sh .github/workflows/deploy-pages.yml tests/run-tests.js
git commit -m "build: publish academic audit"
```

## Task 4: Add reviewed-only filtering and persistent state

**Files:**

- Modify: `tests/run-tests.js`
- Modify: `timeline.js`
- Modify: `explorer-state.js`
- Modify: `index.html`
- Modify: `i18n.js`
- Modify: `app.js`

1. Add failing tests that `filterTracks(..., {type: 'reviewed'})` returns only `reviewStatus === 'reviewed'`, and that URL parse/serialize round-trips `type=reviewed`.
2. Add failing DOM/static assertions for a `reviewed` option and RU/EN/ZH label keys.
3. Run the suite and confirm failures.
4. Implement the new filter before ordinary type checks:

```js
if (filters.type === 'reviewed' && track.reviewStatus !== 'reviewed') return false;
```

5. Permit `reviewed` in explorer state, add the option and all three translations, and keep `legacy` based on review status rather than the obsolete `civilization` type.
6. Rerun and commit:

```bash
git add timeline.js explorer-state.js index.html i18n.js app.js tests/run-tests.js
git commit -m "feat: filter reviewed histories"
```

## Task 5: Expose richer evidence in details and CSV

**Files:**

- Modify: `tests/run-tests.js`
- Modify: `timeline.js`
- Modify: `app.js`
- Modify: `i18n.js`
- Modify: `styles.css`
- Modify: `index.html`

1. Add failing CSV assertions for confidence, chronology model, calibration curve, alternatives, and dispute note after existing evidence columns.
2. Add failing UI assertions that optional evidence fields render only when present, with complete RU/EN/ZH labels.
3. Add a failing static assertion that the method section links to `academic-audit.json`.
4. Run the suite and verify the new failures.
5. Extend `buildCsv` without changing the first seven columns. Serialize alternatives as stable readable ranges and labels.
6. Add compact semantic evidence rows in the detail dialog, a translated audit link, and responsive styling that wraps long dispute notes and URLs.
7. Rerun and commit:

```bash
git add timeline.js app.js i18n.js styles.css index.html tests/run-tests.js
git commit -m "feat: surface chronology evidence"
```

## Task 6: Add exact first-batch source records

**Files:**

- Modify: `tests/run-tests.js`
- Modify: `academic-data.js`

1. Add failing tests for the exact source IDs required by the nine-track source packs. Assert complete source metadata, exact HTTPS/DOI URLs, and no generic homepage.
2. Use only pages verified in the approved design and source review:
   - Egypt: `10.1126/science.1189395`, `10.1098/rspa.2013.0395`, and exact Met kingdom essays;
   - Akkad: Met, *The Akkadian Period (ca. 2350–2150 B.C.)*;
   - Babylonia: Met Old Babylonian and Kassite essays plus exact Babylon chronology;
   - Assyria: Met Old Assyrian essay and *Assyria, 1365–609 B.C.*;
   - Hittites: Met, *The Hittites*;
   - Persia: Encyclopaedia Iranica chronology and dynasty articles;
   - Greece: exact Met Bronze Age, Archaic, Classical, and Hellenistic essays;
   - Rome: exact Met Republic and Empire essays;
   - Byzantium: Met, *Byzantium (ca. 330–1453)*.
3. Run the suite and confirm source assertions fail.
4. Add metadata with `accessed: '2026-07-16'`, scholarly tier/kind, publisher, author where supplied, publication year, exact title, and exact URL.
5. Rerun and commit:

```bash
git add academic-data.js tests/run-tests.js
git commit -m "data: add first academic source packs"
```

## Task 7: Migrate Egypt, Akkad, Babylonia, and Assyria

**Files:**

- Modify: `tests/run-tests.js`
- Modify: `academic-data.js`
- Regenerate: `academic-audit.json`

1. Add failing contract tests for these four reviewed patches: academic type, RU/EN/ZH copy, stable period/event IDs, record-level `sourceIds`, dating metadata, and no generic source dependency.
2. Add chronology assertions for the corrected scopes:
   - Egypt follows the Bayesian and exact institutional kingdom ranges and does not merge the New Kingdom with every later dynasty;
   - Akkad is restricted to the c. 2350–2150 BCE Akkadian period rather than implying an empire from 2600 to 1800 BCE;
   - Babylonia distinguishes Old Babylonian, Kassite/Middle Babylonian, later dynasties, and Neo-Babylonian evidence;
   - Assyria distinguishes Old Assyrian evidence from the source-backed 1365–609 BCE Middle/Neo-Assyrian sequence and does not label later heritage as an Assyrian polity.
3. Run the suite and verify all four are still legacy.
4. Add factories that accept optional extended dating fields without mutating caller objects, then implement the four patches with concise localized notes explaining scope and uncertainty.
5. Regenerate the audit, rerun all tests, and commit:

```bash
git add academic-data.js academic-audit.json tests/run-tests.js
git commit -m "data: review northeast Africa and Mesopotamia"
```

## Task 8: Migrate Hittites and Persia

**Files:**

- Modify: `tests/run-tests.js`
- Modify: `academic-data.js`
- Regenerate: `academic-audit.json`

1. Add failing contract and chronology tests for both tracks.
2. Assert the Hittite polity begins with the source-backed rise around 1750/1650 BCE, separates imperial and post-imperial successor phases, and marks approximate conventional boundaries honestly.
3. Assert Persia separates Achaemenid, Arsacid/Parthian, and Sasanian rule, preserves the Seleucid gap, and uses an alternative/dispute note where competing Parthian starts are exposed.
4. Implement complete localized patches, regenerate the audit, rerun, and commit:

```bash
git add academic-data.js academic-audit.json tests/run-tests.js
git commit -m "data: review Anatolian and Iranian polities"
```

## Task 9: Migrate Greece, Rome, and Byzantium

**Files:**

- Modify: `tests/run-tests.js`
- Modify: `academic-data.js`
- Regenerate: `academic-audit.json`

1. Add failing contract and chronology tests for the three tracks.
2. Require Greek periods to distinguish Aegean Bronze Age, Archaic, Classical, and Hellenistic conventions with exact Met evidence and explicitly traditional dating for 776 BCE.
3. Require Roman periods to mark 753 BCE as traditional, 509 BCE as conventional/traditional rather than exact, and retain the attested 27 BCE imperial transition and 476 CE western boundary.
4. Require Byzantine periods to use the source-backed Early Byzantine, Middle Byzantine (843–1204), Latin occupation (1204–1261), and Late Byzantine (1261–1453) sequence; do not preserve the unsupported 610 boundary.
5. Implement localized patches, regenerate, and assert the release totals exactly `25 reviewed / 37 legacy`, `69 sourced periods`, `50 sourced events`, and `42 warnings`.
6. Rerun and commit:

```bash
git add academic-data.js academic-audit.json tests/run-tests.js
git commit -m "data: review Mediterranean polities"
```

## Task 10: Document, verify, and release the milestone

**Files:**

- Modify: `README.md`
- Modify: `DEPLOYMENT_TASK.md`
- Create: `docs/academic-method.md`

1. Add a failing documentation/static assertion for the accurate `25 reviewed / 37 legacy` disclosure and local audit build command.
2. In `docs/academic-method.md`, document evidence tiers, dating fields, audit interpretation, and the explicit later-batch scope; never describe the whole corpus as academically reviewed.
3. Run automated verification:

```bash
npm test
bash scripts/validate.sh
git diff --check
git status --short
```

4. Serve the static site locally and verify in the in-app browser:
   - RU, EN, and ZH;
   - `reviewed` and `legacy` filters;
   - one disputed/alternative chronology;
   - audit JSON link;
   - desktop and 390px mobile evidence layout;
   - no console errors.
5. Review the complete diff against the design spec and resolve every correctness or accessibility issue before the release commit.
6. Commit documentation and any verified fixes:

```bash
git add README.md DEPLOYMENT_TASK.md docs index.html app.js i18n.js styles.css tests/run-tests.js academic-audit.json
git commit -m "docs: publish academic migration status"
```

7. Follow the branch-finishing workflow: merge only after all gates pass, push `main`, watch the GitHub Pages workflow, and verify the published URL and audit asset return successfully.
