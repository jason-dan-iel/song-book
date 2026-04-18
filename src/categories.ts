import type { Category } from './types'

export interface CategoryMeta {
  key: Category
  label: string
  color: string
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'english',    label: 'English',           color: '#2d6b62' },
  { key: 'hindi',      label: 'Hindi',             color: '#E17055' },
  { key: 'chorus',     label: 'Chorus',            color: '#FDCB6E' },
  { key: 'youth-camp', label: 'Youth Camp',        color: '#6C5CE7' },
  { key: 'yc-chorus',  label: 'Youth Camp Chorus', color: '#0984E3' },
  { key: 'special',    label: 'Special Songs',     color: '#E17055' },
]
