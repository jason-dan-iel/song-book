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
          ? <Link to={`/c/${cat}/${prevSong.number}`} className="nav-btn prev">← {prevSong.number}</Link>
          : <button className="nav-btn prev" disabled>←</button>}
        {nextSong
          ? <Link to={`/c/${cat}/${nextSong.number}`} className="nav-btn next">{nextSong.number} →</Link>
          : <button className="nav-btn next" disabled>→</button>}
      </div>
    </div>
  )
}
