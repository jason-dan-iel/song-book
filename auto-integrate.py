import json
import os
import time
from pathlib import Path
import glob
from datetime import datetime

class SongIntegrator:
    def __init__(self):
        self.lyrics_dir = Path('lyrics')
        self.manifest_path = self.lyrics_dir / 'manifest.json'
        self.processed_files = set()
        
    def scan_for_new_files(self):
        """Scan for new english-{number}.json files"""
        pattern = str(self.lyrics_dir / 'english-*.json')
        found_files = glob.glob(pattern)
        
        # Filter out files we've already processed
        new_files = []
        for file_path in found_files:
            file_name = os.path.basename(file_path)
            # Skip if it's not the pattern we want (english-{number}.json)
            if not file_name.startswith('english-') or file_name in ['english-songs.json']:
                continue
            if file_path not in self.processed_files:
                new_files.append(file_path)
                
        return new_files
    
    def load_manifest(self):
        """Load the current manifest"""
        if not self.manifest_path.exists():
            return {'categories': []}
        
        with open(self.manifest_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def save_manifest(self, manifest):
        """Save the updated manifest"""
        with open(self.manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    def get_next_song_id(self, category, existing_songs):
        """Get the next available song ID"""
        if category == 'english':
            prefix = 'eng'
        elif category == 'hindi':
            prefix = 'hin'
        elif category == 'youth-camp':
            prefix = 'yc'
        elif category == 'special':
            prefix = 'spe'
        elif category == 'other':
            prefix = 'oth'
        else:
            prefix = category[:3]
        
        existing_ids = [song['id'] for song in existing_songs]
        counter = 1
        while f"{prefix}-{str(counter).zfill(3)}" in existing_ids:
            counter += 1
        
        return f"{prefix}-{str(counter).zfill(3)}"
    
    def process_new_file(self, file_path):
        """Process a single new english-{number}.json file"""
        print(f"Processing: {file_path}")
        
        try:
            # Load the new file
            with open(file_path, 'r', encoding='utf-8') as f:
                new_songs_data = json.load(f)
            
            # Handle different possible structures
            if isinstance(new_songs_data, list):
                songs = new_songs_data
            elif 'songs' in new_songs_data:
                songs = new_songs_data['songs']
            elif 'title' in new_songs_data:  # Single song file
                songs = [new_songs_data]
            else:
                print(f"Warning: Unknown structure in {file_path}")
                return False
            
            # Load current manifest
            manifest = self.load_manifest()
            
            # Find or create English category
            english_category = None
            for cat in manifest['categories']:
                if cat['name'] == 'english':
                    english_category = cat
                    break
            
            if not english_category:
                english_category = {'name': 'english', 'songs': []}
                manifest['categories'].append(english_category)
            
            # Create english directory if it doesn't exist
            english_dir = self.lyrics_dir / 'english'
            english_dir.mkdir(exist_ok=True)
            
            # Process each song
            added_songs = []
            for song in songs:
                # Generate new ID
                song_id = self.get_next_song_id('english', english_category['songs'])
                file_name = f"{song_id}.json"
                song_file_path = english_dir / file_name
                
                # Create individual song file
                song_data = {
                    'id': song_id,
                    'title': song.get('title', 'Untitled'),
                    'artist': song.get('artist', ''),
                    'category': 'english',
                    'sections': song.get('sections', [])
                }
                
                # Handle different lyrics formats
                if 'lyrics' in song and not song_data['sections']:
                    lyrics_text = song['lyrics']
                    if isinstance(lyrics_text, str):
                        lines = lyrics_text.split('\n')
                    else:
                        lines = lyrics_text
                    
                    song_data['sections'] = [{
                        'type': 'verse',
                        'label': '',
                        'lines': [line for line in lines if line.strip()]
                    }]
                
                # Write individual song file
                with open(song_file_path, 'w', encoding='utf-8') as f:
                    json.dump(song_data, f, indent=2, ensure_ascii=False)
                
                # Add to manifest
                english_category['songs'].append({
                    'id': song_id,
                    'title': song_data['title'],
                    'file': f"english/{file_name}"
                })
                
                added_songs.append(song_data['title'])
                print(f"  Added: {song_data['title']} ({song_id})")
            
            # Save updated manifest
            self.save_manifest(manifest)
            
            # Mark file as processed
            self.processed_files.add(file_path)
            
            print(f"Successfully processed {len(added_songs)} songs from {file_path}")
            return True
            
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            return False
    
    def watch_and_process(self, interval=5):
        """Watch for new files and process them automatically"""
        print(f"Watching for new english-*.json files...")
        print(f"Scan interval: {interval} seconds")
        print("Press Ctrl+C to stop")
        
        try:
            while True:
                new_files = self.scan_for_new_files()
                
                for file_path in new_files:
                    self.process_new_file(file_path)
                
                if new_files:
                    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Processed {len(new_files)} new files")
                
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\nStopping file watcher...")
    
    def process_all_pending(self):
        """Process all pending files once"""
        new_files = self.scan_for_new_files()
        
        if not new_files:
            print("No new english-*.json files found")
            return
        
        print(f"Found {len(new_files)} new files to process:")
        for file_path in new_files:
            print(f"  - {os.path.basename(file_path)}")
        
        for file_path in new_files:
            self.process_new_file(file_path)
        
        print(f"\nCompleted processing {len(new_files)} files")

def main():
    integrator = SongIntegrator()
    
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'watch':
        # Watch mode - continuously monitor for new files
        integrator.watch_and_process()
    else:
        # One-time processing mode
        integrator.process_all_pending()

if __name__ == '__main__':
    main()