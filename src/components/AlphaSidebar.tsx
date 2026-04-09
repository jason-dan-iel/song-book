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
  const dragLetterRef = useRef<string | null>(null)
  const [bubbleTop, setBubbleTop] = useState(0)

  const letterAtY = useCallback((clientY: number): string | null => {
    const el = containerRef.current
    if (!el || letters.length === 0) return null
    const { top, height } = el.getBoundingClientRect()
    const slotHeight = height / letters.length
    const idx = Math.max(0, Math.min(letters.length - 1, Math.floor((clientY - top) / slotHeight)))
    return letters[idx]
  }, [letters])

  const bubbleTopForLetter = useCallback((letter: string): number => {
    const el = containerRef.current
    if (!el || letters.length === 0) return 0
    const { height } = el.getBoundingClientRect()
    const slotHeight = height / letters.length
    const idx = letters.indexOf(letter)
    return Math.max(0, Math.min(height - 52, idx * slotHeight + slotHeight / 2 - 26))
  }, [letters])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const letter = letterAtY(e.clientY)
    if (!letter) return
    dragLetterRef.current = letter
    setDragging(true)
    setDragLetter(letter)
    setBubbleTop(bubbleTopForLetter(letter))
    onChange(letter)
  }, [letterAtY, bubbleTopForLetter, onChange])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragLetterRef.current) return
    const letter = letterAtY(e.clientY)
    if (!letter || letter === dragLetterRef.current) return
    dragLetterRef.current = letter
    setDragLetter(letter)
    setBubbleTop(bubbleTopForLetter(letter))
    onChange(letter)
  }, [letterAtY, bubbleTopForLetter, onChange])

  const handlePointerUp = useCallback(() => {
    dragLetterRef.current = null
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
        const isNeighbour = dragging && !isActive && activeIdx !== -1 && Math.abs(i - activeIdx) === 1
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
