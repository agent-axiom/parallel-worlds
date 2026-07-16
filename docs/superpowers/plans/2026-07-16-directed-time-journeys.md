# Directed Time Journeys Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в «Параллельные миры» полноэкранное режиссёрское путешествие «Рождение городов» на 7 академически проверенных остановок с RU/EN/ZH, мягким автопереходом, исследовательской паузой, доступным управлением и ссылкой на конкретную остановку.

**Architecture:** Новые `journeys-data.js`, `journey.js` и `journey-view.js` образуют отдельный слой данных, чистой логики и DOM-представления. `app.js` остаётся тонким контроллером: синхронизирует остановку с существующим атласом, управляет диалогом и одним таймером. `academic-audit.js` валидирует каждый маршрут по каноническому корпусу и блокирует сборку при `legacy`, неточном источнике или несовместимой дате.

**Tech Stack:** Статический HTML/CSS, ES5-compatible UMD/CommonJS JavaScript, встроенные `dialog`, History API и Clipboard API, существующий тест-раннер Node `assert`, GitHub Actions Pages; ноль runtime-зависимостей и внешних запросов.

---

## Контекст и границы выпуска

- Рабочая ветка: `codex/directed-time-journeys`.
- Рабочее дерево: `/Users/if/Documents/parallel-worlds/.worktrees/directed-time-journeys`.
- Согласованный дизайн: `docs/superpowers/specs/2026-07-16-directed-time-journeys-design.md`.
- Базовая проверка перед началом: `npm test` — 66 тестов проходят.
- Первая версия выпускает **один** полностью законченный маршрут. Остальные темы из дизайн-спецификации остаются редакционным бэклогом и не появляются в каталоге.
- Исторические названия, даты, точность датирования и источники не дублируются в манифесте. Маршрут хранит только драматургию, длительность и ссылки на существующие записи.
- Любая ошибка маршрута является блокирующей. Публичный каталог получает только маршруты без ошибок валидации.

## Карта ответственности файлов

| Файл | Ответственность после доработки |
|---|---|
| `journeys-data.js` | Версионированный манифест и редакционный текст RU/EN/ZH |
| `journey.js` | Валидация, разрешение ссылок, локализация, автомат состояний и расчёт таймера |
| `journey-view.js` | Безопасный HTML каталога/сцены, focus trap, свайп и точечное обновление часов |
| `academic-audit.js` | Детерминированный отчёт о маршрутах и включение ошибок маршрута в blockers |
| `explorer-state.js` | Разбор и сериализация `journey`, `stop`, `journeyMode` |
| `app.js` | Оркестрация диалога, карты, состояния, таймера, share и восстановления атласа |
| `i18n.js` | Только системные подписи проигрывателя; авторский текст остаётся в манифесте |
| `index.html`, `styles.css` | CTA, полноэкранный shell, адаптивная сцена и reduced-motion |
| `tests/run-tests.js` | Unit и статические интеграционные проверки всего нового контура |
| `scripts/*`, workflow | Аудит, упаковка новых ассетов и блокировка ошибочного Pages-деплоя |

## Зафиксированный маршрут первого выпуска

Порядок остановок намеренно показывает разные процессы и не называет их одной линейной «ступенью цивилизации»:

| # | Stop ID | Year | Track | Record ref | Hold |
|---:|---|---:|---|---|---:|
| 1 | `xianrendong-pottery` | -18000 | `xianrendong` | event `xianrendong-pottery-evidence` | 15 000 ms |
| 2 | `gobekli-monuments` | -9500 | `gobekli-tepe` | event `gobekli-building` | 14 000 ms |
| 3 | `catalhoyuk-density` | -7400 | `catalhoyuk` | event `catalhoyuk-occupation` | 15 000 ms |
| 4 | `mehrgarh-food-production` | -7000 | `mehrgarh` | event `mehrgarh-food-production` | 15 000 ms |
| 5 | `uruk-urban-center` | -3200 | `uruk` | event `uruk-major-city` | 16 000 ms |
| 6 | `egypt-dynastic-model` | -3085 | `egypt` | event `egypt-aha-accession` | 16 000 ms |
| 7 | `liangzhu-regional-center` | -3000 | `liangzhu` | event `liangzhu-regional-state` | 16 000 ms |

`indus` не используется: эта линия пока имеет статус `legacy`. В согласованной спецификации она заменена на проверенный Мергарх.

### Контракт редакционного текста

Маршрут имеет `durationSeconds: 120` и следующий смысловой каркас во всех трёх локалях:

| Stop | RU headline / body | EN headline / body | ZH headline / body |
|---|---|---|---|
| xianrendong | `Керамика до городов` / `В Сяньжэньдуне керамические сосуды появились за тысячелетия до земледельческих городов. Технологическое новшество ещё не означает город или государство.` | `Pottery before cities` / `At Xianrendong, pottery vessels appeared millennia before farming cities. A technological innovation is not yet a city or a state.` | `城市之前的陶器` / `仙人洞的陶器比农业城市早了数千年。技术创新本身并不等于城市或国家。` |
| gobekli | `Монументы без города` / `Сообщества Гёбекли-Тепе создавали монументальные комплексы до появления привычной городской среды. Координация труда не требовала города позднейшего типа.` | `Monuments without a city` / `Communities at Göbekli Tepe built monumental complexes before familiar urban settings emerged. Coordinated labour did not require a city of the later kind.` | `没有城市的纪念性建筑` / `哥贝克力石阵的社群在熟悉的城市环境出现之前就建造了纪念性建筑群。协作劳动并不需要后世类型的城市。` |
| catalhoyuk | `Плотность без дворцов` / `Чатал-Хююк был крупным и плотным поселением, но его устройство не сводится к поздней модели улиц, дворцов и централизованной власти.` | `Density without palaces` / `Çatalhöyük was a large, dense settlement, but its organisation does not fit the later model of streets, palaces, and centralised rule.` | `没有宫殿的高密度聚落` / `恰塔霍裕克规模大且人口密集，但其组织方式并不符合后来由街道、宫殿和中央权力构成的模式。` |
| mehrgarh | `Производящая экономика — не один маршрут` / `В Мергархе земледелие, скотоводство и оседлая жизнь складывались в собственной региональной последовательности. Путь к сложности не был единым.` | `Food production was not one path` / `At Mehrgarh, farming, herding, and settled life formed their own regional sequence. There was no single route to complexity.` | `生产经济并非单一路径` / `在梅赫尔格尔，农业、畜牧与定居生活形成了自身的区域序列。复杂社会并不存在唯一道路。` |
| uruk | `Город как новая концентрация` / `Урук соединял большое население, монументальные институты и хозяйственный учёт. Здесь городской масштаб проявляется как сочетание процессов, а не один признак.` | `A city as a new concentration` / `Uruk combined a large population, monumental institutions, and economic record-keeping. Urban scale appears here as a combination of processes, not one trait.` | `城市是一种新的集中` / `乌鲁克汇集了大量人口、纪念性制度与经济记录。城市规模在这里是多种过程的组合，而非单一特征。` |
| egypt | `Государство и модельная дата` / `Раннединастический Египет показывает иной масштаб политического объединения. Дата восшествия Аха — хронологическая модель, а не наблюдённый день основания.` | `A state and a modelled date` / `Early Dynastic Egypt shows a different scale of political integration. Aha’s accession date is a chronological model, not an observed founding day.` | `国家与模型年代` / `埃及早王朝展现了另一种政治整合尺度。阿哈即位年代是年代学模型，并非可直接观察到的建国日期。` |
| liangzhu | `Региональный центр на востоке` / `Лянчжу объединял центр, гидротехнические сооружения и социальную дифференциацию. Восточная Азия формировала собственные сочетания городской и политической сложности.` | `A regional centre in the east` / `Liangzhu combined a centre, hydraulic works, and social differentiation. East Asia formed its own combinations of urban and political complexity.` | `东方的区域中心` / `良渚结合了中心聚落、水利工程与社会分化。东亚形成了自身的城市与政治复杂性组合。` |

Заголовок/описание/вывод маршрута:

```js
copy: {
  ru: {
    title: 'Рождение городов',
    summary: 'Семь остановок показывают, почему керамика, монументы, земледелие, города и государства — разные процессы.',
    conclusion: 'Города не появились по одному рецепту: разные общества соединяли плотность, производство, институты и власть в разное время.'
  },
  en: {
    title: 'The birth of cities',
    summary: 'Seven stops show why pottery, monuments, farming, cities, and states are different processes.',
    conclusion: 'Cities did not follow one recipe: societies combined density, production, institutions, and power at different times.'
  },
  zh: {
    title: '城市的诞生',
    summary: '七个站点说明陶器、纪念性建筑、农业、城市与国家为何是不同的过程。',
    conclusion: '城市并非依照同一种配方出现：不同社会在不同时期组合了人口密度、生产、制度与权力。'
  }
}
```

## Task 1: Ввести манифест, валидатор и разрешение канонических записей

**Files:**
- Create: `journeys-data.js`
- Create: `journey.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Сначала добавить падающие тесты контракта.**

В верхнюю секцию импортов `tests/run-tests.js` добавить:

```js
const journey = require(path.join(root, 'journey.js'));
const journeysData = require(path.join(root, 'journeys-data.js'));
```

Добавить тесты, проверяющие точный первый маршрут и негативные случаи:

```js
test('directed journey resolves seven reviewed and exactly sourced stops', function () {
  const result = journey.validateCollection(journeysData, data);
  assert.deepStrictEqual(result.issues, []);
  assert.deepStrictEqual(result.routes[0].stops.map(function (stop) { return stop.year; }),
    [-18000, -9500, -7400, -7000, -3200, -3085, -3000]);
  assert.ok(result.routes[0].stops.every(function (stop) {
    return stop.records.every(function (record) { return record.track.reviewStatus === 'reviewed' && record.exactSourceIds.length > 0; });
  }));
});

test('directed journey validation fails closed for legacy tracks and bad dates', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  fixture.routes[0].stops[0].focusTrackIds = ['indus'];
  fixture.routes[0].stops[0].year = -17000;
  const codes = journey.validateCollection(fixture, data).issues.map(function (item) { return item.code; });
  assert.ok(codes.indexOf('legacy-journey-track') !== -1);
  assert.ok(codes.indexOf('journey-year-mismatch') !== -1);
});

test('directed journey validation requires complete RU EN ZH editorial copy', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  fixture.routes[0].stops[2].copy.zh.body = '   ';
  assert.ok(journey.validateCollection(fixture, data).issues.some(function (item) {
    return item.code === 'missing-localization' && item.path === 'routes[0].stops[2].copy.zh.body';
  }));
});
```

- [ ] **Step 2: Запустить тесты и подтвердить красное состояние.**

Run: `npm test`

Expected: `MODULE_NOT_FOUND` для `journey.js` или `journeys-data.js`; это ожидаемый первый red.

- [ ] **Step 3: Создать `journeys-data.js` как UMD/CommonJS-манифест.**

Использовать UMD/CommonJS-оболочку `atlas-data.js`, заменив browser global на `PARALLEL_WORLDS_JOURNEYS`. Factory возвращает `{ version: 1, routes: routes }`; локальная переменная `routes` содержит единственный полностью заполненный `birth-of-cities` точно по таблице и редакционному контракту выше. Каждый `recordRef` имеет ровно один из ключей `periodId`/`eventId`; в первом выпуске все семь ссылок используют `eventId`. Не добавлять названия, даты, `dating`, `sourceIds` или выдержки из источников.

- [ ] **Step 4: Реализовать в `journey.js` чистый валидатор и resolver.**

Экспортировать этот стабильный API:

```js
return {
  validateCollection: validateCollection,
  findRoute: findRoute,
  localizeRoute: localizeRoute,
  createState: createState,
  reduce: reduce,
  clock: clock
};
```

Для этой задачи реализовать первые три функции; автомат временно может экспортировать функции, возвращающие безопасное состояние, и будет полностью покрыт в Task 2. `validateCollection(collection, data)` возвращает `{ routes, issues }`, где `routes` — только полностью валидные разрешённые модели, а `issues` сортируются по `code`, затем `path`.

Разрешённая модель остановки:

```js
{
  id: stop.id,
  year: stop.year,
  holdMs: stop.holdMs,
  focusTrackIds: stop.focusTrackIds.slice(),
  copy: stop.copy,
  records: [{
    ref: ref,
    track: track,
    record: record,
    recordType: ref.periodId ? 'period' : 'event',
    exactSourceIds: record.sourceIds.filter(function (id) {
      return quality.isExactSource(data.sources[id]);
    })
  }]
}
```

Обязательные коды ошибок:

```text
invalid-journey-id
duplicate-journey-id
duplicate-stop-id
invalid-stop-count
invalid-hold
invalid-focus
invalid-record-ref
missing-localization
unknown-track
legacy-journey-track
unknown-record
journey-year-mismatch
inexact-journey-source
```

Дополнительно валидировать: уникальные stop ID внутри маршрута, slug-формат `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, массив `recordRefs` не пуст, `focusTrackIds` содержит 0–2 уникальных известных ID, ссылка задаёт ровно один тип записи. Ошибка любого stop исключает весь маршрут из `routes`.

`localizeRoute(route, locale)` должен брать `ru` как последний fallback и вернуть плоские `title`, `summary`, `conclusion`, а в остановках — `headline`, `body`; ссылки и разрешённые записи сохраняются без изменения.

- [ ] **Step 5: Запустить модульные тесты.**

Run: `npm test`

Expected: новые три теста зелёные; старые 66 тестов не регрессируют.

- [ ] **Step 6: Зафиксировать атомарный коммит.**

```bash
git add journeys-data.js journey.js tests/run-tests.js
git commit -m "feat: validate directed journey data"
```

## Task 2: Реализовать детерминированный автомат и часы проигрывателя

**Files:**
- Modify: `journey.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Добавить падающие тесты переходов и времени.**

Использовать первый разрешённый маршрут из `journey.validateCollection(journeysData, data).routes[0]`:

```js
test('journey player pauses exactly and resumes from remaining time', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  let state = journey.createState(route, { status: 'transitioning', stopIndex: 0 });
  state = journey.reduce(state, { type: 'transitionEnd' }, route, { now: 1000, reducedMotion: false });
  assert.strictEqual(state.status, 'playing');
  assert.strictEqual(state.deadline, 16000);
  state = journey.reduce(state, { type: 'pause' }, route, { now: 6000, reducedMotion: false });
  assert.deepStrictEqual({ status: state.status, remainingMs: state.remainingMs }, { status: 'paused', remainingMs: 10000 });
  state = journey.reduce(state, { type: 'resume' }, route, { now: 9000, reducedMotion: false });
  assert.deepStrictEqual({ status: state.status, deadline: state.deadline }, { status: 'playing', deadline: 19000 });
});

test('journey interaction and hidden tab stop autoplay until explicit resume', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  let state = journey.createState(route, { status: 'playing', stopIndex: 1, deadline: 20000 });
  state = journey.reduce(state, { type: 'interact' }, route, { now: 12000, reducedMotion: false });
  assert.strictEqual(state.status, 'exploring');
  assert.strictEqual(state.remainingMs, 8000);
  assert.strictEqual(journey.reduce(state, { type: 'visibilityVisible' }, route, { now: 30000, reducedMotion: false }).status, 'exploring');
});

test('journey reduced motion never starts autoplay', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  let state = journey.createState(route, { status: 'transitioning', stopIndex: 0 });
  state = journey.reduce(state, { type: 'transitionEnd' }, route, { now: 1000, reducedMotion: true });
  assert.strictEqual(state.status, 'paused');
  state = journey.reduce(state, { type: 'resume' }, route, { now: 2000, reducedMotion: true });
  assert.strictEqual(state.status, 'paused');
});

test('journey clock exposes countdown and advances only at deadline', function () {
  const route = journey.validateCollection(journeysData, data).routes[0];
  const state = journey.createState(route, { status: 'playing', stopIndex: 0, deadline: 15000 });
  assert.deepStrictEqual(journey.clock(state, 11000, route), {
    remainingMs: 4000, countdownSeconds: 4, shouldAdvance: false, stopProgress: 11 / 15
  });
  assert.strictEqual(journey.clock(state, 15000, route).shouldAdvance, true);
});
```

- [ ] **Step 2: Подтвердить, что тесты падают по поведению, а не синтаксису.**

Run: `npm test`

Expected: assertion failures в новых state-machine тестах.

- [ ] **Step 3: Реализовать единый shape состояния.**

```js
{
  routeId: '',
  stopIndex: 0,
  status: 'catalog',
  deadline: 0,
  remainingMs: 0,
  pausedByVisibility: false
}
```

`createState(route, options)` разрешает только статусы `catalog`, `transitioning`, `playing`, `paused`, `exploring`, `complete`; индекс clamp-ится в пределах маршрута. Для `playing` без валидного `deadline` состояние нормализуется в `paused`.

- [ ] **Step 4: Реализовать `reduce(state, event, route, options)`.**

Правила переходов должны быть буквальными:

- `start` → `transitioning` на указанном или первом stop;
- `transitionEnd` → `playing` с `deadline = now + holdMs`, но при reduced motion → `paused` с полным `remainingMs`;
- `pause` сохраняет `max(0, deadline - now)`;
- `interact` делает то же и ставит `exploring`;
- `resume` из `paused`/`exploring` создаёт новый deadline из сохранённого остатка; reduced motion сохраняет `paused`;
- `next`/`previous` переходят в `transitioning`, сбрасывают clock и не перепрыгивают границы;
- `next` на последней остановке и `finish` → `complete`;
- `visibilityHidden` из `playing` → `paused`, `pausedByVisibility: true`;
- `visibilityVisible` оставляет сцену на паузе и сбрасывает служебный флаг; продолжение после возврата во вкладку всегда явное;
- неизвестное событие возвращает неизменённый объект состояния.

Все новые состояния создаются через `Object.assign`, входной объект не мутируется.

- [ ] **Step 5: Реализовать `clock(state, now, route)`.**

Формулы:

```js
remainingMs = state.status === 'playing' ? Math.max(0, state.deadline - now) : Math.max(0, state.remainingMs);
countdownSeconds = remainingMs > 0 && remainingMs <= 5000 ? Math.ceil(remainingMs / 1000) : null;
shouldAdvance = state.status === 'playing' && remainingMs === 0;
stopProgress = state.status === 'complete' ? 1 : Math.max(0, Math.min(1, 1 - remainingMs / route.stops[state.stopIndex].holdMs));
```

- [ ] **Step 6: Запустить тесты и закоммитить.**

Run: `npm test`

Expected: весь набор зелёный.

```bash
git add journey.js tests/run-tests.js
git commit -m "feat: add journey player state machine"
```

## Task 3: Подключить маршруты к академическому аудиту

**Files:**
- Modify: `academic-audit.js`
- Modify: `scripts/build-academic-audit.mjs`
- Modify: `academic-audit.json`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Добавить падающие тесты отчёта.**

```js
test('academic audit reports reviewed directed journey coverage', function () {
  const report = require(path.join(root, 'academic-audit.js')).buildAudit(data, journeysData);
  assert.deepStrictEqual(report.journeyCoverage, { routes: 1, stops: 7, reviewedStops: 7 });
  assert.deepStrictEqual(report.journeys, [{ id: 'birth-of-cities', stops: 7, reviewedStops: 7 }]);
  assert.strictEqual(report.summary.blockingIssues, 0);
});

test('academic audit promotes invalid journey references to blockers', function () {
  const fixture = JSON.parse(JSON.stringify(journeysData));
  fixture.routes[0].stops[0].recordRefs[0].trackId = 'missing-track';
  const report = require(path.join(root, 'academic-audit.js')).buildAudit(data, fixture);
  assert.ok(report.summary.blockingIssues > 0);
  assert.ok(report.issues.some(function (item) { return item.code === 'unknown-track'; }));
});
```

Обновить существующий тест детерминированного JSON: сравнивать с `buildAudit(data, journeysData)`, а не с `buildAudit(data)`.

- [ ] **Step 2: Запустить red.**

Run: `npm test`

Expected: `journeyCoverage` отсутствует.

- [ ] **Step 3: Расширить UMD-зависимости `academic-audit.js`.**

```js
var quality = typeof module === 'object' && module.exports ? require('./data-quality.js') : root.ParallelWorldsDataQuality;
var journey = typeof module === 'object' && module.exports ? require('./journey.js') : root.ParallelWorldsJourney;
var api = factory(quality, journey);
```

Сигнатура становится `buildAudit(data, journeys)`. При отсутствии второго аргумента использовать `{ version: 1, routes: [] }`, чтобы независимый аудит исторического корпуса оставался валидным.

- [ ] **Step 4: Добавить journey-часть отчёта без изменения существующего summary-контракта.**

```js
var journeyValidation = journey.validateCollection(journeys || { version: 1, routes: [] }, data);
journeyValidation.issues.forEach(function (item) {
  issues.push(issue('error', item.code, 'journeys.' + item.path, item.message, { journeyId: item.journeyId }));
});
var journeyReports = journeyValidation.routes.map(function (route) {
  return {
    id: route.id,
    stops: route.stops.length,
    reviewedStops: route.stops.filter(function (stop) {
      return stop.records.every(function (record) { return record.track.reviewStatus === 'reviewed'; });
    }).length
  };
});
```

Возвращать дополнительные top-level поля:

```js
journeyCoverage: {
  routes: journeyReports.length,
  stops: journeyReports.reduce(function (sum, item) { return sum + item.stops; }, 0),
  reviewedStops: journeyReports.reduce(function (sum, item) { return sum + item.reviewedStops; }, 0)
},
journeys: journeyReports
```

После добавления journey issues снова вызывать существующую `stableIssues`, чтобы blockers считались по итоговому массиву.

- [ ] **Step 5: Передать манифест в генератор и пересобрать артефакт.**

В `scripts/build-academic-audit.mjs`:

```js
const journeys = require(path.join(root, 'journeys-data.js'));
const output = JSON.stringify(audit.buildAudit(data, journeys), null, 2) + '\n';
```

Run: `node scripts/build-academic-audit.mjs && npm test`

Expected: `academic-audit.json` меняется детерминированно, blockers = 0, новые тесты зелёные.

- [ ] **Step 6: Закоммитить.**

```bash
git add academic-audit.js academic-audit.json scripts/build-academic-audit.mjs tests/run-tests.js
git commit -m "feat: audit directed journey evidence"
```

## Task 4: Расширить URL-состояние и безопасное восстановление

**Files:**
- Modify: `explorer-state.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Добавить failing tests round-trip и нормализации.**

```js
test('explorer state round-trips a paused directed journey stop', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru',
    journey: '', stop: '', journeyMode: 'paused', journeyNotice: ''
  };
  const parsed = explorerState.parse(
    new URLSearchParams('journey=birth-of-cities&stop=uruk-urban-center&journeyMode=paused'),
    defaults, data, journeysData
  );
  assert.deepStrictEqual([parsed.journey, parsed.stop, parsed.journeyMode],
    ['birth-of-cities', 'uruk-urban-center', 'paused']);
  assert.strictEqual(explorerState.serialize(parsed, defaults).toString(),
    'lang=ru&journey=birth-of-cities&stop=uruk-urban-center&journeyMode=paused');
});

test('explorer state rejects unknown journeys and normalizes unknown stops', function () {
  const defaults = {
    view: 'map', year: -500, focus: [], query: '', region: 'all', type: 'all',
    start: data.range.start, end: data.range.end, zoom: 100, lang: 'ru',
    journey: '', stop: '', journeyMode: 'paused', journeyNotice: ''
  };
  const unknownRoute = explorerState.parse(new URLSearchParams('journey=nope'), defaults, data, journeysData);
  assert.deepStrictEqual([unknownRoute.journey, unknownRoute.journeyNotice], ['', 'unknown-route']);
  const unknownStop = explorerState.parse(new URLSearchParams('journey=birth-of-cities&stop=nope&journeyMode=playing'), defaults, data, journeysData);
  assert.deepStrictEqual([unknownStop.stop, unknownStop.journeyMode, unknownStop.journeyNotice],
    ['xianrendong-pottery', 'paused', 'unknown-stop']);
});
```

- [ ] **Step 2: Запустить red.**

Run: `npm test`

Expected: journey fields не разбираются.

- [ ] **Step 3: Изменить сигнатуру и добавить нормализацию.**

Сигнатура: `parse(params, defaults, data, journeys)`; четвёртый аргумент опционален.

Алгоритм:

1. Найти `params.get('journey')` в `journeys.routes`.
2. Для неизвестного непустого ID оставить `journey: ''`, `stop: ''`, `journeyMode: 'paused'`, выставить `journeyNotice: 'unknown-route'`.
3. Для известного маршрута выбрать stop из URL или первый stop.
4. Неизвестный stop заменить первым, `journeyMode` принудительно сделать `paused`, `journeyNotice: 'unknown-stop'`.
5. При валидном stop принять только `playing|paused`; любой другой режим → `paused`.

В `serialize(state, defaults)` добавлять параметры только если `state.journey` непуст:

```js
params.set('journey', state.journey);
params.set('stop', state.stop);
params.set('journeyMode', state.journeyMode === 'playing' ? 'playing' : 'paused');
```

`journeyNotice` никогда не сериализовать.

- [ ] **Step 4: Green и коммит.**

Run: `npm test`

Expected: весь набор зелёный.

```bash
git add explorer-state.js tests/run-tests.js
git commit -m "feat: share directed journey state"
```

## Task 5: Создать безопасное представление каталога и сцены

**Files:**
- Create: `journey-view.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Добавить тесты HTML, focus trap, swipe и clock-update.**

```js
const journeyView = require(path.join(root, 'journey-view.js'));

test('journey view escapes editorial copy and exposes accessible controls', function () {
  const html = journeyView.catalogHtml([{ id: 'x', title: '<b>X</b>', summary: 'A & B', durationSeconds: 120, stops: new Array(7) }], {
    catalogTitle: 'Routes', startJourney: 'Start', minutesTemplate: '{minutes} min', stopsTemplate: '{count} stops'
  });
  assert.ok(html.indexOf('&lt;b&gt;X&lt;/b&gt;') !== -1);
  assert.ok(html.indexOf('data-journey-start="x"') !== -1);
  assert.strictEqual(html.indexOf('<b>X</b>'), -1);
});

test('journey view maps swipes only beyond the deliberate threshold', function () {
  assert.strictEqual(journeyView.swipeDirection(300, 210, 56), 'next');
  assert.strictEqual(journeyView.swipeDirection(210, 300, 56), 'previous');
  assert.strictEqual(journeyView.swipeDirection(200, 170, 56), 'none');
});

test('journey stage includes live announcement but never announces countdown', function () {
  const route = journey.localizeRoute(journey.validateCollection(journeysData, data).routes[0], 'en');
  const html = journeyView.stageHtml(route, journey.createState(route, { status: 'paused' }), {
    previousStop: 'Previous', nextStop: 'Next', pauseJourney: 'Pause', resumeJourney: 'Resume',
    shareJourney: 'Share', exitJourney: 'Exit', openEvidence: 'Open evidence', stopTemplate: 'Stop {current} of {total}'
  }, function (year) { return String(year); });
  assert.ok(/aria-live="polite"/.test(html));
  assert.ok(/data-journey-countdown[^>]*aria-hidden="true"/.test(html));
  assert.ok(/data-journey-evidence="xianrendong"/.test(html));
});
```

- [ ] **Step 2: Запустить red.**

Run: `npm test`

Expected: `MODULE_NOT_FOUND` для `journey-view.js`.

- [ ] **Step 3: Реализовать UMD-модуль с единственным способом экранирования.**

Экспорт:

```js
return {
  escapeHtml: escapeHtml,
  template: template,
  catalogHtml: catalogHtml,
  stageHtml: stageHtml,
  completeHtml: completeHtml,
  updateClock: updateClock,
  trapTab: trapTab,
  swipeDirection: swipeDirection
};
```

Правила HTML:

- все манифестные и i18n-строки проходят через `escapeHtml`;
- карточка маршрута — `<article>` с кнопкой `data-journey-start`;
- сцена содержит `data-journey-stop`, 7 прогресс-сегментов, активный сегмент с `aria-current="step"`, `aria-live="polite"` только для `headline + year`;
- countdown имеет `aria-hidden="true"` и CSS custom property `--journey-progress`;
- слой карты содержит пустые контейнеры `data-journey-world` и `data-journey-regions`, которые контроллер заполняет через существующий `atlasView`;
- evidence-кнопка содержит `data-journey-evidence="<trackId>"` и `data-record-id`;
- `completeHtml` выводит вывод маршрута и действия `data-journey-explore`, `data-journey-replay`, `data-journey-catalog`, `data-journey-share`.

`updateClock(root, value)` меняет только `textContent` countdown, `hidden` и `style.setProperty('--journey-progress', String(value.stopProgress))`; HTML сцены на каждом tick не перестраивается.

`trapTab(event, dialog)` обрабатывает только Tab, циклически переводит фокус между видимыми `button`, `a[href]`, `input`, `select`, `[tabindex]:not([tabindex="-1"])`; если элементов нет — фокусирует dialog. `swipeDirection` возвращает `next|previous|none`.

- [ ] **Step 4: Green и коммит.**

Run: `npm test`

Expected: весь набор зелёный.

```bash
git add journey-view.js tests/run-tests.js
git commit -m "feat: render directed journey scenes"
```

## Task 6: Добавить CTA, полноэкранный shell, локализацию и базовый responsive UI

**Files:**
- Modify: `index.html`
- Modify: `i18n.js`
- Modify: `styles.css`
- Modify: `scripts/validate.sh`
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Сначала усилить статические тесты.**

Добавить проверки, что:

```js
['journeys-data.js', 'journey.js', 'journey-view.js'].forEach(function (asset) {
  assert.ok(fs.existsSync(path.join(root, asset)), asset + ' is missing');
  assert.ok(html.indexOf('<script src="' + asset + '"></script>') !== -1, asset + ' is not loaded relatively');
  assert.ok(workflow.indexOf(asset) !== -1, asset + ' is not packaged by Pages');
  assert.ok(validator.indexOf('node --check ' + asset) !== -1, asset + ' is not validated');
});
assert.ok(/id="journey-open"/.test(html));
assert.ok(/<dialog id="journey-dialog"[^>]*aria-labelledby="journey-dialog-title"/.test(html));
assert.ok(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.journey-dialog/.test(css));
```

Проверить все новые i18n-ключи через существующий цикл сопоставления RU/EN/ZH.

- [ ] **Step 2: Запустить red.**

Run: `npm test`

Expected: отсутствуют CTA, dialog, scripts и packaging entries.

- [ ] **Step 3: Добавить CTA между `.explorer-heading` и `.explorer-shell`.**

```html
<section class="journey-launch" aria-labelledby="journey-launch-title">
  <div>
    <p class="kicker" data-i18n="journeyKicker">Режиссёрские маршруты</p>
    <h3 id="journey-launch-title" data-i18n="journeyLaunchTitle">Пройдите историю как путешествие</h3>
    <p data-i18n="journeyLaunchText">Карта проведёт по семи проверенным остановкам, а исследование всегда останется под вашим контролем.</p>
  </div>
  <button id="journey-open" class="journey-open" type="button">
    <span aria-hidden="true">▶</span>
    <span data-i18n="journeyOpen">Начать путешествие · 2 минуты</span>
  </button>
</section>
```

- [ ] **Step 4: Добавить dialog shell перед toast.**

```html
<dialog id="journey-dialog" class="journey-dialog" aria-labelledby="journey-dialog-title">
  <div class="journey-shell">
    <header class="journey-topbar">
      <a class="journey-brand" href="./" data-i18n="siteName">Параллельные миры</a>
      <h2 id="journey-dialog-title" class="sr-only" data-i18n="journeyDialogTitle">Путешествия во времени</h2>
      <button id="journey-exit" type="button" data-i18n="journeyExit">Выйти</button>
    </header>
    <div id="journey-content" class="journey-content"></div>
  </div>
</dialog>
```

Подключить scripts после `atlas-view.js` и до `app.js` в порядке: `journeys-data.js`, `journey.js`, `journey-view.js`.

- [ ] **Step 5: Добавить одинаковый набор системных ключей в RU/EN/ZH.**

Ключи:

```text
journeyKicker, journeyLaunchTitle, journeyLaunchText, journeyOpen,
journeyDialogTitle, journeyCatalogTitle, journeyCatalogText,
journeyStart, journeyDuration, journeyStops, journeyStopProgress,
journeyPrevious, journeyNext, journeyPause, journeyResume,
journeyShare, journeyExit, journeyEvidence, journeyExplore,
journeyReplay, journeyBackCatalog, journeyRestoreAtlas,
journeyUnknownRoute, journeyUnknownStop, journeyRenderError,
journeyLinkCopied, journeyCompleteKicker
```

RU — естественные формулировки из спецификации; EN — concise sentence case; ZH — упрощённый китайский без машинных транслитераций. Шаблоны используют существующий синтаксис `{name}`.

- [ ] **Step 6: Реализовать базовую сцену B2 в `styles.css`.**

Зафиксированные визуальные свойства:

- `journey-dialog` занимает `100dvw × 100dvh`, `max-width: none`, `max-height: none`, без стандартного padding/border;
- фон — глубокий графит с мягким радиальным свечением карты, текст — тёплый белый, акцент — терракотовый;
- desktop: карта/световой слой занимает сцену, narrative card закреплена в нижней левой трети и не шире `42rem`;
- catalog cards используют существующие контуры карты, а не растровые обложки;
- controls всегда видимы, имеют focus ring и touch target минимум `44px`;
- `body:has(.journey-dialog[open])` не использовать как единственный scroll lock: контроллер добавляет класс `journey-open` на `body`;
- 390 px: один столбец, текст не выше 45% viewport, controls переносятся в две строки, горизонтальный overflow отсутствует;
- reduced motion: `animation-duration: 0.01ms`, `transition-duration: 0.01ms`, spatial transform отключён именно для `.journey-dialog` и дочерних элементов.

- [ ] **Step 7: Обновить validator и Pages packaging.**

В `scripts/validate.sh` добавить три `node --check`, три ассета в file loop и три имени в regexp абсолютных путей. В workflow добавить `journeys-data.js journey.js journey-view.js` в `cp ... _site/`.

- [ ] **Step 8: Запустить проверки и закоммитить.**

Run: `npm test && bash scripts/validate.sh`

Expected: тесты и `Static site validation passed`.

```bash
git add index.html i18n.js styles.css scripts/validate.sh .github/workflows/deploy-pages.yml tests/run-tests.js
git commit -m "feat: add journey catalog shell"
```

## Task 7: Связать проигрыватель с атласом и URL

**Files:**
- Modify: `app.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Добавить статические интеграционные тесты контроллера.**

Проверить наличие globals, единственного clock interval, обработчиков visibility и reduced motion, нормализованного share и отсутствие второго источника исторических данных:

```js
assert.ok(/window\.PARALLEL_WORLDS_JOURNEYS/.test(app));
assert.ok(/window\.ParallelWorldsJourney/.test(app));
assert.ok(/window\.ParallelWorldsJourneyView/.test(app));
assert.ok(/journey\.reduce\(/.test(app));
assert.ok(/journeyView\.updateClock\(/.test(app));
assert.ok(/journeyMode:\s*'paused'/.test(app));
assert.ok(/visibilityHidden/.test(app) && /visibilityVisible/.test(app));
assert.strictEqual((app.match(/setInterval\(/g) || []).length, 2, 'atlas and journey must each own one interval');
assert.strictEqual(app.indexOf('fetch('), -1);
```

- [ ] **Step 2: Запустить red.**

Run: `npm test`

Expected: globals/controller patterns отсутствуют.

- [ ] **Step 3: Подключить зависимости и state.**

В начале `app.js`:

```js
var journeysData = window.PARALLEL_WORLDS_JOURNEYS;
var journey = window.ParallelWorldsJourney;
var journeyView = window.ParallelWorldsJourneyView;
var validatedJourneys = journey.validateCollection(journeysData, rawData).routes;
var journeyState = journey.createState(null, { status: 'catalog' });
var journeyTimer = null;
var preJourneyState = null;
var journeyTrigger = null;
var journeyTouchStartX = null;
```

Расширить defaults:

```js
journey: '', stop: '', journeyMode: 'paused', journeyNotice: ''
```

`readUrlState()` вызывает `explorerState.parse(params, defaults, rawData, journeysData)`.

В `collectElements()` добавить `journey-open`, `journey-dialog`, `journey-exit`, `journey-content`.

- [ ] **Step 4: Реализовать маленький controller API внутри `app.js`.**

Добавить функции с этой ответственностью:

```text
openJourneyCatalog(notice)   — сохраняет trigger, открывает dialog, рендерит только валидные routes
startJourney(routeId, stopId, autoplay) — сохраняет preJourneyState, создаёт player state, синхронизирует stop
dispatchJourney(type, now)   — вызывает journey.reduce и один раз применяет новое состояние
applyJourneyStop()           — обновляет year/focus/view/scale и строит atlas model из существующего rawData
renderJourney()              — catalog/stage/complete через journey-view; не запускает interval
startJourneyClock()          — один setInterval(250), только clock/updateClock/next
stopJourneyClock()           — clearInterval и null
pauseJourneyForInteraction() — dispatch interact только из playing
shareJourney()               — сериализует clone state с journeyMode: 'paused'
exitJourney(restoreOriginal) — закрывает dialog, сохраняет текущий stop либо восстанавливает preJourneyState
```

`applyJourneyStop()` обязан:

```js
state.year = stop.year;
state.focus = stop.focusTrackIds.slice();
state.view = 'map';
state.scaleMode = stop.year <= rawData.scale.breakpoint ? 'deep' : 'historical';
var range = chronology.modeRange(state.scaleMode, {
  start: rawData.range.start,
  end: rawData.range.end,
  breakpoint: rawData.scale.breakpoint
});
state.start = range.start;
state.end = range.end;
state.journey = route.id;
state.stop = stop.id;
state.journeyMode = journeyState.status === 'playing' ? 'playing' : 'paused';
```

Для карты сцены переиспользовать `atlas.buildModel`, `atlasView.worldSvg` и `atlasView.renderRegions`; не копировать географические расчёты в новый модуль. Переход `transitioning → transitionEnd` завершать через `transitionend` с fallback `setTimeout` 1400 ms; при reduced motion — сразу.

- [ ] **Step 5: Связать события без неявного autoplay.**

- CTA открывает catalog; URL-маршрут открывается в `init()` после обычного первого render.
- `data-journey-start` запускает первый stop с autoplay, кроме reduced motion.
- `previous`, `next`, `pause/resume`, `share`, `exit` делегируются через event delegation на `journey-content`.
- Любой click по карте/evidence, pointerdown на narrative, изменение масштаба, `selectionchange` с непустым selection или `focusin` внутри содержания stop вызывает `pauseJourneyForInteraction()`.
- Evidence вызывает `openDetails(trackId, recordId)` и оставляет journey в `exploring`.
- `Space`, `ArrowLeft`, `ArrowRight`, `Escape` работают только при открытом journey dialog и игнорируют `input`, `textarea`, `select`, кнопки и contenteditable.
- `touchstart` запоминает clientX; `touchend` использует `journeyView.swipeDirection(..., 56)`.
- `visibilitychange` отправляет `visibilityHidden`/`visibilityVisible`; возврат во вкладку не возобновляет рассказ без явного Resume.
- change события `reducedMotion` во время playback переводят сцену на паузу.

- [ ] **Step 6: Реализовать share и выход без потери контекста.**

`shareJourney()` создаёт отдельный объект:

```js
var shareState = Object.assign({}, state, { journeyMode: 'paused' });
var params = explorerState.serialize(shareState, defaults);
var url = window.location.origin + window.location.pathname + '?' + params.toString();
```

Нельзя мутировать текущее playing state ради ссылки. При выходе по умолчанию очистить journey-поля, но сохранить `year`, `focus`, `scaleMode` текущей остановки. Кнопка «Вернуться к исходному виду» вызывает `exitJourney(true)` и восстанавливает снимок `preJourneyState` без `theme/lang` из снимка.

- [ ] **Step 7: Обработать ошибки fail-soft.**

Любое исключение в `renderJourney` ловится на границе controller: остановить clock, закрыть dialog, очистить journey URL-поля, вернуть обычный `render()` и показать `t('journeyRenderError')`. Не подавлять исключения в валидаторе/аудите сборки.

- [ ] **Step 8: Green и коммит.**

Run: `npm test && bash scripts/validate.sh`

Expected: полный набор зелёный; validator проходит.

```bash
git add app.js tests/run-tests.js
git commit -m "feat: orchestrate directed time journeys"
```

## Task 8: Довести доступность и взаимодействия до критериев приёмки

**Files:**
- Modify: `journey-view.js`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Добавить регрессионные тесты доступности.**

Проверить:

- countdown всегда `aria-hidden`;
- у активного progress segment ровно один `aria-current="step"`;
- все icon-кнопки имеют текст или `aria-label`;
- `trapTab` сохраняет фокус внутри dialog;
- HTML не содержит inline event handlers;
- CSS имеет `:focus-visible`, 390 px breakpoint и не использует `overflow-x: hidden` как маскировку переполнения сцены;
- reduced-motion путь не создаёт autoplay deadline.

- [ ] **Step 2: Запустить тесты до правок и зафиксировать реальные пробелы.**

Run: `npm test`

Expected: минимум один новый assertion падает до polish.

- [ ] **Step 3: Реализовать focus lifecycle.**

- перед открытием сохранять `document.activeElement`;
- после `showModal()` фокусировать заголовок каталога (`tabindex="-1"`) или заголовок stop;
- `keydown` Tab делегировать `journeyView.trapTab`;
- после `close()` возвращать фокус на сохранённый trigger, если он ещё `isConnected`;
- открытие вложенного `detail-dialog` не закрывает journey; после закрытия detail вернуть фокус на evidence-кнопку.

- [ ] **Step 4: Устранить ложные паузы и двойные переходы.**

- программный focus заголовка stop не должен считаться пользовательским `focusin`; использовать флаг `journeyRendering` только на синхронную фазу render;
- transition fallback хранить в одной переменной и отменять после настоящего `transitionend`;
- clock dispatch-ит `next` только один раз: сначала `stopJourneyClock()`, затем reducer;
- повторный `visibilityHidden` и повторный click Pause должны быть идемпотентными.

- [ ] **Step 5: Проверить responsive layout расчётно.**

Для `.journey-narrative`, `.journey-controls` и карты использовать `min-width: 0`, `max-inline-size`, `overflow-wrap: anywhere`; не задавать фиксированные ширины больше 390 px. Минимальная высота кнопок 44 px, минимум 8 px между touch targets.

- [ ] **Step 6: Запустить проверки и закоммитить.**

Run: `npm test && bash scripts/validate.sh`

Expected: все accessibility assertions зелёные.

```bash
git add journey-view.js app.js styles.css tests/run-tests.js
git commit -m "fix: harden journey accessibility"
```

## Task 9: Документация, финальная верификация и браузерная приёмка

**Files:**
- Modify: `README.md`
- Modify: `docs/academic-method.md`
- Modify: `academic-audit.json`
- Modify: `tests/run-tests.js`

- [ ] **Step 1: Добавить документационные assertions.**

Проверить, что README содержит `journey=birth-of-cities`, `prefers-reduced-motion`, `journeys-data.js`, а академическая методика — `reviewed`, `exact source`, `6–8` и команды:

```text
node scripts/build-academic-audit.mjs
npm test
bash scripts/validate.sh
```

- [ ] **Step 2: Обновить README.**

Добавить раздел «Режиссёрские путешествия» с:

- пользовательским сценарием и клавишами;
- примером paused URL;
- правилом, что shared URL никогда не стартует неожиданно;
- способом добавления нового маршрута через manifest → audit → tests;
- перечнем трёх новых модулей.

- [ ] **Step 3: Обновить академическую методику.**

Зафиксировать отдельный gate для маршрутов: только `reviewed`, минимум один exact source на record, дата совпадает с событием или лежит в периоде, RU/EN/ZH обязательны, 6–8 stops, любая ошибка блокирует Pages. Объяснить, почему ранняя керамика, монументы и земледелие в первом маршруте не переименовываются в «города».

- [ ] **Step 4: Запустить полную локальную верификацию из чистого состояния ассетов.**

Run:

```bash
node scripts/build-academic-audit.mjs
npm test
bash scripts/validate.sh
git diff --check
git status --short
```

Expected:

- все тесты проходят;
- `Static site validation passed`;
- `academic-audit.json` не меняется при повторной генерации;
- `summary.blockingIssues` = 0;
- `journeyCoverage` = `{ "routes": 1, "stops": 7, "reviewedStops": 7 }`;
- `git diff --check` не выводит ошибок.

- [ ] **Step 5: Провести браузерную приёмку на локальном сервере.**

Run: `python3 -m http.server 52729`

Проверить через in-app browser:

1. Desktop RU: CTA → catalog → 7 stops → complete → explore; console без ошибок.
2. EN и ZH: весь системный и редакционный текст переключается без перезагрузки; год форматируется существующим formatter.
3. 390×844: нет горизонтального overflow, narrative и controls не перекрывают evidence/action.
4. Keyboard: Tab остаётся внутри dialog, Space pause/resume, стрелки меняют stop, Esc выходит и возвращает focus.
5. Interaction: click по карте/evidence и text selection переводят в `exploring`; таймер не возобновляется сам.
6. Hidden tab: время не «догоняет» пропущенные остановки.
7. Reduced motion: stop ждёт явного Next, transform flight отсутствует.
8. Shared URL: открывает нужный stop на pause; неизвестный route ведёт в catalog с сообщением, неизвестный stop нормализуется к первому.
9. Exit: обычный atlas показывает год/focus stop; restore возвращает предмаршрутный вид.
10. Detail dialog: источник открывается, route сохраняется, focus возвращается в сцену.

Сохранить два скриншота приёмки вне репозитория или в уже принятой директории артефактов: desktop scene и 390 px scene. Не добавлять временные browser-артефакты в git.

- [ ] **Step 6: Проверить production packaging без деплоя.**

Повторить команды workflow локально во временной директории и проверить, что `index.html`, три journey asset и audit присутствуют, а все script src относительные.

- [ ] **Step 7: Финальный коммит документации и артефакта аудита.**

```bash
git add README.md docs/academic-method.md academic-audit.json tests/run-tests.js
git commit -m "docs: explain directed time journeys"
```

- [ ] **Step 8: Перед merge запросить code review и пройти verification-before-completion.**

Проверить diff относительно `main`, особенно: отсутствие `legacy` refs, отсутствие runtime network calls, очистку timers/listeners, сериализацию paused URL, упаковку Pages и изменение только согласованных файлов. После review повторить `npm test && bash scripts/validate.sh` на финальном HEAD.

## Definition of Done

- Один маршрут `birth-of-cities` содержит ровно 7 разрешённых остановок, RU/EN/ZH и ноль ошибок аудита.
- Каталог не может показать невалидный маршрут.
- Автопереход работает только без взаимодействия и полностью отключён при reduced motion.
- Пользователь может вручную пройти, исследовать, открыть evidence, поделиться stop и выйти без потери контекста.
- URL всегда безопасен: shared state paused, неизвестные ID нормализуются без поломки атласа.
- Desktop, keyboard и 390 px сценарии приняты без console errors и horizontal overflow.
- Новые ассеты проверяются и публикуются GitHub Pages workflow.
- `npm test`, `bash scripts/validate.sh` и `git diff --check` проходят на финальном HEAD.
