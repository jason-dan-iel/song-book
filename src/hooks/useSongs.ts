import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Song, Category } from '../types'

const cache: Record<string, Song[]> = {}

export function useSongsByCategory(category: Category) {
  const [songs, setSongs] = useState<Song[]>(cache[category] ?? [])
  const [loading, setLoading] = useState(!cache[category])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache[category]) return
    setLoading(true)
    supabase
      .from('songs')
      .select('*')
      .eq('category', category)
      .order('number')
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
        } else {
          const rows = (data ?? []) as Song[]
          cache[category] = rows
          setSongs(rows)
        }
        setLoading(false)
      })
  }, [category])

  return { songs, loading, error }
}

export function useSong(category: Category, number: number) {
  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cached = cache[category]?.find((s) => s.number === number)
    if (cached) {
      setSong(cached)
      setLoading(false)
      return
    }
    supabase
      .from('songs')
      .select('*')
      .eq('category', category)
      .eq('number', number)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setSong(data as Song)
        setLoading(false)
      })
  }, [category, number])

  return { song, loading, error }
}

export function invalidateCache(category?: Category) {
  if (category) delete cache[category]
  else Object.keys(cache).forEach((k) => delete cache[k])
}
