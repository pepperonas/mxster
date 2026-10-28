import { describe, it, expect } from 'vitest'
import { answerMatches, uniquePart } from '../answerMatch'
import { judgeNaming } from '../bonus'
import { validateGuess } from '@/services/gameLogic'
import { songs } from '@/data/songs'
import type { Song } from '@/types'

const ARTISTS = new Set(songs.map((s) => s.artist))
const TITLES = new Set(songs.map((s) => s.title))

/** Other spellings that must count — every answer here is in the catalogue. */
const ACCEPT: [string, string][] = [
  // & / and / und / nothing
  ['Simon und Garfunkel', 'Simon & Garfunkel'], ['Simon and Garfunkel', 'Simon & Garfunkel'], ['Simon Garfunkel', 'Simon & Garfunkel'],
  ['Earth Wind and Fire', 'Earth, Wind & Fire'], ['Mamas and the Papas', 'The Mamas & the Papas'],
  // one artist of a list, the band without its backing band
  ['Lady Gaga', 'Lady Gaga, Bruno Mars'], ['Bruno Mars', 'Lady Gaga, Bruno Mars'], ['DJ Snake', 'Major Lazer, DJ Snake, MØ'],
  ['Udo Lindenberg', 'Udo Lindenberg, Apache 207'], ['Bill Haley', 'Bill Haley & His Comets'], ['Huey Lewis', 'Huey Lewis & The News'],
  // articles, umlauts, accents, punctuation, spaces
  ['Beatles', 'The Beatles'], ['Rolling Stones', 'The Rolling Stones'], ['Ärzte', 'Die Ärzte'], ['Die Aerzte', 'Die Ärzte'],
  ['Groenemeyer', 'Herbert Grönemeyer'], ['Grönemeyer', 'Herbert Grönemeyer'], ['Beyonce', 'Beyoncé'], ['Sinead OConnor', "Sinéad O'Connor"],
  ['Blue Oyster Cult', 'Blue Öyster Cult'], ['Rufus du Sol', 'RÜFÜS DU SOL'], ['ACDC', 'AC/DC'], ['AC DC', 'AC/DC'], ['aha', 'a-ha'],
  ['Abba', 'ABBA'], ['blink 182', 'blink-182'], ['UB 40', 'UB40'],
  // number words
  ['Jackson Five', 'The Jackson 5'], ['Mambo Number 5', 'Mambo No. 5 (a Little Bit of...)'], ['Nothing compares to you', 'Nothing Compares 2 U'],
  // bracketed parts, both ways; slash; part numbers; remix suffixes
  ['Satisfaction', "(I Can't Get No) Satisfaction"], ['I cant get no satisfaction', "(I Can't Get No) Satisfaction"],
  ['Montero', 'MONTERO (Call Me By Your Name)'], ['Call me by your name', 'MONTERO (Call Me By Your Name)'], ['Blue', 'Blue (Da Ba Dee)'],
  ['Asereje', 'The Ketchup Song (Aserejé)'], ['Ketchup Song', 'The Ketchup Song (Aserejé)'], ['Dont fear the reaper', "(Don't Fear) The Reaper"],
  ['Another Brick in the Wall', 'Another Brick in the Wall, Pt. 2'], ['Like a Prayer', 'Like a Prayer - 12" Extended Remix'],
  ['Ich will Spass', 'Ich will Spaß'], ['Gluecklich', 'Glücklich'],
  // a part that names the answer alone
  ['Luftballons', '99 Luftballons'], ['Garfunkel', 'Simon & Garfunkel'], ['Michael', 'Michael Jackson'],
  // typos
  ['Bohemian Rapsody', 'Bohemian Rhapsody'], ['Micheal Jackson', 'Michael Jackson'], ['Queeen', 'Queen'], ['Nirvanna', 'Nirvana']
]

/** Wrong answers that must not count. */
const REJECT: [string, string][] = [
  ['Crazy', 'She Drives Me Crazy'], ['Dreams', 'Sweet Dreams'], ['Your Love', 'I Wanna Be Your Lover'], ['Engel', 'Angels'],
  ['One More Time', '...Baby One More Time'], ['Sugar', 'Brown Sugar'], ['Summer', 'Summertime Blues'], ['Happy', 'Easy'],
  ['Sorry', 'Torn'], ['Glue', 'Blue (Da Ba Dee)'], ['Lean On', 'Lean on Me'],
  ['Aqua', 'ABBA'], ['Sia', 'ABBA'], ['a-ha', 'ABBA'], ['Nena', 'Nelly'], ['M.I.A.', 'Mika'], ['R.E.M.', 'Rema'], ['Kygo', 'Mylo'],
  ['Jackson', 'Michael Jackson'], ['Jean', 'Billie Jean'], ['Wind', 'Earth, Wind & Fire'],
  ['', 'Queen'], ['   ', 'Queen'], ['constructor', 'Queen'], ['toString', 'Queen']
]

const kindOf = (answer: string) => (ARTISTS.has(answer) ? 'artist' : 'title') as 'artist' | 'title'

describe('answers: other spellings count', () => {
  it('every case is a real answer of the catalogue', () => {
    for (const [, answer] of [...ACCEPT, ...REJECT]) expect(ARTISTS.has(answer) || TITLES.has(answer), answer).toBe(true)
  })
  it.each(ACCEPT)('%s  =  %s', (guess, answer) => {
    expect(answerMatches(guess, answer, kindOf(answer))).toBe(true)
  })
})

describe('answers: wrong ones do not count', () => {
  it.each(REJECT)('%s  ≠  %s', (guess, answer) => {
    expect(answerMatches(guess, answer, kindOf(answer))).toBe(false)
  })
})

describe('a part of the answer', () => {
  it('counts only when no other answer of the list has it', () => {
    const list = ['Billie Jean', 'Beat It', 'Jeanny', 'Thriller']
    expect(uniquePart('Thrill', 'Thriller', 'title')).toBe(false) // not a whole word
    expect(answerMatches('Criminal', 'Smooth Criminal', 'title', ['Smooth Criminal', 'Beat It'])).toBe(true) // ('Billie' is 'bili' after the sound rules: too short)
    expect(answerMatches('Thrill', 'Thriller', 'title', list)).toBe(false)
    expect(answerMatches('Jeanny', 'Billie Jean', 'title', list)).toBe(false) // another answer
  })
  it('never with fewer than 5 letters, and never one that is in another answer', () => {
    expect(answerMatches('Jean', 'Billie Jean', 'title', ['Billie Jean'])).toBe(false)
    // a 4-letter guess one typo from a 5-letter word is still too short
    expect(answerMatches('Hous', 'House Party', 'title', ['House Party', 'Beat It'])).toBe(false)
    expect(answerMatches('House', 'House Party', 'title', ['House Party', 'Beat It'])).toBe(true)
    expect(answerMatches('Gentle', 'Gentle Ben', 'title', ['Gentle Ben', 'Gentle on My Mind'])).toBe(false)
    expect(answerMatches('Gentle', 'Gentle Ben', 'title', ['Gentle Ben', 'Beat It'])).toBe(true)
  })
})

describe('both checks use it', () => {
  const song = (title: string, artist: string): Song => ({ id: 't', title, artist, year: 1980 }) as Song
  it('the hardcore guess', () => {
    const s = song("(I Can't Get No) Satisfaction", 'The Rolling Stones')
    expect(validateGuess('Satisfaction', 'Rolling Stones', '1965', s)).toMatchObject({ titleMatch: true, artistMatch: true })
    expect(validateGuess('Crazy', 'Rolling', '1965', song('She Drives Me Crazy', 'Fine Young Cannibals'))).toMatchObject({ titleMatch: false })
    // only the catalogue-aware path knows a part names this artist alone
    expect(validateGuess('Luftballons', 'Grönemeyer', '1983', song('99 Luftballons', 'Herbert Grönemeyer'))).toMatchObject({ titleMatch: true, artistMatch: true })
  })
  it('the bonus naming', () => {
    const r = judgeNaming(song('MONTERO (Call Me By Your Name)', 'Lil Nas X'), { title: 'Montero', artist: 'Lil Nas X' }, 0)
    expect(r).toMatchObject({ titleOk: true, artistOk: true })
    expect(judgeNaming(song('Sweet Dreams', 'Eurythmics'), { title: 'Dreams', artist: 'Eurythmics' }, 0)).toMatchObject({ titleOk: false })
    expect(judgeNaming(song('99 Luftballons', 'Nena'), { title: 'Luftballons', artist: 'Nena' }, 0)).toMatchObject({ titleOk: true })
  })
  it('is quick enough for a turn (catalogue index built once)', () => {
    answerMatches('x', 'Queen', 'artist')
    const t0 = performance.now()
    for (let i = 0; i < 50; i++) answerMatches('Grönemeyer', 'Herbert Grönemeyer', 'artist')
    expect((performance.now() - t0) / 50).toBeLessThan(20)
  })
})
