(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.PARALLEL_WORLDS_ATLAS_DATA = data;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function c(id, longitude, latitude, start, end) {
    return { id: id, longitude: longitude, latitude: latitude, start: start, end: end };
  }

  return {
    regions: {
      mesopotamia: { longitude: 44, latitude: 30, radius: 7 },
      'west-asia': { longitude: 60, latitude: 40, radius: 11 },
      africa: { longitude: 20, latitude: 5, radius: 15 },
      mediterranean: { longitude: 18, latitude: 39, radius: 10 },
      'south-asia': { longitude: 78, latitude: 23, radius: 11 },
      'east-asia': { longitude: 118, latitude: 34, radius: 14 },
      'central-asia': { longitude: 80, latitude: 50, radius: 14 },
      'southeast-asia': { longitude: 105, latitude: 12, radius: 11 },
      oceania: { longitude: 150, latitude: -15, radius: 14 },
      americas: { longitude: -75, latitude: 15, radius: 20 }
    },
    tracks: {
      sumer: [c('sumerian-city-states', 45.1, 31.8, -2900, -2004)],
      uruk: [c('uruk-city', 45.64, 31.32, -3500, -3100)],
      xianrendong: [c('xianrendong-cave', 116.31, 28.95, -18050, -17050)],
      jomon: [c('japanese-archipelago-jomon', 138.25, 36.2, -10500, -300)],
      liangzhu: [c('lower-yangtze-liangzhu', 120.04, 30.4, -3300, -2300)],
      natufian: [c('southern-levant-natufian', 35.2, 32, -13050, -9550)],
      'gobekli-tepe': [c('gobekli-tepe-site', 38.92, 37.22, -9600, -8200)],
      catalhoyuk: [c('catalhoyuk-site', 32.83, 37.67, -7400, -6200)],
      'predynastic-nile': [c('upper-nile-predynastic', 32, 25.5, -5500, -3100)],
      mehrgarh: [c('kachi-plain-mehrgarh', 67.62, 29.37, -7000, -2600)],
      'european-palaeolithic-mesolithic': [c('european-sequences', 10, 50, -20000, -5000)],
      'late-pleistocene-americas': [c('north-american-evidence', -105, 40, -20000, -10900), c('south-american-evidence', -72, -15, -16000, -10900)],
      'sahul-continuity': [c('sahul', 134, -25, -20000, -3500)],
      lapita: [c('island-new-guinea-lapita', 155, -7, -1530, -1110)],
      akkadia: [c('akkad', 44.5, 33.1, -2600, -1800)],
      babylonia: [c('babylon', 44.42, 32.54, -1894, -539)],
      assyria: [c('assur-nineveh', 43.26, 35.45, -2025, -100)],
      hittites: [c('hattusa', 34.62, 40.02, -2500, -700)],
      egypt: [c('memphis-thebes', 31.2, 27.5, -3100, -332)],
      nubia: [c('kerma-meroe', 32.4, 18.6, -2500, 350)],
      phoenicia: [c('tyre-sidon', 35.2, 33.3, -2500, 300)],
      israel_judah: [c('jerusalem', 35.22, 31.78, -1200, 135)],
      persia: [c('iranian-plateau', 53, 32, -700, 651)],
      greece: [c('aegean', 24, 38, -3000, -31)],
      rome: [c('rome', 12.5, 41.9, -753, 476)],
      byzantium: [c('constantinople', 28.98, 41.01, 330, 1453)],
      steppe: [c('western-steppe', 45, 48, -1500, 500), c('eastern-steppe', 100, 47, 500, 1500)],
      indus: [c('harappa-mohenjo-daro', 68.2, 28, -3300, -900)],
      india: [c('ganges', 82, 25, -600, 550), c('north-india', 78, 28, 550, 1600)],
      china: [c('yellow-river', 113, 35, -1600, 581), c('changan', 108.94, 34.34, 581, 1000), c('eastern-china', 118, 32, 1000, 1600)],
      korea: [c('korean-peninsula', 127.5, 36, -1000, 1600)],
      japan: [c('japanese-archipelago', 138, 36, -1500, 1600)],
      central_asia: [c('sogdia-bactria', 66, 39, -600, 750), c('transoxiana', 65, 41, 750, 1500)],
      southeast_asia: [c('mekong-irrawaddy', 103, 16, -1500, 1600)],
      indonesia: [c('java-sumatra', 108, -5, -2000, 1600)],
      oceania: [c('lapita-west-polynesia', 170, -17, -1600, 300), c('east-polynesia', -150, -15, 300, 1600)],
      maya: [c('maya-lowlands', -89, 18, -2000, 900), c('northern-yucatan', -89, 21, 900, 1524)],
      teotihuacan: [c('teotihuacan', -98.84, 19.69, -200, 900)],
      aztec: [c('tenochtitlan', -99.13, 19.43, 1200, 1521)],
      andes: [c('central-andes', -75, -15, -3000, 1438)],
      inca: [c('cusco', -72.55, -13.52, 1250, 1533)],
      north_america: [c('eastern-woodlands', -83, 38, -3000, 800), c('mississippi-pueblo', -100, 36, 800, 1600)],
      ethiopia: [c('aksum-highlands', 38.7, 14.1, -1000, 1600)],
      west_africa: [c('sahel-forest', -2, 13, -1000, 1600)],
      mesopotamian_religion: [c('mesopotamian-temples', 44.5, 33, -3500, 100)],
      egyptian_religion: [c('nile-temples', 31.2, 26, -3100, 394)],
      greek_religion: [c('greek-sanctuaries', 24, 38, -2000, 300)],
      roman_religion: [c('roman-cults', 12.5, 41.9, -900, 392)],
      hinduism: [c('vedic-heartland', 76, 29, -1500, 500), c('south-asian-temples', 79, 16, 500, 1600)],
      buddhism: [c('ganges-buddhism', 84, 25, -500, 100), c('silk-road-buddhism', 70, 40, 100, 700), c('asian-buddhism', 112, 30, 700, 1600)],
      jainism: [c('north-western-india', 75, 27, -800, 500), c('western-india', 73, 22, 500, 1600)],
      zoroastrianism: [c('iranian-religion', 53, 32, -1200, 651)],
      judaism: [c('judea-diaspora', 35.22, 31.78, -1200, 70), c('mediterranean-diaspora', 18, 39, 70, 1600)],
      christianity: [c('jerusalem-antioch', 35.8, 34, 30, 313), c('rome-constantinople', 21, 41, 313, 1054), c('medieval-christendom', 10, 50, 1054, 1600)],
      islam: [c('mecca-medina', 40.5, 22.5, 610, 750), c('baghdad', 44.37, 33.31, 750, 1258), c('regional-sultanates', 55, 30, 1258, 1600)],
      manichaeism: [c('babylonia-manichaeism', 44.5, 33, 240, 600), c('central-asian-manichaeism', 70, 40, 600, 1000), c('southern-china-manichaeism', 116, 25, 1000, 1400)],
      sikhism: [c('punjab', 74, 31, 1200, 1600)],
      confucianism: [c('lu-state', 117, 35.5, -551, 220), c('imperial-china-confucianism', 113, 34, 220, 1600)],
      daoism: [c('central-china-daoism', 112, 31, -400, 1600)],
      shinto: [c('japanese-kami', 138, 36, -1000, 1600)],
      mesoamerican_religion: [c('mesoamerican-ritual', -92, 18, -1500, 1521)],
      andean_religion: [c('andean-sanctuaries', -74, -14, -3000, 1533)]
    }
  };
}));
