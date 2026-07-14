#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

node --check data.js
node --check i18n.js
node --check timeline.js
node --check app.js
node tests/run-tests.js

for asset in index.html styles.css app.js data.js i18n.js timeline.js .nojekyll; do
  test -f "$asset"
done

if grep -E '(src|href)="/(app\.js|data\.js|i18n\.js|timeline\.js|styles\.css)"' index.html; then
  echo "Absolute asset path found; project Pages requires relative paths" >&2
  exit 1
fi

echo "Static site validation passed"
