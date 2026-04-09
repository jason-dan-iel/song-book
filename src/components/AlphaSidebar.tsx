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
