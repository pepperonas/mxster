/**
 * Does a typed title or artist name the song? Used by the hardcore guess and
 * the bonus naming, on the device that runs the round.
 *
 * First every spelling of the whole answer (utils/textMatcher fuzzyMatch).
 * Then a part of it (at least 5 letters) — "Grönemeyer" for "Herbert
 * Grönemeyer", "Luftballons" — but only when that part names this answer alone
 * in the song list: "Crazy" is not "She Drives Me Crazy" (there is a song called "Crazy"),
 * "Jackson" is not "Michael Jackson" (there are the Jackson 5 too).
 */
import { songs } from '@/data/songs'
import { answerVariants, answerWords, closeEnough, compact, fuzzyMatch, type AnswerKind } from '@/utils/textMatcher'

/** A part must have at least this many letters to count. */
export const MIN_PART = 5

/** Every run of consecutive words, compacted ("billie jean" → bili, jean, bilijean). */
function wordRuns(text: string): string[] {
  const words = answerWords(text)
  const out: string[] = []
  for (let i = 0; i < words.length; i++) for (let j = i + 1; j <= words.length; j++) out.push(words.slice(i, j).join(''))
  return out
}

/** Every run of every form of an answer. */
function runsOf(answer: string, kind: AnswerKind): Set<string> {
  const out = new Set<string>()
  for (const v of answerVariants(answer, kind)) for (const r of wordRuns(v)) out.add(r)
  return out
}

/** run → the answers (compacted) it appears in. */
type RunIndex = Map<string, Set<string>>

function buildIndex(answers: readonly string[], kind: AnswerKind): RunIndex {
  const index: RunIndex = new Map()
  for (const a of new Set(answers)) {
    const owner = compact(a)
    for (const r of runsOf(a, kind)) {
      if (r.length < MIN_PART) continue
      let set = index.get(r)
      if (!set) index.set(r, (set = new Set()))
      set.add(owner)
    }
  }
  return index
}

const cache: Partial<Record<AnswerKind, RunIndex>> = {}
function defaultIndex(kind: AnswerKind): RunIndex {
  return (cache[kind] ??= buildIndex(songs.map((s) => (kind === 'title' ? s.title : s.artist)), kind))
}

/** The guess is a part of the answer that no other answer of the list contains. */
export function uniquePart(guess: string, correct: string, kind: AnswerKind, index: RunIndex = defaultIndex(kind)): boolean {
  const g = compact(guess)
  if (g.length < MIN_PART) return false
  const own = compact(correct)
  if (![...runsOf(correct, kind)].some((r) => r.length >= MIN_PART && closeEnough(g, r))) return false
  for (const [run, owners] of index) {
    if (!closeEnough(g, run)) continue
    for (const o of owners) if (o !== own) return false
  }
  return true
}

/** Whole answer in any spelling, or a part that names it alone. */
export function answerMatches(guess: string, correct: string, kind: AnswerKind, answers?: readonly string[]): boolean {
  if (!guess?.trim() || !correct) return false
  if (fuzzyMatch(guess, correct, kind)) return true
  return uniquePart(guess, correct, kind, answers ? buildIndex(answers, kind) : undefined)
}
