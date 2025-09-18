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
    header: document.querySelector('header')
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
  let currentCategory = '';
  let songCache = new Map();
  let loadingPromises = new Map();
  let currentFontSize = 16;
  // PDF font size input removed; we'll base PDF export on currentFontSize.

  loadFontSize();

  fetch(manifestUrl)
    .then(r => r.json())
    .then(manifest => {
      categories = manifest.categories.map(c => c.name);
      dom.categorySelect.innerHTML = categories.map(c => `<option value="${c}">${c[0].toUpperCase()+c.slice(1)}</option>`).join('');
      allSongsMetadata = manifest.categories.flatMap(cat =>
        cat.songs.map(song => ({ ...song, category: cat.name }))
      );
      currentCategory = categories[0];
      loadCategory(currentCategory);
      renderSongsList();
    })
    .catch(err => console.error('Error loading manifest:', err));

  /* === CATEGORY / SEARCH EVENTS (DEBOUNCED) === */
  dom.categorySelect.addEventListener('change', e => {
    currentCategory = e.target.value;
    saveNumber(LS_KEYS.cat, currentCategory);
    loadCategory(currentCategory);
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
    }, 160);
  });

  /* === LIST RENDER (OPTIMISED) === */
  let lastListSignature = '';
  function renderSongsList(isInitial) {
    const q = dom.searchInput.value.trim().toLowerCase();
    let list = allSongsMetadata.filter(s => s.category === currentCategory);
    if (q) {
      list = list.filter(s => s.title.toLowerCase().includes(q));
    }
    filteredSongs = list;

    // Signature for diff avoidance
    const sig = q + '|' + currentCategory + '|' + list.length;
    if (!isInitial && sig === lastListSignature) return;
    lastListSignature = sig;

    // Build list markup once
    const frag = document.createDocumentFragment();
    list.forEach((s,i) => {
      const li = document.createElement('li');
      li.dataset.idx = i;
      // Bare list item title only (no numbering for minimal 90s look)
      li.textContent = s.title;
      frag.appendChild(li);
    });
    dom.songsList.innerHTML = '';
    dom.songsList.appendChild(frag);

    // Highlight search term (only after insertion)
    if (q) highlightMatches(dom.songsList, q);

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
      const textNode = Array.from(li.childNodes).find(n => n.nodeType === 3);
      if (textNode && regex.test(textNode.textContent)) {
        const span = document.createElement('span');
        span.innerHTML = textNode.textContent.replace(regex, m => `<mark>${m}</mark>`);
        li.replaceChild(span, textNode);
      }
    });
  }

  function loadCategory(cat) {
    filteredSongs = allSongsMetadata.filter(s => s.category === cat);
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
    function sync(){
      const h = hdr.offsetHeight || 80;
      document.body.style.paddingTop = h + 'px';
      const topbar = document.getElementById('lyrics-topbar');
      const tb = topbar ? topbar.offsetHeight : 0;
      const chorusTop = h + tb; // stick chorus below the topbar
      st.textContent = '#lyrics-topbar{position:sticky; top:' + h + 'px; background:#fff; z-index:500} .section.chorus{position:sticky; top:' + chorusTop + 'px}';
    }
    window.addEventListener('resize', sync);
    // Run after fonts/layout
    setTimeout(sync, 0);
  })();

}); // DOMContentLoaded end