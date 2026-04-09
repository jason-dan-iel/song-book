import { useState, useEffect, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { SongForm } from '../components/SongForm'
import { invalidateCache } from '../hooks/useSongs'
import type { Song, Category } from '../types'

export function Admin() {
  const [session, setSession] = useState<Session | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoadingSession(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (loadingSession) return <p>Loading…</p>
  if (!session) return <LoginForm />
  return <AdminPanel />
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2>Admin Login</h2>
      {error && <p className="error-msg">{error}</p>}
      <div className="form-row">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="form-row">
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <button type="submit" className="primary" disabled={loading}>
        {loading ? 'Logging in…' : 'Login'}
      </button>
    </form>
  )
}

function AdminPanel() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Song | null>(null)
  const [adding, setAdding] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  async function loadSongs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('category')
      .order('number')
    if (error) setError(error.message)
    else setSongs((data ?? []) as Song[])
    setLoading(false)
  }

  useEffect(() => { loadSongs() }, [])

  async function handleSave(data: {
    category: Category
    number: number
    title: string
    stanzas: import('../types').Stanza[]
  }) {
    const row = {
      ...data,
      updated_at: new Date().toISOString(),
      ...(editing ? { id: editing.id } : {}),
    }
    const { error } = await supabase.from('songs').upsert(row, { onConflict: 'category,number' })
    if (error) throw error
    invalidateCache(data.category)
    await loadSongs()
    setEditing(null)
    setAdding(false)
  }

  async function handleDelete(song: Song) {
    if (!confirm(`Delete "${song.title}"?`)) return
    const { error } = await supabase.from('songs').delete().eq('id', song.id)
    if (error) { alert(error.message); return }
    invalidateCache(song.category)
    setSongs((prev) => prev.filter((s) => s.id !== song.id))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div>
      <div className="admin-header">
        <h2>Admin</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-body">
      {!adding && !editing && (
        <div className="admin-add-bar">
          <button className="primary" onClick={() => setAdding(true)}>+ Add song</button>
        </div>
      )}

      <div ref={formRef}>
        {adding && (
          <SongForm
            onSave={handleSave}
            onCancel={() => setAdding(false)}
          />
        )}

        {editing && (
          <SongForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </div>

      {error && <p className="error-msg">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Cat</th>
              <th>#</th>
              <th>Title</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((s) => (
              <tr key={s.id}>
                <td>{s.category}</td>
                <td>{s.number}</td>
                <td>{s.title}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => {
                      setAdding(false)
                      setEditing(s)
                      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
                    }}
                    style={{ marginRight: 6 }}
                  >
                    Edit
                  </button>
                  <button className="danger" onClick={() => handleDelete(s)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </div>
  )
}
