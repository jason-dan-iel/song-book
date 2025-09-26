document.addEventListener('DOMContentLoaded', () => {

  /* === CONFIG & CONSTANTS (NEW) === */
  const LS_KEYS = {
    font: 'songbook-font-size',
    pdfFont: 'songbook-pdf-font-size',
    cat: 'songbook-last-category',
    search: 'songbook-last-search',
    installDismiss: 'pwa-install-dismissed',
    iosHint: 'iosHint'
  };
  const FONT_MIN = 10;
  const FONT_MAX = 40;
  const PDF_FONT_MIN = 8;
  const PDF_FONT_MAX = 60;
  const PREFETCH_COUNT = 8;

  // Polyfill for requestIdleCallback (some browsers / Safari)
  if (typeof window.requestIdleCallback !== 'function') {
    window.requestIdleCallback = function (cb) {
      return setTimeout(() => cb({ timeRemaining: () => 0, didTimeout: false }), 1);
    };
    window.cancelIdleCallback = function (id) { clearTimeout(id); };
  }

  // Helpers that were referenced later but missing (added to prevent ReferenceErrors)
  function saveNumber(key, val) {
    try { localStorage.setItem(key, String(val)); } catch (e) { /* ignore quota */ }
  }
  function loadFontSize() {
    try {
      const saved = localStorage.getItem(LS_KEYS.font);
      if (saved) {
        const n = parseInt(saved, 10);
        if (Number.isFinite(n) && n >= FONT_MIN && n <= FONT_MAX) {
          currentFontSize = n; // defined later; function called after declaration
        }
      }
    } catch (e) { /* ignore */ }
  }

  // Device/network aware hints
  const conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  const deviceMemory = navigator.deviceMemory || 4;
  const isSlowNetwork = conn && (conn.saveData || /2g/.test(conn.effectiveType));

  // Cache DOM root references once
  const dom = {
    categorySelect: document.getElementById('category-select'),
    searchInput: document.getElementById('search'),
    songsList: document.getElementById('songs-list'),
    lyricsSection: document.getElementById('lyrics-section'),
    songTitle: document.getElementById('song-title'),
    songLyrics: document.getElementById('song-lyrics'),
    backBtn: document.getElementById('back-to-list'),
    controls: document.querySelector('.controls'),
    header: document.querySelector('header'),
    alphaIndex: document.getElementById('alpha-index'),
    alphaEN: document.getElementById('alpha-en'),
    alphaHI: document.getElementById('alpha-hi'),
  alphaClear: document.getElementById('alpha-clear'), // legacy (removed in new layout)
    alphaSelect: document.getElementById('alpha-select'),
    alphaClearCompact: document.getElementById('alpha-clear-compact'),
    resultCount: document.getElementById('result-count'),
    fuzzyToggle: document.getElementById('fuzzy-toggle'),
    jumpNumber: document.getElementById('jump-number')
  };


  // ===== PWA Setup START =====
  let deferredPrompt;

  function showInstallBanner() {
    if (localStorage.getItem('pwa-install-dismissed') === '1') return;
    const el = document.getElementById('pwa-install-banner');
    if (el) el.style.display = 'block';
  }
  function hideInstallBanner() {
    const el = document.getElementById('pwa-install-banner');
    if (el) el.style.display = 'none';
  }
  function showUpdateBanner() {
    const el = document.getElementById('app-update-banner');
    if (el) el.style.display = 'block';
  }
  function showOffline() {
    const el = document.getElementById('offline-indicator');
    if (el) el.style.display = 'block';
  }
  function hideOffline() {
    const el = document.getElementById('offline-indicator');
    if (el) el.style.display = 'none';
  }

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw && nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });
    }).catch(console.log);

    // Listen for data/update messages from service worker
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (!e.data || !e.data.type) return;
      switch (e.data.type) {
        case 'MANIFEST_UPDATED':
          if (!window.__manifestToastShown) {
            window.__manifestToastShown = true;
            showToast('Song list updated. Refresh to see new songs', 'info', 6000);
            setTimeout(()=>{ window.__manifestToastShown = false; }, 15000);
          }
          break;
        case 'SW_VERSION':
          // Hook available for future display / analytics
          break;
      }
    });
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });

  window.addEventListener('appinstalled', () => {
    hideInstallBanner();
    deferredPrompt = null;
  });

  document.getElementById('install-pwa')?.addEventListener('click', async () => {
    hideInstallBanner();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });

  document.getElementById('dismiss-install')?.addEventListener('click', () => {
    localStorage.setItem('pwa-install-dismissed', '1');
    hideInstallBanner();
  });

  document.getElementById('update-app')?.addEventListener('click', () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    setTimeout(() => location.reload(), 300);
  });

  // Network status
  window.addEventListener('online', hideOffline);
  window.addEventListener('offline', showOffline);
  if (!navigator.onLine) showOffline();

  // iOS standalone hint
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone;
  if (isIOS && !isStandalone && !localStorage.getItem('iosHint')) {
    setTimeout(() => {
      alert('Add to Home Screen: Tap Share → "Add to Home Screen" for full-screen experience.');
      localStorage.setItem('iosHint', '1');
    }, 2500);
  }
  // ===== PWA Setup END =====

  // ===== Your existing code (kept intact) =====
  const manifestUrl = 'lyrics/manifest.json';
  let allSongsMetadata = [];
  let filteredSongs = [];
  let categories = [];
  let currentCategory = 'all';
  let alphaFilter = '';
  let songCache = new Map();
  let loadingPromises = new Map();
  let currentFontSize = 16;
  let categoryOrder = []; // preserves original manifest order for All grouping
  // Lookup structure: legacyNumMap (original numeric fragments -> array of metas)
  let legacyNumMap = new Map();
  // PDF font size input removed; we'll base PDF export on currentFontSize.

  loadFontSize();

  fetch(manifestUrl)
    .then(r => r.json())
    .then(manifest => {
  categoryOrder = manifest.categories.map(c => c.name);
  categories = ['all', ...categoryOrder];
      dom.categorySelect.innerHTML = categories.map(c => `<option value="${c}">${c === 'all' ? 'All' : (c[0].toUpperCase()+c.slice(1))}</option>`).join('');
      // Flatten songs
      allSongsMetadata = [];
      legacyNumMap.clear();
      for (const cat of manifest.categories) {
        for (const song of cat.songs) {
          const idNum = (song.id.match(/(\d+)/) || [,''])[1] || '';
          const title = song.title || '';
          const meta = {
            ...song,
            category: cat.name,
            __numRaw: idNum, // original numeric (may contain leading zeros)
            __num: idNum.replace(/^0+/, ''),
            __titleLower: title.toLowerCase(),
            __idLower: song.id.toLowerCase()
          };
          allSongsMetadata.push(meta);
          if (meta.__num) {
            if (!legacyNumMap.has(meta.__num)) legacyNumMap.set(meta.__num, []);
            legacyNumMap.get(meta.__num).push(meta);
          }
        }
      }
      // Restore last category if available, else All
      try {
        const savedCat = localStorage.getItem(LS_KEYS.cat);
        currentCategory = (savedCat && categories.includes(savedCat)) ? savedCat : 'all';
      } catch { currentCategory = 'all'; }
      dom.categorySelect.value = currentCategory;
      // Restore last search if available
      try {
        const savedQ = localStorage.getItem(LS_KEYS.search) || '';
        dom.searchInput.value = savedQ;
      } catch { /* ignore */ }
      loadCategory(currentCategory);
      setupAlphaIndex();
      // Restore fuzzy preference
      try { const fz = localStorage.getItem('songbook-fuzzy'); if (fz === '1' && dom.fuzzyToggle) dom.fuzzyToggle.checked = true; } catch {}
      renderSongsList(true);
    })
    .catch(err => console.error('Error loading manifest:', err));

  /* === CATEGORY / SEARCH EVENTS (DEBOUNCED) === */
  dom.categorySelect.addEventListener('change', e => {
    currentCategory = e.target.value;
    saveNumber(LS_KEYS.cat, currentCategory);
    loadCategory(currentCategory);
    // Reset alpha filter when category changes
    alphaFilter = '';
    updateAlphaIndexVisibility();
    renderSongsList(true);
    dom.searchInput.value = '';
    localStorage.removeItem(LS_KEYS.search);
  });

  // Replace previous direct listener with debounce
  let searchTimer;
  dom.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      localStorage.setItem(LS_KEYS.search, dom.searchInput.value);
      renderSongsList(false);
      toggleClearButton();
    }, 160);
  });
  function toggleClearButton(){
    const btn = document.getElementById('clear-search');
    if (!btn) return;
    if (dom.searchInput.value) btn.style.display='inline-block'; else btn.style.display='none';
  }
  document.getElementById('clear-search')?.addEventListener('click', () => {
    dom.searchInput.value='';
    localStorage.removeItem(LS_KEYS.search);
    renderSongsList(false);
    toggleClearButton();
    showToast('Search cleared','good');
    dom.searchInput.focus();
  });
  toggleClearButton();

  // Keyboard shortcuts: '/' to focus search, ESC in search to clear
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        dom.searchInput.focus();
      }
    }
  });
  dom.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      dom.searchInput.value = '';
      localStorage.removeItem(LS_KEYS.search);
      renderSongsList(false);
    }
  });

  /* === LIST RENDER (OPTIMISED) === */
  let lastListSignature = '';
  function renderSongsList(isInitial) {
    const qRaw = dom.searchInput.value.trim();
    const q = qRaw.toLowerCase();
    let list = currentCategory === 'all' ? allSongsMetadata.slice() : allSongsMetadata.filter(s => s.category === currentCategory);
    // Sort with category precedence (manifest order) when showing All
    list.sort((a,b)=>{
      if (currentCategory === 'all') {
        const ai = categoryOrder.indexOf(a.category);
        const bi = categoryOrder.indexOf(b.category);
        if (ai !== bi) return ai - bi;
      }
      const an = parseInt(a.__num||'',10); const bn = parseInt(b.__num||'',10);
      if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
      if (Number.isFinite(an) && !Number.isFinite(bn)) return -1;
      if (!Number.isFinite(an) && Number.isFinite(bn)) return 1;
      return (a.title||'').localeCompare(b.title||'');
    });

    // Apply alphabet filter if any (ignore leading punctuation/whitespace)
    if (alphaFilter) {
      const normStart = (str) => {
        if (!str) return '';
        // Remove leading whitespace and common punctuation/digits
        const trimmed = str.replace(/^[\s\-–—\.,;:!?'"()\[\]{}0-9]+/, '');
        return trimmed.charAt(0);
      };
      const target = alphaFilter;
      list = list.filter(s => normStart(s.title) === target);
    }

    if (q) {
      const numOnly = q.replace(/[^0-9]/g, '');
      if (numOnly.length > 0) {
        const stripped = numOnly.replace(/^0+/, '');
        list = list.filter(s => s.__num === stripped || s.__numRaw === numOnly || s.__num.startsWith(stripped));
      } else if (dom.fuzzyToggle && dom.fuzzyToggle.checked && q.length >= 2) {
        list = fuzzyFilter(list, q);
      } else {
        list = list.filter(s => s.__titleLower.includes(q) || s.__idLower.includes(q));
      }
    }
    filteredSongs = list;

    // Signature for diff avoidance
    const sig = q + '|' + currentCategory + '|' + alphaFilter + '|' + list.length;
    if (!isInitial && sig === lastListSignature) return;
    lastListSignature = sig;

    // Virtualization threshold
    const V_THRESHOLD = 1600;
    if (list.length > V_THRESHOLD) {
      // Virtual list with grouping headers
      const WINDOW = 400;
      const visible = list.slice(0, WINDOW);
      dom.songsList.innerHTML = '';
      const frag = document.createDocumentFragment();
      let lastCat = null;
      let dataIdx = 0;
      visible.forEach(s => {
        if (currentCategory === 'all' && s.category !== lastCat) {
          const h = document.createElement('li');
          h.textContent = s.category.replace(/(^|\s)([a-z])/g,(m,p1,p2)=>p1+p2.toUpperCase());
          h.className = 'group-header';
          frag.appendChild(h);
          lastCat = s.category;
        }
        const li = document.createElement('li');
        li.dataset.idx = dataIdx;
        const numLabel = s.__numRaw ? s.__numRaw : (s.__num || '');
        li.textContent = (numLabel ? (numLabel + '. ') : '') + s.title;
        frag.appendChild(li);
        dataIdx++;
      });
      dom.songsList.appendChild(frag);
      if (q && !q.match(/^(?:#|.*?\b)?\d{1,3}$/)) highlightMatches(dom.songsList, q);
      if (dom.resultCount) dom.resultCount.textContent = list.length + ' songs (showing first ' + WINDOW + ')';
    } else {
      // Progressive chunked render with grouping
      dom.songsList.innerHTML = '';
      const CHUNK = 300;
      let idx = 0; // index within list
      let dataIdx = 0; // index for dataset.idx
      let lastCat = null;
      function appendChunk() {
        if (idx >= list.length) return;
        const frag = document.createDocumentFragment();
        for (let c=0; c<CHUNK && idx<list.length; c++, idx++) {
          const s = list[idx];
            if (currentCategory === 'all' && s.category !== lastCat) {
              const h = document.createElement('li');
              h.textContent = s.category.replace(/(^|\s)([a-z])/g,(m,p1,p2)=>p1+p2.toUpperCase());
              h.className = 'group-header';
              frag.appendChild(h);
              lastCat = s.category;
            }
          const li = document.createElement('li');
          li.dataset.idx = dataIdx;
          const numLabel = s.__numRaw ? s.__numRaw : (s.__num || '');
          li.textContent = (numLabel ? (numLabel + '. ') : '') + s.title;
          frag.appendChild(li);
          dataIdx++;
        }
        dom.songsList.appendChild(frag);
        if (idx < list.length) {
          requestIdleCallback(appendChunk);
        } else if (q && !q.match(/^(?:#|.*?\b)?\d{1,3}$/)) {
          highlightMatches(dom.songsList, q);
        }
      }
      appendChunk();
      if (dom.resultCount) dom.resultCount.textContent = list.length ? (list.length + ' song' + (list.length===1?'':'s')) : 'No songs';
    }

    showList();
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
    }[c]));
  }

  function highlightMatches(root, term) {
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'ig');
    root.querySelectorAll('li').forEach(li => {
      if (li.classList.contains('group-header')) return;
      const textNode = Array.from(li.childNodes).find(n => n.nodeType === 3);
      if (textNode && regex.test(textNode.textContent)) {
        const span = document.createElement('span');
        span.innerHTML = textNode.textContent.replace(regex, m => `<mark>${m}</mark>`);
        li.replaceChild(span, textNode);
      }
    });
  }

  function loadCategory(cat) {
    if (cat === 'all') {
      filteredSongs = allSongsMetadata.slice();
    } else {
      filteredSongs = allSongsMetadata.filter(s => s.category === cat);
    }
    updateAlphaIndexVisibility();
  }

  /* === ALPHABET INDEX === */
  function setupAlphaIndex() {
    // Only dropdown now
    if (dom.alphaSelect) {
      populateAlphaSelect();
      dom.alphaSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        setAlphaFilter(val);
      });
    }
    dom.alphaClearCompact?.addEventListener('click', () => { setAlphaFilter(''); if (dom.alphaSelect) dom.alphaSelect.value=''; });
    updateAlphaIndexVisibility();
  }

  function updateAlphaIndexVisibility() {
    // Only need to repopulate dropdown based on category and maintain value
    if (!dom.alphaSelect) return;
    const prev = alphaFilter;
    populateAlphaSelect();
    dom.alphaSelect.value = prev;
  }

  function populateAlphaSelect() {
    if (!dom.alphaSelect) return;
    const enLetters = Array.from({length:26}, (_,i)=>String.fromCharCode(65+i));
    const hiLetters = 'अ आ इ ई उ ऊ ऋ ए ऐ ओ औ क ख ग घ च छ ज झ ट ठ ड ढ त थ द ध न प फ ब भ म य र ल व श ष स ह'.split(' ');
    const isEN = currentCategory === 'english';
    const isHI = currentCategory === 'hindi';
    const isAll = currentCategory === 'all';
    dom.alphaSelect.innerHTML = '<option value="">All letters</option>';
    if (isAll) {
      const ogEn = document.createElement('optgroup'); ogEn.label = 'English';
      enLetters.forEach(ch => {
        const o = document.createElement('option'); o.value = ch; o.textContent = ch; ogEn.appendChild(o);
      });
      const ogHi = document.createElement('optgroup'); ogHi.label = 'Hindi';
      hiLetters.forEach(ch => {
        const o = document.createElement('option'); o.value = ch; o.textContent = ch; ogHi.appendChild(o);
      });
      dom.alphaSelect.appendChild(ogEn);
      dom.alphaSelect.appendChild(ogHi);
    } else if (isEN) {
      enLetters.forEach(ch => {
        const o = document.createElement('option'); o.value = ch; o.textContent = ch; dom.alphaSelect.appendChild(o);
      });
    } else if (isHI) {
      hiLetters.forEach(ch => {
        const o = document.createElement('option'); o.value = ch; o.textContent = ch; dom.alphaSelect.appendChild(o);
      });
    }
  }

  function setAlphaFilter(ch) {
    alphaFilter = ch;
    // Update button active state
    updateAlphaIndexVisibility();
    renderSongsList(false);
  }

  /* === FUZZY SEARCH SUPPORT === */
  function fuzzyFilter(arr, term) {
    const maxDist = term.length <= 4 ? 1 : 2;
    return arr.filter(s => {
      if (s.__titleLower.includes(term) || s.__idLower.includes(term)) return true;
      const candidate = s.__titleLower.slice(0, Math.min(48, s.__titleLower.length));
      return levenshtein(term, candidate) <= maxDist;
    });
  }
  function levenshtein(a,b){
    const m=a.length,n=b.length; if(!m) return n; if(!n) return m;
    const dp=Array(n+1); for(let j=0;j<=n;j++) dp[j]=j;
    for(let i=1;i<=m;i++){ let prev=dp[0]; dp[0]=i; for(let j=1;j<=n;j++){ const tmp=dp[j]; dp[j]=a[i-1]===b[j-1]?prev:Math.min(prev+1, dp[j]+1, dp[j-1]+1); prev=tmp; }}
    return dp[n];
  }
  dom.fuzzyToggle?.addEventListener('change', ()=>{ try{localStorage.setItem('songbook-fuzzy', dom.fuzzyToggle.checked?'1':'0');}catch{} renderSongsList(false); showToast('Fuzzy ' + (dom.fuzzyToggle.checked?'on':'off'),'good'); });

  /* === JUMP TO NUMBER FEATURE === */
  dom.jumpNumber?.addEventListener('click', () => {
    const input = prompt('Enter song number');
    if (!input) return;
    const clean = input.trim().replace(/[^0-9]/g,'').replace(/^0+/, '');
    if (!clean) { showToast('Invalid number','warn'); return; }
    const target = getSongByNumeric(clean);
    if (target) {
      dom.searchInput.value = clean; // allows arrow nav to narrow list starting from number
      localStorage.setItem(LS_KEYS.search, clean);
      renderSongsList(false);
      keyboardIndex = 0;
      setTimeout(()=>updateKeyboardHighlight(), 40);
      showToast('Jumped to #' + clean,'good');
    } else {
      showToast('Song #' + clean + ' not found','err');
    }
  });

  function getSongByNumeric(numStr) {
    // Try raw (with leading zeros) and stripped variant
    const stripped = numStr.replace(/^0+/, '');
    // Direct raw bucket
    if (legacyNumMap.has(numStr)) {
      const list = legacyNumMap.get(numStr);
      if (currentCategory === 'all') return list[0];
      return list.find(m => m.category === currentCategory) || null;
    }
    if (legacyNumMap.has(stripped)) {
      const list = legacyNumMap.get(stripped);
      if (currentCategory === 'all') return list[0];
      return list.find(m => m.category === currentCategory) || null;
    }
    return null;
  }

  /* === TOASTS === */
  function showToast(msg, type='info', ttl=2400){
    const host = document.getElementById('toast-container');
    if(!host) return; const div=document.createElement('div');
    div.className='toast ' + (type==='info'?'':type);
    div.textContent=msg; host.appendChild(div);
    requestAnimationFrame(()=>div.classList.add('show'));
    setTimeout(()=>{ div.classList.remove('show'); setTimeout(()=>div.remove(), 600); }, ttl);
  }

  /* === SONG LOAD WITH BETTER ERROR HANDLING === */
  async function loadSongContent(meta) {
    if (!meta) throw new Error('No meta');
    if (songCache.has(meta.id)) return songCache.get(meta.id);
    if (loadingPromises.has(meta.id)) return loadingPromises.get(meta.id);
    const p = fetch(`lyrics/${meta.file}`)
      .then(r => { if (!r.ok) throw new Error('Song HTTP ' + r.status); return r.json(); })
      .then(song => {
        songCache.set(meta.id, song);
        loadingPromises.delete(meta.id);
        return song;
      })
      .catch(e => {
        loadingPromises.delete(meta.id);
        throw e;
      });
    loadingPromises.set(meta.id, p);
    return p;
  }

  /* === EVENT DELEGATION FOR SONG CLICK === */
  dom.songsList.addEventListener('click', async e => {
    const li = e.target.closest('li');
    if (!li) return;
    if (!('idx' in li.dataset)) return; // group header
    const idx = +li.dataset.idx;
    const meta = filteredSongs[idx];
    showLoadingState();
    try {
      const song = await loadSongContent(meta);
      showSong(song);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      history.pushState({ song, category: currentCategory }, '', '');
    } catch {
      showErrorState();
    }
  });

  dom.backBtn.addEventListener('click', () => {
    showList();
    history.pushState({}, '', '');
  });

  window.addEventListener('popstate', async e => {
    if (e.state?.song) {
      const meta = e.state.song;
      if (songCache.has(meta.id)) {
        showSong(songCache.get(meta.id));
      } else {
        showLoadingState();
        try {
          const s = await loadSongContent(meta);
          showSong(s);
        } catch {
          showList();
        }
      }
    } else {
      showList();
    }
  });

  /* === SHOW SONG (injects once & wires controls) === */
  function showSong(song) {
    dom.songTitle.textContent = song.title;
    // Build controls + content, then mount controls in sticky topbar and content in lyrics area
    const ui = buildLyricsUI(song);
    const temp = document.createElement('div');
    temp.innerHTML = ui;
    const controlsEl = temp.querySelector('.lyrics-controls');
    const contentEl = temp.querySelector('#lyrics-content');
    const topControlsHost = document.getElementById('lyrics-top-controls');
    if (topControlsHost) {
      topControlsHost.innerHTML = '';
      if (controlsEl) topControlsHost.appendChild(controlsEl);
    }
    dom.songLyrics.innerHTML = '';
    if (contentEl) dom.songLyrics.appendChild(contentEl);
    dom.lyricsSection.style.display = '';
    dom.songsList.style.display = 'none';
    dom.controls.style.display = 'none';
    // Re-sync header/body offset now that header height changed
    window.dispatchEvent(new Event('resize'));
    wireLyricsControls(song);
    setTimeout(() => dom.songTitle.focus(), 40);
    if (window.castWindow && !window.castWindow.closed) {
      window.castWindow.postMessage({ type: 'updateSong', song }, '*');
    }
    // Notify layout-dependent features (sticky chorus) to recompute
    document.dispatchEvent(new CustomEvent('song:loaded'));
  }

  function buildLyricsUI(song) {
    return `
      <div class="lyrics-controls">
        <div class="font-controls">
          <button id="dec-font" aria-label="Decrease font size">A-</button>
          <span id="font-size-display">${currentFontSize}px</span>
          <button id="inc-font" aria-label="Increase font size">A+</button>
        </div>
        <div class="action-controls">
          <button id="export-pdf" type="button">📄 PDF</button>
          <button id="fullscreen-toggle" type="button">📺 Cast</button>
        </div>
      </div>
      <div id="lyrics-content" style="font-size:${currentFontSize}px">
        ${renderSections(song.sections)}
      </div>
    `;
  }

  function renderSections(sections) {
    if (!Array.isArray(sections)) return '';
    return sections.map(sec => {
      const cls = sec.type === 'chorus' ? 'section chorus'
        : sec.type === 'verse' ? 'section verse'
        : 'section';
      const label = sec.label ? `<strong>${escapeHTML(sec.label)}</strong>` : '';
      const lines = (sec.lines || []).map(l => `${escapeHTML(l)}<br>`).join('');
      return `<div class="${cls}">${label}${lines}</div>`;
    }).join('');
  }

  /* === FONT + PDF CONTROLS (NO DUPLICATE LISTENERS) === */
  function wireLyricsControls(song) {
    const area = document.getElementById('lyrics-content');
    const disp = document.getElementById('font-size-display');

    document.getElementById('dec-font').onclick = () => {
      if (currentFontSize > FONT_MIN) {
        currentFontSize -= 2;
        area.style.fontSize = currentFontSize + 'px';
        disp.textContent = currentFontSize + 'px';
        saveNumber(LS_KEYS.font, currentFontSize);
      }
    };
    document.getElementById('inc-font').onclick = () => {
      if (currentFontSize < FONT_MAX) {
        currentFontSize += 2;
        area.style.fontSize = currentFontSize + 'px';
        disp.textContent = currentFontSize + 'px';
        saveNumber(LS_KEYS.font, currentFontSize);
      }
    };
    document.getElementById('export-pdf').onclick = () => exportToPDF(song);
    document.getElementById('fullscreen-toggle').onclick = () => {
      if (window.castWindow && !window.castWindow.closed) {
        window.castWindow.close();
        window.castWindow = null;
        updateCastButtonState(false);
      } else {
        openPresentationMode(song);
      }
    };
  }

  // Section highlighting logic removed for simplicity

  function exportToPDF(song) {
    try {
      const base = Math.max(PDF_FONT_MIN, Math.min(PDF_FONT_MAX, currentFontSize));
      const w = window.open('', '_blank');
      w.document.write(`<!DOCTYPE html><html><head><title>${escapeHTML(song.title)}</title>
        <meta charset="utf-8">
        <style>
          body{font:${base}px/1.55 Arial;margin:20px;color:#222;}
          h1{font-size:${Math.round(base*1.8)}px;margin:0 0 12px;border-bottom:2px solid #1976d2;padding-bottom:6px;color:#1976d2;}
          .section{margin:0 0 18px;page-break-inside:avoid;}
          .chorus{background:#f5faff;padding:12px;border-left:4px solid #1976d2;border-radius:4px;}
          strong{display:block;margin:0 0 10px 0;font-size:${Math.round(base*1.05)}px;color:#0d47a1;}
          #printBtn{margin:10px 0 18px;padding:6px 14px;background:#1976d2;color:#fff;border:none;border-radius:4px;cursor:pointer;}
          @media print{#printBtn{display:none}body{margin:10mm;}}
        </style></head><body>
        <h1>${escapeHTML(song.title)}</h1>
        <button id="printBtn" onclick="print()">Print / Save PDF</button>
        ${renderSections(song.sections)}
      </body></html>`);
      w.document.close();
    } catch {
      alert('PDF export failed');
    }
  }

  /* === CAST (CLEANED) === */
  function openPresentationMode(song) {
    const html = buildCastHTML(song);
    const w = window.open('', 'songCast', 'width=1600,height=900');
    if (!w) { alert('Popup blocked'); return; }
    w.document.write(html);
    w.document.close();
    window.castWindow = w;
    updateCastButtonState(true);
  }

  function updateCastButtonState(on) {
    const btn = document.getElementById('fullscreen-toggle');
    if (!btn) return;
    btn.textContent = on ? '📺 Stop Cast' : '📺 Cast';
    btn.classList.toggle('casting', !!on);
  }

  function buildCastHTML(song) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>${escapeHTML(song.title)}</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        html,body{margin:0;height:100%}
        body{font:26px/1.5 "Times New Roman", Times, serif; background:#fff; color:#000}
        header{border-bottom:2px solid #000;padding:6px 10px;position:fixed;top:0;left:0;right:0;background:#fff;z-index:5}
        main{max-width:1100px;margin:0 auto;padding:14px;padding-top:60px}
        h1{margin:6px 0 20px 0;font-size:42px;text-align:center}
        #c{max-width: 68ch; margin: 0 auto;}
        .section{margin:0 0 18px;padding:8px;border-left:4px solid #000}
        .section.chorus{background:#ffffcc;border-left-color:#cc9900}
        strong{display:block;margin:0 0 10px 0;font-size:.6em;font-weight:bold;text-transform:uppercase}
      </style></head><body>
      <header><button id="closeCast" aria-label="Close cast window" style="float:right;border:1px solid #000;background:#fff;color:#000;padding:4px 8px;cursor:pointer">Close</button></header>
      <main>
        <h1 id="t">${escapeHTML(song.title)}</h1>
        <div id="c">${renderSections(song.sections)}</div>
      </main>
      <script>
        document.getElementById('closeCast').addEventListener('click',()=>window.close());
        // Sticky chorus offset & header padding
        (function(){
          const hdr=document.querySelector('header');
          const mainEl=document.querySelector('main');
          const dyn=document.createElement('style'); dyn.id='dyn'; document.head.appendChild(dyn);
          function sync(){
            const h=hdr.offsetHeight||56;
            mainEl.style.paddingTop=(h+8)+'px';
            dyn.textContent = '.section.chorus{position:sticky; top:'+(h+4)+'px}';
          }
          window.addEventListener('resize',sync);
          setTimeout(sync,0);
        })();
        window.addEventListener('message',e=>{
          if(e.data.type==='updateSong'){
            document.getElementById('t').textContent=e.data.song.title;
            document.getElementById('c').innerHTML = (${renderSections.toString()})(e.data.song.sections);
            window.scrollTo({top:0,behavior:'smooth'});
          }
        });
        window.addEventListener('beforeunload',()=>{ if(window.opener && !window.opener.closed){ window.opener.postMessage({type:'castWindowClosed'},'*'); }});
      </script>
      </body></html>`;
  }

  /* === GENERIC UI HELPERS (UNCHANGED CORE) === */
  // Ensure state resets if the cast window is closed externally
  window.addEventListener('message', (e) => {
    if (e && e.data && e.data.type === 'castWindowClosed') {
      window.castWindow = null;
      updateCastButtonState(false);
    }
  });
  function showList() {
    dom.lyricsSection.style.display = 'none';
    dom.songsList.style.display = '';
    dom.controls.style.display = '';
    dom.songTitle.textContent = '';
    dom.songLyrics.innerHTML = '';
    // Re-sync header/body offset now that header height changed
    window.dispatchEvent(new Event('resize'));
  }
  function showLoadingState() {
    dom.songTitle.textContent = 'Loading...';
    dom.songLyrics.innerHTML = '<div style="padding:2rem;text-align:center;">Loading song...</div>';
    dom.lyricsSection.style.display = '';
    dom.songsList.style.display = 'none';
    dom.controls.style.display = 'none';
    // Re-sync header/body offset now that header height changed
    window.dispatchEvent(new Event('resize'));
  }
  function showErrorState() {
    dom.songTitle.textContent = 'Error';
    dom.songLyrics.innerHTML = '<div style="padding:2rem;text-align:center;color:#d32f2f;">Failed to load song.</div>';
  }

  function getCurrentSong() {
    const title = dom.songTitle.textContent;
    for (const [, s] of songCache) if (s.title === title) return s;
    return null;
  }

  /* === PREFETCH (ADAPTIVE) === */
  function prefetchLikely() {
    if (isSlowNetwork) return;
    const slice = filteredSongs.slice(0, Math.min(PREFETCH_COUNT, deviceMemory >= 6 ? 12 : PREFETCH_COUNT));
    slice.forEach(meta => {
      if (!songCache.has(meta.id)) {
        fetch(`lyrics/${meta.file}`).then(r => r.ok && r.json().then(j => songCache.set(meta.id, j))).catch(()=>{});
      }
    });
  }
  // Hook into list render
  const _origRender = renderSongsList;
  renderSongsList = function(first) {
    _origRender(first);
    requestIdleCallback(prefetchLikely);
  };

  /* === INITIAL POPULAR PRELOAD LATER (kept) === */
  setTimeout(() => {
    ['eng-001','hin-001'].forEach(id => {
      const meta = allSongsMetadata.find(s => s.id === id);
      if (meta) loadSongContent(meta).catch(()=>{});
    });
  }, 1600);

  /* === KEYBOARD NAV (KEEP, MINOR SAFETY) === */
  let keyboardIndex = -1;
  dom.searchInput.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); }
  });
  dom.songsList.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1); }
    else if (e.key === 'Enter' && keyboardIndex >= 0) {
      dom.songsList.querySelector(`li[data-idx="${keyboardIndex}"]`)?.click();
    } else if (e.key === 'Escape') {
      dom.searchInput.focus();
    }
  });

  function moveSelection(d) {
    if (!filteredSongs.length) return;
    keyboardIndex = (keyboardIndex + d + filteredSongs.length) % filteredSongs.length;
    updateKeyboardHighlight();
  }
  function updateKeyboardHighlight() {
    dom.songsList.querySelectorAll('li').forEach(li => {
      li.classList.remove('active-key');
      li.removeAttribute('aria-selected');
    });
    const target = dom.songsList.querySelector(`li[data-idx="${keyboardIndex}"]`);
    if (target) {
      target.classList.add('active-key');
      target.setAttribute('aria-selected', 'true');
      target.scrollIntoView({ block: 'nearest' });
      dom.songsList.tabIndex = 0;
      dom.songsList.focus({ preventScroll: true });
    }
  }

  /* === DYNAMIC STYLE INJECTION (UNCHANGED) === */
  (function ensureDynamicStyles() {
    if (document.getElementById('dynamic-songbook-style')) return;
    const style = document.createElement('style');
    style.id = 'dynamic-songbook-style';
    style.textContent = `
      #songs-list li.active-key { background:#000; color:#fff; }
      #songs-list li mark { background:#ffeb3b; color:#000; padding:0 2px; }
      @media (prefers-reduced-motion: reduce){ *{scroll-behavior:auto !important;} }
      button.casting { background:#d32f2f !important; color:#fff !important; }
    `;
    document.head.appendChild(style);
  })();

  // Fixed header offset + sticky chorus top offset (main app)
  (function syncHeaderAndChorusSticky(){
    const hdr = dom.header;
    if (!hdr) return;
    const styleId = 'chorus-sticky-style';
    let st = document.getElementById(styleId);
    if (!st) { st = document.createElement('style'); st.id = styleId; document.head.appendChild(st); }
    let rafHandle = null;
    function sync(){
      if (rafHandle) cancelAnimationFrame(rafHandle);
      rafHandle = requestAnimationFrame(()=>{
        const h = hdr.offsetHeight || 80;
        document.body.style.paddingTop = h + 'px';
        const topbar = document.getElementById('lyrics-topbar');
        const tb = topbar ? topbar.offsetHeight : 0;
        // Add a small gap so chorus never visually collides with title/controls
        const chorusTop = h + tb + 4;
        // Make every chorus sticky; add box-shadow for separation. Rely on natural flow for multiple choruses.
        st.textContent = '#lyrics-topbar{position:sticky; top:' + h + 'px; background:#fff; z-index:600}' +
          ' .section.chorus{position:sticky; top:' + chorusTop + 'px; z-index:400; box-shadow:0 2px 4px rgba(0,0,0,0.08);}' ;
      });
    }
    window.addEventListener('resize', sync);
    // Run after fonts/layout
    setTimeout(sync, 0);
    // Re-sync on custom song load event
    document.addEventListener('song:loaded', sync);
    // Observe topbar size changes (font adjustments etc.)
    if ('ResizeObserver' in window) {
      const topbar = document.getElementById('lyrics-topbar');
      if (topbar) {
        const ro = new ResizeObserver(()=>sync());
        ro.observe(topbar);
      }
    }
  })();

}); // DOMContentLoaded end