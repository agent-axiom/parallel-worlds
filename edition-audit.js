(function (root, factory) {
  var edition = typeof module === 'object' && module.exports
    ? require('./edition.js')
    : root.ParallelWorldsEdition;
  var mediaRegistry = typeof module === 'object' && module.exports
    ? require('./media-registry.js')
    : root.ParallelWorldsMediaRegistry;
  var api = factory(edition, mediaRegistry);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ParallelWorldsEditionAudit = api;
}(typeof self !== 'undefined' ? self : this, function (edition, mediaRegistry) {
  'use strict';

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

  function blocking(scope) {
    return function (issue) {
      return {
        severity: 'error',
        code: scope + '-' + issue.code,
        path: scope + (issue.path ? '.' + issue.path : ''),
        message: issue.message
      };
    };
  }

  function stableIssues(issues) {
    return issues.slice().sort(function (left, right) {
      return [left.severity, left.code, left.path].join('|').localeCompare(
        [right.severity, right.code, right.path].join('|')
      );
    });
  }

  function publicMediaEntry(entry) {
    return {
      id: ownValue(entry, 'id'),
      kind: ownValue(entry, 'kind'),
      links: (ownValue(entry, 'links') || []).map(function (link) {
        return { windowId: ownValue(link, 'windowId'), role: ownValue(link, 'role') };
      }).sort(function (left, right) {
        return (left.windowId + ':' + left.role).localeCompare(right.windowId + ':' + right.role);
      })
    };
  }

  function buildAudit(dataset, manifest, registry) {
    var manifestResult = edition.validateManifest(manifest);
    var mediaResult = mediaRegistry.validateRegistry(registry);
    var readiness = manifestResult.issues.length
      ? { windows: [] }
      : edition.buildReadiness(manifest, dataset);
    var acceptedMedia = mediaResult.issues.length ? [] : mediaResult.entries;
    var issues = manifestResult.issues.map(blocking('edition'))
      .concat(mediaResult.issues.map(blocking('media')));

    readiness.windows.forEach(function (window) {
      window.gaps.forEach(function (gap) {
        issues.push({
          severity: 'warning', code: 'window-readiness',
          path: 'windows.' + window.id, message: gap
        });
      });
      ['hero', 'object'].forEach(function (role) {
        var found = acceptedMedia.some(function (entry) {
          var links = ownValue(entry, 'links') || [];
          return links.some(function (link) {
            return ownValue(link, 'windowId') === window.id && ownValue(link, 'role') === role;
          });
        });
        if (!found) {
          issues.push({
            severity: 'warning', code: 'missing-media-slot',
            path: 'windows.' + window.id + '.' + role,
            message: 'Cleared media slot is empty'
          });
        }
      });
    });

    issues = stableIssues(issues);
    var readyWindows = readiness.windows.filter(function (window) {
      return window.status === 'ready';
    }).length;
    var blockingIssues = issues.filter(function (issue) {
      return issue.severity === 'error';
    }).length;
    var readinessGaps = issues.filter(function (issue) {
      return issue.severity === 'warning';
    }).length;

    return {
      generatedFrom: 'parallel-worlds-hardcover-v1',
      edition: manifestResult.issues.length ? null : {
        id: ownValue(manifest, 'id'),
        format: ownValue(manifest, 'format'),
        printRun: ownValue(manifest, 'printRun'),
        pagePlan: ownValue(manifest, 'pagePlan')
      },
      summary: {
        windows: readiness.windows.length,
        readyWindows: readyWindows,
        mediaEntries: acceptedMedia.length,
        blockingIssues: blockingIssues,
        readinessGaps: readinessGaps,
        releaseReady: blockingIssues === 0 && readinessGaps === 0 && readiness.windows.length === 12
      },
      windows: readiness.windows,
      media: acceptedMedia.map(publicMediaEntry).sort(function (left, right) {
        return left.id.localeCompare(right.id);
      }),
      issues: issues
    };
  }

  return {
    buildAudit: buildAudit
  };
}));
