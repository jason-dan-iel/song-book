
document.addEventListener('DOMContentLoaded', () => {
  const manifestUrl = 'lyrics/manifest.json';
  const categorySelect = document.getElementById('category-select');
  const searchInput = document.getElementById('search');
  const songsList = document.getElementById('songs-list');
  const lyricsSection = document.getElementById('lyrics-section');
  const songTitle = document.getElementById('song-title');
  const songLyrics = document.getElementById('song-lyrics');
  const backToListBtn = document.getElementById('back-to-list');

  let allSongs = [];
  let filteredSongs = [];
  let categories = [];
  let currentCategory = '';

  // Load manifest and categories
  fetch(manifestUrl)
    .then(res => res.json())
    .then(async manifest => {
      categories = manifest.map(file => file.replace('-songs.json', ''));
      categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`).join('');
      currentCategory = categories[0];
      await loadCategory(currentCategory);
      renderSongsList();
    });

  categorySelect.addEventListener('change', async e => {
    currentCategory = e.target.value;
    await loadCategory(currentCategory);
    renderSongsList();
    searchInput.value = '';
  });

  searchInput.addEventListener('input', () => {
    renderSongsList();
  });

  songsList.addEventListener('click', e => {
    if (e.target.tagName === 'LI') {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      showSong(filteredSongs[idx]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      history.pushState({ song: filteredSongs[idx], category: currentCategory }, '', '');
    }
  });

  backToListBtn.addEventListener('click', () => {
    showList();
    history.pushState({}, '', '');
  });

  window.addEventListener('popstate', e => {
    if (e.state && e.state.song) {
      showSong(e.state.song);
    } else {
      showList();
    }
  });

  async function loadCategory(category) {
    const url = `lyrics/${category}-songs.json`;
    const res = await fetch(url);
    allSongs = await res.json();
    filteredSongs = allSongs;
  }

  function renderSongsList() {
    const q = searchInput.value.trim().toLowerCase();
    filteredSongs = allSongs.filter(song =>
      song.title.toLowerCase().includes(q) ||
      (song.lyrics && song.lyrics.toLowerCase().includes(q))
    );
  songsList.innerHTML = filteredSongs.map((song, i) => `<li data-idx="${i}"><span style='opacity:.6;margin-right:.5em;'>${i+1}.</span>${song.title}</li>`).join('');
    showList();
  }


  function showSong(song) {
    songTitle.textContent = song.title;
    songLyrics.innerHTML = renderSections(song.sections);
    lyricsSection.style.display = '';
    songsList.style.display = 'none';
    document.querySelector('.controls').style.visibility = 'hidden';
  }

  function showList() {
    lyricsSection.style.display = 'none';
    songsList.style.display = '';
    document.querySelector('.controls').style.visibility = 'visible';
    songTitle.textContent = '';
    songLyrics.innerHTML = '';
  }

  function renderSections(sections) {
    if (!Array.isArray(sections)) return '';
    return sections.map(section => {
      const cls = section.type === 'chorus' ? 'section chorus' : section.type === 'verse' ? 'section verse' : 'section';
      const label = section.label ? `<strong>${section.label}</strong><br>` : '';
      const lines = (section.lines || []).map(line => `${line}<br>`).join('');
      return `<div class="${cls}">${label}${lines}</div>`;
    }).join('');
  }
});