import os

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
        
        # Add optimal line-height to stanza for best readability
        old_stanza = '''.stanza {
  margin-bottom: 1em;
  white-space: pre-line;
}'''
        
        new_stanza = '''.stanza {
  margin-bottom: 1em;
  white-space: pre-line;
  line-height: 1.6;
}'''
        
        if old_stanza in content:
            content = content.replace(old_stanza, new_stanza)
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
