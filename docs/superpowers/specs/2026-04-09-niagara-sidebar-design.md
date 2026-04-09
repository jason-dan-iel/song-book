# Niagara-Style AlphaSidebar Design

**Date:** 2026-04-09  
**Status:** Approved

## Overview

Enhance the `AlphaSidebar` component to support a continuous drag gesture, matching the feel of the Niagara Launcher app drawer. Instead of tapping individual letter buttons, the user places their thumb on the sidebar and slides up/down — the list jumps in real-time as each letter is passed.

## Behaviour

**Drag gesture:**
- `pointerdown` on the sidebar starts drag mode
- `pointermove` tracks which letter is under the pointer and calls `onChange` immediately — no lift required
- `pointerup` / `pointercancel` ends drag mode
- `setPointerCapture` keeps the pointer tracked even if the finger drifts outside the sidebar bounds
- `touch-action: none` on the sidebar prevents the browser from intercepting the touch as a scroll

**Letter bubble:**
- Appears when drag starts, disappears on release
- Large teal circle (52×52px, teardrop shape — `border-radius: 50% 50% 50% 4px`) positioned to the left of the sidebar
- Shows the current letter in large bold white text
- `position: absolute` inside a `position: relative` wrapper — does not affect layout

**Scale effect:**
- The active letter gets a slight scale transform (`scale(1.3)`) and larger font
- Its immediate neighbours get a subtler scale (`scale(1.15)`) to create a lens/magnification feel
- Transitions: `transform 0.08s ease-out`

## Scope

**One file changed:** `src/components/AlphaSidebar.tsx`  
**One file changed:** `src/styles.css` (add `.alpha-bubble`, update `.alpha-sidebar button` transitions)

No changes to `CategoryList.tsx` — the `onChange` / `active` / `letters` interface is unchanged.

## Component Design

`AlphaSidebar` gains internal state:
- `dragging: boolean` — controls bubble visibility
- `dragLetter: string` — the letter currently under the pointer (used to display in bubble)

Helper: `letterAtY(y: number): string | null` — given a clientY value, uses `getBoundingClientRect` on each button ref (or the container ref + arithmetic) to find which letter slot the finger is in.

The simplest implementation: one `ref` on the container div + arithmetic. The sidebar has equal-height slots (each button is the same height). `Math.floor((y - containerTop) / slotHeight)` gives the index.

## CSS additions to `src/styles.css`

```css
/* Niagara bubble */
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
  transform: scale(1);
  transition: transform 0.1s ease-out;
}

/* Sidebar button scale transitions */
.alpha-sidebar button {
  transition: transform 0.08s ease-out, font-size 0.08s ease-out;
}

.alpha-sidebar button.neighbour {
  transform: scale(1.15);
  color: var(--header);
}
```

The bubble's `top` is set dynamically via inline style to follow the active letter's vertical position.

## Out of Scope

- Haptic feedback (web API not broadly supported)
- Momentum / deceleration after release
- "All" button in the sidebar
