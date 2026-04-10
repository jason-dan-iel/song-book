import type { Category } from './types'

export interface CategoryMeta {
  key: Category
  label: string
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'english',            label: 'English' },
  { key: 'hindi',              label: 'Hindi' },
  { key: 'chorus',             label: 'Chorus' },
  { key: 'youth-camp',         label: 'Youth Camp' },
  { key: 'yc-chorus',          label: 'Youth Camp Chorus' },
  { key: 'special',            label: 'Special Songs' },
]
