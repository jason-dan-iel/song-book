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

  // Load saved font size
  loadFontSize();

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

  // Listen for messages from cast window
  window.addEventListener('message', function(event) {
    if (event.data.type === 'castWindowClosed') {
      window.castWindow = null;
      updateCastButtonState(false);
    }
  });

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
          <button id="fullscreen-toggle" type="button" title="Cast to external display">📺 Cast</button>
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

  // Enhanced cast functionality for wireless projector casting
  function toggleCast() {
    const existingCastWindow = window.castWindow;
    
    if (existingCastWindow && !existingCastWindow.closed) {
      // Close existing cast window
      existingCastWindow.close();
      window.castWindow = null;
      updateCastButtonState(false);
    } else {
      // Show casting options
      showCastOptions();
    }
  }

  function showCastOptions() {
    const song = getCurrentSong();
    if (!song) {
      alert('Please select a song first');
      return;
    }

    // Detect available casting options
    const hasGoogleCast = 'chrome' in window && 'cast' in window.chrome;
    const isAppleDevice = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);

    // Create a modal for cast options
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 600px;
        width: 90%;
        text-align: center;
        font-family: Arial, sans-serif;
      ">
        <h2 style="margin-top: 0; color: #1976d2;">Cast "${song.title}"</h2>
        <p style="color: #666; margin-bottom: 2rem;">
          Choose your casting method:
        </p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <!-- Presentation Mode -->
          <button id="cast-presentation" style="
            padding: 1.5rem;
            background: #ff9800;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            text-align: left;
          ">
            <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
            <strong>Presentation Mode</strong>
            <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
              Optimized for projectors & TVs
            </div>
          </button>

          <!-- Google Cast -->
          ${hasGoogleCast ? `
          <button id="google-cast" style="
            padding: 1.5rem;
            background: #4285f4;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            text-align: left;
          ">
            <div style="font-size: 24px; margin-bottom: 8px;">📺</div>
            <strong>Google Cast</strong>
            <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
              Cast to Chromecast devices
            </div>
          </button>
          ` : ''}

          <!-- Regular Cast Window -->
          <button id="cast-window" style="
            padding: 1.5rem;
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            text-align: left;
          ">
            <div style="font-size: 24px; margin-bottom: 8px;">🖥️</div>
            <strong>Cast Window</strong>
            <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
              Drag to external display
            </div>
          </button>
        </div>
        
        <!-- Wireless Instructions -->
        <div style="
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
          font-size: 14px;
          color: #666;
          text-align: left;
          margin-bottom: 1rem;
        ">
          <strong style="color: #333;">📱 For Wireless Casting:</strong>
          <div style="margin-top: 8px;">
            ${isAppleDevice ? `
            <div style="margin-bottom: 8px;">
              <strong>AirPlay:</strong> Control Center → Screen Mirroring → Select TV/Apple TV
            </div>
            ` : ''}
            <div style="margin-bottom: 8px;">
              <strong>Chromecast:</strong> Chrome menu (⋮) → Cast → Select Chromecast device
            </div>
            <div style="margin-bottom: 8px;">
              <strong>Miracast:</strong> Windows Key + K → Select wireless display
            </div>
            <div>
              <strong>Smart TV:</strong> Use TV's screen mirroring feature
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button id="help-casting" style="
            padding: 0.75rem 1.5rem;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">
            📖 Casting Guide
          </button>
          <button id="cancel-cast" style="
            padding: 0.75rem 1.5rem;
            background: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
          ">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('#cast-presentation').addEventListener('click', () => {
      document.body.removeChild(modal);
      openPresentationMode(song);
    });

    modal.querySelector('#cast-window').addEventListener('click', () => {
      document.body.removeChild(modal);
      openCastWindow(song);
    });

    // Google Cast integration if available
    const googleCastBtn = modal.querySelector('#google-cast');
    if (googleCastBtn) {
      googleCastBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        initializeGoogleCast(song);
      });
    }

    modal.querySelector('#help-casting').addEventListener('click', () => {
      document.body.removeChild(modal);
      showCastingGuide();
    });

    modal.querySelector('#cancel-cast').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Google Cast integration (requires Google Cast SDK)
  function initializeGoogleCast(song) {
    // Check if Google Cast is available
    if (!window.chrome || !window.chrome.cast) {
      // Load Google Cast SDK
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js';
      script.onload = () => setupGoogleCast(song);
      document.head.appendChild(script);
      return;
    }
    
    setupGoogleCast(song);
  }

  function setupGoogleCast(song) {
    try {
      // Open presentation mode first
      openPresentationMode(song);
      
      // Show instruction to use Chrome's cast button
      setTimeout(() => {
        alert(`Presentation mode opened! 

To cast to Chromecast:
1. Click the Cast button (⚡) in Chrome's address bar
2. Or go to Chrome menu (⋮) → Cast
3. Select your Chromecast device
4. Choose "Cast tab" to cast the presentation window`);
      }, 1000);
      
    } catch (error) {
      console.error('Google Cast setup failed:', error);
      alert('Google Cast not available. Please use the Cast Window option and manually cast your screen.');
    }
  }

  function showCastingGuide() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 700px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        font-family: Arial, sans-serif;
      ">
        <h2 style="margin-top: 0; color: #1976d2;">📺 Casting Guide</h2>
        
        <div style="margin-bottom: 2rem;">
          <h3 style="color: #333; margin-bottom: 1rem;">🍎 AirPlay (iOS/Mac)</h3>
          <ol style="color: #666; line-height: 1.6;">
            <li>Open Control Center (swipe down from top-right on iPhone/iPad)</li>
            <li>Tap "Screen Mirroring"</li>
            <li>Select your Apple TV or AirPlay-compatible device</li>
            <li>Open the song app and use "Presentation Mode"</li>
          </ol>
        </div>

        <div style="margin-bottom: 2rem;">
          <h3 style="color: #333; margin-bottom: 1rem;">📱 Chromecast (Android/Chrome)</h3>
          <ol style="color: #666; line-height: 1.6;">
            <li>Click the Cast button (⚡) in Chrome's address bar</li>
            <li>Or go to Chrome menu (⋮) → Cast</li>
            <li>Select your Chromecast device</li>
            <li>Choose "Cast tab" or "Cast screen"</li>
            <li>Use "Presentation Mode" for best results</li>
          </ol>
        </div>

        <div style="margin-bottom: 2rem;">
          <h3 style="color: #333; margin-bottom: 1rem;">🖥️ Miracast (Windows)</h3>
          <ol style="color: #666; line-height: 1.6;">
            <li>Press Windows Key + K</li>
            <li>Select your wireless display from the list</li>
            <li>Choose projection mode (Duplicate/Extend)</li>
            <li>Open the song app and use "Cast Window"</li>
          </ol>
        </div>

        <div style="margin-bottom: 2rem;">
          <h3 style="color: #333; margin-bottom: 1rem;">📺 Smart TV Screen Mirroring</h3>
          <ol style="color: #666; line-height: 1.6;">
            <li>Enable screen mirroring on your Smart TV</li>
            <li>Connect your device to the same WiFi network</li>
            <li>Use your device's screen mirroring feature</li>
            <li>Select your TV from available devices</li>
          </ol>
        </div>

        <div style="
          background: #e3f2fd;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 2rem;
          border-left: 4px solid #1976d2;
        ">
          <strong style="color: #1976d2;">💡 Pro Tips:</strong>
          <ul style="color: #666; margin-top: 8px; line-height: 1.6;">
            <li>Use "Presentation Mode" for the best casting experience</li>
            <li>Ensure all devices are on the same WiFi network</li>
            <li>For projectors, use "Cast Window" and drag to the projector screen</li>
            <li>Turn off notifications to avoid interruptions during casting</li>
          </ul>
        </div>

        <button onclick="this.closest('div').parentElement.remove()" style="
          padding: 0.75rem 1.5rem;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
        ">
          Got it!
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Enhanced presentation mode with casting optimizations
  function openPresentationMode(song) {
    // Add casting-specific meta tags and optimizations
    const sectionsHtml = renderSections(song.sections);
    
    const castContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>🎵 ${song.title} - Cast</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="theme-color" content="#000000">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black">
        
        <!-- Add Cast SDK for Chrome -->
        <script src="https://www.gstatic.com/cast/sdk/libs/sender/1.0/cast_sender.js"></script>
        
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            background: #000;
            color: #fff;
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 48px;
            line-height: 1.4;
            padding: 4rem;
            min-height: 100vh;
            overflow-x: hidden;
            cursor: none;
            
            /* Optimize for casting */
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
          
          .cast-indicator {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(255, 193, 7, 0.9);
            color: #000;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            z-index: 1001;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
          
          .presentation-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.95);
            padding: 2rem 4rem;
            z-index: 1000;
            border-bottom: 3px solid #64b5f6;
            backdrop-filter: blur(10px);
          }
          
          .cast-title {
            font-size: 4rem;
            font-weight: bold;
            color: #64b5f6;
            text-align: center;
            text-shadow: 0 3px 6px rgba(0, 0, 0, 0.8);
            margin: 0;
          }
          
          .presentation-content {
            margin-top: 12rem;
            max-width: 95%;
            margin-left: auto;
            margin-right: auto;
          }
          
          .section {
            margin-bottom: 4rem;
            padding: 3rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 1.5rem;
            border-left: 8px solid #64b5f6;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
            text-align: center;
            page-break-inside: avoid;
            
            /* High contrast for better visibility */
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
          }
          
          .section.chorus {
            background: rgba(255, 193, 7, 0.1);
            border-left-color: #ffc107;
            border-left-width: 12px;
            transform: scale(1.02);
          }
          
          .section.verse {
            background: rgba(76, 175, 80, 0.05);
            border-left-color: #4caf50;
          }
          
          .section strong {
            color: #64b5f6;
            font-size: 1.2em;
            margin-bottom: 1.5rem;
            display: block;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: bold;
          }
          
          .section.chorus strong {
            color: #ffc107;
            font-size: 1.4em;
          }
          
          .section.verse strong {
            color: #4caf50;
          }
          
          /* Responsive sizing for different casting resolutions */
          @media (max-width: 1920px) {
            body { font-size: 44px; }
            .cast-title { font-size: 3.5rem; }
          }
          
          @media (max-width: 1366px) {
            body { font-size: 38px; }
            .cast-title { font-size: 3rem; }
            .presentation-content { margin-top: 10rem; }
          }
          
          @media (max-width: 1024px) {
            body { font-size: 32px; }
            .cast-title { font-size: 2.5rem; }
            .presentation-content { margin-top: 8rem; }
          }
          
          /* Animation for smooth transitions */
          .section {
            animation: fadeInUp 0.8s ease-out;
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        </style>
      </head>
      <body>
        <div class="cast-indicator">
          📺 Ready to Cast
        </div>
        
        <div class="presentation-header">
          <h1 class="cast-title">${song.title}</h1>
        </div>
        
        <div class="presentation-content">
          ${sectionsHtml}
        </div>
        
        <script>
          // Auto-fullscreen for better casting
          setTimeout(() => {
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen not available:', err);
              });
            }
          }, 2000);
          
          // Prevent screen sleep during casting
          let wakeLock = null;
          if ('wakeLock' in navigator) {
            navigator.wakeLock.request('screen').then(lock => {
              wakeLock = lock;
            }).catch(err => {
              console.log('Wake lock not available:', err);
            });
          }
          
          // Release wake lock when page unloads
          window.addEventListener('beforeunload', () => {
            if (wakeLock) {
              wakeLock.release();
            }
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({type: 'castWindowClosed'}, '*');
            }
          });
          
          // Keyboard shortcuts for casting control
          document.addEventListener('keydown', function(e) {
            switch(e.key) {
              case 'f':
              case 'F11':
                e.preventDefault();
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else {
                  document.exitFullscreen();
                }
                break;
              case 'Escape':
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                }
                break;
            }
          });
          
          // Hide cast indicator after 5 seconds
          setTimeout(() => {
            const indicator = document.querySelector('.cast-indicator');
            if (indicator) {
              indicator.style.opacity = '0';
              indicator.style.transition = 'opacity 0.5s ease';
            }
          }, 5000);
        </script>
      </body>
      </html>
    `;
    
    // Open presentation window optimized for casting
    const castWindow = window.open('', 'songpresentation', 'width=1920,height=1080,scrollbars=no,resizable=yes');
    
    if (!castWindow) {
      alert('Cast window was blocked by popup blocker. Please allow popups for this site and try again.');
      return;
    }
    
    castWindow.document.write(castContent);
    castWindow.document.close();
    
    // Store reference
    window.castWindow = castWindow;
    updateCastButtonState(true);
    castWindow.focus();
    
    // Show casting instructions
    setTimeout(() => {
      if (confirm('Presentation mode is ready! Would you like to see casting instructions?')) {
        showCastingGuide();
      }
    }, 3000);
  }

  function getCurrentSong() {
    // Get the currently displayed song data
    const songTitleElement = document.getElementById('song-title');
    const lyricsContent = document.getElementById('lyrics-content');
    
    if (!songTitleElement.textContent || !lyricsContent) {
      return null;
    }
    
    // Find the song in cache based on title
    for (let [id, song] of songCache) {
      if (song.title === songTitleElement.textContent) {
        return song;
      }
    }
    
    return null;
  }

  function updateCastButtonState(isCasting) {
    const castBtn = document.getElementById('fullscreen-toggle');
    if (castBtn) {
      castBtn.textContent = isCasting ? '📺 Stop Cast' : '📺 Cast';
      castBtn.style.background = isCasting ? '#d32f2f' : '';
    }
  }

  function setupLyricsControls(song) {
    const decreaseFontBtn = document.getElementById('decrease-font');
    const increaseFontBtn = document.getElementById('increase-font');
    const fontSizeDisplay = document.getElementById('font-size-display');
    const exportPdfBtn = document.getElementById('export-pdf');
    const castBtn = document.getElementById('fullscreen-toggle');
    const lyricsContent = document.getElementById('lyrics-content');

    // Font size controls
    decreaseFontBtn.addEventListener('click', () => {
      if (currentFontSize > 10) {
        currentFontSize -= 2;
        lyricsContent.style.fontSize = `${currentFontSize}px`;
        fontSizeDisplay.textContent = `${currentFontSize}px`;
        saveFontSize();
      }
    });

    increaseFontBtn.addEventListener('click', () => {
      if (currentFontSize < 32) {
        currentFontSize += 2;
        lyricsContent.style.fontSize = `${currentFontSize}px`;
        fontSizeDisplay.textContent = `${currentFontSize}px`;
        saveFontSize();
      }
    });

    // PDF Export
    exportPdfBtn.addEventListener('click', () => exportToPDF(song));

    // Cast toggle
    castBtn.addEventListener('click', () => toggleCast());
    
    // Update cast window if it exists and song changes
    if (window.castWindow && !window.castWindow.closed) {
      window.castWindow.postMessage({
        type: 'updateSong',
        song: song
      }, '*');
    }
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