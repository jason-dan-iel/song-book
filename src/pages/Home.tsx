import { Link } from 'react-router-dom'
import { CATEGORIES } from '../categories'
import { useSongCount } from '../hooks/useSongs'
import type { Category } from '../types'

function CategoryRow({ index, categoryKey, label }: { index: number; categoryKey: Category; label: string }) {
  const count = useSongCount(categoryKey)
  const isHindi = categoryKey === 'hindi'
  return (
    <Link to={`/c/${categoryKey}`} className="cat-row">
      <span className="n tnum">{String(index + 1).padStart(2, '0')}</span>
      <span className="nm">
        {isHindi ? <span className="devanagari">हिन्दी</span> : label}
      </span>
      <span className="c tnum">{count ?? '—'}</span>
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
    <span className="meta tnum">
      <b>{loaded ? total : '…'}</b>songs
    </span>
  )
}

export function Home() {
  return (
    <div className="col">
      <header className="topbar">
        <span className="mark">Song Book</span>
        <TotalCount />
      </header>

      <section className="hero">
        <h1>Hymns <em>&amp;&nbsp;praises</em></h1>
        <p>Collected songs of the Brethren Assembly, Jodhpur — in English and Hindi.</p>
      </section>

      <div className="section-label">
        <span>Categories</span>
        <span className="right tnum">{CATEGORIES.length} in total</span>
      </div>

      <nav className="cat-list">
        {CATEGORIES.map((c, i) => (
          <CategoryRow key={c.key} index={i} categoryKey={c.key} label={c.label} />
        ))}
      </nav>

      <footer className="home-foot">
        <span>Jodhpur, IN</span>
        <Link to="/admin">Admin</Link>
      </footer>
    </div>
  )
}
