import React, { useState, useMemo } from 'react'
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

const CATEGORY_SUB: Record<Category, string> = {
  english: 'Hymns in English',
  hindi: 'Hindi bhajans & gīts',
  chorus: 'Short choruses',
  'youth-camp': 'Youth Camp songs',
  'yc-chorus': 'Youth Camp choruses',
  special: 'Special songs',
}

export function CategoryList() {
  const { category } = useParams<{ category: string }>()
  const cat = (category ?? 'english') as Category
  const { songs, loading, error } = useSongsByCategory(cat)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'alpha' | 'num'>('num')

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
  const isHindi = cat === 'hindi'
  const isDevanagariCategory = cat === 'hindi' || cat === 'chorus' || cat === 'special'
  const catIndex = CATEGORIES.findIndex(c => c.key === cat)

  return (
    <div>
      <div className="page-head sticky">
        <Link to="/" className="back-arrow">← Home</Link>
        <span className="page-title">{label}</span>
        <span className="right-slot tnum" style={{ fontSize: 12, color: 'var(--mute)', letterSpacing: '0.04em' }}>
          {String(catIndex + 1).padStart(2, '0')}&thinsp;/&thinsp;{String(CATEGORIES.length).padStart(2, '0')}
        </span>
      </div>

      <div className="col">
        <section className="list-banner">
          <div className="kicker">Category · {label}</div>
          <h1 className={isHindi ? 'devanagari' : ''}>
            {isHindi ? 'हिन्दी' : label}
          </h1>
          <p className="sub">{CATEGORY_SUB[cat]} — {songs.length} {songs.length === 1 ? 'song' : 'songs'}</p>
        </section>

        <div className="search">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Search by number or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="sort-toggles">
            <button
              className={`sort-btn ${viewMode === 'num' ? 'active' : ''}`}
              onClick={() => { setViewMode('num'); window.scrollTo(0, 0) }}
              aria-label="Sort by number"
            >
              #
            </button>
            <button
              className={`sort-btn ${viewMode === 'alpha' ? 'active' : ''}`}
              onClick={() => { setViewMode('alpha'); window.scrollTo(0, 0) }}
              aria-label="Sort A–Z"
            >
              A–Z
            </button>
          </div>
        </div>

        {loading && <p className="loading-msg">Loading…</p>}
        {error && <p className="error-msg" style={{ marginTop: 12 }}>{error}</p>}

        <ul className="song-list">
          {grouped.map(({ letter, songs: groupSongs }) => (
            <React.Fragment key={letter}>
              {viewMode === 'alpha' && (
                <li className="alpha-group-header">{letter}</li>
              )}
              {groupSongs.map((s) => (
                <li key={s.id}>
                  <Link to={`/c/${cat}/${s.number}`} className="song-row">
                    <span className="n tnum">{String(s.number).padStart(2, '0')}</span>
                    <span className={`t ${isDevanagariCategory ? 'devanagari' : ''}`}>{s.title}</span>
                    <span className="arr">→</span>
                  </Link>
                </li>
              ))}
            </React.Fragment>
          ))}
        </ul>

        {!loading && grouped.length === 0 && (
          <div className="empty-state">No songs found.</div>
        )}
      </div>
    </div>
  )
}
