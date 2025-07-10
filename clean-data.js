// Clean up the all-songs.json file by removing empty/placeholder songs
const fs = require('fs');
const path = require('path');

const allSongsPath = path.join(__dirname, 'lyrics', 'all-songs.json');
const allSongs = JSON.parse(fs.readFileSync(allSongsPath, 'utf8'));

// Filter out songs with empty titles or placeholder content
const cleanedSongs = allSongs.filter(song => {
  // Skip songs with empty titles
  if (!song.title || song.title.trim() === '') {
    return false;
  }
  
  // Skip songs with placeholder content like "dafdsfasa"
  if (song.sections && song.sections.length > 0) {
    const hasPlaceholderContent = song.sections.some(section => 
      section.lines && section.lines.some(line => 
        line.includes('dafdsfasa') || line.includes('sdfasdfsadf')
      )
    );
    if (hasPlaceholderContent) {
      return false;
    }
  }
  
  return true;
});

console.log(`Original songs: ${allSongs.length}`);
console.log(`Cleaned songs: ${cleanedSongs.length}`);
console.log(`Removed: ${allSongs.length - cleanedSongs.length} songs`);

// Write the cleaned data back
fs.writeFileSync(allSongsPath, JSON.stringify(cleanedSongs, null, 2));
console.log('Data cleaned and saved!');
