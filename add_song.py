#!/usr/bin/env python3
"""
Song HTML Generator
===================
This script converts a specially formatted text file into an HTML song page
and automatically adds it to the appropriate listing page.

Text File Format:
-----------------
CATEGORY: hindi or english
TITLE: Song title here

STANZA 1:
Line 1 of verse
Line 2 of verse
...

CHORUS:
Line 1 of chorus
Line 2 of chorus

STANZA 2:
...

Usage:
------
python3 add_song.py your-song-file.txt
"""

import os
import re
import sys
from datetime import datetime

def read_song_file(filepath):
    """Parse the text file and extract song information"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract category and title
    category_match = re.search(r'CATEGORY:\s*(\w+)', content, re.IGNORECASE)
    title_match = re.search(r'TITLE:\s*(.+)', content)
    
    if not category_match or not title_match:
        raise ValueError("Text file must have CATEGORY and TITLE at the beginning")
    
    category = category_match.group(1).lower()
    title = title_match.group(1).strip()
    
    if category not in ['hindi', 'english']:
        raise ValueError("CATEGORY must be either 'hindi' or 'english'")
    
    # Extract sections (stanzas and chorus)
    sections = []
    
    # Find all STANZA and CHORUS sections
    pattern = r'(STANZA\s+\d+|CHORUS):\s*\n((?:(?!STANZA|CHORUS|CATEGORY|TITLE).+\n?)*)'
    matches = re.finditer(pattern, content, re.MULTILINE | re.IGNORECASE)
    
    for match in matches:
        section_type = match.group(1).strip()
        section_text = match.group(2).strip()
        
        if section_text:
            lines = [line.strip() for line in section_text.split('\n') if line.strip()]
            
            # Determine if it's a chorus
            is_chorus = 'CHORUS' in section_type.upper()
            
            # Extract just the number from "STANZA 1" format
            if not is_chorus:
                number_match = re.search(r'\d+', section_type)
                stanza_number = number_match.group(0) if number_match else section_type
                label = stanza_number
            else:
                label = 'कोरस' if category == 'hindi' else 'Chorus'
            
            sections.append({
                'type': 'chorus' if is_chorus else 'stanza',
                'label': label,
                'lines': lines
            })
    
    return {
        'category': category,
        'title': title,
        'sections': sections
    }

def get_next_song_number(category):
    """Determine the next available song number"""
    dir_path = category
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
    
    prefix = 'hin' if category == 'hindi' else 'eng'
    
    # Find all existing song files
    existing_files = [f for f in os.listdir(dir_path) if f.startswith(f"{prefix}-") and f.endswith('.html')]
    
    if not existing_files:
        return 1
    
    # Extract numbers
    numbers = []
    for f in existing_files:
        match = re.search(r'-(\d+)\.html', f)
        if match:
            numbers.append(int(match.group(1)))
    
    return max(numbers) + 1 if numbers else 1

def generate_html(song_data, song_num, total_songs):
    """Generate HTML content for the song page"""
    
    category = song_data['category']
    title = song_data['title']
    sections = song_data['sections']
    
    # Determine file names for navigation
    prefix = 'hin' if category == 'hindi' else 'eng'
    
    # Previous/Next buttons (arrow-only style)
    prev_num = song_num - 1 if song_num > 1 else None
    next_num = song_num + 1 if song_num < total_songs else None
    
    prev_html = f'<a href="{prefix}-{prev_num:03d}.html" class="nav-btn">←</a>' if prev_num else '<span class="nav-btn disabled">←</span>'
    next_html = f'<a href="{prefix}-{next_num:03d}.html" class="nav-btn">→</a>' if next_num else '<span class="nav-btn disabled">→</span>'
    
    # Build sections HTML
    sections_html = []
    for section in sections:
        is_chorus = section['type'] == 'chorus'
        class_name = 'stanza chorus' if is_chorus else 'stanza'
        
        lines_html = '\n'.join(section['lines'])
        
        section_html = f'''<div class="{class_name}">
<div class="stanza-label"><b>{section['label']}</b></div>
{lines_html}
</div>'''
        sections_html.append(section_html)
    
    # Complete HTML template
    html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{song_num} - {title}</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}

body {{
  font-family: monospace;
  font-size: 16px;
  line-height: 1.4em;
  padding: 10px;
  max-width: 800px;
  margin: 0 auto;
  padding-top: 120px;
}}

.page-header {{
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fff;
  z-index: 100;
  margin: 0 auto;
  max-width: 800px;
  padding: 10px;
  border-bottom: 1px solid #000;
}}

.controls-row {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}}

.back-button a {{
  text-decoration: none;
}}

.title-row {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}}

.song-title-text {{
  text-align: center;
  flex: 1;
}}

.nav-btn {{
  padding: 2px 10px;
  text-decoration: none;
  border: 1px solid #000;
  text-align: center;
  min-width: 30px;
}}

.nav-btn.disabled {{
  border-color: #ccc;
  color: #ccc;
  cursor: default;
}}

.font-controls {{
  display: flex;
  align-items: center;
  gap: 5px;
}}

.font-btn {{
  padding: 2px 8px;
  border: 1px solid #000;
  background: none;
  cursor: pointer;
}}

.font-size-display {{
  min-width: 40px;
  text-align: center;
}}

.pdf-btn {{
  padding: 2px 8px;
  border: 1px solid #000;
  background: none;
  cursor: pointer;
}}

.lyrics-container {{
  padding: 0;
  padding-left: 2em;
  position: relative;
}}

.stanza {{
  margin-bottom: 1em;
  white-space: pre-line;
  line-height: 1.6;
}}

.stanza.chorus {{
  position: sticky;
  top: 90px;
  background: #fff;
  margin-left: 0;
  font-style: italic;
  padding: 0.5em;
  padding-bottom: 0.5em;
  margin-bottom: 1em;
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  z-index: 10;
}}

@media print {{
  .page-header {{ display: none; }}
  body {{ padding: 20px; }}
  .stanza {{ page-break-inside: avoid; }}
}}

@media (max-width: 768px) {{
  body {{ padding: 8px; padding-top: 140px; }}
  .page-header {{ padding: 8px; }}
  .controls-row {{ flex-wrap: wrap; gap: 5px; }}
  .title-row {{ gap: 5px; }}
  .song-title-text {{ 
    padding: 5px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }}
  .stanza.chorus {{
    top: 110px;
  }}
}}
</style>
</head>
<body>
<div class="page-header">
  <div class="controls-row">
    <div class="back-button">
      <a href="index.html">← Back</a>
    </div>
    <div class="font-controls">
      <button class="font-btn" onclick="updateFontSize(-1)" title="Decrease font size">A−</button>
      <span class="font-size-display" id="font-size-display">17px</span>
      <button class="font-btn" onclick="updateFontSize(1)" title="Increase font size">A+</button>
    </div>
    <button class="pdf-btn" onclick="exportToPDF()" title="Export to PDF">
      <span>📄</span>
      <span>PDF</span>
    </button>
  </div>
  <div class="title-row">
    {prev_html}
    <div class="song-title-text">{song_num} - {title}</div>
    {next_html}
  </div>
</div>

<div class="lyrics-container">
{chr(10).join(sections_html)}
</div>
<script>
// Unified font size management across all pages
let currentFontSize = parseInt(localStorage.getItem('globalFontSize')) || 17;
const minSize = 12;
const maxSize = 32;

// Apply saved font size on page load
window.addEventListener('DOMContentLoaded', function() {{
  document.body.style.setProperty('font-size', currentFontSize + 'px', 'important');
  
  const display = document.getElementById('font-size-display');
  if (display) {{
    display.textContent = currentFontSize + 'px';
  }}
}});

function updateFontSize(change) {{
  currentFontSize += change;
  if (currentFontSize < minSize) currentFontSize = minSize;
  if (currentFontSize > maxSize) currentFontSize = maxSize;
  
  // Save to localStorage with unified key
  localStorage.setItem('globalFontSize', currentFontSize);
  
  // Update body font size with !important to override CSS
  document.body.style.setProperty('font-size', currentFontSize + 'px', 'important');
  
  const display = document.getElementById('font-size-display');
  if (display) {{
    display.textContent = currentFontSize + 'px';
  }}
}}

function exportToPDF() {{
  window.print();
}}
</script>
</body>
</html>'''
    
    return html

def update_listing_page(category, song_num, title):
    """Update the listing page with the new song"""
    
    listing_file = f"{category}/index.html"
    prefix = 'hin' if category == 'hindi' else 'eng'
    
    if not os.path.exists(listing_file):
        print(f"Warning: {listing_file} not found. Please add the song manually to the listing page.")
        return
    
    with open(listing_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add to HTML list (before </ul>)
    new_list_item = f'<li><a href="{prefix}-{song_num:03d}.html">{song_num} - {title}</a></li>'
    content = content.replace('</ul>', f'{new_list_item}\n</ul>')
    
    # Add to JavaScript array (before ];)
    new_js_item = f'{{num: {song_num}, title: "{title}", file: "{prefix}-{song_num:03d}.html"}},'
    content = re.sub(r'(\]\s*;)', f'{new_js_item}\n\\1', content)
    
    # Update song count in header
    content = re.sub(
        r'(<h2>\s*)(\d+)(\s*songs?\s*</h2>)',
        lambda m: f'{m.group(1)}{song_num}{m.group(3)}',
        content
    )
    
    with open(listing_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Updated {listing_file}")

def update_main_index(category, new_count):
    """Update song count on main index.html"""
    
    if not os.path.exists('index.html'):
        return
    
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update the song count for the category
    category_name = 'Hindi' if category == 'hindi' else 'English'
    pattern = f'({category_name}.*?<span class="song-count">)\\d+(\\s*songs?</span>)'
    content = re.sub(pattern, f'\\g<1>{new_count}\\g<2>', content, flags=re.IGNORECASE | re.DOTALL)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Updated index.html song count")

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 add_song.py <song-text-file.txt>")
        print("\nExample: python3 add_song.py sample-song.txt")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found")
        sys.exit(1)
    
    print("="*60)
    print("🎵 SONG HTML GENERATOR")
    print("="*60)
    
    try:
        # Parse the input file
        print(f"\n📖 Reading: {input_file}")
        song_data = read_song_file(input_file)
        
        category = song_data['category']
        title = song_data['title']
        
        print(f"✓ Category: {category}")
        print(f"✓ Title: {title}")
        print(f"✓ Sections: {len(song_data['sections'])}")
        
        # Get next song number
        song_num = get_next_song_number(category)
        
        # Get current total to properly enable next button on previous song
        current_total = song_num - 1
        
        # After adding this song, total will be song_num
        # But for generating HTML, we set total higher to enable next button
        total_songs = song_num + 100  # Allow for future songs
        
        print(f"\n🔢 Assigning song number: {song_num}")
        
        # Generate HTML
        print("\n⚙️  Generating HTML...")
        html_content = generate_html(song_data, song_num, total_songs)
        
        # Save the file
        prefix = 'hin' if category == 'hindi' else 'eng'
        output_file = f"{category}/{prefix}-{song_num:03d}.html"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"✓ Created: {output_file}")
        
        # Update previous song's next button if this isn't the first song
        if song_num > 1:
            print(f"\n🔗 Updating previous song's next button...")
            prev_file = f"{category}/{prefix}-{song_num-1:03d}.html"
            if os.path.exists(prev_file):
                with open(prev_file, 'r', encoding='utf-8') as f:
                    prev_content = f.read()
                
                # Replace disabled next button with active one
                prev_content = prev_content.replace(
                    '<span class="nav-btn disabled">→</span>',
                    f'<a href="{prefix}-{song_num:03d}.html" class="nav-btn">→</a>'
                )
                
                with open(prev_file, 'w', encoding='utf-8') as f:
                    f.write(prev_content)
                
                print(f"✓ Updated {prev_file}")
        
        # Update listing page
        print("\n📝 Updating listing page...")
        update_listing_page(category, song_num, title)
        
        # Update main index
        print("📝 Updating main index...")
        update_main_index(category, song_num)
        
        print("\n" + "="*60)
        print("✅ SUCCESS!")
        print("="*60)
        print(f"\n🎉 New song added: {song_num} - {title}")
        print(f"📁 File: {output_file}")
        print(f"\n💡 To view: Open {category}/index.html in your browser")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
