import React, { useState, useMemo, useRef, useCallback, useLayoutEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlphaSidebar } from '../components/AlphaSidebar'
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
  const [activeLetter, setActiveLetter] = useState('')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const bandRef = useRef<HTMLDivElement>(null)
  const outerRef = useRef<HTMLDivElement>(null)

  // Measure the sticky band and expose its height as --band-h so group-headers
  // and the sidebar always stick flush to it, whatever the actual rendered height is
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
    if (!el) return
    const bandH = bandRef.current?.offsetHeight ?? 102
    window.scrollTo(0, Math.max(0, el.offsetTop - bandH))
  }, [])

  const label = CATEGORIES.find(c => c.key === cat)?.label ?? cat

  return (
    <div ref={outerRef}>
      <div className="sticky-band" ref={bandRef}>
        <div className="page-header">
          <Link to="/" className="back-arrow">←</Link>
          <span className="page-title">{label}</span>
        </div>
        <div className="search-strip">
          <input
            type="search"
            placeholder="Search by title or number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setActiveLetter('') }}
          />
        </div>
      </div>

      {loading && <p style={{ padding: '12px 16px' }}>Loading…</p>}
      {error && <p className="error-msg" style={{ margin: '12px 16px' }}>{error}</p>}

      <div className="list-body">
        <ul className="song-list">
          {grouped.map(({ letter, songs: groupSongs }) => (
            <React.Fragment key={letter}>
              {/* Static anchor — not sticky, so offsetTop is always the true document position */}
              <li
                ref={el => { sectionRefs.current[letter] = el }}
                className="alpha-anchor"
                aria-hidden="true"
              />
              <li
                className="alpha-group-header"
                data-letter={letter}
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
          {!loading && grouped.length === 0 && (
            <li style={{ padding: '12px 16px', color: '#aaa', fontSize: 14 }}>No songs found.</li>
          )}
        </ul>

        {!loading && letters.length > 0 && (
          <div className="alpha-sidebar-track">
            <AlphaSidebar
              letters={letters}
              active={activeLetter}
              onChange={handleSidebarChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
