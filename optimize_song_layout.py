#!/usr/bin/env python3
"""
Script to optimize song page layout by creating a compact 2-row header
that combines back button, title bar, and controls to save vertical space.
"""

import os
import re

# Path to the directories
HINDI_DIR = 'hindi'
ENGLISH_DIR = 'english'

# New compact header styles
NEW_HEADER_STYLES = '''
/* Compact Header Layout */
.page-header {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.back-button {
  margin: 0;
}
.back-button a {
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
}
.back-button a:hover {
  background: #e5e5e7;
}

.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  gap: 12px;
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  margin: 0;
}

.nav-btn {
  padding: 8px 14px;
  font-size: 14px;
  color: #0066cc;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
  white-space: nowrap;
  background: #f5f5f7;
}

.nav-btn:hover:not(.disabled) {
  background: #e5e5e7;
}

.nav-btn.disabled {
  color: #86868b;
  cursor: default;
  background: transparent;
}

.song-title-text {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  text-align: center;
  flex: 1;
  padding: 0 12px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 12px 0 0 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  border-top: 1px solid #f5f5f7;
  flex-wrap: wrap;
  gap: 12px;
}
.font-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.font-label {
  font-size: 13px;
  color: #6e6e73;
  font-weight: 500;
}
.font-btn {
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
}
.font-btn:hover {
  background: #e5e5e7;
}
.font-btn:active {
  transform: scale(0.95);
}
.font-size-display {
  min-width: 45px;
  text-align: center;
  font-size: 14px;
  color: #1d1d1f;
  font-weight: 500;
}
.pdf-btn {
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
}
.pdf-btn:hover {
  background: #0077ed;
}
.pdf-btn:active {
  transform: scale(0.98);
}
'''

# Updated mobile styles for compact layout
NEW_MOBILE_STYLES = '''
/* Mobile Responsive Styles */
@media (max-width: 768px) {
  body {
    padding: 16px 12px;
    font-size: 16px;
  }
  
  .page-header {
    padding: 14px;
    margin-bottom: 16px;
  }
  
  .top-row {
    margin-bottom: 10px;
  }
  
  .back-button a {
    padding: 7px 12px;
    font-size: 13px;
  }
  
  .title-bar {
    gap: 8px;
  }
  
  .song-title-text {
    font-size: 14px;
    padding: 0 8px;
  }
  
  .nav-btn {
    padding: 7px 12px;
    font-size: 13px;
  }
  
  .controls-bar {
    padding: 10px 0 0 0;
    gap: 10px;
  }
  
  .font-label {
    font-size: 12px;
  }
  
  .font-controls {
    gap: 8px;
  }
  
  .font-btn {
    width: 30px;
    height: 30px;
    font-size: 15px;
  }
  
  .font-size-display {
    font-size: 13px;
    min-width: 40px;
  }
  
  .pdf-btn {
    padding: 7px 14px;
    font-size: 13px;
    gap: 5px;
  }
  
  .lyrics-container {
    height: 65vh;
    border-radius: 8px;
  }
  
  .stanza {
    padding: 12px 16px;
    font-size: 15px;
    text-align: left;
  }
  
  .stanza-label {
    font-size: 14px;
    margin-bottom: 6px;
  }
  
  .chorus {
    padding: 12px 16px;
    font-size: 15px;
    text-align: left;
  }
}

@media (max-width: 600px) {
  .top-row {
    flex-wrap: wrap;
  }
  
  .back-button {
    order: 1;
    flex: 0 0 auto;
  }
  
  .title-bar {
    order: 3;
    flex: 1 1 100%;
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .song-title-text {
    order: -1;
    font-size: 14px;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    padding: 0 4px 6px 4px;
  }
  
  .nav-btn {
    width: 48%;
  }
  
  .controls-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .font-controls {
    justify-content: center;
  }
  
  .pdf-btn {
    justify-content: center;
    width: 100%;
  }
}

@media (max-width: 480px) {
  body {
    padding: 12px 10px;
    font-size: 15px;
  }
  
  .page-header {
    padding: 12px;
  }
  
  .back-button a {
    font-size: 12px;
    padding: 6px 10px;
  }
  
  .nav-btn {
    font-size: 12px;
    padding: 6px 10px;
    width: 48%;
  }
  
  .song-title-text {
    font-size: 13px;
  }
  
  .lyrics-container {
    height: 60vh;
  }
  
  .stanza {
    padding: 10px 12px;
    font-size: 14px;
  }
  
  .stanza-label {
    font-size: 13px;
  }
  
  .chorus {
    padding: 10px 12px;
    font-size: 14px;
  }
}
'''

def update_song_file(filepath):
    """Update a single song HTML file with compact layout"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove old back-button, controls-bar, and title-bar styles
        # Remove old back-button styles
        content = re.sub(
            r'\.back-button \{[^}]+\}\s*\.back-button a \{[^}]+\}\s*\.back-button a:hover \{[^}]+\}',
            '',
            content,
            flags=re.DOTALL
        )
        
        # Remove old controls-bar and related styles
        content = re.sub(
            r'\.controls-bar \{[^}]+\}\s*' +
            r'\.font-controls \{[^}]+\}\s*' +
            r'\.font-label \{[^}]+\}\s*' +
            r'\.font-btn \{[^}]+\}\s*' +
            r'\.font-btn:hover \{[^}]+\}\s*' +
            r'\.font-btn:active \{[^}]+\}\s*' +
            r'\.font-size-display \{[^}]+\}\s*' +
            r'\.pdf-btn \{[^}]+\}\s*' +
            r'\.pdf-btn:hover \{[^}]+\}\s*' +
            r'\.pdf-btn:active \{[^}]+\}',
            '',
            content,
            flags=re.DOTALL
        )
        
        # Remove old title-bar and navigation styles
        content = re.sub(
            r'\.title-bar \{[^}]+\}\s*' +
            r'\.nav-btn \{[^}]+\}\s*' +
            r'\.nav-btn:hover:not\(\.disabled\) \{[^}]+\}\s*' +
            r'\.nav-btn\.disabled \{[^}]+\}\s*' +
            r'\.song-title-text \{[^}]+\}',
            '',
            content,
            flags=re.DOTALL
        )
        
        # Remove old mobile styles (all three @media blocks)
        content = re.sub(
            r'/\* Mobile Responsive Styles \*/\s*@media \(max-width: 768px\) \{[^}]+(?:\{[^}]+\}[^}]*)+\}',
            '',
            content,
            flags=re.DOTALL
        )
        content = re.sub(
            r'@media \(max-width: 480px\) \{[^}]+(?:\{[^}]+\}[^}]*)+\}',
            '',
            content,
            flags=re.DOTALL
        )
        content = re.sub(
            r'@media \(max-width: 600px\) \{[^}]+(?:\{[^}]+\}[^}]*)+\}',
            '',
            content,
            flags=re.DOTALL
        )
        
        # Insert new header styles before @media print
        print_media_pos = content.find('@media print')
        if print_media_pos != -1:
            content = content[:print_media_pos] + NEW_HEADER_STYLES + '\n\n' + NEW_MOBILE_STYLES + '\n\n' + content[print_media_pos:]
        
        # Update HTML structure - replace old back button + controls bar + title bar
        # with new compact header
        old_structure_pattern = re.compile(
            r'<div class="back-button">\s*<a href="([^"]+)">← Back</a>\s*</div>\s*' +
            r'<div class="controls-bar">.*?</div>\s*' +
            r'<div class="title-bar">(.*?)</div>',
            re.DOTALL
        )
        
        def replace_structure(match):
            back_link = match.group(1)
            title_bar_content = match.group(2)
            
            # Extract previous button, title, and next button from title bar
            prev_match = re.search(r'<(span|a)[^>]*class="nav-btn[^"]*"[^>]*>(.*?)</(span|a)>', title_bar_content)
            title_match = re.search(r'<div class="song-title-text">(.*?)</div>', title_bar_content)
            next_match = re.search(r'<a[^>]*class="nav-btn"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', title_bar_content)
            
            prev_html = prev_match.group(0) if prev_match else '<span class="nav-btn disabled">← Previous</span>'
            title_text = title_match.group(1) if title_match else ''
            next_html = next_match.group(0) if next_match else '<span class="nav-btn disabled">Next →</span>'
            
            new_structure = f'''<div class="page-header">
  <div class="top-row">
    <div class="back-button">
      <a href="{back_link}">← Back</a>
    </div>
    <div class="title-bar">
      {prev_html}
      <div class="song-title-text">{title_text}</div>
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
            return new_structure
        
        content = old_structure_pattern.sub(replace_structure, content)
        
        # Write updated content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
    except Exception as e:
        print(f"Error updating {filepath}: {str(e)}")
        return False

def main():
    updated_count = 0
    failed_files = []
    
    # Process Hindi songs
    print("Updating Hindi songs...")
    for i in range(1, 136):
        filename = f"hin-{i:03d}.html"
        filepath = os.path.join(HINDI_DIR, filename)
        if os.path.exists(filepath):
            if update_song_file(filepath):
                updated_count += 1
                print(f"✓ {filename}")
            else:
                failed_files.append(filepath)
    
    # Process English songs
    print("\nUpdating English songs...")
    for i in range(1, 3):
        filename = f"eng-{i:03d}.html"
        filepath = os.path.join(ENGLISH_DIR, filename)
        if os.path.exists(filepath):
            if update_song_file(filepath):
                updated_count += 1
                print(f"✓ {filename}")
            else:
                failed_files.append(filepath)
    
    print(f"\n{'='*50}")
    print(f"Update complete!")
    print(f"Successfully updated: {updated_count} files")
    if failed_files:
        print(f"Failed to update: {len(failed_files)} files")
        for f in failed_files:
            print(f"  - {f}")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
