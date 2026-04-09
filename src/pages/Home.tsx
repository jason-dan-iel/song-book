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
