#!/usr/bin/env python3
"""
Complete fix for song book layout - removes duplicate headers and fixes CSS
"""

import os
import re

def fix_song_file(filepath):
    """Fix a single song file with complete CSS and HTML"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract the song title, category, and navigation info
    title_match = re.search(r'<title>(.*?)</title>', content)
    if not title_match:
        return False
    
    title_text = title_match.group(1)
    
    # Extract song number from filename first
    filename = os.path.basename(filepath)
    song_num_match = re.search(r'(\d+)', filename)
    song_num = int(song_num_match.group(1)) if song_num_match else 0
    
    # Determine category from filename prefix
    if filename.startswith('hin-'):
        category = 'hindi'
        back_link = 'index.html'
    else:
        category = 'english'
        back_link = 'index.html'
    
    # Determine prev/next links
    if category == 'hindi':
        total_songs = 135
        prev_num = song_num - 1 if song_num > 1 else None
        next_num = song_num + 1 if song_num < total_songs else None
        prev_link = f"hin-{prev_num:03d}.html" if prev_num else None
        next_link = f"hin-{next_num:03d}.html" if next_num else None
    else:
        total_songs = 2
        prev_num = song_num - 1 if song_num > 1 else None
        next_num = song_num + 1 if song_num < total_songs else None
        prev_link = f"eng-{prev_num:03d}.html" if prev_num else None
        next_link = f"eng-{next_num:03d}.html" if next_num else None
    
    # Build navigation HTML
    if prev_link:
        prev_html = f'<a href="{prev_link}" class="nav-btn">← Previous</a>'
    else:
        prev_html = '<span class="nav-btn disabled">← Previous</span>'
    
    if next_link:
        next_html = f'<a href="{next_link}" class="nav-btn">Next →</a>'
    else:
        next_html = '<span class="nav-btn disabled">Next →</span>'
    
    # Extract lyrics content (everything after <body> tag)
    lyrics_match = re.search(r'<div class="lyrics-container">(.*?)</div>\s*<script>', content, re.DOTALL)
    if not lyrics_match:
        return False
    
    lyrics_content = lyrics_match.group(1)
    
    # Extract script content
    script_match = re.search(r'(<script>.*?</script>)', content, re.DOTALL)
    script_content = script_match.group(1) if script_match else ''
    
    # Build complete new HTML
    new_html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title_text}</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}

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

.page-header {{
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
  gap: 12px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: #f5f5f7;
  color: #1d1d1f;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}}

.font-btn:hover {{
  background: #e5e5e7;
}}

.font-btn:active {{
  transform: scale(0.95);
}}

.font-size-display {{
  font-size: 13px;
  color: #6e6e73;
  font-weight: 500;
  min-width: 45px;
  text-align: center;
}}

.pdf-btn {{
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  color: #0066cc;
  background: #f5f5f7;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}}

.pdf-btn:hover {{
  background: #e5e5e7;
}}

.pdf-btn:active {{
  transform: scale(0.98);
}}

.lyrics-container {{
  height: 70vh;
  overflow-y: auto;
  background: white;
  border-radius: 12px;
  margin: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  padding: 8px 0;
}}

.stanza {{
  text-align: left;
  padding: 12px 20px;
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
  text-align: left;
  position: sticky;
  top: 0;
  background: #fff9e6;
  padding: 12px 20px;
  margin: 0;
  font-style: italic;
  border-top: 2px solid #ffe680;
  border-bottom: 2px solid #ffe680;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}}

/* Tablet */
@media (max-width: 768px) {{
  body {{
    padding: 20px 16px;
  }}
  
  .page-header {{
    padding: 16px;
  }}
  
  .title-row {{
    margin-bottom: 10px;
    padding-bottom: 10px;
  }}
  
  .back-button a {{
    padding: 7px 12px;
    font-size: 13px;
  }}
  
  .song-title-text {{
    font-size: 15px;
    padding: 0 12px;
  }}
  
  .nav-row {{
    margin-bottom: 10px;
    padding-bottom: 10px;
  }}
  
  .nav-btn {{
    padding: 7px 16px;
    font-size: 13px;
  }}
  
  .controls-row {{
    gap: 12px;
  }}
}}

/* Mobile */
@media (max-width: 600px) {{
  .title-row {{
    gap: 8px;
  }}
  
  .back-button a {{
    padding: 6px 10px;
    font-size: 13px;
  }}
  
  .song-title-text {{
    font-size: 14px;
    padding: 0 8px;
  }}
  
  .nav-row {{
    gap: 8px;
  }}
  
  .nav-btn {{
    max-width: none;
    padding: 6px 12px;
    font-size: 13px;
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

/* Small mobile */
@media (max-width: 480px) {{
  body {{
    padding: 16px 12px;
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
}}
</style>
</head>
<body>
<div class="page-header">
  <div class="title-row">
    <div class="back-button">
      <a href="{back_link}">← Back</a>
    </div>
    <div class="song-title-text">{title_text}</div>
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

<div class="lyrics-container">{lyrics_content}</div>

{script_content}

</body>
</html>'''
    
    # Write the fixed file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_html)
    
    return True


def main():
    """Fix all song files"""
    
    # Hindi songs
    print("Fixing Hindi songs...")
    hindi_dir = 'hindi'
    for i in range(1, 136):
        filename = f'hin-{i:03d}.html'
        filepath = os.path.join(hindi_dir, filename)
        if os.path.exists(filepath):
            if fix_song_file(filepath):
                print(f'✓ {filename}')
            else:
                print(f'✗ {filename} - FAILED')
    
    # English songs
    print("\nFixing English songs...")
    english_dir = 'english'
    for i in range(1, 3):
        filename = f'eng-{i:03d}.html'
        filepath = os.path.join(english_dir, filename)
        if os.path.exists(filepath):
            if fix_song_file(filepath):
                print(f'✓ {filename}')
            else:
                print(f'✗ {filename} - FAILED')
    
    print("\n✅ Complete fix applied to all files!")


if __name__ == '__main__':
    main()
