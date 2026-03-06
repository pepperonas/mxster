// mxster Game Card - Truly Madly Deeply
// Generated automatically - do not edit manually

// ========================================
// CARD PARAMETERS
// ========================================

// Card dimensions (ISO/IEC 7810 standard - credit card size)
card_length = 85.6;
card_width = 53.98;
card_height = 1.6;  // Increased from 1.2mm (133% thicker for better durability)
corner_radius = 2.5;

// Song information
song_year = "1997";
song_title_line1 = "Truly";
song_title_line2 = "Madly Deeply";
song_title_is_split = true;
song_artist = "Savage Garden";

// QR Code settings
qr_code_size = 48;  // Increased from 35 for better camera recognition
qr_code_depth = 0.53;  // Increased from 0.4mm (proportional to card thickness)

// Text settings
text_height = 0.6;  // Deeper engraving for more tactile feel (was 0.33mm)
watermark_height = 0.4;  // Deeper watermark engraving (was 0.15mm)
year_font_size = 14;
title_font_size_single = 6.5;  // Vergrößert von 5.5
title_font_size_split = 5.5;  // Vergrößert von 4.5 (Smaller font for two-line titles)
artist_font_size = 6;  // Vergrößert von 5
font_name = "Liberation Sans:style=Bold";

// ========================================
// MODULES
// ========================================

// QR Code pattern generated from image
module qr_code_pattern(size, depth) {
    scale([size/50, size/50, 1]) {
        translate([2, 2, 0]) cube([1, 1, depth]);
        translate([3, 2, 0]) cube([1, 1, depth]);
        translate([4, 2, 0]) cube([1, 1, depth]);
        translate([5, 2, 0]) cube([1, 1, depth]);
        translate([6, 2, 0]) cube([1, 1, depth]);
        translate([7, 2, 0]) cube([1, 1, depth]);
        translate([8, 2, 0]) cube([1, 1, depth]);
        translate([9, 2, 0]) cube([1, 1, depth]);
        translate([10, 2, 0]) cube([1, 1, depth]);
        translate([11, 2, 0]) cube([1, 1, depth]);
        translate([13, 2, 0]) cube([1, 1, depth]);
        translate([14, 2, 0]) cube([1, 1, depth]);
        translate([15, 2, 0]) cube([1, 1, depth]);
        translate([20, 2, 0]) cube([1, 1, depth]);
        translate([21, 2, 0]) cube([1, 1, depth]);
        translate([22, 2, 0]) cube([1, 1, depth]);
        translate([23, 2, 0]) cube([1, 1, depth]);
        translate([24, 2, 0]) cube([1, 1, depth]);
        translate([25, 2, 0]) cube([1, 1, depth]);
        translate([26, 2, 0]) cube([1, 1, depth]);
        translate([27, 2, 0]) cube([1, 1, depth]);
        translate([28, 2, 0]) cube([1, 1, depth]);
        translate([33, 2, 0]) cube([1, 1, depth]);
        translate([34, 2, 0]) cube([1, 1, depth]);
        translate([35, 2, 0]) cube([1, 1, depth]);
        translate([39, 2, 0]) cube([1, 1, depth]);
        translate([40, 2, 0]) cube([1, 1, depth]);
        translate([41, 2, 0]) cube([1, 1, depth]);
        translate([42, 2, 0]) cube([1, 1, depth]);
        translate([43, 2, 0]) cube([1, 1, depth]);
        translate([44, 2, 0]) cube([1, 1, depth]);
        translate([45, 2, 0]) cube([1, 1, depth]);
        translate([46, 2, 0]) cube([1, 1, depth]);
        translate([47, 2, 0]) cube([1, 1, depth]);
        translate([48, 2, 0]) cube([1, 1, depth]);
        translate([2, 3, 0]) cube([1, 1, depth]);
        translate([11, 3, 0]) cube([1, 1, depth]);
        translate([15, 3, 0]) cube([1, 1, depth]);
        translate([16, 3, 0]) cube([1, 1, depth]);
        translate([17, 3, 0]) cube([1, 1, depth]);
        translate([18, 3, 0]) cube([1, 1, depth]);
        translate([20, 3, 0]) cube([1, 1, depth]);
        translate([21, 3, 0]) cube([1, 1, depth]);
        translate([22, 3, 0]) cube([1, 1, depth]);
        translate([25, 3, 0]) cube([1, 1, depth]);
        translate([28, 3, 0]) cube([1, 1, depth]);
        translate([29, 3, 0]) cube([1, 1, depth]);
        translate([30, 3, 0]) cube([1, 1, depth]);
        translate([31, 3, 0]) cube([1, 1, depth]);
        translate([32, 3, 0]) cube([1, 1, depth]);
        translate([36, 3, 0]) cube([1, 1, depth]);
        translate([37, 3, 0]) cube([1, 1, depth]);
        translate([39, 3, 0]) cube([1, 1, depth]);
        translate([48, 3, 0]) cube([1, 1, depth]);
        translate([2, 4, 0]) cube([1, 1, depth]);
        translate([11, 4, 0]) cube([1, 1, depth]);
        translate([15, 4, 0]) cube([1, 1, depth]);
        translate([16, 4, 0]) cube([1, 1, depth]);
        translate([17, 4, 0]) cube([1, 1, depth]);
        translate([18, 4, 0]) cube([1, 1, depth]);
        translate([20, 4, 0]) cube([1, 1, depth]);
        translate([21, 4, 0]) cube([1, 1, depth]);
        translate([22, 4, 0]) cube([1, 1, depth]);
        translate([25, 4, 0]) cube([1, 1, depth]);
        translate([28, 4, 0]) cube([1, 1, depth]);
        translate([29, 4, 0]) cube([1, 1, depth]);
        translate([30, 4, 0]) cube([1, 1, depth]);
        translate([31, 4, 0]) cube([1, 1, depth]);
        translate([32, 4, 0]) cube([1, 1, depth]);
        translate([36, 4, 0]) cube([1, 1, depth]);
        translate([37, 4, 0]) cube([1, 1, depth]);
        translate([39, 4, 0]) cube([1, 1, depth]);
        translate([48, 4, 0]) cube([1, 1, depth]);
        translate([2, 5, 0]) cube([1, 1, depth]);
        translate([5, 5, 0]) cube([1, 1, depth]);
        translate([6, 5, 0]) cube([1, 1, depth]);
        translate([7, 5, 0]) cube([1, 1, depth]);
        translate([8, 5, 0]) cube([1, 1, depth]);
        translate([11, 5, 0]) cube([1, 1, depth]);
        translate([16, 5, 0]) cube([1, 1, depth]);
        translate([17, 5, 0]) cube([1, 1, depth]);
        translate([22, 5, 0]) cube([1, 1, depth]);
        translate([25, 5, 0]) cube([1, 1, depth]);
        translate([26, 5, 0]) cube([1, 1, depth]);
        translate([27, 5, 0]) cube([1, 1, depth]);
        translate([29, 5, 0]) cube([1, 1, depth]);
        translate([30, 5, 0]) cube([1, 1, depth]);
        translate([31, 5, 0]) cube([1, 1, depth]);
        translate([32, 5, 0]) cube([1, 1, depth]);
        translate([36, 5, 0]) cube([1, 1, depth]);
        translate([37, 5, 0]) cube([1, 1, depth]);
        translate([39, 5, 0]) cube([1, 1, depth]);
        translate([42, 5, 0]) cube([1, 1, depth]);
        translate([43, 5, 0]) cube([1, 1, depth]);
        translate([44, 5, 0]) cube([1, 1, depth]);
        translate([45, 5, 0]) cube([1, 1, depth]);
        translate([48, 5, 0]) cube([1, 1, depth]);
        translate([2, 6, 0]) cube([1, 1, depth]);
        translate([5, 6, 0]) cube([1, 1, depth]);
        translate([6, 6, 0]) cube([1, 1, depth]);
        translate([7, 6, 0]) cube([1, 1, depth]);
        translate([8, 6, 0]) cube([1, 1, depth]);
        translate([11, 6, 0]) cube([1, 1, depth]);
        translate([13, 6, 0]) cube([1, 1, depth]);
        translate([14, 6, 0]) cube([1, 1, depth]);
        translate([15, 6, 0]) cube([1, 1, depth]);
        translate([19, 6, 0]) cube([1, 1, depth]);
        translate([23, 6, 0]) cube([1, 1, depth]);
        translate([24, 6, 0]) cube([1, 1, depth]);
        translate([25, 6, 0]) cube([1, 1, depth]);
        translate([26, 6, 0]) cube([1, 1, depth]);
        translate([27, 6, 0]) cube([1, 1, depth]);
        translate([29, 6, 0]) cube([1, 1, depth]);
        translate([33, 6, 0]) cube([1, 1, depth]);
        translate([34, 6, 0]) cube([1, 1, depth]);
        translate([39, 6, 0]) cube([1, 1, depth]);
        translate([42, 6, 0]) cube([1, 1, depth]);
        translate([43, 6, 0]) cube([1, 1, depth]);
        translate([44, 6, 0]) cube([1, 1, depth]);
        translate([45, 6, 0]) cube([1, 1, depth]);
        translate([48, 6, 0]) cube([1, 1, depth]);
        translate([2, 7, 0]) cube([1, 1, depth]);
        translate([5, 7, 0]) cube([1, 1, depth]);
        translate([6, 7, 0]) cube([1, 1, depth]);
        translate([7, 7, 0]) cube([1, 1, depth]);
        translate([8, 7, 0]) cube([1, 1, depth]);
        translate([11, 7, 0]) cube([1, 1, depth]);
        translate([13, 7, 0]) cube([1, 1, depth]);
        translate([14, 7, 0]) cube([1, 1, depth]);
        translate([15, 7, 0]) cube([1, 1, depth]);
        translate([19, 7, 0]) cube([1, 1, depth]);
        translate([23, 7, 0]) cube([1, 1, depth]);
        translate([24, 7, 0]) cube([1, 1, depth]);
        translate([25, 7, 0]) cube([1, 1, depth]);
        translate([26, 7, 0]) cube([1, 1, depth]);
        translate([27, 7, 0]) cube([1, 1, depth]);
        translate([29, 7, 0]) cube([1, 1, depth]);
        translate([33, 7, 0]) cube([1, 1, depth]);
        translate([34, 7, 0]) cube([1, 1, depth]);
        translate([39, 7, 0]) cube([1, 1, depth]);
        translate([42, 7, 0]) cube([1, 1, depth]);
        translate([43, 7, 0]) cube([1, 1, depth]);
        translate([44, 7, 0]) cube([1, 1, depth]);
        translate([45, 7, 0]) cube([1, 1, depth]);
        translate([48, 7, 0]) cube([1, 1, depth]);
        translate([2, 8, 0]) cube([1, 1, depth]);
        translate([5, 8, 0]) cube([1, 1, depth]);
        translate([6, 8, 0]) cube([1, 1, depth]);
        translate([7, 8, 0]) cube([1, 1, depth]);
        translate([8, 8, 0]) cube([1, 1, depth]);
        translate([11, 8, 0]) cube([1, 1, depth]);
        translate([13, 8, 0]) cube([1, 1, depth]);
        translate([14, 8, 0]) cube([1, 1, depth]);
        translate([15, 8, 0]) cube([1, 1, depth]);
        translate([25, 8, 0]) cube([1, 1, depth]);
        translate([28, 8, 0]) cube([1, 1, depth]);
        translate([33, 8, 0]) cube([1, 1, depth]);
        translate([34, 8, 0]) cube([1, 1, depth]);
        translate([39, 8, 0]) cube([1, 1, depth]);
        translate([42, 8, 0]) cube([1, 1, depth]);
        translate([43, 8, 0]) cube([1, 1, depth]);
        translate([44, 8, 0]) cube([1, 1, depth]);
        translate([45, 8, 0]) cube([1, 1, depth]);
        translate([48, 8, 0]) cube([1, 1, depth]);
        translate([2, 9, 0]) cube([1, 1, depth]);
        translate([11, 9, 0]) cube([1, 1, depth]);
        translate([13, 9, 0]) cube([1, 1, depth]);
        translate([14, 9, 0]) cube([1, 1, depth]);
        translate([16, 9, 0]) cube([1, 1, depth]);
        translate([17, 9, 0]) cube([1, 1, depth]);
        translate([18, 9, 0]) cube([1, 1, depth]);
        translate([19, 9, 0]) cube([1, 1, depth]);
        translate([22, 9, 0]) cube([1, 1, depth]);
        translate([23, 9, 0]) cube([1, 1, depth]);
        translate([24, 9, 0]) cube([1, 1, depth]);
        translate([26, 9, 0]) cube([1, 1, depth]);
        translate([27, 9, 0]) cube([1, 1, depth]);
        translate([28, 9, 0]) cube([1, 1, depth]);
        translate([29, 9, 0]) cube([1, 1, depth]);
        translate([30, 9, 0]) cube([1, 1, depth]);
        translate([31, 9, 0]) cube([1, 1, depth]);
        translate([32, 9, 0]) cube([1, 1, depth]);
        translate([39, 9, 0]) cube([1, 1, depth]);
        translate([48, 9, 0]) cube([1, 1, depth]);
        translate([2, 10, 0]) cube([1, 1, depth]);
        translate([11, 10, 0]) cube([1, 1, depth]);
        translate([13, 10, 0]) cube([1, 1, depth]);
        translate([14, 10, 0]) cube([1, 1, depth]);
        translate([16, 10, 0]) cube([1, 1, depth]);
        translate([17, 10, 0]) cube([1, 1, depth]);
        translate([18, 10, 0]) cube([1, 1, depth]);
        translate([19, 10, 0]) cube([1, 1, depth]);
        translate([22, 10, 0]) cube([1, 1, depth]);
        translate([23, 10, 0]) cube([1, 1, depth]);
        translate([24, 10, 0]) cube([1, 1, depth]);
        translate([26, 10, 0]) cube([1, 1, depth]);
        translate([27, 10, 0]) cube([1, 1, depth]);
        translate([28, 10, 0]) cube([1, 1, depth]);
        translate([29, 10, 0]) cube([1, 1, depth]);
        translate([30, 10, 0]) cube([1, 1, depth]);
        translate([31, 10, 0]) cube([1, 1, depth]);
        translate([32, 10, 0]) cube([1, 1, depth]);
        translate([39, 10, 0]) cube([1, 1, depth]);
        translate([48, 10, 0]) cube([1, 1, depth]);
        translate([2, 11, 0]) cube([1, 1, depth]);
        translate([3, 11, 0]) cube([1, 1, depth]);
        translate([4, 11, 0]) cube([1, 1, depth]);
        translate([5, 11, 0]) cube([1, 1, depth]);
        translate([6, 11, 0]) cube([1, 1, depth]);
        translate([7, 11, 0]) cube([1, 1, depth]);
        translate([8, 11, 0]) cube([1, 1, depth]);
        translate([9, 11, 0]) cube([1, 1, depth]);
        translate([10, 11, 0]) cube([1, 1, depth]);
        translate([11, 11, 0]) cube([1, 1, depth]);
        translate([13, 11, 0]) cube([1, 1, depth]);
        translate([14, 11, 0]) cube([1, 1, depth]);
        translate([16, 11, 0]) cube([1, 1, depth]);
        translate([17, 11, 0]) cube([1, 1, depth]);
        translate([19, 11, 0]) cube([1, 1, depth]);
        translate([22, 11, 0]) cube([1, 1, depth]);
        translate([25, 11, 0]) cube([1, 1, depth]);
        translate([28, 11, 0]) cube([1, 1, depth]);
        translate([30, 11, 0]) cube([1, 1, depth]);
        translate([31, 11, 0]) cube([1, 1, depth]);
        translate([33, 11, 0]) cube([1, 1, depth]);
        translate([34, 11, 0]) cube([1, 1, depth]);
        translate([36, 11, 0]) cube([1, 1, depth]);
        translate([37, 11, 0]) cube([1, 1, depth]);
        translate([39, 11, 0]) cube([1, 1, depth]);
        translate([40, 11, 0]) cube([1, 1, depth]);
        translate([41, 11, 0]) cube([1, 1, depth]);
        translate([42, 11, 0]) cube([1, 1, depth]);
        translate([43, 11, 0]) cube([1, 1, depth]);
        translate([44, 11, 0]) cube([1, 1, depth]);
        translate([45, 11, 0]) cube([1, 1, depth]);
        translate([46, 11, 0]) cube([1, 1, depth]);
        translate([47, 11, 0]) cube([1, 1, depth]);
        translate([48, 11, 0]) cube([1, 1, depth]);
        translate([13, 12, 0]) cube([1, 1, depth]);
        translate([14, 12, 0]) cube([1, 1, depth]);
        translate([16, 12, 0]) cube([1, 1, depth]);
        translate([17, 12, 0]) cube([1, 1, depth]);
        translate([18, 12, 0]) cube([1, 1, depth]);
        translate([22, 12, 0]) cube([1, 1, depth]);
        translate([26, 12, 0]) cube([1, 1, depth]);
        translate([27, 12, 0]) cube([1, 1, depth]);
        translate([28, 12, 0]) cube([1, 1, depth]);
        translate([29, 12, 0]) cube([1, 1, depth]);
        translate([30, 12, 0]) cube([1, 1, depth]);
        translate([31, 12, 0]) cube([1, 1, depth]);
        translate([32, 12, 0]) cube([1, 1, depth]);
        translate([35, 12, 0]) cube([1, 1, depth]);
        translate([36, 12, 0]) cube([1, 1, depth]);
        translate([37, 12, 0]) cube([1, 1, depth]);
        translate([2, 13, 0]) cube([1, 1, depth]);
        translate([8, 13, 0]) cube([1, 1, depth]);
        translate([11, 13, 0]) cube([1, 1, depth]);
        translate([12, 13, 0]) cube([1, 1, depth]);
        translate([13, 13, 0]) cube([1, 1, depth]);
        translate([14, 13, 0]) cube([1, 1, depth]);
        translate([15, 13, 0]) cube([1, 1, depth]);
        translate([16, 13, 0]) cube([1, 1, depth]);
        translate([17, 13, 0]) cube([1, 1, depth]);
        translate([18, 13, 0]) cube([1, 1, depth]);
        translate([19, 13, 0]) cube([1, 1, depth]);
        translate([22, 13, 0]) cube([1, 1, depth]);
        translate([23, 13, 0]) cube([1, 1, depth]);
        translate([24, 13, 0]) cube([1, 1, depth]);
        translate([26, 13, 0]) cube([1, 1, depth]);
        translate([27, 13, 0]) cube([1, 1, depth]);
        translate([30, 13, 0]) cube([1, 1, depth]);
        translate([31, 13, 0]) cube([1, 1, depth]);
        translate([32, 13, 0]) cube([1, 1, depth]);
        translate([33, 13, 0]) cube([1, 1, depth]);
        translate([34, 13, 0]) cube([1, 1, depth]);
        translate([36, 13, 0]) cube([1, 1, depth]);
        translate([37, 13, 0]) cube([1, 1, depth]);
        translate([38, 13, 0]) cube([1, 1, depth]);
        translate([39, 13, 0]) cube([1, 1, depth]);
        translate([40, 13, 0]) cube([1, 1, depth]);
        translate([41, 13, 0]) cube([1, 1, depth]);
        translate([42, 13, 0]) cube([1, 1, depth]);
        translate([43, 13, 0]) cube([1, 1, depth]);
        translate([44, 13, 0]) cube([1, 1, depth]);
        translate([48, 13, 0]) cube([1, 1, depth]);
        translate([2, 14, 0]) cube([1, 1, depth]);
        translate([8, 14, 0]) cube([1, 1, depth]);
        translate([11, 14, 0]) cube([1, 1, depth]);
        translate([12, 14, 0]) cube([1, 1, depth]);
        translate([13, 14, 0]) cube([1, 1, depth]);
        translate([14, 14, 0]) cube([1, 1, depth]);
        translate([15, 14, 0]) cube([1, 1, depth]);
        translate([16, 14, 0]) cube([1, 1, depth]);
        translate([17, 14, 0]) cube([1, 1, depth]);
        translate([18, 14, 0]) cube([1, 1, depth]);
        translate([19, 14, 0]) cube([1, 1, depth]);
        translate([22, 14, 0]) cube([1, 1, depth]);
        translate([23, 14, 0]) cube([1, 1, depth]);
        translate([24, 14, 0]) cube([1, 1, depth]);
        translate([26, 14, 0]) cube([1, 1, depth]);
        translate([27, 14, 0]) cube([1, 1, depth]);
        translate([30, 14, 0]) cube([1, 1, depth]);
        translate([31, 14, 0]) cube([1, 1, depth]);
        translate([32, 14, 0]) cube([1, 1, depth]);
        translate([33, 14, 0]) cube([1, 1, depth]);
        translate([34, 14, 0]) cube([1, 1, depth]);
        translate([36, 14, 0]) cube([1, 1, depth]);
        translate([37, 14, 0]) cube([1, 1, depth]);
        translate([38, 14, 0]) cube([1, 1, depth]);
        translate([39, 14, 0]) cube([1, 1, depth]);
        translate([40, 14, 0]) cube([1, 1, depth]);
        translate([41, 14, 0]) cube([1, 1, depth]);
        translate([42, 14, 0]) cube([1, 1, depth]);
        translate([43, 14, 0]) cube([1, 1, depth]);
        translate([44, 14, 0]) cube([1, 1, depth]);
        translate([48, 14, 0]) cube([1, 1, depth]);
        translate([3, 15, 0]) cube([1, 1, depth]);
        translate([4, 15, 0]) cube([1, 1, depth]);
        translate([6, 15, 0]) cube([1, 1, depth]);
        translate([7, 15, 0]) cube([1, 1, depth]);
        translate([12, 15, 0]) cube([1, 1, depth]);
        translate([13, 15, 0]) cube([1, 1, depth]);
        translate([14, 15, 0]) cube([1, 1, depth]);
        translate([15, 15, 0]) cube([1, 1, depth]);
        translate([16, 15, 0]) cube([1, 1, depth]);
        translate([17, 15, 0]) cube([1, 1, depth]);
        translate([22, 15, 0]) cube([1, 1, depth]);
        translate([23, 15, 0]) cube([1, 1, depth]);
        translate([24, 15, 0]) cube([1, 1, depth]);
        translate([25, 15, 0]) cube([1, 1, depth]);
        translate([26, 15, 0]) cube([1, 1, depth]);
        translate([27, 15, 0]) cube([1, 1, depth]);
        translate([28, 15, 0]) cube([1, 1, depth]);
        translate([30, 15, 0]) cube([1, 1, depth]);
        translate([31, 15, 0]) cube([1, 1, depth]);
        translate([33, 15, 0]) cube([1, 1, depth]);
        translate([34, 15, 0]) cube([1, 1, depth]);
        translate([35, 15, 0]) cube([1, 1, depth]);
        translate([36, 15, 0]) cube([1, 1, depth]);
        translate([37, 15, 0]) cube([1, 1, depth]);
        translate([38, 15, 0]) cube([1, 1, depth]);
        translate([43, 15, 0]) cube([1, 1, depth]);
        translate([44, 15, 0]) cube([1, 1, depth]);
        translate([45, 15, 0]) cube([1, 1, depth]);
        translate([2, 16, 0]) cube([1, 1, depth]);
        translate([6, 16, 0]) cube([1, 1, depth]);
        translate([7, 16, 0]) cube([1, 1, depth]);
        translate([8, 16, 0]) cube([1, 1, depth]);
        translate([9, 16, 0]) cube([1, 1, depth]);
        translate([10, 16, 0]) cube([1, 1, depth]);
        translate([11, 16, 0]) cube([1, 1, depth]);
        translate([12, 16, 0]) cube([1, 1, depth]);
        translate([18, 16, 0]) cube([1, 1, depth]);
        translate([20, 16, 0]) cube([1, 1, depth]);
        translate([21, 16, 0]) cube([1, 1, depth]);
        translate([22, 16, 0]) cube([1, 1, depth]);
        translate([23, 16, 0]) cube([1, 1, depth]);
        translate([24, 16, 0]) cube([1, 1, depth]);
        translate([28, 16, 0]) cube([1, 1, depth]);
        translate([30, 16, 0]) cube([1, 1, depth]);
        translate([31, 16, 0]) cube([1, 1, depth]);
        translate([33, 16, 0]) cube([1, 1, depth]);
        translate([34, 16, 0]) cube([1, 1, depth]);
        translate([35, 16, 0]) cube([1, 1, depth]);
        translate([39, 16, 0]) cube([1, 1, depth]);
        translate([43, 16, 0]) cube([1, 1, depth]);
        translate([44, 16, 0]) cube([1, 1, depth]);
        translate([2, 17, 0]) cube([1, 1, depth]);
        translate([6, 17, 0]) cube([1, 1, depth]);
        translate([7, 17, 0]) cube([1, 1, depth]);
        translate([8, 17, 0]) cube([1, 1, depth]);
        translate([9, 17, 0]) cube([1, 1, depth]);
        translate([10, 17, 0]) cube([1, 1, depth]);
        translate([11, 17, 0]) cube([1, 1, depth]);
        translate([12, 17, 0]) cube([1, 1, depth]);
        translate([18, 17, 0]) cube([1, 1, depth]);
        translate([20, 17, 0]) cube([1, 1, depth]);
        translate([21, 17, 0]) cube([1, 1, depth]);
        translate([22, 17, 0]) cube([1, 1, depth]);
        translate([23, 17, 0]) cube([1, 1, depth]);
        translate([24, 17, 0]) cube([1, 1, depth]);
        translate([28, 17, 0]) cube([1, 1, depth]);
        translate([30, 17, 0]) cube([1, 1, depth]);
        translate([31, 17, 0]) cube([1, 1, depth]);
        translate([33, 17, 0]) cube([1, 1, depth]);
        translate([34, 17, 0]) cube([1, 1, depth]);
        translate([35, 17, 0]) cube([1, 1, depth]);
        translate([39, 17, 0]) cube([1, 1, depth]);
        translate([43, 17, 0]) cube([1, 1, depth]);
        translate([44, 17, 0]) cube([1, 1, depth]);
        translate([3, 18, 0]) cube([1, 1, depth]);
        translate([4, 18, 0]) cube([1, 1, depth]);
        translate([15, 18, 0]) cube([1, 1, depth]);
        translate([16, 18, 0]) cube([1, 1, depth]);
        translate([17, 18, 0]) cube([1, 1, depth]);
        translate([20, 18, 0]) cube([1, 1, depth]);
        translate([21, 18, 0]) cube([1, 1, depth]);
        translate([23, 18, 0]) cube([1, 1, depth]);
        translate([24, 18, 0]) cube([1, 1, depth]);
        translate([25, 18, 0]) cube([1, 1, depth]);
        translate([32, 18, 0]) cube([1, 1, depth]);
        translate([33, 18, 0]) cube([1, 1, depth]);
        translate([34, 18, 0]) cube([1, 1, depth]);
        translate([36, 18, 0]) cube([1, 1, depth]);
        translate([37, 18, 0]) cube([1, 1, depth]);
        translate([39, 18, 0]) cube([1, 1, depth]);
        translate([46, 18, 0]) cube([1, 1, depth]);
        translate([47, 18, 0]) cube([1, 1, depth]);
        translate([2, 19, 0]) cube([1, 1, depth]);
        translate([8, 19, 0]) cube([1, 1, depth]);
        translate([11, 19, 0]) cube([1, 1, depth]);
        translate([12, 19, 0]) cube([1, 1, depth]);
        translate([18, 19, 0]) cube([1, 1, depth]);
        translate([20, 19, 0]) cube([1, 1, depth]);
        translate([21, 19, 0]) cube([1, 1, depth]);
        translate([25, 19, 0]) cube([1, 1, depth]);
        translate([30, 19, 0]) cube([1, 1, depth]);
        translate([31, 19, 0]) cube([1, 1, depth]);
        translate([33, 19, 0]) cube([1, 1, depth]);
        translate([34, 19, 0]) cube([1, 1, depth]);
        translate([35, 19, 0]) cube([1, 1, depth]);
        translate([36, 19, 0]) cube([1, 1, depth]);
        translate([37, 19, 0]) cube([1, 1, depth]);
        translate([39, 19, 0]) cube([1, 1, depth]);
        translate([40, 19, 0]) cube([1, 1, depth]);
        translate([41, 19, 0]) cube([1, 1, depth]);
        translate([42, 19, 0]) cube([1, 1, depth]);
        translate([43, 19, 0]) cube([1, 1, depth]);
        translate([44, 19, 0]) cube([1, 1, depth]);
        translate([46, 19, 0]) cube([1, 1, depth]);
        translate([47, 19, 0]) cube([1, 1, depth]);
        translate([48, 19, 0]) cube([1, 1, depth]);
        translate([2, 20, 0]) cube([1, 1, depth]);
        translate([3, 20, 0]) cube([1, 1, depth]);
        translate([4, 20, 0]) cube([1, 1, depth]);
        translate([6, 20, 0]) cube([1, 1, depth]);
        translate([7, 20, 0]) cube([1, 1, depth]);
        translate([9, 20, 0]) cube([1, 1, depth]);
        translate([10, 20, 0]) cube([1, 1, depth]);
        translate([12, 20, 0]) cube([1, 1, depth]);
        translate([18, 20, 0]) cube([1, 1, depth]);
        translate([19, 20, 0]) cube([1, 1, depth]);
        translate([20, 20, 0]) cube([1, 1, depth]);
        translate([21, 20, 0]) cube([1, 1, depth]);
        translate([22, 20, 0]) cube([1, 1, depth]);
        translate([26, 20, 0]) cube([1, 1, depth]);
        translate([27, 20, 0]) cube([1, 1, depth]);
        translate([28, 20, 0]) cube([1, 1, depth]);
        translate([38, 20, 0]) cube([1, 1, depth]);
        translate([40, 20, 0]) cube([1, 1, depth]);
        translate([41, 20, 0]) cube([1, 1, depth]);
        translate([45, 20, 0]) cube([1, 1, depth]);
        translate([2, 21, 0]) cube([1, 1, depth]);
        translate([3, 21, 0]) cube([1, 1, depth]);
        translate([4, 21, 0]) cube([1, 1, depth]);
        translate([6, 21, 0]) cube([1, 1, depth]);
        translate([7, 21, 0]) cube([1, 1, depth]);
        translate([9, 21, 0]) cube([1, 1, depth]);
        translate([10, 21, 0]) cube([1, 1, depth]);
        translate([12, 21, 0]) cube([1, 1, depth]);
        translate([18, 21, 0]) cube([1, 1, depth]);
        translate([19, 21, 0]) cube([1, 1, depth]);
        translate([20, 21, 0]) cube([1, 1, depth]);
        translate([21, 21, 0]) cube([1, 1, depth]);
        translate([22, 21, 0]) cube([1, 1, depth]);
        translate([26, 21, 0]) cube([1, 1, depth]);
        translate([27, 21, 0]) cube([1, 1, depth]);
        translate([28, 21, 0]) cube([1, 1, depth]);
        translate([38, 21, 0]) cube([1, 1, depth]);
        translate([40, 21, 0]) cube([1, 1, depth]);
        translate([41, 21, 0]) cube([1, 1, depth]);
        translate([45, 21, 0]) cube([1, 1, depth]);
        translate([5, 22, 0]) cube([1, 1, depth]);
        translate([8, 22, 0]) cube([1, 1, depth]);
        translate([9, 22, 0]) cube([1, 1, depth]);
        translate([10, 22, 0]) cube([1, 1, depth]);
        translate([11, 22, 0]) cube([1, 1, depth]);
        translate([13, 22, 0]) cube([1, 1, depth]);
        translate([14, 22, 0]) cube([1, 1, depth]);
        translate([15, 22, 0]) cube([1, 1, depth]);
        translate([16, 22, 0]) cube([1, 1, depth]);
        translate([17, 22, 0]) cube([1, 1, depth]);
        translate([20, 22, 0]) cube([1, 1, depth]);
        translate([21, 22, 0]) cube([1, 1, depth]);
        translate([23, 22, 0]) cube([1, 1, depth]);
        translate([24, 22, 0]) cube([1, 1, depth]);
        translate([28, 22, 0]) cube([1, 1, depth]);
        translate([30, 22, 0]) cube([1, 1, depth]);
        translate([31, 22, 0]) cube([1, 1, depth]);
        translate([32, 22, 0]) cube([1, 1, depth]);
        translate([33, 22, 0]) cube([1, 1, depth]);
        translate([34, 22, 0]) cube([1, 1, depth]);
        translate([35, 22, 0]) cube([1, 1, depth]);
        translate([36, 22, 0]) cube([1, 1, depth]);
        translate([37, 22, 0]) cube([1, 1, depth]);
        translate([38, 22, 0]) cube([1, 1, depth]);
        translate([39, 22, 0]) cube([1, 1, depth]);
        translate([42, 22, 0]) cube([1, 1, depth]);
        translate([45, 22, 0]) cube([1, 1, depth]);
        translate([46, 22, 0]) cube([1, 1, depth]);
        translate([47, 22, 0]) cube([1, 1, depth]);
        translate([5, 23, 0]) cube([1, 1, depth]);
        translate([6, 23, 0]) cube([1, 1, depth]);
        translate([7, 23, 0]) cube([1, 1, depth]);
        translate([8, 23, 0]) cube([1, 1, depth]);
        translate([12, 23, 0]) cube([1, 1, depth]);
        translate([13, 23, 0]) cube([1, 1, depth]);
        translate([14, 23, 0]) cube([1, 1, depth]);
        translate([15, 23, 0]) cube([1, 1, depth]);
        translate([16, 23, 0]) cube([1, 1, depth]);
        translate([17, 23, 0]) cube([1, 1, depth]);
        translate([18, 23, 0]) cube([1, 1, depth]);
        translate([19, 23, 0]) cube([1, 1, depth]);
        translate([20, 23, 0]) cube([1, 1, depth]);
        translate([21, 23, 0]) cube([1, 1, depth]);
        translate([23, 23, 0]) cube([1, 1, depth]);
        translate([24, 23, 0]) cube([1, 1, depth]);
        translate([25, 23, 0]) cube([1, 1, depth]);
        translate([26, 23, 0]) cube([1, 1, depth]);
        translate([27, 23, 0]) cube([1, 1, depth]);
        translate([28, 23, 0]) cube([1, 1, depth]);
        translate([29, 23, 0]) cube([1, 1, depth]);
        translate([30, 23, 0]) cube([1, 1, depth]);
        translate([31, 23, 0]) cube([1, 1, depth]);
        translate([32, 23, 0]) cube([1, 1, depth]);
        translate([33, 23, 0]) cube([1, 1, depth]);
        translate([34, 23, 0]) cube([1, 1, depth]);
        translate([35, 23, 0]) cube([1, 1, depth]);
        translate([36, 23, 0]) cube([1, 1, depth]);
        translate([37, 23, 0]) cube([1, 1, depth]);
        translate([38, 23, 0]) cube([1, 1, depth]);
        translate([39, 23, 0]) cube([1, 1, depth]);
        translate([40, 23, 0]) cube([1, 1, depth]);
        translate([41, 23, 0]) cube([1, 1, depth]);
        translate([5, 24, 0]) cube([1, 1, depth]);
        translate([6, 24, 0]) cube([1, 1, depth]);
        translate([7, 24, 0]) cube([1, 1, depth]);
        translate([8, 24, 0]) cube([1, 1, depth]);
        translate([12, 24, 0]) cube([1, 1, depth]);
        translate([13, 24, 0]) cube([1, 1, depth]);
        translate([14, 24, 0]) cube([1, 1, depth]);
        translate([15, 24, 0]) cube([1, 1, depth]);
        translate([16, 24, 0]) cube([1, 1, depth]);
        translate([17, 24, 0]) cube([1, 1, depth]);
        translate([18, 24, 0]) cube([1, 1, depth]);
        translate([19, 24, 0]) cube([1, 1, depth]);
        translate([20, 24, 0]) cube([1, 1, depth]);
        translate([21, 24, 0]) cube([1, 1, depth]);
        translate([23, 24, 0]) cube([1, 1, depth]);
        translate([24, 24, 0]) cube([1, 1, depth]);
        translate([25, 24, 0]) cube([1, 1, depth]);
        translate([26, 24, 0]) cube([1, 1, depth]);
        translate([27, 24, 0]) cube([1, 1, depth]);
        translate([28, 24, 0]) cube([1, 1, depth]);
        translate([29, 24, 0]) cube([1, 1, depth]);
        translate([30, 24, 0]) cube([1, 1, depth]);
        translate([31, 24, 0]) cube([1, 1, depth]);
        translate([32, 24, 0]) cube([1, 1, depth]);
        translate([33, 24, 0]) cube([1, 1, depth]);
        translate([34, 24, 0]) cube([1, 1, depth]);
        translate([35, 24, 0]) cube([1, 1, depth]);
        translate([36, 24, 0]) cube([1, 1, depth]);
        translate([37, 24, 0]) cube([1, 1, depth]);
        translate([38, 24, 0]) cube([1, 1, depth]);
        translate([39, 24, 0]) cube([1, 1, depth]);
        translate([40, 24, 0]) cube([1, 1, depth]);
        translate([41, 24, 0]) cube([1, 1, depth]);
        translate([2, 25, 0]) cube([1, 1, depth]);
        translate([5, 25, 0]) cube([1, 1, depth]);
        translate([8, 25, 0]) cube([1, 1, depth]);
        translate([11, 25, 0]) cube([1, 1, depth]);
        translate([15, 25, 0]) cube([1, 1, depth]);
        translate([16, 25, 0]) cube([1, 1, depth]);
        translate([17, 25, 0]) cube([1, 1, depth]);
        translate([18, 25, 0]) cube([1, 1, depth]);
        translate([26, 25, 0]) cube([1, 1, depth]);
        translate([27, 25, 0]) cube([1, 1, depth]);
        translate([32, 25, 0]) cube([1, 1, depth]);
        translate([33, 25, 0]) cube([1, 1, depth]);
        translate([34, 25, 0]) cube([1, 1, depth]);
        translate([36, 25, 0]) cube([1, 1, depth]);
        translate([37, 25, 0]) cube([1, 1, depth]);
        translate([39, 25, 0]) cube([1, 1, depth]);
        translate([42, 25, 0]) cube([1, 1, depth]);
        translate([45, 25, 0]) cube([1, 1, depth]);
        translate([46, 25, 0]) cube([1, 1, depth]);
        translate([47, 25, 0]) cube([1, 1, depth]);
        translate([2, 26, 0]) cube([1, 1, depth]);
        translate([9, 26, 0]) cube([1, 1, depth]);
        translate([10, 26, 0]) cube([1, 1, depth]);
        translate([12, 26, 0]) cube([1, 1, depth]);
        translate([15, 26, 0]) cube([1, 1, depth]);
        translate([16, 26, 0]) cube([1, 1, depth]);
        translate([17, 26, 0]) cube([1, 1, depth]);
        translate([20, 26, 0]) cube([1, 1, depth]);
        translate([21, 26, 0]) cube([1, 1, depth]);
        translate([22, 26, 0]) cube([1, 1, depth]);
        translate([23, 26, 0]) cube([1, 1, depth]);
        translate([24, 26, 0]) cube([1, 1, depth]);
        translate([25, 26, 0]) cube([1, 1, depth]);
        translate([28, 26, 0]) cube([1, 1, depth]);
        translate([35, 26, 0]) cube([1, 1, depth]);
        translate([38, 26, 0]) cube([1, 1, depth]);
        translate([43, 26, 0]) cube([1, 1, depth]);
        translate([44, 26, 0]) cube([1, 1, depth]);
        translate([45, 26, 0]) cube([1, 1, depth]);
        translate([2, 27, 0]) cube([1, 1, depth]);
        translate([9, 27, 0]) cube([1, 1, depth]);
        translate([10, 27, 0]) cube([1, 1, depth]);
        translate([12, 27, 0]) cube([1, 1, depth]);
        translate([15, 27, 0]) cube([1, 1, depth]);
        translate([16, 27, 0]) cube([1, 1, depth]);
        translate([17, 27, 0]) cube([1, 1, depth]);
        translate([20, 27, 0]) cube([1, 1, depth]);
        translate([21, 27, 0]) cube([1, 1, depth]);
        translate([22, 27, 0]) cube([1, 1, depth]);
        translate([23, 27, 0]) cube([1, 1, depth]);
        translate([24, 27, 0]) cube([1, 1, depth]);
        translate([25, 27, 0]) cube([1, 1, depth]);
        translate([28, 27, 0]) cube([1, 1, depth]);
        translate([35, 27, 0]) cube([1, 1, depth]);
        translate([38, 27, 0]) cube([1, 1, depth]);
        translate([43, 27, 0]) cube([1, 1, depth]);
        translate([44, 27, 0]) cube([1, 1, depth]);
        translate([45, 27, 0]) cube([1, 1, depth]);
        translate([3, 28, 0]) cube([1, 1, depth]);
        translate([4, 28, 0]) cube([1, 1, depth]);
        translate([5, 28, 0]) cube([1, 1, depth]);
        translate([8, 28, 0]) cube([1, 1, depth]);
        translate([11, 28, 0]) cube([1, 1, depth]);
        translate([12, 28, 0]) cube([1, 1, depth]);
        translate([15, 28, 0]) cube([1, 1, depth]);
        translate([16, 28, 0]) cube([1, 1, depth]);
        translate([17, 28, 0]) cube([1, 1, depth]);
        translate([18, 28, 0]) cube([1, 1, depth]);
        translate([19, 28, 0]) cube([1, 1, depth]);
        translate([22, 28, 0]) cube([1, 1, depth]);
        translate([23, 28, 0]) cube([1, 1, depth]);
        translate([24, 28, 0]) cube([1, 1, depth]);
        translate([25, 28, 0]) cube([1, 1, depth]);
        translate([26, 28, 0]) cube([1, 1, depth]);
        translate([27, 28, 0]) cube([1, 1, depth]);
        translate([35, 28, 0]) cube([1, 1, depth]);
        translate([36, 28, 0]) cube([1, 1, depth]);
        translate([37, 28, 0]) cube([1, 1, depth]);
        translate([38, 28, 0]) cube([1, 1, depth]);
        translate([39, 28, 0]) cube([1, 1, depth]);
        translate([40, 28, 0]) cube([1, 1, depth]);
        translate([41, 28, 0]) cube([1, 1, depth]);
        translate([43, 28, 0]) cube([1, 1, depth]);
        translate([44, 28, 0]) cube([1, 1, depth]);
        translate([2, 29, 0]) cube([1, 1, depth]);
        translate([3, 29, 0]) cube([1, 1, depth]);
        translate([4, 29, 0]) cube([1, 1, depth]);
        translate([5, 29, 0]) cube([1, 1, depth]);
        translate([6, 29, 0]) cube([1, 1, depth]);
        translate([7, 29, 0]) cube([1, 1, depth]);
        translate([13, 29, 0]) cube([1, 1, depth]);
        translate([14, 29, 0]) cube([1, 1, depth]);
        translate([15, 29, 0]) cube([1, 1, depth]);
        translate([22, 29, 0]) cube([1, 1, depth]);
        translate([25, 29, 0]) cube([1, 1, depth]);
        translate([26, 29, 0]) cube([1, 1, depth]);
        translate([27, 29, 0]) cube([1, 1, depth]);
        translate([28, 29, 0]) cube([1, 1, depth]);
        translate([29, 29, 0]) cube([1, 1, depth]);
        translate([30, 29, 0]) cube([1, 1, depth]);
        translate([31, 29, 0]) cube([1, 1, depth]);
        translate([32, 29, 0]) cube([1, 1, depth]);
        translate([33, 29, 0]) cube([1, 1, depth]);
        translate([34, 29, 0]) cube([1, 1, depth]);
        translate([35, 29, 0]) cube([1, 1, depth]);
        translate([36, 29, 0]) cube([1, 1, depth]);
        translate([37, 29, 0]) cube([1, 1, depth]);
        translate([40, 29, 0]) cube([1, 1, depth]);
        translate([41, 29, 0]) cube([1, 1, depth]);
        translate([2, 30, 0]) cube([1, 1, depth]);
        translate([3, 30, 0]) cube([1, 1, depth]);
        translate([4, 30, 0]) cube([1, 1, depth]);
        translate([5, 30, 0]) cube([1, 1, depth]);
        translate([6, 30, 0]) cube([1, 1, depth]);
        translate([7, 30, 0]) cube([1, 1, depth]);
        translate([11, 30, 0]) cube([1, 1, depth]);
        translate([12, 30, 0]) cube([1, 1, depth]);
        translate([13, 30, 0]) cube([1, 1, depth]);
        translate([14, 30, 0]) cube([1, 1, depth]);
        translate([18, 30, 0]) cube([1, 1, depth]);
        translate([19, 30, 0]) cube([1, 1, depth]);
        translate([28, 30, 0]) cube([1, 1, depth]);
        translate([29, 30, 0]) cube([1, 1, depth]);
        translate([30, 30, 0]) cube([1, 1, depth]);
        translate([31, 30, 0]) cube([1, 1, depth]);
        translate([33, 30, 0]) cube([1, 1, depth]);
        translate([34, 30, 0]) cube([1, 1, depth]);
        translate([39, 30, 0]) cube([1, 1, depth]);
        translate([42, 30, 0]) cube([1, 1, depth]);
        translate([43, 30, 0]) cube([1, 1, depth]);
        translate([44, 30, 0]) cube([1, 1, depth]);
        translate([46, 30, 0]) cube([1, 1, depth]);
        translate([47, 30, 0]) cube([1, 1, depth]);
        translate([48, 30, 0]) cube([1, 1, depth]);
        translate([2, 31, 0]) cube([1, 1, depth]);
        translate([3, 31, 0]) cube([1, 1, depth]);
        translate([4, 31, 0]) cube([1, 1, depth]);
        translate([5, 31, 0]) cube([1, 1, depth]);
        translate([6, 31, 0]) cube([1, 1, depth]);
        translate([7, 31, 0]) cube([1, 1, depth]);
        translate([11, 31, 0]) cube([1, 1, depth]);
        translate([12, 31, 0]) cube([1, 1, depth]);
        translate([13, 31, 0]) cube([1, 1, depth]);
        translate([14, 31, 0]) cube([1, 1, depth]);
        translate([18, 31, 0]) cube([1, 1, depth]);
        translate([19, 31, 0]) cube([1, 1, depth]);
        translate([28, 31, 0]) cube([1, 1, depth]);
        translate([29, 31, 0]) cube([1, 1, depth]);
        translate([30, 31, 0]) cube([1, 1, depth]);
        translate([31, 31, 0]) cube([1, 1, depth]);
        translate([33, 31, 0]) cube([1, 1, depth]);
        translate([34, 31, 0]) cube([1, 1, depth]);
        translate([39, 31, 0]) cube([1, 1, depth]);
        translate([42, 31, 0]) cube([1, 1, depth]);
        translate([43, 31, 0]) cube([1, 1, depth]);
        translate([44, 31, 0]) cube([1, 1, depth]);
        translate([46, 31, 0]) cube([1, 1, depth]);
        translate([47, 31, 0]) cube([1, 1, depth]);
        translate([48, 31, 0]) cube([1, 1, depth]);
        translate([2, 32, 0]) cube([1, 1, depth]);
        translate([5, 32, 0]) cube([1, 1, depth]);
        translate([6, 32, 0]) cube([1, 1, depth]);
        translate([7, 32, 0]) cube([1, 1, depth]);
        translate([8, 32, 0]) cube([1, 1, depth]);
        translate([15, 32, 0]) cube([1, 1, depth]);
        translate([18, 32, 0]) cube([1, 1, depth]);
        translate([25, 32, 0]) cube([1, 1, depth]);
        translate([26, 32, 0]) cube([1, 1, depth]);
        translate([27, 32, 0]) cube([1, 1, depth]);
        translate([29, 32, 0]) cube([1, 1, depth]);
        translate([32, 32, 0]) cube([1, 1, depth]);
        translate([38, 32, 0]) cube([1, 1, depth]);
        translate([40, 32, 0]) cube([1, 1, depth]);
        translate([41, 32, 0]) cube([1, 1, depth]);
        translate([45, 32, 0]) cube([1, 1, depth]);
        translate([46, 32, 0]) cube([1, 1, depth]);
        translate([47, 32, 0]) cube([1, 1, depth]);
        translate([5, 33, 0]) cube([1, 1, depth]);
        translate([8, 33, 0]) cube([1, 1, depth]);
        translate([9, 33, 0]) cube([1, 1, depth]);
        translate([10, 33, 0]) cube([1, 1, depth]);
        translate([11, 33, 0]) cube([1, 1, depth]);
        translate([15, 33, 0]) cube([1, 1, depth]);
        translate([16, 33, 0]) cube([1, 1, depth]);
        translate([17, 33, 0]) cube([1, 1, depth]);
        translate([19, 33, 0]) cube([1, 1, depth]);
        translate([22, 33, 0]) cube([1, 1, depth]);
        translate([25, 33, 0]) cube([1, 1, depth]);
        translate([26, 33, 0]) cube([1, 1, depth]);
        translate([27, 33, 0]) cube([1, 1, depth]);
        translate([28, 33, 0]) cube([1, 1, depth]);
        translate([35, 33, 0]) cube([1, 1, depth]);
        translate([36, 33, 0]) cube([1, 1, depth]);
        translate([37, 33, 0]) cube([1, 1, depth]);
        translate([38, 33, 0]) cube([1, 1, depth]);
        translate([39, 33, 0]) cube([1, 1, depth]);
        translate([40, 33, 0]) cube([1, 1, depth]);
        translate([41, 33, 0]) cube([1, 1, depth]);
        translate([46, 33, 0]) cube([1, 1, depth]);
        translate([47, 33, 0]) cube([1, 1, depth]);
        translate([5, 34, 0]) cube([1, 1, depth]);
        translate([8, 34, 0]) cube([1, 1, depth]);
        translate([9, 34, 0]) cube([1, 1, depth]);
        translate([10, 34, 0]) cube([1, 1, depth]);
        translate([11, 34, 0]) cube([1, 1, depth]);
        translate([15, 34, 0]) cube([1, 1, depth]);
        translate([16, 34, 0]) cube([1, 1, depth]);
        translate([17, 34, 0]) cube([1, 1, depth]);
        translate([19, 34, 0]) cube([1, 1, depth]);
        translate([22, 34, 0]) cube([1, 1, depth]);
        translate([25, 34, 0]) cube([1, 1, depth]);
        translate([26, 34, 0]) cube([1, 1, depth]);
        translate([27, 34, 0]) cube([1, 1, depth]);
        translate([28, 34, 0]) cube([1, 1, depth]);
        translate([35, 34, 0]) cube([1, 1, depth]);
        translate([36, 34, 0]) cube([1, 1, depth]);
        translate([37, 34, 0]) cube([1, 1, depth]);
        translate([38, 34, 0]) cube([1, 1, depth]);
        translate([39, 34, 0]) cube([1, 1, depth]);
        translate([40, 34, 0]) cube([1, 1, depth]);
        translate([41, 34, 0]) cube([1, 1, depth]);
        translate([46, 34, 0]) cube([1, 1, depth]);
        translate([47, 34, 0]) cube([1, 1, depth]);
        translate([6, 35, 0]) cube([1, 1, depth]);
        translate([7, 35, 0]) cube([1, 1, depth]);
        translate([8, 35, 0]) cube([1, 1, depth]);
        translate([9, 35, 0]) cube([1, 1, depth]);
        translate([10, 35, 0]) cube([1, 1, depth]);
        translate([13, 35, 0]) cube([1, 1, depth]);
        translate([14, 35, 0]) cube([1, 1, depth]);
        translate([19, 35, 0]) cube([1, 1, depth]);
        translate([26, 35, 0]) cube([1, 1, depth]);
        translate([27, 35, 0]) cube([1, 1, depth]);
        translate([28, 35, 0]) cube([1, 1, depth]);
        translate([29, 35, 0]) cube([1, 1, depth]);
        translate([32, 35, 0]) cube([1, 1, depth]);
        translate([35, 35, 0]) cube([1, 1, depth]);
        translate([38, 35, 0]) cube([1, 1, depth]);
        translate([39, 35, 0]) cube([1, 1, depth]);
        translate([42, 35, 0]) cube([1, 1, depth]);
        translate([46, 35, 0]) cube([1, 1, depth]);
        translate([47, 35, 0]) cube([1, 1, depth]);
        translate([2, 36, 0]) cube([1, 1, depth]);
        translate([3, 36, 0]) cube([1, 1, depth]);
        translate([4, 36, 0]) cube([1, 1, depth]);
        translate([5, 36, 0]) cube([1, 1, depth]);
        translate([6, 36, 0]) cube([1, 1, depth]);
        translate([7, 36, 0]) cube([1, 1, depth]);
        translate([11, 36, 0]) cube([1, 1, depth]);
        translate([12, 36, 0]) cube([1, 1, depth]);
        translate([16, 36, 0]) cube([1, 1, depth]);
        translate([17, 36, 0]) cube([1, 1, depth]);
        translate([18, 36, 0]) cube([1, 1, depth]);
        translate([19, 36, 0]) cube([1, 1, depth]);
        translate([20, 36, 0]) cube([1, 1, depth]);
        translate([21, 36, 0]) cube([1, 1, depth]);
        translate([23, 36, 0]) cube([1, 1, depth]);
        translate([24, 36, 0]) cube([1, 1, depth]);
        translate([25, 36, 0]) cube([1, 1, depth]);
        translate([26, 36, 0]) cube([1, 1, depth]);
        translate([27, 36, 0]) cube([1, 1, depth]);
        translate([28, 36, 0]) cube([1, 1, depth]);
        translate([30, 36, 0]) cube([1, 1, depth]);
        translate([31, 36, 0]) cube([1, 1, depth]);
        translate([32, 36, 0]) cube([1, 1, depth]);
        translate([33, 36, 0]) cube([1, 1, depth]);
        translate([34, 36, 0]) cube([1, 1, depth]);
        translate([35, 36, 0]) cube([1, 1, depth]);
        translate([36, 36, 0]) cube([1, 1, depth]);
        translate([37, 36, 0]) cube([1, 1, depth]);
        translate([38, 36, 0]) cube([1, 1, depth]);
        translate([39, 36, 0]) cube([1, 1, depth]);
        translate([40, 36, 0]) cube([1, 1, depth]);
        translate([41, 36, 0]) cube([1, 1, depth]);
        translate([42, 36, 0]) cube([1, 1, depth]);
        translate([43, 36, 0]) cube([1, 1, depth]);
        translate([44, 36, 0]) cube([1, 1, depth]);
        translate([45, 36, 0]) cube([1, 1, depth]);
        translate([48, 36, 0]) cube([1, 1, depth]);
        translate([2, 37, 0]) cube([1, 1, depth]);
        translate([3, 37, 0]) cube([1, 1, depth]);
        translate([4, 37, 0]) cube([1, 1, depth]);
        translate([5, 37, 0]) cube([1, 1, depth]);
        translate([6, 37, 0]) cube([1, 1, depth]);
        translate([7, 37, 0]) cube([1, 1, depth]);
        translate([11, 37, 0]) cube([1, 1, depth]);
        translate([12, 37, 0]) cube([1, 1, depth]);
        translate([16, 37, 0]) cube([1, 1, depth]);
        translate([17, 37, 0]) cube([1, 1, depth]);
        translate([18, 37, 0]) cube([1, 1, depth]);
        translate([19, 37, 0]) cube([1, 1, depth]);
        translate([20, 37, 0]) cube([1, 1, depth]);
        translate([21, 37, 0]) cube([1, 1, depth]);
        translate([23, 37, 0]) cube([1, 1, depth]);
        translate([24, 37, 0]) cube([1, 1, depth]);
        translate([25, 37, 0]) cube([1, 1, depth]);
        translate([26, 37, 0]) cube([1, 1, depth]);
        translate([27, 37, 0]) cube([1, 1, depth]);
        translate([28, 37, 0]) cube([1, 1, depth]);
        translate([30, 37, 0]) cube([1, 1, depth]);
        translate([31, 37, 0]) cube([1, 1, depth]);
        translate([32, 37, 0]) cube([1, 1, depth]);
        translate([33, 37, 0]) cube([1, 1, depth]);
        translate([34, 37, 0]) cube([1, 1, depth]);
        translate([35, 37, 0]) cube([1, 1, depth]);
        translate([36, 37, 0]) cube([1, 1, depth]);
        translate([37, 37, 0]) cube([1, 1, depth]);
        translate([38, 37, 0]) cube([1, 1, depth]);
        translate([39, 37, 0]) cube([1, 1, depth]);
        translate([40, 37, 0]) cube([1, 1, depth]);
        translate([41, 37, 0]) cube([1, 1, depth]);
        translate([42, 37, 0]) cube([1, 1, depth]);
        translate([43, 37, 0]) cube([1, 1, depth]);
        translate([44, 37, 0]) cube([1, 1, depth]);
        translate([45, 37, 0]) cube([1, 1, depth]);
        translate([48, 37, 0]) cube([1, 1, depth]);
        translate([13, 38, 0]) cube([1, 1, depth]);
        translate([14, 38, 0]) cube([1, 1, depth]);
        translate([23, 38, 0]) cube([1, 1, depth]);
        translate([24, 38, 0]) cube([1, 1, depth]);
        translate([25, 38, 0]) cube([1, 1, depth]);
        translate([26, 38, 0]) cube([1, 1, depth]);
        translate([27, 38, 0]) cube([1, 1, depth]);
        translate([28, 38, 0]) cube([1, 1, depth]);
        translate([32, 38, 0]) cube([1, 1, depth]);
        translate([33, 38, 0]) cube([1, 1, depth]);
        translate([34, 38, 0]) cube([1, 1, depth]);
        translate([36, 38, 0]) cube([1, 1, depth]);
        translate([37, 38, 0]) cube([1, 1, depth]);
        translate([42, 38, 0]) cube([1, 1, depth]);
        translate([45, 38, 0]) cube([1, 1, depth]);
        translate([2, 39, 0]) cube([1, 1, depth]);
        translate([3, 39, 0]) cube([1, 1, depth]);
        translate([4, 39, 0]) cube([1, 1, depth]);
        translate([5, 39, 0]) cube([1, 1, depth]);
        translate([6, 39, 0]) cube([1, 1, depth]);
        translate([7, 39, 0]) cube([1, 1, depth]);
        translate([8, 39, 0]) cube([1, 1, depth]);
        translate([9, 39, 0]) cube([1, 1, depth]);
        translate([10, 39, 0]) cube([1, 1, depth]);
        translate([11, 39, 0]) cube([1, 1, depth]);
        translate([13, 39, 0]) cube([1, 1, depth]);
        translate([14, 39, 0]) cube([1, 1, depth]);
        translate([15, 39, 0]) cube([1, 1, depth]);
        translate([19, 39, 0]) cube([1, 1, depth]);
        translate([20, 39, 0]) cube([1, 1, depth]);
        translate([21, 39, 0]) cube([1, 1, depth]);
        translate([22, 39, 0]) cube([1, 1, depth]);
        translate([23, 39, 0]) cube([1, 1, depth]);
        translate([24, 39, 0]) cube([1, 1, depth]);
        translate([25, 39, 0]) cube([1, 1, depth]);
        translate([28, 39, 0]) cube([1, 1, depth]);
        translate([30, 39, 0]) cube([1, 1, depth]);
        translate([31, 39, 0]) cube([1, 1, depth]);
        translate([36, 39, 0]) cube([1, 1, depth]);
        translate([37, 39, 0]) cube([1, 1, depth]);
        translate([39, 39, 0]) cube([1, 1, depth]);
        translate([42, 39, 0]) cube([1, 1, depth]);
        translate([43, 39, 0]) cube([1, 1, depth]);
        translate([44, 39, 0]) cube([1, 1, depth]);
        translate([2, 40, 0]) cube([1, 1, depth]);
        translate([11, 40, 0]) cube([1, 1, depth]);
        translate([15, 40, 0]) cube([1, 1, depth]);
        translate([18, 40, 0]) cube([1, 1, depth]);
        translate([20, 40, 0]) cube([1, 1, depth]);
        translate([21, 40, 0]) cube([1, 1, depth]);
        translate([22, 40, 0]) cube([1, 1, depth]);
        translate([23, 40, 0]) cube([1, 1, depth]);
        translate([24, 40, 0]) cube([1, 1, depth]);
        translate([32, 40, 0]) cube([1, 1, depth]);
        translate([36, 40, 0]) cube([1, 1, depth]);
        translate([37, 40, 0]) cube([1, 1, depth]);
        translate([42, 40, 0]) cube([1, 1, depth]);
        translate([46, 40, 0]) cube([1, 1, depth]);
        translate([47, 40, 0]) cube([1, 1, depth]);
        translate([48, 40, 0]) cube([1, 1, depth]);
        translate([2, 41, 0]) cube([1, 1, depth]);
        translate([11, 41, 0]) cube([1, 1, depth]);
        translate([15, 41, 0]) cube([1, 1, depth]);
        translate([18, 41, 0]) cube([1, 1, depth]);
        translate([20, 41, 0]) cube([1, 1, depth]);
        translate([21, 41, 0]) cube([1, 1, depth]);
        translate([22, 41, 0]) cube([1, 1, depth]);
        translate([23, 41, 0]) cube([1, 1, depth]);
        translate([24, 41, 0]) cube([1, 1, depth]);
        translate([32, 41, 0]) cube([1, 1, depth]);
        translate([36, 41, 0]) cube([1, 1, depth]);
        translate([37, 41, 0]) cube([1, 1, depth]);
        translate([42, 41, 0]) cube([1, 1, depth]);
        translate([46, 41, 0]) cube([1, 1, depth]);
        translate([47, 41, 0]) cube([1, 1, depth]);
        translate([48, 41, 0]) cube([1, 1, depth]);
        translate([2, 42, 0]) cube([1, 1, depth]);
        translate([5, 42, 0]) cube([1, 1, depth]);
        translate([6, 42, 0]) cube([1, 1, depth]);
        translate([7, 42, 0]) cube([1, 1, depth]);
        translate([8, 42, 0]) cube([1, 1, depth]);
        translate([11, 42, 0]) cube([1, 1, depth]);
        translate([13, 42, 0]) cube([1, 1, depth]);
        translate([14, 42, 0]) cube([1, 1, depth]);
        translate([15, 42, 0]) cube([1, 1, depth]);
        translate([18, 42, 0]) cube([1, 1, depth]);
        translate([19, 42, 0]) cube([1, 1, depth]);
        translate([20, 42, 0]) cube([1, 1, depth]);
        translate([21, 42, 0]) cube([1, 1, depth]);
        translate([22, 42, 0]) cube([1, 1, depth]);
        translate([25, 42, 0]) cube([1, 1, depth]);
        translate([33, 42, 0]) cube([1, 1, depth]);
        translate([34, 42, 0]) cube([1, 1, depth]);
        translate([36, 42, 0]) cube([1, 1, depth]);
        translate([37, 42, 0]) cube([1, 1, depth]);
        translate([38, 42, 0]) cube([1, 1, depth]);
        translate([39, 42, 0]) cube([1, 1, depth]);
        translate([40, 42, 0]) cube([1, 1, depth]);
        translate([41, 42, 0]) cube([1, 1, depth]);
        translate([42, 42, 0]) cube([1, 1, depth]);
        translate([43, 42, 0]) cube([1, 1, depth]);
        translate([44, 42, 0]) cube([1, 1, depth]);
        translate([2, 43, 0]) cube([1, 1, depth]);
        translate([5, 43, 0]) cube([1, 1, depth]);
        translate([6, 43, 0]) cube([1, 1, depth]);
        translate([7, 43, 0]) cube([1, 1, depth]);
        translate([8, 43, 0]) cube([1, 1, depth]);
        translate([11, 43, 0]) cube([1, 1, depth]);
        translate([16, 43, 0]) cube([1, 1, depth]);
        translate([17, 43, 0]) cube([1, 1, depth]);
        translate([18, 43, 0]) cube([1, 1, depth]);
        translate([19, 43, 0]) cube([1, 1, depth]);
        translate([20, 43, 0]) cube([1, 1, depth]);
        translate([21, 43, 0]) cube([1, 1, depth]);
        translate([26, 43, 0]) cube([1, 1, depth]);
        translate([27, 43, 0]) cube([1, 1, depth]);
        translate([28, 43, 0]) cube([1, 1, depth]);
        translate([36, 43, 0]) cube([1, 1, depth]);
        translate([37, 43, 0]) cube([1, 1, depth]);
        translate([39, 43, 0]) cube([1, 1, depth]);
        translate([40, 43, 0]) cube([1, 1, depth]);
        translate([41, 43, 0]) cube([1, 1, depth]);
        translate([42, 43, 0]) cube([1, 1, depth]);
        translate([43, 43, 0]) cube([1, 1, depth]);
        translate([44, 43, 0]) cube([1, 1, depth]);
        translate([45, 43, 0]) cube([1, 1, depth]);
        translate([2, 44, 0]) cube([1, 1, depth]);
        translate([5, 44, 0]) cube([1, 1, depth]);
        translate([6, 44, 0]) cube([1, 1, depth]);
        translate([7, 44, 0]) cube([1, 1, depth]);
        translate([8, 44, 0]) cube([1, 1, depth]);
        translate([11, 44, 0]) cube([1, 1, depth]);
        translate([16, 44, 0]) cube([1, 1, depth]);
        translate([17, 44, 0]) cube([1, 1, depth]);
        translate([18, 44, 0]) cube([1, 1, depth]);
        translate([19, 44, 0]) cube([1, 1, depth]);
        translate([20, 44, 0]) cube([1, 1, depth]);
        translate([21, 44, 0]) cube([1, 1, depth]);
        translate([26, 44, 0]) cube([1, 1, depth]);
        translate([27, 44, 0]) cube([1, 1, depth]);
        translate([28, 44, 0]) cube([1, 1, depth]);
        translate([36, 44, 0]) cube([1, 1, depth]);
        translate([37, 44, 0]) cube([1, 1, depth]);
        translate([39, 44, 0]) cube([1, 1, depth]);
        translate([40, 44, 0]) cube([1, 1, depth]);
        translate([41, 44, 0]) cube([1, 1, depth]);
        translate([42, 44, 0]) cube([1, 1, depth]);
        translate([43, 44, 0]) cube([1, 1, depth]);
        translate([44, 44, 0]) cube([1, 1, depth]);
        translate([45, 44, 0]) cube([1, 1, depth]);
        translate([2, 45, 0]) cube([1, 1, depth]);
        translate([5, 45, 0]) cube([1, 1, depth]);
        translate([6, 45, 0]) cube([1, 1, depth]);
        translate([7, 45, 0]) cube([1, 1, depth]);
        translate([8, 45, 0]) cube([1, 1, depth]);
        translate([11, 45, 0]) cube([1, 1, depth]);
        translate([16, 45, 0]) cube([1, 1, depth]);
        translate([17, 45, 0]) cube([1, 1, depth]);
        translate([20, 45, 0]) cube([1, 1, depth]);
        translate([21, 45, 0]) cube([1, 1, depth]);
        translate([23, 45, 0]) cube([1, 1, depth]);
        translate([24, 45, 0]) cube([1, 1, depth]);
        translate([28, 45, 0]) cube([1, 1, depth]);
        translate([32, 45, 0]) cube([1, 1, depth]);
        translate([35, 45, 0]) cube([1, 1, depth]);
        translate([38, 45, 0]) cube([1, 1, depth]);
        translate([39, 45, 0]) cube([1, 1, depth]);
        translate([40, 45, 0]) cube([1, 1, depth]);
        translate([41, 45, 0]) cube([1, 1, depth]);
        translate([42, 45, 0]) cube([1, 1, depth]);
        translate([45, 45, 0]) cube([1, 1, depth]);
        translate([2, 46, 0]) cube([1, 1, depth]);
        translate([11, 46, 0]) cube([1, 1, depth]);
        translate([16, 46, 0]) cube([1, 1, depth]);
        translate([17, 46, 0]) cube([1, 1, depth]);
        translate([19, 46, 0]) cube([1, 1, depth]);
        translate([20, 46, 0]) cube([1, 1, depth]);
        translate([21, 46, 0]) cube([1, 1, depth]);
        translate([22, 46, 0]) cube([1, 1, depth]);
        translate([23, 46, 0]) cube([1, 1, depth]);
        translate([24, 46, 0]) cube([1, 1, depth]);
        translate([25, 46, 0]) cube([1, 1, depth]);
        translate([26, 46, 0]) cube([1, 1, depth]);
        translate([27, 46, 0]) cube([1, 1, depth]);
        translate([28, 46, 0]) cube([1, 1, depth]);
        translate([29, 46, 0]) cube([1, 1, depth]);
        translate([32, 46, 0]) cube([1, 1, depth]);
        translate([33, 46, 0]) cube([1, 1, depth]);
        translate([34, 46, 0]) cube([1, 1, depth]);
        translate([35, 46, 0]) cube([1, 1, depth]);
        translate([38, 46, 0]) cube([1, 1, depth]);
        translate([39, 46, 0]) cube([1, 1, depth]);
        translate([2, 47, 0]) cube([1, 1, depth]);
        translate([11, 47, 0]) cube([1, 1, depth]);
        translate([16, 47, 0]) cube([1, 1, depth]);
        translate([17, 47, 0]) cube([1, 1, depth]);
        translate([19, 47, 0]) cube([1, 1, depth]);
        translate([20, 47, 0]) cube([1, 1, depth]);
        translate([21, 47, 0]) cube([1, 1, depth]);
        translate([22, 47, 0]) cube([1, 1, depth]);
        translate([23, 47, 0]) cube([1, 1, depth]);
        translate([24, 47, 0]) cube([1, 1, depth]);
        translate([25, 47, 0]) cube([1, 1, depth]);
        translate([26, 47, 0]) cube([1, 1, depth]);
        translate([27, 47, 0]) cube([1, 1, depth]);
        translate([28, 47, 0]) cube([1, 1, depth]);
        translate([29, 47, 0]) cube([1, 1, depth]);
        translate([32, 47, 0]) cube([1, 1, depth]);
        translate([33, 47, 0]) cube([1, 1, depth]);
        translate([34, 47, 0]) cube([1, 1, depth]);
        translate([35, 47, 0]) cube([1, 1, depth]);
        translate([38, 47, 0]) cube([1, 1, depth]);
        translate([39, 47, 0]) cube([1, 1, depth]);
        translate([2, 48, 0]) cube([1, 1, depth]);
        translate([3, 48, 0]) cube([1, 1, depth]);
        translate([4, 48, 0]) cube([1, 1, depth]);
        translate([5, 48, 0]) cube([1, 1, depth]);
        translate([6, 48, 0]) cube([1, 1, depth]);
        translate([7, 48, 0]) cube([1, 1, depth]);
        translate([8, 48, 0]) cube([1, 1, depth]);
        translate([9, 48, 0]) cube([1, 1, depth]);
        translate([10, 48, 0]) cube([1, 1, depth]);
        translate([11, 48, 0]) cube([1, 1, depth]);
        translate([13, 48, 0]) cube([1, 1, depth]);
        translate([14, 48, 0]) cube([1, 1, depth]);
        translate([16, 48, 0]) cube([1, 1, depth]);
        translate([17, 48, 0]) cube([1, 1, depth]);
        translate([18, 48, 0]) cube([1, 1, depth]);
        translate([19, 48, 0]) cube([1, 1, depth]);
        translate([20, 48, 0]) cube([1, 1, depth]);
        translate([21, 48, 0]) cube([1, 1, depth]);
        translate([25, 48, 0]) cube([1, 1, depth]);
        translate([26, 48, 0]) cube([1, 1, depth]);
        translate([27, 48, 0]) cube([1, 1, depth]);
        translate([29, 48, 0]) cube([1, 1, depth]);
        translate([30, 48, 0]) cube([1, 1, depth]);
        translate([31, 48, 0]) cube([1, 1, depth]);
        translate([32, 48, 0]) cube([1, 1, depth]);
        translate([33, 48, 0]) cube([1, 1, depth]);
        translate([34, 48, 0]) cube([1, 1, depth]);
        translate([35, 48, 0]) cube([1, 1, depth]);
        translate([36, 48, 0]) cube([1, 1, depth]);
        translate([37, 48, 0]) cube([1, 1, depth]);
        translate([38, 48, 0]) cube([1, 1, depth]);
        translate([39, 48, 0]) cube([1, 1, depth]);
        translate([43, 48, 0]) cube([1, 1, depth]);
        translate([44, 48, 0]) cube([1, 1, depth]);
        translate([48, 48, 0]) cube([1, 1, depth]);
    }
}


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

module card_base() {
    rounded_rect(card_length, card_width, card_height, corner_radius);
}

// QR Code engraving on BOTTOM (front)
module qr_code_engraving() {
    translate([card_length/2 - qr_code_size/2, card_width/2 - qr_code_size/2, -0.05]) {
        qr_code_pattern(qr_code_size, qr_code_depth + 0.1);
    }
}

// Text engraving on TOP (back) - vertieft statt erhaben
module engraved_year() {
    // Year position - moved higher when title is split to make room
    y_pos = song_title_is_split ? card_width * 0.75 : card_width * 0.65;  // Weiter nach oben verschoben von 0.70 auf 0.75
    translate([card_length/2, y_pos, card_height - text_height + 0.05]) {
        linear_extrude(height = text_height + 0.1) {
            text(song_year,
                 size = year_font_size,
                 font = font_name,
                 halign = "center",
                 valign = "center");
        }
    }
}

module engraved_title() {
    if (song_title_is_split) {
        // Two-line layout with smaller font and optimal spacing
        // Line 1 (upper)
        translate([card_length/2, card_width * 0.50, card_height - text_height + 0.05]) {  // Verschoben von 0.46 auf 0.50
            linear_extrude(height = text_height + 0.1) {
                text(song_title_line1,
                     size = title_font_size_split,
                     font = font_name,
                     halign = "center",
                     valign = "center");
            }
        }
        // Line 2 (lower)
        translate([card_length/2, card_width * 0.34, card_height - text_height + 0.05]) {  // Verschoben von 0.36 auf 0.34 (größerer Abstand zwischen Zeilen)
            linear_extrude(height = text_height + 0.1) {
                text(song_title_line2,
                     size = title_font_size_split,
                     font = font_name,
                     halign = "center",
                     valign = "center");
            }
        }
    } else {
        // Single line layout with normal font
        translate([card_length/2, card_width * 0.40, card_height - text_height + 0.05]) {
            linear_extrude(height = text_height + 0.1) {
                text(song_title_line1,
                     size = title_font_size_single,
                     font = font_name,
                     halign = "center",
                     valign = "center");
            }
        }
    }
}

module engraved_artist() {
    // Artist position - moved lower when title is split to make room
    y_pos = song_title_is_split ? card_width * 0.18 : card_width * 0.25;  // Weiter nach unten verschoben von 0.22 auf 0.18
    translate([card_length/2, y_pos, card_height - text_height + 0.05]) {
        linear_extrude(height = text_height + 0.1) {
            text(song_artist,
                 size = artist_font_size,
                 font = font_name,
                 halign = "center",
                 valign = "center");
        }
    }
}

module watermark() {
    translate([card_length - 22, 3, card_height - watermark_height + 0.05]) {  // Verschoben von -15 nach -22 (weiter nach links)
        linear_extrude(height = watermark_height + 0.1) {
            text("mxster",
                 size = 4,  // Vergrößert von 3
                 font = "Liberation Sans:style=Bold",
                 halign = "left",
                 valign = "bottom");
        }
    }
}

// ========================================
// MAIN ASSEMBLY - BEIDSEITIG GRAVIERT
// ========================================

difference() {
    // Basis-Karte
    card_base();

    // QR-Code auf Unterseite (Vorderseite)
    qr_code_engraving();

    // Text auf Oberseite (Rückseite) - alle graviert
    engraved_year();
    engraved_title();
    engraved_artist();
    watermark();
}
