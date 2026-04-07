# Song Book App — Specs

## Goal
Migrate the static song-book site to a React + Vite + TypeScript SPA hosted on GitHub Pages, backed by Supabase, with a `/admin` page for CRUD. No Python script, no per-song HTML files, no redeploy on content edits.

## Stack
- Vite + React 18 + TypeScript
- react-router-dom v6
- @supabase/supabase-js
- Plain CSS (no Tailwind, no UI library)
- node-html-parser (migration script only, devDependency)

## Repo
GitHub: `jason-dan-iel/song-book`
GitHub Pages base path: `/song-book/`

## Data model (Supabase table `songs`)
| column     | type        | notes |
|------------|-------------|-------|
| id         | uuid pk     | default gen_random_uuid() |
| category   | text        | 'english' \| 'hindi' \| 'youth-camp' |
| number     | int         | unique within category |
| title      | text        | |
| chorus     | text null   | optional |
| stanzas    | jsonb       | array of strings, each a stanza block |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: public SELECT; INSERT/UPDATE/DELETE only for `authenticated` role.
One admin user created manually in Supabase dashboard.

## Env vars (`.env`, also `.env.example`)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
Migration script reads `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` (gitignored).

## Routes
- `/` — landing with three category links
- `/c/:category` — song list with A–Z letter filter
- `/c/:category/:number` — song detail with sticky chorus
- `/admin` — login form → CRUD table

## Pages

### Home (`/`)
Three large links: English · Hindi · Youth Camp.

### Category list (`/c/:category`)
- Heading: category name.
- A–Z letter buttons + "All" to filter by first letter of title.
- Numbered list `<num>. <title>` linking to detail page.

### Song detail (`/c/:category/:number`)
- Top bar: ← prev | Category | next → (by number), font size A− / A+.
- Title as `<h1>`.
- Stanzas in order, each labelled `1`, `2`, …
- If `chorus` exists: sticky element.
  - Mobile (`max-width: 768px`): `position: sticky; bottom: 0; background: #ffffe0; border-top: 2px solid #888; padding: 8px;`
  - Desktop: `position: sticky; top: 60px;` shown above stanzas with same background.
- Font size persisted to `localStorage` key `fontSize`.

### Admin (`/admin`)
- No session → email + password form → `supabase.auth.signInWithPassword`.
- Session → table: category | number | title | [Edit] [Delete].
  - "Add song" button opens inline form.
  - Edit prefills form.
  - Form fields: category select, number input, title input, chorus textarea (optional), stanzas — dynamic list of textareas with [+ Add stanza] / [× Remove] buttons.
  - Save → `upsert`, delete → `delete`.
- Logout button top-right.

## Styling (`src/styles.css`, ~150 lines)
```css
body { font-family: Verdana, Arial, sans-serif; font-size: 14px; color: #000; background: #fff; max-width: 900px; margin: 0 auto; padding: 10px; }
a { color: #00f; text-decoration: underline; }
a:visited { color: #551a8b; }
button { border: 1px solid #888; background: #eee; padding: 4px 8px; border-radius: 0; cursor: pointer; }
button:hover { background: #ddd; }
table { border-collapse: collapse; width: 100%; }
td, th { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
```
No shadows, no transitions, no rounded corners. Tables for admin list.

## Migration script (`scripts/migrate.ts`)
1. Walk `english/*.html`, `hindi/*.html`, `youth-camp-songs/*.html`.
2. Parse with `node-html-parser`:
   - `title`: `<title>` text, strip leading `"<num> - "`.
   - `number`: digits from filename (`eng-001.html` → 1).
   - `category`: folder → `english` | `hindi` | `youth-camp`.
   - Iterate `div.stanza`: remove `.stanza-label` child, get remaining innerText trimmed.
     - If label text matches `/chorus/i` → set as `chorus`.
     - Else → push to `stanzas` array.
3. Upsert rows via Supabase service role key, conflict on `(category, number)`.
4. Print count per category on finish.

Run: `npm run migrate`
Script: `tsx scripts/migrate.ts` (uses `tsx` devDep, reads `.env.local`).

## GitHub Pages deploy (`.github/workflows/deploy.yml`)
```yaml
on:
  push:
    branches: [main]

jobs:
  deploy:
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - run: cp dist/index.html dist/404.html
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - id: deployment
        uses: actions/deploy-pages@v4
```
Repo secrets needed: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## vite.config.ts
```ts
base: '/song-book/'
```

## File tree
```
package.json
vite.config.ts
tsconfig.json
index.html
.env.example
.gitignore
.github/workflows/deploy.yml
scripts/migrate.ts
src/
  main.tsx
  router.tsx
  styles.css
  types.ts
  lib/supabase.ts
  hooks/useSongs.ts
  components/
    Navbar.tsx
    LetterFilter.tsx
    StickyChorus.tsx
    SongForm.tsx
  pages/
    Home.tsx
    CategoryList.tsx
    SongDetail.tsx
    Admin.tsx
```

## Files to delete after migration verified
`add_song.py`, `english/`, `hindi/`, `youth-camp-songs/`, `youth camp/`, `*.txt`, root `index.html`, `css/`, `js/`, `browserconfig.xml`, `sample-*.txt`, `1.txt`.

## Acceptance checklist
- [ ] `npm run dev` — all 3 categories browsable, song detail renders stanzas
- [ ] Sticky chorus visible while scrolling on a long song
- [ ] A–Z filter works
- [ ] Font size +/- persists across page reloads
- [ ] `/admin` login works; CRUD shows changes on public pages immediately
- [ ] `npm run build` succeeds
- [ ] Deep links and `/admin` work after hard refresh on deployed site
- [ ] Migration script upserts all songs; spot-check 5 random songs
