import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { CategoryList } from './pages/CategoryList'
import { SongDetail } from './pages/SongDetail'
import { Admin } from './pages/Admin'

export function AppRouter() {
  return (
    <BrowserRouter basename="/song-book">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/c/:category" element={<CategoryList />} />
        <Route path="/c/:category/:number" element={<SongDetail />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
