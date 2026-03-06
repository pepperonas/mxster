#!/bin/bash

###############################################################################
# mxster - PDF Card Generator
#
# Generiert alle 4 PDF-Varianten der Spielkarten:
# 1. Standard (farbig, nebeneinander)
# 2. Schwarz-Weiß (nebeneinander)
# 3. Duplex (farbig, getrennte Seiten)
# 4. Duplex Schwarz-Weiß (getrennte Seiten)
#
# Verwendung:
#   ./generate-all-pdfs.sh
###############################################################################

# Farben für Terminal-Output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RESET='\033[0m'

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   📄  mxster PDF Generator  📄           ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Wechsle ins pwa Verzeichnis (from scripts/build/ to root/pwa)
cd "$(dirname "$0")/../../pwa" || exit 1

# Zähle Songs
SONG_COUNT=$(node -e "const songs = require('./src/data/songs.js'); console.log(songs.songs.length)")
echo -e "${CYAN}📚 ${SONG_COUNT} Songs in der Datenbank${RESET}"
echo ""

# 1. Standard PDF (Farbig)
echo -e "${CYAN}🔄 Generiere mxster-cards.pdf (Standard, farbig)...${RESET}"
node generate-cards.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ mxster-cards.pdf generiert${RESET}"
else
    echo -e "${YELLOW}⚠️  Fehler bei mxster-cards.pdf${RESET}"
fi
echo ""

# 2. Schwarz-Weiß PDF
echo -e "${CYAN}🔄 Generiere mxster-cards-bw.pdf (Schwarz-Weiß)...${RESET}"
node generate-cards.js --bw
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ mxster-cards-bw.pdf generiert${RESET}"
else
    echo -e "${YELLOW}⚠️  Fehler bei mxster-cards-bw.pdf${RESET}"
fi
echo ""

# 3. Duplex PDF (Farbig)
echo -e "${CYAN}🔄 Generiere mxster-cards-duplex.pdf (Duplex, farbig)...${RESET}"
node generate-cards.js --duplex
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ mxster-cards-duplex.pdf generiert${RESET}"
else
    echo -e "${YELLOW}⚠️  Fehler bei mxster-cards-duplex.pdf${RESET}"
fi
echo ""

# 4. Duplex Schwarz-Weiß PDF
echo -e "${CYAN}🔄 Generiere mxster-cards-bw-duplex.pdf (Duplex, Schwarz-Weiß)...${RESET}"
node generate-cards.js --duplex --bw
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ mxster-cards-bw-duplex.pdf generiert${RESET}"
else
    echo -e "${YELLOW}⚠️  Fehler bei mxster-cards-bw-duplex.pdf${RESET}"
fi
echo ""

# Zusammenfassung
echo "╔════════════════════════════════════════════╗"
echo "║            ✅  Fertig!  ✅                 ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo -e "${CYAN}Generierte PDFs in extras/card-generator/output/pdfs/:${RESET}"
echo "  • mxster-cards.pdf          (Standard, farbig)"
echo "  • mxster-cards-bw.pdf       (Schwarz-Weiß)"
echo "  • mxster-cards-duplex.pdf   (Duplex, farbig)"
echo "  • mxster-cards-bw-duplex.pdf (Duplex, Schwarz-Weiß)"
echo ""
echo -e "${CYAN}📊 Statistik:${RESET}"
ls -lh ../extras/card-generator/output/pdfs/mxster-cards*.pdf 2>/dev/null | awk '{print "  • " $9 " (" $5 ")"}'
echo ""
