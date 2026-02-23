// Run this script with: node scripts/generate-lpa-list.js
// It will read the lpa-to-region-simple.json and output a sorted LPA array for dropdowns.

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../app/data/lpa-to-region-simple.json');
const outputPath = path.join(__dirname, '../app/data/lpa-list.json');

const mapping = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const lpaList = Object.keys(mapping).sort();

fs.writeFileSync(outputPath, JSON.stringify(lpaList, null, 2));
console.log('Alphabetical LPA list written to', outputPath);
