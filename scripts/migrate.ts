import { readFileSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import { parse } from 'node-html-parser'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Load .env.local override (service role key lives here)
try {
  const raw = readFileSync('.env.local', 'utf8')
  for (const line of raw.split('\n')) {
    const [k, ...rest] = line.split('=')
    if (k && rest.length) process.env[k.trim()] = rest.join('=').trim()
  }
} catch {
  // .env.local may not exist
}

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
})

type Category = 'english' | 'hindi' | 'youth-camp'

interface SongRow {
  category: Category
  number: number
  title: string
  chorus: string | null
  stanzas: string[]
}

const FOLDERS: { dir: string; category: Category }[] = [
  { dir: 'english', category: 'english' },
  { dir: 'hindi', category: 'hindi' },
  { dir: 'youth-camp-songs', category: 'youth-camp' },
]

function extractNumber(filename: string): number {
  const m = filename.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : 0
}

function parseHtml(filePath: string, category: Category): SongRow | null {
  const html = readFileSync(filePath, 'utf8')
  const root = parse(html)

  // Title: from <title>, strip leading "N - "
  const rawTitle = root.querySelector('title')?.text?.trim() ?? ''
  const title = rawTitle.replace(/^\d+\s*-\s*/, '').trim()

  const number = extractNumber(basename(filePath))
  if (!title || !number) return null

  const stanzas: string[] = []
  let chorus: string | null = null

  const stanzaDivs = root.querySelectorAll('div.stanza')
  for (const div of stanzaDivs) {
    const labelEl = div.querySelector('.stanza-label')
    const labelText = labelEl?.text?.trim() ?? ''

    // Remove the label element to get clean text
    labelEl?.remove()

    const text = div.text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (!text) continue

    if (/chorus/i.test(labelText)) {
      chorus = text
    } else {
      stanzas.push(text)
    }
  }

  return { category, number, title, chorus, stanzas }
}

async function main() {
  const rows: SongRow[] = []

  for (const { dir, category } of FOLDERS) {
    let files: string[]
    try {
      files = readdirSync(dir).filter((f) => f.endsWith('.html'))
    } catch {
      console.warn(`Skipping ${dir} (not found)`)
      continue
    }

    for (const file of files) {
      const row = parseHtml(join(dir, file), category)
      if (row) rows.push(row)
      else console.warn(`Skipped: ${file}`)
    }
  }

  console.log(`Parsed ${rows.length} songs. Upserting…`)

  // Upsert in batches of 50
  const BATCH = 50
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('songs')
      .upsert(batch, { onConflict: 'category,number' })
    if (error) {
      console.error(`Batch ${i}–${i + BATCH} failed:`, error.message)
    }
  }

  // Summary
  const counts: Record<string, number> = {}
  for (const r of rows) counts[r.category] = (counts[r.category] ?? 0) + 1
  for (const [cat, n] of Object.entries(counts)) console.log(`  ${cat}: ${n} songs`)
  console.log('Done.')
}

main()
