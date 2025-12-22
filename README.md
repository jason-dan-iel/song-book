# Shared CSS & JavaScript Files

This folder contains **optional** common CSS and JavaScript files extracted from the current inline code in your Song Book App. These files are provided as **reference** and can be used if you decide to move from inline styles/scripts to external files.

## Current State

Your app currently uses **inline CSS and JavaScript** in each HTML file. This works perfectly and requires no changes.

## Files Provided

### CSS Files:

1. **`common.css`** - Song page styles (176 song pages)
   - All styles from song pages (eng-001.html, hin-001.html, etc.)
   - Includes fixed header, font controls, lyrics layout
   - Preserves duplicate line-height for exact compatibility

2. **`listing.css`** - Category listing page styles (3 listing pages)
   - Styles for english/index.html, hindi/index.html, youth camp/index.html
   - Search box, letter navigation, song list

3. **`index.css`** - Main landing page styles (1 main page)
   - Styles for root index.html
   - Simple category list layout

### JavaScript Files:

1. **`font-control.js`** - Font size management
   - Used in all pages (song + listing)
   - localStorage persistence
   - updateFontSize() and exportToPDF() functions

2. **`listing.js`** - Listing page functionality
   - Search, filter, letter navigation
   - Used in category listing pages
   - Requires 'songs' array to be defined first

## How to Use (Optional)

If you want to switch from inline to external files:

### For Song Pages:

**Replace this:**
```html
<style>
  /* 150 lines of CSS */
</style>
<script>
  /* 70 lines of JavaScript */
</script>
```

**With this:**
```html
<link rel="stylesheet" href="../css/common.css">
<script src="../js/font-control.js"></script>
```

### For Listing Pages:

**Replace this:**
```html
<style>
  /* 120 lines of CSS */
</style>
<script>
  const songs = [...]; // Keep this inline!
  /* 130 lines of JavaScript */
</script>
```

**With this:**
```html
<link rel="stylesheet" href="../css/listing.css">
<script>
  const songs = [...]; // Songs array stays inline
</script>
<script src="../js/font-control.js"></script>
<script src="../js/listing.js"></script>
```

### For Main Index:

**Replace this:**
```html
<style>
  /* 60 lines of CSS */
</style>
```

**With this:**
```html
<link rel="stylesheet" href="../css/index.css">
```

## Benefits of External Files

If you choose to use external files:

✅ **Easier maintenance** - Change style in one place  
✅ **Browser caching** - CSS/JS loaded once, cached across pages  
✅ **Smaller HTML files** - 8KB → 1.5KB per song page  
✅ **Faster page loads** - After first page (cached assets)  

## Keeping Inline (Current Approach)

Your current inline approach is also perfectly valid:

✅ **Works great** - No external dependencies  
✅ **Self-contained** - Each file standalone  
✅ **Simple deployment** - No asset management  
✅ **Zero configuration** - Works immediately  

## Compatibility Notes

These files are **100% compatible** with your current inline code:

- Preserves all functionality
- Same class names and IDs
- Same JavaScript functions
- Even preserves the duplicate line-height on line 107-108 of song pages
- No changes needed to HTML structure

## Your Choice

**Keep inline** (current): Simple, works great, no changes needed  
**Use external**: Easier maintenance, better caching, smaller files  

Both approaches are valid! The shared files are here if you want them.

## Testing

If you decide to use external files:

1. Start with one song page as a test
2. Replace inline CSS/JS with external links
3. Verify functionality works identically
4. If good, apply to more pages
5. Can automate with a script if needed

---

**Note**: The `add_song.py` script currently generates inline CSS/JS (your preference). If you switch to external files, you would need to update the script templates accordingly.

