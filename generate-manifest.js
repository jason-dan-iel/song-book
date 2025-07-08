const fs = require('fs');
const path = require('path');
const lyricsDir = './lyrics';

const files = fs.readdirSync(lyricsDir)
  .filter(f => f.endsWith('.json') && f !== 'manifest.json');

fs.writeFileSync(path.join(lyricsDir, 'manifest.json'), JSON.stringify(files, null, 2));
console.log('manifest.json updated!');