(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsMediaRegistry = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var ACADEMIC_REF = /^[a-z0-9_-]+\.[a-z0-9_-]+$/;
  var DATE = /^\d{4}-\d{2}-\d{2}$/;
  var MASTER_REF = /^(?:private|archive):\/\/[a-z0-9][a-z0-9._/-]*$/;
  var KINDS = ['source', 'map', 'infographic', 'reconstruction'];
  var LOCALES = ['ru', 'en', 'zh'];
  var ROLES = ['hero', 'object', 'comparison', 'interlude'];

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

  function nonEmptyString(value) {
    return typeof value === 'string' && Boolean(value.trim());
  }

  function validateEntry(entry, index, ids, issues) {
    var path = 'entries[' + index + ']';
    function add(code, suffix, message) {
      issues.push({ code: code, path: path + suffix, message: message });
    }
    if (!entry || typeof entry !== 'object') {
      add('invalid-entry', '', 'Media entry must be an object');
      return;
    }

    var id = ownValue(entry, 'id');
    var kind = ownValue(entry, 'kind');
    if (typeof id !== 'string' || !SAFE_ID.test(id)) {
      add('invalid-id', '.id', 'Media id must be a safe slug');
    } else if (ids[id]) {
      add('duplicate-id', '.id', 'Media id must be unique');
    } else {
      ids[id] = true;
    }
    if (KINDS.indexOf(kind) === -1) {
      add('invalid-kind', '.kind', 'Media kind is not supported');
    }

    var copy = ownValue(entry, 'copy');
    LOCALES.forEach(function (locale) {
      var localized = ownValue(copy, locale);
      if (!nonEmptyString(ownValue(localized, 'caption')) || !nonEmptyString(ownValue(localized, 'alt'))) {
        add('missing-copy', '.copy.' + locale, 'Caption and alt are required');
      }
    });

    var provenance = ownValue(entry, 'provenance');
    var sourceUrl = ownValue(provenance, 'sourceUrl');
    if (typeof sourceUrl !== 'string' || !/^https:\/\//.test(sourceUrl)) {
      add('invalid-source-url', '.provenance.sourceUrl', 'HTTPS provenance URL required');
    }
    ['creator', 'owner', 'credit'].forEach(function (field) {
      if (!nonEmptyString(ownValue(provenance, field))) {
        add('missing-provenance', '.provenance.' + field, 'Provenance field required');
      }
    });

    var rights = ownValue(entry, 'rights');
    var print = ownValue(rights, 'print');
    var web = ownValue(rights, 'web');
    var printExpiry = ownValue(print, 'expiresOn');
    var webExpiry = ownValue(web, 'expiresOn');
    var rightsCleared = ownValue(print, 'status') === 'cleared' &&
      Number.isInteger(ownValue(print, 'maxCopies')) && ownValue(print, 'maxCopies') >= 500 &&
      nonEmptyString(ownValue(print, 'territory')) && typeof printExpiry === 'string' && DATE.test(printExpiry) &&
      ownValue(web, 'status') === 'cleared' && nonEmptyString(ownValue(web, 'territory')) &&
      typeof webExpiry === 'string' && DATE.test(webExpiry);
    if (!rightsCleared) {
      add('uncleared-rights', '.rights', 'Print and web rights must be cleared');
    }

    var master = ownValue(entry, 'master');
    var masterRef = ownValue(master, 'ref');
    var sha256 = ownValue(master, 'sha256');
    if (typeof masterRef !== 'string' || !MASTER_REF.test(masterRef) ||
        typeof sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(sha256)) {
      add('invalid-master', '.master', 'Opaque master ref and SHA-256 required');
    }

    var academicRefs = ownArrayValues(ownValue(entry, 'academicRefs'));
    if (!academicRefs.length || academicRefs.some(function (reference) {
      return typeof reference !== 'string' || !ACADEMIC_REF.test(reference);
    })) {
      add('missing-academic-ref', '.academicRefs', 'At least one canonical track.record reference is required');
    }

    var derivatives = ownValue(entry, 'derivatives');
    var webFiles = ownValue(derivatives, 'web');
    var derivativeRules = {
      avif: /^assets\/media\/[a-z0-9][a-z0-9._-]*\.avif$/,
      webp: /^assets\/media\/[a-z0-9][a-z0-9._-]*\.webp$/,
      fallback: /^assets\/media\/[a-z0-9][a-z0-9._-]*\.(?:jpg|jpeg|png)$/
    };
    var invalidDerivatives = Object.keys(derivativeRules).some(function (format) {
      var file = ownValue(webFiles, format);
      return typeof file !== 'string' || !derivativeRules[format].test(file);
    });
    if (invalidDerivatives) {
      add('invalid-derivatives', '.derivatives.web', 'Safe local AVIF, WebP, and fallback paths are required');
    }

    var reconstruction = ownValue(entry, 'reconstruction');
    var isReconstruction = ownValue(reconstruction, 'isReconstruction');
    var basis = ownValue(reconstruction, 'basis');
    if (kind === 'reconstruction') {
      if (isReconstruction !== true || !nonEmptyString(basis)) {
        add('missing-basis', '.reconstruction', 'Reconstruction basis required');
      }
    } else if (isReconstruction !== false) {
      add('invalid-reconstruction-flag', '.reconstruction', 'Documentary media must not be marked as a reconstruction');
    }

    var links = ownArrayValues(ownValue(entry, 'links'));
    if (!links.length) {
      add('invalid-link', '.links', 'At least one edition link is required');
    }
    var linkKeys = Object.create(null);
    links.forEach(function (link, linkIndex) {
      var windowId = ownValue(link, 'windowId');
      var role = ownValue(link, 'role');
      if (!link || typeof windowId !== 'string' || !/^window-[0-9]{2}$/.test(windowId) || ROLES.indexOf(role) === -1) {
        add('invalid-link', '.links[' + linkIndex + ']', 'Window and role required');
      } else {
        var key = windowId + ':' + role;
        if (linkKeys[key]) add('duplicate-link', '.links[' + linkIndex + ']', 'Media links must be unique');
        else linkKeys[key] = true;
      }
    });
  }

  function validateRegistry(registry) {
    var issues = [];
    if (!registry || typeof registry !== 'object') {
      return {
        issues: [{ code: 'invalid-registry', path: '', message: 'Media registry must be an object' }],
        entries: []
      };
    }
    if (ownValue(registry, 'version') !== 1) {
      issues.push({ code: 'invalid-version', path: 'version', message: 'Media registry version must be 1' });
    }
    var rawEntries = ownValue(registry, 'entries');
    var entries = ownArrayValues(rawEntries);
    if (!Array.isArray(rawEntries)) {
      issues.push({ code: 'invalid-entries', path: 'entries', message: 'Media entries must be an own array' });
    }
    var ids = Object.create(null);
    entries.forEach(function (entry, index) {
      validateEntry(entry, index, ids, issues);
    });
    return { issues: issues, entries: issues.length ? [] : entries.slice() };
  }

  return {
    validateRegistry: validateRegistry
  };
}));
