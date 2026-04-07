import { useState } from 'react'
import type { Category, Song } from '../types'

interface Props {
  initial?: Partial<Song>
  onSave: (data: {
    category: Category
    number: number
    title: string
    chorus: string | null
    stanzas: string[]
  }) => Promise<void>
  onCancel: () => void
}

export function SongForm({ initial, onSave, onCancel }: Props) {
  const [category, setCategory] = useState<Category>(initial?.category ?? 'english')
  const [number, setNumber] = useState(initial?.number?.toString() ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [chorus, setChorus] = useState(initial?.chorus ?? '')
  const [stanzas, setStanzas] = useState<string[]>(initial?.stanzas?.length ? initial.stanzas : [''])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = parseInt(number, 10)
    if (!title.trim() || isNaN(num) || num < 1) {
      setError('Title and valid number are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        category,
        number: num,
        title: title.trim(),
        chorus: chorus.trim() || null,
        stanzas: stanzas.map((s) => s.trim()).filter(Boolean),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  function updateStanza(i: number, val: string) {
    setStanzas((prev) => prev.map((s, idx) => (idx === i ? val : s)))
  }

  function addStanza() {
    setStanzas((prev) => [...prev, ''])
  }

  function removeStanza(i: number) {
    setStanzas((prev) => prev.filter((_, idx) => idx !== i))
  }

  return (
    <form className="form-section" onSubmit={handleSubmit}>
      <h3>{initial?.id ? 'Edit Song' : 'Add Song'}</h3>
      {error && <p className="error-msg">{error}</p>}

      <div className="form-row">
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          <option value="english">English</option>
          <option value="hindi">Hindi</option>
          <option value="youth-camp">Youth Camp</option>
        </select>
      </div>

      <div className="form-row">
        <label>Number</label>
        <input
          type="number"
          min={1}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          style={{ width: 100 }}
        />
      </div>

      <div className="form-row">
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="form-row">
        <label>Chorus (optional)</label>
        <textarea rows={3} value={chorus} onChange={(e) => setChorus(e.target.value)} />
      </div>

      <div className="form-row">
        <label>Stanzas</label>
        {stanzas.map((s, i) => (
          <div key={i} className="stanza-row">
            <textarea
              rows={4}
              value={s}
              placeholder={`Stanza ${i + 1}`}
              onChange={(e) => updateStanza(i, e.target.value)}
            />
            <button type="button" className="danger" onClick={() => removeStanza(i)}>×</button>
          </div>
        ))}
        <button type="button" onClick={addStanza}>+ Add stanza</button>
      </div>

      <div className="form-actions">
        <button type="submit" className="primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  )
}
