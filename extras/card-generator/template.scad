// mxster Game Card - 3D Model Template
// Credit Card Size: 85.6mm x 53.98mm
// OpenSCAD parametric template for music game cards

// ========================================
// PARAMETERS (Set by generator script)
// ========================================

// Card dimensions (ISO/IEC 7810 standard - credit card size)
card_length = 85.6;
card_width = 53.98;
card_height = 1.2; // Slightly thicker than credit card for durability
corner_radius = 2.5;

// Text content
song_year = "1975";
song_title = "Bohemian Rhapsody";
song_artist = "Queen";

// QR Code settings
qr_code_image = "qr-codes/default.png"; // Path to QR code PNG
qr_code_size = 35; // Size of QR code in mm
qr_code_depth = 0.4; // Depth of engraved QR code

// Text settings
text_height = 0.25; // Height of embossed text
year_font_size = 18;
title_font_size = 9;  // Vergrößert von 7 auf 9 (entspricht PDF: 11→13)
artist_font_size = 8; // Vergrößert von 6 auf 8 (entspricht PDF: 9→11)
font_name = "Liberation Sans:style=Bold";

// ========================================
// MODULES
// ========================================

// Rounded rectangle module
module rounded_rect(length, width, height, radius) {
    hull() {
        translate([radius, radius, 0])
            cylinder(h=height, r=radius, $fn=50);
        translate([length-radius, radius, 0])
            cylinder(h=height, r=radius, $fn=50);
        translate([radius, width-radius, 0])
            cylinder(h=height, r=radius, $fn=50);
        translate([length-radius, width-radius, 0])
            cylinder(h=height, r=radius, $fn=50);
    }
}

// Base card body
module card_base() {
    rounded_rect(card_length, card_width, card_height, corner_radius);
}

// QR Code engraving (front side)
module qr_code_engraving() {
    translate([card_length/2, card_width/2, card_height - qr_code_depth/2]) {
        // QR code as engraved surface
        // Note: In OpenSCAD, you'd use surface() for image-based engraving
        // For now, we create a placeholder rectangular depression
        translate([-qr_code_size/2, -qr_code_size/2, 0])
            cube([qr_code_size, qr_code_size, qr_code_depth + 0.1]);

        // Alternative: If using surface() with heightmap
        // scale([qr_code_size/100, qr_code_size/100, qr_code_depth])
        //     surface(file = qr_code_image, center = true, invert = true);
    }
}

// Embossed text (back side)
module embossed_year() {
    translate([card_length/2, card_width * 0.65, card_height]) {
        linear_extrude(height = text_height) {
            text(song_year,
                 size = year_font_size,
                 font = font_name,
                 halign = "center",
                 valign = "center");
        }
    }
}

module embossed_title() {
    translate([card_length/2, card_width * 0.40, card_height]) {
        linear_extrude(height = text_height) {
            text(song_title,
                 size = title_font_size,
                 font = font_name,
                 halign = "center",
                 valign = "center");
        }
    }
}

module embossed_artist() {
    translate([card_length/2, card_width * 0.25, card_height]) {
        linear_extrude(height = text_height) {
            text(song_artist,
                 size = artist_font_size,
                 font = font_name,
                 halign = "center",
                 valign = "center");
        }
    }
}

// Small logo/watermark
module watermark() {
    translate([card_length - 15, 3, card_height]) {
        linear_extrude(height = 0.15) {
            text("mxster",
                 size = 3,
                 font = "Liberation Sans:style=Bold",
                 halign = "left",
                 valign = "bottom");
        }
    }
}

// ========================================
// MAIN ASSEMBLY
// ========================================

// Choose which side to render
render_front = true; // Set to true for QR code side, false for text side
dual_sided = false; // Set to true to see both sides (for preview only)

if (dual_sided) {
    // Preview mode: Show both sides
    color("white") card_base();
    color("blue", 0.7) qr_code_engraving();
    color("red") embossed_year();
    color("red") embossed_title();
    color("red") embossed_artist();
    color("gray") watermark();
} else if (render_front) {
    // Front side (QR code)
    difference() {
        card_base();
        qr_code_engraving();
    }
    watermark();
} else {
    // Back side (text)
    union() {
        card_base();
        embossed_year();
        embossed_title();
        embossed_artist();
    }
}

// ========================================
// USAGE NOTES
// ========================================

/*
To generate a card:
1. Set parameters at the top of this file
2. Render front side: render_front = true
3. Export to STL: File → Export → Export as STL
4. Render back side: render_front = false
5. Export back side STL
6. Print both sides and glue together, or use dual-extrusion printer

For advanced QR code engraving:
- Convert QR code PNG to heightmap (grayscale)
- Use surface() function with the heightmap file
- Adjust depth multiplier for visibility

Recommended print settings:
- Layer height: 0.1-0.2mm
- Infill: 100% for durability
- Supports: Not needed
- Material: PLA or PETG
*/
