import type { Category } from './types'

export interface CategoryMeta {
  key: Category
  label: string
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'english',            label: 'English' },
  { key: 'hindi',              label: 'Hindi' },
  { key: 'youth-camp',         label: 'Youth Camp' },
  { key: 'chorus-english',     label: 'Chorus — English' },
  { key: 'chorus-hindi',       label: 'Chorus — Hindi' },
  { key: 'yc-chorus-hindi',    label: 'YC Chorus — Hindi' },
  { key: 'yc-chorus-english',  label: 'YC Chorus — English' },
  { key: 'special',            label: 'Special Songs' },
]
