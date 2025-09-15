document.addEventListener('DOMContentLoaded', () => {
  const manifestUrl = 'lyrics/manifest.json';
  const categorySelect = document.getElementById('category-select');
  const searchInput = document.getElementById('search');
  const songsList = document.getElementById('songs-list');
  const lyricsSection = document.getElementById('lyrics-section');
  const songTitle = document.getElementById('song-title');
  const songLyrics = document.getElementById('song-lyrics');
  const backToListBtn = document.getElementById('back-to-list');

  let allSongsMetadata = [];
  let filteredSongs = [];
  let categories = [];
  let currentCategory = '';
  let songCache = new Map();
  let loadingPromises = new Map();
  let currentFontSize = 16; // Default font size in pixels

  // Load manifest and categories
  fetch(manifestUrl)
    .then(res => res.json())
    .then(manifest => {
      categories = manifest.categories.map(cat => cat.name);
      categorySelect.innerHTML = categories.map(cat => 
        `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`
      ).join('');
      
      // Store all songs metadata
      allSongsMetadata = manifest.categories.flatMap(category => 
        category.songs.map(song => ({
          ...song,
          category: category.name
        }))
      );
      
      currentCategory = categories[0];
      loadCategory(currentCategory);
      renderSongsList();
    })
    .catch(err => console.error('Error loading manifest:', err));

  categorySelect.addEventListener('change', e => {
    currentCategory = e.target.value;
    loadCategory(currentCategory);
    renderSongsList();
    searchInput.value = '';
  });

  searchInput.addEventListener('input', () => {
    renderSongsList();
  });

  songsList.addEventListener('click', async e => {
    if (e.target.tagName === 'LI') {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      const songMetadata = filteredSongs[idx];
      
      // Show loading state
      showLoadingState();
      
      try {
        const song = await loadSongContent(songMetadata);
        showSong(song);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        history.pushState({ song: song, category: currentCategory }, '', '');
      } catch (err) {
        console.error('Error loading song:', err);
        showErrorState();
      }
    }
  });

  backToListBtn.addEventListener('click', () => {
    showList();
    history.pushState({}, '', '');
  });

  window.addEventListener('popstate', async e => {
    if (e.state && e.state.song) {
      // If song is in cache, show immediately, otherwise load it
      if (songCache.has(e.state.song.id)) {
        showSong(songCache.get(e.state.song.id));
      } else {
        showLoadingState();
        try {
          const song = await loadSongContent(e.state.song);
          showSong(song);
        } catch (err) {
          console.error('Error loading song:', err);
          showList();
        }
      }
    } else {
      showList();
    }
  });

  function setupAutoScroll() {
  let autoScrollInterval;
  let isAutoScrolling = false;
  
  const autoScrollBtn = document.createElement('button');
  autoScrollBtn.id = 'auto-scroll-toggle';
  autoScrollBtn.textContent = '⏯️ Auto Scroll';
  autoScrollBtn.title = 'Toggle auto-scroll';
  
  // Add to action controls
  document.querySelector('.action-controls').appendChild(autoScrollBtn);
  
  autoScrollBtn.addEventListener('click', () => {
    if (isAutoScrolling) {
      clearInterval(autoScrollInterval);
      autoScrollBtn.textContent = '⏯️ Auto Scroll';
      isAutoScrolling = false;
    } else {
      autoScrollInterval = setInterval(() => {
        window.scrollBy(0, 1);
      }, 50);
      autoScrollBtn.textContent = '⏸️ Stop Scroll';
      isAutoScrolling = true;
    }
  });
}
function saveFontSize() {
  localStorage.setItem('songbook-font-size', currentFontSize);
}

function loadFontSize() {
  const saved = localStorage.getItem('songbook-font-size');
  if (saved) {
    currentFontSize = parseInt(saved);
  }
}

  function loadCategory(category) {
    // Filter metadata by category (no network requests)
    const categoryData = allSongsMetadata.filter(song => song.category === category);
    filteredSongs = categoryData;
  }

  async function loadSongContent(songMetadata) {
    // Check cache first
    if (songCache.has(songMetadata.id)) {
      return songCache.get(songMetadata.id);
    }

    // Check if already loading
    if (loadingPromises.has(songMetadata.id)) {
      return loadingPromises.get(songMetadata.id);
    }

    // Load song content
    const loadPromise = fetch(`lyrics/${songMetadata.file}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load song: ${res.status}`);
        return res.json();
      })
      .then(song => {
        // Cache the loaded song
        songCache.set(songMetadata.id, song);
        loadingPromises.delete(songMetadata.id);
        return song;
      })
      .catch(err => {
        loadingPromises.delete(songMetadata.id);
        throw err;
      });

    loadingPromises.set(songMetadata.id, loadPromise);
    return loadPromise;
  }

  function renderSongsList() {
    const q = searchInput.value.trim().toLowerCase();
    
    // Filter based on current category
    let songsToFilter = allSongsMetadata.filter(song => song.category === currentCategory);
    
    // Apply search filter
    if (q) {
      songsToFilter = songsToFilter.filter(song =>
        song.title.toLowerCase().includes(q)
      );
    }
    
    filteredSongs = songsToFilter;
    
    songsList.innerHTML = filteredSongs.map((song, i) => 
      `<li data-idx="${i}"><span style='opacity:.6;margin-right:.5em;'>${i+1}.</span>${song.title}</li>`
    ).join('');
    
    showList();
  }

  function showSong(song) {
    songTitle.textContent = song.title;
    songLyrics.innerHTML = `
      <div class="lyrics-controls">
        <div class="font-controls">
          <button id="decrease-font" type="button" title="Decrease font size">A-</button>
          <span id="font-size-display">${currentFontSize}px</span>
          <button id="increase-font" type="button" title="Increase font size">A+</button>
        </div>
        <div class="action-controls">
          <button id="export-pdf" type="button" title="Export to PDF">📄 PDF</button>
          <button id="fullscreen-toggle" type="button" title="Toggle fullscreen">⛶ Cast</button>
        </div>
      </div>
      <div id="lyrics-content">${renderSections(song.sections)}</div>
    `;
    
    // Apply current font size
    document.getElementById('lyrics-content').style.fontSize = `${currentFontSize}px`;
    
    // Add event listeners for new controls
    setupLyricsControls(song);
    
    lyricsSection.style.display = '';
    songsList.style.display = 'none';
    document.querySelector('.controls').style.visibility = 'hidden';
  }

  function setupLyricsControls(song) {
    const decreaseFontBtn = document.getElementById('decrease-font');
    const increaseFontBtn = document.getElementById('increase-font');
    const fontSizeDisplay = document.getElementById('font-size-display');
    const exportPdfBtn = document.getElementById('export-pdf');
    const fullscreenBtn = document.getElementById('fullscreen-toggle');
    const lyricsContent = document.getElementById('lyrics-content');

    // Font size controls
    decreaseFontBtn.addEventListener('click', () => {
      if (currentFontSize > 10) {
        currentFontSize -= 2;
        lyricsContent.style.fontSize = `${currentFontSize}px`;
        fontSizeDisplay.textContent = `${currentFontSize}px`;
      }
    });

    increaseFontBtn.addEventListener('click', () => {
      if (currentFontSize < 32) {
        currentFontSize += 2;
        lyricsContent.style.fontSize = `${currentFontSize}px`;
        fontSizeDisplay.textContent = `${currentFontSize}px`;
      }
    });

    // PDF Export
    exportPdfBtn.addEventListener('click', () => exportToPDF(song));

    // Fullscreen toggle
    fullscreenBtn.addEventListener('click', () => toggleFullscreen());
  }

  // PDF Export function
  async function exportToPDF(song) {
    try {
      // Create a new window for PDF content
      const printWindow = window.open('', '_blank');
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${song.title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              margin: 20px;
              font-size: 14px;
            }
            h1 { 
              color: #1976d2; 
              border-bottom: 2px solid #1976d2;
              padding-bottom: 10px;
            }
            .section { 
              margin-bottom: 20px; 
              page-break-inside: avoid;
            }
            .section strong { 
              color: #333; 
              display: block;
              margin-bottom: 5px;
            }
            .chorus { 
              background: #f5f5f5; 
              padding: 10px; 
              border-left: 4px solid #1976d2;
              margin: 15px 0;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${song.title}</h1>
          <div class="no-print">
            <button onclick="window.print()">Print/Save as PDF</button>
            <button onclick="window.close()">Close</button>
          </div>
          ${renderSections(song.sections)}
        </body>
        </html>
      `;
      
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      
      // Auto-trigger print dialog after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Error exporting to PDF. Please try again.');
    }
  }

  // Fullscreen functionality for screen casting
  function toggleFullscreen() {
    const lyricsContent = document.getElementById('lyrics-content');
    
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (lyricsContent.requestFullscreen) {
        lyricsContent.requestFullscreen();
      } else if (lyricsContent.webkitRequestFullscreen) {
        lyricsContent.webkitRequestFullscreen();
      } else if (lyricsContent.msRequestFullscreen) {
        lyricsContent.msRequestFullscreen();
      }
      
      // Add fullscreen styling
      lyricsContent.classList.add('fullscreen-mode');
      
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  // Listen for fullscreen changes
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('msfullscreenchange', handleFullscreenChange);

  function handleFullscreenChange() {
    const lyricsContent = document.getElementById('lyrics-content');
    const fullscreenBtn = document.getElementById('fullscreen-toggle');
    
    if (lyricsContent) {
      if (document.fullscreenElement) {
        lyricsContent.classList.add('fullscreen-mode');
        if (fullscreenBtn) fullscreenBtn.textContent = '⛶ Exit Cast';
      } else {
        lyricsContent.classList.remove('fullscreen-mode');
        if (fullscreenBtn) fullscreenBtn.textContent = '⛶ Cast';
      }
    }
  }

  function showList() {
    lyricsSection.style.display = 'none';
    songsList.style.display = '';
    document.querySelector('.controls').style.visibility = 'visible';
    songTitle.textContent = '';
    songLyrics.innerHTML = '';
  }

  function showLoadingState() {
    songTitle.textContent = 'Loading...';
    songLyrics.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Loading song...</div>';
    lyricsSection.style.display = '';
    songsList.style.display = 'none';
    document.querySelector('.controls').style.visibility = 'hidden';
  }

  function showErrorState() {
    songTitle.textContent = 'Error';
    songLyrics.innerHTML = '<div style="text-align: center; padding: 2rem; color: #e57373;">Failed to load song. Please try again.</div>';
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

  // Optional: Preload popular songs
  function preloadPopularSongs() {
    // You can define a list of popular song IDs to preload
    const popularSongIds = ['eng-001', 'hin-001']; // Add your popular songs
    
    popularSongIds.forEach(async id => {
      const songMetadata = allSongsMetadata.find(s => s.id === id);
      if (songMetadata && !songCache.has(id)) {
        try {
          await loadSongContent(songMetadata);
        } catch (err) {
          console.log(`Failed to preload song ${id}:`, err);
        }
      }
    });
  }

  // Call preload after initial load
  setTimeout(preloadPopularSongs, 1000);
});