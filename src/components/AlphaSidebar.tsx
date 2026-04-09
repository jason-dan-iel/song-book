interface Props {
  letters: string[]
  active: string
  onChange: (letter: string) => void
}

export function AlphaSidebar({ letters, active, onChange }: Props) {
  return (
    <div className="alpha-sidebar">
      {letters.map((l) => (
        <button
          key={l}
          className={active === l ? 'active' : ''}
          onClick={() => onChange(active === l ? 'All' : l)}
          aria-label={`Filter by ${l}`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
