import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_SERVICE_KEY"]  # use service role key for bulk writes
supabase = create_client(url, key)

with open(os.path.join(os.path.dirname(__file__), "songs.json"), "r", encoding="utf-8") as f:
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

result = supabase.table("songs").upsert(rows, on_conflict="category,number").execute()
print(f"Upserted {len(result.data)} songs")
