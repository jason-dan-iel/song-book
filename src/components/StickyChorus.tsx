interface Props {
  label: string
  text: string
}

export function StickyChorus({ label, text }: Props) {
  return (
    <div className="chorus-sticky">
      <div className="chorus-label">{label}</div>
      {text}
    </div>
  )
}
