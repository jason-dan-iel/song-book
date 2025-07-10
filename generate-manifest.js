// generate-manifest.js
// Usage: node generate-manifest.js
// Run this script from your project root (where "lyrics" folder is located)

const fs = require('fs');
const path = require('path');

const lyricsDir = path.join(__dirname, 'lyrics');

const files = fs.readdirSync(lyricsDir)
  .filter(f => /^[a-z]+-\d+\.json$/i.test(f)) // Only song JSONs like "hindi-1.json"
  .sort((a, b) => {
    // Sort by category, then index
    const am = a.match(/^([a-z]+)-(\d+)\.json$/i);
    const bm = b.match(/^([a-z]+)-(\d+)\.json$/i);
    if (!am || !bm) return 0;
    if (am[1] !== bm[1]) return am[1].localeCompare(bm[1]);
    return parseInt(am[2], 10) - parseInt(bm[2], 10);
  });

fs.writeFileSync(
  path.join(lyricsDir, 'manifest.json'),
  JSON.stringify(files, null, 2)
);

console.log('manifest.json updated with', files.length, 'files.');