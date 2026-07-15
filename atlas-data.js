(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.PARALLEL_WORLDS_ATLAS_DATA = data;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function c(id, x, y, start, end) {
    return { id: id, x: x, y: y, start: start, end: end };
  }

  return {
    regions: {
      mesopotamia: { x: 59, y: 42, radius: 7 },
      'west-asia': { x: 61, y: 41, radius: 11 },
      africa: { x: 54, y: 57, radius: 15 },
      mediterranean: { x: 56, y: 39, radius: 10 },
      'south-asia': { x: 71, y: 50, radius: 11 },
      'east-asia': { x: 82, y: 41, radius: 14 },
      'central-asia': { x: 70, y: 34, radius: 14 },
      'southeast-asia': { x: 79, y: 58, radius: 11 },
      oceania: { x: 91, y: 69, radius: 14 },
      americas: { x: 25, y: 50, radius: 20 }
    },
    tracks: {
      sumer: [c('uruk', 59, 44, -3500, -1750)],
      akkadia: [c('akkad', 59, 42, -2600, -1800)],
      babylonia: [c('babylon', 59, 43, -1894, -539)],
      assyria: [c('assur-nineveh', 59, 39, -2025, -100)],
      hittites: [c('hattusa', 57, 36, -2500, -700)],
      egypt: [c('memphis-thebes', 58, 48, -3100, -332)],
      nubia: [c('kerma-meroe', 59, 55, -2500, 350)],
      phoenicia: [c('tyre-sidon', 59, 42, -2500, 300)],
      israel_judah: [c('jerusalem', 59, 44, -1200, 135)],
      persia: [c('iranian-plateau', 64, 42, -700, 651)],
      greece: [c('aegean', 56, 39, -3000, -31)],
      rome: [c('rome', 54, 40, -753, 476)],
      byzantium: [c('constantinople', 58, 38, 330, 1453)],
      steppe: [c('western-steppe', 59, 31, -1500, 500), c('eastern-steppe', 75, 29, 500, 1500)],
      indus: [c('harappa-mohenjo-daro', 68, 47, -3300, -900)],
      india: [c('ganges', 72, 49, -600, 550), c('north-india', 71, 46, 550, 1600)],
      china: [c('yellow-river', 81, 39, -1600, 581), c('changan', 79, 40, 581, 1000), c('eastern-china', 83, 43, 1000, 1600)],
      korea: [c('korean-peninsula', 86, 39, -1000, 1600)],
      japan: [c('japanese-archipelago', 89, 41, -1500, 1600)],
      central_asia: [c('sogdia-bactria', 69, 40, -600, 750), c('transoxiana', 68, 37, 750, 1500)],
      southeast_asia: [c('mekong-irrawaddy', 78, 56, -1500, 1600)],
      indonesia: [c('java-sumatra', 81, 65, -2000, 1600)],
      oceania: [c('lapita-west-polynesia', 91, 69, -1600, 300), c('east-polynesia', 94, 64, 300, 1600)],
      maya: [c('maya-lowlands', 25, 52, -2000, 900), c('northern-yucatan', 24, 49, 900, 1524)],
      teotihuacan: [c('teotihuacan', 22, 48, -200, 900)],
      aztec: [c('tenochtitlan', 22, 49, 1200, 1521)],
      andes: [c('central-andes', 30, 70, -3000, 1438)],
      inca: [c('cusco', 30, 68, 1250, 1533)],
      north_america: [c('eastern-woodlands', 27, 39, -3000, 800), c('mississippi-pueblo', 25, 42, 800, 1600)],
      ethiopia: [c('aksum-highlands', 61, 54, -1000, 1600)],
      west_africa: [c('sahel-forest', 48, 57, -1000, 1600)],
      mesopotamian_religion: [c('mesopotamian-temples', 59, 43, -3500, 100)],
      egyptian_religion: [c('nile-temples', 58, 49, -3100, 394)],
      greek_religion: [c('greek-sanctuaries', 56, 39, -2000, 300)],
      roman_religion: [c('roman-cults', 54, 40, -900, 392)],
      hinduism: [c('vedic-heartland', 71, 47, -1500, 500), c('south-asian-temples', 73, 54, 500, 1600)],
      buddhism: [c('ganges-buddhism', 72, 49, -500, 100), c('silk-road-buddhism', 72, 38, 100, 700), c('asian-buddhism', 82, 45, 700, 1600)],
      jainism: [c('north-western-india', 70, 49, -800, 500), c('western-india', 69, 52, 500, 1600)],
      zoroastrianism: [c('iranian-religion', 64, 41, -1200, 651)],
      judaism: [c('judea-diaspora', 59, 43, -1200, 70), c('mediterranean-diaspora', 56, 40, 70, 1600)],
      christianity: [c('jerusalem-antioch', 59, 43, 30, 313), c('rome-constantinople', 56, 39, 313, 1054), c('medieval-christendom', 53, 35, 1054, 1600)],
      islam: [c('mecca-medina', 62, 50, 610, 750), c('baghdad', 60, 42, 750, 1258), c('regional-sultanates', 65, 45, 1258, 1600)],
      manichaeism: [c('babylonia-manichaeism', 60, 43, 240, 600), c('central-asian-manichaeism', 70, 37, 600, 1000), c('southern-china-manichaeism', 83, 49, 1000, 1400)],
      sikhism: [c('punjab', 69, 46, 1200, 1600)],
      confucianism: [c('lu-state', 82, 40, -551, 220), c('imperial-china-confucianism', 81, 41, 220, 1600)],
      daoism: [c('central-china-daoism', 81, 43, -400, 1600)],
      shinto: [c('japanese-kami', 89, 42, -1000, 1600)],
      mesoamerican_religion: [c('mesoamerican-ritual', 23, 50, -1500, 1521)],
      andean_religion: [c('andean-sanctuaries', 30, 69, -3000, 1533)]
    }
  };
}));
