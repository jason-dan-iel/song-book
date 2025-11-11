import os
import re

# Get all song HTML files
song_files = []
for folder in ['hindi', 'english']:
    if os.path.exists(folder):
        for file in os.listdir(folder):
            if file.endswith('.html') and file != 'index.html':
                song_files.append(os.path.join(folder, file))

print(f"Found {len(song_files)} song files to update")

updated_count = 0
for file_path in song_files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        modified = False
        
        # Update chorus padding to minimal values
        # Change padding: 1em to padding: 0.5em
        old_pattern = r'(\.stanza\.chorus \{[^}]*?)padding: 1em;'
        if re.search(old_pattern, content):
            content = re.sub(old_pattern, r'\1padding: 0.5em;', content)
            modified = True
        
        # Change padding-bottom: 2em to padding-bottom: 0.5em
        old_pattern2 = r'(\.stanza\.chorus \{[^}]*?)padding-bottom: 2em;'
        if re.search(old_pattern2, content):
            content = re.sub(old_pattern2, r'\1padding-bottom: 0.5em;', content)
            modified = True
        
        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            updated_count += 1
            print(f"✓ Updated {file_path}")
        else:
            print(f"○ Skipped {file_path} (pattern not found)")
    except Exception as e:
        print(f"✗ Error updating {file_path}: {e}")

print(f"\nUpdate complete! Updated {updated_count} out of {len(song_files)} files")
