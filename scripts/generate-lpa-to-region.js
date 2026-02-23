// Run this script with: node scripts/generate-lpa-to-region.js
// It will read the GeoJSON and output a simple mapping JSON file.

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../app/data/lpa-to-region.json');
const outputPath = path.join(__dirname, '../app/data/lpa-to-region-simple.json');

const geojson = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const mapping = {};

geojson.features.forEach(feature => {
  const lpa = feature.properties.LAD25NM;
  const region = feature.properties.RGN25NM;
  if (lpa && region) {
    mapping[lpa] = region;
  }
});

fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));
console.log('Mapping written to', outputPath);
