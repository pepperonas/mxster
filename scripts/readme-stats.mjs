/**
 * The numbers the README badges show, counted from the repository.
 * Shared by readme-badges.mjs (rewrites the badges) and the README test (checks them).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function walk(dir, keep, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.venv' || name === '__pycache__') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, keep, out)
    else if (keep(path)) out.push(path)
  }
  return out
}

const lines = (files) => files.reduce((n, f) => n + readFileSync(f, 'utf8').split('\n').length, 0)
const isTest = (p) => p.includes('__tests__') || p.includes('/test/') || p.includes('/tests/')

/** Lines of application code (generated song data excluded) and of test code. */
export function codeLines() {
  const ts = walk(join(ROOT, 'pwa/src'), (p) => /\.(ts|tsx)$/.test(p) && !p.endsWith('data/songs.ts'))
  const py = walk(join(ROOT, 'server/app'), (p) => p.endsWith('.py'))
  const pyTests = walk(join(ROOT, 'server/tests'), (p) => p.endsWith('.py'))
  return {
    code: lines(ts.filter((p) => !isTest(p))) + lines(py),
    tests: lines(ts.filter(isTest)) + lines(pyTests)
  }
}

/** Test cases written in the source; the runners report a few more (each/parametrize). */
export function writtenTests() {
  const ts = walk(join(ROOT, 'pwa/src'), (p) => p.includes('__tests__') && /\.(ts|tsx)$/.test(p))
  const py = walk(join(ROOT, 'server/tests'), (p) => p.endsWith('.py'))
  const count = (files, re) => files.reduce((n, f) => n + (readFileSync(f, 'utf8').match(re) ?? []).length, 0)
  return count(ts, /^\s*(it|test)(\.each\([^)]*\))?\(/gm) + count(py, /^\s*(async )?def test_/gm)
}

export const songCount = () => JSON.parse(readFileSync(join(ROOT, 'docs/songs.json'), 'utf8')).length
export const appVersion = () => JSON.parse(readFileSync(join(ROOT, 'pwa/package.json'), 'utf8')).version

/** 17345 → "17.3k" */
export const thousands = (n) => `${(n / 1000).toFixed(1)}k`
export const READMES = ['README.md', 'README.de.md']
