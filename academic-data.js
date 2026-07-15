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
      authors: ['J. Mark Kenoyer'], publisher: 'Journal of the Indian Ocean Archaeology', year: 2011,
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

  function period(id, start, end, precision, basis, original, sourceIds, copy) {
    return {
      id: id, name: copy.ru.name, note: copy.ru.note, start: start, end: end,
      dating: { precision: precision, basis: basis, original: original || '' },
      sourceIds: sourceIds.slice(), copy: copy
    };
  }

  function event(id, year, precision, basis, original, sourceIds, copy) {
    return {
      id: id, title: copy.ru.title, note: copy.ru.note, year: year,
      dating: { precision: precision, basis: basis, original: original || '' },
      sourceIds: sourceIds.slice(), copy: copy
    };
  }

  function patch(type, copy, periods, events, sourceIds) {
    return {
      name: copy.ru.name, summary: copy.ru.summary, type: type, reviewStatus: 'reviewed', copy: copy,
      periods: periods, events: events, sources: sourceIds.slice()
    };
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

  return {
    scale: { breakpoint: -3500, deepWeight: 0.30 },
    sources: sources,
    tracks: tracks,
    patches: patches
  };
}));
