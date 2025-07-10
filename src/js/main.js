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
  const match = filename.match(/^(hindi|english|yc)-(\d+)\.json$/i);
  if (!match) return null;
  return {
    category: match[1].toLowerCase(),
    index: parseInt(match[2], 10)
  };
}

// Helper to get display label for category
function getDisplayCategoryLabel(category) {
  switch (category) {
    case 'hindi': return '';
    case 'english': return '';
    case 'yc': return '';
    case 'special': return '';
    default: return category;
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
      songs.push({ ...data, file });
    } catch (e) {
      // Skip if file not found or invalid
    }
  }
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
  songsToRender.forEach((song) => {
    const parsed = parseFilename(song.file);
    let prefix = '';
    if (parsed) {
      prefix = `${getDisplayCategoryLabel(parsed.category)} ${parsed.index}. `;
    }
    const li = document.createElement('li');
    li.textContent = `${prefix}${song.title}`;
    li.onclick = () => showLyrics(song);
    songsList.appendChild(li);
  });
}

// Show lyrics with section support, including optional transliteration/translation
function showLyrics(song, pushHistory = true) {
  currentSong = song;
  songsList.style.display = 'none';
  lyricsSection.style.display = 'block';
  songTitle.textContent = song.title;
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
    const parsed = parseFilename(song.file);

    // Category filter
    if (category && category !== 'all' && (!parsed || parsed.category !== category)) {
      return false;
    }

    // No search: include everything that passes category
    if (!keyword) return true;

    // Search by title
    if (song.title && song.title.toLowerCase().includes(keyword)) return true;

    // Search by index (exact or partial, e.g., "12" matches hindi-12)
    if (parsed && parsed.index && parsed.index.toString().includes(keyword)) return true;

    // Search by lyrics content
    const allLines = getAllLyricsLines(song);
    if (allLines.some(line => line.toLowerCase().includes(keyword))) return true;

    return false;
  });

  // Sort by category then index
  filtered.sort((a, b) => {
    const pa = parseFilename(a.file);
    const pb = parseFilename(b.file);
    if (!pa || !pb) return 0;
    if (pa.category !== pb.category) return pa.category.localeCompare(pb.category);
    return pa.index - pb.index;
  });

  renderSongs(filtered);
}

searchInput.oninput = filterAndRender;
categorySelect.onchange = filterAndRender;

fetchSongs();