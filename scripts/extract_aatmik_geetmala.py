#!/usr/bin/env python3
"""
Extract songs from आत्मिक गीतमाला PDF using Gemini Vision API.
Processes PDF pages in batches, extracts Hindi songs with proper structure.
"""

import json
import os
import io
import time
from pathlib import Path
from dotenv import load_dotenv
from pdf2image import convert_from_path
from PIL import Image
import google.generativeai as genai

load_dotenv()

PDF_PATH = Path.home() / "Downloads" / "अत्मिक गीतमाला.pdf"
OUTPUT_PATH = Path(__file__).parent / "aatmik_geetmala_songs.json"
CATEGORY = "aatmik-geetmala"

# Configure Gemini
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-2.0-flash")

EXTRACTION_PROMPT = """Extract ALL songs from this Hindi hymnal page image. The page has a two-column layout.

For each song found, output a JSON object with:
- "number": integer song number (shown as large centered number like 229, 230, etc.)
- "title": first line of first verse (NOT the "Tune:" line, NOT the chorus)
- "stanzas": array of stanza objects

Each stanza object has:
- "label": "Verse 1", "Verse 2", etc. for numbered verses, or "Chorus" for chorus sections
- "text": full stanza text with line breaks as \\n
- "is_chorus": true if this is a chorus (marked with "को" in Hindi), false otherwise

IMPORTANT RULES:
1. "को" indicates a chorus section - label it "Chorus" and set is_chorus: true
2. Numbered stanzas (1, 2, 3, etc.) are verses - label them "Verse 1", "Verse 2", etc.
3. Ignore "Tune:" lines completely
4. Extract from BOTH columns, left column first, then right column
5. If a song continues from previous page (starts mid-stanza with no number), use number: 0
6. Preserve exact Hindi text, don't transliterate
7. Use \\n for line breaks within stanza text
8. Order stanzas as they appear (chorus may come before or after verses)

Output ONLY a JSON array of song objects, no other text or markdown. Example:
[
  {
    "number": 229,
    "title": "तुझको मैंने मेरे प्रभुजी",
    "stanzas": [
      {"label": "Verse 1", "text": "तुझको मैंने मेरे प्रभुजी,\\nजब से पाया है", "is_chorus": false},
      {"label": "Chorus", "text": "मेरे गीतों का विषय\\nतू मेरी आराधना", "is_chorus": true}
    ]
  }
]
"""


def extract_songs_from_page(image: Image.Image, page_num: int) -> list:
    """Send page image to Gemini and extract songs."""
    img_bytes = io.BytesIO()
    image.save(img_bytes, format="PNG")
    img_bytes.seek(0)

    try:
        response = model.generate_content(
            [EXTRACTION_PROMPT, {"mime_type": "image/png", "data": img_bytes.read()}],
            generation_config={"temperature": 0.1}
        )

        text = response.text.strip()
        # Clean up markdown code blocks if present
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:])  # Skip first line (```json)
            if text.endswith("```"):
                text = text[:-3]
        text = text.strip()

        songs = json.loads(text)
        print(f"  Page {page_num}: found {len(songs)} songs")
        return songs

    except json.JSONDecodeError as e:
        print(f"  Page {page_num}: JSON parse error - {e}")
        print(f"  Raw: {response.text[:300]}...")
        return []
    except Exception as e:
        print(f"  Page {page_num}: Error - {e}")
        return []


def merge_continuations(all_songs: list) -> list:
    """Merge songs with number 0 (continuations) into previous song."""
    merged = []
    for song in all_songs:
        if song["number"] == 0 and merged:
            # Continuation - append stanzas to previous song
            merged[-1]["stanzas"].extend(song["stanzas"])
        else:
            merged.append(song)
    return merged


def main():
    print(f"Loading PDF: {PDF_PATH}")

    # Load existing songs
    existing_songs = []
    if OUTPUT_PATH.exists():
        with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
            existing_songs = json.load(f)
        last_num = max(s["number"] for s in existing_songs) if existing_songs else 0
        print(f"Found {len(existing_songs)} existing songs, last: #{last_num}")
    else:
        last_num = 0
        print("No existing songs file")

    # Find start page based on last song number
    # Rough mapping: song 228 is around PDF page 113, song 482 is at page 228
    # Each page has ~4-5 songs on average
    if last_num < 229:
        start_page = 113  # Start from songs 229+
    else:
        # Estimate page from song number
        start_page = 113 + (last_num - 228) // 4

    end_page = 228  # Last page of PDF

    print(f"\nConverting PDF pages {start_page+1} to {end_page} (0-indexed: {start_page}-{end_page-1})...")
    images = convert_from_path(
        str(PDF_PATH),
        first_page=start_page + 1,  # pdf2image is 1-indexed
        last_page=end_page,
        dpi=150
    )
    print(f"Converted {len(images)} pages")

    # Extract songs from each page
    all_new_songs = []
    for i, img in enumerate(images):
        pdf_page = start_page + i + 1
        print(f"Processing page {pdf_page}/{end_page}...")
        songs = extract_songs_from_page(img, pdf_page)
        all_new_songs.extend(songs)

        # Rate limit
        time.sleep(0.3)

        # Progress checkpoint every 20 pages
        if (i + 1) % 20 == 0:
            print(f"  === Checkpoint: {len(all_new_songs)} songs extracted ===")

    # Merge continuations
    all_new_songs = merge_continuations(all_new_songs)
    print(f"\nAfter merge: {len(all_new_songs)} songs")

    # Filter to only new songs and add category
    new_songs = []
    for song in all_new_songs:
        if song["number"] > last_num:
            song["category"] = CATEGORY
            # Remove tune field if present (we ignore it)
            song.pop("tune", None)
            song.pop("continues_from_previous", None)
            song.pop("continues_to_next", None)
            new_songs.append(song)

    print(f"New songs (>{last_num}): {len(new_songs)}")

    # Combine with existing
    combined = existing_songs + new_songs
    combined.sort(key=lambda s: s["number"])

    # Remove duplicates (keep first occurrence)
    seen = set()
    deduped = []
    for s in combined:
        if s["number"] not in seen:
            seen.add(s["number"])
            deduped.append(s)
    combined = deduped

    # Check for gaps
    if combined:
        numbers = [s["number"] for s in combined]
        max_num = max(numbers)
        expected = set(range(1, max_num + 1))
        missing = sorted(expected - set(numbers))
        if missing:
            print(f"WARNING: Missing song numbers: {missing[:20]}{'...' if len(missing) > 20 else ''}")

    # Save
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(combined)} songs to {OUTPUT_PATH}")
    if combined:
        print(f"Song range: #{combined[0]['number']} to #{combined[-1]['number']}")


if __name__ == "__main__":
    main()
