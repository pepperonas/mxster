#!/usr/bin/env node

/**
 * Update Song Count Script
 *
 * Automatisches Update der Song-Anzahl in README.md
 * Wird verwendet um die Badge-Anzeige dynamisch zu halten
 */

const fs = require('fs')
const path = require('path')

// Pfade
const SONGS_JSON = path.join(__dirname, 'docs', 'songs.json')
const README_PATH = path.join(__dirname, 'README.md')

try {
  // Lade Songs
  const songs = JSON.parse(fs.readFileSync(SONGS_JSON, 'utf8'))
  const songCount = songs.length

  console.log(`📊 Aktuelle Song-Anzahl: ${songCount}`)

  // Lade README
  let readme = fs.readFileSync(README_PATH, 'utf8')

  // Suche und ersetze Badge
  const badgeRegex = /!\[Songs\]\(https:\/\/img\.shields\.io\/badge\/Songs-\d+-orange\?style=for-the-badge\)/
  const newBadge = `![Songs](https://img.shields.io/badge/Songs-${songCount}-orange?style=for-the-badge)`

  if (badgeRegex.test(readme)) {
    readme = readme.replace(badgeRegex, newBadge)
    fs.writeFileSync(README_PATH, readme, 'utf8')
    console.log(`✅ README.md aktualisiert: ${songCount} Songs`)
  } else {
    console.warn('⚠️  Song-Badge nicht in README.md gefunden')
  }

} catch (error) {
  console.error('❌ Fehler:', error.message)
  process.exit(1)
}
