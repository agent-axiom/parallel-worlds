# Parallel Worlds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать, проверить и опубликовать автономную сравнительную шкалу цивилизаций и религий.

**Architecture:** Статический HTML/CSS/JavaScript без шага сборки. Исторические данные и чистые функции отделены от DOM-контроллера, чтобы тестировать поведение в Node.js 12 и запускать тот же код на GitHub Pages.

**Tech Stack:** HTML5, CSS, ES2018 JavaScript, Node.js assertions, GitHub Actions, GitHub Pages.

---

### Task 1: Контракты данных и чистых функций

**Files:**
- Create: `tests/run-tests.js`
- Create: `timeline.js`
- Create: `data.js`

- [ ] Написать проверки для количества линий, обязательных цивилизаций, схемы периодов, фильтрации, координат и форматирования дат.
- [ ] Запустить `node tests/run-tests.js` и подтвердить падение из-за отсутствующих модулей.
- [ ] Реализовать минимальные чистые функции и структурированный набор данных.
- [ ] Повторить `node tests/run-tests.js`; ожидается строка `All tests passed`.

### Task 2: Пользовательский интерфейс

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`

- [ ] Добавить в тест обязательную семантическую структуру и ссылки на локальные ресурсы; подтвердить RED.
- [ ] Реализовать шапку, панель управления, шкалу, панель года, диалог и футер.
- [ ] Реализовать рендеринг, события управления, URL-состояние, тему и CSV.
- [ ] Запустить тесты; ожидается `All tests passed`.

### Task 3: Проверка и GitHub Pages

**Files:**
- Create: `scripts/validate.sh`
- Create: `.github/workflows/deploy-pages.yml`
- Create: `.nojekyll`
- Create: `README.md`

- [ ] Добавить проверку обязательных deployment-файлов; подтвердить RED.
- [ ] Реализовать локальный валидатор и Pages workflow с официальными Actions.
- [ ] Запустить `bash scripts/validate.sh`; ожидаются успешные JS-тесты и проверки структуры.
- [ ] Зафиксировать изменения в `main`, создать `agent-axiom/parallel-worlds`, отправить ветку и включить Pages.
- [ ] Дождаться успешного workflow и проверить публичный URL HTTP-запросом.

## Самопроверка плана

План покрывает все разделы утверждённого дизайна; имена файлов и интерфейсы согласованы. Заглушек и отложенных требований нет.
