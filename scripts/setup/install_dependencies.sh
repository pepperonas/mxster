#!/bin/bash
echo "📦 Installiere Dependencies..."

# Node.js prüfen
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nicht gefunden. Bitte installieren: https://nodejs.org"
    exit 1
fi

# Python prüfen
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 nicht gefunden. Bitte installieren."
    exit 1
fi

# OpenSCAD prüfen
if ! command -v openscad &> /dev/null; then
    echo "⚠️  OpenSCAD nicht gefunden. Für 3D-Modelle installieren: brew install openscad"
fi

# PWA Dependencies (from scripts/setup/ to root/pwa)
cd "$(dirname "$0")/../../pwa"
npm install

# Python Dependencies
pip3 install qrcode pillow

echo "✅ Alle Dependencies installiert!"
