(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.PARALLEL_WORLDS_EDITION_DATA = data;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function copy(ruTitle, ruQuestion, enTitle, enQuestion, zhTitle, zhQuestion) {
    return {
      ru: { title: ruTitle, question: ruQuestion },
      en: { title: enTitle, question: enQuestion },
      zh: { title: zhTitle, question: zhQuestion }
    };
  }

  var windows = [
    ['window-01', -18000, 'window-01', copy(
      'Миры ледникового времени', 'Что уже существовало задолго до городов?',
      'Worlds of the Ice Age', 'What already existed long before cities?',
      '冰期世界', '在城市出现很久以前，哪些社会已经存在？'
    )],
    ['window-02', -9500, 'window-02', copy(
      'Монументы до городов', 'Что меняется, когда люди собираются вместе?',
      'Monuments before cities', 'What changes when people gather?',
      '城市之前的纪念性建筑', '当人们聚集时，会发生什么变化？'
    )],
    ['window-03', -6500, 'window-03', copy(
      'Оседлые ландшафты', 'Сколько разных путей ведёт к жизни на одном месте?',
      'Settled landscapes', 'How many paths lead to living in one place?',
      '定居景观', '通往定居生活的道路有多少种？'
    )],
    ['window-04', -3500, 'window-04', copy(
      'Города, реки и управление', 'Когда плотность превращается в городской мир?',
      'Cities, rivers, and administration', 'When does density become an urban world?',
      '城市、河流与治理', '人口密度何时转化为城市世界？'
    )],
    ['window-05', -2500, 'window-05', copy(
      'Монументальные общества', 'Как власть становится видимой в материале?',
      'Monumental societies', 'How does power become visible in material form?',
      '纪念性社会', '权力如何在物质形态中变得可见？'
    )],
    ['window-06', -1200, 'window-06', copy(
      'После бронзового века', 'Почему одни системы распадаются, а другие продолжаются?',
      'After the Bronze Age', 'Why do some systems fragment while others continue?',
      '青铜时代之后', '为什么有些体系瓦解，而另一些延续？'
    )],
    ['window-07', -500, 'window-07', copy(
      'Миры спора и учения', 'Почему новые политические и философские языки возникают одновременно?',
      'Worlds of debate and teaching', 'Why do new political and philosophical languages emerge at the same time?',
      '论辩与思想的世界', '新的政治与哲学语言为何同时出现？'
    )],
    ['window-08', 200, 'window-08', copy(
      'Связанные империи', 'Что соединяет огромные пространства без единого центра?',
      'Connected empires', 'What connects vast spaces without a single center?',
      '相连的帝国', '没有单一中心，广阔空间如何彼此连接？'
    )],
    ['window-09', 650, 'window-09', copy(
      'Новые религиозные географии', 'Как верования меняют карты принадлежности?',
      'New religious geographies', 'How do beliefs redraw maps of belonging?',
      '新的宗教地理', '信仰如何重塑归属的地图？'
    )],
    ['window-10', 1000, 'window-10', copy(
      'Сети первого тысячелетия', 'Как знания и товары проходят через множество границ?',
      'Networks at the millennium', 'How do knowledge and goods cross many boundaries?',
      '千年之际的网络', '知识与商品如何穿越多重边界？'
    )],
    ['window-11', 1250, 'window-11', copy(
      'Континенты в движении', 'Как мобильность перестраивает далёкие общества?',
      'Continents in motion', 'How does mobility reshape distant societies?',
      '流动中的大陆', '流动性如何重塑遥远的社会？'
    )],
    ['window-12', 1450, 'window-12', copy(
      'Мир перед новым соединением', 'Какие сложные миры существовали накануне атлантического перелома?',
      'A world before new convergence', 'What complex worlds existed on the eve of the Atlantic rupture?',
      '新汇合之前的世界', '大西洋转折前夕存在哪些复杂世界？'
    )]
  ].map(function (entry) {
    return {
      id: entry[0],
      anchorYear: entry[1],
      companionPath: entry[2],
      chapterPages: 16,
      requirements: { reviewedTracks: 6, regions: 3 },
      copy: entry[3]
    };
  });

  var interludeIds = [
    'settlement', 'domestication', 'cities', 'writing',
    'belief', 'trade-networks', 'empires-law', 'knowledge-transfer'
  ];

  return {
    version: 1,
    id: 'hardcover-ru-first-edition',
    format: { widthMm: 300, heightMm: 240, orientation: 'landscape', language: 'ru' },
    printRun: { minimum: 500, quoteQuantities: [500, 750, 1000] },
    pagePlan: { opening: 16, windows: 192, interludes: 32, apparatus: 48, total: 288 },
    windows: windows,
    interludes: interludeIds.map(function (id) { return { id: id, pages: 4 }; })
  };
}));
