/**
 * Font Control Module - Song Book App
 * Unified font size management across all pages with localStorage persistence
 * This file contains the exact JavaScript currently inline in all song and listing pages.
 * 
 * Features:
 * - Adjustable font size (12-32px)
 * - Persists across pages via localStorage
 * - Global key 'globalFontSize' shared across all pages
 */

// Font size configuration
let currentFontSize = parseInt(localStorage.getItem('globalFontSize')) || 17;
const minSize = 12;
const maxSize = 32;

/**
 * Apply saved font size on page load
 * This runs when the DOM is ready
 */
window.addEventListener('DOMContentLoaded', function() {
  document.body.style.setProperty('font-size', currentFontSize + 'px', 'important');
  
  const display = document.getElementById('font-size-display');
  if (display) {
    display.textContent = currentFontSize + 'px';
  }
});

/**
 * Update font size up or down
 * @param {number} change - Amount to change font size (+1 or -1)
 */
function updateFontSize(change) {
  currentFontSize += change;
  if (currentFontSize < minSize) currentFontSize = minSize;
  if (currentFontSize > maxSize) currentFontSize = maxSize;
  
  // Save to localStorage with unified key
  localStorage.setItem('globalFontSize', currentFontSize);
  
  // Update body font size with !important to override CSS
  document.body.style.setProperty('font-size', currentFontSize + 'px', 'important');
  
  const display = document.getElementById('font-size-display');
  if (display) {
    display.textContent = currentFontSize + 'px';
  }
}

/**
 * Export current page to PDF
 * Uses browser's built-in print functionality
 */
function exportToPDF() {
  window.print();
}

