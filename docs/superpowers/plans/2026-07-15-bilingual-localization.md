# Bilingual Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Localize the full site and historical dataset in Russian and English, then publish bilingual launch copy.

**Architecture:** Add a dependency-free UMD localization module that creates localized views of the canonical data. Keep application state language-aware and render static and dynamic copy from the same locale dictionary.

**Tech Stack:** HTML5, CSS, ES2018 JavaScript, Node.js assertions, GitHub Actions, GitHub Pages.

---

### Task 1: Localization contract

**Files:**
- Modify: `tests/run-tests.js`
- Create: `i18n.js`
- Modify: `timeline.js`

- [ ] Add failing tests for locale normalization, translation completeness, English search, and BCE/CE formatting.
- [ ] Run `node tests/run-tests.js` and confirm failure because `i18n.js` is absent.
- [ ] Implement the UMD localization API and English historical overlay.
- [ ] Add locale-aware year and CSV formatting.
- [ ] Run tests and confirm the localization contract passes.

### Task 2: Language-aware application

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `scripts/validate.sh`

- [ ] Add failing static assertions for the `i18n.js` asset, language control, and translatable DOM hooks.
- [ ] Add the language switcher and localized DOM metadata.
- [ ] Make URL state, search, timeline, details, tooltips, and CSV use the active locale.
- [ ] Include `i18n.js` in local validation and the Pages artifact.
- [ ] Run `bash scripts/validate.sh` and confirm success.

### Task 3: Launch posts and deployment

**Files:**
- Create: `docs/posts/launch-ru.md`
- Create: `docs/posts/launch-en.md`
- Modify: `README.md`

- [ ] Add failing assertions for both post files and their public links.
- [ ] Write concise Russian and English launch posts.
- [ ] Document bilingual URLs in the README.
- [ ] Verify RU/EN on desktop and mobile in a browser.
- [ ] Commit, push `main`, watch the Pages workflow, and verify the live English URL.

## Self-review

The plan covers every design requirement with no placeholders. Translation arrays are validated against canonical period and event counts, preventing silent drift when the dataset changes.
