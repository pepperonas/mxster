/** The account holder's player name: the first name, capped like typed names. */
export function ownPlayerName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? ''
  return (first || 'Ich').slice(0, 20)
}
