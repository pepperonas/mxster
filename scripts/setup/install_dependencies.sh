#!/bin/bash
echo "📦 Installiere Dependencies..."

# Node.js prüfen
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nicht gefunden. Bitte installieren: https://nodejs.org"
    exit 1
fi

# Root Dependencies (Song-Management-Skripte, Integrity-Tests)
cd "$(dirname "$0")/../.."
npm install

# PWA Dependencies
cd pwa
npm install

echo "✅ Alle Dependencies installiert!"
