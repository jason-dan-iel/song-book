interface Props {
  letters: string[]
  active: string
  onChange: (letter: string) => void
}

export function LetterFilter({ letters, active, onChange }: Props) {
  return (
    <div className="letter-filter">
      <button
        className={active === 'All' ? 'active' : ''}
        onClick={() => onChange('All')}
      >
        All
      </button>
      {letters.map((l) => (
        <button
          key={l}
          className={active === l ? 'active' : ''}
          onClick={() => onChange(l)}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
