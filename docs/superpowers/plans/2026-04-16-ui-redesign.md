# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Use sonnet or haiku model for execution agents. Do NOT commit anything to git.**

**Goal:** Comprehensive UI overhaul — modern Apple-like minimalism with bold green/teal accents, Inter font, card-based layouts, and smooth micro-interactions.

**Architecture:** Pure visual redesign — no data model, routing, or logic changes. Replace global CSS and update JSX structure in each page component. Delete AlphaSidebar component. Add accent colors to category metadata.

**Tech Stack:** React 18, TypeScript, CSS (global stylesheet), Inter (Google Fonts)

**Spec:** `docs/superpowers/specs/2026-04-16-ui-redesign-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `index.html` | Modify | Swap Google Fonts from Cormorant+Nunito to Inter |
| `src/categories.ts` | Modify | Add `color` field per category for colored dots |
| `src/styles.css` | Rewrite | Full CSS overhaul — new variables, all component styles |
| `src/pages/Home.tsx` | Modify | Hero header + minimal grouped list layout |
| `src/pages/CategoryList.tsx` | Modify | Unified search/sort bar, remove AlphaSidebar, restyle song list |
| `src/pages/SongDetail.tsx` | Modify | Card-per-verse layout, floating chorus badge, new bottom nav |
| `src/pages/Admin.tsx` | Modify | Light restyling — gradient header, rounded inputs/buttons |
| `src/components/SongForm.tsx` | Modify | Light restyling — rounded inputs, updated button classes |
| `src/components/AlphaSidebar.tsx` | Delete | No longer used |

---

### Task 1: Update Google Fonts and Category Metadata

**Files:**
- Modify: `index.html`
- Modify: `src/categories.ts`

- [ ] **Step 1: Replace Google Fonts link in index.html**

Replace line 9 in `index.html`:

```html
<!-- OLD -->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- NEW -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Add accent colors to categories.ts**

Replace the full content of `src/categories.ts`:

```typescript
import type { Category } from './types'

export interface CategoryMeta {
  key: Category
  label: string
  color: string
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'english',    label: 'English',           color: '#2d6b62' },
  { key: 'hindi',      label: 'Hindi',             color: '#E17055' },
  { key: 'chorus',     label: 'Chorus',            color: '#FDCB6E' },
  { key: 'youth-camp', label: 'Youth Camp',        color: '#6C5CE7' },
  { key: 'yc-chorus',  label: 'Youth Camp Chorus', color: '#0984E3' },
  { key: 'special',    label: 'Special Songs',     color: '#E17055' },
]
```

- [ ] **Step 3: Verify the dev server starts without errors**

Run: `npm run dev` and open in browser. The page will look broken (old CSS referencing old fonts) — that's expected. Confirm no console errors about missing fonts or TypeScript errors.

---

### Task 2: Rewrite Global Styles (styles.css)

**Files:**
- Rewrite: `src/styles.css`

This is the largest task. Replace the entire content of `src/styles.css` with the new design system.

- [ ] **Step 1: Replace the full content of src/styles.css**

```css
/* ===== Design Tokens ===== */
:root {
  --color-primary-dark: #1a4a43;
  --color-primary: #2d6b62;
  --color-primary-light: #4a9189;
  --color-bg-page: #f5f5f0;
  --color-bg-card: #ffffff;
  --color-text-primary: #1a2e2c;
  --color-text-body: #333333;
  --color-text-muted: #888888;
  --color-text-placeholder: #aaaaaa;
  --color-shadow: rgba(0,0,0,0.04);
  --color-divider: #f0eeeb;
  --color-chorus-border: rgba(45,107,98,0.2);
  --color-danger: #d9534f;
  --radius-card: 14px;
  --radius-button: 8px;
  --radius-pill: 20px;
  --radius-search: 12px;
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
}

* {
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 15px;
  color: var(--color-text-primary);
  background: var(--color-bg-page);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
}

#root {
  max-width: 640px;
  margin: 0 auto;
  background: var(--color-bg-page);
  min-height: 100vh;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:visited {
  color: var(--color-primary);
}

/* ===== Buttons ===== */
button {
  border: none;
  background: var(--color-bg-card);
  padding: 8px 16px;
  border-radius: var(--radius-button);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-body);
  transition: transform var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);
}

button:active {
  transform: scale(0.96);
}

button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

button.primary {
  background: var(--color-primary);
  color: #fff;
}

button.primary:hover {
  background: var(--color-primary-light);
}

button.danger {
  color: var(--color-danger);
  background: #fdf0f0;
}

button.danger:hover {
  background: #fbe4e4;
}

/* ===== Inputs ===== */
input, select, textarea {
  border: 1.5px solid var(--color-divider);
  padding: 10px 14px;
  font-family: inherit;
  font-size: 14px;
  border-radius: var(--radius-button);
  width: 100%;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(45,107,98,0.1);
}

input::placeholder {
  color: var(--color-text-placeholder);
}

textarea {
  resize: vertical;
}

label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
}

/* ===== Home Page ===== */
.home-hero {
  background: linear-gradient(160deg, var(--color-primary-dark), var(--color-primary), var(--color-primary-light));
  padding: 32px 20px 28px;
  text-align: center;
}

.home-hero .hero-title {
  color: #fff;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0;
}

.home-hero .hero-subtitle {
  color: rgba(255,255,255,0.6);
  font-size: 13px;
  margin-top: 6px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.home-hero .hero-stats {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.home-hero .hero-stat {
  background: rgba(255,255,255,0.15);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
}

.home-body {
  padding: 16px;
}

.home-admin-link {
  display: block;
  text-align: center;
  margin-top: 16px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.home-admin-link:visited {
  color: var(--color-text-muted);
}

.cat-list {
  background: var(--color-bg-card);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px var(--color-shadow);
}

.cat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  text-decoration: none;
  transition: background var(--transition-fast);
  border-bottom: 1px solid var(--color-divider);
}

.cat-row:last-child {
  border-bottom: none;
}

.cat-row:active {
  background: #f8f8f5;
}

.cat-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cat-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.cat-row-right {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ===== Category List Page ===== */
.sticky-band {
  position: sticky;
  top: 0;
  z-index: 20;
}

.page-header {
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header .back-arrow {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-weight: 600;
}

.page-header .back-arrow:visited {
  color: rgba(255,255,255,0.7);
}

.page-header .page-title {
  font-size: 15px;
  font-weight: 700;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.search-strip {
  padding: 12px;
  background: var(--color-bg-page);
}

.search-bar {
  background: var(--color-bg-card);
  border-radius: var(--radius-search);
  display: flex;
  align-items: center;
  box-shadow: 0 2px 10px var(--color-shadow);
  overflow: hidden;
}

.search-bar .search-icon {
  padding: 12px 14px;
  color: var(--color-text-placeholder);
  font-size: 16px;
  flex-shrink: 0;
}

.search-bar input {
  border: none;
  padding: 12px 0;
  font-size: 14px;
  flex: 1;
  min-width: 0;
  border-radius: 0;
}

.search-bar input:focus {
  box-shadow: none;
  border-color: transparent;
}

.search-bar .sort-divider {
  width: 1px;
  height: 24px;
  background: var(--color-divider);
  flex-shrink: 0;
}

.search-bar .sort-toggles {
  display: flex;
  gap: 4px;
  padding: 6px 10px;
  flex-shrink: 0;
}

.sort-btn {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
  font-family: inherit;
}

.sort-btn.active {
  background: var(--color-primary);
  color: #fff;
}

.sort-btn:not(.active) {
  background: var(--color-bg-page);
  color: var(--color-text-muted);
}

.list-body {
  padding: 0 12px 24px;
}

.song-list-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: 0 2px 8px var(--color-shadow);
}

.song-list-card .alpha-group-header {
  padding: 8px 16px;
  background: #f8f8f5;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 1px;
  border-bottom: 1px solid var(--color-divider);
}

.song-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  text-decoration: none;
  border-bottom: 1px solid var(--color-divider);
  transition: background var(--transition-fast);
}

.song-row:last-child {
  border-bottom: none;
}

.song-row:active {
  background: #f8f8f5;
}

.song-row-info .song-row-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.song-row-info .song-row-number {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.song-row-arrow {
  color: #ccc;
  font-size: 13px;
  flex-shrink: 0;
}

.empty-state {
  padding: 24px 16px;
  color: var(--color-text-placeholder);
  font-size: 14px;
  text-align: center;
}

/* ===== Song Detail Page ===== */
.song-header {
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 20;
}

.song-header .back-link {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-weight: 600;
}

.song-header .back-link:visited {
  color: rgba(255,255,255,0.7);
}

.song-header .font-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.song-header .font-controls button {
  background: rgba(255,255,255,0.15);
  color: #fff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  border: none;
}

.song-header .font-controls button:hover {
  background: rgba(255,255,255,0.25);
}

.song-detail-body {
  padding: 12px 12px 100px;
}

.song-title-banner {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  border-radius: var(--radius-card);
  padding: 18px;
  margin-bottom: 12px;
}

.song-title-banner .song-number-label {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.song-title-banner .song-title {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin-top: 4px;
  letter-spacing: -0.3px;
  line-height: 1.3;
}

.verse-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  padding: 16px 18px;
  box-shadow: 0 2px 10px var(--color-shadow);
  margin-bottom: 12px;
}

.verse-card .stanza-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}

.verse-card .stanza-text {
  white-space: pre-wrap;
  line-height: 1.9;
}

.chorus-card-wrapper {
  position: relative;
  margin-top: 16px;
  margin-bottom: 12px;
}

.chorus-badge {
  position: absolute;
  top: -9px;
  left: 16px;
  background: var(--color-primary);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 3px 12px;
  border-radius: 6px;
  z-index: 1;
  text-transform: uppercase;
}

.chorus-card {
  background: linear-gradient(135deg, rgba(45,107,98,0.08), rgba(45,107,98,0.14));
  border-radius: var(--radius-card);
  padding: 20px 18px 16px;
  border: 1.5px solid var(--color-chorus-border);
}

.chorus-card .stanza-text {
  white-space: pre-wrap;
  line-height: 1.9;
  font-weight: 500;
  color: var(--color-text-primary);
}

/* Sticky chorus bar */
.chorus-sticky-bar {
  position: sticky;
  top: var(--song-header-h, 44px);
  z-index: 15;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  padding: 14px 16px;
  white-space: pre-wrap;
  line-height: 1.8;
  color: #fff;
  box-shadow: 0 4px 12px rgba(45,107,98,0.2);
}

.chorus-sticky-bar .stanza-label {
  font-weight: 700;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: rgba(255,255,255,0.7);
  margin-bottom: 6px;
}

/* Bottom navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 640px;
  display: flex;
  gap: 10px;
  padding: 12px;
  background: var(--color-bg-page);
  z-index: 30;
}

.bottom-nav .nav-btn {
  flex: 1;
  padding: 12px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
}

.bottom-nav .nav-btn:active {
  transform: scale(0.96);
}

.bottom-nav .nav-btn.prev {
  background: var(--color-bg-card);
  color: var(--color-primary);
  box-shadow: 0 2px 8px var(--color-shadow);
}

.bottom-nav .nav-btn.next {
  background: var(--color-primary);
  color: #fff;
}

.bottom-nav .nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
  transform: none;
}

/* ===== Admin ===== */
.admin-header {
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  position: sticky;
  top: 0;
  z-index: 20;
}

.admin-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.admin-header .back-arrow {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-weight: 600;
}

.admin-header .back-arrow:visited {
  color: rgba(255,255,255,0.7);
}

.admin-header button {
  background: rgba(255,255,255,0.15);
  color: #fff;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: var(--radius-button);
}

.admin-header button:hover {
  background: rgba(255,255,255,0.25);
}

.admin-body {
  padding: 16px;
}

.admin-add-bar {
  margin-bottom: 16px;
}

.table-scroll {
  overflow-x: auto;
  border-radius: var(--radius-card);
  background: var(--color-bg-card);
  box-shadow: 0 2px 8px var(--color-shadow);
  margin-bottom: 16px;
}

table {
  border-collapse: collapse;
  width: 100%;
  font-size: 14px;
}

td, th {
  border-bottom: 1px solid var(--color-divider);
  padding: 10px 14px;
  text-align: left;
  white-space: nowrap;
}

th {
  background: #f8f8f5;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-primary);
}

tr:last-child td {
  border-bottom: none;
}

tr:hover td {
  background: #fafaf7;
}

.form-section {
  border: 1.5px solid var(--color-divider);
  padding: 20px;
  margin-bottom: 16px;
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  box-shadow: 0 2px 8px var(--color-shadow);
}

.form-section h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
}

.form-row {
  margin-bottom: 14px;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.stanza-row {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.stanza-row > div {
  flex: 1;
}

/* Login */
.login-wrap {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 48px 24px;
  min-height: calc(100vh - 48px);
}

.login-form {
  width: 100%;
  max-width: 360px;
  padding: 32px 28px;
  border-radius: 16px;
  background: var(--color-bg-card);
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}

.login-form h2 {
  margin: 0 0 28px;
  font-size: 22px;
  font-weight: 800;
  color: var(--color-primary);
  text-align: center;
  letter-spacing: -0.3px;
}

.login-form .form-row {
  margin-bottom: 18px;
}

.login-form button[type="submit"] {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  margin-top: 8px;
  border-radius: var(--radius-button);
}

.error-msg {
  color: #c0392b;
  font-size: 13px;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #fdf0f0;
  border-radius: var(--radius-button);
  border: 1px solid #f5c6c6;
}
```

- [ ] **Step 2: Verify the dev server renders without CSS errors**

Run: `npm run dev`, open the browser. The layout will be partially broken because the JSX class names haven't been updated yet — that's expected. Confirm no build errors in the terminal.

---

### Task 3: Redesign Home Page

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Replace the full content of src/pages/Home.tsx**

```tsx
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../categories'
import { useSongCount } from '../hooks/useSongs'
import type { Category } from '../types'

function CategoryRow({ categoryKey, label, color }: { categoryKey: Category; label: string; color: string }) {
  const count = useSongCount(categoryKey)
  return (
    <Link to={`/c/${categoryKey}`} className="cat-row">
      <div className="cat-row-left">
        <div className="cat-dot" style={{ background: color }} />
        <span className="cat-name">{label}</span>
      </div>
      <span className="cat-row-right">{count ?? '—'} →</span>
    </Link>
  )
}

function TotalCount() {
  let total = 0
  let loaded = true
  for (const c of CATEGORIES) {
    const count = useSongCount(c.key)
    if (count === null) { loaded = false; continue }
    total += count
  }
  return (
    <div className="hero-stats">
      <span className="hero-stat">{loaded ? `${total} songs` : '…'}</span>
      <span className="hero-stat">{CATEGORIES.length} categories</span>
    </div>
  )
}

export function Home() {
  return (
    <div>
      <div className="home-hero">
        <h1 className="hero-title">Song Book</h1>
        <div className="hero-subtitle">Brethren Assembly Jodhpur</div>
        <TotalCount />
      </div>
      <div className="home-body">
        <div className="cat-list">
          {CATEGORIES.map((c) => (
            <CategoryRow key={c.key} categoryKey={c.key} label={c.label} color={c.color} />
          ))}
        </div>
        <Link to="/admin" className="home-admin-link">Admin</Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify Home page renders correctly**

Run: `npm run dev`, navigate to `/`. Confirm:
- Gradient hero header with title, subtitle, stats pills
- White grouped card with colored dots, category names, counts with arrows
- Small "Admin" link below the list
- Content is centered and max-width 640px on desktop

---

### Task 4: Redesign Category List Page

**Files:**
- Modify: `src/pages/CategoryList.tsx`

- [ ] **Step 1: Replace the full content of src/pages/CategoryList.tsx**

```tsx
import React, { useState, useMemo, useRef, useLayoutEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSongsByCategory } from '../hooks/useSongs'
import { CATEGORIES } from '../categories'
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
  const [viewMode, setViewMode] = useState<'alpha' | 'num'>('num')
  const bandRef = useRef<HTMLDivElement>(null)
  const outerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const band = bandRef.current
    const outer = outerRef.current
    if (!band || !outer) return
    const update = () => outer.style.setProperty('--band-h', band.offsetHeight + 'px')
    update()
    const ro = new ResizeObserver(update)
    ro.observe(band)
    return () => ro.disconnect()
  }, [])

  const grouped = useMemo(() => {
    const filtered = songs.filter(s => matchesSearch(s, search))

    if (viewMode === 'num') {
      const sorted = [...filtered].sort((a, b) => a.number - b.number)
      return sorted.length > 0 ? [{ letter: '#', songs: sorted }] : []
    }

    const map = new Map<string, Song[]>()
    for (const s of filtered) {
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
  }, [songs, search, viewMode])

  const label = CATEGORIES.find(c => c.key === cat)?.label ?? cat

  return (
    <div ref={outerRef}>
      <div className="sticky-band" ref={bandRef}>
        <div className="page-header" style={{ position: 'relative' }}>
          <Link to="/" className="back-arrow">← Home</Link>
          <span className="page-title">{label}</span>
          <div style={{ width: 40 }} />
        </div>
        <div className="search-strip">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="search"
              placeholder="Search songs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="sort-divider" />
            <div className="sort-toggles">
              <button
                className={`sort-btn ${viewMode === 'alpha' ? 'active' : ''}`}
                onClick={() => { setViewMode('alpha'); window.scrollTo(0, 0) }}
              >
                A-Z
              </button>
              <button
                className={`sort-btn ${viewMode === 'num' ? 'active' : ''}`}
                onClick={() => { setViewMode('num'); window.scrollTo(0, 0) }}
              >
                #
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <p style={{ padding: '24px 16px', textAlign: 'center', color: '#aaa' }}>Loading…</p>}
      {error && <p className="error-msg" style={{ margin: '12px' }}>{error}</p>}

      <div className="list-body">
        <div className="song-list-card">
          {grouped.map(({ letter, songs: groupSongs }) => (
            <React.Fragment key={letter}>
              {viewMode === 'alpha' && (
                <div className="alpha-group-header">{letter}</div>
              )}
              {groupSongs.map((s) => (
                <Link key={s.id} to={`/c/${cat}/${s.number}`} className="song-row">
                  <div className="song-row-info">
                    <div className="song-row-title">{s.title}</div>
                    <div className="song-row-number">#{s.number}</div>
                  </div>
                  <span className="song-row-arrow">→</span>
                </Link>
              ))}
            </React.Fragment>
          ))}
          {!loading && grouped.length === 0 && (
            <div className="empty-state">No songs found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify Category List page renders correctly**

Run: `npm run dev`, navigate to `/c/english`. Confirm:
- Gradient header with "← Home" and centered "English"
- Unified search bar with sort toggles (A-Z / #) inside
- Clean white card with song rows (title, number, arrow)
- A-Z mode shows letter section headers
- Search filters correctly by title and number
- No alpha sidebar visible

---

### Task 5: Redesign Song Detail Page

**Files:**
- Modify: `src/pages/SongDetail.tsx`

- [ ] **Step 1: Replace the full content of src/pages/SongDetail.tsx**

```tsx
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSong, useSongsByCategory } from '../hooks/useSongs'
import { CATEGORIES } from '../categories'
import type { Category } from '../types'

const LS_KEY = 'fontSize'
const DEFAULT_SIZE = 15

function loadSize(): number {
  const v = localStorage.getItem(LS_KEY)
  return v ? (parseInt(v, 10) || DEFAULT_SIZE) : DEFAULT_SIZE
}

export function SongDetail() {
  const { category, number } = useParams<{ category: string; number: string }>()
  const cat = (category ?? 'english') as Category
  const num = parseInt(number ?? '1', 10)

  const { song, loading, error } = useSong(cat, num)
  const { songs } = useSongsByCategory(cat)

  const [fontSize, setFontSize] = useState(loadSize)
  const [chorusStuck, setChorusStuck] = useState(false)

  const outerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const chorusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(LS_KEY, String(fontSize))
  }, [fontSize])

  useLayoutEffect(() => {
    const header = headerRef.current
    const outer = outerRef.current
    if (!header || !outer) return
    const update = () => outer.style.setProperty('--song-header-h', header.offsetHeight + 'px')
    update()
    const ro = new ResizeObserver(update)
    ro.observe(header)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = chorusRef.current
    if (!el) return
    setChorusStuck(false)
    const headerH = headerRef.current?.offsetHeight ?? 44
    const observer = new IntersectionObserver(
      ([entry]) => setChorusStuck(!entry.isIntersecting),
      { rootMargin: `-${headerH}px 0px 0px 0px`, threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [song])

  const idx = songs.findIndex((s) => s.number === num)
  const prevSong = idx > 0 ? songs[idx - 1] : undefined
  const nextSong = idx !== -1 && idx < songs.length - 1 ? songs[idx + 1] : undefined

  const catLabel = CATEGORIES.find(c => c.key === cat)?.label ?? cat

  if (loading) return (
    <div>
      <div className="song-header">
        <Link to={`/c/${cat}`} className="back-link">← {catLabel}</Link>
      </div>
      <p style={{ padding: '24px 16px', textAlign: 'center', color: '#aaa' }}>Loading…</p>
    </div>
  )
  if (error) return (
    <div>
      <div className="song-header">
        <Link to={`/c/${cat}`} className="back-link">← {catLabel}</Link>
      </div>
      <p className="error-msg" style={{ margin: '16px' }}>{error}</p>
    </div>
  )
  if (!song) return (
    <div>
      <div className="song-header">
        <Link to={`/c/${cat}`} className="back-link">← {catLabel}</Link>
      </div>
      <p style={{ padding: '24px 16px', textAlign: 'center', color: '#aaa' }}>Song not found.</p>
    </div>
  )

  const firstChorusIdx = song.stanzas.findIndex(s => s.is_chorus)
  const chorusStanza = firstChorusIdx !== -1 ? song.stanzas[firstChorusIdx] : null

  return (
    <div ref={outerRef}>
      <div className="song-header" ref={headerRef}>
        <Link to={`/c/${cat}`} className="back-link">← {catLabel}</Link>
        <div className="font-controls">
          <button onClick={() => setFontSize((s) => Math.max(10, s - 1))}>A−</button>
          <button onClick={() => setFontSize((s) => Math.min(28, s + 1))}>A+</button>
        </div>
      </div>

      {/* Sticky chorus bar */}
      {chorusStanza && chorusStuck && (
        <div className="chorus-sticky-bar" style={{ fontSize }}>
          <div className="stanza-label">{chorusStanza.label}</div>
          {chorusStanza.text}
        </div>
      )}

      <div className="song-detail-body" style={{ fontSize }}>
        {/* Title banner */}
        <div className="song-title-banner">
          <div className="song-number-label">#{song.number}</div>
          <div className="song-title">{song.title}</div>
        </div>

        {/* Stanzas */}
        {song.stanzas.map((stanza, i) => {
          if (stanza.is_chorus) {
            return (
              <div
                key={i}
                ref={i === firstChorusIdx ? chorusRef : undefined}
                className="chorus-card-wrapper"
              >
                <div className="chorus-badge">{stanza.label || 'Chorus'}</div>
                <div className="chorus-card">
                  <div className="stanza-text">{stanza.text}</div>
                </div>
              </div>
            )
          }
          return (
            <div key={i} className="verse-card">
              <div className="stanza-label">{stanza.label}</div>
              <div className="stanza-text">{stanza.text}</div>
            </div>
          )
        })}
      </div>

      <div className="bottom-nav">
        {prevSong
          ? <Link to={`/c/${cat}/${prevSong.number}`} className="nav-btn prev">← Prev #{prevSong.number}</Link>
          : <button className="nav-btn prev" disabled>← Prev</button>}
        {nextSong
          ? <Link to={`/c/${cat}/${nextSong.number}`} className="nav-btn next">Next #{nextSong.number} →</Link>
          : <button className="nav-btn next" disabled>Next →</button>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify Song Detail page renders correctly**

Run: `npm run dev`, navigate to any song (e.g., `/c/english/1`). Confirm:
- Gradient header with back link and font size controls (A−/A+)
- Green gradient title banner with song number and title
- Each verse in its own white rounded card
- Chorus stanzas have floating "CHORUS" badge on top of tinted card
- Font size controls work and persist across page reload
- Sticky chorus bar appears when scrolling past the inline chorus
- Bottom prev/next navigation with styled buttons
- Content doesn't stretch wide on desktop (max 640px)

---

### Task 6: Delete AlphaSidebar Component

**Files:**
- Delete: `src/components/AlphaSidebar.tsx`

- [ ] **Step 1: Delete the AlphaSidebar component file**

Delete `src/components/AlphaSidebar.tsx`.

- [ ] **Step 2: Verify no imports reference AlphaSidebar**

Search the codebase for any remaining `AlphaSidebar` imports. The CategoryList.tsx was already updated in Task 4 to remove the import. Confirm no other file references it.

Run: `grep -r "AlphaSidebar" src/`
Expected: no matches

- [ ] **Step 3: Verify the app builds without errors**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

---

### Task 7: Light Restyle Admin Page and SongForm

**Files:**
- Modify: `src/pages/Admin.tsx` (minor class name adjustments)
- Modify: `src/components/SongForm.tsx` (no changes needed — existing classes are retained in new CSS)

- [ ] **Step 1: Update Admin.tsx back arrow text**

In `src/pages/Admin.tsx`, update the back arrow links to match the new style convention. Change the two instances of the back arrow:

On line 27, change:
```tsx
<Link to="/" className="back-arrow">←</Link>
```
to:
```tsx
<Link to="/" className="back-arrow">← Home</Link>
```

On line 129, change:
```tsx
<Link to="/" className="back-arrow">←</Link>
```
to:
```tsx
<Link to="/" className="back-arrow">← Home</Link>
```

- [ ] **Step 2: Verify Admin page renders correctly**

Run: `npm run dev`, navigate to `/admin`. Confirm:
- Gradient header with "← Home" and "Admin" title
- Login form with rounded inputs and styled button
- After login: table with clean styling, rounded card container
- Add/Edit form with rounded inputs and proper spacing

---

### Task 8: Final Verification

- [ ] **Step 1: Full smoke test across all pages**

Run: `npm run dev` and test the following flow:
1. Home page: hero header, category list, admin link
2. Click a category → Category list: search works, sort toggles work, songs display correctly
3. Click a song → Song detail: title banner, verse cards, chorus with floating badge, font size controls, prev/next navigation
4. Navigate back and forth between songs using prev/next
5. Test search filtering by title and by number
6. Test A-Z vs # sort modes
7. Visit `/admin` → login form displays correctly
8. Resize browser window to verify responsive behavior (640px max-width centering)

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Build succeeds with zero errors.
