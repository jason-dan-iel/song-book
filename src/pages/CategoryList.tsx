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
