# Simplified Chinese Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete Simplified Chinese site locale and an extensible three-language selector.

**Architecture:** Extend the existing UMD localization module with Chinese interface and historical overlays. Keep dates canonical, make locale metadata explicit, and use one synchronous static artifact for GitHub Pages.

**Tech Stack:** HTML5, CSS, ES2018 JavaScript, Node.js assertions, GitHub Actions, GitHub Pages.

---

### Task 1: Chinese localization contract

**Files:**
- Modify: `tests/run-tests.js`
- Modify: `i18n.js`
- Modify: `timeline.js`

- [ ] Add failing assertions for `zh` normalization, locale metadata, Chinese interface text, complete historical coverage, Chinese search, era notation, and CSV output.
- [ ] Run `node tests/run-tests.js`; expected failure: `zh-CN` normalizes to English.
- [ ] Add Simplified Chinese interface and all 49 historical translation overlays.
- [ ] Add Chinese era notation and expose supported locale metadata.
- [ ] Run tests; expected result: all localization assertions pass.

### Task 2: Extensible selector

**Files:**
- Modify: `tests/run-tests.js`
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`

- [ ] Add failing static assertions for `language-select` and its three options.
- [ ] Replace `language-button` with a native selector.
- [ ] Make initial locale, URL reading, local storage, DOM language, and change handling support RU/EN/ZH.
- [ ] Run `bash scripts/validate.sh`; expected result: all tests and syntax checks pass.

### Task 3: Language roadmap and deployment

**Files:**
- Create: `docs/LANGUAGE_ROADMAP.md`
- Modify: `README.md`

- [ ] Document the evidence threshold, proposed language order, and native-review requirement.
- [ ] Add the Chinese public URL and roadmap to the README.
- [ ] Browser-test `?lang=zh` at 1440×900 and 390×844, Chinese search, detail cards, and three-way switching.
- [ ] Merge to `main`, rerun validation, push, watch Pages deployment, and verify the public Chinese URL.

## Self-review

Every design requirement maps to a task. Translation arrays are checked against canonical counts, while the roadmap is explicitly advisory and does not expand implementation scope beyond Chinese.
