# Luminous Atlas and Adaptive Timeline Design

**Date:** 2026-07-15
**Status:** Approved visually; awaiting written-spec review

## 1. Purpose

Replace the schematic world silhouette and overcrowded timeline rows with a coherent visual system that is geographically recognizable, chronologically readable, and expressive without implying historical claims that the dataset does not support.

The approved direction is **B2 — Dynamic balance**:

- a dark luminous data-visualization map with controlled glow;
- an adaptive timeline that removes labels when a segment is too narrow instead of clipping text into visual noise;
- restrained motion and an academic interpretation of every visual connection.

## 2. Goals

- Use a recognizable, academically neutral world outline rather than hand-drawn continent polygons.
- Preserve the existing map's year selection, region selection, filtering, comparison, and localization behavior.
- Improve hierarchy between geography, active regions, the current year, and editorial comparisons.
- Make dense sequences such as China readable at normal zoom.
- Keep full names, dates, evidence, and sources accessible even when a label is hidden in the visualization.
- Keep the site static, dependency-free at runtime, and deployable through the existing GitHub Pages workflow.
- Preserve RU, EN, and ZH parity, keyboard access, reduced-motion behavior, and mobile usability.

## 3. Non-goals

- Historical political borders for every year.
- A draggable or zoomable GIS application.
- A 3D globe.
- Decorative trade routes, migrations, or cultural links that are not explicitly represented by reviewed data.
- A redesign of the detail dialog or the underlying historical chronology.

## 4. Map design

### 4.1 Geometry and projection

The coastline geometry will come from the public-domain **Natural Earth 1:110m Physical Vectors — Land, version 4.0.0**. A build-time script will simplify and project the geometry into the map's fixed SVG viewport. The generated path will be committed as a static asset; the browser will make no runtime request for map data.

The map will use an Equal Earth projection. Region and track centers will migrate from manually positioned `x`/`y` percentages to geographic `longitude`/`latitude` coordinates. A pure projection function will convert those coordinates into the same normalized SVG space as the coastline.

This ensures that:

- markers remain aligned with the map;
- coordinates are inspectable and testable;
- future sites can be added without manually guessing screen percentages;
- the projection can change without rewriting historical data.

### 4.2 Visual layers

From back to front:

1. Deep teal ocean with a subtle radial vignette.
2. Sparse latitude/longitude graticule at low opacity.
3. Graphite-teal land fill.
4. A thin cyan-green coastline plus a low-radius blurred duplicate for controlled glow.
5. Optional comparison connector for the currently displayed editorial insight.
6. Soft regional heat fields for active regions.
7. Compact count markers and region labels.
8. Year, status, and playback controls.

The coastline is always legible but never brighter than an active marker. The background grid is subordinate to land and disappears further on narrow screens.

### 4.3 Active and selected states

- Active regions use a warm amber-coral halo and compact count marker.
- A selected region gains stronger local illumination and a defined focus ring.
- Non-selected active regions remain visible but reduce in opacity when one region is selected.
- Region names appear when space permits. Mobile view keeps the numeric marker and exposes the full name through the accessible label and region panel.
- Marker size is bounded; a larger track count must not create an oversized circle that obscures neighboring geography.

### 4.4 Comparison connectors

A connector may appear only for the currently selected editorial comparison and only between the two referenced track centers.

It is explicitly a **comparison connector**, not a route or evidence of contact:

- the panel and accessible label describe it as a comparison;
- it uses a fine gradient line rather than arrows or moving particles;
- no connector is rendered for the general world overview;
- comparisons that lack two valid projected centers fall back to the text panel without a line.

### 4.5 Motion

- Active halos breathe through opacity and scale only.
- The selected marker may use one slow emphasis cycle after selection, then remain stable.
- Comparison connectors fade in; they do not animate along a path.
- `prefers-reduced-motion: reduce` disables all map animation.
- Mobile devices use reduced blur radii and omit nonessential glow layers.

## 5. Adaptive timeline design

### 5.1 Row structure

Each row has three visual lanes:

1. A wider sticky label column.
2. A narrow event lane above the periods.
3. A period lane with the current-year line behind its contents.

The label column uses `clamp(220px, 20vw, 300px)`. Track names may occupy two lines. Region and type remain secondary metadata below the name.

Events no longer share the vertical center of a period label. Their stems descend from the event lane to the relevant position without crossing text.

### 5.2 Label-density algorithm

The renderer classifies each visible period from its estimated pixel width after projection and zoom:

- **wide, 112 px or more:** full localized name;
- **medium, 64–111 px:** localized name with a single controlled ellipsis;
- **compact, 32–63 px:** no inline text; retain a small semantic segment;
- **node, below 32 px:** a clean minimum-width node with no inline text.

Thresholds are constants in a pure helper and are covered by tests. They may be adjusted during browser verification, but the categories and behavior are fixed.

Compact and node periods expose the full localized name, date range, precision, and dating basis through the shared tooltip. Clicking any segment opens the existing detail card and emphasizes the corresponding period entry.

### 5.3 Color and hierarchy

Period color follows track type instead of using one red fill for every line:

- archaeological culture — ochre;
- site or settlement — warm orange;
- polity or state — coral-red;
- regional sequence — teal;
- network or migration — blue;
- religious or philosophical tradition — muted violet;
- legacy civilization records — neutral brick.

Adjacent periods in one track alternate subtly in lightness. The alternation separates boundaries without inventing a new category.

The selected year adds a soft highlight to periods active in that year. Inactive rows reduce opacity slightly but remain readable. Focused comparison tracks retain full contrast.

### 5.4 Interaction and accessibility

- The existing track-label button remains the primary keyboard entry point and opens the full card.
- Periods are pointer targets and can receive roving focus within a row.
- Arrow Right from a focused track label enters the first visible period; Left and Right move between periods; Escape returns to the track label.
- Only one period per row may participate in the tab order at a time, preventing hundreds of additional tab stops.
- Tooltips open on pointer hover and keyboard focus and close on pointer exit, blur, Escape, range change, or locale change.
- Tooltip content is rendered from text, never injected as raw HTML.
- Hidden inline labels do not remove the information from the detail card or accessible period label.

### 5.5 Mobile behavior

- The sticky label column becomes narrower but still allows two lines.
- Compact and node labels never appear inside the segment.
- Tooltip content opens as a small anchored popover or through the detail card, not outside the viewport.
- The horizontal timeline may scroll internally, but the document itself must not overflow horizontally.
- Heavy glow and event stems are simplified to protect readability and rendering performance.

## 6. Architecture and component boundaries

### `world-map-data.js`

Generated, static Equal Earth coastline path and map metadata. It has no application logic.

### `scripts/build-world-map.mjs`

Reproducible build-time transformation from the pinned Natural Earth source file to the committed map asset. The downloaded source is not required at runtime. The script records dataset version, source URL, projection, and simplification settings.

### `atlas-data.js`

Stores longitude and latitude for regional anchors and track centers. Historical ranges remain unchanged.

### `atlas.js`

Owns pure geographic projection, active-region aggregation, comparison-center selection, and fallback behavior. It does not generate HTML.

### `atlas-view.js`

Generates the SVG layer structure, comparison connector, and accessible map markup. It receives already projected positions.

### `timeline.js`

Owns pure label-density classification and tooltip data formatting helpers. It remains independent of the DOM.

### `app.js`

Coordinates current state, rendering, roving focus, tooltip lifecycle, dialog emphasis, and localized UI strings.

### `styles.css`

Defines B2 visual tokens, map layers, type palette, row lanes, tooltip states, responsive adjustments, and reduced-motion behavior.

## 7. Data flow

### Map

1. Current filters and year determine active localized tracks.
2. `atlas.js` selects the centers whose historical ranges include the year.
3. Longitude and latitude are projected to normalized SVG coordinates.
4. Active centers aggregate into regional markers.
5. The selected editorial insight optionally contributes one comparison connector.
6. `atlas-view.js` renders coastline, connector, markers, and accessible labels.

### Timeline

1. Visible periods are clipped to the selected range.
2. The chronology scale produces start and end percentages.
3. Plot width and zoom produce an estimated segment width in pixels.
4. `timeline.js` assigns a density class.
5. `app.js` renders the appropriate text or node and binds tooltip/dialog behavior.

## 8. Failure and fallback behavior

- If map geometry is unavailable, render the graticule, active markers, region list, and existing textual fallback without a broken SVG.
- Invalid or non-finite geographic coordinates are skipped from the visual map but remain in the active-track and region lists.
- A comparison with fewer than two valid centers renders no connector.
- A period with a non-positive clipped width is not rendered; dataset validation continues to report the underlying issue.
- Tooltip positioning clamps to the atlas or timeline viewport.
- Reduced-motion and mobile fallbacks never remove information.

## 9. Localization

New interface strings will be complete in Russian, English, and Simplified Chinese:

- comparison-connector description;
- period tooltip labels;
- compact-period accessible description;
- selected-region and selected-period states.

Historical names continue to come from the existing localized records. No visual abbreviation may introduce a new untranslated label.

## 10. Performance constraints

- No runtime map fetch and no mapping framework.
- The generated coastline asset should remain below 120 KB uncompressed and below 45 KB compressed.
- Map animation changes only `opacity` and `transform` where possible.
- Large blur filters are disabled on narrow screens and under reduced motion.
- The complete static Pages artifact remains comfortably usable over a slow mobile connection.

## 11. Testing and acceptance criteria

### Automated

- Equal Earth projection returns finite, bounded coordinates for representative longitudes and latitudes.
- Every atlas center contains valid longitude and latitude and projects inside the viewport.
- Natural Earth map metadata and generated paths are present in the Pages artifact.
- Period widths classify correctly at all four density thresholds.
- Compact and node periods contain no clipped inline text.
- The timeline preserves no-year-zero positioning.
- Comparison connectors render only for an eligible selected insight with two valid centers.
- RU, EN, and ZH include every new UI key.
- Reduced-motion CSS disables map and timeline animation.

### Browser verification

- Desktop widths: 1440 and 1024 pixels.
- Mobile widths: 390 and 360 pixels.
- Light and dark themes.
- RU, EN, and ZH.
- Overview, Deep time, and Historical time.
- Dense China sequence, short transition periods, and a sparse track.
- Map overview, region selection, comparison selection, playback, and missing-connector fallback.
- Pointer hover, click, keyboard roving focus, Escape, and detail-card emphasis.
- No document-level horizontal overflow and no console errors.

### Visual acceptance

- Continents are immediately recognizable.
- Coastline glow is subordinate to active regions.
- The map has no decorative line that can be mistaken for historical contact.
- The China row no longer contains visibly clipped fragments or competing event markers.
- At normal zoom, wide periods are labeled and short periods become clean nodes.
- The map provides the stronger visual effect; the timeline remains the calmer analytical surface.

## 12. Map-data sources

- [Natural Earth 1:110m Physical Vectors — Land](https://www.naturalearthdata.com/downloads/110m-physical-vectors/110m-land/)
- [Natural Earth terms of use](https://www.naturalearthdata.com/about/terms-of-use/)

Natural Earth declares its raster and vector map data to be in the public domain. The generated asset will retain a short “Made with Natural Earth” credit in project documentation even though attribution is not required.
