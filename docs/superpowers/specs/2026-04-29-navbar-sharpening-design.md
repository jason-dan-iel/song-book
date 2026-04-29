# Navbar Sharpening — Design Spec

**Date:** 2026-04-29
**Status:** Approved direction (B · Sharpened), pending user spec review
**Scope:** Visual + structural changes to the sticky page header (`.page-head`) and the home `.topbar`. No layout reflow elsewhere; lyrics, lists, and admin pages are untouched.

## Problem

The current sticky header on the song-detail and category-list pages reads as decoration rather than navigation:

- Back-link uses `--mute` (`#818876`), low-contrast against the parchment background — fails the "is this a link?" glance test.
- Page title is 13px, weight 400 — small enough that the eye skips it.
- The right-slot pagination (`01 / 06`) on the category list also uses `--mute`.
- Net effect: users don't perceive the header as a control surface. The app feels like a flat scroll of text with a faint band on top.

The home `.topbar` (brand mark + total song count) has the same issue: both elements sit at `--mute`, making the brand strip ghostly.

## Goal

Raise the header to a visible, legible navigation control while preserving the parchment-and-forest aesthetic of the rest of the app. Direction B from brainstorming: keep the existing 3-column architecture, sharpen contrast, weight, and size; introduce a small uppercase "kicker" so the title carries context without growing too large.

## Design Tokens (additions / changes)

Add to the `:root` block in `src/styles.css`:

```css
--ink-rule:    rgba(20, 24, 26, 0.16);   /* stronger anchor for the bar's bottom border */
--ink-outline: rgba(20, 24, 26, 0.28);   /* outlined controls (chevron disc, A−/A+) */
```

Update existing token:

```css
--head-h: 70px;   /* was 55px — accounts for the two-line title (10px crumb + 16px label) plus 14+14px padding plus 1.5px border. Verify rendered height post-implementation; nudge ±2px if there's a visible gap or overlap with the chorus sticky. */
```

No palette changes. `--ink`, `--mute`, `--accent`, etc. all unchanged.

## Component Specs

### `.page-head` (used on CategoryList + SongDetail)

| Property | Before | After |
|---|---|---|
| Padding | `20px 22px 14px` | `14px 22px` (tighter top/bottom; horizontal kept at 22px to align with `.col`'s 22px gutter) |
| Bottom border | `1px solid var(--rule)` | `1.5px solid var(--ink-rule)` |
| Grid alignment | `align-items: baseline` | `align-items: center` (so the chevron disc, title, and buttons share a vertical axis) |

### `.page-head .back-arrow`

Becomes a flex container with a circled chevron + label:

```html
<Link className="back-arrow">
  <span className="arrow">←</span>
  <span className="label">{label}</span>
</Link>
```

| Property | Before | After |
|---|---|---|
| Color | `var(--mute)` | `var(--ink)` |
| Font size | `14px` | `15px` |
| Font weight | inherited (400) | `500` |
| Letter-spacing | default | `-0.005em` (slight tighten — Fraunces handles tightening cleanly at body sizes) |
| Layout | text-only | `display: inline-flex; align-items: center; gap: 6px` |

The `.arrow` child is a 28×28 outlined disc:

```css
.back-arrow .arrow {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 1px solid var(--ink-outline);
  font-size: 16px;
  line-height: 1;
  transition: background var(--t-fast), color var(--t-fast);
}
.back-arrow:hover .arrow,
.back-arrow:active .arrow {
  background: var(--ink);
  color: var(--bg);
}
```

### `.page-head .page-title`

Becomes a two-line stack: optional small kicker, then the number/label:

```html
<span className="page-title">
  <span className="crumb">Song</span>      {/* SongDetail */}
  <span>#012</span>
</span>
```

```html
<span className="page-title">
  <span className="crumb">Category</span>  {/* CategoryList */}
  <span>{label}</span>
</span>
```

| Property | Before | After |
|---|---|---|
| Font size (main line) | `13px` | `16px` |
| Font weight | 400 | `500` |
| Letter-spacing (main line) | `0.05em` | `-0.005em` |
| `.crumb` (new) | — | `font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--mute); font-weight: 500; margin-bottom: 2px; display: block;` |

`tnum` numeric features remain on the page-title via existing `font-feature-settings: "tnum", "onum"` in the `.tnum` class.

### `.page-head .right-slot` and `.fs-ctrl`

Buttons grow and gain real outlines:

| Property | Before | After |
|---|---|---|
| Button size | 30×30 | `34×34` |
| Border | `1px solid var(--rule)` (rgba 0.10) | `1px solid var(--ink-outline)` (rgba 0.28) |
| Font size | 13px | `14px` |
| Font weight | inherited (400) | `500` |
| Hover | invert to `--ink` background, `--bg` text | unchanged |

The CategoryList `.right-slot` pagination (`01 / 06`) keeps its current structure but updates color:

| Property | Before | After |
|---|---|---|
| Color | `var(--mute)` | `var(--soft)` (`#36403A` — readable, still secondary to the title) |
| Font size | `12px` | `12px` (unchanged) |
| Letter-spacing | `0.04em` | `0.04em` (unchanged) |

### `.topbar` (Home only)

Same legibility lift, smaller scope (no back-link, no controls):

| Property | Before | After |
|---|---|---|
| Bottom border | `1px solid var(--rule)` | `1.5px solid var(--ink-rule)` |
| `.mark` color | `var(--ink)` | `var(--ink)` (unchanged — already dark) |
| `.mark` font-weight | 500 | `500` (unchanged) |
| `.meta` color (overall) | `var(--mute)` | `var(--soft)` |
| `.meta b` | already `--ink`, weight 500 | unchanged |

Net effect: the brand strip on Home reads as solid rather than ghostly, without restructuring.

## Animation

`.page-head` already animates via the shared `rise` keyframe. No animation changes. The `prefers-reduced-motion` block already disables transitions, including the new chevron hover.

## Accessibility

- Back-link contrast ratio improves from ~3.4:1 (mute on bg) to ~14:1 (ink on bg). Comfortably exceeds WCAG AA for text and AAA for body copy.
- Chevron disc maintains 24px target visually but the parent `<a>` (which is the click area) is the real touch target — already at least 28px tall × variable width. The disc is decorative inside the link.
- A−/A+ touch targets grow from 30px to 34px — closer to Apple's 44pt and Material's 48dp guidelines without dominating the bar.
- The `.crumb` is decorative metadata, not a heading. It carries no semantic role; it stays a `<span>`.

## Out of Scope

Explicitly NOT changed in this spec:

- Audio playback (separate decision in progress).
- Lyric body, stanza, chorus, or song-banner styling.
- Category list rows, search bar, sort toggles.
- Admin pages.
- Color palette beyond the two new outline tokens.
- Devanagari/Tiro font handling.
- Chorus sticky behavior (offset adjusts automatically via `--head-h`).

## Files Affected

- `src/styles.css` — token additions and rule edits per the tables above.
- `src/pages/SongDetail.tsx` — wrap back-arrow in flex children (`.arrow` + `.label`); wrap page-title in two-line stack with `<span class="crumb">Song</span>`.
- `src/pages/CategoryList.tsx` — same back-arrow + page-title shape with `<span class="crumb">Category</span>`. Also remove the inline `style={{ fontSize: 12, color: 'var(--mute)', letterSpacing: '0.04em' }}` on the right-slot pagination span — replace with a class (e.g. `.page-head .pagination`) defined in `styles.css` so the color shift to `--soft` is owned by the stylesheet, not the component.

No other files need changes.

## Verification

1. Visual check at http://localhost:5173/song-book/ — Home, a category page, a song detail. Confirm bar reads as navigation at a glance on each.
2. Confirm chorus sticky still aligns flush below the bar (header offset matches `--head-h: 62px`).
3. Confirm A−/A+ still increment/decrement font size and persist to localStorage.
4. Hover the back-link disc — should invert to ink-on-bg.
5. Mobile width (~375px) — all three columns stay legible without clipping; no overflow.
6. `prefers-reduced-motion` — open DevTools rendering tab, emulate; entrance animation disabled.

## Success Criteria

- Back-link is unambiguously legible and reads as a control on first glance.
- Page-title carries enough weight that the eye registers it without effort.
- Bar feels anchored — visible separation from scrolling content.
- Aesthetic remains "parchment + forest"; no dark-mode flip, no brand color changes.
