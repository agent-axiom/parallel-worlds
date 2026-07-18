import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const data = require(path.join(root, 'data.js'));
const editionData = require(path.join(root, 'edition-data.js'));
const mediaData = require(path.join(root, 'media-data.js'));
const editionAudit = require(path.join(root, 'edition-audit.js'));
const output = JSON.stringify(editionAudit.buildAudit(data, editionData, mediaData), null, 2) + '\n';

fs.writeFileSync(path.join(root, 'edition-audit.json'), output, 'utf8');
