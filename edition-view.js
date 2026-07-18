(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsEditionView = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var WINDOW_ID = /^window-[0-9]{2}$/;
  var FALLBACK_IMAGE = /^assets\/media\/[a-z0-9][a-z0-9._-]*\.(?:jpg|jpeg|png)$/;
  var AVIF_IMAGE = /^assets\/media\/[a-z0-9][a-z0-9._-]*\.avif$/;
  var WEBP_IMAGE = /^assets\/media\/[a-z0-9][a-z0-9._-]*\.webp$/;

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

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[character];
    });
  }

  function nonEmpty(value) {
    return typeof value === 'string' && Boolean(value.trim());
  }

  function localizedCopy(container, locale) {
    var copy = ownValue(container, 'copy');
    var requested = ['ru', 'en', 'zh'].indexOf(locale) !== -1 ? locale : 'ru';
    var localized = ownValue(copy, requested);
    if (!localized || typeof localized !== 'object') localized = ownValue(copy, 'ru');
    return localized && typeof localized === 'object' ? localized : null;
  }

  function translated(translate, key, values, fallback) {
    var value;
    if (typeof translate === 'function') {
      try { value = translate(key, values); } catch (_) { value = undefined; }
    }
    return nonEmpty(value) && value !== key ? value : fallback;
  }

  function renderMedia(media, locale, translate) {
    if (!media || typeof media !== 'object') return '';
    var rights = ownValue(media, 'rights');
    var webRights = ownValue(rights, 'web');
    var derivatives = ownValue(ownValue(media, 'derivatives'), 'web');
    var fallback = ownValue(derivatives, 'fallback');
    var copy = localizedCopy(media, locale);
    var caption = ownValue(copy, 'caption');
    var alt = ownValue(copy, 'alt');
    var credit = ownValue(ownValue(media, 'provenance'), 'credit');
    if (ownValue(webRights, 'status') !== 'cleared' || typeof fallback !== 'string' ||
        !FALLBACK_IMAGE.test(fallback) || !nonEmpty(caption) || !nonEmpty(alt) || !nonEmpty(credit)) return '';

    var reconstruction = ownValue(media, 'reconstruction');
    var isReconstruction = ownValue(reconstruction, 'isReconstruction') === true;
    var basis = ownValue(reconstruction, 'basis');
    if (isReconstruction && !nonEmpty(basis)) return '';
    var avif = ownValue(derivatives, 'avif');
    var webp = ownValue(derivatives, 'webp');
    var sources = '';
    if (typeof avif === 'string' && AVIF_IMAGE.test(avif)) {
      sources += '<source srcset="' + escapeHtml(avif) + '" type="image/avif">';
    }
    if (typeof webp === 'string' && WEBP_IMAGE.test(webp)) {
      sources += '<source srcset="' + escapeHtml(webp) + '" type="image/webp">';
    }
    var reconstructionHtml = isReconstruction
      ? '<p class="edition-media-kind"><strong>' + escapeHtml(translated(
        translate, 'editionCompanionReconstruction', null, 'Reconstruction'
      )) + ':</strong> ' + escapeHtml(basis) + '</p>'
      : '';
    return '<figure class="edition-companion-media' + (isReconstruction ? ' is-reconstruction' : '') + '">' +
      '<picture>' + sources + '<img src="' + escapeHtml(fallback) + '" alt="' + escapeHtml(alt) + '"></picture>' +
      '<figcaption><p>' + escapeHtml(caption) + '</p>' +
      '<p class="edition-media-credit"><strong>' + escapeHtml(translated(
        translate, 'editionCompanionSource', null, 'Source'
      )) + ':</strong> ' + escapeHtml(credit) + '</p>' + reconstructionHtml + '</figcaption>' +
      '</figure>';
  }

  function renderBanner(windowData, locale, media, translate) {
    var id = ownValue(windowData, 'id');
    var anchorYear = ownValue(windowData, 'anchorYear');
    var copy = localizedCopy(windowData, locale);
    var title = ownValue(copy, 'title');
    var question = ownValue(copy, 'question');
    if (typeof id !== 'string' || !WINDOW_ID.test(id) || !Number.isInteger(anchorYear) || anchorYear === 0 ||
        !nonEmpty(title) || !nonEmpty(question)) return '';

    var label = translated(translate, 'editionCompanionLabel', null, 'Book companion');
    var close = translated(translate, 'editionCompanionClose', null, 'Close');
    var openAtlas = translated(translate, 'editionCompanionOpenAtlas', null, 'Open in atlas');
    var anchor = translated(translate, 'editionCompanionAnchor', { year: anchorYear }, String(anchorYear));
    var mediaHtml = renderMedia(media, locale, translate);
    if (!mediaHtml) {
      mediaHtml = '<p class="edition-companion-media-unavailable">' + escapeHtml(translated(
        translate, 'editionCompanionImageUnavailable', null, 'Image unavailable'
      )) + '</p>';
    }

    return '<article class="edition-companion-card" data-edition-window="' + escapeHtml(id) + '">' +
      '<header class="edition-companion-topline">' +
      '<p class="edition-companion-label">' + escapeHtml(label) + ' <span>' + escapeHtml(id) + '</span></p>' +
      '<button class="edition-companion-close" type="button" data-edition-close aria-label="' + escapeHtml(close) + '">×</button>' +
      '</header>' +
      '<div class="edition-companion-grid"><div class="edition-companion-copy">' +
      '<p class="edition-companion-anchor">' + escapeHtml(anchor) + '</p>' +
      '<h2 id="edition-companion-title" tabindex="-1">' + escapeHtml(title) + '</h2>' +
      '<p class="edition-companion-question">' + escapeHtml(question) + '</p>' +
      '<button class="edition-companion-atlas" type="button" data-edition-open-atlas>' + escapeHtml(openAtlas) + '</button>' +
      '</div>' + mediaHtml + '</div></article>';
  }

  return {
    escapeHtml: escapeHtml,
    renderBanner: renderBanner
  };
}));
