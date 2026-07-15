(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.PARALLEL_WORLDS_ACADEMIC_DATA = data;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    scale: { breakpoint: -3500, deepWeight: 0.30 },
    sources: {},
    tracks: [],
    patches: {}
  };
}));
