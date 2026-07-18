(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsCompanion = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var WINDOW_ID = /^window-[0-9]{2}$/;
  var MEDIA_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var ROUTE_PATH = /^go\/window-[0-9]{2}(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?\/$/;
  var ROUTE_TARGET = /^\?lang=ru&editionWindow=window-[0-9]{2}(?:&editionMedia=[a-z0-9]+(?:-[a-z0-9]+)*)?$/;

  function own(value, key) {
    return !!value && Object.prototype.hasOwnProperty.call(value, key);
  }

  function ownValue(value, key) {
    if (!value || typeof value !== 'object') return undefined;
    var descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch (_) {
      return undefined;
    }
    return descriptor && own(descriptor, 'value') ? descriptor.value : undefined;
  }

  function ownArrayValues(value) {
    if (!Array.isArray(value)) return [];
    var length = ownValue(value, 'length');
    if (!Number.isInteger(length) || length < 0) return [];
    var result = [];
    for (var index = 0; index < length; index += 1) {
      if (own(value, index)) result.push(ownValue(value, index));
    }
    return result;
  }

  function buildRoutes(manifest, registry) {
    var windows = ownArrayValues(ownValue(manifest, 'windows'));
    var windowIds = Object.create(null);
    var routes = windows.map(function (window) {
      var id = ownValue(window, 'id');
      var companionPath = ownValue(window, 'companionPath');
      if (typeof id !== 'string' || !WINDOW_ID.test(id) ||
          typeof companionPath !== 'string' || !WINDOW_ID.test(companionPath)) {
        throw new RangeError('Unsafe companion route');
      }
      windowIds[id] = true;
      return {
        id: id,
        kind: 'window',
        path: 'go/' + companionPath + '/',
        target: '?lang=ru&editionWindow=' + id
      };
    });

    ownArrayValues(ownValue(registry, 'entries')).forEach(function (entry) {
      var mediaId = ownValue(entry, 'id');
      if (typeof mediaId !== 'string' || !MEDIA_ID.test(mediaId)) {
        throw new RangeError('Unsafe companion route');
      }
      ownArrayValues(ownValue(entry, 'links')).forEach(function (link) {
        var windowId = ownValue(link, 'windowId');
        if (typeof windowId !== 'string' || !WINDOW_ID.test(windowId) || !windowIds[windowId]) {
          throw new RangeError('Unsafe companion route');
        }
        routes.push({
          id: mediaId,
          kind: 'media',
          path: 'go/' + windowId + '/' + mediaId + '/',
          target: '?lang=ru&editionWindow=' + windowId + '&editionMedia=' + mediaId
        });
      });
    });

    routes.sort(function (left, right) { return left.path.localeCompare(right.path); });
    var seen = Object.create(null);
    routes.forEach(function (route) {
      if (seen[route.path]) throw new RangeError('Duplicate companion route');
      seen[route.path] = true;
    });
    return routes;
  }

  function escapeAttribute(value) {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function renderRedirect(route) {
    var path = ownValue(route, 'path');
    var target = ownValue(route, 'target');
    if (typeof path !== 'string' || !ROUTE_PATH.test(path) ||
        typeof target !== 'string' || !ROUTE_TARGET.test(target)) {
      throw new RangeError('Unsafe companion route');
    }
    var depth = path.split('/').filter(Boolean).length;
    var relativeRoot = new Array(depth + 1).join('../');
    var href = escapeAttribute(relativeRoot + target);
    return '<!doctype html>\n' +
      '<html lang="ru">\n' +
      '<head>\n' +
      '  <meta charset="utf-8">\n' +
      '  <meta name="robots" content="noindex">\n' +
      '  <meta http-equiv="refresh" content="0;url=' + href + '">\n' +
      '  <title>Параллельные миры</title>\n' +
      '</head>\n' +
      '<body>\n' +
      '  <p><a href="' + href + '">Открыть цифровое сопровождение книги</a></p>\n' +
      '</body>\n' +
      '</html>\n';
  }

  return {
    buildRoutes: buildRoutes,
    renderRedirect: renderRedirect
  };
}));
