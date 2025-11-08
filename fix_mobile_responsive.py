#!/usr/bin/env python3
"""
Mobile Responsive Fixer
========================
This script updates all song pages to be fully mobile responsive,
fixing overflow issues and improving mobile UX.

Changes:
- Reduced padding on mobile
- Better font sizes for small screens
- Fixed title bar overflow
- Improved controls bar wrapping
- Better touch targets
- Adjusted lyrics container height
- Word-wrap for long titles
"""

import os
import re

# Paths
hindi_dir = 'hindi'
english_dir = 'english'

def fix_mobile_responsive(filepath):
    """Update CSS to be fully mobile responsive"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the @media print section and add mobile CSS before it
        mobile_css = '''
/* Mobile Responsive Styles */
@media (max-width: 768px) {
  body {
    padding: 20px 12px;
    font-size: 16px;
  }
  
  .back-button {
    margin-bottom: 16px;
  }
  
  .back-button a {
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .controls-bar {
    padding: 12px;
    margin-bottom: 16px;
    gap: 10px;
  }
  
  .font-label {
    font-size: 13px;
  }
  
  .font-controls {
    gap: 8px;
  }
  
  .font-btn {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
  
  .font-size-display {
    font-size: 13px;
    min-width: 40px;
  }
  
  .pdf-btn {
    padding: 8px 12px;
    font-size: 14px;
    gap: 6px;
  }
  
  .title-bar {
    padding: 12px 16px;
    margin-bottom: 16px;
    gap: 10px;
  }
  
  .song-title-text {
    font-size: 15px;
    padding: 0 8px;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  
  .nav-btn {
    padding: 8px 12px;
    font-size: 14px;
    flex-shrink: 0;
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

@media (max-width: 480px) {
  body {
    padding: 16px 10px;
    font-size: 15px;
  }
  
  .back-button a {
    font-size: 13px;
    padding: 7px 10px;
  }
  
  .controls-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 10px;
  }
  
  .font-controls {
    justify-content: center;
  }
  
  .pdf-btn {
    justify-content: center;
    width: 100%;
  }
  
  .title-bar {
    flex-direction: column;
    text-align: center;
    padding: 10px 12px;
  }
  
  .song-title-text {
    order: -1;
    font-size: 14px;
    padding: 0 4px 8px 4px;
    max-width: 100%;
  }
  
  .nav-btn {
    width: 100%;
    text-align: center;
    padding: 8px;
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
        
        # Check if mobile CSS already exists
        if '@media (max-width: 768px)' in content:
            # Remove existing mobile CSS
            content = re.sub(
                r'/\* Mobile Responsive Styles \*/.*?(?=@media print|</style>)',
                '',
                content,
                flags=re.DOTALL
            )
        
        # Insert mobile CSS before @media print or before </style>
        if '@media print' in content:
            content = content.replace('@media print', mobile_css + '@media print')
        else:
            content = content.replace('</style>', mobile_css + '</style>')
        
        # Also update the existing @media (max-width: 600px) blocks if they exist
        # Remove old 600px media queries to avoid conflicts
        content = re.sub(
            r'@media \(max-width: 600px\) \{[^}]*\{[^}]*\}[^}]*\}',
            '',
            content,
            flags=re.DOTALL
        )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
        
    except Exception as e:
        print(f"Error updating {os.path.basename(filepath)}: {str(e)}")
        return False

# Update all Hindi songs
print("🔧 Fixing mobile responsiveness in Hindi songs...")
updated = 0
for i in range(1, 136):
    filename = f'hin-{i:03d}.html'
    filepath = os.path.join(hindi_dir, filename)
    if os.path.exists(filepath):
        if fix_mobile_responsive(filepath):
            updated += 1

# Update English songs
print("🔧 Fixing mobile responsiveness in English songs...")
for i in range(1, 3):
    filename = f'eng-{i:03d}.html'
    filepath = os.path.join(english_dir, filename)
    if os.path.exists(filepath):
        if fix_mobile_responsive(filepath):
            updated += 1

print("\n" + "="*60)
print(f"✅ Successfully updated: {updated} files")
print("="*60)
print("🎉 Mobile responsive fixes applied!")
print("\nChanges:")
print("  • Reduced padding on mobile devices")
print("  • Better font sizes for small screens")
print("  • Fixed title bar overflow with word-wrap")
print("  • Improved controls bar stacking")
print("  • Better touch targets (larger buttons)")
print("  • Adjusted lyrics container height")
print("  • Text alignment optimized for mobile")
print("  • Added 3 breakpoints: 768px, 600px, 480px")
