const songsList = document.getElementById('songs-list');
const lyricsSection = document.getElementById('lyrics-section');
const searchInput = document.getElementById('search');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const songLyrics = document.getElementById('song-lyrics');
const backButton = document.getElementById('back-button');
const categorySelect = document.getElementById('category-select');

let songs = [];

// Load song file names from manifest.json and then fetch all songs
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

// Render the list of songs, optionally filtered
function renderSongs(songsToRender) {
  songsList.innerHTML = '';
  if (!songsToRender.length) {
    songsList.innerHTML = '<li>No songs found.</li>';
    return;
  }
  songsToRender.forEach((song) => {
    const li = document.createElement('li');
    li.textContent = `${song.title} - ${song.artist}`;
    li.onclick = () => showLyrics(song);
    songsList.appendChild(li);
  });
}

// Show lyrics with section support
function showLyrics(song) {
  songsList.style.display = 'none';
  lyricsSection.style.display = 'block';
  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  songLyrics.innerHTML = '';
  song.sections.forEach(section => {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = `section ${section.type}`;
    const label = document.createElement('strong');
    label.textContent = section.label;
    sectionDiv.appendChild(label);
    sectionDiv.appendChild(document.createElement('br'));
    section.lines.forEach(line => {
      sectionDiv.appendChild(document.createTextNode(line));
      sectionDiv.appendChild(document.createElement('br'));
    });
    sectionDiv.appendChild(document.createElement('br'));
    songLyrics.appendChild(sectionDiv);
  });
}

backButton.onclick = () => {
  lyricsSection.style.display = 'none';
  songsList.style.display = 'block';
};

// Filtering by category and search
function filterAndRender() {
  const keyword = searchInput.value.toLowerCase();
  const category = categorySelect.value;
  const filtered = songs.filter(song =>
    (category === 'all' || song.category === category) &&
    (song.title.toLowerCase().includes(keyword) ||
     song.artist.toLowerCase().includes(keyword))
  );
  renderSongs(filtered);
}

searchInput.oninput = filterAndRender;
categorySelect.onchange = filterAndRender;

fetchSongs();