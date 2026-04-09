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
    return Math.max(0, Math.min(height - 60, idx * slotHeight + slotHeight / 2 - 30))
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

  // Scale buttons to fill available height below sticky band
  const availableH = window.innerHeight - 110
  const slotH = Math.max(9, Math.min(18, Math.floor((availableH - 16) / letters.length)))

  // Graduated Niagara-style scaling: only activates during drag
  // Active letter rises up, surrounding letters recede with distance
  const SCALES  = [1.65, 1.28, 1.05, 0.88, 0.78]
  const OPACITY = [1.00, 0.75, 0.50, 0.35, 0.22]

  const getButtonStyle = (i: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontSize: Math.max(7, Math.round(slotH * 0.75)) + 'px',
      lineHeight: slotH + 'px',
      padding: '0 4px',
    }
    if (!dragging || activeIdx === -1) return base
    const dist = Math.min(Math.abs(i - activeIdx), 4)
    return { ...base, transform: `scale(${SCALES[dist]})`, opacity: OPACITY[dist] }
  }

  return (
    <div
      className="alpha-sidebar"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {letters.map((l, i) => (
        <button
          key={l}
          style={getButtonStyle(i)}
          className={l === active ? 'active' : ''}
          aria-label={`Scroll to ${l}`}
        >
          {l}
        </button>
      ))}

      {dragging && dragLetter !== null && (
        <div className="alpha-bubble" style={{ top: bubbleTop }}>
          {dragLetter}
        </div>
      )}
    </div>
  )
}
