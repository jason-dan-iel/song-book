# UI Redesign — Song Book App

**Date:** 2026-04-09  
**Status:** Approved

## Overview

Redesign the Song Book app UI for a simple, clean, mobile-first experience. Primary use case: mobile phone during church services. Goal: dumbproof navigation so anyone can find and read a song without friction.

## Design Decisions

### Color Palette — Soft Teal (Variant C)

| Token | Value | Usage |
|---|---|---|
| `--header` | `#3d7870` | App/page headers, next-button background |
| `--accent` | `#5a9e97` | Chorus border, hover states |
| `--light` | `#e4f4f2` | Chorus background, sidebar index bg, badges |
| `--lighter` | `#f0faf9` | Search bar bg, hover bg, prev-button bg |
| `--border` | `#daeeed` | Card borders, dividers |
| `--page` | `#fafefe` | Page background |
| `--text-accent` | `#3d7870` | Links, song titles, category names |
| `--badge-bg` | `#e4f4f2` | Song count badge background |
| `--badge-text` | `#2d6560` | Song count badge text |

### Typography & Spacing

- Body font: existing system stack (unchanged)  
- Base font size: 15px (unchanged, user-adjustable in Song Detail)  
- Row padding increased: `13px 14px` for comfortable thumb tapping  
- Song list rows: `11px 14px`

---

## Screen 1 — Home

**What changes:**
- Remove the existing `<Navbar>` component from all screens
- Replace the `<h1>` + `<p>` header with a full-width teal app header (title + subtitle)
- Category list rows: full-width, rounded border, teal text, song-count badge on right
- Add an "Admin" link in a small footer below the category list (replaces Navbar Admin link)

**Song count badge:** add a `useSongCount(category)` hook that runs a lightweight `select('id', { count: 'exact', head: true })` Supabase query — no full song data fetched. All 7 counts load in parallel on mount; each shows `—` until resolved.

**Layout:**
```
[ App Header: "Song Book" / "Brethren Assembly Jodhpur" ]
[ Category row: "English"         [324] ]
[ Category row: "Hindi"           [210] ]
[ Category row: "Youth Camp"       [86] ]
[ Category row: "Chorus — English" [54] ]
[ Category row: "Chorus — Hindi"   [48] ]
[ Category row: "YC Chorus — Hindi"[32] ]
[ Category row: "YC Chorus — English"[28]]
[ Footer: Admin (small, right-aligned) ]
```

---

## Screen 2 — Song List (CategoryList)

**What changes:**
- Page header: teal bar with `←` back arrow + category name (replaces `.category-heading` paragraph)
- Search bar: always visible below header in a light teal tinted strip
- Remove the `<LetterFilter>` component (wrapping button row)
- Add a sidebar index on the right edge: teal-tinted strip with alphabet letters, tapping jumps to that section
- Song rows: larger padding, teal text

**Sidebar index behaviour:**
- Letters rendered = only letters that exist in the current song list (same logic as current `LetterFilter`)
- Tapping a letter scrolls to the first song starting with that letter
- Active letter (currently visible section) highlighted in darker teal

**Layout:**
```
[ Page Header: ← English ]
[ Search bar strip ]
[ Song list                    | A ]
[  1. A Mighty Fortress        | B ]
[  2. Abide with Me            | C ]
[  3. All Creatures…           | D ]
[  4. Amazing Grace            | … ]
[  …                           | Z ]
```

---

## Screen 3 — Song Detail

**What changes:**
- Replace `.song-nav` bar with a teal header containing: `← CategoryName` (back link) · `#42` (song number, centred) · `A− 15px A+` (font controls, right)
- Song title (`Amazing Grace`) displayed prominently below the header on white bg
- Stanza labels: use `--accent` colour instead of grey
- Chorus block: `--light` background, `--accent` top/bottom border (replaces yellow)
- Remove the sticky chorus behaviour — chorus renders inline in natural position only
- Add a fixed bottom nav bar: `← 41` (prev, teal bg) | `43 →` (next, dark teal bg)
- If no prev/next song, the respective button is disabled (`.disabled` opacity)

**Layout:**
```
[ Song Header: ← English · #42 · A− 15px A+ ]
[ Song Title: Amazing Grace                  ]
[ Verse 1 label                              ]
[ Verse 1 text                               ]
[ Chorus (teal bg strip, full-width)         ]
[ Verse 2 label                              ]
[ Verse 2 text                               ]
[ …                                          ]
[ Bottom Nav: [ ← 41 ] [ 43 → ]             ]
```

---

## Component Changes

| Component | Change |
|---|---|
| `Navbar` | **Removed.** Each page has its own contextual header. |
| `LetterFilter` | **Replaced** by sidebar index (`AlphaSidebar` component). |
| `StickyChorus` | **Deleted.** File exists but is already unused. Chorus is styled inline via CSS only. |
| `Home` | New teal header, category rows with badges, Admin footer. |
| `CategoryList` | New page header, search strip, sidebar index. |
| `SongDetail` | New song header, inline chorus style, fixed bottom nav. |

---

## CSS Strategy

All new colour values use CSS custom properties on `:root`. The existing `styles.css` is updated in-place — no new CSS files. Existing classes are updated or replaced.

The `.stanza-chorus` sticky positioning is removed. Chorus is styled inline with the new teal palette.

---

## Out of Scope

- Dark mode  
- Hindi keyboard / input improvements  
- Admin page styling  
- Any data or routing changes  
