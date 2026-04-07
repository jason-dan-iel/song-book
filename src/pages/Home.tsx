import { Link } from 'react-router-dom'

const CATEGORIES = [
  { key: 'english', label: 'English' },
  { key: 'hindi', label: 'Hindi' },
  { key: 'youth-camp', label: 'Youth Camp' },
]

export function Home() {
  return (
    <div>
      <h1 style={{ fontSize: 16, marginBottom: 4 }}>Song Book</h1>
      <p style={{ color: '#666', marginTop: 0 }}>Brethren Assembly Jodhpur</p>
      <ul className="home-categories">
        {CATEGORIES.map((c) => (
          <li key={c.key}>
            <Link to={`/c/${c.key}`}>{c.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
