# Song Book App - Brethren Assembly Jodhpur

A beautiful, Apple-inspired web application for browsing and displaying song lyrics from the Brethren Assembly Jodhpur songbook collection.

## ✨ Features

- **Apple-Inspired Design**: Clean, minimalist interface with SF Pro font family
- **140 Total Pages**: 1 main page + 2 listing pages + 137 song pages
- **Smart Search**: Real-time search and filtering on listing pages
- **Letter Navigation**: Quick jump to songs by first letter
- **Font Controls**: Adjustable font size (12-32px) with localStorage persistence
- **PDF Export**: One-click export to PDF for any song
- **Sticky Chorus**: Chorus sections stick to top while scrolling (no gaps!)
- **Navigation**: Integrated title bar with Previous/Next buttons
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **No Dependencies**: Pure HTML, CSS, and JavaScript

## 🚀 Quick Start

### Running the App

1. **Simple HTTP Server**:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   ```

2. **Open in Browser**:
   Navigate to `http://localhost:8000`

### Features Guide

- **Main Page**: Choose between English (2 songs) or Hindi (135 songs)
- **Listing Pages**: Search by title/number, filter by letter, or browse all songs
- **Song Pages**: Adjust font size, export to PDF, navigate with Previous/Next buttons
- **Font Persistence**: Your font size preference is saved across all songs

## 📁 File Structure

```
song-book-app/
├── index.html                      # Main landing page
├── hindi/
│   ├── index.html                 # Hindi songs listing (135 songs)
│   └── hin-001.html to hin-135.html
├── english/
│   ├── index.html                 # English songs listing (2 songs)
│   └── eng-001.html, eng-002.html
├── PROJECT_SUMMARY.md             # Detailed technical documentation
└── README.md                       # This file
```

## 🎨 Design System

### Apple-Inspired Aesthetic
- **Font**: SF Pro / San Francisco system font stack
- **Colors**: 
  - Primary: `#1d1d1f`
  - Secondary: `#6e6e73`
  - Links: `#0066cc`
  - Background: `#fbfbfd`
  - Chorus: `#fff9e6` (yellow)
- **Spacing**: Generous whitespace with 16-24px padding
- **Animations**: Smooth 0.2s transitions
- **Shadows**: Subtle depth with minimal shadows

## 🔧 Technical Details

### Song Page Components

1. **Back Button**: Returns to listing page
2. **Controls Bar**: Font size adjustment and PDF export
3. **Title Bar**: Integrated navigation with Previous/Next buttons
4. **Lyrics Container**: Scrollable (70vh) with white background
5. **Stanzas**: Individual padding, adjustable font size
6. **Chorus**: Sticky positioning, yellow background, no gaps

### JavaScript Features

- **Font Size Control**: Adjust between 12-32px
- **localStorage**: Saves font preference across sessions
- **PDF Export**: Uses window.print() for PDF generation
- **Search & Filter**: Real-time filtering on listing pages
- **Letter Navigation**: Quick access by first letter

## 📱 Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari (macOS, iOS)
- ✅ Mobile browsers (iOS Safari, Android Chrome)

## 🛠️ Customization

### To Add a New Song:

1. Create a new HTML file (e.g., `hin-136.html`)
2. Copy the structure from an existing song file
3. Update the song number, title, and lyrics
4. Update Previous/Next links
5. Add to the listing page HTML and JavaScript array
6. Update the song count on main index.html

### Utility Scripts Available:

- `verify_project.py` - Comprehensive project verification
- `cleanup_unused_css.py` - Remove unused styles
- `fix_chorus_final.py` - Fix chorus styling
- `remove_bottom_nav.py` - Remove bottom navigation

## 📖 Documentation

For complete technical documentation, see [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)

## ✅ Quality Assurance

All 137 song pages have been verified for:
- ✓ Apple-inspired design consistency
- ✓ Title bar with navigation
- ✓ Font controls with persistence
- ✓ PDF export functionality
- ✓ Sticky chorus with no gaps
- ✓ Clean, optimized CSS
- ✓ Mobile responsive layout

## 📝 License

This project is created for the Brethren Assembly Jodhpur community.

---

**Last Updated:** November 8, 2025  
**Status:** ✅ Production Ready  
**Tagline:** *Simple. Clean. Intuitive.*

## Data Format

Songs are stored in JSON format with the following structure:

```json
{
  "title": "Song Title",
  "artist": "Artist Name (optional)",
  "category": "english|hindi|youth_camp|special",
  "sections": [
    {
      "type": "verse|chorus|bridge",
      "label": "Verse 1",
      "lines": ["Line 1", "Line 2", "..."]
    }
  ],
  "file": "category-number.json"
}
```

## Customization

- **Styling**: Modify `src/css/styles.css` for visual customization
- **Functionality**: Update `src/js/main.js` for feature changes
- **Songs**: Add new songs to the appropriate category file in `lyrics/` (e.g., `hindi-songs.json`, `english-songs.json`, etc.)

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## Development

To add new songs or modify existing ones:

1. Edit the appropriate file in `lyrics/` (e.g., `hindi-songs.json`, `english-songs.json`, etc.)
2. Refresh the browser to see changes
3. Use the data cleanup script if needed: `node clean-data.js`

## Static Site Generation

To generate/regenerate the static HTML version:

```bash
python3 generate_static_site.py
```

This will:
- Read all songs from the `lyrics/` directory
- Generate individual HTML files for each song with embedded CSS
- Create category index pages
- Create the main index page
- Output everything to the `static/` directory

### Viewing the Static Site

```bash
cd static
python3 -m http.server 8000
```

Then open: http://localhost:8000

The static version is perfect for:
- Deployment to simple web hosting
- Offline usage (save to USB drive, etc.)
- Printing song lyrics
- Archival purposes
- Environments without JavaScript support

See `static/README.md` for more details about the static version.

## License

This project is created for the Brethren Assembly Jodhpur community.