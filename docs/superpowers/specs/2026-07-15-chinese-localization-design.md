# Simplified Chinese localization design

## Goal

Add complete Simplified Chinese localization (`zh-CN`) to Parallel Worlds and replace the binary RU/EN switch with an extensible language selector.

## Architecture

Extend the existing dependency-free `i18n.js` contract. The canonical dates and IDs remain in `data.js`; Chinese interface copy, regions, presets, track names, summaries, periods, notes, and events are selected through stable IDs.

Three options were considered:

1. A separate Chinese site would duplicate the application and inevitably drift.
2. Lazy-loaded locale packs would reduce the initial transfer, but add asynchronous state and error handling for a site whose complete assets are still small.
3. Extending the current locale layer keeps the deployment atomic and offline-friendly. This is the selected approach.

If a fourth content-complete locale is added, translations should move into independent locale packs while keeping the same API.

## Language selection

- Replace the two-language button with a compact native selector containing `RU`, `EN`, and `中文`.
- Accept `?lang=ru`, `?lang=en`, and `?lang=zh`.
- Normalize `zh-CN`, `zh-SG`, and generic `zh` to `zh`; other unsupported locales continue to fall back to English.
- Persist the selection in local storage and preserve all other URL state.
- Use `<html lang="zh-CN">` in Chinese mode.

## Chinese conventions

- Use Simplified Chinese terminology.
- Render historical eras as `公元前753年` and `公元1453年`.
- Translate interface copy, historical data, search corpus, detail cards, tooltips, region and preset names, and CSV headers and values.
- Preserve institutional source titles in their published form.

## Language roadmap

Do not add more complete translations without evidence of demand and a review owner. Record a proposed order:

1. Spanish — broad global reach and strong relevance to Mesoamerican and Andean content.
2. Arabic — strong relevance to West Asian, North African, and Islamic history.
3. Portuguese — large audience and regional relevance to the Americas.
4. Hindi, Japanese, Korean, and Traditional Chinese — prioritize when analytics or community contributions justify native review.

The trigger for another locale is either 10%+ traffic from the corresponding browser language, repeated user requests, or a committed native-language reviewer.

## Verification

Automated tests validate Chinese coverage for all 49 tracks, 196 periods, 147 events, existing notes, Chinese search, era formatting, CSV localization, supported locale metadata, and the language selector. Browser checks cover direct `?lang=zh`, switching among all three languages, search, a detail card, desktop/mobile overflow, and console output.

## Acceptance criteria

1. Chinese mode contains no Russian or English fallback in the historical dataset.
2. RU and EN behavior remains unchanged.
3. The selector and shared Chinese URL work after reload.
4. The language roadmap provides actionable criteria rather than committing to unsupported translations.
5. GitHub Pages publishes and serves the verified commit.
