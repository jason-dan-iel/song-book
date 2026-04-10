export type Category = 'english' | 'hindi' | 'youth-camp' | 'chorus' | 'yc-chorus' | 'special'

export interface Stanza {
  label: string
  text: string
  is_chorus: boolean
}

export interface Song {
  id: string
  category: Category
  number: number
  title: string
  stanzas: Stanza[]
  created_at: string
  updated_at: string
}
