const songsList = document.getElementById('songs-list');
const lyricsSection = document.getElementById('lyrics-section');
const searchInput = document.getElementById('search');
const songTitle = document.getElementById('song-title');
const songLyrics = document.getElementById('song-lyrics');
const categorySelect = document.getElementById('category-select');

let songs = [];
let currentSong = null;

// Helper to parse filename into category and index (e.g., "hindi-12.json" -> {category: "hindi", index: 12})
function parseFilename(filename) {
  const match = filename.match(/^(hindi|english|yc|special)-(\d+)\.json$/i);
  if (!match) return null;
  return {
    category: match[1].toLowerCase(),
    index: parseInt(match[2], 10)
  };
}

// Helper to get category from song data
function getSongCategory(song) {
  if (song.category) {
    const category = song.category.toLowerCase();
    if (category.includes('youth') || category.includes('camp')) return 'yc';
    if (category.includes('hindi')) return 'hindi';
    if (category.includes('english')) return 'english';
    if (category.includes('special')) return 'special';
    return category;
  }
  // Fallback to filename parsing
  const parsed = parseFilename(song.file);
  return parsed ? parsed.category : 'english';
}

// Helper to get song index
function getSongIndex(song) {
  const parsed = parseFilename(song.file);
  return parsed ? parsed.index : 0;
}

// Helper to get display label for category (keeping empty as per your code)
function getDisplayCategoryLabel(category) {
  switch (category) {
    case 'hindi': return 'H';
    case 'english': return 'E';
    case 'yc': return 'YC';
    case 'special': return 'S';
    default: return '';
  }
}

// Fetch songs based on manifest.json
async function fetchSongs() {
  songs = [];
  let songFiles = [];
  try {
    const resp = await fetch('lyrics/manifest.json');
    songFiles = await resp.json();
  } catch {
    songsList.innerHTML = '<li>Error loading song manifest.</li>';
    return;
  }
  
  for (const file of songFiles) {
    try {
      const resp = await fetch('lyrics/' + file);
      const data = await resp.json();
      // If data is an array (like all-songs.json), spread it
      if (Array.isArray(data)) {
        songs.push(...data);
      } else {
        songs.push({ ...data, file });
      }
    } catch (e) {
      console.error('Error loading file:', file, e);
    }
  }
  
  // Remove duplicates based on title and file
  const uniqueSongs = [];
  const seenTitles = new Set();
  
  for (const song of songs) {
    const key = `${song.title}_${song.file}`;
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      uniqueSongs.push(song);
    }
  }
  
  songs = uniqueSongs;
  console.log('Loaded songs:', songs.length);
  filterAndRender();
}

// Helper to flatten all lyric lines for searching
function getAllLyricsLines(song) {
  if (!Array.isArray(song.sections)) return [];
  return song.sections.flatMap(section => section.lines || []);
}

// Render the list of songs, optionally filtered
function renderSongs(songsToRender) {
  songsList.innerHTML = '';
  if (!songsToRender.length) {
    songsList.innerHTML = '<li>No songs found.</li>';
    return;
  }
  songsToRender.forEach((song, index) => {
    const category = getSongCategory(song);
    const fileIndex = getSongIndex(song);
    
    // Use file index if available, otherwise use sequential numbering
    const displayIndex = fileIndex > 0 ? fileIndex : (index + 1);
    const prefix = `${getDisplayCategoryLabel(category)}${displayIndex}. `;
    
    const li = document.createElement('li');
    li.textContent = `${prefix}${song.title || 'Untitled Song'}`;
    li.onclick = () => showLyrics(song);
    songsList.appendChild(li);
  });
}

// Show lyrics with section support, including optional transliteration/translation
function showLyrics(song, pushHistory = true) {
  currentSong = song;
  songsList.style.display = 'none';
  lyricsSection.style.display = 'block';
  songTitle.textContent = song.title || 'Untitled Song';
  
  // Show artist if available
  const songArtist = document.getElementById('song-artist');
  if (song.artist && song.artist.trim()) {
    songArtist.textContent = song.artist;
    songArtist.style.display = 'block';
  } else {
    songArtist.style.display = 'none';
  }
  
  songLyrics.innerHTML = '';
  song.sections.forEach(section => {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = `section ${section.type}`;
    const label = document.createElement('strong');
    label.textContent = section.label;
    sectionDiv.appendChild(label);
    sectionDiv.appendChild(document.createElement('br'));
    section.lines.forEach((line, idx) => {
      sectionDiv.appendChild(document.createTextNode(line));
      sectionDiv.appendChild(document.createElement('br'));
      if (section.transliteration && section.transliteration[idx]) {
        const transSpan = document.createElement('span');
        transSpan.style.color = '#666';
        transSpan.style.fontStyle = 'italic';
        transSpan.textContent = section.transliteration[idx];
        sectionDiv.appendChild(transSpan);
        sectionDiv.appendChild(document.createElement('br'));
      }
      if (section.translation && section.translation[idx]) {
        const transSpan = document.createElement('span');
        transSpan.style.color = '#008800';
        transSpan.style.fontStyle = 'italic';
        transSpan.textContent = section.translation[idx];
        sectionDiv.appendChild(transSpan);
        sectionDiv.appendChild(document.createElement('br'));
      }
    });
    sectionDiv.appendChild(document.createElement('br'));
    songLyrics.appendChild(sectionDiv);
  });

  // Push state to history if navigating forward
  if (pushHistory) {
    history.pushState({ songFile: song.file }, '', `#song-${encodeURIComponent(song.file.replace(/\.json$/, ''))}`);
  }
}

function showSongList(pushHistory = true) {
  lyricsSection.style.display = 'none';
  songsList.style.display = 'block';
  currentSong = null;
  if (pushHistory) {
    history.pushState({ songList: true }, '', '#list');
  }
}

// Browser Back/Forward
window.onpopstate = function(event) {
  if (event.state && event.state.songFile) {
    const song = songs.find(s => s.file === event.state.songFile);
    if (song) showLyrics(song, false);
  } else {
    showSongList(false);
  }
};

// On initial load, restore state from hash or default
window.addEventListener('DOMContentLoaded', () => {
  fetchSongs().then(() => {
    if (location.hash.startsWith('#song-')) {
      const fileBase = decodeURIComponent(location.hash.replace('#song-', '')) + '.json';
      const song = songs.find(s => s.file.replace(/\.json$/, '') === fileBase.replace(/\.json$/, ''));
      if (song) showLyrics(song, false);
    } else {
      showSongList(false);
    }
  });
});

// Filtering by category and search, and sorting by filename index
function filterAndRender() {
  const keyword = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;

  let filtered = songs.filter(song => {
    const songCategory = getSongCategory(song);

    // Category filter
    if (category && category !== 'all') {
      const categoryMatch = category === 'youth_camp' ? 'yc' : category;
      if (songCategory !== categoryMatch) {
        return false;
      }
    }

    // No search: include everything that passes category
    if (!keyword) return true;

    // Search by title
    if (song.title && song.title.toLowerCase().includes(keyword)) return true;

    // Search by index (exact or partial, e.g., "12" matches hindi-12)
    const songIndex = getSongIndex(song);
    if (songIndex && songIndex.toString().includes(keyword)) return true;

    // Search by lyrics content
    const allLines = getAllLyricsLines(song);
    if (allLines.some(line => line.toLowerCase().includes(keyword))) return true;

    return false;
  });

  // Sort by category then index
  filtered.sort((a, b) => {
    const catA = getSongCategory(a);
    const catB = getSongCategory(b);
    if (catA !== catB) return catA.localeCompare(catB);
    
    const indexA = getSongIndex(a);
    const indexB = getSongIndex(b);
    
    // If both have valid indices, sort by index
    if (indexA > 0 && indexB > 0) {
      return indexA - indexB;
    }
    
    // If only one has a valid index, prioritize it
    if (indexA > 0) return -1;
    if (indexB > 0) return 1;
    
    // If neither has a valid index, sort by title
    return (a.title || '').localeCompare(b.title || '');
  });

  renderSongs(filtered);
}

searchInput.oninput = filterAndRender;
categorySelect.onchange = filterAndRender;

fetchSongs();