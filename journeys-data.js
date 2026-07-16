(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.PARALLEL_WORLDS_JOURNEYS = data;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var routes = [{
    id: 'birth-of-cities',
    durationSeconds: 120,
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
    },
    stops: [{
      id: 'xianrendong-pottery',
      year: -18000,
      focusTrackIds: ['xianrendong'],
      recordRefs: [{ trackId: 'xianrendong', eventId: 'xianrendong-pottery-evidence' }],
      holdMs: 15000,
      copy: {
        ru: {
          headline: 'Керамика до городов',
          body: 'В Сяньжэньдуне керамические сосуды появились за тысячелетия до земледельческих городов. Технологическое новшество ещё не означает город или государство.'
        },
        en: {
          headline: 'Pottery before cities',
          body: 'At Xianrendong, pottery vessels appeared millennia before farming cities. A technological innovation is not yet a city or a state.'
        },
        zh: {
          headline: '城市之前的陶器',
          body: '仙人洞的陶器比农业城市早了数千年。技术创新本身并不等于城市或国家。'
        }
      }
    }, {
      id: 'gobekli-monuments',
      year: -9500,
      focusTrackIds: ['gobekli-tepe'],
      recordRefs: [{ trackId: 'gobekli-tepe', eventId: 'gobekli-building' }],
      holdMs: 14000,
      copy: {
        ru: {
          headline: 'Монументы без города',
          body: 'Сообщества Гёбекли-Тепе создавали монументальные комплексы до появления привычной городской среды. Координация труда не требовала города позднейшего типа.'
        },
        en: {
          headline: 'Monuments without a city',
          body: 'Communities at Göbekli Tepe built monumental complexes before familiar urban settings emerged. Coordinated labour did not require a city of the later kind.'
        },
        zh: {
          headline: '没有城市的纪念性建筑',
          body: '哥贝克力石阵的社群在熟悉的城市环境出现之前就建造了纪念性建筑群。协作劳动并不需要后世类型的城市。'
        }
      }
    }, {
      id: 'catalhoyuk-density',
      year: -7400,
      focusTrackIds: ['catalhoyuk'],
      recordRefs: [{ trackId: 'catalhoyuk', eventId: 'catalhoyuk-occupation' }],
      holdMs: 15000,
      copy: {
        ru: {
          headline: 'Плотность без дворцов',
          body: 'Чатал-Хююк был крупным и плотным поселением, но его устройство не сводится к поздней модели улиц, дворцов и централизованной власти.'
        },
        en: {
          headline: 'Density without palaces',
          body: 'Çatalhöyük was a large, dense settlement, but its organisation does not fit the later model of streets, palaces, and centralised rule.'
        },
        zh: {
          headline: '没有宫殿的高密度聚落',
          body: '恰塔霍裕克规模大且人口密集，但其组织方式并不符合后来由街道、宫殿和中央权力构成的模式。'
        }
      }
    }, {
      id: 'mehrgarh-food-production',
      year: -7000,
      focusTrackIds: ['mehrgarh'],
      recordRefs: [{ trackId: 'mehrgarh', eventId: 'mehrgarh-food-production' }],
      holdMs: 15000,
      copy: {
        ru: {
          headline: 'Производящая экономика — не один маршрут',
          body: 'В Мергархе земледелие, скотоводство и оседлая жизнь складывались в собственной региональной последовательности. Путь к сложности не был единым.'
        },
        en: {
          headline: 'Food production was not one path',
          body: 'At Mehrgarh, farming, herding, and settled life formed their own regional sequence. There was no single route to complexity.'
        },
        zh: {
          headline: '生产经济并非单一路径',
          body: '在梅赫尔格尔，农业、畜牧与定居生活形成了自身的区域序列。复杂社会并不存在唯一道路。'
        }
      }
    }, {
      id: 'uruk-urban-center',
      year: -3200,
      focusTrackIds: ['uruk'],
      recordRefs: [{ trackId: 'uruk', eventId: 'uruk-major-city' }],
      holdMs: 16000,
      copy: {
        ru: {
          headline: 'Город как новая концентрация',
          body: 'Урук соединял большое население, монументальные институты и хозяйственный учёт. Здесь городской масштаб проявляется как сочетание процессов, а не один признак.'
        },
        en: {
          headline: 'A city as a new concentration',
          body: 'Uruk combined a large population, monumental institutions, and economic record-keeping. Urban scale appears here as a combination of processes, not one trait.'
        },
        zh: {
          headline: '城市是一种新的集中',
          body: '乌鲁克汇集了大量人口、纪念性制度与经济记录。城市规模在这里是多种过程的组合，而非单一特征。'
        }
      }
    }, {
      id: 'egypt-dynastic-model',
      year: -3085,
      focusTrackIds: ['egypt'],
      recordRefs: [{ trackId: 'egypt', eventId: 'egypt-aha-accession' }],
      holdMs: 16000,
      copy: {
        ru: {
          headline: 'Государство и модельная дата',
          body: 'Раннединастический Египет показывает иной масштаб политического объединения. Дата восшествия Аха — хронологическая модель, а не наблюдённый день основания.'
        },
        en: {
          headline: 'A state and a modelled date',
          body: 'Early Dynastic Egypt shows a different scale of political integration. Aha’s accession date is a chronological model, not an observed founding day.'
        },
        zh: {
          headline: '国家与模型年代',
          body: '埃及早王朝展现了另一种政治整合尺度。阿哈即位年代是年代学模型，并非可直接观察到的建国日期。'
        }
      }
    }, {
      id: 'liangzhu-regional-center',
      year: -3000,
      focusTrackIds: ['liangzhu'],
      recordRefs: [{ trackId: 'liangzhu', eventId: 'liangzhu-regional-state' }],
      holdMs: 16000,
      copy: {
        ru: {
          headline: 'Региональный центр на востоке',
          body: 'Лянчжу объединял центр, гидротехнические сооружения и социальную дифференциацию. Восточная Азия формировала собственные сочетания городской и политической сложности.'
        },
        en: {
          headline: 'A regional centre in the east',
          body: 'Liangzhu combined a centre, hydraulic works, and social differentiation. East Asia formed its own combinations of urban and political complexity.'
        },
        zh: {
          headline: '东方的区域中心',
          body: '良渚结合了中心聚落、水利工程与社会分化。东亚形成了自身的城市与政治复杂性组合。'
        }
      }
    }]
  }];

  return { version: 1, routes: routes };
}));
