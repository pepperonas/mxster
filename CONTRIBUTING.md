# Contributing to mxtape

Vielen Dank für dein Interesse an mxtape! 🎵

## 📦 Repository-Struktur

Dieses Projekt wird in **zwei Repositories** verwaltet:

1. **Öffentliches Repository** (hier): https://github.com/pepperonas/mxtape
   - Enthält den kompletten Quellcode
   - Offen für Community Contributions
   - **KEINE** sensiblen Daten oder Credentials

2. **Privates Repository**: Nur für Entwickler/Maintainer
   - Enthält zusätzliche interne Dokumentation
   - Deployment-Scripts und Server-Konfigurationen
   - Backup-Dateien und Test-Dateien
   - Entwickler-Notizen (CLAUDE.md, DEPLOYMENT.md, etc.)

## 🤝 Wie du beitragen kannst

### 1. Fork & Clone

```bash
git clone https://github.com/pepperonas/mxtape.git
cd mxtape
```

### 2. Branch erstellen

```bash
git checkout -b feature/dein-feature-name
```

### 3. Änderungen machen

- Schreibe sauberen, kommentierten Code
- Teste deine Änderungen lokal
- Befolge den bestehenden Code-Style

### 4. Commit

```bash
git add .
git commit -m "feat: Beschreibung deines Features"
```

**Commit-Konventionen:**
- `feat:` - Neues Feature
- `fix:` - Bugfix
- `docs:` - Dokumentation
- `style:` - Code-Formatierung
- `refactor:` - Code-Refactoring
- `test:` - Tests hinzufügen/ändern
- `chore:` - Wartungsarbeiten

### 5. Push & Pull Request

```bash
git push origin feature/dein-feature-name
```

Dann erstelle einen Pull Request auf GitHub!

## 🐛 Bugs melden

Gefundene Bugs bitte als [GitHub Issue](https://github.com/pepperonas/mxtape/issues) melden:

1. Beschreibe das Problem klar
2. Füge Schritte zur Reproduktion hinzu
3. Erwähne dein Betriebssystem und Browser
4. Screenshots helfen!

## 💡 Feature-Vorschläge

Hast du eine Idee für ein neues Feature? Erstelle ein [GitHub Issue](https://github.com/pepperonas/mxtape/issues) mit:

- Beschreibung des Features
- Warum es nützlich wäre
- Wie es funktionieren könnte

## 📝 Code of Conduct

- Sei respektvoll und konstruktiv
- Hilf anderen Community-Mitgliedern
- Akzeptiere konstruktive Kritik
- Fokussiere auf das Projekt

## ⚠️ Was NICHT ins öffentliche Repo gehört

Bitte achte darauf, KEINE sensiblen Daten zu committen:

- ❌ API Keys oder Credentials
- ❌ `.env` Dateien mit echten Daten
- ❌ `spotify.config.js` mit echten Credentials
- ❌ Server-Konfigurationen
- ❌ Private Notizen oder Dokumentation
- ❌ Backup-Dateien

**Tipp:** Die `.gitignore` ist bereits entsprechend konfiguriert!

## 🚀 Pull Request Checklist

Bevor du einen PR erstellst, prüfe:

- [ ] Code läuft lokal ohne Fehler
- [ ] Keine Warnungen in der Konsole
- [ ] Code ist kommentiert (falls nötig)
- [ ] README aktualisiert (falls nötig)
- [ ] Keine sensiblen Daten im Commit
- [ ] Commit-Message ist aussagekräftig

## 📞 Fragen?

Bei Fragen kannst du:

- Ein [GitHub Issue](https://github.com/pepperonas/mxtape/issues) erstellen
- Eine [Discussion](https://github.com/pepperonas/mxtape/discussions) starten
- Mich per E-Mail kontaktieren: martin.pfeffer@celox.io

## 🙏 Danke!

Jeder Beitrag macht mxtape besser - egal ob Code, Dokumentation, Bug-Reports oder Feature-Ideen!

---

**Made with ❤️ for music lovers** | © 2025 Martin Pfeffer
