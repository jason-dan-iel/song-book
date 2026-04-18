import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSong, useSongsByCategory } from '../hooks/useSongs'
import { CATEGORIES } from '../categories'
import type { Category } from '../types'

const LS_KEY = 'fontSize'
const DEFAULT_SIZE = 18
const MIN_SIZE = 13
const MAX_SIZE = 28

function loadSize(): number {
  const v = localStorage.getItem(LS_KEY)
  const n = v ? parseInt(v, 10) : NaN
  return Number.isFinite(n) ? Math.min(MAX_SIZE, Math.max(MIN_SIZE, n)) : DEFAULT_SIZE
}

function hasDevanagari(s: string): boolean {
  return /[\u0900-\u097F]/.test(s)
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

  const idx = songs.findIndex((s) => s.number === num)
  const prevSong = idx > 0 ? songs[idx - 1] : undefined
  const nextSong = idx !== -1 && idx < songs.length - 1 ? songs[idx + 1] : undefined

  const catLabel = CATEGORIES.find(c => c.key === cat)?.label ?? cat

  const header = (title: React.ReactNode, showControls = true) => (
    <div className="page-head sticky">
      <Link to={`/c/${cat}`} className="back-arrow">← {catLabel}</Link>
      <span className="page-title tnum">{title}</span>
      <span className="right-slot">
        {showControls && (
          <span className="fs-ctrl">
            <button onClick={() => setFontSize((s) => Math.max(MIN_SIZE, s - 1))} aria-label="Decrease font size">A−</button>
            <button onClick={() => setFontSize((s) => Math.min(MAX_SIZE, s + 1))} aria-label="Increase font size">A+</button>
          </span>
        )}
      </span>
    </div>
  )

  if (loading) return <div>{header('', false)}<p className="loading-msg">Loading…</p></div>
  if (error) return <div>{header('', false)}<p className="error-msg" style={{ margin: '16px 22px' }}>{error}</p></div>
  if (!song) return <div>{header('', false)}<p className="loading-msg">Song not found.</p></div>

  const titleIsHindi = hasDevanagari(song.title)

  return (
    <div>
      {header(`#${String(song.number).padStart(3, '0')}`)}

      <div className="col">
        <div className="song-banner">
          <div className="sn tnum">{catLabel} · {song.number}</div>
          <h2 className={titleIsHindi ? 'devanagari' : ''}>{song.title}</h2>
        </div>

        <div className="song-body">
          {song.stanzas.map((stanza, i) => {
            const stanzaIsHindi = hasDevanagari(stanza.text)
            const tag = stanza.label || (stanza.is_chorus ? 'Chorus' : `Verse ${i + 1}`)
            const bodyCls = `body${stanzaIsHindi ? ' devanagari' : ''}`

            if (stanza.is_chorus) {
              return (
                <div key={i} className="chorus">
                  <div className="tag">{tag}</div>
                  <div className={bodyCls} style={{ fontSize }}>{stanza.text}</div>
                </div>
              )
            }
            return (
              <div key={i} className="stanza">
                <div className="tag">{tag}</div>
                <div className={bodyCls} style={{ fontSize }}>{stanza.text}</div>
              </div>
            )
          })}
        </div>

        <nav className="song-nav">
          {prevSong
            ? <Link className="prev" to={`/c/${cat}/${prevSong.number}`}><span className="k">Prev</span>#{prevSong.number}</Link>
            : <span className="prev disabled"><span className="k">Prev</span>—</span>}
          {nextSong
            ? <Link className="next" to={`/c/${cat}/${nextSong.number}`}><span className="k">Next</span>#{nextSong.number}</Link>
            : <span className="next disabled"><span className="k">Next</span>—</span>}
        </nav>
      </div>
    </div>
  )
}
