#!/usr/bin/env node

/**
 * Generate Decade Distribution Report
 *
 * Analyzes songs.json and creates an HTML visualization showing
 * how many songs are from each decade.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Paths
const SONGS_JSON = path.join(__dirname, '../../docs/songs.json')
const OUTPUT_DIR = path.join(__dirname, 'reports')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'decade-distribution.html')

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Read songs data
const songs = JSON.parse(fs.readFileSync(SONGS_JSON, 'utf8'))

// Analyze songs by decade
const decadeStats = {}
const songsByDecade = {}

songs.forEach(song => {
  const decade = Math.floor(song.year / 10) * 10
  const decadeLabel = `${decade}s`

  if (!decadeStats[decadeLabel]) {
    decadeStats[decadeLabel] = 0
    songsByDecade[decadeLabel] = []
  }

  decadeStats[decadeLabel]++
  songsByDecade[decadeLabel].push(song)
})

// Sort decades chronologically
const sortedDecades = Object.keys(decadeStats).sort()

// Calculate percentages
const totalSongs = songs.length
const decadePercentages = {}
sortedDecades.forEach(decade => {
  decadePercentages[decade] = ((decadeStats[decade] / totalSongs) * 100).toFixed(1)
})

// Find max count for bar chart scaling
const maxCount = Math.max(...Object.values(decadeStats))

// Analyze songs by genre
const genreStats = {}
const songsByGenre = {}

songs.forEach(song => {
  const genre = song.genre || 'Unbekannt'

  if (!genreStats[genre]) {
    genreStats[genre] = 0
    songsByGenre[genre] = []
  }

  genreStats[genre]++
  songsByGenre[genre].push(song)
})

// Sort genres by count (descending)
const sortedGenres = Object.keys(genreStats).sort((a, b) => genreStats[b] - genreStats[a])

// Calculate genre percentages
const genrePercentages = {}
sortedGenres.forEach(genre => {
  genrePercentages[genre] = ((genreStats[genre] / totalSongs) * 100).toFixed(1)
})

// Find max genre count for bar chart scaling
const maxGenreCount = Math.max(...Object.values(genreStats))

// Generate color for each decade (gradient from purple to orange)
const generateColor = (index, total) => {
  const hue = 270 - (index / total) * 90 // 270 (purple) to 180 (cyan) to 30 (orange)
  return `hsl(${hue}, 70%, 60%)`
}

// Generate color for each genre (vibrant colors)
const genreColors = {
  'Pop': '#FF6B9D',
  'Rock': '#C44569',
  'Electronic': '#4ECDC4',
  'Hip-Hop': '#FFE66D',
  'R&B': '#A8E6CF',
  'Soul': '#FF8B94',
  'Metal': '#556270',
  'Jazz': '#F67280',
  'Country': '#FFD93D',
  'Reggae': '#6BCB77',
  'Unbekannt': '#95A5A6'
}

const getGenreColor = (genre) => {
  return genreColors[genre] || `hsl(${Math.random() * 360}, 70%, 60%)`
}

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>mxster - Song-Datenbank Analyse</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1A1C27;
      color: #FFFFFF;
      padding: 2rem;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-x: hidden;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
    }

    h1 {
      font-size: 3rem;
      font-weight: 700;
      background: linear-gradient(135deg, #4A90E2 0%, #FF6B35 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
      line-height: 1.2;
    }

    .subtitle {
      color: #B0B3C1;
      font-size: 1.125rem;
      font-weight: 400;
    }

    .stats-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: #2C2E3B;
      border: 2px solid rgba(74, 144, 226, 0.3);
      border-radius: 0.75rem;
      padding: 1.5rem;
      text-align: center;
      transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
      backface-visibility: hidden;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 0 20px rgba(74, 144, 226, 0.4);
      border-color: rgba(74, 144, 226, 0.5);
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #4A90E2;
      margin-bottom: 0.5rem;
      line-height: 1;
    }

    .stat-label {
      color: #B0B3C1;
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .chart-container {
      background: #2C2E3B;
      border: 2px solid rgba(74, 144, 226, 0.3);
      border-radius: 0.75rem;
      padding: 2rem;
      margin-bottom: 3rem;
      transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .chart-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 2rem;
      color: #FFFFFF;
      line-height: 1.3;
    }

    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .bar-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .bar-label {
      min-width: 80px;
      font-weight: 600;
      color: #FFFFFF;
      font-size: 1rem;
    }

    .bar-wrapper {
      flex: 1;
      position: relative;
      height: 50px;
      background: #1A1C27;
      border-radius: 0.5rem;
      overflow: hidden;
      border: 1px solid rgba(74, 144, 226, 0.2);
    }

    .bar {
      height: 100%;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 1rem;
      color: #FFFFFF;
      font-weight: 600;
      font-size: 0.875rem;
      transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 20px rgba(74, 144, 226, 0.3);
      will-change: width;
      backface-visibility: hidden;
    }

    .bar-count {
      min-width: 100px;
      text-align: right;
      font-size: 1rem;
      font-weight: 500;
      color: #B0B3C1;
    }

    .decade-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .decade-card {
      background: #2C2E3B;
      border: 2px solid rgba(74, 144, 226, 0.3);
      border-radius: 0.75rem;
      padding: 1.5rem;
      transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
      backface-visibility: hidden;
    }

    .decade-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 0 20px rgba(74, 144, 226, 0.4);
      border-color: rgba(74, 144, 226, 0.5);
    }

    .decade-card h3 {
      color: #4A90E2;
      margin-bottom: 1rem;
      font-size: 1.5rem;
      font-weight: 600;
      line-height: 1.3;
    }

    .song-list {
      max-height: 300px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    .song-item {
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      background: #1A1C27;
      border-radius: 0.5rem;
      border-left: 3px solid #4A90E2;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .song-item:hover {
      background: rgba(74, 144, 226, 0.1);
      border-left-color: #FF6B35;
      transform: translateX(4px);
    }

    .song-title {
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 0.25rem;
      font-size: 0.9375rem;
    }

    .song-artist {
      color: #B0B3C1;
      font-size: 0.875rem;
      font-weight: 400;
    }

    .song-year {
      color: #4A90E2;
      font-size: 0.8125rem;
      font-weight: 500;
      margin-top: 0.25rem;
    }

    footer {
      text-align: center;
      color: #B0B3C1;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(74, 144, 226, 0.2);
      font-size: 0.875rem;
    }

    /* Scrollbar styling */
    .song-list::-webkit-scrollbar {
      width: 10px;
    }

    .song-list::-webkit-scrollbar-track {
      background: #1A1C27;
      border-radius: 4px;
    }

    .song-list::-webkit-scrollbar-thumb {
      background: #2C2E3B;
      border-radius: 4px;
      border: 2px solid transparent;
    }

    .song-list::-webkit-scrollbar-thumb:hover {
      background: #4A90E2;
    }

    /* Selection styling */
    ::selection {
      background: #4A90E2;
      color: #FFFFFF;
    }

    /* Animation for bars */
    @keyframes slideIn {
      from {
        width: 0;
      }
    }

    .bar {
      animation: slideIn 1s ease-out;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎵 mxster Song-Datenbank Analyse</h1>
      <p class="subtitle">Verteilung nach Dekaden & Genres</p>
    </header>

    <div class="stats-summary">
      <div class="stat-card">
        <div class="stat-value">${totalSongs}</div>
        <div class="stat-label">Gesamt Songs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${sortedDecades.length}</div>
        <div class="stat-label">Dekaden</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${sortedGenres.length}</div>
        <div class="stat-label">Genres</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${sortedDecades[0]}</div>
        <div class="stat-label">Älteste Dekade</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${sortedDecades[sortedDecades.length - 1]}</div>
        <div class="stat-label">Neueste Dekade</div>
      </div>
    </div>

    <div class="chart-container">
      <h2 class="chart-title">📊 Verteilung nach Dekaden</h2>
      <div class="bar-chart">
        ${sortedDecades.map((decade, index) => {
          const count = decadeStats[decade]
          const percentage = decadePercentages[decade]
          const barWidth = (count / maxCount) * 100
          const color = generateColor(index, sortedDecades.length)

          return `
        <div class="bar-row">
          <div class="bar-label">${decade}</div>
          <div class="bar-wrapper">
            <div class="bar" style="width: ${barWidth}%; background: linear-gradient(90deg, ${color} 0%, ${color}dd 100%);">
              ${count} Songs
            </div>
          </div>
          <div class="bar-count">${percentage}%</div>
        </div>
          `
        }).join('')}
      </div>
    </div>

    <div class="chart-container" style="margin-top: 3rem;">
      <h2 class="chart-title">🎸 Verteilung nach Genres</h2>
      <div class="bar-chart">
        ${sortedGenres.map((genre) => {
          const count = genreStats[genre]
          const percentage = genrePercentages[genre]
          const barWidth = (count / maxGenreCount) * 100
          const color = getGenreColor(genre)

          return `
        <div class="bar-row">
          <div class="bar-label">${genre}</div>
          <div class="bar-wrapper">
            <div class="bar" style="width: ${barWidth}%; background: linear-gradient(90deg, ${color} 0%, ${color}dd 100%);">
              ${count} Songs
            </div>
          </div>
          <div class="bar-count">${percentage}%</div>
        </div>
          `
        }).join('')}
      </div>
    </div>

    <h2 class="chart-title" style="margin-bottom: 1.5rem; margin-top: 3rem;">📝 Details nach Genres</h2>
    <div class="decade-details">
      ${sortedGenres.map(genre => {
        const songs = songsByGenre[genre].sort((a, b) => a.year - b.year)
        const color = getGenreColor(genre)

        return `
        <div class="decade-card">
          <h3 style="color: ${color};">${genre} (${genreStats[genre]} Songs)</h3>
          <div class="song-list">
            ${songs.map(song => `
            <div class="song-item" style="border-left-color: ${color};">
              <div class="song-title">${song.title}</div>
              <div class="song-artist">${song.artist}</div>
              <div class="song-year">${song.year}</div>
            </div>
            `).join('')}
          </div>
        </div>
        `
      }).join('')}
    </div>

    <h2 class="chart-title" style="margin-bottom: 1.5rem; margin-top: 3rem;">📝 Details nach Dekaden</h2>
    <div class="decade-details">
      ${sortedDecades.map(decade => {
        const songs = songsByDecade[decade].sort((a, b) => a.year - b.year)
        const color = generateColor(sortedDecades.indexOf(decade), sortedDecades.length)

        return `
        <div class="decade-card">
          <h3 style="color: ${color};">${decade} (${decadeStats[decade]} Songs)</h3>
          <div class="song-list">
            ${songs.map(song => `
            <div class="song-item" style="border-left-color: ${color};">
              <div class="song-title">${song.title}</div>
              <div class="song-artist">${song.artist}</div>
              <div class="song-year">${song.year}</div>
            </div>
            `).join('')}
          </div>
        </div>
        `
      }).join('')}
    </div>

    <footer>
      <p>Generiert am ${new Date().toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
      <p style="margin-top: 0.5rem;">mxster v0.0.19</p>
    </footer>
  </div>
</body>
</html>
`

// Write HTML file
fs.writeFileSync(OUTPUT_FILE, html, 'utf8')

// Print summary
console.log('\n📊 Dekaden-Verteilung Report generiert!\n')
console.log('📁 Output:', OUTPUT_FILE)
console.log('\n📈 Statistik:')
console.log('─'.repeat(60))
sortedDecades.forEach(decade => {
  const count = decadeStats[decade]
  const percentage = decadePercentages[decade]
  const bar = '█'.repeat(Math.round(count / maxCount * 40))
  console.log(`${decade}: ${bar} ${count} Songs (${percentage}%)`)
})
console.log('─'.repeat(60))
console.log(`Gesamt: ${totalSongs} Songs über ${sortedDecades.length} Dekaden\n`)
