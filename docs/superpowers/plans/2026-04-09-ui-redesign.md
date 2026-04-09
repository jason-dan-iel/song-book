# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Song Book app with a soft teal palette, contextual per-page headers (no global Navbar), a right-edge AlphaSidebar on the song list, and a fixed bottom prev/next bar on the song detail page.

**Architecture:** CSS custom properties on `:root` drive the entire palette — one change updates every screen. The shared `<Navbar>` is removed from the router; each page owns its own header. `useSongCount` is a new lightweight hook for category counts. `AlphaSidebar` replaces `LetterFilter`. No routing changes required.

**Tech Stack:** React 18, React Router v6, TypeScript, Vite, Supabase JS v2

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/styles.css` | CSS custom properties + all new/updated styles |
| Modify | `src/router.tsx` | Remove `<Navbar>` |
| Modify | `src/hooks/useSongs.ts` | Add `useSongCount` hook |
| Modify | `src/pages/Home.tsx` | Teal app header, category rows with count badges, Admin footer |
| Create | `src/components/AlphaSidebar.tsx` | Right-edge letter index; filtering behavior |
| Modify | `src/pages/CategoryList.tsx` | Teal page header, search strip, AlphaSidebar |
| Modify | `src/pages/SongDetail.tsx` | Compact teal header, inline chorus, fixed bottom nav |
| Delete | `src/components/Navbar.tsx` | Replaced by per-page headers |
| Delete | `src/components/LetterFilter.tsx` | Replaced by AlphaSidebar |
| Delete | `src/components/StickyChorus.tsx` | Already unused |

---

## Task 1: CSS — Custom Properties and Base Styles

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add `:root` custom properties at the top of `src/styles.css`**

Insert as the very first rule (before `* { box-sizing: border-box; }`):

```css
:root {
  --header:      #3d7870;
  --accent:      #5a9e97;
  --light:       #e4f4f2;
  --lighter:     #f0faf9;
  --border:      #daeeed;
  --page:        #fafefe;
  --text-accent: #3d7870;
  --badge-bg:    #e4f4f2;
  --badge-text:  #2d6560;
}
```

- [ ] **Step 2: Update `body` background and `#root` border colours**

Replace the existing `body` rule:

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  font-size: 15px;
  color: #222;
  background: #e8efee;
  margin: 0;
  padding: 0;
}
```

Replace the existing `#root` rule:

```css
#root {
  max-width: 860px;
  margin: 0 auto;
  background: var(--page);
  min-height: 100vh;
  padding: 0 0 40px;
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
}
```

- [ ] **Step 3: Update link colours**

Replace the existing `a` and `a:visited` rules:

```css
a {
  color: var(--text-accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

a:visited {
  color: var(--text-accent);
}
```

- [ ] **Step 4: Update `.button.primary` to use `--header`**

Replace the existing `button.primary` and `button.primary:hover` rules:

```css
button.primary {
  background: var(--header);
  color: #fff;
  border-color: var(--header);
}

button.primary:hover {
  background: var(--accent);
  border-color: var(--accent);
}
```

- [ ] **Step 5: Replace the entire Navbar section with per-page header styles**

Remove the existing `/* Navbar */` block (lines covering `.navbar`, `.navbar .site-title`, `.navbar .site-title:visited`, `.navbar a:not(.site-title)`, `.navbar a:not(.site-title):hover`) and replace with:

```css
/* App header (Home page) */
.app-header {
  background: var(--header);
  color: #fff;
  padding: 18px 16px 14px;
}

.app-header .app-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.app-header .app-subtitle {
  font-size: 12px;
  opacity: 0.72;
  margin-top: 3px;
}

/* Page header (CategoryList, SongDetail) */
.page-header {
  background: var(--header);
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 20;
}

.page-header .back-arrow {
  font-size: 20px;
  line-height: 1;
  opacity: 0.9;
  text-decoration: none;
  color: #fff;
}

.page-header .page-title {
  font-size: 16px;
  font-weight: 700;
}

/* Song header (SongDetail) */
.song-header {
  background: var(--header);
  color: #fff;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 20;
}

.song-header .back-link {
  font-size: 13px;
  color: #fff;
  text-decoration: none;
  opacity: 0.9;
}

.song-header .back-link:visited {
  color: #fff;
}

.song-header .song-num {
  font-size: 14px;
  font-weight: 700;
}

.song-header .font-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.song-header .font-controls button {
  border: 1px solid rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.15);
  color: #fff;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.song-header .font-controls button:hover {
  background: rgba(255,255,255,0.25);
}

.song-header .font-size-display {
  font-size: 11px;
  min-width: 28px;
  text-align: center;
  opacity: 0.7;
}
```

- [ ] **Step 6: Replace Home page styles**

Remove the existing `/* Home page */` block and replace with:

```css
/* Home page */
.home-body {
  padding: 10px 12px;
}

.cat-row {
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
  background: #fff;
  cursor: pointer;
  transition: background 0.12s;
}

.cat-row:hover {
  background: var(--lighter);
}

.cat-row a {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  text-decoration: none;
}

.cat-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-accent);
}

.cat-badge {
  font-size: 12px;
  background: var(--badge-bg);
  color: var(--badge-text);
  border-radius: 10px;
  padding: 2px 10px;
  font-weight: 600;
}

.home-footer {
  padding: 16px;
  text-align: right;
  border-top: 1px solid var(--border);
}

.home-footer a {
  font-size: 12px;
  color: #bbb;
}

.home-footer a:hover {
  color: #888;
}
```

- [ ] **Step 7: Replace Category list styles**

Remove the existing `/* Category list */` block and replace with:

```css
/* Category list */
.search-strip {
  padding: 10px 12px;
  background: var(--lighter);
  border-bottom: 1px solid var(--border);
}

.search-strip input {
  width: 100%;
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  color: #333;
}

.search-strip input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(90,158,151,0.15);
}

.list-body {
  display: flex;
  background: #fff;
}

.song-list {
  flex: 1;
  list-style: none;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.song-list li {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f8f7;
  line-height: 1.4;
}

.song-list li:hover {
  background: var(--lighter);
}

.song-list li a {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-accent);
  text-decoration: none;
}

/* Alpha sidebar */
.alpha-sidebar {
  background: var(--light);
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 24px;
  border-left: 1px solid var(--border);
}

.alpha-sidebar button {
  background: none;
  border: none;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  color: var(--badge-text);
  cursor: pointer;
  border-radius: 4px;
  line-height: 1.6;
  width: 100%;
  text-align: center;
}

.alpha-sidebar button:hover {
  background: var(--border);
}

.alpha-sidebar button.active {
  background: var(--header);
  color: #fff;
  font-size: 11px;
}
```

- [ ] **Step 8: Replace Song detail styles**

Remove the existing `/* Song detail */` block and replace with:

```css
/* Song detail */
.song-title-area {
  padding: 14px 16px 6px;
  background: #fff;
}

.song-title {
  font-size: 20px;
  font-weight: 700;
  color: #111;
  line-height: 1.3;
}

.song-body {
  padding: 4px 16px 80px;
  background: #fff;
}

.stanza {
  margin-bottom: 20px;
  white-space: pre-wrap;
  line-height: 1.8;
}

.stanza-label {
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
  margin-bottom: 5px;
}

.stanza-chorus {
  background: var(--light);
  border-top: 2px solid var(--accent);
  border-bottom: 2px solid var(--accent);
  padding: 12px 16px;
  margin: 0 -16px 20px;
}

.stanza-chorus .stanza-label {
  color: var(--text-accent);
}

/* Bottom navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 860px;
  display: flex;
  border-top: 2px solid var(--border);
  background: #fff;
  z-index: 30;
}

.bottom-nav .nav-btn {
  flex: 1;
  padding: 16px;
  font-size: 15px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-family: inherit;
  transition: background 0.1s;
}

.bottom-nav .nav-btn.prev {
  background: var(--lighter);
  color: var(--text-accent);
  border-right: 1px solid var(--border);
}

.bottom-nav .nav-btn.prev:hover {
  background: var(--light);
}

.bottom-nav .nav-btn.next {
  background: var(--header);
  color: #fff;
}

.bottom-nav .nav-btn.next:hover {
  background: var(--accent);
}

.bottom-nav .nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
```

- [ ] **Step 9: Verify build**

```bash
cd /Users/jason_dan_iel/Developer/song-book-app && npm run build
```

Expected: no TypeScript errors, Vite build succeeds.

- [ ] **Step 10: Commit**

```bash
git add src/styles.css
git commit -m "style: add teal CSS custom properties and redesigned component styles"
```

---

## Task 2: Remove Navbar from Router

**Files:**
- Modify: `src/router.tsx`

- [ ] **Step 1: Remove Navbar from `src/router.tsx`**

Replace the entire file with:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { CategoryList } from './pages/CategoryList'
import { SongDetail } from './pages/SongDetail'
import { Admin } from './pages/Admin'

export function AppRouter() {
  return (
    <BrowserRouter basename="/song-book">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/c/:category" element={<CategoryList />} />
        <Route path="/c/:category/:number" element={<SongDetail />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/jason_dan_iel/Developer/song-book-app && npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/router.tsx
git commit -m "feat: remove shared Navbar from router"
```

---

## Task 3: Add `useSongCount` Hook

**Files:**
- Modify: `src/hooks/useSongs.ts`

- [ ] **Step 1: Add `useSongCount` to the end of `src/hooks/useSongs.ts`**

Append after the existing `invalidateCache` function:

```ts
export function useSongCount(category: Category): number | null {
  const [count, setCount] = useState<number | null>(
    cache[category] ? cache[category].length : null
  )

  useEffect(() => {
    if (cache[category]) {
      setCount(cache[category].length)
      return
    }
    supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('category', category)
      .then(({ count: c, error }) => {
        if (!error && c !== null) setCount(c)
      })
  }, [category])

  return count
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/jason_dan_iel/Developer/song-book-app && npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSongs.ts
git commit -m "feat: add useSongCount hook for lightweight category counts"
```

---

## Task 4: Redesign Home Page

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Replace `src/pages/Home.tsx`**

```tsx
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../categories'
import { useSongCount } from '../hooks/useSongs'
import type { Category } from '../types'

function CategoryRow({ categoryKey, label }: { categoryKey: string; label: string }) {
  const count = useSongCount(categoryKey as Category)
  return (
    <div className="cat-row">
      <Link to={`/c/${categoryKey}`}>
        <span className="cat-name">{label}</span>
        <span className="cat-badge">{count ?? '—'}</span>
      </Link>
    </div>
  )
}

export function Home() {
  return (
    <div>
      <div className="app-header">
        <div className="app-title">Song Book</div>
        <div className="app-subtitle">Brethren Assembly Jodhpur</div>
      </div>
      <div className="home-body">
        {CATEGORIES.map((c) => (
          <CategoryRow key={c.key} categoryKey={c.key} label={c.label} />
        ))}
      </div>
      <div className="home-footer">
        <Link to="/admin">Admin</Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/jason_dan_iel/Developer/song-book-app && npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: redesign Home page with teal header and song count badges"
```

---

## Task 5: Create AlphaSidebar Component

**Files:**
- Create: `src/components/AlphaSidebar.tsx`

- [ ] **Step 1: Create `src/components/AlphaSidebar.tsx`**

```tsx
interface Props {
  letters: string[]
  active: string
  onChange: (letter: string) => void
}

export function AlphaSidebar({ letters, active, onChange }: Props) {
  return (
    <div className="alpha-sidebar">
      {letters.map((l) => (
        <button
          key={l}
          className={active === l ? 'active' : ''}
          onClick={() => onChange(active === l ? 'All' : l)}
          aria-label={`Filter by ${l}`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
```

Note: tapping an already-active letter deselects it (resets to `'All'`), showing all songs again.

- [ ] **Step 2: Verify build**

```bash
cd /Users/jason_dan_iel/Developer/song-book-app && npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/AlphaSidebar.tsx
git commit -m "feat: add AlphaSidebar component for right-edge letter index"
```

---

## Task 6: Redesign CategoryList Page

**Files:**
- Modify: `src/pages/CategoryList.tsx`

- [ ] **Step 1: Replace `src/pages/CategoryList.tsx`**

```tsx
import { useState, useMemo } from 'react'
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
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const letters = useMemo(() => {
    const set = new Set<string>()
    for (const s of songs) set.add(firstChar(s.title))
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }, [songs])

  const visible = songs.filter((s) => {
    const letterMatch = filter === 'All' || firstChar(s.title) === filter
    return letterMatch && matchesSearch(s, search)
  })

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
          onChange={(e) => { setSearch(e.target.value); setFilter('All') }}
        />
      </div>

      {loading && <p style={{ padding: '12px 16px' }}>Loading…</p>}
      {error && <p className="error-msg" style={{ margin: '12px 16px' }}>{error}</p>}

      <div className="list-body">
        <ul className="song-list">
          {visible.map((s) => (
            <li key={s.id}>
              <Link to={`/c/${cat}/${s.number}`}>
                {s.number}. {s.title}
              </Link>
            </li>
          ))}
          {!loading && visible.length === 0 && (
            <li style={{ padding: '12px 16px', color: '#aaa', fontSize: 14 }}>No songs found.</li>
          )}
        </ul>

        {!loading && letters.length > 0 && (
          <AlphaSidebar
            letters={letters}
            active={filter}
            onChange={(l) => { setFilter(l); setSearch('') }}
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

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CategoryList.tsx
git commit -m "feat: redesign CategoryList with teal header and AlphaSidebar"
```

---

## Task 7: Redesign SongDetail Page

**Files:**
- Modify: `src/pages/SongDetail.tsx`

- [ ] **Step 1: Replace `src/pages/SongDetail.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSong, useSongsByCategory } from '../hooks/useSongs'
import type { Category } from '../types'

const LS_KEY = 'fontSize'
const DEFAULT_SIZE = 15

function loadSize(): number {
  const v = localStorage.getItem(LS_KEY)
  return v ? parseInt(v, 10) : DEFAULT_SIZE
}

export function SongDetail() {
  const { category, number } = useParams<{ category: string; number: string }>()
  const cat = (category ?? 'english') as Category
  const num = parseInt(number ?? '1', 10)

  const { song, loading, error } = useSong(cat, num)
  const { songs } = useSongsByCategory(cat)

  const [fontSize, setFontSize] = useState(loadSize)

  useEffect(() => {
    localStorage.setItem(LS_KEY, String(fontSize))
  }, [fontSize])

  const prevSong = songs.find((s) => s.number === num - 1)
  const nextSong = songs.find((s) => s.number === num + 1)

  const catLabel = cat === 'youth-camp' ? 'Youth Camp' : cat.charAt(0).toUpperCase() + cat.slice(1)

  if (loading) return <p style={{ padding: '16px' }}>Loading…</p>
  if (error) return <p className="error-msg" style={{ margin: '16px' }}>{error}</p>
  if (!song) return <p style={{ padding: '16px' }}>Song not found.</p>

  return (
    <div>
      <div className="song-header">
        <Link to={`/c/${cat}`} className="back-link">← {catLabel}</Link>
        <span className="song-num">#{song.number}</span>
        <div className="font-controls">
          <button onClick={() => setFontSize((s) => Math.max(10, s - 1))}>A−</button>
          <span className="font-size-display">{fontSize}px</span>
          <button onClick={() => setFontSize((s) => Math.min(28, s + 1))}>A+</button>
        </div>
      </div>

      <div className="song-title-area">
        <div className="song-title" style={{ fontSize: fontSize + 4 }}>{song.title}</div>
      </div>

      <div className="song-body" style={{ fontSize }}>
        {song.stanzas.map((stanza, i) => (
          <div key={i} className={stanza.is_chorus ? 'stanza stanza-chorus' : 'stanza'}>
            <div className="stanza-label">{stanza.label}</div>
            {stanza.text}
          </div>
        ))}
      </div>

      <div className="bottom-nav">
        {prevSong
          ? <button className="nav-btn prev" onClick={() => window.location.href = `/song-book/c/${cat}/${prevSong.number}`}>← {prevSong.number}</button>
          : <button className="nav-btn prev" disabled>←</button>}
        {nextSong
          ? <button className="nav-btn next" onClick={() => window.location.href = `/song-book/c/${cat}/${nextSong.number}`}>{ nextSong.number} →</button>
          : <button className="nav-btn next" disabled>→</button>}
      </div>
    </div>
  )
}
```

> **Note on bottom-nav navigation:** Using `window.location.href` is intentional here to avoid importing `useNavigate` solely for button clicks. If the codebase later moves to `useNavigate`, update these to `navigate(\`/c/${cat}/${prevSong.number}\`)`.

- [ ] **Step 2: Verify build**

```bash
cd /Users/jason_dan_iel/Developer/song-book-app && npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/SongDetail.tsx
git commit -m "feat: redesign SongDetail with compact header and fixed bottom nav"
```

---

## Task 8: Cleanup — Delete Unused Components

**Files:**
- Delete: `src/components/Navbar.tsx`
- Delete: `src/components/LetterFilter.tsx`
- Delete: `src/components/StickyChorus.tsx`

- [ ] **Step 1: Delete the three unused component files**

```bash
rm /Users/jason_dan_iel/Developer/song-book-app/src/components/Navbar.tsx
rm /Users/jason_dan_iel/Developer/song-book-app/src/components/LetterFilter.tsx
rm /Users/jason_dan_iel/Developer/song-book-app/src/components/StickyChorus.tsx
```

- [ ] **Step 2: Verify build (confirms nothing still imports them)**

```bash
cd /Users/jason_dan_iel/Developer/song-book-app && npm run build
```

Expected: no TypeScript errors. If any "cannot find module" error appears, check for stray imports and remove them.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete unused Navbar, LetterFilter, StickyChorus components"
```

---

## Task 9: Fix bottom-nav prev/next to use React Router

**Files:**
- Modify: `src/pages/SongDetail.tsx`

> This replaces the `window.location.href` navigation from Task 7 with proper React Router `Link` elements wrapped as buttons — avoids full page reload.

- [ ] **Step 1: Update the bottom-nav section in `src/pages/SongDetail.tsx`**

Replace the `<div className="bottom-nav">` block:

```tsx
      <div className="bottom-nav">
        {prevSong
          ? <Link to={`/c/${cat}/${prevSong.number}`} className="nav-btn prev">← {prevSong.number}</Link>
          : <button className="nav-btn prev" disabled>←</button>}
        {nextSong
          ? <Link to={`/c/${cat}/${nextSong.number}`} className="nav-btn next">{nextSong.number} →</Link>
          : <button className="nav-btn next" disabled>→</button>}
      </div>
```

Also add these CSS rules to `src/styles.css` inside the `.bottom-nav` block so `<Link>` renders like the `<button>`:

```css
.bottom-nav a.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/jason_dan_iel/Developer/song-book-app && npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/SongDetail.tsx src/styles.css
git commit -m "fix: use React Router Link for bottom-nav prev/next (avoids full reload)"
```

---

## Visual Verification Checklist

After all tasks complete, run `npm run dev` and check:

- [ ] **Home:** Teal header shows "Song Book" + subtitle. All 7 categories listed with count badges (show `—` until loaded). Admin link in footer.
- [ ] **Song List:** Teal sticky header with ← back arrow + category name. Search bar visible. Alpha sidebar on right edge. Tapping a letter filters list; tapping same letter again shows all.
- [ ] **Song Detail:** Teal sticky header with ← Category · #N · A− N px A+. Title large below header. Chorus uses teal colours (not yellow). Fixed bottom bar with ← prev / next → buttons.
- [ ] **Nav works:** Tap Home category → Song List → Song Detail → back navigates correctly at each step.
- [ ] **Font size persists** across songs (localStorage).
- [ ] **No Navbar** visible anywhere.
