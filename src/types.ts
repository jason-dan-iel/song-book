export type Category = 'english' | 'hindi' | 'youth-camp'

export interface Song {
  id: string
  category: Category
  number: number
  title: string
  chorus: string | null
  stanzas: string[]
  created_at: string
  updated_at: string
}

export interface SongRow {
  id: string
  category: string
  number: number
  title: string
  chorus: string | null
  stanzas: string[]
  created_at: string
  updated_at: string
}
