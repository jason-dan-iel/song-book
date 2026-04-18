import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { AppRouter } from './router'

if (location.pathname.endsWith('/index.html')) {
  history.replaceState(null, '', location.pathname.replace(/\/index\.html$/, '/') + location.search + location.hash)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
