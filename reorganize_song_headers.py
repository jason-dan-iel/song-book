#!/usr/bin/env python3
"""
Reorganize song page headers to have:
Row 1: Back button + Song title
Row 2: Previous + Font controls + PDF + Next
"""

import os
import re

def update_song_file(filepath):
    """Update song page header layout"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update CSS for new layout
        # Replace the page-header and related styles
        old_css_pattern = r'/\* Compact Header Layout \*/\s*\.page-header \{[^}]+\}\s*' + \
                         r'\.top-row \{[^}]+\}\s*' + \
                         r'\.back-button \{[^}]+\}\s*' + \
                         r'\.back-button a \{[^}]+\}\s*' + \
                         r'\.back-button a:hover \{[^}]+\}\s*' + \
                         r'\.title-bar \{[^}]+\}\s*' + \
                         r'\.nav-btn \{[^}]+\}\s*' + \
                         r'\.nav-btn:hover:not\(\.disabled\) \{[^}]+\}\s*' + \
                         r'\.nav-btn\.disabled \{[^}]+\}\s*' + \
                         r'\.song-title-text \{[^}]+\}\s*' + \
                         r'\.controls-bar \{[^}]+\}\s*' + \
                         r'\.font-controls \{[^}]+\}\s*' + \
                         r'\.font-label \{[^}]+\}\s*' + \
                         r'\.font-btn \{[^}]+\}\s*' + \
                         r'\.font-btn:hover \{[^}]+\}\s*' + \
                         r'\.font-btn:active \{[^}]+\}\s*' + \
                         r'\.font-size-display \{[^}]+\}\s*' + \
                         r'\.pdf-btn \{[^}]+\}\s*' + \
                         r'\.pdf-btn:hover \{[^}]+\}\s*' + \
                         r'\.pdf-btn:active \{[^}]+\}'
        
        new_css = '''/* Compact Header Layout */
.page-header {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f7;
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

.song-title-text {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1f;
  text-align: center;
  flex: 1;
  padding: 0 16px;
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
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

.center-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: center;
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
}'''
        
        content = re.sub(old_css_pattern, new_css, content, flags=re.DOTALL)
        
        # Update mobile responsive styles
        old_mobile = r'/\* Mobile Responsive Styles \*/.*?(?=@media print)'
        
        new_mobile = '''/* Mobile Responsive Styles */
@media (max-width: 768px) {
  body {
    padding: 16px 12px;
    font-size: 16px;
  }
  
  .page-header {
    padding: 14px;
    margin-bottom: 16px;
  }
  
  .title-row {
    margin-bottom: 10px;
    padding-bottom: 10px;
  }
  
  .back-button a {
    padding: 7px 12px;
    font-size: 13px;
  }
  
  .song-title-text {
    font-size: 15px;
    padding: 0 12px;
  }
  
  .controls-row {
    gap: 10px;
  }
  
  .nav-btn {
    padding: 7px 12px;
    font-size: 13px;
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
  .title-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .song-title-text {
    order: -1;
    font-size: 15px;
    padding: 0 8px 8px 8px;
    text-align: center;
  }
  
  .back-button {
    text-align: center;
  }
  
  .controls-row {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .nav-btn {
    flex: 1 1 45%;
    text-align: center;
  }
  
  .center-controls {
    flex: 1 1 100%;
    order: 1;
    border-top: 1px solid #f5f5f7;
    padding-top: 10px;
    margin-top: 4px;
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
  
  .song-title-text {
    font-size: 14px;
  }
  
  .nav-btn {
    font-size: 12px;
    padding: 6px 10px;
  }
  
  .center-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .font-controls {
    width: 100%;
    justify-content: center;
  }
  
  .pdf-btn {
    width: 100%;
    justify-content: center;
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
        
        content = re.sub(old_mobile, new_mobile, content, flags=re.DOTALL)
        
        # Now update the HTML structure
        # Find the page-header section and extract the components
        html_pattern = r'<div class="page-header">\s*<div class="top-row">.*?</div>\s*<div class="controls-bar">.*?</div>\s*</div>'
        
        match = re.search(html_pattern, content, re.DOTALL)
        if match:
            old_html = match.group(0)
            
            # Extract back button link
            back_match = re.search(r'<a href="([^"]+)">← Back</a>', old_html)
            back_link = back_match.group(1) if back_match else "../hindi/index.html"
            
            # Extract title
            title_match = re.search(r'<div class="song-title-text">([^<]+)</div>', old_html)
            title_text = title_match.group(1) if title_match else ""
            
            # Extract prev button
            prev_match = re.search(r'(<(?:span|a)[^>]*class="nav-btn[^"]*"[^>]*>← Previous</(?:span|a)>)', old_html)
            prev_html = prev_match.group(1) if prev_match else '<span class="nav-btn disabled">← Previous</span>'
            
            # Extract next button
            next_match = re.search(r'(<a[^>]*class="nav-btn"[^>]*>Next →</a>|<span[^>]*class="nav-btn disabled"[^>]*>Next →</span>)', old_html)
            next_html = next_match.group(1) if next_match else '<span class="nav-btn disabled">Next →</span>'
            
            new_html = f'''<div class="page-header">
  <div class="title-row">
    <div class="back-button">
      <a href="{back_link}">← Back</a>
    </div>
    <div class="song-title-text">{title_text}</div>
  </div>
  <div class="controls-row">
    {prev_html}
    <div class="center-controls">
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
    {next_html}
  </div>
</div>'''
            
            content = content.replace(old_html, new_html)
        
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
        filepath = os.path.join('hindi', filename)
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
        filepath = os.path.join('english', filename)
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
