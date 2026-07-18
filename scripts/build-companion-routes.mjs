import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const editionData = require(path.join(root, 'edition-data.js'));
const mediaData = require(path.join(root, 'media-data.js'));
const companion = require(path.join(root, 'companion.js'));
const argumentsList = process.argv.slice(2);
const checkOnly = argumentsList.length === 1 && argumentsList[0] === '--check';

if (argumentsList.length && !checkOnly) {
  console.error('Usage: node scripts/build-companion-routes.mjs [--check]');
  process.exit(2);
}

const routes = companion.buildRoutes(editionData, mediaData);
const expected = new Map();
expected.set(
  path.join(root, 'companion-routes.json'),
  JSON.stringify({ version: 1, routes: routes }, null, 2) + '\n'
);
routes.forEach(function (route) {
  expected.set(path.join(root, route.path, 'index.html'), companion.renderRedirect(route));
});

function routeFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).reduce(function (files, entry) {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Symlink is not allowed in generated routes: ' + target);
    if (entry.isDirectory()) return files.concat(routeFiles(target));
    if (entry.isFile() && entry.name === 'index.html') files.push(target);
    return files;
  }, []);
}

if (checkOnly) {
  const actualRouteFiles = routeFiles(path.join(root, 'go'));
  const expectedRouteFiles = Array.from(expected.keys()).filter(function (file) {
    return file.endsWith(path.sep + 'index.html');
  });
  const errors = [];
  expected.forEach(function (content, file) {
    if (!fs.existsSync(file)) errors.push('missing ' + path.relative(root, file));
    else if (fs.readFileSync(file, 'utf8') !== content) errors.push('stale ' + path.relative(root, file));
  });
  actualRouteFiles.forEach(function (file) {
    if (expectedRouteFiles.indexOf(file) === -1) errors.push('extra ' + path.relative(root, file));
  });
  if (errors.length) {
    errors.forEach(function (error) { console.error(error); });
    process.exit(1);
  }
} else {
  expected.forEach(function (content, file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
  });
}
