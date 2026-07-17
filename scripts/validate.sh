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
node --check app.js
node scripts/build-academic-audit.mjs
node tests/run-tests.js

for asset in index.html styles.css app.js chronology.js academic-data.js data-quality.js academic-audit.js academic-audit.json data.js i18n.js timeline.js atlas-data.js world-map-data.js insights.js atlas.js explorer-state.js atlas-view.js journeys-data.js journey.js journey-view.js .nojekyll; do
  test -f "$asset"
done

if grep -E '(src|href)="/(app\.js|chronology\.js|academic-data\.js|data-quality\.js|data\.js|i18n\.js|timeline\.js|atlas-data\.js|world-map-data\.js|insights\.js|atlas\.js|explorer-state\.js|atlas-view\.js|journeys-data\.js|journey\.js|journey-view\.js|styles\.css)"' index.html; then
  echo "Absolute asset path found; project Pages requires relative paths" >&2
  exit 1
fi

echo "Static site validation passed"
