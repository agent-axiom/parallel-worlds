# Academic Deep-Time Timeline Design

**Date:** 2026-07-15
**Status:** Approved for implementation
**Product:** Parallel Worlds

## 1. Purpose

Parallel Worlds will become an academically transparent comparative chronology spanning 20,000 BCE–1600 CE. The redesign must answer two different questions without conflating them:

1. What archaeological cultures, settlements, networks, states, and traditions coexisted?
2. How certain are the dates and what evidence supports them?

The site must not imply that the first row is the “oldest civilization.” Early pottery, sedentism, farming, cities, writing, state formation, and durable religious traditions are separate processes that appeared at different times and places.

## 2. Editorial principles

- Use archaeological and historical categories appropriate to the evidence. Do not call every prehistoric sequence a civilization.
- Prefer geographic descriptions to modern national ownership for prehistory: for example, “Lower Yangtze, in present-day China.”
- Allow concurrent entities inside the same macroregion. A regional sequence is not a single dynasty-shaped line.
- Treat agriculture, pottery, metallurgy, writing, and urbanization as processes or events, not peoples.
- Show uncertainty instead of hiding it behind a single exact year.
- Preserve original dating notation where useful (`cal BP`, `cal BCE`, traditional dates) and provide a normalized BCE/CE interval for comparison.
- Explain that a visible start date is the boundary of the selected range or of available evidence, not proof that a people suddenly appeared.
- Keep regional coverage balanced. New detail is published in cross-regional batches, not as an isolated expansion of one modern country.

## 3. Chronological architecture

### 3.1 Canonical range

- Start: 20,000 BCE
- End: 1600 CE
- There is no year zero in display, navigation, export, or URL state.

Dates remain stored as signed historical years for compatibility: negative values are BCE, positive values are CE, and zero is invalid. Shared helpers normalize slider steps across the BCE/CE boundary.

### 3.2 Two synchronized scales

The full 21,600-year range cannot use a useful linear scale. The interface therefore exposes two named views:

- **Deep time:** 20,000–3500 BCE, visually compressed and optimized for millennial-scale archaeological change.
- **Historical time:** 3500 BCE–1600 CE, optimized for centuries, dynasties, states, and written traditions.

The default overview uses a continuous piecewise projection with a visible breakpoint at 3500 BCE. Deep time receives 30% of the horizontal width and historical time 70%. The projection is reversible, so pointer position, year slider, map, cards, and shared links remain synchronized.

Presets can switch to a purely linear deep-time or historical window. The breakpoint is a navigation device, not a claim that “history began” everywhere in 3500 BCE.

### 3.3 Boundary behavior

- `-1` is followed by `1`.
- Playback and keyboard navigation skip `0`.
- Inclusive period boundaries are retained for the existing UI, but adjacent editorial periods should avoid semantic overlap unless the overlap is historically intentional.
- Records continuing before 20,000 BCE use `continuesBeforeRange: true`; the rendered bar begins at the range boundary with an open leading edge.

## 4. Data ontology

### 4.1 Track types

The legacy two-type model (`civilization`, `tradition`) is replaced by explicit categories:

| Type | Meaning | Example |
|---|---|---|
| `archaeological-culture` | Material-culture complex or archaeological phase | Liangzhu |
| `site` | Settlement, ritual center, or urban center | Göbekli Tepe, Uruk |
| `polity` | State, kingdom, empire, dynasty, or confederation | Shang, Goguryeo |
| `regional-sequence` | Broad sequence used when finer attribution is not justified | Nile Valley Late Pleistocene |
| `network` | Migration, exchange, or interaction horizon | Lapita |
| `tradition` | Religious or philosophical tradition | Buddhism |

Interface summaries may group the first five as “societies and archaeological records,” but the underlying type remains visible.

### 4.2 Track, period, and event records

Every published record has a stable ID and a review state.

```js
{
  id: 'liangzhu',
  type: 'archaeological-culture',
  region: 'east-asia',
  reviewStatus: 'reviewed',
  periods: [{
    id: 'liangzhu-main',
    start: -3300,
    end: -2300,
    dating: {
      precision: 'range',
      basis: 'archaeological-chronology',
      original: 'ca. 3300–2300 BCE'
    },
    sourceIds: ['unesco-liangzhu-2019']
  }],
  events: [{
    id: 'liangzhu-urban-centre',
    year: -3000,
    dating: { precision: 'approximate', basis: 'archaeological-chronology' },
    sourceIds: ['unesco-liangzhu-2019']
  }]
}
```

Required dating fields:

- `precision`: `exact`, `approximate`, `range`, `traditional`, or `disputed`
- `basis`: `historical`, `archaeological-chronology`, `radiocarbon`, `dendrochronology`, `stratigraphy`, or `traditional`
- `original`: optional source notation, especially for calibrated radiocarbon ranges
- `startMin`, `startMax`, `endMin`, `endMax`: optional uncertainty envelope when the evidence supports it

Required provenance fields:

- Every period and event has one or more `sourceIds`.
- A track has `reviewStatus: reviewed | provisional | legacy`.
- New records cannot be `reviewed` without record-level sources and dating metadata.
- Legacy content remains available during migration but is visibly labeled and cannot be presented as fully audited.

### 4.3 Source registry

Sources are first-class structured records:

```js
{
  id: 'nature-xianrendong-2012',
  tier: 'A',
  kind: 'peer-reviewed-article',
  title: 'Early Pottery at 20,000 Years Ago in Xianrendong Cave, China',
  authors: ['X. Wu', 'C. Zhang', 'P. Goldberg', '...'],
  publisher: 'Science',
  year: 2012,
  url: 'https://doi.org/10.1126/science.1218643',
  accessed: '2026-07-15'
}
```

Evidence tiers:

- **A:** peer-reviewed research, excavation reports, scholarly museum chronologies, official heritage dossiers with a documented chronology.
- **B:** university-press or specialist academic syntheses.
- **C:** reputable educational overviews used only for orientation; they cannot be the sole basis for a reviewed date.

Search snippets, unsourced timelines, blogs, and general encyclopedias are discovery aids only. Source links must resolve to the exact article, catalogue, chronology, or dossier rather than a generic institution homepage.

## 5. First reviewed release corpus

The first release establishes a balanced deep-time spine and fixes the highest-impact historical problems.

### 5.1 Cross-regional deep-time spine

- East Asia: Xianrendong/Yuchanyan early pottery context; Incipient and Early Jōmon; Shangshan/Jiahu; Peiligang/Cishan; Hemudu/Yangshao; Hongshan/Dawenkou; Liangzhu/Longshan.
- West Asia and Anatolia: Epipalaeolithic/Natufian; Pre-Pottery Neolithic; Göbekli Tepe; Jericho; Çatalhöyük; Ubaid; Uruk.
- Africa: Nile Valley late Pleistocene and early Holocene sequences; Nabta Playa; Predynastic Egypt.
- South Asia: South Asian forager sequences where the chronology is sufficiently sourced; Mehrgarh; Indus sequence.
- Europe: Late Upper Palaeolithic; Mesolithic regional sequences; Neolithic farming dispersal; selected Copper and Bronze Age horizons.
- Americas: late Pleistocene settlement evidence presented with explicit uncertainty; Archaic regional sequences; early monumental centres; later Mesoamerican and Andean tracks.
- Oceania: Sahul continuity at the range boundary and later Holocene interaction/migration horizons, including Lapita where applicable.

This is a comparative sample, not a claim of exhaustive representation.

### 5.2 Priority corrections

- Rename and explain **Korean Three Kingdoms** as Goguryeo, Baekje, and Silla; distinguish it explicitly from the Chinese Three Kingdoms.
- Add **Chinese Three Kingdoms (220–280 CE)** and the subsequent Northern and Southern Dynasties/Six Dynasties sequence so the China track no longer jumps from Han to Sui.
- Add Liangzhu and other securely sourced pre-dynastic East Asian tracks rather than stretching a single “China” polity line backward.
- Separate Uruk urbanization from Sumerian city-states and remove any wording that calls Sumer “the oldest civilization.”
- Replace accidental row-order narratives with editorial grouping and neutral sorting.

## 6. Interface design

### 6.1 Scale controls

- A segmented control offers `Overview`, `Deep time`, and `Historical time`.
- A labeled breakpoint and short explanation appear in Overview.
- Slider granularity adapts to the visible window: 500/100 years in deep time and 100/20/1 years in historical windows.
- Year input and playback always skip year zero.

### 6.2 Evidence in context

- Periods and events show a compact precision badge (`≈`, range, traditional, disputed).
- The detail card includes dating basis, original notation, review status, and exact source links.
- A persistent note states: “Earliest shown does not mean first civilization.”
- Open-ended edges communicate continuity beyond the selected range.
- CSV export includes normalized dates, precision, dating basis, review status, and source URLs.

### 6.3 Comprehension and wow effect

- The live atlas remains synchronized with the year and uses the same evidence-aware records.
- At deep-time zoom, editorial callouts compare processes (pottery, sedentism, cultivation) rather than modern nations.
- At historical zoom, comparisons can reference contemporary polities and traditions.
- Density, color, and motion remain restrained; uncertainty and evidence must be easier to see than decoration.

## 7. Localization

Russian, English, and Simplified Chinese remain feature-complete. All new labels, type names, precision states, dating bases, explanatory notes, track text, periods, and events require all three locales before release.

Proper names use established scholarly forms in each language. Transliteration is not silently substituted for a localized historical name. Source titles remain in their publication language, with an optional localized description.

## 8. Validation and quality gates

Automated checks must reject:

- year `0` anywhere in canonical records;
- periods outside 20,000 BCE–1600 CE unless explicitly clipped with a continuation flag;
- invalid or reversed intervals;
- reviewed periods/events without dating metadata and source IDs;
- unknown, duplicate, or generic-homepage source IDs;
- missing RU/EN/ZH copy;
- geography ranges that do not intersect their track;
- insights that reference inactive tracks;
- historically sensitive ambiguous labels such as bare “Three Kingdoms.”

Browser verification covers desktop and mobile, all three locales, scale switching, presets, search, filters, detail sources, map synchronization, URL restoration, keyboard navigation, playback across 1 BCE/1 CE, and CSV export.

## 9. Migration and release strategy

1. Add the new chronology and source-validation modules without changing the visible dataset.
2. Make the range and projection evidence-aware and prove boundary behavior with tests.
3. Migrate the priority East Asian and Mesopotamian records plus the balanced deep-time spine.
4. Add visible review status for remaining legacy records.
5. Migrate localization, atlas geography, insights, and export.
6. Run automated and browser verification.
7. Merge and deploy only when the static validation workflow and GitHub Pages job pass.

## 10. Acceptance criteria

- The site navigates from 20,000 BCE to 1600 CE without a year-zero defect.
- Overview, Deep time, and Historical time are distinct, synchronized, and shareable.
- Xianrendong-era evidence can appear without being mislabeled as a Chinese state or civilization.
- Sumer is not presented as a universal “oldest civilization.”
- Korean and Chinese Three Kingdoms are both present and unambiguous.
- Every newly reviewed period and event exposes dating precision, basis, and exact sources.
- All new UI and content is complete in RU/EN/ZH.
- Existing core interactions, map behavior, accessibility, and Pages deployment continue to pass automated tests.
