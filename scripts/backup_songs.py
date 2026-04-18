import json
import os
from datetime import datetime
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
        .select("*")
        .range(start, start + page_size - 1)
        .execute()
    )
    batch = resp.data or []
    all_rows.extend(batch)
    if len(batch) < page_size:
        break
    start += page_size

all_rows.sort(key=lambda r: (r["category"], r["number"]))

backup_dir = os.path.join(os.path.dirname(__file__), "backups")
os.makedirs(backup_dir, exist_ok=True)
stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
out_path = os.path.join(backup_dir, f"songs-{stamp}.json")

with open(out_path, "w", encoding="utf-8") as f:
    json.dump(all_rows, f, indent=2, ensure_ascii=False)

print(f"Backed up {len(all_rows)} songs -> {out_path}")
