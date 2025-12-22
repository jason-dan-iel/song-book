/**
 * Listing Page Module - Song Book App
 * Search, filter, and navigation functionality for song listing pages
 * This file contains the exact JavaScript currently inline in all listing pages.
 * 
 * Features:
 * - Real-time search by title or song number
 * - Letter navigation (quick jump)
 * - Enter key to jump directly to song number
 * - Reset button to clear search
 * 
 * Prerequisites:
 * - A 'songs' array must be defined before this script loads
 * - Each song object: {num: number, title: string, file: string}
 * - HTML elements: #song-list, #search-box, #reset-btn, #letter-nav
 */

/**
 * Display filtered list of songs
 * @param {Array} songsToShow - Array of song objects to display
 */
function displaySongs(songsToShow) {
  const list = document.getElementById('song-list');
  list.innerHTML = '';
  songsToShow.forEach(song => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${song.file}">${song.num} - ${song.title}</a>`;
    list.appendChild(li);
  });
}

/**
 * Generate letter navigation buttons
 * Creates buttons for each unique first letter in song titles
 */
function generateLetterNav() {
  const letters = new Set();
  songs.forEach(song => {
    const firstChar = song.title.charAt(0);
    letters.add(firstChar);
  });
  
  const nav = document.getElementById('letter-nav');
  Array.from(letters).sort().forEach(letter => {
    const btn = document.createElement('button');
    btn.textContent = letter;
    btn.onclick = () => filterByLetter(letter);
    nav.appendChild(btn);
  });
}

/**
 * Filter songs by first letter
 * @param {string} letter - The letter to filter by
 */
function filterByLetter(letter) {
  const filtered = songs.filter(song => song.title.startsWith(letter));
  displaySongs(filtered);
}

// Search box - real-time filtering
const searchBox = document.getElementById('search-box');
searchBox.addEventListener('input', function() {
  const query = this.value.toLowerCase();
  const filtered = songs.filter(song => 
    song.title.toLowerCase().includes(query) || 
    song.num.toString().includes(query)
  );
  displaySongs(filtered);
});

// Search box - Enter key to jump to song number
// NOTE: The max song number check uses songs.length, but should be customized per category
searchBox.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    const query = this.value.trim();
    const songNum = parseInt(query);
    if (!isNaN(songNum) && songNum >= 1 && songNum <= songs.length) {
      // This assumes file prefix - needs to be set per page
      // For English: 'eng', Hindi: 'hin', Youth Camp: 'yth'
      const prefix = getFilePrefix(); // Helper function defined below
      window.location.href = `${prefix}-${String(songNum).padStart(3, '0')}.html`;
    }
  }
});

// Reset button - clear search and show all songs
const resetBtn = document.getElementById('reset-btn');
resetBtn.addEventListener('click', function() {
  searchBox.value = '';
  displaySongs(songs);
});

// Initialize letter navigation on load
generateLetterNav();

/**
 * Helper function to determine file prefix based on current page
 * This needs to be customized for each listing page
 * @returns {string} File prefix ('eng', 'hin', or 'yth')
 */
function getFilePrefix() {
  // Detect from current URL
  const path = window.location.pathname;
  if (path.includes('english')) return 'eng';
  if (path.includes('hindi')) return 'hin';
  if (path.includes('youth')) return 'yth';
  return 'unk'; // Unknown/fallback
}

