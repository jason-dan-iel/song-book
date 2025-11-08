# Song Addition Guide
# ====================

## Quick Start

1. Create a text file with your song lyrics (see format below)
2. Run: `python3 add_song.py your-song.txt`
3. Done! The song is automatically added to your project

## Text File Format

```
CATEGORY: hindi or english
TITLE: Your Song Title Here

STANZA 1:
First line of verse 1
Second line of verse 1
Third line of verse 1

CHORUS:
First line of chorus
Second line of chorus

STANZA 2:
First line of verse 2
Second line of verse 2

STANZA 3:
And so on...
```

## Important Rules

1. **CATEGORY** must be first line (hindi or english)
2. **TITLE** must be second line
3. Use **STANZA X:** for verses (X = 1, 2, 3, etc.)
4. Use **CHORUS:** for chorus sections
5. Leave blank lines between sections
6. Each lyrics line goes on its own line
7. **Save with UTF-8 encoding** (important for Hindi text!)

## Examples Provided

- `sample-song.txt` - Hindi song example
- `sample-english-song.txt` - English song example

## What the Script Does Automatically

✓ Assigns the next available song number
✓ Creates HTML file with proper formatting
✓ Adds Apple-inspired styling
✓ Includes font controls and PDF export
✓ Creates title bar with Previous/Next navigation
✓ Adds the song to the listing page (HTML list)
✓ Updates the JavaScript songs array
✓ Updates the song count on main index.html
✓ Creates sticky chorus sections
✓ Adds localStorage font persistence

## Usage Examples

### Add a Hindi song:
```bash
python3 add_song.py my-hindi-song.txt
```

### Add an English song:
```bash
python3 add_song.py my-english-song.txt
```

### Test with the sample:
```bash
python3 add_song.py sample-song.txt
```

## Output

The script will:
1. Parse your text file
2. Create `hindi/hin-XXX.html` or `english/eng-XXX.html`
3. Update the listing page
4. Update the main index
5. Show success message with file location

## Tips

1. **For Hindi songs**: Make sure your text editor supports UTF-8 and Hindi fonts
2. **Multiple chorus**: You can have multiple CHORUS sections
3. **Stanza numbering**: Can use any number (STANZA 1, STANZA 2, etc.)
4. **Line breaks**: Each line in your text file becomes a line in the song
5. **Spacing**: Blank lines between sections are ignored (cleaned automatically)

## Troubleshooting

**Problem**: Hindi text shows as ???
**Solution**: Save your text file with UTF-8 encoding

**Problem**: Song not added to listing
**Solution**: Make sure hindi/index.html or english/index.html exists

**Problem**: Script crashes
**Solution**: Check that CATEGORY and TITLE are on the first two lines

## After Adding a Song

1. Open your browser
2. Navigate to the listing page (hindi/index.html or english/index.html)
3. Your new song will be at the bottom of the list
4. Click to view it!

## File Naming Convention

- Hindi songs: `hin-001.html`, `hin-002.html`, etc.
- English songs: `eng-001.html`, `eng-002.html`, etc.
- Numbers are auto-incremented based on existing files

## Need Help?

Check the sample files:
- `sample-song.txt` - See the format
- Run the script on the sample to see how it works
- Compare the output with existing song files

---

Happy song adding! 🎵
