# XS Test Print Generator

Standalone script to generate miniature test print versions of mxster game cards.

## Overview

The XS generator creates scaled-down cards optimized for quick test prints before committing to full-size production runs.

## Specifications

### Dimensions (compared to standard cards)
- **Length**: 42.8mm (50% of 85.6mm)
- **Width**: 26.99mm (50% of 53.98mm)
- **Height**: 0.96mm (60% of 1.6mm)
- **Corner Radius**: 1.25mm (50% of 2.5mm)

### QR Code
- **Size**: 24mm × 24mm (50% of 48mm)
- **Depth**: 0.32mm (embossed, convex)
- **Position**: Centered on front side

### Text Rendering
- **Style**: Embossed (convex) instead of engraved
- **Year Font**: 7mm (50% of 14mm)
- **Title Font (Single)**: 3.25mm (50% of 6.5mm)
- **Title Font (Split)**: 2.75mm (50% of 5.5mm)
- **Artist Font**: 3mm (50% of 6mm)
- **Text Height**: 0.36mm (raised above card surface)

### Notable Changes
- ✅ Text is **embossed** (sticks out) instead of engraved (carved in)
- ✅ QR code is **embossed** on the front
- ✅ **No watermark** on cards
- ✅ Filename suffix: `_XS` for easy identification

## Output Directories

All XS files are stored in separate directories to avoid confusion with full-size cards:

```
card-generator/output/
├── qr-codes-xs/           # XS QR code PNGs
│   └── song_000_Rick_Astley_Never_Gonna_Give_You_Up_1987_XS.png
└── models-xs/             # XS 3D models
    ├── song_000_Rick_Astley_Never_Gonna_Give_You_Up_1987_XS.scad
    └── song_000_Rick_Astley_Never_Gonna_Give_You_Up_1987_XS.stl
```

## Usage

### Manual Generation from Code

```javascript
import { generateCardXS, generateSTLXS } from './generateCard-xs.js'

const song = {
  id: "song_001",
  title: "Bohemian Rhapsody",
  artist: "Queen",
  year: 1975,
  spotifyId: "4u7EnebtmKWzUH433cf5Qv"
}

// Generate XS card
const result = await generateCardXS(song)

// Generate STL (requires OpenSCAD CLI)
await generateSTLXS(result.scadPath)
```

### Test Script

A ready-to-use test script is included:

```bash
cd card-generator
node test-xs-generator.js
```

This will generate an XS test card for "Never Gonna Give You Up" by Rick Astley.

## Verification Checklist

After generating an XS card, verify the following in OpenSCAD:

### 1. Dimensions
- [ ] Card length: 42.8mm
- [ ] Card width: 26.99mm
- [ ] Card height: 0.96mm
- [ ] Corner radius: 1.25mm

### 2. Visual Appearance
- [ ] QR code is **raised** (embossed), not carved (engraved)
- [ ] Text is **raised** (embossed), not carved (engraved)
- [ ] No watermark present
- [ ] All text is readable and properly sized

### 3. Structure
- [ ] Assembly uses `union()` (not `difference()`)
- [ ] QR code positioned on front (bottom) side
- [ ] Text positioned on back (top) side

## 3D Printing Recommendations

### Print Settings
- **Layer Height**: 0.12mm (finer layers for small details)
- **Infill**: 20%
- **Support**: None needed (embossed design requires no support)
- **Orientation**: Lay flat on build plate (front side down)

### Material
- **PLA**: Best for test prints (fast, cheap)
- **PETG**: More durable if testing durability
- **Resin**: Best detail quality for tiny features

### Print Time Estimate
- ~5-10 minutes per card (vs ~20-30 minutes for full-size)

## Why XS Cards?

### Benefits
1. **Fast Testing**: 50% less print time
2. **Material Savings**: Uses 60% less filament
3. **Quick Iteration**: Test multiple designs rapidly
4. **Embossed Validation**: Verify text readability when embossed
5. **QR Code Testing**: Check if smaller QR codes are scannable

### Use Cases
- Testing new font sizes
- Validating embossed vs engraved aesthetics
- Checking QR code scannability at different sizes
- Material comparison (PLA vs PETG vs resin)
- Color combinations testing

## Integration Notes

**Important**: This script is **NOT integrated** into the existing song management workflow.

- ❌ Not called by `add-song.js`
- ❌ Not called by `edit-song.js`
- ❌ Not called by `exchange-song.js`
- ❌ Not included in PDF generation
- ✅ Standalone manual use only

This is intentional - XS cards are for testing purposes only, not production.

## Troubleshooting

### OpenSCAD Not Found
If STL generation fails:
```bash
# Install OpenSCAD
brew install openscad  # macOS
apt-get install openscad  # Linux

# Or manually open .scad file in OpenSCAD GUI
open output/models-xs/*.scad
```

### Text Too Small
If text is illegible at XS scale:
- Try resin printing for finer details
- Consider increasing text_height in generateCard-xs.js
- Use a finer nozzle (0.25mm instead of 0.4mm)

### QR Code Not Scanning
If QR codes don't scan well at 24mm:
- Increase contrast (black filament on white background)
- Increase qr_code_depth for deeper embossing
- Use resin for sharper edges
- Print at higher resolution (0.12mm layers)

## File Structure

```
card-generator/
├── generateCard-xs.js       # XS generator script (new)
├── test-xs-generator.js     # Test script (new)
├── README-XS.md             # This file (new)
├── generateCard.js          # Original generator (unchanged)
├── qrToScad.js              # Shared QR converter
└── output/
    ├── qr-codes-xs/         # XS QR codes (new)
    └── models-xs/           # XS 3D models (new)
```

## Example Output

**Test Song**: Rick Astley - Never Gonna Give You Up (1987)

**Files Generated**:
- `song_000_Rick_Astley_Never_Gonna_Give_You_Up_1987_XS.png` (7.2KB)
- `song_000_Rick_Astley_Never_Gonna_Give_You_Up_1987_XS.scad` (61KB)
- `song_000_Rick_Astley_Never_Gonna_Give_You_Up_1987_XS.stl` (1.6MB)

**SCAD File Header**:
```openscad
// mxster Game Card XS (Test Print) - Never Gonna Give You Up
// Generated automatically - do not edit manually
// XS Version: 50% width/length, 60% height, convex text, no watermark

// Card dimensions (50% width/length, 60% height of standard)
card_length = 42.8;   // 50% of 85.6mm
card_width = 26.99;   // 50% of 53.98mm
card_height = 0.96;   // 60% of 1.6mm
```

## Future Enhancements

Potential improvements for future versions:

- [ ] CLI interface for batch generation
- [ ] Custom scaling factor (not just 50%/60%)
- [ ] Multi-card 3MF export
- [ ] Automatic comparison report (XS vs standard)
- [ ] Integration with card database (docs/songs.json)

---

**Version**: 1.0
**Created**: 2025-11-02
**Author**: Generated for mxster project
