interface Props {
  text: string
}

export function StickyChorus({ text }: Props) {
  return (
    <div className="chorus-sticky">
      <div className="chorus-label">Chorus</div>
      {text}
    </div>
  )
}
