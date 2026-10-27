#!/usr/bin/env node
/**
 * Recount and rewrite the big README badges (version, tests, lines of code,
 * test code, songs) in README.md and README.de.md.
 *
 *   node scripts/readme-badges.mjs
 *
 * The test count comes from the real runners (vitest + pytest), so run it with
 * the dev setup in place (pwa/node_modules, server/.venv).
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ROOT, READMES, appVersion, codeLines, songCount, thousands } from './readme-stats.mjs'

/** Run a test command; a failing test must not stop the count, so the exit code is ignored. */
function run(cmd, args, cwd) {
  try {
    return execFileSync(cmd, args, { cwd: join(ROOT, cwd), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) {
    return String(e.stdout ?? '')
  }
}

const out = join(mkdtempSync(join(tmpdir(), 'mxtape-badges-')), 'vitest.json')
run('npx', ['vitest', 'run', '--reporter=json', `--outputFile=${out}`], 'pwa')
const vitest = JSON.parse(readFileSync(out, 'utf8')).numTotalTests
const pytest = Number(/(\d+) tests? collected/.exec(run('.venv/bin/python', ['-m', 'pytest', '-q', '--co'], 'server'))?.[1])
if (!vitest || !pytest) throw new Error(`could not read test counts (vitest ${vitest}, pytest ${pytest})`)

const { code, tests } = codeLines()
const values = {
  version: appVersion(),
  tests: String(vitest + pytest),
  'lines%20of%20code': thousands(code),
  'test%20code': thousands(tests),
  songs: String(songCount())
}

for (const name of READMES) {
  const path = join(ROOT, name)
  let text = readFileSync(path, 'utf8')
  for (const [label, value] of Object.entries(values)) {
    const re = new RegExp(`(img\\.shields\\.io/badge/${label}-)[^-?)]+`)
    if (!re.test(text)) throw new Error(`${name}: no '${label}' badge`)
    text = text.replace(re, `$1${value}`)
  }
  writeFileSync(path, text)
}
console.log(values)
