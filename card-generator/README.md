# 🎴 mxster Card Generator

Generate QR code cards and 3D-printable models for the mxster music timeline game.

## Quick Start

### Prerequisites
```bash
# Install Python dependencies
cd card-generator
python3 -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install qrcode pillow
```

### Generate Cards

```bash
# Generate QR codes + printable cards from songs.json
python generate_cards.py ../docs/songs.json

# Output:
# - qr-codes/*.png - Individual QR codes
# - printable/*.png - Cards with song info and QR code
```

## Features

### 1. QR Code Generation
- Creates QR codes linking to Spotify tracks
- High error correction (Level H, 30% redundancy)
- Optimized size: 20px boxes, 8px border
- Works with smartphone cameras and in-browser scanners

### 2. Printable Cards
- Song title, artist, year
- Embedded QR code
- Optimized for home printing
- Standard card dimensions

### 3. 3D Models (Optional)
Generate 3D-printable card holders and game pieces:
```bash
# Requires OpenSCAD installed
node generate-3d-models.js
```

## File Structure

```
card-generator/
├── generate_cards.py       # Main generation script
├── qr-codes/              # Generated QR codes (gitignored)
├── printable/             # Printable cards (gitignored)
├── models/                # 3D models (SCAD/STL)
└── venv/                  # Python virtual environment
```

## Technical Details

### QR Code Format
- **Content**: Spotify Track URLs (`https://open.spotify.com/track/{spotifyId}`)
- **Fallback**: YouTube URLs if Spotify unavailable
- **Error Correction**: Level H (30% redundancy for damaged codes)
- **Size**: 20px box size, 8px border

### Card Specifications
- **Format**: PNG images
- **Resolution**: 300 DPI (print quality)
- **Dimensions**: Standard playing card size
- **Layout**: Title (top) → Artist → Year → QR Code (bottom)

### 3D Printing
Located in `../3d-models/`:
- `song_card.scad` - Card with QR cutout
- `game_chip.scad` - Timeline markers
- `card_holder.scad` - Card storage

**Recommended Settings:**
- Material: PLA or PETG
- Layer Height: 0.2mm
- Infill: 20%
- Support: Only for chips

## Workflow

### Adding New Songs

1. **Add to songs.json**:
```json
{
  "id": "song_XXX",
  "title": "Song Title",
  "artist": "Artist Name",
  "year": 1999,
  "spotifyId": "spotify_track_id",
  "previewUrl": "https://...",
  "audioUrl": ""
}
```

2. **Generate Cards**:
```bash
python generate_cards.py ../docs/songs.json
```

3. **Update PWA Data**:
```bash
cd ../pwa
npm run import-spotify  # Or manually update src/data/songs.js
```

### Import from Spotify Playlist

```bash
cd ../pwa

# Configure spotify.config.js first
npm run import-spotify

# Optional: Filter invalid songs
npm run filter-songs

# Regenerate cards
cd ../card-generator
python generate_cards.py ../docs/songs.json
```

## Troubleshooting

### QR Codes Not Scanning
- Increase error correction level
- Check printer DPI settings (minimum 300 DPI)
- Ensure adequate lighting when scanning
- Try increasing QR code size in script

### Missing Dependencies
```bash
pip install --upgrade qrcode pillow
```

### 3D Print Issues
- Enable support for game chips
- Check bed adhesion settings
- Verify STL file integrity in slicer

## Changelog

### v1.2.0 (Current)
- Added 3D model generation support
- Improved card layout with better spacing
- Added batch generation for all songs
- Optimized QR code error correction

### v1.1.0
- Added printable card generation
- Implemented filename sanitization
- Added support for YouTube fallback URLs

### v1.0.0
- Initial QR code generation
- Basic card layout
- Spotify integration

## Contributing

When adding features:
1. Test with multiple song entries
2. Verify QR codes scan correctly
3. Check print quality at 300 DPI
4. Update this README with changes

## License

Part of the mxster project. See main repository LICENSE.
