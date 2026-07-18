(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.PARALLEL_WORLDS_MEDIA_DATA = data;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return { version: 1, entries: [] };
}));
