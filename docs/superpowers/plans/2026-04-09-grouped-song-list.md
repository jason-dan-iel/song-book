# Grouped Song List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat filtered song list with a grouped-by-letter list where each letter is a sticky section header and the AlphaSidebar scrolls to sections instead of filtering.

**Architecture:** `CategoryList` drops the `filter` state and groups songs into `{ letter, songs }` buckets. Each group renders a sticky `<li class="alpha-group-header">` section header. A `sectionRefs` map wires each header to `scrollIntoView` when the sidebar is dragged/tapped. No changes to `AlphaSidebar`'s interface or internals — only the `onChange` call site changes.

**Tech Stack:** React 18, TypeScript, CSS `position: sticky`, `Element.scrollIntoView`, `scroll-margin-top`

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `src/pages/CategoryList.tsx` | Replace filter with grouped render, add sectionRefs, wire scroll-to |
| Modify | `src/styles.css` | Add `.alpha-group-header`, make `.alpha-sidebar` sticky |

---

## Task 1: Rewrite CategoryList — Grouped Render + Scroll-to

**Files:**
- Modify: `src/pages/CategoryList.tsx`

- [ ] **Step 1: Replace the file with the full new implementation**

```tsx
import { useState, useMemo, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlphaSidebar } from '../components/AlphaSidebar'
import { useSongsByCategory } from '../hooks/useSongs'
import type { Category, Song } from '../types'

function firstChar(title: string): string {
  const c = title.trimStart()[0]
  return c ? c.toUpperCase() : '#'
}

function matchesSearch(song: Song, q: string): boolean {
  if (!q) return true
  const lower = q.toLowerCase()
  return (
    song.title.toLowerCase().includes(lower) ||
    song.number.toString() === q.trim()
  )
}

export function CategoryList() {
  const { category } = useParams<{ category: string }>()
  const cat = (category ?? 'english') as Category
  const { songs, loading, error } = useSongsByCategory(cat)
  const [search, setSearch] = useState('')
  const [activeLetter, setActiveLetter] = useState('')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  // Group songs by first letter of title; '#' first, then A–Z
  const grouped = useMemo(() => {
    const map = new Map<string, Song[]>()
    for (const s of songs) {
      if (!matchesSearch(s, search)) continue
      const letter = firstChar(s.title)
      if (!map.has(letter)) map.set(letter, [])
      map.get(letter)!.push(s)
    }
    const sortedKeys = [...map.keys()].sort((a, b) => {
      if (a === '#') return -1
      if (b === '#') return 1
      return a.localeCompare(b, undefined, { sensitivity: 'base' })
    })
    return sortedKeys.map(letter => ({ letter, songs: map.get(letter)! }))
  }, [songs, search])

  const letters = useMemo(() => grouped.map(g => g.letter), [grouped])

  const handleSidebarChange = useCallback((letter: string) => {
    setActiveLetter(letter)
    const el = sectionRefs.current[letter]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const label = cat === 'youth-camp' ? 'Youth Camp' : cat.charAt(0).toUpperCase() + cat.slice(1)

  return (
    <div>
      <div className="page-header">
        <Link to="/" className="back-arrow">←</Link>
        <span className="page-title">{label}</span>
      </div>

      <div className="search-strip">
        <input
          type="search"
          placeholder="Search by title or number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p style={{ padding: '12px 16px' }}>Loading…</p>}
      {error && <p className="error-msg" style={{ margin: '12px 16px' }}>{error}</p>}

      <div className="list-body">
        <ul className="song-list">
          {grouped.map(({ letter, songs: groupSongs }) => (
            <>
              <li
                key={`header-${letter}`}
                className="alpha-group-header"
                data-letter={letter}
                ref={el => { sectionRefs.current[letter] = el }}
              >
                {letter}
              </li>
              {groupSongs.map((s) => (
                <li key={s.id}>
                  <Link to={`/c/${cat}/${s.number}`}>
                    {s.number}. {s.title}
                  </Link>
                </li>
              ))}
            </>
          ))}
          {!loading && grouped.length === 0 && (
            <li style={{ padding: '12px 16px', color: '#aaa', fontSize: 14 }}>No songs found.</li>
          )}
        </ul>

        {!loading && letters.length > 0 && (
          <AlphaSidebar
            letters={letters}
            active={activeLetter}
            onChange={handleSidebarChange}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/jason_dan_iel/Developer/song-book-app && npm run build
```

Expected: clean build, no TypeScript errors. The `<>` fragment inside `.map()` may emit a React key warning — if so, replace the fragment with `<React.Fragment key={letter}>` (add `import React from 'react'` at top if needed).

If the key warning surfaces, replace the map body:

```tsx
{grouped.map(({ letter, songs: groupSongs }) => (
  <React.Fragment key={letter}>
    <li
      className="alpha-group-header"
      data-letter={letter}
      ref={el => { sectionRefs.current[letter] = el }}
    >
      {letter}
    </li>
    {groupSongs.map((s) => (
      <li key={s.id}>
        <Link to={`/c/${cat}/${s.number}`}>
          {s.number}. {s.title}
        </Link>
      </li>
    ))}
  </React.Fragment>
))}
```

And add at top of file:
```tsx
import React from 'react'
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/CategoryList.tsx
git commit -m "feat: group song list by letter with scroll-to via sidebar"
```

---

## Task 2: CSS — Group Header and Sticky Sidebar

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add `.alpha-group-header` rule**

Add after the `.song-list li a` rule (around line 330, before the `/* Alpha sidebar */` comment):

```css
.song-list li.alpha-group-header {
  position: sticky;
  top: 48px;            /* sits just below the 48px sticky page-header */
  background: var(--lighter);
  padding: 3px 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--header);
  border-bottom: 1px solid var(--border);
  list-style: none;
  z-index: 5;
  scroll-margin-top: 52px;  /* keeps header visible when scrollIntoView fires */
}
```

Note: the selector must be `.song-list li.alpha-group-header` (specificity 0,2,1) to override `.song-list li` (0,1,1) for `padding` and `border-bottom`.

- [ ] **Step 2: Make `.alpha-sidebar` sticky**

Find the existing `.alpha-sidebar` rule and add two properties:

```css
.alpha-sidebar {
  background: var(--light);
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 24px;
  border-left: 1px solid var(--border);
  position: sticky;         /* ← change from relative to sticky */
  top: 48px;                /* ← add: sticks below page-header */
  align-self: flex-start;   /* ← add: allows sticky to work inside flex row */
  max-height: calc(100vh - 48px);  /* ← add: caps height to viewport */
  touch-action: none;
}
```

Note: `position: sticky` subsumes the previous `position: relative` — the bubble's `position: absolute` still works inside a sticky parent.

- [ ] **Step 3: Verify build**

```bash
cd /Users/jason_dan_iel/Developer/song-book-app && npm run build
```

Expected: clean build, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/styles.css
git commit -m "style: sticky letter group headers and sticky alpha sidebar"
```

---

## Visual Verification Checklist

- [ ] Songs grouped under A, B, C… letter headers
- [ ] Songs starting with a digit appear under `#` group at top
- [ ] Section headers stick just below the teal page-header while scrolling through that group
- [ ] Dragging the sidebar scrolls smoothly to the tapped letter's section
- [ ] Sidebar itself stays visible (sticky) as you scroll the list
- [ ] Number search still works (type a number in the search bar, matching song appears)
- [ ] Title search still works (only matching songs/groups shown, empty groups hidden)
- [ ] No "No songs found" flash on initial load
