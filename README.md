# Song Book App - Brethren Assembly Jodhpur

A beautiful, responsive web application for browsing and displaying song lyrics from the Brethren Assembly Jodhpur songbook collection.

## Features

- **Multiple Songbook Support**: English, Hindi, Youth Camp, and Special songs
- **Smart Search**: Search by song title, number, or lyrics content
- **Category Filtering**: Filter songs by songbook type
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Beautiful UI**: Modern design with smooth animations and gradients
- **Browser History**: Navigate back/forward through songs using browser buttons
- **Deep Linking**: Share direct links to specific songs

## How to Use

### Running the App

1. **Simple HTTP Server** (Recommended):
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   ```

2. **Open in Browser**:
   Navigate to `http://localhost:8000`

### Features Guide

- **Browse Songs**: All songs are displayed in a clean list format
- **Search**: Use the search box to find songs by title, number, or lyrics
- **Filter**: Select a songbook category from the dropdown
- **View Lyrics**: Click on any song to view its complete lyrics
- **Navigate**: Use the "Back to Songs" button or browser back/forward buttons

## File Structure

```
song-book-app/
├── index.html              # Main HTML file
├── src/
│   ├── css/
│   │   └── styles.css      # All styling and responsive design
│   └── js/
│       └── main.js         # Core functionality
├── lyrics/
│   ├── all-songs.json      # Complete song database
│   └── manifest.json       # File manifest
└── README.md               # This file
```

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
- **Songs**: Add new songs to `lyrics/all-songs.json`

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## Development

To add new songs or modify existing ones:

1. Edit `lyrics/all-songs.json`
2. Refresh the browser to see changes
3. Use the data cleanup script if needed: `node clean-data.js`

## License

This project is created for the Brethren Assembly Jodhpur community.