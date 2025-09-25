#!/usr/bin/env python3
import json
import re
import shutil
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent
LYRICS_DIR = ROOT / "lyrics"
MANIFEST_PATH = LYRICS_DIR / "manifest.json"

def load_json(p: Path):
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)

def save_json(p: Path, data):
    with p.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def backup_manifest():
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = MANIFEST_PATH.with_name(f"manifest.backup-{ts}.json")
    shutil.copy2(MANIFEST_PATH, backup)
    print(f"[backup] Wrote {backup.relative_to(ROOT)}")

def get_digits(id_str: str) -> str:
    m = re.search(r'(\d+)$', id_str)
    return m.group(1) if m else ""

def get_prefix(id_str: str) -> str:
    return id_str.split('-', 1)[0] if '-' in id_str else id_str

def get_pad_width(ids):
    widths = [len(get_digits(i)) for i in ids if get_digits(i)]
    return max(widths) if widths else 3

def song_preview(song_file: Path, lines=2) -> str:
    try:
        data = load_json(song_file)
        sections = data.get("sections", [])
        for sec in sections:
            arr = sec.get("lines", [])
            if isinstance(arr, list) and arr:
                sample = [ln for ln in arr if isinstance(ln, str)]
                if sample:
                    return " / ".join(sample[:lines])
        return "(no lines found)"
    except Exception as e:
        return f"(error reading: {e})"

def choose_category(manifest: dict) -> dict:
    cats = manifest.get("categories", [])
    if not cats:
        raise SystemExit("No categories found in manifest.")
    print("\nCategories:")
    for i, c in enumerate(cats, 1):
        print(f"  {i}. {c.get('name')} ({len(c.get('songs', []))} songs)")
    while True:
        raw = input("Pick a category number (or press Enter for first): ").strip()
        if raw == "":
            return cats[0]
        if raw.isdigit():
            idx = int(raw)
            if 1 <= idx <= len(cats):
                return cats[idx - 1]
        print("Invalid selection, try again.")

def build_plan(cat: dict):
    songs = cat.get("songs", [])
    if not songs:
        print("No songs in this category.")
        return None

    # Determine padding from current IDs
    ids = [s.get("id", "") for s in songs]
    pad = get_pad_width(ids)

    plan = {}  # old_id -> { new_id, old_file, new_file, prefix, dir }
    print("\nFor each song, enter the NEW sequence number, or press Enter to keep. Enter 'q' to finish early.\n")

    for idx, meta in enumerate(songs, 1):
        old_id = meta.get("id", "")
        title = meta.get("title", "")
        rel_file = meta.get("file", "")
        song_path = (LYRICS_DIR / rel_file).resolve()
        preview = song_preview(song_path, lines=2)

        print(f"[{idx}/{len(songs)}] {old_id} — {title}")
        print(f"    Preview: {preview}")
        while True:
            ans = input("    New number (e.g., 42) [Enter=keep, q=quit]: ").strip().lower()
            if ans == "q":
                print("Stopping input.")
                break
            if ans == "":
                # Keep
                break
            if ans.isdigit():
                prefix = get_prefix(old_id) or get_prefix(Path(rel_file).stem)
                num = int(ans)
                new_id = f"{prefix}-{str(num).zfill(pad)}"
                new_rel = str(Path(rel_file).parent / f"{new_id}.json")
                plan[old_id] = {
                    "new_id": new_id,
                    "old_file": song_path,
                    "new_file": (LYRICS_DIR / new_rel).resolve(),
                    "new_rel": new_rel
                }
                break
            print("    Please enter digits only, or Enter to keep, or 'q' to quit.")
        if ans == "q":
            break

    if not plan:
        print("No changes requested.")
        return None

    # Detect duplicate targets
    targets = [v["new_id"] for v in plan.values()]
    dups = {x for x in targets if targets.count(x) > 1}
    if dups:
        print("\nError: duplicate target IDs detected:")
        for d in sorted(dups):
            print(f"  - {d}")
        print("Resolve duplicates and re-run.")
        return None

    print("\nPlanned changes:")
    for old_id, v in plan.items():
        print(f"  {old_id}  ->  {v['new_id']}  ({v['old_file'].relative_to(ROOT)} -> {v['new_file'].relative_to(ROOT)})")

    confirm = input("Apply these changes? (y/N): ").strip().lower()
    if confirm != "y":
        print("Aborted.")
        return None

    return plan

def two_phase_rename(plan: dict):
    # Stage A: move old files to temp to avoid collisions
    temps = []
    for old_id, v in plan.items():
        src = v["old_file"]
        if not src.exists():
            raise RuntimeError(f"Missing file: {src}")
        tmp = src.with_name(src.stem + ".__tmp__.json")
        if tmp.exists():
            tmp.unlink()  # ensure free
        src.rename(tmp)
        temps.append((tmp, v["new_file"], old_id, v["new_id"]))
    # Stage B: move temps to final
    for tmp, dst, old_id, new_id in temps:
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists():
            # If a file already exists at destination (not in our plan), make room
            dst_backup = dst.with_name(dst.stem + ".__prev__.json")
            print(f"  Note: {dst.name} exists, backing up as {dst_backup.name}")
            if dst_backup.exists():
                dst_backup.unlink()
            dst.rename(dst_backup)
        tmp.rename(dst)

def update_song_ids_in_files(plan: dict):
    for old_id, v in plan.items():
        p = v["new_file"]
        data = load_json(p)
        data["id"] = v["new_id"]
        save_json(p, data)

def update_manifest(manifest: dict, category_name: str, plan: dict):
    for cat in manifest.get("categories", []):
        if cat.get("name") != category_name:
            continue
        for s in cat.get("songs", []):
            old_id = s.get("id")
            if old_id in plan:
                s["id"] = plan[old_id]["new_id"]
                s["file"] = plan[old_id]["new_rel"]
    save_json(MANIFEST_PATH, manifest)

def main():
    if not MANIFEST_PATH.exists():
        raise SystemExit(f"Manifest not found at {MANIFEST_PATH}")

    manifest = load_json(MANIFEST_PATH)
    cat = choose_category(manifest)
    category_name = cat.get("name")
    print(f"\nSelected category: {category_name}")

    plan = build_plan(cat)
    if not plan:
        return

    backup_manifest()

    try:
        print("\nRenaming files (two-phase for safety)...")
        two_phase_rename(plan)
        print("Updating song IDs inside files...")
        update_song_ids_in_files(plan)
        print("Updating manifest...")
        update_manifest(manifest, category_name, plan)
        print("\nDone.")
    except Exception as e:
        print(f"\nError: {e}")
        print("Manual inspection may be required. No files were deleted; some may have __tmp__ or __prev__ suffixes.")

if __name__ == "__main__":
    main()