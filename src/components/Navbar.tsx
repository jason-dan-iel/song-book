import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="site-title">Song Book</Link>
      <Link to="/admin">Admin</Link>
    </nav>
  )
}
