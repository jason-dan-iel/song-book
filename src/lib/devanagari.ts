export function hasDevanagari(s: string): boolean {
  return /[ऀ-ॿ]/.test(s)
}
