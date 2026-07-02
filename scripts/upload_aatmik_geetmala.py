import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_SERVICE_KEY"]
supabase = create_client(url, key)

with open(os.path.join(os.path.dirname(__file__), "aatmik_geetmala_songs.json"), "r", encoding="utf-8") as f:
    songs = json.load(f)

now = datetime.now(timezone.utc).isoformat()

rows = []
for song in songs:
    rows.append({
        "category": song["category"],
        "number": song["number"],
        "title": song["title"],
        "stanzas": song["stanzas"],
        "updated_at": now,
    })

# Batch in chunks of 100 to avoid timeout
batch_size = 100
total = 0
for i in range(0, len(rows), batch_size):
    batch = rows[i:i+batch_size]
    result = supabase.table("songs").upsert(batch, on_conflict="category,number").execute()
    total += len(result.data)
    print(f"Upserted batch {i//batch_size + 1}: {len(result.data)} songs")

print(f"Total upserted: {total} songs")
