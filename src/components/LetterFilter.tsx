const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

interface Props {
  active: string
  onChange: (letter: string) => void
}

export function LetterFilter({ active, onChange }: Props) {
  return (
    <div className="letter-filter">
      <button
        className={active === 'All' ? 'active' : ''}
        onClick={() => onChange('All')}
      >
        All
      </button>
      {LETTERS.map((l) => (
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
