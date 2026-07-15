# Live Atlas design

## Goal

Turn Parallel Worlds into an immediately understandable, visually memorable exploration experience for a broad curious audience. The primary reaction should be: “I did not realize all of this was happening at the same time.”

The next release adds a living world atlas and makes it a synchronized peer of the existing comparative chronology. The experience remains a dependency-free static site on GitHub Pages.

## Product principles

1. **Understandable in five seconds.** The first screen shows a year, a world map, and the number of active historical tracks.
2. **Spectacle serves meaning.** Motion explains change through time instead of acting as decoration.
3. **Historical honesty over false precision.** The map uses cultural regions and centers rather than invented year-by-year imperial borders.
4. **Depth on demand.** The landing state stays simple; region, track, period, event, and source detail appear progressively.
5. **Shareable discoveries.** Every meaningful view has a stable URL.

## Direction and alternatives

Three directions were considered:

1. A living flat atlas balances clarity and spectacle for a general audience.
2. A cinematic 3D globe maximizes spectacle but reduces readability, mobile usability, and implementation simplicity.
3. A map placed above the existing timeline is the least disruptive but creates two disconnected exploration contexts.

The selected direction is the living flat atlas. The initial “map above timeline” structure was improved during design review: map and chronology become two synchronized modes of one explorer, so year, region, filters, search, and selection persist across the transition.

The visual tone remains light and editorial, with approximately a 60/40 balance in favor of clarity over cinematic intensity.

## Core experience

The primary interaction loop is:

1. The visitor lands on a world overview for a selected year.
2. Cultural regions with active tracks appear as soft fields of influence with one to three representative centers.
3. The visitor moves the year slider or explicitly starts Play mode.
4. Regions and centers gently appear, strengthen, and fade as their periods change.
5. The side card presents one editor-approved “unexpected contemporaries” comparison plus compact statistics.
6. Selecting a region opens its civilizations, traditions, periods, and nearby events without replacing the map.
7. Switching to Chronology preserves the same year, filters, region, and selected tracks and reveals them in the detailed timeline.

Play never starts automatically. A visitor can pause at any moment. With reduced-motion preferences enabled, state changes are immediate.

## Explorer layout

### Desktop

- A compact global header contains brand, search, language, sharing, and theme controls.
- The explorer header contains two modes: Map and Chronology.
- Map occupies the main canvas.
- The selected year and scope appear prominently over the map.
- A compact time rail sits along the bottom of the canvas.
- A right-side editorial panel contains the featured comparison, short explanation, statistics, and a link into the relevant tracks.
- Selecting a region replaces the editorial panel with region detail while retaining a clear back action.

### Mobile

- Map and Chronology remain separate full-width modes rather than being placed side by side.
- The editorial or region panel becomes a bottom sheet.
- The time rail stays reachable near the bottom edge but does not obscure map controls.
- Search, filters, and language remain available from the compact header.

## Cartographic model

The atlas uses a bundled responsive SVG world base without modern national borders or external map tiles.

Each historical track can define:

- one broad cultural region;
- one to three representative centers;
- optional period-specific center coordinates;
- a deliberately approximate visual extent;
- editorial notes when geographic interpretation is debated.

Influence fields are soft and non-exclusive. Overlap is allowed and expected. Their visual treatment must not imply a precise frontier, exclusive political control, population size, or comparative importance.

Tracks without reviewed geographic data remain present in Chronology and the active-year list but do not receive an invented position on the map.

## Editorial comparisons

The principal emotional hook is an editor-reviewed pair of contemporaries, for example two thinkers, societies, traditions, or events that occurred within an overlapping historical window.

The system is hybrid:

- deterministic overlap logic proposes candidates;
- an editor approves the pairs used in the main experience;
- each approved comparison stores its valid year range, referenced track IDs, localized title and explanation, and source IDs;
- the first release targets approximately 30 high-quality comparisons;
- if no comparison covers the selected year and filters, the panel falls back to active-track and region statistics.

Automatically generated historical claims are not shown directly to visitors.

## Architecture

The existing static-data architecture remains canonical.

### Components

- `data.js` continues to own track IDs, periods, events, types, regions, and sources.
- A new atlas data module owns reviewed centers and approximate regional extents keyed by stable track and period IDs.
- A new editorial comparison module owns approved contemporaries keyed by stable IDs and year ranges.
- Pure atlas projection functions compute active centers, region aggregates, comparison candidates, and selected detail from the canonical year and filters.
- A map renderer owns SVG state and accessible map interactions.
- The existing timeline renderer and new map renderer consume one shared application state.
- The localization layer receives every new interface string, geographic label, and editorial comparison in Russian, English, and Simplified Chinese.

If the translation corpus grows beyond the current three complete locales, locale dictionaries should be split into independent static packs without changing the public localization API.

### Shared state

The explorer state contains:

- `view`: map or chronology;
- selected year and visible range;
- search query;
- region and track type filters;
- selected track IDs;
- open panel state;
- zoom or map focus when it is useful to preserve.

URL state extends the current contract with parameters such as `view=map`, `year=-500`, and `focus=china,greece`. Invalid IDs are ignored. Years and numeric values are clamped to the dataset range. Local storage remains limited to preferences such as language and theme, not shareable historical state.

### Data flow

1. URL and saved preferences initialize the shared state.
2. Canonical historical data, reviewed atlas data, comparisons, and the selected locale are combined into a localized view model.
3. Active-track projection runs once per state change.
4. Map and Chronology render from the same projection and selection.
5. User interaction updates shared state, rewrites the URL, and rerenders only the affected view.
6. A mode switch changes presentation without recomputing or discarding the historical selection.

No external runtime API, network data request, account system, or backend is introduced.

## Accessibility and motion

- Every interactive center is keyboard reachable and has a localized accessible name.
- The map has a list-equivalent representation, so geographic discovery does not depend on pointer use or vision.
- Focus remains predictable when opening and closing region detail.
- Color is not the only signal for activity, type, or selection.
- Play is opt-in, has a visible pause action, and stops when the tab is hidden.
- `prefers-reduced-motion` removes animated transitions while preserving all information.
- Map and bottom-sheet layouts are verified at 390 px and common desktop widths.

## Failure and fallback behavior

- Missing atlas data: keep the track in lists and Chronology; omit its map geometry.
- Missing editorial comparison: show localized active-year statistics.
- Missing translation: fail the localization coverage test instead of silently publishing mixed-language editorial content.
- Invalid shared URL: ignore unknown IDs, clamp numbers, and retain a usable default view.
- SVG rendering failure: keep year controls, active-track list, and Chronology available.
- One malformed atlas record or comparison must be rejected by validation and must not break unrelated data.

## First-release scope

Included:

- synchronized Map and Chronology modes;
- bundled SVG world map;
- reviewed cultural regions and representative centers;
- manual year slider and opt-in Play/Pause;
- regional detail panel;
- approximately 30 editor-approved contemporaries comparisons;
- shareable explorer state;
- complete Russian, English, and Simplified Chinese copy;
- responsive, keyboard-accessible, reduced-motion behavior.

Excluded:

- precise year-by-year empire polygons;
- 3D globe or WebGL;
- user accounts and saved collections;
- visitor-facing AI-generated facts;
- comprehensive animated trade, migration, or intellectual routes;
- new languages without demand and a native-language review owner.

## Verification

Automated checks cover:

- atlas and comparison schema validation;
- stable references to tracks, periods, regions, and sources;
- active-center and region aggregation at boundary years;
- deterministic comparison selection and statistical fallback;
- Map/Chronology state preservation;
- URL serialization and round-trip parsing;
- complete RU, EN, and ZH interface, geography, and editorial copy;
- graceful handling of missing optional geography;
- existing filtering, timeline, CSV, and dataset behavior.

Browser checks cover:

- first-load comprehension on desktop and mobile;
- slider, Play/Pause, mode switch, region selection, and panel focus;
- keyboard-only operation;
- reduced-motion rendering;
- page-level overflow and map-specific panning;
- direct shared URLs and reload persistence;
- console errors;
- GitHub Pages subpath operation.

The release preserves the current no-runtime-dependency property and avoids external requests. Performance verification sets explicit budgets during implementation for the added SVG and localized editorial data.

## Follow-up roadmap

After the atlas is validated with real users:

1. Guided editorial journeys such as “The world in 500 BCE.”
2. A focused two-track comparison mode.
3. Carefully sourced trade, migration, and intellectual routes.
4. Embeddable and shareable visual snapshots for articles and lessons.

These follow-ups reuse the same shared state, reviewed geography, and editorial comparison model rather than introducing separate experiences.

## Acceptance criteria

1. A first-time visitor can identify the selected year, active world regions, and the principal comparison without instruction.
2. Map and Chronology preserve year, filters, region, and selected tracks when switching modes.
3. The atlas never presents approximate influence fields as exact political borders.
4. Play is user initiated and reduced-motion users receive equivalent information.
5. Missing optional geography or comparison data has a useful fallback.
6. New content is complete in Russian, English, and Simplified Chinese.
7. The site remains deployable as a static GitHub Pages artifact without external runtime dependencies.
