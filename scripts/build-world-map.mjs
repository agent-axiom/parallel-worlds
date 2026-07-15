import fs from 'fs';
import https from 'https';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const SOURCE = {
  name: 'Natural Earth 1:110m Physical Vectors — Land',
  version: '5.1.2',
  url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_land.geojson'
};
const VIEWBOX = [0, 0, 1000, 520];
const MAP_PADDING = 4;
const EQUAL_EARTH_MAX_X = 2.70663;
const EQUAL_EARTH_MAX_Y = 1.31737;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function projectGeoPoint(longitude, latitude) {
  const A1 = 1.340264;
  const A2 = -0.081106;
  const A3 = 0.000893;
  const A4 = 0.003796;
  const M = Math.sqrt(3) / 2;
  const lambda = longitude * Math.PI / 180;
  const phi = latitude * Math.PI / 180;
  const theta = Math.asin(M * Math.sin(phi));
  const theta2 = theta * theta;
  const theta6 = theta2 * theta2 * theta2;
  const rawX = lambda * Math.cos(theta) / (M * (A1 + 3 * A2 * theta2 + theta6 * (7 * A3 + 9 * A4 * theta2)));
  const rawY = theta * (A1 + A2 * theta2 + theta6 * (A3 + A4 * theta2));
  const span = 100 - MAP_PADDING * 2;
  return [
    (MAP_PADDING + ((rawX + EQUAL_EARTH_MAX_X) / (2 * EQUAL_EARTH_MAX_X)) * span) * 10,
    (MAP_PADDING + ((EQUAL_EARTH_MAX_Y - rawY) / (2 * EQUAL_EARTH_MAX_Y)) * span) * 5.2
  ];
}

function pointText(point) {
  return point[0].toFixed(1) + ' ' + point[1].toFixed(1);
}

function linePath(coordinates, close) {
  const points = [];
  coordinates.forEach(function (coordinate) {
    const projected = projectGeoPoint(Number(coordinate[0]), Number(coordinate[1]));
    const text = pointText(projected);
    if (!points.length || points[points.length - 1] !== text) points.push(text);
  });
  if (points.length < (close ? 3 : 2)) return '';
  return 'M' + points.join('L') + (close ? 'Z' : '');
}

function geometryPath(geometry) {
  if (!geometry) return '';
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(function (ring) { return linePath(ring, true); }).join('');
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map(function (polygon) {
      return polygon.map(function (ring) { return linePath(ring, true); }).join('');
    }).join('');
  }
  throw new Error('Unsupported geometry type: ' + geometry.type);
}

function buildGraticule() {
  const paths = [];
  [-120, -60, 0, 60, 120].forEach(function (longitude) {
    const coordinates = [];
    for (let latitude = -88; latitude <= 88; latitude += 2) coordinates.push([longitude, latitude]);
    paths.push(linePath(coordinates, false));
  });
  [-60, -30, 0, 30, 60].forEach(function (latitude) {
    const coordinates = [];
    for (let longitude = -180; longitude <= 180; longitude += 4) coordinates.push([longitude, latitude]);
    paths.push(linePath(coordinates, false));
  });
  return paths.join('');
}

function download(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, function (response) {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        download(new URL(response.headers.location, url).toString()).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error('Natural Earth download failed with HTTP ' + response.statusCode));
        return;
      }
      const chunks = [];
      response.on('data', function (chunk) { chunks.push(chunk); });
      response.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')); });
    }).on('error', reject);
  });
}

function inputPath() {
  const index = process.argv.indexOf('--input');
  if (index === -1) return '';
  if (!process.argv[index + 1]) throw new Error('--input requires a GeoJSON path');
  return path.resolve(process.cwd(), process.argv[index + 1]);
}

async function main() {
  const localInput = inputPath();
  const sourceText = localInput ? fs.readFileSync(localInput, 'utf8') : await download(SOURCE.url);
  const geojson = JSON.parse(sourceText);
  if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    throw new Error('Natural Earth input must be a GeoJSON FeatureCollection');
  }
  const landPath = geojson.features.map(function (feature) { return geometryPath(feature.geometry); }).join('');
  const graticulePath = buildGraticule();
  if (landPath.length < 10000) throw new Error('Generated land path is unexpectedly small');

  const mapData = {
    projection: 'Equal Earth',
    viewBox: VIEWBOX,
    source: SOURCE,
    landPath: landPath,
    graticulePath: graticulePath
  };
  const output = `(function (root, factory) {
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.PARALLEL_WORLDS_MAP_DATA = data;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return ${JSON.stringify(mapData)};
}));
`;
  fs.writeFileSync(path.join(root, 'world-map-data.js'), output);
  console.log('Generated world-map-data.js from Natural Earth ' + SOURCE.version);
}

main().catch(function (error) {
  console.error(error.message);
  process.exitCode = 1;
});
