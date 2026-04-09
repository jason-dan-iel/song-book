# Niagara-Style AlphaSidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tap-only AlphaSidebar with a drag-to-scrub interaction — finger slides along letters, list jumps in real-time, a floating teal bubble shows the current letter.

**Architecture:** All changes stay inside `AlphaSidebar.tsx` (pointer events + internal drag state + bubble element) and `styles.css` (`.alpha-bubble` class + transition additions). The `Props` interface and `onChange` contract are unchanged — `CategoryList` is not touched.

**Tech Stack:** React 18, TypeScript, CSS custom properties (already defined on `:root`)

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `src/components/AlphaSidebar.tsx` | Add drag state, pointer handlers, bubble, neighbour scaling |
| Modify | `src/styles.css` | Add `.alpha-bubble`, add `position: relative` + `touch-action: none` to `.alpha-sidebar`, add transition + `.neighbour` to `.alpha-sidebar button` |

---

## Task 1: CSS — Bubble and Transition Styles

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add `position: relative` and `touch-action: none` to `.alpha-sidebar`**

Find the existing `.alpha-sidebar` rule and add two properties:

```css
.alpha-sidebar {
  background: var(--light);
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 24px;
  border-left: 1px solid var(--border);
  position: relative;        /* ← add: contains the absolute bubble */
  touch-action: none;        /* ← add: prevents browser scroll hijacking drag */
}
```

- [ ] **Step 2: Add transitions and `.neighbour` state to `.alpha-sidebar button`**

Find the existing `.alpha-sidebar button` rule and add a `transition` property:

```css
.alpha-sidebar button {
  background: none;
  border: none;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  color: var(--badge-text);
  cursor: pointer;
  border-radius: 4px;
  line-height: 1.6;
  width: 100%;
  text-align: center;
  transition: transform 0.08s ease-out, font-size 0.08s ease-out;  /* ← add */
}
```

Add a new `.alpha-sidebar button.neighbour` rule after the existing `.alpha-sidebar button.active` rule:

```css
.alpha-sidebar button.neighbour {
  transform: scale(1.15);
  color: var(--header);
}
```

- [ ] **Step 3: Add `.alpha-bubble` rule**

Add after the `.alpha-sidebar button.neighbour` rule:

```css
.alpha-bubble {
  position: absolute;
  right: 28px;
  width: 52px;
  height: 52px;
  border-radius: 50% 50% 50% 4px;
  background: var(--header);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(61,120,112,0.35);
  pointer-events: none;
  z-index: 10;
  user-select: none;
}
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/jason_dan_iel/Developer/song-book-app && npm run build
```

Expected: clean build, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/styles.css
git commit -m "style: add alpha-bubble and drag transition styles for Niagara sidebar"
```

---

## Task 2: AlphaSidebar — Drag Gesture and Bubble

**Files:**
- Modify: `src/components/AlphaSidebar.tsx`

- [ ] **Step 1: Replace `src/components/AlphaSidebar.tsx` with the full implementation**

```tsx
import { useRef, useState, useCallback } from 'react'

interface Props {
  letters: string[]
  active: string
  onChange: (letter: string) => void
}

export function AlphaSidebar({ letters, active, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [dragLetter, setDragLetter] = useState<string | null>(null)
  const [bubbleTop, setBubbleTop] = useState(0)

  // Given a clientY coordinate, returns which letter slot it falls in.
  // Clamps to first/last letter if the pointer goes outside the container.
  const letterAtY = useCallback((clientY: number): string | null => {
    const el = containerRef.current
    if (!el || letters.length === 0) return null
    const { top, height } = el.getBoundingClientRect()
    const slotHeight = height / letters.length
    const idx = Math.max(0, Math.min(letters.length - 1, Math.floor((clientY - top) / slotHeight)))
    return letters[idx]
  }, [letters])

  // Returns the `top` value (px) to vertically centre the bubble on a given letter slot.
  const bubbleTopForLetter = useCallback((letter: string): number => {
    const el = containerRef.current
    if (!el || letters.length === 0) return 0
    const { height } = el.getBoundingClientRect()
    const slotHeight = height / letters.length
    const idx = letters.indexOf(letter)
    return idx * slotHeight + slotHeight / 2 - 26 // 26 = half of 52px bubble height
  }, [letters])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const letter = letterAtY(e.clientY)
    if (!letter) return
    setDragging(true)
    setDragLetter(letter)
    setBubbleTop(bubbleTopForLetter(letter))
    onChange(letter)
  }, [letterAtY, bubbleTopForLetter, onChange])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const letter = letterAtY(e.clientY)
    if (!letter || letter === dragLetter) return
    setDragLetter(letter)
    setBubbleTop(bubbleTopForLetter(letter))
    onChange(letter)
  }, [dragging, dragLetter, letterAtY, bubbleTopForLetter, onChange])

  const handlePointerUp = useCallback(() => {
    setDragging(false)
    setDragLetter(null)
  }, [])

  const activeIdx = letters.indexOf(active)

  return (
    <div
      className="alpha-sidebar"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {letters.map((l, i) => {
        const isActive = l === active
        const isNeighbour = dragging && !isActive && Math.abs(i - activeIdx) === 1
        return (
          <button
            key={l}
            className={isActive ? 'active' : isNeighbour ? 'neighbour' : ''}
            aria-label={`Filter by ${l}`}
          >
            {l}
          </button>
        )
      })}

      {dragging && dragLetter !== null && (
        <div className="alpha-bubble" style={{ top: bubbleTop }}>
          {dragLetter}
        </div>
      )}
    </div>
  )
}
```

Key decisions:
- `setPointerCapture` keeps tracking even when finger drifts outside the sidebar
- Buttons have no `onClick` — all interaction handled by pointer events on the container
- `dragLetter` (the letter under the finger right now) drives the bubble; `active` (committed selection from `onChange`) drives the active class — these stay in sync because `onChange` is called immediately on every letter change
- Neighbour scaling only applies while dragging (`dragging && ...`) — the magnification lens only appears during active scrubbing

- [ ] **Step 2: Verify build**

```bash
cd /Users/jason_dan_iel/Developer/song-book-app && npm run build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 3: Verify visually**

```bash
cd /Users/jason_dan_iel/Developer/song-book-app && npm run dev
```

Open http://localhost:5173/song-book/, tap a category, then on the song list:
- Touch and drag along the right-side letters — list should jump in real-time
- The teal bubble should appear next to your finger showing the current letter
- Releasing the finger should hide the bubble
- On desktop: click and drag along the letters with mouse — same behaviour

- [ ] **Step 4: Commit**

```bash
git add src/components/AlphaSidebar.tsx
git commit -m "feat: Niagara-style drag gesture on AlphaSidebar with letter bubble"
```

---

## Visual Verification Checklist

- [ ] Drag gesture works on mobile (touch)
- [ ] Drag gesture works on desktop (mouse)
- [ ] Bubble appears on drag start, disappears on release
- [ ] Bubble follows the active letter vertically
- [ ] Neighbour letters scale up slightly during drag
- [ ] Active letter stays highlighted after release
- [ ] Releasing at any letter commits that selection (list stays filtered)
- [ ] No page scroll during sidebar drag (touch-action: none working)
