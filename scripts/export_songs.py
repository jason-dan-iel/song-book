import json
import os
from collections import Counter
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_SERVICE_KEY"]
supabase = create_client(url, key)

all_rows = []
page_size = 1000
start = 0
while True:
    resp = (
        supabase.table("songs")
        .select("category,number,title,stanzas")
        .range(start, start + page_size - 1)
        .execute()
    )
    batch = resp.data or []
    all_rows.extend(batch)
    if len(batch) < page_size:
        break
    start += page_size

all_rows.sort(key=lambda r: (r["category"], r["number"]))

out_path = os.path.join(os.path.dirname(__file__), "songs_all.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(all_rows, f, indent=2, ensure_ascii=False)

print(f"Exported {len(all_rows)} songs -> {out_path}")
for cat, n in sorted(Counter(r["category"] for r in all_rows).items()):
    print(f"  {cat:<14} {n}")
