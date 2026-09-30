import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public/data');
const tilesDir = path.join(publicDir, 'tiles');
const argoDir = path.join(publicDir, 'argo');

fs.mkdirSync(tilesDir, { recursive: true });
fs.mkdirSync(argoDir, { recursive: true });

// Import generator
import { generateSyntheticTile, generateSyntheticArgoFloats, SUPPORTED_DEPTHS } from '../src/utils/dataLoader.js';

const date = '2023-03-21';
const variables = ['temperature', 'salinity'];

console.log('Generating static oceanographic tile datasets...');

for (const variable of variables) {
  for (const depth of SUPPORTED_DEPTHS) {
    const tileData = generateSyntheticTile(variable, depth, date);
    const filename = `${variable}_d${depth}_${date}.json`;
    const filepath = path.join(tilesDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(tileData, null, 2), 'utf-8');
    console.log(`✓ Generated ${filename}`);
  }
}

console.log('Generating static Argo profiling float dataset...');
const argoData = generateSyntheticArgoFloats(date);
const argoPath = path.join(argoDir, `positions_${date}.json`);
fs.writeFileSync(argoPath, JSON.stringify(argoData, null, 2), 'utf-8');
console.log(`✓ Generated positions_${date}.json (${argoData.length} floats)`);

console.log('Static ocean datasets ready!');
