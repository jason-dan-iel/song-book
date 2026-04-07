import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LetterFilter } from '../components/LetterFilter'
import { useSongsByCategory } from '../hooks/useSongs'
import type { Category } from '../types'

function firstLetter(title: string): string {
  return title.replace(/^[^a-zA-Z\u0900-\u097F]*/u, '')[0]?.toUpperCase() ?? '#'
}

export function CategoryList() {
  const { category } = useParams<{ category: string }>()
  const cat = (category ?? 'english') as Category
  const { songs, loading, error } = useSongsByCategory(cat)
  const [filter, setFilter] = useState('All')

  const visible = filter === 'All'
    ? songs
    : songs.filter((s) => firstLetter(s.title) === filter)

  const label = cat === 'youth-camp' ? 'Youth Camp' : cat.charAt(0).toUpperCase() + cat.slice(1)

  return (
    <div>
      <p className="category-heading">
        <Link to="/">←</Link> {label}
      </p>
      <LetterFilter active={filter} onChange={setFilter} />
      {loading && <p>Loading…</p>}
      {error && <p className="error-msg">{error}</p>}
      <ul className="song-list">
        {visible.map((s) => (
          <li key={s.id}>
            <Link to={`/c/${cat}/${s.number}`}>
              {s.number}. {s.title}
            </Link>
          </li>
        ))}
      </ul>
      {!loading && visible.length === 0 && <p>No songs found.</p>}
    </div>
  )
}
