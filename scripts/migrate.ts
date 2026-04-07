import { readFileSync, readdirSync } from 'fs'
import { join, basename, extname } from 'path'
import { parse as parseHtml } from 'node-html-parser'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Load .env.local (service role key)
try {
  const raw = readFileSync('.env.local', 'utf8')
  for (const line of raw.split('\n')) {
    const eq = line.indexOf('=')
    if (eq < 1) continue
    const k = line.slice(0, eq).trim()
    const v = line.slice(eq + 1).trim()
    if (k) process.env[k] = v
  }
} catch { /* file may not exist */ }

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env / .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

type Category = 'english' | 'hindi' | 'youth-camp'

interface Stanza {
  label: string
  text: string
  is_chorus: boolean
}

interface SongRow {
  category: Category
  number: number
  title: string
  stanzas: Stanza[]
}

function normalizeText(t: string): string {
  return t.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

function isChorusLabel(label: string): boolean {
  return /chorus|कोरस/i.test(label)
}

// --- Parse HTML (english / hindi) ---
function fromHtml(filePath: string, category: Category): SongRow | null {
  const html = readFileSync(filePath, 'utf8')
  const root = parseHtml(html)

  const rawTitle = root.querySelector('title')?.text?.trim() ?? ''
  const title = rawTitle.replace(/^\d+\s*[-–]\s*/, '').trim()
  const number = (() => {
    const m = basename(filePath).match(/(\d+)/)
    return m ? parseInt(m[1], 10) : 0
  })()
  if (!title || !number) return null

  const stanzas: Stanza[] = []

  for (const div of root.querySelectorAll('div.stanza')) {
    const labelEl = div.querySelector('.stanza-label')
    const labelText = labelEl?.text?.trim() ?? ''
    labelEl?.remove()
    const text = normalizeText(div.text)
    if (!text) continue
    stanzas.push({ label: labelText, text, is_chorus: isChorusLabel(labelText) })
  }

  return { category, number, title, stanzas }
}

// --- Parse TXT (youth-camp) ---
function fromTxt(filePath: string, category: Category): SongRow | null {
  const content = readFileSync(filePath, 'utf8')
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  let title = ''
  const number = (() => {
    const m = basename(filePath).match(/(\d+)/)
    return m ? parseInt(m[1], 10) : 0
  })()

  const stanzas: Stanza[] = []

  // Find TITLE line
  for (const line of lines) {
    const m = line.match(/^TITLE:\s*(.+)/)
    if (m) { title = m[1].trim(); break }
  }

  // Parse blocks: a block starts with a header line like "STANZA 1:" or "CHORUS:"
  // Collect consecutive non-header, non-empty lines as its text
  let currentLabel: string | null = null
  let currentLines: string[] = []

  function flush() {
    if (currentLabel === null) return
    const text = currentLines.join('\n').trim()
    if (text) {
      stanzas.push({ label: currentLabel, text, is_chorus: isChorusLabel(currentLabel) })
    }
    currentLabel = null
    currentLines = []
  }

  for (const line of lines) {
    // Block header: "STANZA N:", "CHORUS:", "VERSE N:", etc.
    const header = line.match(/^(CHORUS|STANZA\s*\d+|VERSE\s*\d+)\s*:/i)
    if (header) {
      flush()
      currentLabel = header[1].trim()
      continue
    }
    // Skip meta lines
    if (/^(CATEGORY|TITLE)\s*:/i.test(line)) continue

    if (currentLabel !== null) {
      currentLines.push(line)
    }
  }
  flush()

  if (!title || !number || stanzas.length === 0) return null
  return { category, number, title, stanzas }
}

const SOURCES: { dir: string; category: Category; ext: string }[] = [
  { dir: 'english',          category: 'english',    ext: '.html' },
  { dir: 'hindi',            category: 'hindi',      ext: '.html' },
  { dir: 'youth-camp-songs', category: 'youth-camp', ext: '.txt'  },
]

async function main() {
  const rows: SongRow[] = []

  for (const { dir, category, ext } of SOURCES) {
    let files: string[]
    try {
      files = readdirSync(dir).filter((f) => extname(f) === ext)
    } catch {
      console.warn(`Skipping ${dir} (not found)`)
      continue
    }

    for (const file of files) {
      const path = join(dir, file)
      const row = ext === '.html' ? fromHtml(path, category) : fromTxt(path, category)
      if (row) rows.push(row)
      else console.warn(`  Skipped: ${file}`)
    }
  }

  console.log(`Parsed ${rows.length} songs. Upserting…`)

  const BATCH = 50
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('songs')
      .upsert(batch, { onConflict: 'category,number' })
    if (error) console.error(`Batch ${i}–${i + BATCH} failed:`, error.message)
  }

  const counts: Record<string, number> = {}
  for (const r of rows) counts[r.category] = (counts[r.category] ?? 0) + 1
  for (const [cat, n] of Object.entries(counts)) console.log(`  ${cat}: ${n}`)
  console.log('Done.')
}

main()
