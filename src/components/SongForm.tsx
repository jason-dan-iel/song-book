import { useState } from 'react'
import type { Category, Song, Stanza } from '../types'
import { CATEGORIES } from '../categories'

interface Props {
  initial?: Partial<Song>
  onSave: (data: {
    category: Category
    number: number
    title: string
    stanzas: Stanza[]
  }) => Promise<void>
  onCancel: () => void
}

const emptyStanza = (): Stanza => ({ label: '', text: '', is_chorus: false })

export function SongForm({ initial, onSave, onCancel }: Props) {
  const [category, setCategory] = useState<Category>(initial?.category ?? 'english')
  const [number, setNumber] = useState(initial?.number?.toString() ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [stanzas, setStanzas] = useState<Stanza[]>(
    initial?.stanzas?.length ? initial.stanzas : [emptyStanza()]
  )
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
        stanzas: stanzas
          .map((s) => ({ ...s, label: s.label.trim(), text: s.text.trim() }))
          .filter((s) => s.text),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  function updateStanza(i: number, patch: Partial<Stanza>) {
    setStanzas((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  function addStanza() {
    setStanzas((prev) => [...prev, emptyStanza()])
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
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
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
        <label>Stanzas (in order — check "Chorus" on chorus stanzas)</label>
        {stanzas.map((s, i) => (
          <div key={i} className="stanza-row" style={{ marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
                <input
                  style={{ width: 80 }}
                  placeholder="Label"
                  value={s.label}
                  onChange={(e) => updateStanza(i, { label: e.target.value })}
                />
                <label style={{ fontWeight: 'normal', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={s.is_chorus}
                    onChange={(e) => updateStanza(i, { is_chorus: e.target.checked })}
                  />
                  Chorus
                </label>
                <button type="button" className="danger" onClick={() => removeStanza(i)}>×</button>
              </div>
              <textarea
                rows={4}
                value={s.text}
                placeholder={s.is_chorus ? 'Chorus text' : `Stanza ${i + 1} text`}
                onChange={(e) => updateStanza(i, { text: e.target.value })}
              />
            </div>
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
