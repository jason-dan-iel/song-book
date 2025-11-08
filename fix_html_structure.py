#!/usr/bin/env python3
"""
Fix remaining HTML structure issues in song pages
"""

import os
import re

def fix_song_file(filepath):
    """Fix HTML structure in a song file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract the song number and title from the title tag
        title_match = re.search(r'<title>(\d+) - ([^<]+)</title>', content)
        if not title_match:
            print(f"Could not extract title from {filepath}")
            return False
        
        song_num = title_match.group(1)
        song_title = title_match.group(2).strip()
        
        # Determine file info
        filename = os.path.basename(filepath)
        is_hindi = filename.startswith('hin-')
        prefix = 'hin' if is_hindi else 'eng'
        category = 'hindi' if is_hindi else 'english'
        
        # Get song number from filename
        file_num_match = re.search(r'-(\d+)\.html', filename)
        if not file_num_match:
            return False
        file_num = int(file_num_match.group(1))
        
        # Count total songs in directory
        dir_path = os.path.dirname(filepath)
        all_files = [f for f in os.listdir(dir_path) if f.startswith(prefix) and f.endswith('.html')]
        total_songs = len(all_files)
        
        # Build prev/next buttons
        prev_num = file_num - 1 if file_num > 1 else None
        next_num = file_num + 1 if file_num <= total_songs else None
        
        prev_html = f'<a href="{prefix}-{prev_num:03d}.html" class="nav-btn">← Previous</a>' if prev_num else '<span class="nav-btn disabled">← Previous</span>'
        next_html = f'<a href="{prefix}-{next_num:03d}.html" class="nav-btn">Next →</a>' if next_num else '<span class="nav-btn disabled">Next →</span>'
        
        # Build correct page header
        correct_header = f'''<div class="page-header">
  <div class="top-row">
    <div class="back-button">
      <a href="../{category}/index.html">← Back</a>
    </div>
    <div class="title-bar">
      {prev_html}
      <div class="song-title-text">{song_num} {song_title}</div>
      {next_html}
    </div>
  </div>
  <div class="controls-bar">
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
</div>'''
        
        # Find and replace the page header section (everything between <body> and <div class="lyrics-container">)
        pattern = r'<body>\s*<div class="page-header">.*?</div>\s*(?:<a[^>]*>.*?</a>\s*)?(?:</div>\s*)?(?=<div class="lyrics-container">)'
        
        replacement = f'<body>\n{correct_header}\n\n'
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        
        # Write the fixed content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
    except Exception as e:
        print(f"Error fixing {filepath}: {str(e)}")
        return False

def main():
    updated_count = 0
    failed_files = []
    
    # Process Hindi songs
    print("Fixing Hindi songs...")
    for i in range(1, 136):
        filename = f"hin-{i:03d}.html"
        filepath = os.path.join('hindi', filename)
        if os.path.exists(filepath):
            if fix_song_file(filepath):
                updated_count += 1
                print(f"✓ {filename}")
            else:
                failed_files.append(filepath)
    
    # Process English songs
    print("\nFixing English songs...")
    for i in range(1, 3):
        filename = f"eng-{i:03d}.html"
        filepath = os.path.join('english', filename)
        if os.path.exists(filepath):
            if fix_song_file(filepath):
                updated_count += 1
                print(f"✓ {filename}")
            else:
                failed_files.append(filepath)
    
    print(f"\n{'='*50}")
    print(f"Fix complete!")
    print(f"Successfully fixed: {updated_count} files")
    if failed_files:
        print(f"Failed to fix: {len(failed_files)} files")
        for f in failed_files:
            print(f"  - {f}")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
