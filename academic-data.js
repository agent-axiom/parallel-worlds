(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.PARALLEL_WORLDS_ACADEMIC_DATA = data;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var accessed = '2026-07-15';
  var sources = {
    'science-xianrendong-2012': {
      tier: 'A', kind: 'peer-reviewed-article',
      title: 'Early Pottery at 20,000 Years Ago in Xianrendong Cave, China',
      authors: ['Xiaohong Wu', 'Chi Zhang', 'Paul Goldberg', 'David Cohen', 'Yan Pan', 'Trina Arpin', 'Ofer Bar-Yosef'],
      publisher: 'Science', year: 2012, url: 'https://doi.org/10.1126/science.1218643', accessed: accessed
    },
    'met-east-asia-neolithic-2000': {
      tier: 'A', kind: 'scholarly-museum-chronology', title: 'China, 8000–2000 B.C.',
      publisher: 'The Metropolitan Museum of Art', year: 2000,
      url: 'https://82nd-and-fifth.metmuseum.org/toah/ht/02/eac.html', accessed: accessed
    },
    'unesco-liangzhu-2019': {
      tier: 'A', kind: 'heritage-dossier', title: 'Archaeological Ruins of Liangzhu City',
      publisher: 'UNESCO World Heritage Centre', year: 2019,
      url: 'https://whc.unesco.org/en/list/1592/', accessed: accessed
    },
    'met-jomon-2002': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'Jōmon Culture (ca. 10,500–ca. 300 B.C.)',
      publisher: 'The Metropolitan Museum of Art', year: 2002,
      url: 'https://www.metmuseum.org/essays/jomon-culture-ca-10500-ca-300-b-c', accessed: accessed
    },
    'cambridge-natufian-2017': {
      tier: 'B', kind: 'academic-synthesis', title: 'The Natufian Culture',
      authors: ['Leore Grosman'], publisher: 'Cambridge University Press', year: 2017,
      url: 'https://doi.org/10.1017/9781316106754.077', accessed: accessed
    },
    'radiocarbon-near-east-2001': {
      tier: 'A', kind: 'peer-reviewed-article',
      title: 'Proto-Neolithic and Neolithic Cultures in the Middle East—a Calibrated 14C Chronology 12,500–5500 cal BC',
      authors: ['Olivier Aurenche', 'Philippe Galet', 'Emmanuelle Régagnon-Caroline', 'Jacques Évin'],
      publisher: 'Radiocarbon', year: 2001, url: 'https://doi.org/10.1017/S0033822200038480', accessed: accessed
    },
    'unesco-gobekli-2018': {
      tier: 'A', kind: 'heritage-dossier', title: 'Göbekli Tepe',
      publisher: 'UNESCO World Heritage Centre', year: 2018,
      url: 'https://whc.unesco.org/en/list/1572/', accessed: accessed
    },
    'unesco-catalhoyuk-2012': {
      tier: 'A', kind: 'heritage-dossier', title: 'Neolithic Site of Çatalhöyük',
      publisher: 'UNESCO World Heritage Centre', year: 2012,
      url: 'https://whc.unesco.org/en/list/1405/', accessed: accessed
    },
    'british-early-egypt': {
      tier: 'A', kind: 'scholarly-museum-chronology', title: 'Early Egypt',
      publisher: 'The British Museum', year: 'n.d.',
      url: 'https://www.britishmuseum.org/collection/galleries/early-egypt', accessed: accessed
    },
    'kenoyer-indus-2011': {
      tier: 'A', kind: 'peer-reviewed-article', title: 'Changing Perspectives of the Indus Civilization: New Discoveries and Challenges',
      authors: ['J. Mark Kenoyer'], publisher: 'Indian Archaeological Society (Puratattva 41)', year: 2011,
      url: 'https://www.harappa.com/sites/default/files/pdf/Kenoyer_Changing%20Perspectives%20of%20the%20Indus%20Civilization.pdf', accessed: accessed
    },
    'cambridge-mesolithic-europe-2008': {
      tier: 'B', kind: 'academic-synthesis', title: 'Mesolithic Europe',
      authors: ['Geoff Bailey', 'Penny Spikins'], publisher: 'Cambridge University Press', year: 2008,
      url: 'https://assets.cambridge.org/97805218/55037/frontmatter/9780521855037_frontmatter.htm', accessed: accessed
    },
    'nature-americas-2020': {
      tier: 'A', kind: 'peer-reviewed-article', title: 'The timing and effect of the earliest human arrivals in North America',
      authors: ['Lorena Becerra-Valdivia', 'Thomas Higham'], publisher: 'Nature', year: 2020,
      url: 'https://doi.org/10.1038/s41586-020-2491-6', accessed: accessed
    },
    'nature-madjedbebe-2022': {
      tier: 'A', kind: 'peer-reviewed-article', title: '65,000-years of continuous grinding stone use at Madjedbebe, Northern Australia',
      publisher: 'Scientific Reports', year: 2022,
      url: 'https://doi.org/10.1038/s41598-022-15174-x', accessed: accessed
    },
    'nature-lapita-2022': {
      tier: 'A', kind: 'peer-reviewed-article', title: 'Frontier Lapita interaction with resident Papuan populations set the stage for initial peopling of the Pacific',
      publisher: 'Nature Ecology & Evolution', year: 2022,
      url: 'https://doi.org/10.1038/s41559-022-01735-w', accessed: accessed
    },
    'met-korea-1998': {
      tier: 'A', kind: 'scholarly-museum-publication', title: 'The Arts of Korea: A Resource for Educators',
      publisher: 'The Metropolitan Museum of Art', year: 1998,
      url: 'https://www.metmuseum.org/-/media/files/learn/for-educators/publications-for-educators/korea.pdf', accessed: accessed
    },
    'nm-korea-unified-silla': {
      tier: 'A', kind: 'scholarly-museum-chronology', title: 'Unified Silla Period',
      publisher: 'National Museum of Korea', year: 'n.d.',
      url: 'https://www.museum.go.kr/ENG/contents/E0201030900.do?showHallId=760&showroomCode=DM0034', accessed: accessed
    },
    'met-china-three-kingdoms': {
      tier: 'A', kind: 'museum-collection-record', title: 'Tile with Buddhist images — Three Kingdoms period (220–280)',
      publisher: 'The Metropolitan Museum of Art', year: 'n.d.',
      url: 'https://www.metmuseum.org/art/collection/search/61612', accessed: accessed
    },
    'met-uruk-2003': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'Uruk: The First City',
      publisher: 'The Metropolitan Museum of Art', year: 2003,
      url: 'https://www.metmuseum.org/essays/uruk-the-first-city', accessed: accessed
    },
    'met-sumer-early-dynastic': {
      tier: 'A', kind: 'museum-collection-record', title: 'Ornament — Sumerian, Early Dynastic, ca. 2900–2350 BCE',
      publisher: 'The Metropolitan Museum of Art', year: 'n.d.',
      url: 'https://www.metmuseum.org/art/collection/search/324886', accessed: accessed
    },
    'met-sumer-ur-iii': {
      tier: 'A', kind: 'museum-collection-record', title: 'Bead — Neo-Sumerian, Ur III, ca. 2112–2004 BCE',
      publisher: 'The Metropolitan Museum of Art', year: 'n.d.',
      url: 'https://www.metmuseum.org/art/collection/search/323922', accessed: accessed
    },
    'met-korea-renaissance-2009': {
      tier: 'A', kind: 'scholarly-museum-publication', title: 'Art of the Korean Renaissance, 1400–1600',
      publisher: 'The Metropolitan Museum of Art', year: 2009,
      url: 'https://resources.metmuseum.org/resources/metpublications/pdf/Art_of_the_Korean_Renaissance_1400_1600.pdf', accessed: accessed
    },
    'met-prehistoric-art-2007': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'Introduction to Prehistoric Art, 20,000–8000 B.C.',
      authors: ['Laura Anne Tedesco'], publisher: 'The Metropolitan Museum of Art', year: 2007,
      url: 'https://www.metmuseum.org/essays/introduction-to-prehistoric-art-20000-8000-b-c', accessed: accessed
    },
    'science-egypt-chronology-2010': {
      tier: 'A', kind: 'peer-reviewed-article', title: 'Radiocarbon-Based Chronology for Dynastic Egypt',
      authors: ['Christopher Bronk Ramsey', 'Michael W. Dee', 'Joanne M. Rowland', 'Thomas F. G. Higham', 'Stephen A. Harris', 'Fiona Brock', 'Anita Quiles', 'Eva M. Wild', 'Ezra S. Marcus', 'Andrew J. Shortland'],
      publisher: 'Science', year: 2010, url: 'https://doi.org/10.1126/science.1189395', accessed: '2026-07-16'
    },
    'royal-society-early-egypt-2013': {
      tier: 'A', kind: 'peer-reviewed-article', title: 'An absolute chronology for early Egypt using radiocarbon dating and Bayesian statistical modelling',
      authors: ['Michael Dee', 'David Wengrow', 'Andrew Shortland', 'Alice Stevenson', 'Fiona Brock', 'Linus Girdland Flink', 'Christopher Bronk Ramsey'],
      publisher: 'Proceedings of the Royal Society A', year: 2013, url: 'https://doi.org/10.1098/rspa.2013.0395', accessed: '2026-07-16'
    },
    'met-egypt-old-kingdom-2019': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'Egypt in the Old Kingdom (ca. 2649–2130 B.C.)',
      authors: ['Tara Prakash'], publisher: 'The Metropolitan Museum of Art', year: 2019,
      url: 'https://www.metmuseum.org/essays/egypt-in-the-old-kingdom-ca-2649-2150-b-c', accessed: '2026-07-16'
    },
    'met-egypt-middle-kingdom-2019': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'Egypt in the Middle Kingdom (ca. 2030–1650 B.C.)',
      authors: ['Adela Oppenheim'], publisher: 'The Metropolitan Museum of Art', year: 2019,
      url: 'https://www.metmuseum.org/essays/egypt-in-the-middle-kingdom-2030-1640-b-c', accessed: '2026-07-16'
    },
    'met-egypt-new-kingdom-2000': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'Egypt in the New Kingdom (ca. 1550–1070 B.C.)',
      authors: ['Catharine H. Roehrig'], publisher: 'The Metropolitan Museum of Art', year: 2000,
      url: 'https://www.metmuseum.org/essays/egypt-in-the-new-kingdom-ca-1550-1070-b-c', accessed: '2026-07-16'
    },
    'met-akkadian-period-2004': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'The Akkadian Period (ca. 2350–2150 B.C.)',
      authors: ['Department of Ancient Near Eastern Art'], publisher: 'The Metropolitan Museum of Art', year: 2004,
      url: 'https://www.metmuseum.org/essays/the-akkadian-period-ca-2350-2150-b-c', accessed: '2026-07-16'
    },
    'plos-mesopotamian-chronology-2016': {
      tier: 'A', kind: 'peer-reviewed-article', title: 'Integrated Tree-Ring-Radiocarbon High-Resolution Timeframe to Resolve Earlier Second Millennium BCE Mesopotamian Chronology',
      authors: ['Sturt W. Manning', 'Carol B. Griggs', 'Brita Lorentzen', 'Gökhan Barjamovic', 'Christopher Bronk Ramsey', 'Bernd Kromer', 'Eva Maria Wild'],
      publisher: 'PLOS ONE', year: 2016, url: 'https://doi.org/10.1371/journal.pone.0157144', accessed: '2026-07-16'
    },
    'met-old-babylonian-2017': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'The Isin-Larsa and Old Babylonian Periods (2004–1595 B.C.)',
      authors: ['Elizabeth Knott'], publisher: 'The Metropolitan Museum of Art', year: 2017,
      url: 'https://www.metmuseum.org/essays/the-isin-larsa-and-old-babylonian-periods-2004-1595-b-c', accessed: '2026-07-16'
    },
    'met-kassite-babylonia-2016': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'The Middle Babylonian / Kassite Period (ca. 1595–1155 B.C.) in Mesopotamia',
      authors: ['Elizabeth Knott'], publisher: 'The Metropolitan Museum of Art', year: 2016,
      url: 'https://www.metmuseum.org/essays/the-middle-babylonian-kassite-period-ca-1595-1155-b-c-in-mesopotamia', accessed: '2026-07-16'
    },
    'met-babylon-2016': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'Babylon',
      authors: ['Michael Seymour'], publisher: 'The Metropolitan Museum of Art', year: 2016,
      url: 'https://www.metmuseum.org/essays/babylon', accessed: '2026-07-16'
    },
    'met-old-assyrian-2017': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'The Old Assyrian Period',
      authors: ['Nancy Highcock'], publisher: 'The Metropolitan Museum of Art', year: 2017,
      url: 'https://www.metmuseum.org/essays/the-old-assyrian-period', accessed: '2026-07-16'
    },
    'met-assyria-2004': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'Assyria, 1365–609 B.C.',
      authors: ['Department of Ancient Near Eastern Art'], publisher: 'The Metropolitan Museum of Art', year: 2004,
      url: 'https://www.metmuseum.org/essays/assyria-1365-609-b-c', accessed: '2026-07-16'
    },
    'met-hittites-2002': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'The Hittites',
      authors: ['Department of Ancient Near Eastern Art'], publisher: 'The Metropolitan Museum of Art', year: 2002,
      url: 'https://www.metmuseum.org/essays/the-hittites', accessed: '2026-07-16'
    },
    'iranica-chronology-2004': {
      tier: 'A', kind: 'academic-encyclopedia-chronology', title: 'Chronology of Iranian History, Part 1',
      authors: ['Ehsan Yarshater'], publisher: 'Encyclopaedia Iranica', year: 2004,
      url: 'https://www.iranicaonline.org/articles/chronology-of-iranian-history-part-1/', accessed: '2026-07-16'
    },
    'iranica-arsacid-dynasty-1986': {
      tier: 'A', kind: 'academic-encyclopedia-article', title: 'Arsacids ii. The Arsacid Dynasty',
      authors: ['Klaus Schippmann'], publisher: 'Encyclopaedia Iranica', year: 1986,
      url: 'https://www.iranicaonline.org/articles/arsacids-ii/', accessed: '2026-07-16'
    },
    'iranica-sasanian-dynasty-2005': {
      tier: 'A', kind: 'academic-encyclopedia-article', title: 'Sasanian Dynasty',
      authors: ['Alireza Shapur Shahbazi'], publisher: 'Encyclopaedia Iranica', year: 2005,
      url: 'https://www.iranicaonline.org/articles/sasanian-dynasty/', accessed: '2026-07-16'
    },
    'met-greek-prehistoric-classical-2000': {
      tier: 'A', kind: 'scholarly-museum-publication', title: 'Greek Art from Prehistoric to Classical: A Resource for Educators',
      authors: ['Michael Norris'], publisher: 'The Metropolitan Museum of Art', year: 2000,
      url: 'https://www.metmuseum.org/met-publications/greek-art-from-prehistoric-to-classical', accessed: '2026-07-16'
    },
    'met-greek-archaic-2003': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'Greek Art in the Archaic Period',
      authors: ['Department of Greek and Roman Art'], publisher: 'The Metropolitan Museum of Art', year: 2003,
      url: 'https://www.metmuseum.org/essays/greek-art-in-the-archaic-period', accessed: '2026-07-16'
    },
    'met-greek-classical-2008': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'The Art of Classical Greece (ca. 480–323 B.C.)',
      authors: ['Colette Hemingway', 'Seán Hemingway'], publisher: 'The Metropolitan Museum of Art', year: 2008,
      url: 'https://www.metmuseum.org/essays/the-art-of-classical-greece-ca-480-323-b-c', accessed: '2026-07-16'
    },
    'met-greek-hellenistic-2007': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'Art of the Hellenistic Age and the Hellenistic Tradition',
      authors: ['Department of Greek and Roman Art'], publisher: 'The Metropolitan Museum of Art', year: 2007,
      url: 'https://www.metmuseum.org/essays/art-of-the-hellenistic-age-and-the-hellenistic-tradition', accessed: '2026-07-16'
    },
    'met-greek-athletics-2002': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'Athletics in Ancient Greece',
      authors: ['Colette Hemingway', 'Seán Hemingway'], publisher: 'The Metropolitan Museum of Art', year: 2002,
      url: 'https://www.metmuseum.org/essays/athletics-in-ancient-greece', accessed: '2026-07-16'
    },
    'met-roman-republic-2000': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'The Roman Republic',
      authors: ['Department of Greek and Roman Art'], publisher: 'The Metropolitan Museum of Art', year: 2000,
      url: 'https://www.metmuseum.org/essays/the-roman-republic', accessed: '2026-07-16'
    },
    'met-roman-empire-2000': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'The Roman Empire (27 B.C.–393 A.D.)',
      authors: ['Christopher S. Lightfoot'], publisher: 'The Metropolitan Museum of Art', year: 2000,
      url: 'https://www.metmuseum.org/essays/the-roman-empire-27-b-c-393-a-d', accessed: '2026-07-16'
    },
    'met-roman-kings-1989': {
      tier: 'A', kind: 'peer-reviewed-museum-journal', title: 'Of Dragons, Basilisks, and the Arms of the Seven Kings of Rome',
      authors: ['Helmut Nickel'], publisher: 'The Metropolitan Museum Journal', year: 1989,
      url: 'https://resources.metmuseum.org/resources/metpublications/pdf/Dragons_Basilisks_and_Arms_of_Seven_Kings_of_Rome_The_Metropolitan_Museum_Journal_v_24_1989.pdf', accessed: '2026-07-16'
    },
    'met-byzantium-2001': {
      tier: 'A', kind: 'scholarly-museum-essay', title: 'Byzantium (ca. 330–1453)',
      authors: ['Sarah Brooks'], publisher: 'The Metropolitan Museum of Art', year: 2001,
      url: 'https://www.metmuseum.org/essays/byzantium-ca-330-1453', accessed: '2026-07-16'
    }
  };

  function trackCopy(ruName, ruSummary, enName, enSummary, zhName, zhSummary) {
    return {
      ru: { name: ruName, summary: ruSummary },
      en: { name: enName, summary: enSummary },
      zh: { name: zhName, summary: zhSummary }
    };
  }

  function periodCopy(ruName, ruNote, enName, enNote, zhName, zhNote) {
    return {
      ru: { name: ruName, note: ruNote || '' },
      en: { name: enName, note: enNote || '' },
      zh: { name: zhName, note: zhNote || '' }
    };
  }

  function eventCopy(ruTitle, ruNote, enTitle, enNote, zhTitle, zhNote) {
    return {
      ru: { title: ruTitle, note: ruNote || '' },
      en: { title: enTitle, note: enNote || '' },
      zh: { title: zhTitle, note: zhNote || '' }
    };
  }

  function datingCopy(ruModel, enModel, zhModel, ruDisputeNote, enDisputeNote, zhDisputeNote) {
    function localized(model, disputeNote) {
      var result = {};
      if (model) result.model = model;
      if (disputeNote) result.disputeNote = disputeNote;
      return result;
    }
    return {
      ru: localized(ruModel, ruDisputeNote),
      en: localized(enModel, enDisputeNote),
      zh: localized(zhModel, zhDisputeNote)
    };
  }

  function alternativeCopy(ruLabel, enLabel, zhLabel) {
    return {
      ru: { label: ruLabel },
      en: { label: enLabel },
      zh: { label: zhLabel }
    };
  }

  function period(id, start, end, precision, basis, original, sourceIds, copy, datingExtra) {
    return {
      id: id, name: copy.ru.name, note: copy.ru.note, start: start, end: end,
      dating: Object.assign({ precision: precision, basis: basis, original: original || '' }, datingExtra || {}),
      sourceIds: sourceIds.slice(), copy: copy
    };
  }

  function event(id, year, precision, basis, original, sourceIds, copy, datingExtra) {
    return {
      id: id, title: copy.ru.title, note: copy.ru.note, year: year,
      dating: Object.assign({ precision: precision, basis: basis, original: original || '' }, datingExtra || {}),
      sourceIds: sourceIds.slice(), copy: copy
    };
  }

  function patch(type, copy, periods, events, sourceIds) {
    return {
      name: copy.ru.name, summary: copy.ru.summary, type: type, reviewStatus: 'reviewed', copy: copy,
      periods: periods, events: events, sources: sourceIds.slice()
    };
  }

  function reviewedTrack(id, region, type, copy, periods, events, sourceIds, extra) {
    return Object.assign({
      id: id, name: copy.ru.name, summary: copy.ru.summary, region: region, type: type,
      reviewStatus: 'reviewed', copy: copy, periods: periods, events: events, sources: sourceIds.slice()
    }, extra || {});
  }

  var chinaSources = ['met-korea-renaissance-2009'];
  var koreaSources = ['met-korea-1998', 'met-korea-renaissance-2009', 'nm-korea-unified-silla'];
  var patches = {
    sumer: patch('polity',
      trackCopy(
        'Шумерские города-государства', 'Политии южной Месопотамии раннединастического времени и держава III династии Ура; это не универсальная «первая цивилизация».',
        'Sumerian city-states', 'Polities of southern Mesopotamia in the Early Dynastic era and the Ur III state; this is not a universal “first civilization.”',
        '苏美尔城邦', '美索不达米亚南部早王朝时期的城邦及乌尔第三王朝国家；这并不等于普遍意义上的“第一文明”。'
      ), [
        period('sumer-early-dynastic', -2900, -2350, 'range', 'archaeological-chronology', 'ca. 2900–2350 BCE', ['met-sumer-early-dynastic'],
          periodCopy('Раннединастические города-государства', 'Ур, Лагаш, Умма и другие конкурирующие центры.', 'Early Dynastic city-states', 'Ur, Lagash, Umma, and other competing centers.', '早王朝城邦', '乌尔、拉伽什、温马等相互竞争的中心。')),
        period('sumer-ur-iii', -2112, -2004, 'range', 'historical', 'ca. 2112–2004 BCE', ['met-sumer-ur-iii'],
          periodCopy('III династия Ура', 'Централизованное государство, называвшее своих правителей царями Шумера и Аккада.', 'Third Dynasty of Ur', 'A centralized state whose rulers used the title King of Sumer and Akkad.', '乌尔第三王朝', '一个中央集权国家，其统治者使用“苏美尔和阿卡德国王”称号。'))
      ], [
        event('sumer-city-states', -2900, 'approximate', 'archaeological-chronology', 'ca. 2900 BCE', ['met-sumer-early-dynastic'],
          eventCopy('Начало раннединастической последовательности', 'Города-государства становятся основной политической формой.', 'Early Dynastic sequence begins', 'City-states become the principal political form.', '早王朝序列开始', '城邦成为主要政治形态。')),
        event('sumer-ur-nammu', -2112, 'approximate', 'historical', 'ca. 2112 BCE', ['met-sumer-ur-iii'],
          eventCopy('Начало правления Ур-Намму', 'Формирование державы III династии Ура.', 'Ur-Nammu’s reign begins', 'Formation of the Ur III state.', '乌尔纳姆统治开始', '乌尔第三王朝国家形成。'))
      ], ['met-sumer-early-dynastic', 'met-sumer-ur-iii']),

    egypt: patch('polity',
      trackCopy(
        'Династический Египет', 'Выборка основных централизованных эпох Египта. Разрывы между царствами показаны явно, а Новое царство не объединено с поздними династиями.',
        'Dynastic Egypt', 'A selection of Egypt’s major centralized eras. Gaps between kingdoms are explicit, and the New Kingdom is not merged with the later dynasties.',
        '埃及王朝时期', '选取埃及主要中央集权时期；各王国之间的间隔明确保留，新王国也不与后期王朝合并。'
      ), [
        period('egypt-early-dynastic', -3111, -2649, 'range', 'radiocarbon', 'Aha accession 3111–3045 BCE (68% HPD); sequence shown to ca. 2649 BCE', ['royal-society-early-egypt-2013', 'met-egypt-old-kingdom-2019'],
          periodCopy('Раннединастическая последовательность', 'Начальная граница отражает байесовский интервал восшествия Аха, а не мгновенное объединение всей долины Нила.', 'Early Dynastic sequence', 'The opening boundary follows the Bayesian interval for Aha’s accession, not an instantaneous unification of the entire Nile Valley.', '早王朝序列', '起点依据阿哈即位的贝叶斯区间，并不表示整个尼罗河谷在某一刻瞬间统一。'),
          { confidence: 'medium', model: 'Bayesian radiocarbon model', copy: datingCopy('Байесовская радиоуглеродная модель', 'Bayesian radiocarbon model', '贝叶斯放射性碳模型') }),
        period('egypt-old-kingdom', -2649, -2130, 'range', 'historical', 'ca. 2649–2130 BCE', ['met-egypt-old-kingdom-2019'],
          periodCopy('Древнее царство', 'Музейная хронология включает III–VIII династии.', 'Old Kingdom', 'The cited museum chronology encompasses Dynasties 3–8.', '古王国', '所引博物馆年表涵盖第三至第八王朝。'),
          { confidence: 'high' }),
        period('egypt-middle-kingdom', -2030, -1650, 'range', 'historical', 'ca. 2030–1650 BCE', ['met-egypt-middle-kingdom-2019'],
          periodCopy('Среднее царство', 'Централизованная эпоха после Первого переходного периода.', 'Middle Kingdom', 'A centralized era after the First Intermediate Period.', '中王国', '第一中间期之后的中央集权时代。'),
          { confidence: 'high' }),
        period('egypt-new-kingdom', -1550, -1070, 'range', 'historical', 'ca. 1550–1070 BCE; radiocarbon model places the start within 1570–1544 BCE', ['science-egypt-chronology-2010', 'met-egypt-new-kingdom-2000'],
          periodCopy('Новое царство', 'Поздние династии после 1070 года до н. э. намеренно не включены в этот период.', 'New Kingdom', 'Later dynasties after 1070 BCE are deliberately not folded into this period.', '新王国', '公元前1070年以后的晚期王朝未被并入这一时期。'),
          { confidence: 'high', model: 'Radiocarbon-constrained historical chronology', copy: datingCopy('Историческая хронология с радиоуглеродными ограничениями', 'Radiocarbon-constrained historical chronology', '放射性碳约束的历史年表') })
      ], [
        event('egypt-aha-accession', -3085, 'approximate', 'radiocarbon', 'median 3085 BCE; 3111–3045 BCE at 68% HPD', ['royal-society-early-egypt-2013'],
          eventCopy('Модельная дата восшествия Аха', 'Байесовская оценка ранней династической последовательности, а не точный год «основания Египта».', 'Modelled accession of Aha', 'A Bayesian estimate for the early dynastic sequence, not an exact year when “Egypt was founded.”', '阿哈即位的模型年代', '这是早王朝序列的贝叶斯估计，并非“埃及建立”的精确年份。'),
          { confidence: 'medium', model: 'Bayesian radiocarbon model', copy: datingCopy('Байесовская радиоуглеродная модель', 'Bayesian radiocarbon model', '贝叶斯放射性碳模型') }),
        event('egypt-giza-pyramids', -2551, 'approximate', 'historical', 'Khufu ca. 2551–2528 BCE', ['met-egypt-old-kingdom-2019'],
          eventCopy('Пирамиды Гизы', 'Строительство Великой пирамиды относится к правлению Хуфу; маркер поставлен у начала его музейно датированного правления.', 'Pyramids of Giza', 'The Great Pyramid belongs to Khufu’s reign; the marker is placed at the opening of the cited museum reign range.', '吉萨金字塔', '大金字塔属于胡夫统治时期；标记置于所引博物馆在位年代的起点。'),
          { confidence: 'medium' }),
        event('egypt-new-kingdom-begins', -1550, 'approximate', 'radiocarbon', 'conventional ca. 1550 BCE; modelled start 1570–1544 BCE', ['science-egypt-chronology-2010', 'met-egypt-new-kingdom-2000'],
          eventCopy('Начало Нового царства', 'Точка показывает принятую округлённую границу; радиоуглеродная модель даёт интервал.', 'New Kingdom begins', 'The marker uses the conventional rounded boundary; the radiocarbon model supplies an interval.', '新王国开始', '标记采用通常的约数边界；放射性碳模型给出的是区间。'),
          { confidence: 'high', model: 'Radiocarbon-constrained historical chronology', copy: datingCopy('Историческая хронология с радиоуглеродными ограничениями', 'Radiocarbon-constrained historical chronology', '放射性碳约束的历史年表') })
      ], ['royal-society-early-egypt-2013', 'science-egypt-chronology-2010', 'met-egypt-old-kingdom-2019', 'met-egypt-middle-kingdom-2019', 'met-egypt-new-kingdom-2000']),

    akkadia: patch('polity',
      trackCopy(
        'Аккадская династия', 'Династическая последовательность Аккада примерно 2350–2150 годов до н. э.; более ранние и поздние аккадоязычные общества не выданы за одну непрерывную империю.',
        'Akkadian dynasty', 'The Akkadian dynastic sequence of about 2350–2150 BCE; earlier and later Akkadian-speaking societies are not presented as one continuous empire.',
        '阿卡德王朝', '约公元前2350至2150年的阿卡德王朝序列；更早和更晚的阿卡德语社会不被描述为一个连续帝国。'
      ), [
        period('akkadia-sargon', -2340, -2285, 'approximate', 'historical', 'Sargon ca. 2340–2285 BCE', ['met-akkadian-period-2004'],
          periodCopy('Правление Саргона', 'Формирование территориальной державы с центром в Аккаде.', 'Reign of Sargon', 'Formation of a territorial state centered on Akkad.', '萨尔贡统治时期', '以阿卡德为中心的领土国家形成。'), { confidence: 'medium' }),
        period('akkadia-rimush-manishtushu', -2285, -2260, 'approximate', 'historical', 'between Sargon ca. 2340–2285 and Naram-Sin ca. 2260–2223 BCE', ['met-akkadian-period-2004'],
          periodCopy('Римуш и Маништушу', 'Промежуточные правления внутри аккадской династии.', 'Rimush and Manishtushu', 'Intermediate reigns within the Akkadian dynasty.', '里穆什与玛尼什图苏', '阿卡德王朝内部的中间统治阶段。'), { confidence: 'medium' }),
        period('akkadia-naram-sin', -2260, -2223, 'approximate', 'historical', 'Naram-Sin ca. 2260–2223 BCE', ['met-akkadian-period-2004'],
          periodCopy('Правление Нарам-Суэна', 'Эпоха крупнейшей территориальной экспансии династии.', 'Reign of Naram-Sin', 'The dynasty’s period of greatest territorial expansion.', '纳拉姆辛统治时期', '王朝领土扩张最盛的阶段。'), { confidence: 'medium' }),
        period('akkadia-late-dynasty', -2223, -2150, 'approximate', 'historical', 'Shar-kali-sharri ca. 2223–2198 BCE; later rulers to ca. 2150 BCE', ['met-akkadian-period-2004'],
          periodCopy('Поздняя аккадская династия', 'После Шаркалишарри власть сокращается; Дуду и Шу-туруль продолжают династическую линию.', 'Late Akkadian dynasty', 'Power contracts after Shar-kali-sharri; Dudu and Shu-Turul continue the dynastic line.', '阿卡德王朝晚期', '沙尔卡利沙里之后权力收缩；杜杜和舒图鲁尔延续王朝。'), { confidence: 'medium' })
      ], [
        event('akkadia-sargon-begins', -2340, 'approximate', 'historical', 'ca. 2340 BCE', ['met-akkadian-period-2004'],
          eventCopy('Начало правления Саргона', 'Округлённая музейная датировка.', 'Sargon’s reign begins', 'A rounded museum chronology.', '萨尔贡开始统治', '采用博物馆年表的约数。'), { confidence: 'medium' }),
        event('akkadia-naram-sin-begins', -2260, 'approximate', 'historical', 'ca. 2260 BCE', ['met-akkadian-period-2004'],
          eventCopy('Начало правления Нарам-Суэна', '', 'Naram-Sin’s reign begins', '', '纳拉姆辛开始统治', ''), { confidence: 'medium' }),
        event('akkadia-shar-kali-sharri-ends', -2198, 'approximate', 'historical', 'ca. 2198 BCE', ['met-akkadian-period-2004'],
          eventCopy('Конец правления Шаркалишарри', 'После этого аккадская власть заметно сужается, хотя династия не исчезает мгновенно.', 'Shar-kali-sharri’s reign ends', 'Akkadian power contracts sharply afterward, although the dynasty does not vanish at once.', '沙尔卡利沙里统治结束', '此后阿卡德权力明显收缩，但王朝并非立即消失。'), { confidence: 'medium' })
      ], ['met-akkadian-period-2004']),

    babylonia: patch('polity',
      trackCopy(
        'Вавилонские династии', 'Несмежные, но источниково подтверждённые периоды вавилонской государственности; пробелы не маскируются единой полосой.',
        'Babylonian dynasties', 'Non-contiguous but source-backed periods of Babylonian rule; gaps are not hidden inside one continuous bar.',
        '巴比伦诸王朝', '以可靠来源展示不连续的巴比伦统治时期；时间间隔不再被一条连续色带掩盖。'
      ), [
        period('babylonia-old-babylonian', -1894, -1595, 'disputed', 'historical', 'Old Babylonian dynasty 1894–1595 BCE in the Middle chronology', ['plos-mesopotamian-chronology-2016', 'met-old-babylonian-2017'],
          periodCopy('Старовавилонский период', 'Основная полоса следует средней хронологии; низко-средняя модель сдвигает границы на восемь лет позднее.', 'Old Babylonian period', 'The main bar follows the Middle chronology; the Low-Middle model shifts its boundaries eight years later.', '古巴比伦时期', '主时间带采用中年表；低中年表把边界整体后移八年。'),
          {
            confidence: 'medium', model: 'Middle chronology',
            alternatives: [{
              id: 'low-middle', start: -1886, end: -1587, label: 'Low-Middle chronology (8 years later)',
              copy: alternativeCopy('Низко-средняя хронология (на 8 лет позднее)', 'Low-Middle chronology (8 years later)', '低中年表（晚8年）')
            }],
            disputeNote: 'Tree-ring and radiocarbon evidence is compatible with the Middle or Low-Middle models; the display uses the conventional Middle chronology.',
            copy: datingCopy(
              'Средняя хронология', 'Middle chronology', '中年表',
              'Дендрохронологические и радиоуглеродные данные совместимы со средней или низко-средней моделями; на шкале используется традиционная средняя хронология.',
              'Tree-ring and radiocarbon evidence is compatible with the Middle or Low-Middle models; the display uses the conventional Middle chronology.',
              '树轮与放射性碳证据同时符合中年表和低中年表；主时间轴采用传统的中年表。'
            )
          }),
        period('babylonia-kassite', -1595, -1155, 'range', 'historical', 'ca. 1595–1155 BCE', ['met-kassite-babylonia-2016'],
          periodCopy('Касситская Вавилония', 'Средневавилонский период касситского правления.', 'Kassite Babylonia', 'The Middle Babylonian period under Kassite rule.', '加喜特巴比伦', '加喜特统治下的中古巴比伦时期。'), { confidence: 'high' }),
        period('babylonia-second-isin', -1155, -1026, 'range', 'historical', 'Second Dynasty of Isin ca. 1155–1026 BCE', ['met-kassite-babylonia-2016'],
          periodCopy('II династия Исина', 'Посткасситская династия; последующий длинный интервал до Нововавилонской державы показан как пробел.', 'Second Dynasty of Isin', 'A post-Kassite dynasty; the long interval before the Neo-Babylonian empire remains visible as a gap.', '伊辛第二王朝', '后加喜特王朝；至新巴比伦帝国之间的长时段保留为空档。'), { confidence: 'high' }),
        period('babylonia-neo-babylonian', -625, -539, 'range', 'historical', 'Nabopolassar 625–605; Babylon conquered 539 BCE', ['met-babylon-2016'],
          periodCopy('Нововавилонская держава', 'Династия Набопаласара и Навуходоносора II до завоевания Киром.', 'Neo-Babylonian empire', 'The dynasty of Nabopolassar and Nebuchadnezzar II until Cyrus’s conquest.', '新巴比伦帝国', '那波帕拉萨尔和尼布甲尼撒二世的王朝，终于居鲁士征服。'), { confidence: 'high' })
      ], [
        event('babylonia-hammurabi-begins', -1792, 'approximate', 'historical', '1792 BCE in the Middle chronology', ['met-old-babylonian-2017', 'plos-mesopotamian-chronology-2016'],
          eventCopy('Начало правления Хаммурапи', 'Дата следует средней хронологии.', 'Hammurabi’s reign begins', 'The date follows the Middle chronology.', '汉谟拉比开始统治', '日期采用中年表。'), { confidence: 'medium', model: 'Middle chronology', copy: datingCopy('Средняя хронология', 'Middle chronology', '中年表') }),
        event('babylonia-first-dynasty-ends', -1595, 'approximate', 'historical', '1595 BCE in the Middle chronology', ['met-old-babylonian-2017', 'plos-mesopotamian-chronology-2016'],
          eventCopy('Падение I Вавилонской династии', 'Разграбление Вавилона хеттами; абсолютная дата зависит от модели месопотамской хронологии.', 'First Dynasty of Babylon ends', 'The Hittite sack of Babylon; its absolute date depends on the Mesopotamian chronology model.', '巴比伦第一王朝结束', '赫梯人洗劫巴比伦；绝对年代取决于美索不达米亚年表模型。'), { confidence: 'medium', model: 'Middle chronology', copy: datingCopy('Средняя хронология', 'Middle chronology', '中年表') }),
        event('babylonia-cyrus-conquest', -539, 'exact', 'historical', '539 BCE', ['met-babylon-2016'],
          eventCopy('Кир завоёвывает Вавилон', 'Конец Нововавилонской державы.', 'Cyrus conquers Babylon', 'The end of the Neo-Babylonian empire.', '居鲁士征服巴比伦', '新巴比伦帝国结束。'), { confidence: 'high' })
      ], ['plos-mesopotamian-chronology-2016', 'met-old-babylonian-2017', 'met-kassite-babylonia-2016', 'met-babylon-2016']),

    assyria: patch('polity',
      trackCopy(
        'Ассирийские государства', 'Старо-, средне- и новоассирийские политические фазы с явными пробелами; культурное наследие после 609 года до н. э. не выдано за продолжающуюся державу.',
        'Assyrian states', 'Old, Middle, and Neo-Assyrian political phases with explicit gaps; cultural legacies after 609 BCE are not presented as a continuing state.',
        '亚述诸国家阶段', '明确区分古亚述、中亚述和新亚述政治阶段及其间隔；公元前609年后的文化遗产不再被描述为延续中的国家。'
      ), [
        period('assyria-old', -2000, -1600, 'approximate', 'historical', 'ca. 2000–1600 BCE', ['met-old-assyrian-2017'],
          periodCopy('Староассирийский период', 'Ашшур и документированные торговые сети, особенно в Анатолии.', 'Old Assyrian period', 'Ashur and its documented trading networks, especially in Anatolia.', '古亚述时期', '阿淑尔及其有文献记录的贸易网络，尤其是在安纳托利亚。'), { confidence: 'medium' }),
        period('assyria-middle', -1365, -1100, 'approximate', 'historical', 'revival from Ashur-uballit I ca. 1365 BCE; contraction by the end of the second millennium', ['met-assyria-2004'],
          periodCopy('Среднеассирийская держава', 'Возрождение при Ашшур-убаллите I и последующее сокращение территории к концу II тысячелетия.', 'Middle Assyrian state', 'Revival under Ashur-uballit I followed by territorial contraction toward the end of the second millennium.', '中亚述国家', '亚述乌巴利特一世时期复兴，至公元前二千纪末领土收缩。'), { confidence: 'medium' }),
        period('assyria-neo-early', -883, -721, 'range', 'historical', 'Ashurnasirpal II 883–859 to the accession of Sargon II in 721 BCE', ['met-assyria-2004'],
          periodCopy('Ранняя Новоассирийская империя', 'Экспансия от Ашшурнацирапала II до конца VIII века до н. э.', 'Early Neo-Assyrian empire', 'Expansion from Ashurnasirpal II to the late eighth century BCE.', '新亚述帝国早期', '从阿淑尔纳西尔帕二世至公元前八世纪末的扩张阶段。'), { confidence: 'high' }),
        period('assyria-neo-late', -721, -609, 'range', 'historical', 'Sargon II 721–705; imperial collapse 612–609 BCE', ['met-assyria-2004'],
          periodCopy('Поздняя Новоассирийская империя', 'Саргонидская эпоха и распад после падения Ниневии.', 'Late Neo-Assyrian empire', 'The Sargonid era and collapse after the fall of Nineveh.', '新亚述帝国晚期', '萨尔贡王朝时期及尼尼微陷落后的帝国崩溃。'), { confidence: 'high' })
      ], [
        event('assyria-trade-anatolia', -1900, 'approximate', 'historical', 'merchant archives mainly 20th–18th centuries BCE', ['met-old-assyrian-2017'],
          eventCopy('Ассирийские торговые сети в Анатолии', 'Архивы купцов документируют обмен между Ашшуром и торговыми поселениями.', 'Assyrian trade networks in Anatolia', 'Merchant archives document exchange between Ashur and trading settlements.', '亚述在安纳托利亚的贸易网络', '商人档案记录了阿淑尔与贸易聚落之间的往来。'), { confidence: 'medium' }),
        event('assyria-ashurnasirpal-begins', -883, 'exact', 'historical', '883 BCE', ['met-assyria-2004'],
          eventCopy('Начало правления Ашшурнацирапала II', 'Важный рубеж новоассирийской экспансии.', 'Ashurnasirpal II’s reign begins', 'A major threshold in Neo-Assyrian expansion.', '阿淑尔纳西尔帕二世开始统治', '新亚述扩张的重要节点。'), { confidence: 'high' }),
        event('assyria-nineveh-falls', -612, 'exact', 'historical', '612 BCE; remaining Assyrian resistance to 609 BCE', ['met-assyria-2004'],
          eventCopy('Падение Ниневии', 'Столица разграблена в 612 году; остаточное сопротивление продолжается до 609 года до н. э.', 'Fall of Nineveh', 'The capital is sacked in 612; remaining Assyrian resistance continues to 609 BCE.', '尼尼微陷落', '首都于公元前612年被攻陷；残余抵抗持续到公元前609年。'), { confidence: 'high' })
      ], ['met-old-assyrian-2017', 'met-assyria-2004']),

    hittites: patch('regional-sequence',
      trackCopy(
        'Хеттские и сиро-анатолийские политии', 'Хеттское государство и его региональные преемники показаны как разные фазы; ранние и поздние границы остаются приблизительными.',
        'Hittite and Syro-Anatolian polities', 'The Hittite state and its regional successors are shown as distinct phases; early and late boundaries remain approximate.',
        '赫梯与叙利亚—安纳托利亚政体', '赫梯国家及其区域继承政权被分为不同阶段；早期与晚期边界均为约数。'
      ), [
        period('hittites-rise', -1750, -1650, 'approximate', 'archaeological-chronology', 'Hittite-speaking polities rise ca. 1750 BCE; Hattusha becomes capital ca. 1650 BCE', ['met-hittites-2002'],
          periodCopy('Хеттские политии до Хаттусы', 'Период подъёма Анитты и других центров до закрепления столицы в Хаттусе.', 'Hittite polities before Hattusha', 'The rise of Anitta and other centers before the capital was established at Hattusha.', '哈图沙之前的赫梯政体', '阿尼塔及其他中心兴起，直至首都确立于哈图沙。'), { confidence: 'medium' }),
        period('hittites-old-kingdom', -1650, -1430, 'approximate', 'historical', 'conventional subdivision within ca. 1650–1200 BCE Hittite dominance', ['met-hittites-2002'],
          periodCopy('Древнехеттское царство', 'Граница 1430 года до н. э. — удобная историографическая конвенция внутри более широкой последовательности.', 'Old Hittite Kingdom', 'The 1430 BCE boundary is a useful historiographic convention within a broader sequence.', '古赫梯王国', '公元前1430年的边界是较长历史序列中的史学惯例。'), { confidence: 'medium', model: 'Conventional historical periodization', copy: datingCopy('Условная историческая периодизация', 'Conventional historical periodization', '通行历史分期') }),
        period('hittites-empire', -1430, -1200, 'approximate', 'historical', 'conventional imperial phase to the destruction of Hattusha ca. 1200 BCE', ['met-hittites-2002'],
          periodCopy('Хеттская имперская фаза', 'Поздняя фаза державы до разрушения Хаттусы около 1200 года до н. э.', 'Hittite imperial phase', 'The later phase of the state until Hattusha’s destruction around 1200 BCE.', '赫梯帝国阶段', '赫梯国家的后期阶段，终于约公元前1200年哈图沙被毁。'), { confidence: 'medium', model: 'Conventional historical periodization', copy: datingCopy('Условная историческая периодизация', 'Conventional historical periodization', '通行历史分期') }),
        period('hittites-successors', -1200, -700, 'approximate', 'archaeological-chronology', 'first-millennium BCE successor states after ca. 1200 BCE', ['met-hittites-2002'],
          periodCopy('Сиро-анатолийские государства-преемники', 'Региональные царства продолжали отдельные хеттские традиции, но не были продолжением единой империи.', 'Syro-Anatolian successor states', 'Regional kingdoms retained selected Hittite traditions but did not continue a single empire.', '叙利亚—安纳托利亚继承国', '区域王国保留部分赫梯传统，但并非一个统一帝国的延续。'), { confidence: 'low' })
      ], [
        event('hittites-anitta', -1750, 'approximate', 'archaeological-chronology', 'around 1750 BCE', ['met-hittites-2002'],
          eventCopy('Подъём Анитты', 'Ранний этап возвышения хеттских правителей в Центральной Анатолии.', 'Rise of Anitta', 'An early stage in the emergence of Hittite rulers in central Anatolia.', '阿尼塔兴起', '赫梯统治者在安纳托利亚中部崛起的早期阶段。'), { confidence: 'medium' }),
        event('hittites-hattusha-capital', -1650, 'approximate', 'historical', 'around 1650 BCE', ['met-hittites-2002'],
          eventCopy('Хаттуса становится столицей', 'Округлённая граница начала хеттской державы с центром в Хаттусе.', 'Hattusha becomes the capital', 'A rounded boundary for the Hittite state centered on Hattusha.', '哈图沙成为首都', '以哈图沙为中心的赫梯国家的约数起点。'), { confidence: 'medium' }),
        event('hittites-hattusha-destroyed', -1200, 'approximate', 'archaeological-chronology', 'around 1200 BCE', ['met-hittites-2002'],
          eventCopy('Разрушение Хаттусы', 'Имперская система распадается; региональные преемники продолжают некоторые традиции.', 'Hattusha is destroyed', 'The imperial system collapses; regional successors retain some traditions.', '哈图沙被毁', '帝国体系崩溃；区域继承者延续部分传统。'), { confidence: 'medium' })
      ], ['met-hittites-2002']),

    persia: patch('polity',
      trackCopy(
        'Иранские державы', 'Мидийская, Ахеменидская, Аршакидская и Сасанидская фазы показаны раздельно; селевкидский интервал сохранён как пробел.',
        'Iranian empires', 'Median, Achaemenid, Arsacid, and Sasanian phases are shown separately; the Seleucid interval remains an explicit gap.',
        '伊朗诸帝国', '米底、阿契美尼德、阿尔萨息和萨珊阶段分别展示；塞琉古统治时段保留为空档。'
      ), [
        period('persia-median', -708, -550, 'traditional', 'traditional', 'Deioces 708 BCE in the cited chronology; Cyrus unites Media and Persia in 550 BCE', ['iranica-chronology-2004'],
          periodCopy('Мидийское царство', 'Начальная дата следует традиционной хронологии Диока и не означает археологически точный момент основания.', 'Median kingdom', 'The opening follows the traditional chronology of Deioces and is not an archaeologically exact founding moment.', '米底王国', '起点沿用迪奥塞斯的传统年表，并非考古学上精确的建国时刻。'), { confidence: 'low' }),
        period('persia-achaemenid', -550, -330, 'range', 'historical', '550–330 BCE', ['iranica-chronology-2004'],
          periodCopy('Ахеменидская держава', 'От объединения Мидии и Персии Киром до гибели Дария III и конца династии.', 'Achaemenid empire', 'From Cyrus’s unification of Media and Persia to the death of Darius III and the dynasty’s end.', '阿契美尼德帝国', '从居鲁士统一米底与波斯，至大流士三世死亡和王朝终结。'), { confidence: 'high' }),
        period('persia-arsacid', -247, 224, 'disputed', 'historical', 'Arsacid era begins 247 BCE; conquest of Parthava ca. 238 BCE; dynasty ends 224 CE', ['iranica-chronology-2004', 'iranica-arsacid-dynasty-1986'],
          periodCopy('Аршакидская (Парфянская) держава', 'Основная граница следует началу аршакидской эры; альтернативная полоса начинается с завоевания Парфии парнами.', 'Arsacid (Parthian) empire', 'The main boundary follows the Arsacid era; the alternative begins with the Parni conquest of Parthia.', '阿尔萨息（安息）帝国', '主边界采用阿尔萨息纪元；替代边界从帕尼人征服帕提亚开始。'),
          {
            confidence: 'medium', model: 'Arsacid dynastic era',
            alternatives: [{
              id: 'parthava-conquest', start: -238, end: 224, label: 'Territorial rule from the conquest of Parthava, ca. 238 BCE',
              copy: alternativeCopy('Территориальное правление от завоевания Парфии, ок. 238 года до н. э.', 'Territorial rule from the conquest of Parthava, ca. 238 BCE', '自约公元前238年征服帕提亚起的领土统治')
            }],
            disputeNote: 'The 247 BCE boundary marks Arsaces’ proclamation and the dynastic era; ca. 238 BCE marks the Parni conquest of Parthava. The difference reflects what event is chosen as the political beginning.',
            copy: datingCopy(
              'Аршакидская династическая эра', 'Arsacid dynastic era', '阿尔萨息王朝纪元',
              'Граница 247 года до н. э. отмечает провозглашение Аршака и начало династической эры; около 238 года до н. э. парны завоевали Парфию. Разница зависит от выбора события, считающегося политическим началом.',
              'The 247 BCE boundary marks Arsaces’ proclamation and the dynastic era; ca. 238 BCE marks the Parni conquest of Parthava. The difference reflects what event is chosen as the political beginning.',
              '公元前247年标志阿尔萨息称王和王朝纪元开始；约公元前238年帕尼人征服帕提亚。差异来自对政治起点事件的不同选择。'
            )
          }),
        period('persia-sasanian', 224, 651, 'range', 'historical', 'dynasty established 224 CE; Sasanian rule ends 650/651 CE', ['iranica-chronology-2004', 'iranica-sasanian-dynasty-2005'],
          periodCopy('Сасанидская держава', 'Династия установлена в 224 году; финальная граница округляет завершение завоевания в 650–651 годах.', 'Sasanian empire', 'The dynasty was established in 224; the final boundary normalizes the end of conquest in 650–651.', '萨珊帝国', '王朝建立于224年；终点将650至651年的征服完成归一为651年。'), { confidence: 'high' })
      ], [
        event('persia-cyrus-unites', -550, 'exact', 'historical', '550 BCE', ['iranica-chronology-2004'],
          eventCopy('Кир объединяет Мидию и Персию', 'Начало Ахеменидской державы на этой шкале.', 'Cyrus unites Media and Persia', 'The opening of the Achaemenid empire on this timeline.', '居鲁士统一米底与波斯', '本时间轴上阿契美尼德帝国的起点。'), { confidence: 'high' }),
        event('persia-achaemenid-ends', -330, 'exact', 'historical', '330 BCE', ['iranica-chronology-2004'],
          eventCopy('Конец Ахеменидской династии', 'Гибель Дария III и захват ключевых центров Александром.', 'Achaemenid dynasty ends', 'The death of Darius III and Alexander’s capture of the major centers.', '阿契美尼德王朝结束', '大流士三世死亡，亚历山大占领主要中心。'), { confidence: 'high' }),
        event('persia-sasanian-established', 224, 'exact', 'historical', '224 CE', ['iranica-chronology-2004', 'iranica-sasanian-dynasty-2005'],
          eventCopy('Установление Сасанидской династии', 'Ардашир I побеждает последнего Аршакида.', 'Sasanian dynasty is established', 'Ardashir I defeats the last Arsacid ruler.', '萨珊王朝建立', '阿尔达希尔一世击败最后一位阿尔萨息统治者。'), { confidence: 'high' })
      ], ['iranica-chronology-2004', 'iranica-arsacid-dynasty-1986', 'iranica-sasanian-dynasty-2005']),

    greece: patch('regional-sequence',
      trackCopy(
        'Эгейский и древнегреческий мир', 'Археологическая и историческая последовательность Эгейского бронзового века, архаической, классической и эллинистической эпох; это не одна непрерывная полития.',
        'Aegean and ancient Greek world', 'An archaeological and historical sequence spanning the Aegean Bronze Age, Archaic, Classical, and Hellenistic eras; it is not one continuous polity.',
        '爱琴海与古希腊世界', '涵盖爱琴海青铜时代、古风、古典和希腊化时期的考古与历史序列；并非一个连续政体。'
      ), [
        period('greece-aegean-bronze', -3000, -1100, 'approximate', 'archaeological-chronology', 'broad Aegean Bronze Age, ca. 3000–1100 BCE', ['met-greek-prehistoric-classical-2000'],
          periodCopy('Эгейский бронзовый век', 'Широкая рамка для кикладской, минойской и микенской последовательностей, а не единое государство.', 'Aegean Bronze Age', 'A broad frame for Cycladic, Minoan, and Mycenaean sequences, not a single state.', '爱琴海青铜时代', '基克拉泽斯、米诺斯和迈锡尼序列的宽泛框架，并非单一国家。'), { confidence: 'medium' }),
        period('greece-archaic', -700, -480, 'approximate', 'historical', 'seventh century to 480 BCE', ['met-greek-archaic-2003'],
          periodCopy('Архаическая эпоха', 'Начальная граница округляет переход от геометрической эпохи; конец связан с Персидскими войнами.', 'Archaic period', 'The opening rounds the transition from the Geometric era; the end is associated with the Persian Wars.', '古风时期', '起点概括了从几何风格时代的过渡；终点与希波战争相关。'), { confidence: 'medium', model: 'Conventional art-historical periodization', copy: datingCopy('Условная искусствоведческая периодизация', 'Conventional art-historical periodization', '通行艺术史分期') }),
        period('greece-classical', -480, -323, 'range', 'historical', 'ca. 480–323 BCE', ['met-greek-classical-2008'],
          periodCopy('Классическая эпоха', 'Принятая историко-художественная граница от Персидских войн до смерти Александра.', 'Classical period', 'The conventional art-historical span from the Persian Wars to Alexander’s death.', '古典时期', '从希波战争至亚历山大去世的通行艺术史分期。'), { confidence: 'high' }),
        period('greece-hellenistic', -323, -31, 'range', 'historical', '323–31 BCE; conventional end at Actium', ['met-greek-hellenistic-2007'],
          periodCopy('Эллинистическая эпоха', 'От смерти Александра до принятого завершения при Акции в 31 году до н. э.', 'Hellenistic period', 'From Alexander’s death to the conventional end at Actium in 31 BCE.', '希腊化时期', '从亚历山大去世至公元前31年亚克兴战役这一通行终点。'), { confidence: 'high' })
      ], [
        event('greece-olympics-traditional', -776, 'traditional', 'traditional', 'traditional inauguration in 776 BCE', ['met-greek-athletics-2002'],
          eventCopy('Традиционная дата первых Олимпийских игр', 'Источник прямо обозначает 776 год до н. э. как традиционную, а не археологически точную дату.', 'Traditional date of the first Olympic Games', 'The source explicitly presents 776 BCE as traditional rather than an archaeologically exact date.', '首届奥林匹克运动会的传统年代', '来源明确将公元前776年视为传统年代，而非考古学上的精确日期。'), { confidence: 'low' }),
        event('greece-classical-begins', -480, 'approximate', 'historical', 'conventional boundary ca. 480 BCE', ['met-greek-classical-2008'],
          eventCopy('Условное начало классической эпохи', 'Периодизационная граница, связанная с Персидскими войнами.', 'Conventional start of the Classical period', 'A period boundary associated with the Persian Wars.', '古典时期的通行起点', '与希波战争相关的分期边界。'), { confidence: 'high' }),
        event('greece-alexander-dies', -323, 'exact', 'historical', '323 BCE', ['met-greek-classical-2008', 'met-greek-hellenistic-2007'],
          eventCopy('Смерть Александра Македонского', 'Принятая граница между классической и эллинистической эпохами.', 'Death of Alexander the Great', 'The conventional boundary between the Classical and Hellenistic periods.', '亚历山大大帝去世', '古典时期与希腊化时期的通行分界。'), { confidence: 'high' })
      ], ['met-greek-prehistoric-classical-2000', 'met-greek-archaic-2003', 'met-greek-classical-2008', 'met-greek-hellenistic-2007', 'met-greek-athletics-2002']),

    rome: patch('polity',
      trackCopy(
        'Римское государство', 'Традиционный царский период, республика и западная империя; легендарные ранние границы отделены от хорошо засвидетельствованных имперских дат.',
        'Roman state', 'The traditional regal period, Republic, and western empire; legendary early boundaries are distinguished from well-attested imperial dates.',
        '罗马国家', '传统王政时期、共和国与西部帝国；传说性的早期边界与证据充分的帝国年代明确区分。'
      ), [
        period('rome-kings', -753, -509, 'traditional', 'traditional', 'traditional royal chronology, 753–509 BCE', ['met-roman-kings-1989', 'met-roman-republic-2000'],
          periodCopy('Традиционный царский период', '753 год до н. э. происходит из литературной традиции о Ромуле; археология показывает более длительное развитие поселения.', 'Traditional regal period', '753 BCE comes from the literary tradition of Romulus; archaeology shows a longer settlement history.', '传统王政时期', '公元前753年来自罗慕路斯的文学传统；考古材料显示聚落经历了更长的发展过程。'), { confidence: 'low', model: 'Roman literary tradition', copy: datingCopy('Римская литературная традиция', 'Roman literary tradition', '罗马文学传统') }),
        period('rome-republic', -509, -27, 'traditional', 'traditional', 'traditional/conventional start 509 BCE; Augustus 27 BCE', ['met-roman-republic-2000'],
          periodCopy('Римская республика', 'Начальная граница 509 года до н. э. традиционна; переход к принципату в 27 году засвидетельствован точнее.', 'Roman Republic', 'The 509 BCE opening is traditional; the transition to the Principate in 27 BCE is more securely attested.', '罗马共和国', '公元前509年的起点属传统年代；公元前27年向元首制的过渡证据更为确切。'), { confidence: 'medium', model: 'Traditional republican chronology', copy: datingCopy('Традиционная республиканская хронология', 'Traditional republican chronology', '传统共和国年表') }),
        period('rome-principate', -27, 284, 'range', 'historical', '27 BCE–284 CE', ['met-roman-empire-2000'],
          periodCopy('Принципат и ранняя империя', 'От получения Октавианом титула Августа до прихода Диоклетиана.', 'Principate and early empire', 'From Octavian receiving the title Augustus to Diocletian’s accession.', '元首制与早期帝国', '从屋大维获“奥古斯都”称号至戴克里先即位。'), { confidence: 'high' }),
        period('rome-late-empire', 284, 476, 'range', 'historical', '284–476 CE for the western empire', ['met-roman-empire-2000'],
          periodCopy('Поздняя Западная Римская империя', 'Восточные провинции продолжаются после западной границы 476 года и показаны отдельно как Византия.', 'Late Western Roman Empire', 'The eastern provinces continue after the western boundary of 476 and are shown separately as Byzantium.', '西罗马帝国晚期', '东部行省在476年西部终点后继续存在，并作为拜占庭单独展示。'), { confidence: 'high' })
      ], [
        event('rome-republic-traditional', -509, 'traditional', 'traditional', 'traditional start in 509 BCE', ['met-roman-republic-2000'],
          eventCopy('Традиционное установление республики', 'Это условная раннеримская граница, а не дата современной точности.', 'Traditional establishment of the Republic', 'This is a conventional early Roman boundary, not a date of modern precision.', '共和国建立的传统年代', '这是古罗马早期的通行边界，并非现代意义上的精确日期。'), { confidence: 'low' }),
        event('rome-augustus', -27, 'exact', 'historical', '27 BCE', ['met-roman-republic-2000', 'met-roman-empire-2000'],
          eventCopy('Октавиан получает титул Августа', 'Принятая граница начала принципата.', 'Octavian receives the title Augustus', 'The conventional opening of the Principate.', '屋大维获“奥古斯都”称号', '元首制开始的通行边界。'), { confidence: 'high' }),
        event('rome-western-end', 476, 'exact', 'historical', '476 CE', ['met-roman-empire-2000'],
          eventCopy('Смещение последнего западного императора', 'Одоакр смещает Ромула Августула; Восточная Римская империя продолжается.', 'Last western emperor is deposed', 'Odoacer deposes Romulus Augustulus; the Eastern Roman Empire continues.', '最后一位西部皇帝被废黜', '奥多亚塞废黜罗慕路斯·奥古斯都；东罗马帝国继续存在。'), { confidence: 'high' })
      ], ['met-roman-kings-1989', 'met-roman-republic-2000', 'met-roman-empire-2000']),

    byzantium: patch('polity',
      trackCopy(
        'Византийская империя', 'Восточная Римская империя с центром в Константинополе; периодизация следует музейной схеме 330–843, 843–1204, 1204–1261 и 1261–1453.',
        'Byzantine Empire', 'The Eastern Roman Empire centered on Constantinople; the periodization follows the museum sequence 330–843, 843–1204, 1204–1261, and 1261–1453.',
        '拜占庭帝国', '以君士坦丁堡为中心的东罗马帝国；分期采用博物馆的330–843、843–1204、1204–1261和1261–1453序列。'
      ), [
        period('byzantium-early', 330, 843, 'range', 'historical', 'Early Byzantine period, 330–843 CE', ['met-byzantium-2001'],
          periodCopy('Ранневизантийский период', 'От основания Константинополя до принятой границы восстановления иконопочитания.', 'Early Byzantine period', 'From Constantinople’s foundation to the conventional boundary at the restoration of icons.', '早期拜占庭时期', '从君士坦丁堡建立至恢复圣像崇拜这一通行边界。'), { confidence: 'high' }),
        period('byzantium-middle', 843, 1204, 'range', 'historical', 'Middle Byzantine period, 843–1204 CE', ['met-byzantium-2001'],
          periodCopy('Средневизантийский период', 'Период после иконоборчества до захвата Константинополя крестоносцами.', 'Middle Byzantine period', 'The era after Iconoclasm until the crusader capture of Constantinople.', '中期拜占庭时期', '从圣像破坏运动结束至十字军占领君士坦丁堡。'), { confidence: 'high' }),
        period('byzantium-latin', 1204, 1261, 'range', 'historical', 'Latin occupation, 1204–1261 CE', ['met-byzantium-2001'],
          periodCopy('Латинская оккупация и государства-преемники', 'Константинополь находится под властью латинян; византийские центры существуют вне столицы.', 'Latin occupation and successor states', 'Constantinople is under Latin rule while Byzantine centers survive outside the capital.', '拉丁占领与继承国家', '君士坦丁堡处于拉丁统治之下，拜占庭中心在首都之外延续。'), { confidence: 'high' }),
        period('byzantium-late', 1261, 1453, 'range', 'historical', 'Late Byzantine period, 1261–1453 CE', ['met-byzantium-2001'],
          periodCopy('Поздневизантийский период', 'От возвращения столицы Палеологами до османского завоевания.', 'Late Byzantine period', 'From the Palaiologan recovery of the capital to the Ottoman conquest.', '晚期拜占庭时期', '从巴列奥略王朝收复首都至奥斯曼征服。'), { confidence: 'high' })
      ], [
        event('byzantium-constantinople-founded', 330, 'exact', 'historical', '330 CE', ['met-byzantium-2001'],
          eventCopy('Основание Константинополя', 'Константин основывает новую имперскую столицу.', 'Constantinople is founded', 'Constantine establishes a new imperial capital.', '君士坦丁堡建立', '君士坦丁建立新的帝国首都。'), { confidence: 'high' }),
        event('byzantium-latin-capture', 1204, 'exact', 'historical', '1204 CE', ['met-byzantium-2001'],
          eventCopy('Захват Константинополя крестоносцами', 'Начало латинской оккупации 1204–1261 годов.', 'Crusaders capture Constantinople', 'The opening of the Latin occupation of 1204–1261.', '十字军占领君士坦丁堡', '1204至1261年拉丁占领开始。'), { confidence: 'high' }),
        event('byzantium-constantinople-falls', 1453, 'exact', 'historical', '1453 CE', ['met-byzantium-2001'],
          eventCopy('Падение Константинополя', 'Османское завоевание завершает византийскую государственную линию.', 'Fall of Constantinople', 'The Ottoman conquest ends the Byzantine state sequence.', '君士坦丁堡陷落', '奥斯曼征服结束拜占庭国家序列。'), { confidence: 'high' })
      ], ['met-byzantium-2001']),

    china: patch('regional-sequence',
      trackCopy(
        'Исторические государства Китая', 'Последовательность и сосуществование династий и региональных государств на территории современного Китая.',
        'Historical states in China', 'A sequence and coexistence of dynasties and regional states in the territory of present-day China.',
        '中国历史政权', '今中国境内历代王朝与区域政权的先后和并存。'
      ), [
        period('china-shang', -1600, -1100, 'approximate', 'historical', 'ca. 1600–1100 BCE', chinaSources,
          periodCopy('Шан', 'Раннее государство бронзового века.', 'Shang', 'An early Bronze Age state.', '商', '青铜时代早期国家。')),
        period('china-zhou', -1100, -221, 'range', 'historical', 'ca. 1100–221 BCE', chinaSources,
          periodCopy('Чжоу', 'Западная и Восточная Чжоу; поздний период включает соперничающие царства.', 'Zhou', 'Western and Eastern Zhou; the later era includes competing states.', '周', '西周和东周；后期包括诸侯国竞争。')),
        period('china-qin-han', -221, 220, 'range', 'historical', '221 BCE–220 CE', chinaSources,
          periodCopy('Цинь и Хань', 'Имперское объединение и длительная ханьская эпоха.', 'Qin and Han', 'Imperial unification followed by the long Han era.', '秦汉', '帝国统一及其后的长期汉代。')),
        period('china-three-kingdoms', 220, 280, 'range', 'historical', '220–280 CE', ['met-china-three-kingdoms'],
          periodCopy('Китайское Троецарствие: Вэй, Шу и У', 'Период разделения после Хань; не путать с Тремя царствами Кореи.', 'Chinese Three Kingdoms', 'Wei, Shu, and Wu after the Han; not the Korean Three Kingdoms.', '中国三国：魏、蜀、吴', '汉朝之后的分裂时期；不同于朝鲜半岛三国。')),
        period('china-jin-sixteen-kingdoms', 280, 386, 'range', 'historical', '280–386 CE', chinaSources,
          periodCopy('Цзинь и Шестнадцать государств', 'Политическая фрагментация с частично перекрывающимися режимами.', 'Jin and the Sixteen Kingdoms', 'Political fragmentation with partly overlapping regimes.', '晋与十六国', '多个政权部分重叠的政治分裂时期。')),
        period('china-northern-southern-dynasties', 386, 589, 'range', 'historical', '386–589 CE', chinaSources,
          periodCopy('Северные и Южные династии', 'Параллельные династии на севере и юге.', 'Northern and Southern Dynasties', 'Parallel dynasties in northern and southern China.', '南北朝', '中国南北方并立的王朝。')),
        period('china-sui-tang', 581, 907, 'range', 'historical', 'Sui 581–618; Tang 618–907 CE', chinaSources,
          periodCopy('Суй и Тан', 'Повторное объединение и империя Тан.', 'Sui and Tang', 'Reunification followed by the Tang empire.', '隋唐', '重新统一及其后的唐帝国。')),
        period('china-five-dynasties', 907, 960, 'range', 'historical', '907–960 CE', chinaSources,
          periodCopy('Пять династий', 'Переходная эпоха региональных государств.', 'Five Dynasties', 'A transitional era of regional states.', '五代', '区域政权并立的过渡时期。')),
        period('china-song-liao-jin', 960, 1279, 'range', 'historical', 'Song 960–1279; Liao 916–1125; Jin 1115–1234 CE', chinaSources,
          periodCopy('Сун, Ляо и Цзинь', 'Сосуществующие государства, а не единая непрерывная династия.', 'Song, Liao, and Jin', 'Coexisting states rather than a single uninterrupted dynasty.', '宋、辽、金', '多个并存政权，而非单一连续王朝。')),
        period('china-yuan', 1271, 1368, 'range', 'historical', '1271–1368 CE', chinaSources,
          periodCopy('Юань', 'Монгольская династия Юань.', 'Yuan', 'The Mongol Yuan dynasty.', '元', '蒙古族建立的元朝。')),
        period('china-ming', 1368, 1600, 'range', 'historical', '1368–1644 CE; display clipped at 1600', chinaSources,
          periodCopy('Мин до границы шкалы', 'Династия продолжается после 1600 года.', 'Ming to the timeline boundary', 'The dynasty continues beyond 1600.', '明（至时间轴边界）', '明朝延续至1600年之后。'))
      ], [
        event('china-qin-unification', -221, 'exact', 'historical', '221 BCE', chinaSources,
          eventCopy('Объединение Цинь', 'Начало имперской эпохи.', 'Qin unification', 'The beginning of the imperial era.', '秦统一', '帝国时代开始。')),
        event('china-three-kingdoms-begin', 220, 'exact', 'historical', '220 CE', ['met-china-three-kingdoms'],
          eventCopy('Начало китайского Троецарствия', 'Формируются Вэй, Шу и У.', 'Chinese Three Kingdoms begins', 'Wei, Shu, and Wu take shape.', '中国三国时期开始', '魏、蜀、吴形成。')),
        event('china-sui', 581, 'exact', 'historical', '581 CE', chinaSources,
          eventCopy('Начало династии Суй', 'Этап повторного объединения.', 'Sui dynasty begins', 'A stage in reunification.', '隋朝建立', '重新统一的阶段。')),
        event('china-ming-begins', 1368, 'exact', 'historical', '1368 CE', chinaSources,
          eventCopy('Начало династии Мин', '', 'Ming dynasty begins', '', '明朝建立', ''))
      ], ['met-korea-renaissance-2009', 'met-china-three-kingdoms']),

    korea: patch('regional-sequence',
      trackCopy(
        'История Корейского полуострова', 'Археологические периоды и государства Корейского полуострова; корейские Три царства не относятся к китайскому Троецарствию.',
        'History of the Korean Peninsula', 'Archaeological periods and states of the Korean Peninsula; the Korean Three Kingdoms are distinct from China’s Three Kingdoms.',
        '朝鲜半岛历史', '朝鲜半岛的考古时期与国家；朝鲜半岛三国不同于中国三国。'
      ), [
        period('korea-neolithic', -7000, -1000, 'approximate', 'archaeological-chronology', 'ca. 7000–10th century BCE', ['met-korea-1998'],
          periodCopy('Неолит Корейского полуострова', 'Широкая археологическая последовательность, а не единое государство.', 'Korean Peninsula Neolithic', 'A broad archaeological sequence, not a single state.', '朝鲜半岛新石器时代', '广泛的考古序列，而非单一国家。')),
        period('korea-bronze-iron', -1000, -57, 'approximate', 'archaeological-chronology', 'ca. 10th century–57 BCE', ['met-korea-1998'],
          periodCopy('Бронзовый и ранний железный век', 'Включает Кочосон, Пуё и Самхан в более широкой региональной картине.', 'Bronze and early Iron Ages', 'Includes Gojoseon, Buyeo, and Samhan in a wider regional picture.', '青铜时代与早期铁器时代', '在更广泛的区域框架中包括古朝鲜、扶余和三韩。')),
        period('korea-three-kingdoms', -57, 668, 'traditional', 'traditional', 'traditional periodization: 57 BCE–668 CE', ['met-korea-1998', 'met-korea-renaissance-2009'],
          periodCopy('Корейские Три царства: Когурё, Пэкче и Силла', 'Традиционная периодизация; царства возникали и прекращались в разные годы. Не китайское Троецарствие.', 'Korean Three Kingdoms: Goguryeo, Baekje, and Silla', 'Traditional periodization; the kingdoms began and ended in different years. Not the Chinese Three Kingdoms.', '朝鲜半岛三国：高句丽、百济、新罗', '传统分期；各国建立和终结年份不同。并非中国三国。')),
        period('korea-unified-silla-balhae', 668, 935, 'range', 'historical', 'Unified Silla 668/676–935; Balhae 698–926 CE', ['met-korea-renaissance-2009', 'nm-korea-unified-silla'],
          periodCopy('Объединённая Силла и Пархэ', 'Два современника: Силла на юге полуострова и Пархэ севернее.', 'Unified Silla and Balhae', 'Contemporaries: Silla in the south and Balhae farther north.', '统一新罗与渤海', '并存政权：南部的新罗和更北方的渤海。')),
        period('korea-goryeo', 918, 1392, 'range', 'historical', '918–1392 CE', ['met-korea-renaissance-2009'],
          periodCopy('Корё', 'Династия, от названия которой происходит европейское слово Korea.', 'Goryeo', 'The dynasty whose name is the source of the European word Korea.', '高丽', '欧洲语言中“Korea”一词源自其国名。')),
        period('korea-joseon', 1392, 1600, 'range', 'historical', '1392–1910 CE; display clipped at 1600', ['met-korea-renaissance-2009'],
          periodCopy('Ранний Чосон', 'Династия продолжается после 1600 года.', 'Early Joseon', 'The dynasty continues beyond 1600.', '朝鲜王朝前期', '该王朝延续至1600年之后。'))
      ], [
        event('korea-three-kingdoms-traditional', -57, 'traditional', 'traditional', 'traditional start: 57 BCE', ['met-korea-1998'],
          eventCopy('Традиционное начало периода Трёх царств', 'Это рамка поздней историографии, а не одновременное основание трёх государств.', 'Traditional start of the Three Kingdoms period', 'A later historiographic frame, not the simultaneous founding of all three states.', '三国时期传统起点', '这是后世史学分期，并非三国同时建立。')),
        event('korea-buddhism', 372, 'exact', 'historical', '372 CE', ['met-korea-1998'],
          eventCopy('Буддизм принят в Когурё', '', 'Buddhism is adopted in Goguryeo', '', '高句丽接受佛教', '')),
        event('korea-unified-silla', 668, 'traditional', 'historical', '668/676 CE', ['nm-korea-unified-silla'],
          eventCopy('Переход к периоду Объединённой Силла', 'Музей Кореи датирует фактический контроль Силла над большей частью полуострова 676 годом.', 'Transition to Unified Silla', 'The National Museum of Korea dates Silla control over most of the peninsula to 676.', '进入统一新罗时期', '韩国国立中央博物馆将新罗控制半岛大部定于676年。')),
        event('korea-goryeo-founded', 918, 'exact', 'historical', '918 CE', ['met-korea-renaissance-2009'],
          eventCopy('Основание Корё', '', 'Goryeo is founded', '', '高丽建立', ''))
      ], koreaSources)
  };

  var urukCopy = trackCopy(
    'Урук — ранний городской центр', 'Археологический памятник и крупный городской центр южной Месопотамии; он показан отдельно от шумерских государств.',
    'Uruk — an early urban center', 'An archaeological site and major urban center in southern Mesopotamia, shown separately from Sumerian polities.',
    '乌鲁克——早期城市中心', '美索不达米亚南部的考古遗址和大型城市中心，与苏美尔政权分开显示。'
  );
  var tracks = [{
    id: 'uruk', name: urukCopy.ru.name, summary: urukCopy.ru.summary, region: 'mesopotamia', type: 'site', reviewStatus: 'reviewed', copy: urukCopy,
    periods: [period('uruk-urban', -3500, -3100, 'approximate', 'archaeological-chronology', 'ca. 3500–3100 BCE', ['met-uruk-2003'],
      periodCopy('Урукский городской центр', 'К 3200 году до н. э. Урук был крупнейшим известным поселением южной Месопотамии.', 'Uruk urban center', 'By 3200 BCE, Uruk was the largest known settlement in southern Mesopotamia.', '乌鲁克城市中心', '至公元前3200年，乌鲁克已是美索不达米亚南部已知最大的聚落。'))],
    events: [event('uruk-major-city', -3200, 'approximate', 'archaeological-chronology', 'by ca. 3200 BCE', ['met-uruk-2003'],
      eventCopy('Урук становится крупным городским центром', 'Рост города не равнозначен появлению одной «первой цивилизации».', 'Uruk becomes a major urban center', 'Urban growth is not the same as the appearance of a single “first civilization.”', '乌鲁克成为大型城市中心', '城市发展并不等于出现单一的“第一文明”。'))],
    sources: ['met-uruk-2003']
  }];

  tracks.push(
    reviewedTrack('xianrendong', 'east-asia', 'site',
      trackCopy(
        'Пещера Сяньжэньдун: ранняя керамика', 'Археологические свидетельства изготовления керамики охотниками-собирателями в пещере на территории современного юго-восточного Китая.',
        'Xianrendong Cave: early pottery', 'Archaeological evidence for pottery made by hunter-gatherers at a cave in the territory of present-day southeastern China.',
        '仙人洞：早期陶器证据', '今中国东南部一处洞穴中狩猎采集者制作陶器的考古证据。'
      ), [
        period('xianrendong-pottery', -18050, -17050, 'range', 'radiocarbon', 'ca. 20,000–19,000 cal BP (approximately 18,050–17,050 cal BCE)', ['science-xianrendong-2012'],
          periodCopy('Слой с ранней керамикой', 'cal BP пересчитано в приблизительный диапазон до н. э.; это памятник, не государство и не «цивилизация Китая».', 'Early pottery-bearing layer', 'cal BP is normalized to an approximate BCE range; this is a site, not a state or a “Chinese civilization.”', '早期陶器层', '将cal BP换算为近似公元前年代；这是遗址，并非国家或“中国文明”。'))
      ], [
        event('xianrendong-pottery-evidence', -18000, 'approximate', 'radiocarbon', 'about 20,000 years before present', ['science-xianrendong-2012'],
          eventCopy('Датированы фрагменты ранней керамики', 'Одна из древнейших надёжно датированных керамических последовательностей.', 'Early pottery fragments are dated', 'One of the earliest securely dated pottery sequences.', '早期陶片年代得到测定', '目前最早的可靠测年陶器序列之一。'))
      ], ['science-xianrendong-2012']),

    reviewedTrack('jomon', 'east-asia', 'archaeological-culture',
      trackCopy(
        'Археологическая последовательность Дзёмон', 'Длительная и регионально разнообразная последовательность охотников, собирателей и рыболовов Японского архипелага с керамическими традициями.',
        'Jōmon archaeological sequence', 'A long, regionally diverse sequence of hunter-gatherer-fisher communities in the Japanese archipelago with pottery traditions.',
        '绳纹考古序列', '日本列岛具有陶器传统、地区差异显著且延续长久的狩猎采集渔猎社群序列。'
      ), [
        period('jomon-sequence', -10500, -300, 'approximate', 'archaeological-chronology', 'ca. 10,500–300 BCE in the cited museum chronology', ['met-jomon-2002'],
          periodCopy('Дзёмон', 'Зонтичная периодизация с большими региональными различиями.', 'Jōmon', 'An umbrella periodization with substantial regional variation.', '绳纹时代', '包含显著地区差异的总括性分期。'))
      ], [
        event('jomon-incipient', -10500, 'approximate', 'archaeological-chronology', 'ca. 10,500 BCE', ['met-jomon-2002'],
          eventCopy('Начало начального Дзёмона по музейной хронологии', 'Другие современные хронологии могут давать более раннюю границу.', 'Incipient Jōmon begins in the cited museum chronology', 'Other modern chronologies may use an earlier boundary.', '所引博物馆年表中的草创期绳纹开始', '其他当代年表可能采用更早的起点。'))
      ], ['met-jomon-2002']),

    reviewedTrack('liangzhu', 'east-asia', 'archaeological-culture',
      trackCopy(
        'Лянчжу', 'Поздненеолитическая археологическая культура и раннее региональное государство в низовьях Янцзы, на территории современного Китая.',
        'Liangzhu', 'A Late Neolithic archaeological culture and early regional state in the lower Yangtze, in the territory of present-day China.',
        '良渚', '今中国长江下游的晚期新石器时代考古文化和早期区域国家。'
      ), [
        period('liangzhu-city', -3300, -2300, 'range', 'archaeological-chronology', 'ca. 3300–2300 BCE', ['unesco-liangzhu-2019'],
          periodCopy('Городской комплекс Лянчжу', 'Город, гидротехническая система и социально различающиеся погребения.', 'Liangzhu urban complex', 'City, water-management system, and socially differentiated burials.', '良渚城市综合体', '城市、水利系统和具有社会分化的墓葬。'))
      ], [
        event('liangzhu-regional-state', -3000, 'approximate', 'archaeological-chronology', 'within ca. 3300–2300 BCE', ['unesco-liangzhu-2019'],
          eventCopy('Функционирует ранний региональный центр', 'UNESCO описывает Лянчжу как центр власти и верований раннего регионального государства.', 'An early regional center is active', 'UNESCO describes Liangzhu as a center of power and belief for an early regional state.', '早期区域中心活跃', '联合国教科文组织将良渚描述为早期区域国家的权力与信仰中心。'))
      ], ['unesco-liangzhu-2019']),

    reviewedTrack('natufian', 'west-asia', 'archaeological-culture',
      trackCopy(
        'Натуфийская археологическая культура', 'Эпипалеолитическая последовательность южного Леванта, важная для изучения оседлости до земледелия.',
        'Natufian archaeological culture', 'An Epipalaeolithic sequence in the southern Levant important for studying sedentism before farming.',
        '纳图夫考古文化', '南黎凡特的旧石器时代晚期序列，对研究农业之前的定居生活十分重要。'
      ), [
        period('natufian-sequence', -13050, -9550, 'range', 'radiocarbon', 'ca. 15,000–11,500 cal BP (approximately 13,050–9550 cal BCE)', ['cambridge-natufian-2017'],
          periodCopy('Натуфийская последовательность', 'Границы нормализованы из cal BP и остаются приблизительными.', 'Natufian sequence', 'Boundaries are normalized from cal BP and remain approximate.', '纳图夫序列', '边界由cal BP换算，仍为近似值。'))
      ], [
        event('natufian-sedentism', -12000, 'approximate', 'archaeological-chronology', 'within 15,000–11,500 cal BP', ['cambridge-natufian-2017'],
          eventCopy('Распространяются более постоянные поселения', 'Оседлость предшествует полностью земледельческой экономике.', 'More permanent settlements spread', 'Sedentism precedes a fully agricultural economy.', '更为固定的聚落扩展', '定居早于完全农业经济。'))
      ], ['cambridge-natufian-2017']),

    reviewedTrack('gobekli-tepe', 'west-asia', 'site',
      trackCopy(
        'Гёбекли-Тепе', 'Монументальный памятник докерамического неолита в Верхней Месопотамии, на территории современной Турции.',
        'Göbekli Tepe', 'A monumental Pre-Pottery Neolithic site in Upper Mesopotamia, in the territory of present-day Türkiye.',
        '哥贝克力石阵', '今土耳其境内上美索不达米亚的一处前陶新石器时代纪念性遗址。'
      ), [
        period('gobekli-monuments', -9600, -8200, 'range', 'archaeological-chronology', '9600–8200 BCE', ['unesco-gobekli-2018'],
          periodCopy('Монументальные сооружения', 'Круглые и прямоугольные комплексы с Т-образными столбами.', 'Monumental enclosures', 'Circular and rectangular complexes with T-shaped pillars.', '纪念性建筑群', '具有T形石柱的圆形和矩形建筑群。'))
      ], [
        event('gobekli-building', -9500, 'approximate', 'archaeological-chronology', 'early 10th millennium BCE', ['unesco-gobekli-2018'],
          eventCopy('Начинается строительство монументальных комплексов', '', 'Monumental building begins', '', '纪念性建筑开始建造', ''))
      ], ['unesco-gobekli-2018']),

    reviewedTrack('catalhoyuk', 'west-asia', 'site',
      trackCopy(
        'Чатал-Хююк', 'Крупное неолитическое поселение в Анатолии, на территории современной Турции, с плотной застройкой и многослойной историей.',
        'Çatalhöyük', 'A large Neolithic settlement in Anatolia, in the territory of present-day Türkiye, with dense building and a long stratigraphy.',
        '恰塔霍裕克', '今土耳其安纳托利亚的一处大型新石器时代聚落，建筑密集且地层延续长久。'
      ), [
        period('catalhoyuk-east-mound', -7400, -6200, 'range', 'archaeological-chronology', '7400–6200 BCE', ['unesco-catalhoyuk-2012'],
          periodCopy('Неолитические слои Восточного холма', 'Восемнадцать уровней неолитической застройки.', 'Neolithic levels of the East Mound', 'Eighteen levels of Neolithic occupation.', '东丘新石器时代地层', '十八层新石器时代居住遗存。'))
      ], [
        event('catalhoyuk-occupation', -7400, 'approximate', 'archaeological-chronology', 'ca. 7400 BCE', ['unesco-catalhoyuk-2012'],
          eventCopy('Начинается последовательность Восточного холма', '', 'East Mound sequence begins', '', '东丘序列开始', ''))
      ], ['unesco-catalhoyuk-2012']),

    reviewedTrack('predynastic-nile', 'africa', 'regional-sequence',
      trackCopy(
        'Додинастические общества долины Нила', 'Оседлые земледельческие сообщества и политические центры долины Нила до династического объединения.',
        'Predynastic Nile Valley societies', 'Settled farming communities and political centers in the Nile Valley before dynastic unification.',
        '尼罗河谷前王朝社会', '王朝统一之前尼罗河谷的定居农业社群和政治中心。'
      ), [
        period('predynastic-nile-sequence', -5500, -3100, 'approximate', 'archaeological-chronology', 'about 5500–3100 BCE', ['british-early-egypt'],
          periodCopy('Додинастическая последовательность', 'Региональные культуры постепенно усложняются; объединение не было мгновенным событием.', 'Predynastic sequence', 'Regional cultures become more complex; unification was not instantaneous.', '前王朝序列', '地区文化逐渐复杂化；统一并非瞬间事件。'))
      ], [
        event('predynastic-hierakonpolis', -4000, 'approximate', 'archaeological-chronology', 'about 4000 BCE', ['british-early-egypt'],
          eventCopy('Иераконполь становится крупным центром', 'Один из важнейших центров Верхнего Египта.', 'Hierakonpolis becomes a major center', 'One of the major centers of Upper Egypt.', '希拉孔波利斯成为大型中心', '上埃及的重要中心之一。'))
      ], ['british-early-egypt']),

    reviewedTrack('mehrgarh', 'south-asia', 'site',
      trackCopy(
        'Мергарх', 'Поселение в Качи-Бег на территории современного Пакистана, ключевое для изучения раннего производства пищи в Южной Азии.',
        'Mehrgarh', 'A settlement in the Kachi plain, in the territory of present-day Pakistan, central to the study of early food production in South Asia.',
        '梅尔伽赫', '今巴基斯坦卡奇平原的一处聚落，是研究南亚早期食物生产的关键遗址。'
      ), [
        period('mehrgarh-sequence', -7000, -2600, 'approximate', 'archaeological-chronology', 'Early Food-Producing Era ca. 7000–5500 BCE; later sequence to ca. 2600 BCE', ['kenoyer-indus-2011'],
          periodCopy('Последовательность Мергарха', 'Раннее производство пищи сменяется длительной региональной последовательностью.', 'Mehrgarh sequence', 'Early food production is followed by a long regional sequence.', '梅尔伽赫序列', '早期食物生产之后延续为长期区域序列。'))
      ], [
        event('mehrgarh-food-production', -7000, 'approximate', 'archaeological-chronology', 'ca. 7000 BCE', ['kenoyer-indus-2011'],
          eventCopy('Начало ранней производящей экономики', 'Земледелие и животноводство документированы в ранних слоях.', 'Early food-producing economy begins', 'Farming and herding are documented in early levels.', '早期食物生产经济开始', '早期地层记录了农业和畜牧业。'))
      ], ['kenoyer-indus-2011']),

    reviewedTrack('european-palaeolithic-mesolithic', 'mediterranean', 'regional-sequence',
      trackCopy(
        'Поздний палеолит и мезолит Европы', 'Очень широкая сравнительная рамка для разнообразных обществ Европы между ледниковым максимумом и распространением земледелия.',
        'Late Palaeolithic and Mesolithic Europe', 'A very broad comparative frame for diverse European societies between the glacial maximum and the spread of farming.',
        '欧洲旧石器时代晚期与中石器时代', '冰盛期至农业传播之间欧洲多样社会的宽泛比较框架。'
      ), [
        period('europe-late-palaeolithic', -20000, -10000, 'approximate', 'archaeological-chronology', 'overview window 20,000–8000 BCE', ['met-prehistoric-art-2007'],
          periodCopy('Поздний верхний палеолит', 'Не единая культура: шкала объединяет множество региональных последовательностей.', 'Late Upper Palaeolithic', 'Not a single culture: the line groups many regional sequences.', '旧石器时代晚期', '并非单一文化：此线汇集多个区域序列。')),
        period('europe-mesolithic', -10000, -5000, 'approximate', 'archaeological-chronology', 'approximately 10,000–5000 BCE as a pan-European frame', ['cambridge-mesolithic-europe-2008'],
          periodCopy('Мезолитические последовательности', 'Региональные границы значительно различаются.', 'Mesolithic sequences', 'Regional boundaries vary substantially.', '中石器时代序列', '各地区边界差异很大。'))
      ], [
        event('europe-postglacial-change', -10000, 'approximate', 'archaeological-chronology', 'around the start of the Holocene', ['cambridge-mesolithic-europe-2008'],
          eventCopy('Начинаются постледниковые преобразования', 'Осваиваются новые территории, развиваются мореплавание и региональные хозяйства.', 'Postglacial transformations begin', 'New territories, seafaring, and regional economies develop.', '冰后期转型开始', '新地区得到开发，航海和区域经济发展。'))
      ], ['met-prehistoric-art-2007', 'cambridge-mesolithic-europe-2008']),

    reviewedTrack('late-pleistocene-americas', 'americas', 'regional-sequence',
      trackCopy(
        'Позднеплейстоценовые свидетельства в Америках', 'Археологические и хронометрические свидетельства раннего присутствия людей; ранняя граница остаётся предметом научной дискуссии.',
        'Late Pleistocene evidence in the Americas', 'Archaeological and chronometric evidence for early human presence; the early boundary remains debated.',
        '美洲晚更新世证据', '关于早期人类存在的考古与年代学证据；最早边界仍有学术争议。'
      ), [
        period('americas-early-presence', -20000, -10900, 'disputed', 'radiocarbon', 'probable presence around/before the Last Glacial Maximum; wider expansion ca. 14.7–12.9 ka before AD 2000', ['nature-americas-2020'],
          periodCopy('Раннее присутствие и расселение', 'Начало намеренно показано как спорный интервал, а не точная дата «первого заселения».', 'Early presence and dispersal', 'The start is intentionally shown as a disputed interval, not an exact “first settlement” date.', '早期存在与扩散', '起点有意显示为争议区间，而非精确的“首次定居”日期。'),
          {
            confidence: 'low',
            disputeNote: 'Claims before the wider ca. 14.7–12.9 ka dispersal remain debated and are not represented as a single first-arrival date.',
            copy: datingCopy(
              '', '', '',
              'Свидетельства, предшествующие более широкому расселению около 14,7–12,9 тыс. лет назад, остаются спорными и не показаны как единая дата первого прибытия.',
              'Claims before the wider ca. 14.7–12.9 ka dispersal remain debated and are not represented as a single first-arrival date.',
              '早于约14.7至12.9千年前更广泛扩散的证据仍有争议，因而不会被表示为单一的“首次抵达”日期。'
            )
          })
      ], [
        event('americas-wider-expansion', -12000, 'approximate', 'radiocarbon', 'wider occupation during ca. 14.7–12.9 ka before AD 2000', ['nature-americas-2020'],
          eventCopy('Более широкое расселение становится заметным', 'Байесовская модель объединяет данные 42 памятников.', 'Wider occupation becomes visible', 'A Bayesian model combines evidence from 42 sites.', '更广泛的居住变得可见', '贝叶斯模型综合了42处遗址的数据。'))
      ], ['nature-americas-2020']),

    reviewedTrack('sahul-continuity', 'oceania', 'regional-sequence',
      trackCopy(
        'Общества Сахула — продолжение до границы шкалы', 'Археологические общества Австралии и Новой Гвинеи существовали задолго до 20 000 года до н. э.; открытый край показывает продолжение, а не возникновение.',
        'Sahul societies — continuity at the range boundary', 'Archaeological societies of Australia and New Guinea long predate 20,000 BCE; the open edge shows continuation, not origin.',
        '萨胡尔社会——在时间轴边界前已延续', '澳大利亚和新几内亚的考古社会远早于公元前20000年；开放边缘表示延续，而非起源。'
      ), [
        period('sahul-window', -20000, -3500, 'range', 'archaeological-chronology', 'occupation extends to at least 65,000 years ago; display clipped at 20,000 BCE', ['nature-madjedbebe-2022'],
          periodCopy('Продолжение плейстоценовых и раннеголоценовых обществ', 'Одна линия не означает единую культуру всего Сахула.', 'Continuing Pleistocene and early Holocene societies', 'One line does not imply a single culture across Sahul.', '延续的更新世与全新世早期社会', '一条线并不意味着整个萨胡尔只有一种文化。'))
      ], [
        event('sahul-open-boundary', -20000, 'approximate', 'archaeological-chronology', 'record continues from before the selected range', ['nature-madjedbebe-2022'],
          eventCopy('Открытая граница: общества уже существовали', 'Маджедбебе хранит гораздо более раннюю археологическую последовательность.', 'Open boundary: societies already existed', 'Madjedbebe preserves a much earlier archaeological sequence.', '开放边界：社会此前已经存在', '马杰德贝贝保存了远早于此的考古序列。'))
      ], ['nature-madjedbebe-2022'], { continuesBeforeRange: true }),

    reviewedTrack('lapita', 'oceania', 'network',
      trackCopy(
        'Ранняя сеть взаимодействий Лапита', 'Морская сеть переселенцев Лапита и коренных папуасских сообществ у островной Новой Гвинеи.',
        'Early Lapita interaction network', 'A maritime network connecting Lapita newcomers and Indigenous Papuan communities around Island New Guinea.',
        '早期拉皮塔互动网络', '拉皮塔移民与新几内亚岛原住民巴布亚社群之间的海洋互动网络。'
      ), [
        period('lapita-frontier-interaction', -1530, -1110, 'range', 'radiocarbon', '3,480–3,060 years ago (approximately 1530–1110 BCE)', ['nature-lapita-2022'],
          periodCopy('Раннее пограничное взаимодействие', 'Данные предшествуют более позднему широкому расселению по Тихому океану.', 'Early frontier interaction', 'The evidence predates the later broad settlement of the Pacific.', '早期边疆互动', '这些证据早于后来更广泛的太平洋定居。'))
      ], [
        event('lapita-contact', -1500, 'approximate', 'radiocarbon', 'within 3,480–3,060 years ago', ['nature-lapita-2022'],
          eventCopy('Контакты Лапита с папуасскими сообществами', 'Фауна, обсидиан и технологии показывают повторное взаимодействие.', 'Lapita contact with Papuan communities', 'Fauna, obsidian, and technologies indicate repeated interaction.', '拉皮塔与巴布亚社群接触', '动物、黑曜石和技术表明反复互动。'))
      ], ['nature-lapita-2022'])
  );

  return {
    scale: { breakpoint: -3500, deepWeight: 0.30 },
    sources: sources,
    tracks: tracks,
    patches: patches
  };
}));
