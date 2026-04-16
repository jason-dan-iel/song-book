# Song Book App — UI Redesign Spec

## Overview

A comprehensive UI overhaul of the Song Book app (Brethren Assembly Jodhpur). The app serves two audiences: congregation members on phones following along during services, and worship leaders on tablets/laptops doing quick song lookup. The redesign modernizes the visual language while preserving all existing functionality.

## Design Principles

- **Apple-like minimalism** — clean, uncluttered, generous whitespace. Every element earns its place.
- **Modern + bold** — contemporary aesthetic with vibrant accents, not traditional/hymnal-book.
- **Mobile-first** — optimized for phone use during services, gracefully scales to desktop.
- **Reading comfort** — lyrics are the primary content; typography and spacing prioritize readability.

## Color Palette

Keep the existing green/teal identity but modernize the application.

### CSS Custom Properties

```
--color-primary-dark:   #1a4a43    /* Deep teal — gradient start */
--color-primary:        #2d6b62    /* Teal — gradient end, accent text */
--color-primary-light:  #4a9189    /* Light teal — secondary accents */
--color-bg-page:        #f5f5f0    /* Warm off-white page background */
--color-bg-card:        #ffffff    /* White card surfaces */
--color-bg-chorus:      linear-gradient(135deg, rgba(45,107,98,0.08), rgba(45,107,98,0.14))
--color-border-chorus:  rgba(45,107,98,0.2)
--color-text-primary:   #1a2e2c    /* Near-black teal for headings */
--color-text-body:      #333333    /* Dark gray for body text */
--color-text-muted:     #888888    /* Gray for secondary text */
--color-text-placeholder: #aaaaaa  /* Light gray for placeholders */
--color-shadow:         rgba(0,0,0,0.04)  /* Subtle card shadows */
--color-divider:        #f0eeeb    /* Faint warm divider */
```

### Gradient Header

All pages use a gradient header: `linear-gradient(135deg, #1a4a43, #2d6b62)` for a cohesive branded feel.

## Typography

**Font family:** Inter (Google Fonts) — single family, fully sans-serif.

Replace both Cormorant Garamond and Nunito with Inter. Remove the Cormorant Garamond preload from `index.html`.

### Scale

| Role | Size | Weight | Tracking |
|------|------|--------|----------|
| Page title (hero) | 26px | 800 | -0.5px |
| Song title (detail banner) | 22px | 800 | -0.3px |
| Category name / Song name in list | 15-16px | 600-700 | 0 |
| Body text (lyrics) | 15px (user-adjustable 10-28px) | 400 | 0 |
| Chorus lyrics | 15px | 500 | 0 |
| Labels (VERSE 1, CHORUS, etc.) | 10px | 600-700 | 1.5px uppercase |
| Secondary text (counts, subtitles) | 12px | 400 | 0 |
| Tiny labels (song count badges) | 11px | 600 | 0 |

### Line Height

- Lyrics: `line-height: 1.9` — generous spacing for singability
- UI text: `line-height: 1.4-1.5` — standard

## Layout

### Responsive Strategy

- **Mobile (< 640px):** Full-width content with 12px horizontal padding.
- **Desktop (≥ 640px):** Content constrained to `max-width: 640px`, centered horizontally. Page background (`#f5f5f0`) fills the viewport.

### Border Radius

Consistent rounded corners throughout:
- Cards: `14-16px`
- Buttons/badges: `6-12px`
- Pill badges: `20px`
- Search bar: `12px`

## Page Designs

### Home Page — Hero Header + Minimal List

**Header section:**
- Full-width gradient background: `linear-gradient(160deg, #1a4a43, #2d6b62, #4a9189)`
- Generous padding (32px vertical)
- Centered layout:
  - App title "Song Book" — 26px, weight 800, white
  - Subtitle "BRETHREN ASSEMBLY JODHPUR" — 13px, uppercase, letter-spacing 1px, white at 60% opacity
  - Stats row: two pill badges ("X songs", "6 categories") in `rgba(255,255,255,0.15)` background

**Category list section:**
- Single white card (`border-radius: 16px`) containing all categories as rows
- Each row:
  - Left: colored dot (8px circle) + category name (15px, weight 600)
  - Right: song count + arrow indicator ("124 →") in muted text
  - Divider between rows: 1px solid `#f0eeeb`
  - Last row: no divider
- Category dot colors: English (#2d6b62), Hindi (#E17055), Chorus (#FDCB6E), Youth Camp (#6C5CE7), YC Chorus (#0984E3), Special (#E17055)
- Admin link: subtle, positioned in header or as a small link below the list

### Category List Page — Unified Search + Song List

**Header:**
- Gradient header bar with back button ("← Home"), centered category title, and empty right space for balance
- Sticky positioning

**Search/sort bar (sticky, below header):**
- Single white rounded bar containing:
  - Search icon (left)
  - Text input placeholder "Search songs..."
  - Vertical 1px divider
  - Two small toggle buttons: "A-Z" (active: green bg, white text) and "#" (inactive: light gray bg)
- `border-radius: 12px`, subtle shadow

**Song list:**
- Songs grouped in a single white card (`border-radius: 14px`)
- Each song row:
  - Song title (15px, weight 600, dark)
  - Song number below title (12px, muted)
  - Right arrow indicator
  - 1px divider between rows
- In A-Z mode: letter section headers (green text, slightly tinted background row) within the card
- In numeric mode: plain list ordered by number

**Removed:** Alpha sidebar (AlphaSidebar component). The search bar provides sufficient navigation. The AlphaSidebar.tsx component and related CSS can be deleted.

### Song Detail Page — Card-per-Verse with Floating Chorus Badge

**Header:**
- Gradient header bar with back link ("← English") and font size controls (A−/A+)
- Sticky positioning

**Title banner:**
- Full-width gradient card (`border-radius: 14px`, gradient `#2d6b62` → `#4a9189`)
- Song number: 11px, white at 70% opacity, uppercase letter-spacing
- Song title: 22px, weight 800, white

**Verse cards:**
- Each verse in its own white card (`border-radius: 14px`, subtle shadow)
- Verse label: 10px uppercase, gray, letter-spacing 1.5px, inside the card at top
- Lyrics: 15px (user-adjustable), `line-height: 1.9`, `white-space: pre-wrap`
- 12px gap between cards

**Chorus cards (floating badge style):**
- Extra top margin (16px) to accommodate the badge
- "CHORUS" badge: positioned absolutely, `top: -9px; left: 16px`
  - Background: `#2d6b62`, white text, 9px, weight 700, letter-spacing 1.5px
  - Padding: `3px 12px`, `border-radius: 6px`
- Card body: tinted green gradient background, `border-radius: 14px`
  - Border: `1.5px solid rgba(45,107,98,0.2)`
  - Lyrics: weight 500 (slightly bolder than verse text)

**Sticky chorus behavior:** Preserve the existing IntersectionObserver logic — when the inline chorus scrolls above the viewport, a sticky chorus bar appears. Restyle to match the new design language (green gradient background, matching typography).

**Bottom navigation:**
- Two buttons side by side:
  - "← Prev #N" — white card style, green text
  - "Next #N →" — green filled, white text
- `border-radius: 12px`, 10px gap between them

**Font size controls:** Preserve existing localStorage persistence and 10-28px range. Restyle the A−/A+ buttons to match the new header design.

### Admin Page

Minimal restyling to match the new design language:
- Gradient header
- Inter font throughout
- Updated button styles (rounded, green primary buttons)
- Form inputs with rounded corners and consistent spacing
- Table styling with cleaner borders and hover states
- No structural changes to admin functionality

## Micro-interactions & Animations

- **Page transitions:** Smooth fade or slide transitions between routes (CSS-based, no library needed)
- **Card hover/tap:** Subtle scale transform (`scale(0.98)` on active) and shadow change on song list items
- **Search bar focus:** Border color transition to green, subtle shadow expansion
- **Sort toggle:** Smooth background-color transition on the active pill
- **Sticky header:** Smooth shadow appearance when scrolling (shadow transitions from 0 to subtle)
- **Button press:** Brief scale-down (`transform: scale(0.96)`) with 100ms transition
- **Navigation:** Smooth opacity transitions on prev/next buttons

All transitions: `150-200ms ease` unless otherwise specified. No spring physics or complex animation libraries needed.

## Files to Modify

| File | Changes |
|------|---------|
| `index.html` | Replace Cormorant Garamond with Inter in Google Fonts preload |
| `src/styles.css` | Full rewrite of styles — new CSS custom properties, all component styles |
| `src/pages/Home.tsx` | Restructure to hero header + grouped list layout |
| `src/pages/CategoryList.tsx` | New search/sort bar, remove alpha sidebar integration, restyle song list |
| `src/pages/SongDetail.tsx` | Card-per-verse layout, floating chorus badge, new prev/next buttons |
| `src/pages/Admin.tsx` | Light restyling — font, buttons, inputs, table |
| `src/components/SongForm.tsx` | Light restyling — font, inputs, buttons |
| `src/components/AlphaSidebar.tsx` | Delete this file |
| `src/categories.ts` | Add accent color per category for the colored dots |

## What's NOT Changing

- **Data model** — no Supabase schema changes
- **Routing** — same URL structure
- **Core features** — search, sort, font size adjustment, sticky chorus, admin CRUD
- **Authentication** — same Supabase auth flow
- **Deployment** — same GitHub Pages setup
- **Hooks** — same useSongs.ts custom hooks
