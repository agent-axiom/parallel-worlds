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
    }
  };

  return {
    scale: { breakpoint: -3500, deepWeight: 0.30 },
    sources: sources,
    tracks: [],
    patches: {}
  };
}));
