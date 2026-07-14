(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsI18n = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var copy = {
    ru: {
      siteName: 'Параллельные миры',
      pageTitle: 'Параллельные миры — сравнительная шкала истории',
      metaDescription: 'Интерактивная сравнительная шкала цивилизаций и религий от 3500 года до н. э. до 1600 года н. э.',
      skipTimeline: 'К шкале времени', mainNav: 'Основная навигация', brandAria: 'Параллельные миры — главная',
      share: 'Ссылка', shareTitle: 'Скопировать ссылку', themeTitle: 'Сменить тему', languageTitle: 'Switch to English', languageButton: 'EN',
      heroEyebrow: 'Сравнительная хронология · 3500 до н. э. — 1600 н. э.', heroTitleLead: 'История происходила', heroTitleEm: 'одновременно',
      heroLede: 'Сопоставьте Шумер и Египет, Византию и Китай, майя, ацтеков и инков — вместе с религиозными и философскими традициями, которые пересекали границы государств.',
      statsAria: 'Статистика набора данных', statTracks: 'исторических линий', statPeriods: 'периодов', statEvents: 'ориентиров',
      controlsAria: 'Управление шкалой', searchLabel: 'Поиск', searchPlaceholder: 'Найти цивилизацию, период или событие…',
      region: 'Регион', trackType: 'Тип линии', allTypes: 'Все типы', civilizationsStates: 'Цивилизации и государства', religionsTraditions: 'Религии и традиции', zoom: 'Масштаб',
      quickRange: 'Быстрый диапазон', exportCsv: 'Экспорт CSV ↓', from: 'От', to: 'До',
      timelineKicker: 'Слои времени', timelineHeading: 'Кто жил в одно время?', legendCivilizations: 'цивилизации', legendTraditions: 'традиции',
      selectedYear: 'Выбранный год', selectYear: 'Выбрать год', yearHint: 'Перемещайте ползунок, чтобы увидеть современников.',
      timelineAria: 'Горизонтальная сравнительная шкала', emptyTitle: 'Ничего не найдено', emptyText: 'Измените запрос или сбросьте фильтры.', resetFilters: 'Сбросить фильтры',
      contemporariesKicker: 'Срез одного года', contemporariesHeading: 'На сцене одновременно', contemporariesText: 'Линии, в которых выбранный год попадает хотя бы в один период.',
      methodKicker: 'Как читать шкалу', methodHeading: 'Даты — ориентиры, а не стены',
      methodText: 'Границы периодов условны: культурные практики не прекращаются в один год, а традиции развиваются неодинаково в разных регионах. Шкала предназначена для сравнения крупных хронологических рамок; спорные и традиционные датировки подписаны в карточках.',
      footer: 'Параллельные миры · открытая сравнительная хронология', sourceCode: 'Исходный код', close: 'Закрыть',
      detailsPeriods: 'Периоды', detailsEvents: 'Ориентиры', detailsSources: 'Обзорные источники:',
      linePeriod: 'Линия / период', tradition: 'традиция', civilization: 'цивилизация',
      traditionMeta: 'религия / традиция', civilizationMeta: 'цивилизация / общество', openDetails: 'Открыть подробности: {name}',
      activeLines: '{count} линий активны в {year}', noContemporaries: 'В текущей выборке нет линий для этого года.',
      linkCopied: 'Ссылка скопирована', copyLinkPrompt: 'Скопируйте ссылку',
      csvFilename: 'parallel-worlds-ru.csv', csvLine: 'Линия', csvType: 'Тип', csvRegion: 'Регион', csvPeriod: 'Период', csvStart: 'Начало', csvEnd: 'Конец', csvNote: 'Примечание'
    },
    en: {
      siteName: 'Parallel Worlds',
      pageTitle: 'Parallel Worlds — a comparative timeline of history',
      metaDescription: 'An interactive comparative timeline of civilizations and religions from 3500 BCE to 1600 CE.',
      skipTimeline: 'Skip to the timeline', mainNav: 'Main navigation', brandAria: 'Parallel Worlds — home',
      share: 'Share', shareTitle: 'Copy link', themeTitle: 'Switch theme', languageTitle: 'Переключить на русский', languageButton: 'RU',
      heroEyebrow: 'Comparative chronology · 3500 BCE — 1600 CE', heroTitleLead: 'History happened', heroTitleEm: 'at the same time',
      heroLede: 'Compare Sumer and Egypt, Byzantium and China, the Maya, Aztecs, and Inca — alongside the religious and philosophical traditions that crossed the borders of states.',
      statsAria: 'Dataset statistics', statTracks: 'historical tracks', statPeriods: 'periods', statEvents: 'milestones',
      controlsAria: 'Timeline controls', searchLabel: 'Search', searchPlaceholder: 'Find a civilization, period, or event…',
      region: 'Region', trackType: 'Track type', allTypes: 'All types', civilizationsStates: 'Civilizations and states', religionsTraditions: 'Religions and traditions', zoom: 'Zoom',
      quickRange: 'Quick range', exportCsv: 'Export CSV ↓', from: 'From', to: 'To',
      timelineKicker: 'Layers of time', timelineHeading: 'Who lived at the same time?', legendCivilizations: 'civilizations', legendTraditions: 'traditions',
      selectedYear: 'Selected year', selectYear: 'Select a year', yearHint: 'Move the slider to reveal contemporaries.',
      timelineAria: 'Horizontal comparative timeline', emptyTitle: 'Nothing found', emptyText: 'Try another query or reset the filters.', resetFilters: 'Reset filters',
      contemporariesKicker: 'A single-year view', contemporariesHeading: 'On the stage together', contemporariesText: 'Tracks whose periodization includes the selected year.',
      methodKicker: 'How to read the timeline', methodHeading: 'Dates are landmarks, not walls',
      methodText: 'Period boundaries are approximate: cultural practices do not stop in a single year, and traditions develop differently across regions. The timeline compares broad chronological frames; debated and traditional dates are identified in the detail cards.',
      footer: 'Parallel Worlds · an open comparative chronology', sourceCode: 'Source code', close: 'Close',
      detailsPeriods: 'Periods', detailsEvents: 'Milestones', detailsSources: 'Overview sources:',
      linePeriod: 'Track / period', tradition: 'tradition', civilization: 'civilization',
      traditionMeta: 'religion / tradition', civilizationMeta: 'civilization / society', openDetails: 'Open details: {name}',
      activeLines: '{count} tracks active in {year}', noContemporaries: 'No tracks in the current selection cover this year.',
      linkCopied: 'Link copied', copyLinkPrompt: 'Copy this link',
      csvFilename: 'parallel-worlds-en.csv', csvLine: 'Track', csvType: 'Type', csvRegion: 'Region', csvPeriod: 'Period', csvStart: 'Start', csvEnd: 'End', csvNote: 'Note'
    }
  };

  var regionNames = {
    all: 'All regions', mesopotamia: 'Mesopotamia', 'west-asia': 'West Asia', africa: 'Africa', mediterranean: 'Mediterranean',
    'south-asia': 'South Asia', 'east-asia': 'East Asia', 'central-asia': 'Central Asia and the Steppe',
    'southeast-asia': 'Southeast Asia', oceania: 'Oceania', americas: 'The Americas'
  };
  var presetNames = { all: 'Full timeline', bronze: 'Bronze Age', classical: 'Classical world', medieval: 'Global Middle Ages', americas: 'Pre-Columbian Americas' };

  function tr(name, summary, periods, events, notes) {
    return { name: name, summary: summary, periods: periods, events: events, notes: notes || [] };
  }

  var englishTracks = {
    sumer: tr('Sumer', 'City-states of southern Mesopotamia, cuneiform writing, and an early temple economy.',
      ['Uruk period', 'Early Dynastic period', 'Sumerian revival', 'Late Sumerian tradition'],
      ['Early cuneiform tablets', 'Royal Cemetery at Ur', 'Third Dynasty of Ur begins'],
      ['Growth of the first urban centers.', 'Ur, Uruk, Lagash, and rival dynasties.', 'Third Dynasty of Ur.', 'The language survives in schools and cult.']),
    akkadia: tr('Akkad', 'The first major territorial state in Mesopotamia and the source of a lasting Akkadian linguistic tradition.',
      ['Pre-imperial Akkad', 'Empire of Sargon', 'Crisis and Gutian rule', 'Akkadian legacy'],
      ['Sargon creates the Akkadian state', 'Reign of Naram-Sin', 'End of the Akkadian dynasty']),
    babylonia: tr('Babylonia', 'A center of southern Mesopotamian statecraft, scholarship, and written culture.',
      ['Old Babylonian period', 'Kassite Babylonia', 'Middle and Late Babylonian periods', 'Neo-Babylonian Empire'],
      ['Hammurabi begins his reign', 'Fall of the First Dynasty of Babylon', 'Cyrus II captures Babylon'],
      ['Includes the reign of Hammurabi.']),
    assyria: tr('Assyria', 'A northern Mesopotamian state that became a major empire of the Iron Age.',
      ['Old Assyrian period', 'Middle Assyrian state', 'Neo-Assyrian Empire', 'Assyrian cultural legacy'],
      ['Trading colonies in Anatolia', 'Reign of Ashurnasirpal II', 'Fall of Nineveh']),
    hittites: tr('Hittites and Anatolia', 'Anatolian kingdoms from the Hittite state to its Iron Age successors.',
      ['Hatti and early Anatolia', 'Old Hittite Kingdom', 'Hittite Empire', 'Neo-Hittite states'],
      ['Formation of the Hittite Kingdom', 'Battle of Kadesh', 'Collapse of the empire']),
    egypt: tr('Ancient Egypt', 'A Nile civilization with a long dynastic tradition and a highly developed writing system.',
      ['Early Dynastic period', 'Old Kingdom', 'Middle Kingdom', 'New Kingdom and Late Period'],
      ['Unification of Upper and Lower Egypt', 'Pyramids of Giza', 'Death of Tutankhamun']),
    nubia: tr('Nubia and Kush', 'Nile societies south of Egypt: Kerma, Napata, and Meroë.',
      ['Kerma culture', 'Egyptian Nubia', 'Napatan Kingdom', 'Meroitic Kingdom'],
      ['Kerma flourishes', 'Kushite Twenty-Fifth Dynasty in Egypt', 'Decline of Meroë']),
    phoenicia: tr('Phoenicia and the Levant', 'Port cities of the eastern Mediterranean, alphabetic writing, and long-distance maritime trade.',
      ['Canaanite cities', 'Phoenician city-states', 'Persian Levant', 'Hellenistic and Roman Levant'],
      ['Rise of Tyre and Sidon', 'Traditional founding date of Carthage', 'Alexander besieges Tyre']),
    israel_judah: tr('Israel and Judah', 'Ancient Levantine kingdoms and communities of the First and Second Temple eras.',
      ['Early Israel', 'Kingdoms of Israel and Judah', 'Persian Yehud', 'Hellenistic and Roman Judea'],
      ['Jerusalem becomes a royal center', 'Destruction of the First Temple', 'Destruction of the Second Temple']),
    persia: tr('Iran and Persia', 'Iranian empires from the Medes and Achaemenids to the Sasanians.',
      ['Median Kingdom', 'Achaemenid Empire', 'Parthian Empire', 'Sasanian Empire'],
      ['Cyrus II founds the Achaemenid Empire', 'Fall of Persepolis', 'Rise of the Sasanian state']),
    greece: tr('Ancient Greece', 'Aegean cultures, poleis, Hellenistic kingdoms, and the Greek intellectual tradition.',
      ['Aegean Bronze Age', 'Archaic Greece', 'Classical Greece', 'Hellenistic world'],
      ['Traditional date of the first Olympic Games', 'Reforms of Cleisthenes in Athens', 'Death of Alexander the Great']),
    rome: tr('Ancient Rome', 'A city-state, republic, and eventually a Mediterranean empire.',
      ['Regal period', 'Roman Republic', 'Principate', 'Late Roman Empire'],
      ['Establishment of the Republic', 'Augustus assumes supreme power', 'End of the Western Roman Empire']),
    byzantium: tr('Byzantine Empire', 'The Eastern Roman Empire centered on Constantinople.',
      ['Early Byzantine period', 'Middle Byzantine period', 'Latin occupation and successor states', 'Palaiologan Renaissance'],
      ['Foundation of Constantinople', 'Hagia Sophia is dedicated', 'Fall of Constantinople']),
    steppe: tr('Scythians and Steppe Empires', 'Nomadic and semi-sedentary societies of the Eurasian steppe before and during the Mongol era.',
      ['Indo-Iranian steppe cultures', 'Scythian and Saka world', 'Hunnic confederations', 'Turkic and Mongol empires'],
      ['Spread of the Scythian animal style', 'First Turkic Khaganate', 'Genghis Khan is proclaimed']),
    indus: tr('Indus Civilization', 'The urban culture of the Indus basin, centered on Harappa and Mohenjo-daro.',
      ['Early Harappan period', 'Mature Harappan period', 'Late Harappan period', 'Post-Harappan cultures'],
      ['Mature urban phase begins', 'Indus city network flourishes', 'Deurbanization begins']),
    india: tr('Indian States', 'The political history of South Asia from the mahajanapadas to the Mughal Empire.',
      ['Mahajanapadas', 'Mauryan Empire', 'Kushans and Guptas', 'Regional sultanates and Mughals'],
      ['Foundation of the Mauryan state', 'Ashoka begins his reign', 'Foundation of the Mughal Empire']),
    china: tr('China', 'A succession of dynasties and regional states in East Asia.',
      ['Shang and Western Zhou', 'Eastern Zhou', 'Qin and Han', 'Sui, Tang, Song, Yuan, and Ming'],
      ['Qin unifies China', 'Tang dynasty begins', 'Ming dynasty begins']),
    korea: tr('Korea', 'Korean states from Gojoseon and the Three Kingdoms to Joseon.',
      ['Gojoseon and early societies', 'Three Kingdoms', 'Silla and Goryeo', 'Early Joseon'],
      ['Han commanderies on the peninsula', 'Unification under Silla', 'Foundation of Joseon']),
    japan: tr('Japan', 'The Japanese archipelago from Jōmon communities to the states of the samurai era.',
      ['Late Jōmon', 'Yayoi', 'Kofun and Nara', 'Heian, Kamakura, and Muromachi'],
      ['Yayoi rice agriculture spreads', 'Capital established at Nara', 'Kamakura shogunate']),
    central_asia: tr('Central Asia', 'Oases and trading states between Iran, India, China, and the steppe.',
      ['Bactria and Sogdia', 'Greco-Bactria and the Kushans', 'Sogdian trade networks', 'Turkic-Persian khanates'],
      ['Alexander campaigns in Sogdia', 'Kushan Empire flourishes', 'Mongol conquest of the region']),
    southeast_asia: tr('Mainland Southeast Asia', 'States of the Mekong, Irrawaddy, and Red River basins.',
      ['Bronze and Iron Age cultures', 'Funan and early mandalas', 'Chenla, Pagan, and Angkor', 'Ayutthaya and late Angkor'],
      ['Beginning of the Angkorian state', 'Foundation of the Pagan Kingdom', 'Foundation of Ayutthaya']),
    indonesia: tr('Maritime Southeast Asia', 'Seafaring societies and trading states of the Indonesian archipelago.',
      ['Austronesian expansion', 'Early port kingdoms', 'Srivijaya and Mataram', 'Majapahit and Islamic sultanates'],
      ['Early Srivijayan inscriptions', 'Foundation of Majapahit', 'Fall of Malacca']),
    oceania: tr('Oceania', 'Oceanic migrations and island societies across Melanesia, Micronesia, and Polynesia.',
      ['Lapita', 'Settlement of West Polynesia', 'East Polynesian voyaging', 'Later island societies'],
      ['Settlements on Tonga and Samoa', 'Settlement of central Polynesia', 'Māori settle New Zealand']),
    maya: tr('Maya', 'A Mesoamerican civilization known for writing, calendars, and networks of city-states.',
      ['Preclassic period', 'Early Classic period', 'Late Classic period', 'Postclassic period'],
      ['Early Maya inscriptions', 'Political reversal at Tikal', 'Chichén Itzá flourishes']),
    teotihuacan: tr('Teotihuacan and Central Mexico', 'The largest urban center of Classic Mesoamerica and its regional successors.',
      ['City formation', 'Early florescence', 'Imperial Teotihuacan', 'Decline and legacy'],
      ['Monumental rebuilding of the city', 'Intervention in Tikal', 'Urban decline begins']),
    aztec: tr('Mexica and the Aztec Empire', 'A Late Postclassic state in Central Mexico centered on Tenochtitlan.',
      ['Mexica migrations', 'Early Tenochtitlan', 'Triple Alliance', 'Late empire and conquest'],
      ['Traditional founding date of Tenochtitlan', 'Formation of the Triple Alliance', 'Fall of Tenochtitlan']),
    andes: tr('Ancient Andes', 'Cultural horizons of the Central Andes before the rise of the Inca Empire.',
      ['Caral and early centers', 'Chavín and the Early Horizon', 'Moche, Nazca, and Tiwanaku', 'Wari and later regional kingdoms'],
      ['Monumental centers at Caral', 'Chavín flourishes', 'Decline of Wari and Tiwanaku']),
    inca: tr('Inca', 'Tawantinsuyu, the largest state in pre-Columbian South America.',
      ['Early Cusco', 'Regional kingdom', 'Imperial expansion', 'Late empire and conquest'],
      ['Pachacuti begins imperial expansion', 'Reign of Topa Inca Yupanqui', 'Spanish capture of Cusco']),
    north_america: tr('Ancient North America', 'Mound-building, Ancestral Pueblo, and Mississippian societies.',
      ['Archaic societies', 'Adena and Hopewell', 'Ancestral Pueblo', 'Mississippian culture'],
      ['Hopewell ceremonial networks', 'Cahokia flourishes', 'Pueblo settlements reorganize']),
    ethiopia: tr('Ethiopia and Aksum', 'States of the Horn of Africa linked to the Red Sea and the African interior.',
      ['Pre-Aksumite cultures', 'Early Aksum', 'Christian Aksum', 'Zagwe and Solomonic dynasties'],
      ['Aksum enters Red Sea trade', 'King Ezana converts to Christianity', 'Solomonic dynasty begins']),
    west_africa: tr('West Africa', 'Urban and imperial traditions of the Sahel and forest zones.',
      ['Nok and early metallurgy', 'Ancient Ghana', 'Mali', 'Songhai and Benin'],
      ['Nok terracottas', 'Rise of the Mali Empire', 'Mansa Musa makes the pilgrimage to Mecca']),
    mesopotamian_religion: tr('Religions of Mesopotamia', 'Polytheistic cults of Sumerian, Akkadian, Babylonian, and Assyrian cities.',
      ['Early urban cults', 'Sumerian-Akkadian pantheon', 'Babylonian systematization', 'Late temple tradition'],
      ['Temple complexes of Uruk', 'Cult of Marduk takes shape', 'Library of Ashurbanipal']),
    egyptian_religion: tr('Ancient Egyptian Religion', 'Cults of Nile deities, sacred kingship, and beliefs about the afterlife.',
      ['Early Dynastic cults', 'Pyramid Texts and Osiris', 'New Kingdom temple religion', 'Late and Greco-Roman tradition'],
      ['First Pyramid Texts', 'Rise of the priesthood of Amun', 'Last known hieroglyphic inscription']),
    greek_religion: tr('Ancient Greek Religion', 'Cults of the Olympian gods, mysteries, oracles, and civic festivals.',
      ['Aegean predecessors', 'Archaic cults', 'Classical civic religion', 'Hellenistic syncretism'],
      ['Panhellenic games at Olympia', 'Delphic oracle flourishes', 'Mystery cults spread']),
    roman_religion: tr('Roman Religion', 'State and household cults of Rome, followed by emperor worship and late syncretism.',
      ['Early Italic cults', 'Republican religion', 'Imperial cult', 'Late Antique syncretism'],
      ['Republican priestly colleges', 'Augustus becomes pontifex maximus', 'Public pagan sacrifice is prohibited']),
    hinduism: tr('Vedic and Hindu Traditions', 'A diverse complex of Vedic, Brahmanical, and Hindu teachings and practices.',
      ['Early Vedic tradition', 'Late Vedic period', 'Epic and Puranic tradition', 'Temple Hinduism and bhakti'],
      ['Early Rigveda hymns take shape', 'Early Upanishads', 'Bhakti traditions expand']),
    buddhism: tr('Buddhism', 'Teachings, monastic communities, and ritual traditions traced to the Buddha.',
      ['Early communities', 'Imperial patronage and schools', 'Mahayana and the Silk Roads', 'Regional traditions of Asia'],
      ['Early Buddhist communities', 'Patronage of Ashoka', 'Traditional date for Buddhism reaching China']),
    jainism: tr('Jainism', 'An Indian śramaṇa tradition centered on nonviolence, asceticism, and liberation.',
      ['Tradition of the Tirthankaras', 'Community of Mahavira', 'Formation of the schools', 'Temple and scholarly centers'],
      ['Activity of Mahavira', 'Digambara and Śvetāmbara traditions diverge', 'Gommateshwara monument']),
    zoroastrianism: tr('Zoroastrianism', 'An Iranian religious tradition associated with the Avesta and the worship of Ahura Mazda.',
      ['Early Avestan tradition', 'Achaemenid period', 'Parthian development', 'Sasanian institutionalization'],
      ['Conventional early dating of the Gathas', 'Ahura Mazda appears in royal inscriptions', 'Sasanian patronage of the priesthood']),
    judaism: tr('Judaism', 'The monotheistic tradition of the Jewish people, scripture, and rabbinic culture.',
      ['Religion of ancient Israel', 'Babylonian exile and Second Temple', 'Early rabbinic period', 'Medieval communities'],
      ['Babylonian exile', 'Destruction of the Second Temple', 'Babylonian Talmud is redacted']),
    christianity: tr('Christianity', 'A religion that arose in Roman Judea and spread across Eurasia and Africa.',
      ['Early Christianity', 'Imperial Church', 'Eastern and Western traditions', 'Medieval Christianity'],
      ['First Christian communities emerge', 'Edict of Milan establishes toleration', 'Traditional date of the Great Schism']),
    islam: tr('Islam', 'A monotheistic tradition of the Quran and Muslim community that arose in Arabia.',
      ['Prophetic period', 'Rashidun and Umayyad caliphates', 'Abbasid era', 'Regional empires and sultanates'],
      ['Quranic revelation begins according to tradition', 'Hijra to Medina', 'Abbasid Caliphate begins']),
    manichaeism: tr('Manichaeism', 'The universalist religion of the prophet Mani, spread from the Roman world to China.',
      ['Preaching of Mani', 'Expansion west and east', 'Central Asian communities', 'Later Chinese communities'],
      ['Mani begins public preaching', 'Manichaeism among the Uyghurs', 'Communities survive in southern China']),
    sikhism: tr('Sikhism', 'A Punjabi monotheistic tradition of the Gurus, service, and community.',
      ['North Indian bhakti milieu', 'Life of Guru Nanak', 'Early Gurus', 'Formation of the community'],
      ['Birth of Guru Nanak', 'Preaching begins according to tradition', 'Amritsar becomes a community center']),
    confucianism: tr('Confucian Tradition', 'An ethical, political, and educational tradition of East Asia.',
      ['Confucius and his disciples', 'Competing schools', 'Han state classics', 'Neo-Confucianism'],
      ['Traditional birth date of Confucius', 'Imperial recognition of the classics', 'Activity of Zhu Xi']),
    daoism: tr('Daoism', 'Chinese philosophical, ritual, and communal traditions of the Dao.',
      ['Early Daoist texts', 'Celestial Masters', 'Shangqing and Lingbao', 'Imperial and monastic schools'],
      ['Daodejing takes shape', 'Traditional revelation of the Celestial Masters', 'Northern Celestial Masters gain recognition']),
    shinto: tr('Shinto', 'Japanese kami cults, shrine practices, and imperial ritual.',
      ['Prehistoric kami cults', 'Kofun rituals', 'Syncretism with Buddhism', 'Medieval kami schools'],
      ['Kofun ritual complexes', 'Kojiki is compiled', 'Engishiki ritual code']),
    mesoamerican_religion: tr('Religions of Mesoamerica', 'Diverse calendrical, sacrificial, and temple traditions of Mesoamerican peoples.',
      ['Olmec religious complex', 'Classic urban cults', 'Toltec and Maya traditions', 'Late Postclassic cults'],
      ['Olmec ceremonial centers', 'Maya temple centers flourish', 'Templo Mayor of Tenochtitlan is dedicated']),
    andean_religion: tr('Religions of the Andes', 'Cults of mountains, ancestors, and regional sanctuaries in the Central Andes.',
      ['Early ceremonial centers', 'Chavín Horizon', 'Regional cults', 'Wari, Tiwanaku, and Inca cults'],
      ['Ceremonial plazas at Caral', 'Oracle of Chavín de Huántar', 'Inca state cult'])
  };

  function normalizeLocale(value) {
    return String(value || '').toLowerCase().indexOf('ru') === 0 ? 'ru' : 'en';
  }

  function text(locale, key, values) {
    var lang = normalizeLocale(locale);
    var value = copy[lang][key] !== undefined ? copy[lang][key] : copy.en[key];
    if (value === undefined) return key;
    return String(value).replace(/\{(\w+)\}/g, function (_, name) {
      return values && values[name] !== undefined ? values[name] : '{' + name + '}';
    });
  }

  function localizeTrack(track, locale) {
    if (normalizeLocale(locale) === 'ru') return track;
    var translated = englishTracks[track.id];
    if (!translated) throw new Error('Missing English translation for ' + track.id);
    return Object.assign({}, track, {
      name: translated.name,
      summary: translated.summary,
      periods: track.periods.map(function (period, index) {
        return Object.assign({}, period, { name: translated.periods[index], note: period.note ? translated.notes[index] : '' });
      }),
      events: track.events.map(function (event, index) {
        return Object.assign({}, event, { title: translated.events[index] });
      })
    });
  }

  function localizeData(data, locale) {
    if (normalizeLocale(locale) === 'ru') return data;
    return Object.assign({}, data, {
      regions: data.regions.map(function (region) { return Object.assign({}, region, { name: regionNames[region.id] }); }),
      presets: data.presets.map(function (preset) { return Object.assign({}, preset, { name: presetNames[preset.id] }); }),
      tracks: data.tracks.map(function (track) { return localizeTrack(track, 'en'); })
    });
  }

  return {
    localizeData: localizeData,
    localizeTrack: localizeTrack,
    normalizeLocale: normalizeLocale,
    text: text
  };
}));
