import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const data = require(path.join(root, 'data.js'));
const journeys = require(path.join(root, 'journeys-data.js'));
const audit = require(path.join(root, 'academic-audit.js'));
const output = JSON.stringify(audit.buildAudit(data, journeys), null, 2) + '\n';

fs.writeFileSync(path.join(root, 'academic-audit.json'), output, 'utf8');
