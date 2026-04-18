import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_SERVICE_KEY"]
supabase = create_client(url, key)

path = os.path.join(os.path.dirname(__file__), "songs_all.json")
with open(path, "r", encoding="utf-8") as f:
    songs = json.load(f)

now = datetime.now(timezone.utc).isoformat()
rows = [
    {
        "category": s["category"],
        "number": s["number"],
        "title": s["title"],
        "stanzas": s["stanzas"],
        "updated_at": now,
    }
    for s in songs
]

print(f"Upserting {len(rows)} songs...")
BATCH = 200
total = 0
for i in range(0, len(rows), BATCH):
    chunk = rows[i : i + BATCH]
    result = supabase.table("songs").upsert(chunk, on_conflict="category,number").execute()
    total += len(result.data)
    print(f"  batch {i // BATCH + 1}: upserted {len(result.data)}")

print(f"Done. Upserted {total} songs.")
