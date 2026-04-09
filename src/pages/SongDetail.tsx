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

  // Measure song-header height → --song-header-h so sticky elements align correctly
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

  // Watch the first inline chorus — show sticky copy once it scrolls above the header
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
      <p style={{ padding: '16px' }}>Loading…</p>
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
      <p style={{ padding: '16px' }}>Song not found.</p>
    </div>
  )

  const firstChorusIdx = song.stanzas.findIndex(s => s.is_chorus)
  const chorusStanza = firstChorusIdx !== -1 ? song.stanzas[firstChorusIdx] : null

  return (
    <div ref={outerRef}>
      <div className="song-header" ref={headerRef}>
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

      {/* Sticky chorus bar — only appears after the inline chorus has scrolled out of view */}
      {chorusStanza && chorusStuck && (
        <div className="chorus-sticky-bar" style={{ fontSize }}>
          <div className="stanza-label">{chorusStanza.label}</div>
          {chorusStanza.text}
        </div>
      )}

      <div className="song-body" style={{ fontSize }}>
        {song.stanzas.map((stanza, i) => (
          <div
            key={i}
            ref={i === firstChorusIdx ? chorusRef : undefined}
            className={stanza.is_chorus ? 'stanza stanza-chorus' : 'stanza'}
          >
            <div className="stanza-label">{stanza.label}</div>
            {stanza.text}
          </div>
        ))}
      </div>

      <div className="bottom-nav">
        {prevSong
          ? <Link to={`/c/${cat}/${prevSong.number}`} className="nav-btn prev">← {prevSong.number}</Link>
          : <button className="nav-btn prev" disabled>←</button>}
        {nextSong
          ? <Link to={`/c/${cat}/${nextSong.number}`} className="nav-btn next">{nextSong.number} →</Link>
          : <button className="nav-btn next" disabled>→</button>}
      </div>
    </div>
  )
}
