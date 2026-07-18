#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

node --check chronology.js
node --check academic-data.js
node --check data-quality.js
node --check academic-audit.js
node --check data.js
node --check i18n.js
node --check timeline.js
node --check atlas-data.js
node --check world-map-data.js
node --check insights.js
node --check atlas.js
node --check explorer-state.js
node --check atlas-view.js
node --check journeys-data.js
node --check journey.js
node --check journey-view.js
node --check edition-data.js
node --check edition.js
node --check media-data.js
node --check media-registry.js
node --check edition-audit.js
node --check companion.js
node --check edition-view.js
node --check scripts/build-edition-audit.mjs
node --check scripts/build-companion-routes.mjs
node --check app.js

audit_snapshot="$(mktemp "${TMPDIR:-/tmp}/parallel-worlds-academic-audit.XXXXXX")"
if ! cp academic-audit.json "$audit_snapshot"; then
  rm -f "$audit_snapshot"
  exit 1
fi

edition_audit_snapshot="$(mktemp "${TMPDIR:-/tmp}/parallel-worlds-edition-audit.XXXXXX")"
if ! cp edition-audit.json "$edition_audit_snapshot"; then
  rm -f "$audit_snapshot" "$edition_audit_snapshot"
  exit 1
fi

function restore_academic_audit() {
  local status=$?
  trap - EXIT HUP INT TERM
  if [[ -f "$audit_snapshot" ]]; then
    if ! cp "$audit_snapshot" academic-audit.json; then
      echo "Could not restore academic-audit.json after validation" >&2
      status=1
    fi
    if ! rm -f "$audit_snapshot"; then
      echo "Could not remove academic audit snapshot" >&2
      status=1
    fi
  fi
  if [[ -f "$edition_audit_snapshot" ]]; then
    if ! cp "$edition_audit_snapshot" edition-audit.json; then
      echo "Could not restore edition-audit.json after validation" >&2
      status=1
    fi
    if ! rm -f "$edition_audit_snapshot"; then
      echo "Could not remove edition audit snapshot" >&2
      status=1
    fi
  fi
  exit "$status"
}

trap restore_academic_audit EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

node scripts/build-academic-audit.mjs
if ! cmp -s "$audit_snapshot" academic-audit.json; then
  echo "academic-audit.json is stale; run node scripts/build-academic-audit.mjs and commit the regenerated file" >&2
  exit 1
fi
node scripts/build-edition-audit.mjs
if ! cmp -s "$edition_audit_snapshot" edition-audit.json; then
  echo "edition-audit.json is stale; run node scripts/build-edition-audit.mjs and commit the regenerated file" >&2
  exit 1
fi
node scripts/build-companion-routes.mjs --check
node tests/run-tests.js

for asset in index.html styles.css app.js chronology.js academic-data.js data-quality.js academic-audit.js academic-audit.json data.js i18n.js timeline.js atlas-data.js world-map-data.js insights.js atlas.js explorer-state.js atlas-view.js journeys-data.js journey.js journey-view.js edition-data.js edition.js media-data.js media-registry.js edition-audit.js edition-audit.json edition-view.js companion.js companion-routes.json .nojekyll; do
  test -f "$asset"
done

if grep -E '(src|href)="/(app\.js|chronology\.js|academic-data\.js|data-quality\.js|data\.js|i18n\.js|timeline\.js|atlas-data\.js|world-map-data\.js|insights\.js|atlas\.js|explorer-state\.js|atlas-view\.js|journeys-data\.js|journey\.js|journey-view\.js|edition-data\.js|edition\.js|media-data\.js|media-registry\.js|edition-view\.js|styles\.css)"' index.html; then
  echo "Absolute asset path found; project Pages requires relative paths" >&2
  exit 1
fi

echo "Static site validation passed"
