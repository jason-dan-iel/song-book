import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { StickyChorus } from '../components/StickyChorus'
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

  if (loading) return <p>Loading…</p>
  if (error) return <p className="error-msg">{error}</p>
  if (!song) return <p>Song not found.</p>

  const catLabel = cat === 'youth-camp' ? 'Youth Camp' : cat.charAt(0).toUpperCase() + cat.slice(1)
  const chorusStanza = song.stanzas.find((s) => s.is_chorus)

  return (
    <div style={{ fontSize }}>
      <div className="song-nav">
        <Link to={`/c/${cat}`}>← {catLabel}</Link>
        {prevSong
          ? <Link to={`/c/${cat}/${prevSong.number}`}>← {prevSong.number}</Link>
          : <span style={{ color: '#aaa' }}>←</span>}
        {nextSong
          ? <Link to={`/c/${cat}/${nextSong.number}`}>{nextSong.number} →</Link>
          : <span style={{ color: '#aaa' }}>→</span>}
        <div className="font-controls">
          <button onClick={() => setFontSize((s) => Math.max(10, s - 1))}>A−</button>
          <span className="font-size-display">{fontSize}px</span>
          <button onClick={() => setFontSize((s) => Math.min(28, s + 1))}>A+</button>
        </div>
      </div>

      <div className="song-title">{song.number}. {song.title}</div>

      {song.stanzas.map((stanza, i) => (
        <div key={i} className={stanza.is_chorus ? 'stanza stanza-chorus' : 'stanza'}>
          <div className="stanza-label">{stanza.label}</div>
          {stanza.text}
        </div>
      ))}

      {chorusStanza && <StickyChorus label={chorusStanza.label} text={chorusStanza.text} />}
    </div>
  )
}
