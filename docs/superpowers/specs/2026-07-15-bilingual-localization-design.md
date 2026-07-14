# Bilingual localization design

## Goal

Add complete Russian and English localization to the existing static timeline and prepare concise launch posts in both languages.

## Chosen approach

Keep one HTML application and one canonical historical dataset. Add `i18n.js` as a translation layer keyed by the stable track IDs already present in `data.js`. The module owns interface copy, region and preset labels, English track names, summaries, periods, notes, and events.

This avoids two fragile alternatives: duplicating the whole site into `/ru` and `/en`, or rewriting every canonical data value as a nested language object. Both would make the existing dataset and tests harder to maintain.

## Language behavior

- The language button in the top navigation switches between RU and EN.
- `?lang=ru` and `?lang=en` are shareable and take precedence.
- Without a URL parameter, a saved preference is used; otherwise the browser language selects RU for Russian browsers and EN for others.
- The selected language updates `<html lang>`, title, meta description, all visible interface copy, historical data, date notation, search, detail dialogs, empty states, tooltips, and CSV export.
- All other URL state remains intact when language changes.

## Content posts

Create `docs/posts/launch-ru.md` and `docs/posts/launch-en.md`. Each post is short enough for a blog, Telegram channel, LinkedIn, or similar feed and includes direct links to the public site and source repository.

## Verification

Automated tests validate translation completeness for all 49 tracks, 196 periods, and 147 events; locale fallback; BCE/CE formatting; bilingual search; required assets; and post links. Browser checks cover language switching, URL persistence, localized search, dialog content, CSV naming, console errors, and mobile overflow.

## Acceptance criteria

1. No historical item falls back to Russian in English mode.
2. Both languages expose all existing features and data.
3. A shared English URL reopens in English.
4. RU and EN launch posts are ready to copy and publish.
5. GitHub Pages deploys the verified commit successfully.
