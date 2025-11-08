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
            
            sections.append({
                'type': 'chorus' if is_chorus else 'stanza',
                'label': 'कोरस' if (is_chorus and category == 'hindi') else 'Chorus' if is_chorus else section_type,
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
    
    # Previous/Next buttons
    prev_num = song_num - 1 if song_num > 1 else None
    next_num = song_num + 1 if song_num < total_songs else None
    
    prev_html = f'<a href="{prefix}-{prev_num:03d}.html" class="nav-btn">← Previous</a>' if prev_num else '<span class="nav-btn disabled">← Previous</span>'
    next_html = f'<a href="{prefix}-{next_num:03d}.html" class="nav-btn">Next →</a>' if next_num else '<span class="nav-btn disabled">Next →</span>'
    
    # Build sections HTML
    sections_html = []
    for section in sections:
        is_chorus = section['type'] == 'chorus'
        class_name = 'stanza chorus' if is_chorus else 'stanza'
        
        lines_html = '<br>\n'.join(section['lines'])
        
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
* {{ margin: 0; padding: 0; box-sizing: border-box;}}
body {{ 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 17px;
  line-height: 1.6;
  color: #1d1d1f;
  background: #fbfbfd;
  padding: 40px 20px;
  max-width: 800px;
  margin: 0 auto;
}}
/* Compact Header Layout */
.page-header {{
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}}

.title-row {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f7;
}}

.back-button {{
  margin: 0;
}}
.back-button a {{
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 14px;
  color: #0066cc;
  background: #f5f5f7;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 500;
}}
.back-button a:hover {{
  background: #e5e5e7;
}}

.song-title-text {{
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1f;
  text-align: center;
  flex: 1;
  padding: 0 16px;
}}

.nav-row {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f7;
}}

.nav-btn {{
  padding: 8px 20px;
  font-size: 14px;
  color: #0066cc;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
  white-space: nowrap;
  background: #f5f5f7;
  flex: 1;
  text-align: center;
  max-width: 200px;
}}

.nav-btn:hover:not(.disabled) {{
  background: #e5e5e7;
}}

.nav-btn.disabled {{
  color: #86868b;
  cursor: default;
  background: transparent;
}}

.controls-row {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}}


.lyrics-container {{ 
  height: 70vh;
  overflow-y: auto;
  background: white;
  border-radius: 12px;
  margin: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}}
.stanza {{ 
  text-align: justify;
  padding: 16px 20px;
  margin-bottom: 8px;
}}
.stanza-label {{ 
  text-align: left;
  font-size: 15px;
  font-weight: 600;
  color: #6e6e73;
  margin-bottom: 8px;
}}
.chorus {{ 
  text-align: justify;
  position: sticky;
  top: 0;
  background: #fff9e6;
  padding: 16px 20px;
  margin: 0;
  font-style: italic;
  border-top: 2px solid #ffe680;
  border-bottom: 2px solid #ffe680;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}}


.font-controls {{
  display: flex;
  align-items: center;
  gap: 10px;
}}
.font-label {{
  font-size: 13px;
  color: #6e6e73;
  font-weight: 500;
}}
.font-btn {{
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f7;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}}
.font-btn:hover {{
  background: #e5e5e7;
}}
.font-btn:active {{
  transform: scale(0.95);
}}
.font-size-display {{
  min-width: 45px;
  text-align: center;
  font-size: 14px;
  color: #1d1d1f;
  font-weight: 500;
}}
.pdf-btn {{
  padding: 8px 16px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
}}
.pdf-btn:hover {{
  background: #0077ed;
}}
.pdf-btn:active {{
  transform: scale(0.98);
}}

/* Mobile Responsive Styles */
@media (max-width: 768px) {{
  body {{
    padding: 16px 12px;
    font-size: 16px;
  }}
  
  .page-header {{
    padding: 14px;
    margin-bottom: 16px;
  }}
  
  .top-row {{
    margin-bottom: 10px;
  }}
  
  .back-button a {{
    padding: 7px 12px;
    font-size: 13px;
  }}
  
  .title-bar {{
    gap: 8px;
  }}
  
  .song-title-text {{
    font-size: 14px;
    padding: 0 8px;
  }}
  
  .nav-btn {{
    padding: 7px 12px;
    font-size: 13px;
  }}
  
  .font-label {{
    font-size: 12px;
  }}
  
  .font-controls {{
    gap: 8px;
  }}
  
  .font-btn {{
    width: 30px;
    height: 30px;
    font-size: 15px;
  }}
  
  .font-size-display {{
    font-size: 13px;
    min-width: 40px;
  }}
  
  .pdf-btn {{
    padding: 7px 14px;
    font-size: 13px;
    gap: 5px;
  }}
  
  .lyrics-container {{
    height: 65vh;
    border-radius: 8px;
  }}
  
  .stanza {{
    padding: 12px 16px;
    font-size: 15px;
    text-align: left;
  }}
  
  .stanza-label {{
    font-size: 14px;
    margin-bottom: 6px;
  }}
  
  .chorus {{
    padding: 12px 16px;
    font-size: 15px;
    text-align: left;
  }}
}}

@media (max-width: 600px) {{
  .title-row {{
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }}
  
  .song-title-text {{
    order: -1;
    font-size: 15px;
    padding: 0 8px 8px 8px;
    text-align: center;
  }}
  
  .back-button {{
    text-align: center;
  }}
  
  .nav-row {{
    gap: 10px;
  }}
  
  .nav-btn {{
    max-width: none;
  }}
  
  .controls-row {{
    flex-direction: column;
    gap: 10px;
  }}
  
  .font-controls {{
    width: 100%;
    justify-content: center;
  }}
  
  .pdf-btn {{
    width: 100%;
    justify-content: center;
  }}
}}

@media (max-width: 480px) {{
  body {{
    padding: 12px 10px;
    font-size: 15px;
  }}
  
  .page-header {{
    padding: 12px;
  }}
  
  .back-button a {{
    font-size: 12px;
    padding: 6px 10px;
  }}
  
  .song-title-text {{
    font-size: 14px;
  }}
  
  .nav-btn {{
    font-size: 12px;
    padding: 6px 12px;
  }}
  
  .lyrics-container {{
    height: 60vh;
  }}
  
  .stanza {{
    padding: 10px 12px;
    font-size: 14px;
  }}
  
  .stanza-label {{
    font-size: 13px;
  }}
  
  .chorus {{
    padding: 10px 12px;
    font-size: 14px;
  }}
}}

@media print {{
  body {{
    background: white;
    padding: 20px;
  }}
  .page-header {{
    display: none;
  }}
  .lyrics-container {{
    height: auto;
    box-shadow: none;
  }}
}}
</style>
</head>
<body>
<div class="page-header">
  <div class="title-row">
    <div class="back-button">
      <a href="../{category}/index.html">← Back</a>
    </div>
    <div class="song-title-text">{song_num} {title}</div>
  </div>
  <div class="nav-row">
    {prev_html}
    {next_html}
  </div>
  <div class="controls-row">
    <div class="font-controls">
      <span class="font-label">Font:</span>
      <button class="font-btn" onclick="updateFontSize(-1)" title="Decrease font size">−</button>
      <span class="font-size-display" id="font-size-display">17px</span>
      <button class="font-btn" onclick="updateFontSize(1)" title="Increase font size">+</button>
    </div>
    <button class="pdf-btn" onclick="exportToPDF()" title="Export to PDF">
      <span>📄</span>
      <span>PDF</span>
    </button>
  </div>
</div>

<div class="lyrics-container">
{chr(10).join(sections_html)}
</div>
<script>
// Load saved font size from localStorage or use default
let currentFontSize = parseInt(localStorage.getItem('songFontSize')) || 17;
const minSize = 12;
const maxSize = 32;

// Apply saved font size on page load
window.addEventListener('DOMContentLoaded', function() {{
  const stanzas = document.querySelectorAll('.stanza');
  stanzas.forEach(stanza => {{
    stanza.style.fontSize = currentFontSize + 'px';
  }});
  
  const display = document.getElementById('font-size-display');
  if (display) {{
    display.textContent = currentFontSize + 'px';
  }}
}});

function updateFontSize(change) {{
  const newSize = currentFontSize + change;
  
  if (newSize >= minSize && newSize <= maxSize) {{
    currentFontSize = newSize;
    
    // Save to localStorage
    localStorage.setItem('songFontSize', currentFontSize);
    
    // Update all stanzas
    const stanzas = document.querySelectorAll('.stanza');
    stanzas.forEach(stanza => {{
      stanza.style.fontSize = currentFontSize + 'px';
    }});
    
    // Update display
    const display = document.getElementById('font-size-display');
    if (display) {{
      display.textContent = currentFontSize + 'px';
    }}
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
        total_songs = song_num  # This will be the new total
        
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
