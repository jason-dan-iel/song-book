# Navbar Sharpening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Direction B (Sharpened) from `docs/superpowers/specs/2026-04-29-navbar-sharpening-design.md` — raise contrast and weight on the sticky `.page-head` and home `.topbar` so navigation reads as navigation.

**Architecture:** Two CSS commits (tokens, then rules) followed by two markup commits (SongDetail, CategoryList) followed by a verification sweep. Each commit leaves the app in a working state because old markup gracefully degrades under new styles.

**Tech Stack:** Vite + React 18 + TypeScript, plain CSS in `src/styles.css`. No test framework in this repo — verification is visual via the running Vite dev server at http://localhost:5173/song-book/.

**Source spec:** `docs/superpowers/specs/2026-04-29-navbar-sharpening-design.md`

---

## Pre-flight

- Vite dev server should already be running on port 5173 (started during brainstorming). If not: `pnpm dev` in the project root.
- Confirm at least one song exists in each category in Supabase (the home, a category list, and a song detail page must all render content during verification). The dev server uses live Supabase via `VITE_SUPABASE_*` env vars.

---

### Task 1: Add new design tokens

**Files:**
- Modify: `src/styles.css:6-28` (the `:root` block)

- [ ] **Step 1: Add `--ink-rule` and `--ink-outline`; bump `--head-h`**

  Open `src/styles.css`. Locate the `:root` block at the top of the file. Inside the existing `/* Layout */` group, replace:

  ```css
    /* Layout */
    --head-h: 55px;
  ```

  with:

  ```css
    /* Layout */
    --head-h: 70px;

    /* Header outline tokens (added 2026-04-29 — see specs/2026-04-29-navbar-sharpening-design.md) */
    --ink-rule:    rgba(20, 24, 26, 0.16);
    --ink-outline: rgba(20, 24, 26, 0.28);
  ```

- [ ] **Step 2: Verify the dev server hot-reloads cleanly**

  Browser tab on http://localhost:5173/song-book/. Open DevTools → Console. Expected: no CSS parse warnings, no React errors. The bar will look identical for now (still 55px-tall visually because no rules consume the new tokens yet) — that's expected.

- [ ] **Step 3: Commit**

  ```bash
  git add src/styles.css
  git commit -m "$(cat <<'EOF'
  feat(styles): add --ink-rule, --ink-outline tokens; bump --head-h to 70px

  Tokens consumed by upcoming navbar rule changes.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

### Task 2: Update CSS rules — page-head shell, back-arrow, page-title, fs-ctrl, pagination, topbar

**Files:**
- Modify: `src/styles.css` (multiple rule blocks under "Page header" and "Top bar" sections)

This task batches all CSS changes into one commit. The markup hasn't changed yet, so the bar will render with the new styling but old structure (text-only back-link, single-line title). That's a graceful intermediate state — verify it still reads OK before moving on.

- [ ] **Step 1: Replace the `.page-head` rule (lines ~111-121)**

  Find:

  ```css
  .page-head {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: baseline;
    padding: 20px 22px 14px;
    border-bottom: 1px solid var(--rule);
    max-width: 560px;
    margin: 0 auto;
    background: var(--bg);
  }
  ```

  Replace with:

  ```css
  .page-head {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 14px 22px;
    border-bottom: 1.5px solid var(--ink-rule);
    max-width: 560px;
    margin: 0 auto;
    background: var(--bg);
  }
  ```

- [ ] **Step 2: Replace the `.page-head .back-arrow` rules (lines ~131-138)**

  Find:

  ```css
  .page-head .back-arrow {
    color: var(--mute);
    font-size: 14px;
    font-variation-settings: "opsz" 14;
    transition: color var(--t-fast);
  }
  .page-head .back-arrow:hover,
  .page-head .back-arrow:active { color: var(--ink); }
  ```

  Replace with:

  ```css
  .page-head .back-arrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink);
    font-size: 15px;
    font-weight: 500;
    letter-spacing: -0.005em;
    font-variation-settings: "opsz" 14;
  }
  .page-head .back-arrow .arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid var(--ink-outline);
    font-size: 16px;
    line-height: 1;
    transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
  }
  .page-head .back-arrow:hover .arrow,
  .page-head .back-arrow:active .arrow {
    background: var(--ink);
    color: var(--bg);
    border-color: var(--ink);
  }
  ```

- [ ] **Step 3: Replace the `.page-head .page-title` rule (lines ~140-147)**

  Find:

  ```css
  .page-head .page-title {
    text-align: center;
    font-size: 13px;
    color: var(--ink);
    letter-spacing: 0.05em;
    font-variation-settings: "opsz" 14;
    font-feature-settings: "tnum", "onum";
  }
  ```

  Replace with:

  ```css
  .page-head .page-title {
    text-align: center;
    font-size: 16px;
    font-weight: 500;
    color: var(--ink);
    letter-spacing: -0.005em;
    line-height: 1.15;
    font-variation-settings: "opsz" 14;
    font-feature-settings: "tnum", "onum";
  }
  .page-head .page-title .crumb {
    display: block;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--mute);
    margin-bottom: 2px;
    /* uppercase tracking already handles legibility — drop tnum here */
    font-feature-settings: normal;
  }
  ```

- [ ] **Step 4: Replace the `.fs-ctrl` button rules (lines ~157-178)**

  Find:

  ```css
  /* Lyrics A−/A+ controls */
  .fs-ctrl { display: flex; gap: 6px; }
  .fs-ctrl button {
    appearance: none;
    border: 1px solid var(--rule);
    background: transparent;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    font-family: 'Fraunces', serif;
    font-variation-settings: "opsz" 14;
    font-size: 13px;
    color: var(--ink);
    cursor: pointer;
    padding: 0;
    transition: background var(--t-fast), color var(--t-fast), transform var(--t-fast);
  }
  .fs-ctrl button:hover,
  .fs-ctrl button:active {
    background: var(--ink);
    color: var(--bg);
  }
  .fs-ctrl button:active { transform: scale(0.94); }
  ```

  Replace with:

  ```css
  /* Lyrics A−/A+ controls */
  .fs-ctrl { display: flex; gap: 8px; }
  .fs-ctrl button {
    appearance: none;
    border: 1px solid var(--ink-outline);
    background: transparent;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    font-family: 'Fraunces', serif;
    font-variation-settings: "opsz" 14;
    font-size: 14px;
    font-weight: 500;
    color: var(--ink);
    cursor: pointer;
    padding: 0;
    transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast), transform var(--t-fast);
  }
  .fs-ctrl button:hover,
  .fs-ctrl button:active {
    background: var(--ink);
    color: var(--bg);
    border-color: var(--ink);
  }
  .fs-ctrl button:active { transform: scale(0.94); }
  ```

- [ ] **Step 5: Add the `.pagination` class for the category-list right-slot**

  Insert this rule immediately after the `.fs-ctrl button:active { transform: scale(0.94); }` line (i.e. right after the block edited in Step 4):

  ```css
  /* Right-slot pagination indicator (e.g. "01 / 06" on category list).
     Replaces the inline style that used --mute. */
  .page-head .pagination {
    font-size: 12px;
    color: var(--soft);
    letter-spacing: 0.04em;
    font-feature-settings: "tnum", "onum";
  }
  ```

- [ ] **Step 6: Update `.topbar` (lines ~82-106) for legibility lift**

  Find:

  ```css
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--rule);
    color: var(--mute);
  }
  ```

  Replace with:

  ```css
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 14px;
    border-bottom: 1.5px solid var(--ink-rule);
    color: var(--soft);
  }
  ```

  (The `.topbar .meta` rule one block down already inherits color from `.topbar`, so changing the parent color is enough. `.topbar .mark` and `.topbar .meta b` both explicitly set `color: var(--ink)` and stay dark — no change.)

- [ ] **Step 7: Visual verification (intermediate state)**

  Browser → http://localhost:5173/song-book/ . Walk:
  - **Home** — brand strip on top: stronger bottom line; "songs" count slightly darker than before. Brand mark "SONG BOOK" still ink-dark. ✓
  - **Category** (`/c/english`) — back-link "← Home" should be **ink-dark, weight 500**, but **without the chevron disc yet** (markup still old). Title "English" should be **larger (16px, weight 500)** but **without "CATEGORY" kicker yet**. Right-slot "01 / 06" still uses old inline style — color hasn't shifted yet. A−/A+ N/A here. Bar bottom border noticeably stronger.
  - **Song detail** (`/c/english/1`) — "← English" ink-dark; "#001" larger but no kicker yet. A−/A+ buttons larger (34px) with stronger outline. Hover the buttons: invert to ink-on-bg cleanly.
  - **Chorus sticky** — scroll a song with a chorus. The chorus should pin flush below the bar with no overlap and no gap. If there's a visible mismatch, note the rendered header height with DevTools (Inspect `.page-head`, read `Computed → height`) and adjust `--head-h` accordingly. Acceptable range: 66-74px.

- [ ] **Step 8: Commit**

  ```bash
  git add src/styles.css
  git commit -m "$(cat <<'EOF'
  feat(styles): sharpen page-head and topbar contrast

  - .page-head: tighten padding (14px vert), strengthen border, center-align rows
  - .back-arrow: ink-dark + 28px outlined chevron disc with hover invert
  - .page-title: 16px/500 with optional 10px uppercase .crumb kicker
  - .fs-ctrl button: 30→34px, ink-outline border, weight 500
  - .pagination: new class replacing inline --mute style on category-list right-slot
  - .topbar: stronger bottom border, .meta lifted from --mute to --soft

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

### Task 3: Update SongDetail markup

**Files:**
- Modify: `src/pages/SongDetail.tsx:42-55`

The current `header` helper passes `title` as a `React.ReactNode` and renders a single-line back-link. The new shape: chevron disc + label children inside `.back-arrow`, and crumb + label children inside `.page-title`. Add an optional `kicker` parameter.

- [ ] **Step 1: Replace the `header` helper**

  Find this block in `src/pages/SongDetail.tsx`:

  ```tsx
    const header = (title: React.ReactNode, showControls = true) => (
      <div className="page-head sticky">
        <Link to={`/c/${cat}`} className="back-arrow">← {catLabel}</Link>
        <span className="page-title tnum">{title}</span>
        <span className="right-slot">
          {showControls && (
            <span className="fs-ctrl">
              <button onClick={() => setFontSize((s) => Math.max(MIN_SIZE, s - 1))} aria-label="Decrease font size">A−</button>
              <button onClick={() => setFontSize((s) => Math.min(MAX_SIZE, s + 1))} aria-label="Increase font size">A+</button>
            </span>
          )}
        </span>
      </div>
    )
  ```

  Replace with:

  ```tsx
    const header = (title: React.ReactNode, kicker?: string, showControls = true) => (
      <div className="page-head sticky">
        <Link to={`/c/${cat}`} className="back-arrow">
          <span className="arrow" aria-hidden="true">←</span>
          <span className="label">{catLabel}</span>
        </Link>
        <span className="page-title tnum">
          {kicker && <span className="crumb">{kicker}</span>}
          <span>{title}</span>
        </span>
        <span className="right-slot">
          {showControls && (
            <span className="fs-ctrl">
              <button onClick={() => setFontSize((s) => Math.max(MIN_SIZE, s - 1))} aria-label="Decrease font size">A−</button>
              <button onClick={() => setFontSize((s) => Math.min(MAX_SIZE, s + 1))} aria-label="Increase font size">A+</button>
            </span>
          )}
        </span>
      </div>
    )
  ```

- [ ] **Step 2: Update the three call sites for `header(...)`**

  In `src/pages/SongDetail.tsx`, update each `header(...)` invocation to pass the new positional args (`title, kicker?, showControls?`).

  Find:

  ```tsx
    if (loading) return <div>{header('', false)}<p className="loading-msg">Loading…</p></div>
    if (error) return <div>{header('', false)}<p className="error-msg" style={{ margin: '16px 22px' }}>{error}</p></div>
    if (!song) return <div>{header('', false)}<p className="loading-msg">Song not found.</p></div>
  ```

  Replace with:

  ```tsx
    if (loading) return <div>{header('', undefined, false)}<p className="loading-msg">Loading…</p></div>
    if (error) return <div>{header('', undefined, false)}<p className="error-msg" style={{ margin: '16px 22px' }}>{error}</p></div>
    if (!song) return <div>{header('', undefined, false)}<p className="loading-msg">Song not found.</p></div>
  ```

  Then find the success-state header call lower in the file:

  ```tsx
        {header(`#${String(song.number).padStart(3, '0')}`)}
  ```

  Replace with:

  ```tsx
        {header(`#${String(song.number).padStart(3, '0')}`, 'Song')}
  ```

- [ ] **Step 3: Visual verification**

  Browser → http://localhost:5173/song-book/c/english/1 . Confirm:
  - Back-link reads **← English** with the **arrow inside a 28px outlined disc**.
  - Hover the back-link: only the disc inverts (ink fill, parchment arrow). Label text stays ink-dark.
  - Title is **a stack: small uppercase "SONG" (10px, mute color) above larger "#001" (16px, weight 500)**.
  - A−/A+ still functional: click each, verify font size in stanza body changes; refresh — size persists from localStorage.
  - Loading/error/not-found states (briefly visible during slow network or by typing an out-of-range song number e.g. `/c/english/9999`): bar renders with empty title, no kicker, no controls, but the chevron disc and "← English" label still visible.

- [ ] **Step 4: TypeScript compile check**

  Run:

  ```bash
  pnpm exec tsc --noEmit
  ```

  Expected: clean. If there's a "header arguments" error, double-check the call sites in Step 2.

- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/SongDetail.tsx
  git commit -m "$(cat <<'EOF'
  feat(song-detail): adopt sharpened page-head markup

  - Back-arrow now has child .arrow (chevron disc) and .label
  - Page-title now has optional .crumb kicker; pass 'Song' on success state
  - header() gains optional kicker arg; existing call sites pass undefined

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

### Task 4: Update CategoryList markup

**Files:**
- Modify: `src/pages/CategoryList.tsx:65-72`

CategoryList writes the header inline (no helper). Replace with the new shape, drop the inline style, apply the new `.pagination` class.

- [ ] **Step 1: Replace the page-head block**

  Find this block in `src/pages/CategoryList.tsx` (around lines 65-72):

  ```tsx
        <div className="page-head sticky">
          <Link to="/" className="back-arrow">← Home</Link>
          <span className="page-title">{label}</span>
          <span className="right-slot tnum" style={{ fontSize: 12, color: 'var(--mute)', letterSpacing: '0.04em' }}>
            {String(catIndex + 1).padStart(2, '0')}&thinsp;/&thinsp;{String(CATEGORIES.length).padStart(2, '0')}
          </span>
        </div>
  ```

  Replace with:

  ```tsx
        <div className="page-head sticky">
          <Link to="/" className="back-arrow">
            <span className="arrow" aria-hidden="true">←</span>
            <span className="label">Home</span>
          </Link>
          <span className="page-title">
            <span className="crumb">Category</span>
            <span>{label}</span>
          </span>
          <span className="right-slot pagination tnum">
            {String(catIndex + 1).padStart(2, '0')}&thinsp;/&thinsp;{String(CATEGORIES.length).padStart(2, '0')}
          </span>
        </div>
  ```

- [ ] **Step 2: Visual verification**

  Browser → http://localhost:5173/song-book/c/english . Confirm:
  - Back-link reads **← Home** with the chevron disc.
  - Title stack: small uppercase **"CATEGORY"** (10px, mute) above **"English"** (16px, weight 500).
  - Right-slot **"01 / 06"** is now in the **`--soft` color** (a notch darker than before, but still secondary to the title).
  - Cycle through `/c/hindi`, `/c/youth-camp`, `/c/chorus`, `/c/yc-chorus`, `/c/special`. Each shows the correct index number ("02 / 06" through "06 / 06") and label.
  - Click the back-arrow: navigates to `/`. ✓
  - Click any song row: navigates to song detail and the header continues to look consistent.

- [ ] **Step 3: TypeScript compile check**

  Run:

  ```bash
  pnpm exec tsc --noEmit
  ```

  Expected: clean.

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/CategoryList.tsx
  git commit -m "$(cat <<'EOF'
  feat(category-list): adopt sharpened page-head markup

  - Back-arrow gets .arrow (chevron disc) + .label children
  - Page-title gets a 'Category' .crumb kicker
  - Right-slot uses new .pagination class; inline style removed

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

### Task 5: Final verification sweep + production build

This task verifies the integrated whole and that the production build is clean. No code changes, no commit unless something needs fixing.

- [ ] **Step 1: End-to-end browser walk**

  Browser → http://localhost:5173/song-book/ . Walk this sequence and confirm each:

  1. **Home** — brand strip: "SONG BOOK" mark left (ink-dark), "N songs" right (soft, with bold ink count). Bottom border is the new stronger 1.5px ink-tinted line.
  2. Click **English** category → category list renders. Bar shows ← Home, CATEGORY/English stack, 01 / 06 readout.
  3. Click any song → song detail. Bar shows ← English, SONG/#NNN stack, A−/A+ buttons.
  4. **Hover the back-arrow disc** → inverts ink-on-bg.
  5. **Click A+ four times, then A− twice** → font size visibly grows then shrinks. Refresh page → size persists.
  6. **Scroll a song that has a chorus** (most do) → chorus pins **flush below** the bar. No overlap, no gap. If there's a 2-3px misalignment, note it and adjust `--head-h` in `src/styles.css` (e.g. ±2px) and re-verify.
  7. Click prev/next at the bottom — bar updates correctly.
  8. Back-arrow → returns to category list. Then Home. Each transition the bar morphs cleanly.

- [ ] **Step 2: Mobile width check**

  Open DevTools → device toolbar → iPhone SE (375×667). Walk the same flow:
  - Bar fits without horizontal scroll.
  - Three columns (back-link, title stack, right-slot) all visible. The title stack center-aligns; long category labels (e.g. "Youth Camp") may wrap or sit close to neighbors — confirm no clipping.
  - A−/A+ buttons are tappable (34px, comfortable).

- [ ] **Step 3: Reduced-motion check**

  DevTools → Rendering tab → "Emulate CSS media feature `prefers-reduced-motion`" → set to `reduce`. Reload. Expected: no entrance fade-in, hovers don't transition (existing global rule already handles this).

- [ ] **Step 4: Production build**

  Run:

  ```bash
  pnpm build
  ```

  Expected: clean TypeScript compile + Vite build, no warnings about the new tokens or class. Output bundle in `dist/`.

- [ ] **Step 5: If `--head-h` needed adjustment in Step 1.6, commit it**

  ```bash
  git add src/styles.css
  git commit -m "$(cat <<'EOF'
  fix(styles): nudge --head-h to match rendered .page-head height

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

  (Otherwise no commit needed for Task 5.)

---

## Self-Review Checklist (run after writing, before handing off)

**Spec coverage:**
- ✓ Tokens added (`--ink-rule`, `--ink-outline`, `--head-h: 70px`) — Task 1
- ✓ `.page-head` shell rule (padding, border, alignment) — Task 2 Step 1
- ✓ `.back-arrow` rules + chevron disc rules + hover — Task 2 Step 2
- ✓ `.page-title` rules + `.crumb` rule — Task 2 Step 3
- ✓ `.fs-ctrl` button sizing/contrast — Task 2 Step 4
- ✓ `.pagination` class on category-list right-slot — Task 2 Step 5
- ✓ `.topbar` border + `.meta` color — Task 2 Step 6
- ✓ SongDetail.tsx markup — Task 3
- ✓ CategoryList.tsx markup + inline-style removal — Task 4
- ✓ Chorus sticky offset verification — Task 5 Step 1.6
- ✓ Mobile width check, reduced-motion check, prod build — Task 5
- ✓ Files Affected from spec exactly match: `src/styles.css`, `src/pages/SongDetail.tsx`, `src/pages/CategoryList.tsx`

**Placeholder scan:** No "TBD", "implement later", "similar to Task N" — every step has the actual code.

**Type consistency:**
- `header` helper signature: `(title: React.ReactNode, kicker?: string, showControls = true)` — used consistently across all four call sites in Task 3.
- Class names consistent everywhere: `.back-arrow .arrow`, `.back-arrow .label`, `.page-title .crumb`, `.page-head .pagination`. JSX className strings match CSS selectors exactly.
