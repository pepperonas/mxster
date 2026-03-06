#!/bin/bash

###############################################################################
# mxster - Update and Release Script
#
# Führt alle notwendigen Schritte nach add-song.js / edit-song.js aus:
# 1. PDFs neu generieren
# 2. Git commit & push
# 3. ZIP-Archive erstellen
# 4. GitHub "latest" Release aktualisieren
#
# Verwendung:
#   ./update-and-release.sh "Commit message"
#   ./update-and-release.sh "Add new song: Never Gonna Give You Up by Rick Astley"
###############################################################################

set -e  # Exit on error

# Farben für Terminal-Output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

# Commit Message aus Argument
COMMIT_MSG="$1"

if [ -z "$COMMIT_MSG" ]; then
    echo -e "${RED}❌ Error: Please provide a commit message${RESET}"
    echo ""
    echo "Usage:"
    echo "  ./update-and-release.sh \"Commit message\""
    echo ""
    echo "Example:"
    echo "  ./update-and-release.sh \"Add new song: Never Gonna Give You Up by Rick Astley\""
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   🚀 mxster Update & Release  🚀          ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Get project root directory (from scripts/build/ to root)
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Zähle Songs
SONG_COUNT=$(node -e "const songs = require('./pwa/src/data/songs.js'); console.log(songs.songs.length)")
echo -e "${CYAN}📚 Songs in der Datenbank: ${SONG_COUNT}${RESET}"
echo ""

# Prüfe ob es Änderungen gibt
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  Keine Änderungen gefunden. Breche ab.${RESET}"
    exit 0
fi

# Zeige Änderungen
echo -e "${CYAN}📝 Geänderte Dateien:${RESET}"
git status --short
echo ""

# 0. Integrity Tests ausführen
echo -e "${CYAN}╔════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║  Step 0: Integrity Tests                   ║${RESET}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${RESET}"
echo ""

echo -e "${CYAN}🧪 Running integrity tests...${RESET}"
npm test

if [ $? -ne 0 ]; then
  echo ""
  echo -e "${RED}╔════════════════════════════════════════════╗${RESET}"
  echo -e "${RED}║  ❌ Tests failed! Aborting release.        ║${RESET}"
  echo -e "${RED}╚════════════════════════════════════════════╝${RESET}"
  echo ""
  echo -e "${YELLOW}⚠️  Please fix the errors above before releasing.${RESET}"
  echo ""
  exit 1
fi

echo ""
echo -e "${GREEN}✅ All tests passed! Proceeding with release...${RESET}"
echo ""

# 1. PDFs neu generieren
echo -e "${CYAN}╔════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║  Step 1: PDFs neu generieren              ║${RESET}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${RESET}"
echo ""

./scripts/build/generate-all-pdfs.sh

echo ""

# 2. Git Commit & Push
echo -e "${CYAN}╔════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║  Step 2: Git Commit & Push                ║${RESET}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${RESET}"
echo ""

echo -e "${CYAN}📦 Staging changes...${RESET}"
git add docs/ pwa/src/data/ extras/card-generator/output/models/ extras/card-generator/output/pdfs/ README.md

echo -e "${CYAN}💾 Creating commit...${RESET}"
git commit -m "$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo -e "${CYAN}⬆️  Pushing to GitHub...${RESET}"
git push origin main

echo -e "${GREEN}✅ Changes committed and pushed${RESET}"
echo ""

# 3. ZIP-Archive erstellen
echo -e "${CYAN}╔════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║  Step 3: ZIP-Archive erstellen            ║${RESET}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${RESET}"
echo ""

# Ensure extras/build/archives directory exists
mkdir -p extras/build/archives

echo -e "${CYAN}🗑️  Removing old ZIPs...${RESET}"
rm -f extras/build/archives/mxster-*.zip

echo -e "${CYAN}📦 Creating SCAD models ZIP...${RESET}"
zip -r extras/build/archives/mxster-scad-models.zip extras/card-generator/output/models/*.scad -q
echo -e "${GREEN}   ✅ mxster-scad-models.zip ($(ls -lh extras/build/archives/mxster-scad-models.zip | awk '{print $5}'))${RESET}"

echo -e "${CYAN}📦 Creating STL models ZIP...${RESET}"
zip -r extras/build/archives/mxster-stl-models.zip extras/card-generator/output/models/*.stl -q
echo -e "${GREEN}   ✅ mxster-stl-models.zip ($(ls -lh extras/build/archives/mxster-stl-models.zip | awk '{print $5}'))${RESET}"

echo -e "${CYAN}📦 Creating source code ZIP...${RESET}"
git archive --format=zip --prefix=mxster/ -o extras/build/archives/mxster-source.zip HEAD
echo -e "${GREEN}   ✅ mxster-source.zip ($(ls -lh extras/build/archives/mxster-source.zip | awk '{print $5}'))${RESET}"

echo ""

# 4. GitHub "latest" Release aktualisieren
echo -e "${CYAN}╔════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║  Step 4: GitHub Release aktualisieren     ║${RESET}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${RESET}"
echo ""

echo -e "${CYAN}📤 Uploading assets to 'latest' release...${RESET}"
gh release upload latest \
  extras/build/archives/mxster-scad-models.zip \
  extras/build/archives/mxster-stl-models.zip \
  extras/build/archives/mxster-source.zip \
  extras/card-generator/output/pdfs/mxster-cards.pdf \
  extras/card-generator/output/pdfs/mxster-cards-bw.pdf \
  extras/card-generator/output/pdfs/mxster-cards-duplex.pdf \
  extras/card-generator/output/pdfs/mxster-cards-bw-duplex.pdf \
  extras/card-generator/output/models/all-cards.3mf \
  --clobber

echo -e "${GREEN}✅ All assets uploaded${RESET}"
echo ""

echo -e "${CYAN}📝 Updating release notes...${RESET}"
# Get current package.json version
CURRENT_VERSION=$(node -e "console.log(require('./pwa/package.json').version)")

gh release edit latest \
  --notes "**Always points to the most recent stable version**

This release is automatically updated with each new version.

Current version: **v${CURRENT_VERSION}**

### Downloads

**3D Models (${SONG_COUNT} cards):**
- **all-cards.3mf**: All cards combined for 3D printing ($(ls -lh extras/card-generator/output/models/all-cards.3mf | awk '{print $5}'))
- **mxster-scad-models.zip**: OpenSCAD source files ($(ls -lh extras/build/archives/mxster-scad-models.zip | awk '{print $5}'))
- **mxster-stl-models.zip**: Ready-to-print STL files ($(ls -lh extras/build/archives/mxster-stl-models.zip | awk '{print $5}'))

**Printable Cards (PDF):**
- **mxster-cards.pdf**: Color cards, single-sided ($(ls -lh extras/card-generator/output/pdfs/mxster-cards.pdf | awk '{print $5}'))
- **mxster-cards-bw.pdf**: Black & white cards, single-sided ($(ls -lh extras/card-generator/output/pdfs/mxster-cards-bw.pdf | awk '{print $5}'))
- **mxster-cards-duplex.pdf**: Color cards, double-sided for duplex printing ($(ls -lh extras/card-generator/output/pdfs/mxster-cards-duplex.pdf | awk '{print $5}'))
- **mxster-cards-bw-duplex.pdf**: Black & white cards, double-sided ($(ls -lh extras/card-generator/output/pdfs/mxster-cards-bw-duplex.pdf | awk '{print $5}'))

**Source Code:**
- **mxster-source.zip**: Complete mxster game source code ($(ls -lh extras/build/archives/mxster-source.zip | awk '{print $5}'))

### Card Layout
- 6 cards per page (A4 landscape, 3x2 grid)
- ISO/IEC 7810 standard size (85.6mm x 53.98mm - credit card size)
- Cut marks included for precise cutting

For specific versions, see: https://github.com/pepperonas/mxster/releases

---
🔄 Auto-updated: $(date '+%Y-%m-%d %H:%M')"

echo -e "${GREEN}✅ Release notes updated${RESET}"
echo ""

# Optional: Keep ZIPs in extras/build/archives (no cleanup needed)
echo -e "${GREEN}✅ Archives saved in extras/build/archives/${RESET}"
echo ""

# Fertig!
echo "╔════════════════════════════════════════════╗"
echo "║            ✅  Fertig!  ✅                 ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🎉 Release successfully updated!${RESET}"
echo ""
echo -e "${CYAN}📊 Summary:${RESET}"
echo "   • Songs: ${SONG_COUNT}"
echo "   • GitHub: https://github.com/pepperonas/mxster"
echo "   • Latest Release: https://github.com/pepperonas/mxster/releases/tag/latest"
echo "   • Live PWA: https://mxster.de"
echo ""
