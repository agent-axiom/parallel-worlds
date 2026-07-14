const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const data = require(path.join(root, 'data.js'));
const timeline = require(path.join(root, 'timeline.js'));
const i18n = require(path.join(root, 'i18n.js'));

let passed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('✓ ' + name);
  } catch (error) {
    console.error('✗ ' + name);
    throw error;
  }
}

test('dataset covers the requested world history scope', function () {
  assert.strictEqual(data.range.start, -3500);
  assert.strictEqual(data.range.end, 1600);
  assert.ok(data.tracks.length >= 49, 'expected at least 49 tracks');
  const ids = data.tracks.map(function (track) { return track.id; });
  ['sumer', 'egypt', 'byzantium', 'china', 'aztec', 'inca', 'christianity', 'islam', 'buddhism']
    .forEach(function (id) { assert.ok(ids.indexOf(id) !== -1, 'missing ' + id); });
});

test('track ids and period ids are unique and valid', function () {
  const trackIds = new Set();
  const periodIds = new Set();
  let periodCount = 0;
  let eventCount = 0;

  data.tracks.forEach(function (track) {
    assert.ok(track.id && track.name && track.region && track.type && track.summary);
    assert.ok(!trackIds.has(track.id), 'duplicate track id ' + track.id);
    trackIds.add(track.id);
    assert.ok(track.periods.length >= 1, 'no periods for ' + track.id);
    assert.ok(track.events.length >= 1, 'no events for ' + track.id);
    track.periods.forEach(function (period) {
      assert.ok(period.start < period.end, 'invalid range in ' + track.id);
      assert.ok(period.start >= data.range.start && period.end <= data.range.end);
      const periodId = track.id + ':' + period.name + ':' + period.start;
      assert.ok(!periodIds.has(periodId), 'duplicate period ' + periodId);
      periodIds.add(periodId);
      periodCount += 1;
    });
    track.events.forEach(function (event) {
      assert.ok(event.year >= data.range.start && event.year <= data.range.end);
      assert.ok(event.title);
      eventCount += 1;
    });
  });

  assert.ok(periodCount >= 160, 'expected a rich periodization');
  assert.ok(eventCount >= 120, 'expected a rich event set');
});

test('filtering searches periods and respects region and type', function () {
  const byPeriod = timeline.filterTracks(data.tracks, { query: 'Старовавилонский', region: 'all', type: 'all' });
  assert.deepStrictEqual(byPeriod.map(function (track) { return track.id; }), ['babylonia']);
  const asiaTraditions = timeline.filterTracks(data.tracks, { query: '', region: 'east-asia', type: 'tradition' });
  assert.ok(asiaTraditions.some(function (track) { return track.id === 'confucianism'; }));
  assert.ok(asiaTraditions.every(function (track) { return track.region === 'east-asia' && track.type === 'tradition'; }));
});

test('year projection and active-track lookup handle BCE and CE', function () {
  assert.strictEqual(timeline.yearToPercent(-3500, -3500, 1600), 0);
  assert.strictEqual(timeline.yearToPercent(1600, -3500, 1600), 100);
  assert.strictEqual(timeline.formatYear(-753), '753 до н. э.');
  assert.strictEqual(timeline.formatYear(0), '1 н. э.');
  assert.strictEqual(timeline.formatYear(1453), '1453 н. э.');
  const active = timeline.activeTracks(data.tracks, 1200).map(function (track) { return track.id; });
  assert.ok(active.indexOf('byzantium') !== -1);
  assert.ok(active.indexOf('inca') === -1);
});

test('missing URL numbers stay absent instead of becoming year zero', function () {
  const empty = new URLSearchParams('');
  const explicitZero = new URLSearchParams('start=0');
  assert.strictEqual(timeline.numericParam(empty, 'start'), undefined);
  assert.strictEqual(timeline.numericParam(explicitZero, 'start'), 0);
  assert.strictEqual(timeline.numericParam(new URLSearchParams('zoom=nope'), 'zoom'), undefined);
});

test('locale normalization and interface copy support Russian and English', function () {
  assert.strictEqual(i18n.normalizeLocale('en-US'), 'en');
  assert.strictEqual(i18n.normalizeLocale('ru-RU'), 'ru');
  assert.strictEqual(i18n.normalizeLocale('de-DE'), 'en');
  assert.strictEqual(i18n.text('ru', 'siteName'), 'Параллельные миры');
  assert.strictEqual(i18n.text('en', 'siteName'), 'Parallel Worlds');
  assert.strictEqual(i18n.text('xx', 'siteName'), 'Parallel Worlds');
});

test('English localization covers every historical track, period, note, and event', function () {
  const english = i18n.localizeData(data, 'en');
  assert.strictEqual(english.tracks.length, data.tracks.length);
  assert.strictEqual(english.tracks.find(function (track) { return track.id === 'byzantium'; }).name, 'Byzantine Empire');
  assert.strictEqual(english.tracks.find(function (track) { return track.id === 'babylonia'; }).periods[0].name, 'Old Babylonian period');
  assert.strictEqual(english.tracks.find(function (track) { return track.id === 'egypt'; }).events[1].title, 'Pyramids of Giza');

  english.tracks.forEach(function (track, trackIndex) {
    const original = data.tracks[trackIndex];
    assert.ok(track.name && track.summary, 'missing English track copy for ' + track.id);
    assert.strictEqual(track.periods.length, original.periods.length, 'period count drift for ' + track.id);
    assert.strictEqual(track.events.length, original.events.length, 'event count drift for ' + track.id);
    track.periods.forEach(function (period, index) {
      assert.ok(period.name, 'missing English period ' + track.id + ':' + index);
      if (original.periods[index].note) assert.ok(period.note, 'missing English note ' + track.id + ':' + index);
    });
    track.events.forEach(function (event, index) {
      assert.ok(event.title, 'missing English event ' + track.id + ':' + index);
      if (original.events[index].note) assert.ok(event.note, 'missing English event note ' + track.id + ':' + index);
    });
    const englishCopy = [track.name, track.summary]
      .concat(track.periods.map(function (period) { return period.name + ' ' + period.note; }))
      .concat(track.events.map(function (event) { return event.title + ' ' + event.note; }))
      .join(' ');
    assert.ok(!/[А-Яа-яЁё]/.test(englishCopy), 'Cyrillic fallback remains in ' + track.id);
  });
});

test('localized data drives English search and era notation', function () {
  const english = i18n.localizeData(data, 'en');
  const result = timeline.filterTracks(english.tracks, { query: 'Old Babylonian', region: 'all', type: 'all' });
  assert.deepStrictEqual(result.map(function (track) { return track.id; }), ['babylonia']);
  assert.strictEqual(timeline.formatYear(-753, 'en'), '753 BCE');
  assert.strictEqual(timeline.formatYear(0, 'en'), '1 CE');
  assert.strictEqual(timeline.formatYear(1453, 'en'), '1453 CE');
  assert.strictEqual(timeline.formatYear(-753, 'ru'), '753 до н. э.');
});

test('CSV export accepts localized headers, types, regions, and historical copy', function () {
  const english = i18n.localizeData(data, 'en');
  const babylonia = english.tracks.filter(function (track) { return track.id === 'babylonia'; });
  const csv = timeline.buildCsv(babylonia, {
    headers: ['Track', 'Type', 'Region', 'Period', 'Start', 'End', 'Note'],
    typeNames: { civilization: 'civilization', tradition: 'tradition' },
    regionNames: { mesopotamia: 'Mesopotamia' }
  });
  assert.ok(csv.indexOf('"Track","Type","Region"') === 0);
  assert.ok(csv.indexOf('"Babylonia","civilization","Mesopotamia","Old Babylonian period"') !== -1);
});

test('required static site and Pages files exist and use relative assets', function () {
  ['index.html', 'styles.css', 'app.js', 'data.js', 'i18n.js', 'timeline.js', '.nojekyll',
    '.github/workflows/deploy-pages.yml', 'scripts/validate.sh', 'README.md']
    .forEach(function (file) { assert.ok(fs.existsSync(path.join(root, file)), 'missing ' + file); });
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  ['styles.css', 'data.js', 'i18n.js', 'timeline.js', 'app.js'].forEach(function (asset) {
    assert.ok(html.indexOf('="' + asset + '"') !== -1, 'asset is not relative: ' + asset);
  });
  assert.ok(html.indexOf('id="timeline"') !== -1);
  assert.ok(html.indexOf('id="detail-dialog"') !== -1);
  assert.ok(html.indexOf('id="language-button"') !== -1);
  assert.ok(html.indexOf('data-i18n="heroTitleLead"') !== -1);
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/deploy-pages.yml'), 'utf8');
  assert.ok(workflow.indexOf('i18n.js') !== -1, 'Pages artifact does not include i18n.js');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.ok(app.indexOf("params.set('lang', state.lang)") !== -1, 'language is not persisted in URL state');
});

test('concise Russian and English launch posts include public links', function () {
  ['launch-ru.md', 'launch-en.md'].forEach(function (filename) {
    const postPath = path.join(root, 'docs/posts', filename);
    assert.ok(fs.existsSync(postPath), 'missing ' + filename);
    const post = fs.readFileSync(postPath, 'utf8');
    assert.ok(post.indexOf('https://agent-axiom.github.io/parallel-worlds/') !== -1, 'missing site link in ' + filename);
    assert.ok(post.indexOf('https://github.com/agent-axiom/parallel-worlds') !== -1, 'missing repository link in ' + filename);
    assert.ok(post.split(/\s+/).length <= 130, filename + ' is not concise');
  });
});

console.log('\nAll tests passed (' + passed + ')');
