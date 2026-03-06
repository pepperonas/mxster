// mxster Game Card - Bohemian Rhapsody
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
song_year = "1975";
song_title_line1 = "Bohemian";
song_title_line2 = "Rhapsody";
song_title_is_split = true;
song_artist = "Queen";

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
        translate([25, 2, 0]) cube([1, 1, depth]);
        translate([28, 2, 0]) cube([1, 1, depth]);
        translate([29, 2, 0]) cube([1, 1, depth]);
        translate([30, 2, 0]) cube([1, 1, depth]);
        translate([31, 2, 0]) cube([1, 1, depth]);
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
        translate([13, 3, 0]) cube([1, 1, depth]);
        translate([14, 3, 0]) cube([1, 1, depth]);
        translate([16, 3, 0]) cube([1, 1, depth]);
        translate([17, 3, 0]) cube([1, 1, depth]);
        translate([19, 3, 0]) cube([1, 1, depth]);
        translate([22, 3, 0]) cube([1, 1, depth]);
        translate([25, 3, 0]) cube([1, 1, depth]);
        translate([28, 3, 0]) cube([1, 1, depth]);
        translate([30, 3, 0]) cube([1, 1, depth]);
        translate([31, 3, 0]) cube([1, 1, depth]);
        translate([35, 3, 0]) cube([1, 1, depth]);
        translate([39, 3, 0]) cube([1, 1, depth]);
        translate([48, 3, 0]) cube([1, 1, depth]);
        translate([2, 4, 0]) cube([1, 1, depth]);
        translate([11, 4, 0]) cube([1, 1, depth]);
        translate([13, 4, 0]) cube([1, 1, depth]);
        translate([14, 4, 0]) cube([1, 1, depth]);
        translate([16, 4, 0]) cube([1, 1, depth]);
        translate([17, 4, 0]) cube([1, 1, depth]);
        translate([19, 4, 0]) cube([1, 1, depth]);
        translate([22, 4, 0]) cube([1, 1, depth]);
        translate([25, 4, 0]) cube([1, 1, depth]);
        translate([28, 4, 0]) cube([1, 1, depth]);
        translate([30, 4, 0]) cube([1, 1, depth]);
        translate([31, 4, 0]) cube([1, 1, depth]);
        translate([35, 4, 0]) cube([1, 1, depth]);
        translate([39, 4, 0]) cube([1, 1, depth]);
        translate([48, 4, 0]) cube([1, 1, depth]);
        translate([2, 5, 0]) cube([1, 1, depth]);
        translate([5, 5, 0]) cube([1, 1, depth]);
        translate([6, 5, 0]) cube([1, 1, depth]);
        translate([7, 5, 0]) cube([1, 1, depth]);
        translate([8, 5, 0]) cube([1, 1, depth]);
        translate([11, 5, 0]) cube([1, 1, depth]);
        translate([15, 5, 0]) cube([1, 1, depth]);
        translate([18, 5, 0]) cube([1, 1, depth]);
        translate([20, 5, 0]) cube([1, 1, depth]);
        translate([21, 5, 0]) cube([1, 1, depth]);
        translate([22, 5, 0]) cube([1, 1, depth]);
        translate([23, 5, 0]) cube([1, 1, depth]);
        translate([24, 5, 0]) cube([1, 1, depth]);
        translate([25, 5, 0]) cube([1, 1, depth]);
        translate([30, 5, 0]) cube([1, 1, depth]);
        translate([31, 5, 0]) cube([1, 1, depth]);
        translate([33, 5, 0]) cube([1, 1, depth]);
        translate([34, 5, 0]) cube([1, 1, depth]);
        translate([35, 5, 0]) cube([1, 1, depth]);
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
        translate([16, 6, 0]) cube([1, 1, depth]);
        translate([17, 6, 0]) cube([1, 1, depth]);
        translate([18, 6, 0]) cube([1, 1, depth]);
        translate([23, 6, 0]) cube([1, 1, depth]);
        translate([24, 6, 0]) cube([1, 1, depth]);
        translate([28, 6, 0]) cube([1, 1, depth]);
        translate([29, 6, 0]) cube([1, 1, depth]);
        translate([30, 6, 0]) cube([1, 1, depth]);
        translate([31, 6, 0]) cube([1, 1, depth]);
        translate([35, 6, 0]) cube([1, 1, depth]);
        translate([36, 6, 0]) cube([1, 1, depth]);
        translate([37, 6, 0]) cube([1, 1, depth]);
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
        translate([16, 7, 0]) cube([1, 1, depth]);
        translate([17, 7, 0]) cube([1, 1, depth]);
        translate([18, 7, 0]) cube([1, 1, depth]);
        translate([23, 7, 0]) cube([1, 1, depth]);
        translate([24, 7, 0]) cube([1, 1, depth]);
        translate([28, 7, 0]) cube([1, 1, depth]);
        translate([29, 7, 0]) cube([1, 1, depth]);
        translate([30, 7, 0]) cube([1, 1, depth]);
        translate([31, 7, 0]) cube([1, 1, depth]);
        translate([35, 7, 0]) cube([1, 1, depth]);
        translate([36, 7, 0]) cube([1, 1, depth]);
        translate([37, 7, 0]) cube([1, 1, depth]);
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
        translate([15, 8, 0]) cube([1, 1, depth]);
        translate([16, 8, 0]) cube([1, 1, depth]);
        translate([17, 8, 0]) cube([1, 1, depth]);
        translate([19, 8, 0]) cube([1, 1, depth]);
        translate([20, 8, 0]) cube([1, 1, depth]);
        translate([21, 8, 0]) cube([1, 1, depth]);
        translate([25, 8, 0]) cube([1, 1, depth]);
        translate([26, 8, 0]) cube([1, 1, depth]);
        translate([27, 8, 0]) cube([1, 1, depth]);
        translate([29, 8, 0]) cube([1, 1, depth]);
        translate([33, 8, 0]) cube([1, 1, depth]);
        translate([34, 8, 0]) cube([1, 1, depth]);
        translate([35, 8, 0]) cube([1, 1, depth]);
        translate([36, 8, 0]) cube([1, 1, depth]);
        translate([37, 8, 0]) cube([1, 1, depth]);
        translate([39, 8, 0]) cube([1, 1, depth]);
        translate([42, 8, 0]) cube([1, 1, depth]);
        translate([43, 8, 0]) cube([1, 1, depth]);
        translate([44, 8, 0]) cube([1, 1, depth]);
        translate([45, 8, 0]) cube([1, 1, depth]);
        translate([48, 8, 0]) cube([1, 1, depth]);
        translate([2, 9, 0]) cube([1, 1, depth]);
        translate([11, 9, 0]) cube([1, 1, depth]);
        translate([18, 9, 0]) cube([1, 1, depth]);
        translate([23, 9, 0]) cube([1, 1, depth]);
        translate([24, 9, 0]) cube([1, 1, depth]);
        translate([25, 9, 0]) cube([1, 1, depth]);
        translate([26, 9, 0]) cube([1, 1, depth]);
        translate([27, 9, 0]) cube([1, 1, depth]);
        translate([29, 9, 0]) cube([1, 1, depth]);
        translate([30, 9, 0]) cube([1, 1, depth]);
        translate([31, 9, 0]) cube([1, 1, depth]);
        translate([32, 9, 0]) cube([1, 1, depth]);
        translate([33, 9, 0]) cube([1, 1, depth]);
        translate([34, 9, 0]) cube([1, 1, depth]);
        translate([36, 9, 0]) cube([1, 1, depth]);
        translate([37, 9, 0]) cube([1, 1, depth]);
        translate([39, 9, 0]) cube([1, 1, depth]);
        translate([48, 9, 0]) cube([1, 1, depth]);
        translate([2, 10, 0]) cube([1, 1, depth]);
        translate([11, 10, 0]) cube([1, 1, depth]);
        translate([18, 10, 0]) cube([1, 1, depth]);
        translate([23, 10, 0]) cube([1, 1, depth]);
        translate([24, 10, 0]) cube([1, 1, depth]);
        translate([25, 10, 0]) cube([1, 1, depth]);
        translate([26, 10, 0]) cube([1, 1, depth]);
        translate([27, 10, 0]) cube([1, 1, depth]);
        translate([29, 10, 0]) cube([1, 1, depth]);
        translate([30, 10, 0]) cube([1, 1, depth]);
        translate([31, 10, 0]) cube([1, 1, depth]);
        translate([32, 10, 0]) cube([1, 1, depth]);
        translate([33, 10, 0]) cube([1, 1, depth]);
        translate([34, 10, 0]) cube([1, 1, depth]);
        translate([36, 10, 0]) cube([1, 1, depth]);
        translate([37, 10, 0]) cube([1, 1, depth]);
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
        translate([15, 12, 0]) cube([1, 1, depth]);
        translate([23, 12, 0]) cube([1, 1, depth]);
        translate([24, 12, 0]) cube([1, 1, depth]);
        translate([25, 12, 0]) cube([1, 1, depth]);
        translate([26, 12, 0]) cube([1, 1, depth]);
        translate([27, 12, 0]) cube([1, 1, depth]);
        translate([28, 12, 0]) cube([1, 1, depth]);
        translate([30, 12, 0]) cube([1, 1, depth]);
        translate([31, 12, 0]) cube([1, 1, depth]);
        translate([33, 12, 0]) cube([1, 1, depth]);
        translate([34, 12, 0]) cube([1, 1, depth]);
        translate([35, 12, 0]) cube([1, 1, depth]);
        translate([36, 12, 0]) cube([1, 1, depth]);
        translate([37, 12, 0]) cube([1, 1, depth]);
        translate([2, 13, 0]) cube([1, 1, depth]);
        translate([5, 13, 0]) cube([1, 1, depth]);
        translate([6, 13, 0]) cube([1, 1, depth]);
        translate([7, 13, 0]) cube([1, 1, depth]);
        translate([9, 13, 0]) cube([1, 1, depth]);
        translate([10, 13, 0]) cube([1, 1, depth]);
        translate([11, 13, 0]) cube([1, 1, depth]);
        translate([12, 13, 0]) cube([1, 1, depth]);
        translate([15, 13, 0]) cube([1, 1, depth]);
        translate([23, 13, 0]) cube([1, 1, depth]);
        translate([24, 13, 0]) cube([1, 1, depth]);
        translate([25, 13, 0]) cube([1, 1, depth]);
        translate([26, 13, 0]) cube([1, 1, depth]);
        translate([27, 13, 0]) cube([1, 1, depth]);
        translate([28, 13, 0]) cube([1, 1, depth]);
        translate([29, 13, 0]) cube([1, 1, depth]);
        translate([32, 13, 0]) cube([1, 1, depth]);
        translate([39, 13, 0]) cube([1, 1, depth]);
        translate([43, 13, 0]) cube([1, 1, depth]);
        translate([44, 13, 0]) cube([1, 1, depth]);
        translate([46, 13, 0]) cube([1, 1, depth]);
        translate([47, 13, 0]) cube([1, 1, depth]);
        translate([48, 13, 0]) cube([1, 1, depth]);
        translate([2, 14, 0]) cube([1, 1, depth]);
        translate([5, 14, 0]) cube([1, 1, depth]);
        translate([6, 14, 0]) cube([1, 1, depth]);
        translate([7, 14, 0]) cube([1, 1, depth]);
        translate([9, 14, 0]) cube([1, 1, depth]);
        translate([10, 14, 0]) cube([1, 1, depth]);
        translate([11, 14, 0]) cube([1, 1, depth]);
        translate([12, 14, 0]) cube([1, 1, depth]);
        translate([15, 14, 0]) cube([1, 1, depth]);
        translate([23, 14, 0]) cube([1, 1, depth]);
        translate([24, 14, 0]) cube([1, 1, depth]);
        translate([25, 14, 0]) cube([1, 1, depth]);
        translate([26, 14, 0]) cube([1, 1, depth]);
        translate([27, 14, 0]) cube([1, 1, depth]);
        translate([28, 14, 0]) cube([1, 1, depth]);
        translate([29, 14, 0]) cube([1, 1, depth]);
        translate([32, 14, 0]) cube([1, 1, depth]);
        translate([39, 14, 0]) cube([1, 1, depth]);
        translate([43, 14, 0]) cube([1, 1, depth]);
        translate([44, 14, 0]) cube([1, 1, depth]);
        translate([46, 14, 0]) cube([1, 1, depth]);
        translate([47, 14, 0]) cube([1, 1, depth]);
        translate([48, 14, 0]) cube([1, 1, depth]);
        translate([2, 15, 0]) cube([1, 1, depth]);
        translate([5, 15, 0]) cube([1, 1, depth]);
        translate([8, 15, 0]) cube([1, 1, depth]);
        translate([16, 15, 0]) cube([1, 1, depth]);
        translate([17, 15, 0]) cube([1, 1, depth]);
        translate([20, 15, 0]) cube([1, 1, depth]);
        translate([21, 15, 0]) cube([1, 1, depth]);
        translate([25, 15, 0]) cube([1, 1, depth]);
        translate([26, 15, 0]) cube([1, 1, depth]);
        translate([27, 15, 0]) cube([1, 1, depth]);
        translate([28, 15, 0]) cube([1, 1, depth]);
        translate([29, 15, 0]) cube([1, 1, depth]);
        translate([32, 15, 0]) cube([1, 1, depth]);
        translate([33, 15, 0]) cube([1, 1, depth]);
        translate([34, 15, 0]) cube([1, 1, depth]);
        translate([35, 15, 0]) cube([1, 1, depth]);
        translate([36, 15, 0]) cube([1, 1, depth]);
        translate([37, 15, 0]) cube([1, 1, depth]);
        translate([39, 15, 0]) cube([1, 1, depth]);
        translate([40, 15, 0]) cube([1, 1, depth]);
        translate([41, 15, 0]) cube([1, 1, depth]);
        translate([43, 15, 0]) cube([1, 1, depth]);
        translate([44, 15, 0]) cube([1, 1, depth]);
        translate([45, 15, 0]) cube([1, 1, depth]);
        translate([46, 15, 0]) cube([1, 1, depth]);
        translate([47, 15, 0]) cube([1, 1, depth]);
        translate([48, 15, 0]) cube([1, 1, depth]);
        translate([2, 16, 0]) cube([1, 1, depth]);
        translate([5, 16, 0]) cube([1, 1, depth]);
        translate([8, 16, 0]) cube([1, 1, depth]);
        translate([9, 16, 0]) cube([1, 1, depth]);
        translate([10, 16, 0]) cube([1, 1, depth]);
        translate([11, 16, 0]) cube([1, 1, depth]);
        translate([12, 16, 0]) cube([1, 1, depth]);
        translate([13, 16, 0]) cube([1, 1, depth]);
        translate([14, 16, 0]) cube([1, 1, depth]);
        translate([16, 16, 0]) cube([1, 1, depth]);
        translate([17, 16, 0]) cube([1, 1, depth]);
        translate([18, 16, 0]) cube([1, 1, depth]);
        translate([20, 16, 0]) cube([1, 1, depth]);
        translate([21, 16, 0]) cube([1, 1, depth]);
        translate([25, 16, 0]) cube([1, 1, depth]);
        translate([28, 16, 0]) cube([1, 1, depth]);
        translate([33, 16, 0]) cube([1, 1, depth]);
        translate([34, 16, 0]) cube([1, 1, depth]);
        translate([35, 16, 0]) cube([1, 1, depth]);
        translate([38, 16, 0]) cube([1, 1, depth]);
        translate([39, 16, 0]) cube([1, 1, depth]);
        translate([40, 16, 0]) cube([1, 1, depth]);
        translate([41, 16, 0]) cube([1, 1, depth]);
        translate([42, 16, 0]) cube([1, 1, depth]);
        translate([43, 16, 0]) cube([1, 1, depth]);
        translate([44, 16, 0]) cube([1, 1, depth]);
        translate([48, 16, 0]) cube([1, 1, depth]);
        translate([2, 17, 0]) cube([1, 1, depth]);
        translate([5, 17, 0]) cube([1, 1, depth]);
        translate([8, 17, 0]) cube([1, 1, depth]);
        translate([9, 17, 0]) cube([1, 1, depth]);
        translate([10, 17, 0]) cube([1, 1, depth]);
        translate([11, 17, 0]) cube([1, 1, depth]);
        translate([12, 17, 0]) cube([1, 1, depth]);
        translate([13, 17, 0]) cube([1, 1, depth]);
        translate([14, 17, 0]) cube([1, 1, depth]);
        translate([16, 17, 0]) cube([1, 1, depth]);
        translate([17, 17, 0]) cube([1, 1, depth]);
        translate([18, 17, 0]) cube([1, 1, depth]);
        translate([20, 17, 0]) cube([1, 1, depth]);
        translate([21, 17, 0]) cube([1, 1, depth]);
        translate([25, 17, 0]) cube([1, 1, depth]);
        translate([28, 17, 0]) cube([1, 1, depth]);
        translate([33, 17, 0]) cube([1, 1, depth]);
        translate([34, 17, 0]) cube([1, 1, depth]);
        translate([35, 17, 0]) cube([1, 1, depth]);
        translate([38, 17, 0]) cube([1, 1, depth]);
        translate([39, 17, 0]) cube([1, 1, depth]);
        translate([40, 17, 0]) cube([1, 1, depth]);
        translate([41, 17, 0]) cube([1, 1, depth]);
        translate([42, 17, 0]) cube([1, 1, depth]);
        translate([43, 17, 0]) cube([1, 1, depth]);
        translate([44, 17, 0]) cube([1, 1, depth]);
        translate([48, 17, 0]) cube([1, 1, depth]);
        translate([2, 18, 0]) cube([1, 1, depth]);
        translate([6, 18, 0]) cube([1, 1, depth]);
        translate([7, 18, 0]) cube([1, 1, depth]);
        translate([12, 18, 0]) cube([1, 1, depth]);
        translate([15, 18, 0]) cube([1, 1, depth]);
        translate([16, 18, 0]) cube([1, 1, depth]);
        translate([17, 18, 0]) cube([1, 1, depth]);
        translate([18, 18, 0]) cube([1, 1, depth]);
        translate([25, 18, 0]) cube([1, 1, depth]);
        translate([26, 18, 0]) cube([1, 1, depth]);
        translate([27, 18, 0]) cube([1, 1, depth]);
        translate([29, 18, 0]) cube([1, 1, depth]);
        translate([33, 18, 0]) cube([1, 1, depth]);
        translate([34, 18, 0]) cube([1, 1, depth]);
        translate([35, 18, 0]) cube([1, 1, depth]);
        translate([36, 18, 0]) cube([1, 1, depth]);
        translate([37, 18, 0]) cube([1, 1, depth]);
        translate([38, 18, 0]) cube([1, 1, depth]);
        translate([40, 18, 0]) cube([1, 1, depth]);
        translate([41, 18, 0]) cube([1, 1, depth]);
        translate([43, 18, 0]) cube([1, 1, depth]);
        translate([44, 18, 0]) cube([1, 1, depth]);
        translate([2, 19, 0]) cube([1, 1, depth]);
        translate([5, 19, 0]) cube([1, 1, depth]);
        translate([6, 19, 0]) cube([1, 1, depth]);
        translate([7, 19, 0]) cube([1, 1, depth]);
        translate([9, 19, 0]) cube([1, 1, depth]);
        translate([10, 19, 0]) cube([1, 1, depth]);
        translate([11, 19, 0]) cube([1, 1, depth]);
        translate([13, 19, 0]) cube([1, 1, depth]);
        translate([14, 19, 0]) cube([1, 1, depth]);
        translate([15, 19, 0]) cube([1, 1, depth]);
        translate([18, 19, 0]) cube([1, 1, depth]);
        translate([22, 19, 0]) cube([1, 1, depth]);
        translate([23, 19, 0]) cube([1, 1, depth]);
        translate([24, 19, 0]) cube([1, 1, depth]);
        translate([25, 19, 0]) cube([1, 1, depth]);
        translate([29, 19, 0]) cube([1, 1, depth]);
        translate([30, 19, 0]) cube([1, 1, depth]);
        translate([31, 19, 0]) cube([1, 1, depth]);
        translate([35, 19, 0]) cube([1, 1, depth]);
        translate([38, 19, 0]) cube([1, 1, depth]);
        translate([42, 19, 0]) cube([1, 1, depth]);
        translate([43, 19, 0]) cube([1, 1, depth]);
        translate([44, 19, 0]) cube([1, 1, depth]);
        translate([46, 19, 0]) cube([1, 1, depth]);
        translate([47, 19, 0]) cube([1, 1, depth]);
        translate([3, 20, 0]) cube([1, 1, depth]);
        translate([4, 20, 0]) cube([1, 1, depth]);
        translate([9, 20, 0]) cube([1, 1, depth]);
        translate([10, 20, 0]) cube([1, 1, depth]);
        translate([12, 20, 0]) cube([1, 1, depth]);
        translate([13, 20, 0]) cube([1, 1, depth]);
        translate([14, 20, 0]) cube([1, 1, depth]);
        translate([22, 20, 0]) cube([1, 1, depth]);
        translate([33, 20, 0]) cube([1, 1, depth]);
        translate([34, 20, 0]) cube([1, 1, depth]);
        translate([35, 20, 0]) cube([1, 1, depth]);
        translate([36, 20, 0]) cube([1, 1, depth]);
        translate([37, 20, 0]) cube([1, 1, depth]);
        translate([40, 20, 0]) cube([1, 1, depth]);
        translate([41, 20, 0]) cube([1, 1, depth]);
        translate([46, 20, 0]) cube([1, 1, depth]);
        translate([47, 20, 0]) cube([1, 1, depth]);
        translate([3, 21, 0]) cube([1, 1, depth]);
        translate([4, 21, 0]) cube([1, 1, depth]);
        translate([9, 21, 0]) cube([1, 1, depth]);
        translate([10, 21, 0]) cube([1, 1, depth]);
        translate([12, 21, 0]) cube([1, 1, depth]);
        translate([13, 21, 0]) cube([1, 1, depth]);
        translate([14, 21, 0]) cube([1, 1, depth]);
        translate([22, 21, 0]) cube([1, 1, depth]);
        translate([33, 21, 0]) cube([1, 1, depth]);
        translate([34, 21, 0]) cube([1, 1, depth]);
        translate([35, 21, 0]) cube([1, 1, depth]);
        translate([36, 21, 0]) cube([1, 1, depth]);
        translate([37, 21, 0]) cube([1, 1, depth]);
        translate([40, 21, 0]) cube([1, 1, depth]);
        translate([41, 21, 0]) cube([1, 1, depth]);
        translate([46, 21, 0]) cube([1, 1, depth]);
        translate([47, 21, 0]) cube([1, 1, depth]);
        translate([3, 22, 0]) cube([1, 1, depth]);
        translate([4, 22, 0]) cube([1, 1, depth]);
        translate([8, 22, 0]) cube([1, 1, depth]);
        translate([11, 22, 0]) cube([1, 1, depth]);
        translate([12, 22, 0]) cube([1, 1, depth]);
        translate([16, 22, 0]) cube([1, 1, depth]);
        translate([17, 22, 0]) cube([1, 1, depth]);
        translate([18, 22, 0]) cube([1, 1, depth]);
        translate([26, 22, 0]) cube([1, 1, depth]);
        translate([27, 22, 0]) cube([1, 1, depth]);
        translate([28, 22, 0]) cube([1, 1, depth]);
        translate([29, 22, 0]) cube([1, 1, depth]);
        translate([30, 22, 0]) cube([1, 1, depth]);
        translate([31, 22, 0]) cube([1, 1, depth]);
        translate([33, 22, 0]) cube([1, 1, depth]);
        translate([34, 22, 0]) cube([1, 1, depth]);
        translate([39, 22, 0]) cube([1, 1, depth]);
        translate([43, 22, 0]) cube([1, 1, depth]);
        translate([44, 22, 0]) cube([1, 1, depth]);
        translate([45, 22, 0]) cube([1, 1, depth]);
        translate([2, 23, 0]) cube([1, 1, depth]);
        translate([5, 23, 0]) cube([1, 1, depth]);
        translate([6, 23, 0]) cube([1, 1, depth]);
        translate([7, 23, 0]) cube([1, 1, depth]);
        translate([9, 23, 0]) cube([1, 1, depth]);
        translate([10, 23, 0]) cube([1, 1, depth]);
        translate([15, 23, 0]) cube([1, 1, depth]);
        translate([19, 23, 0]) cube([1, 1, depth]);
        translate([20, 23, 0]) cube([1, 1, depth]);
        translate([21, 23, 0]) cube([1, 1, depth]);
        translate([23, 23, 0]) cube([1, 1, depth]);
        translate([24, 23, 0]) cube([1, 1, depth]);
        translate([30, 23, 0]) cube([1, 1, depth]);
        translate([31, 23, 0]) cube([1, 1, depth]);
        translate([32, 23, 0]) cube([1, 1, depth]);
        translate([35, 23, 0]) cube([1, 1, depth]);
        translate([36, 23, 0]) cube([1, 1, depth]);
        translate([37, 23, 0]) cube([1, 1, depth]);
        translate([38, 23, 0]) cube([1, 1, depth]);
        translate([39, 23, 0]) cube([1, 1, depth]);
        translate([40, 23, 0]) cube([1, 1, depth]);
        translate([41, 23, 0]) cube([1, 1, depth]);
        translate([43, 23, 0]) cube([1, 1, depth]);
        translate([44, 23, 0]) cube([1, 1, depth]);
        translate([45, 23, 0]) cube([1, 1, depth]);
        translate([2, 24, 0]) cube([1, 1, depth]);
        translate([5, 24, 0]) cube([1, 1, depth]);
        translate([6, 24, 0]) cube([1, 1, depth]);
        translate([7, 24, 0]) cube([1, 1, depth]);
        translate([9, 24, 0]) cube([1, 1, depth]);
        translate([10, 24, 0]) cube([1, 1, depth]);
        translate([15, 24, 0]) cube([1, 1, depth]);
        translate([19, 24, 0]) cube([1, 1, depth]);
        translate([20, 24, 0]) cube([1, 1, depth]);
        translate([21, 24, 0]) cube([1, 1, depth]);
        translate([23, 24, 0]) cube([1, 1, depth]);
        translate([24, 24, 0]) cube([1, 1, depth]);
        translate([30, 24, 0]) cube([1, 1, depth]);
        translate([31, 24, 0]) cube([1, 1, depth]);
        translate([32, 24, 0]) cube([1, 1, depth]);
        translate([35, 24, 0]) cube([1, 1, depth]);
        translate([36, 24, 0]) cube([1, 1, depth]);
        translate([37, 24, 0]) cube([1, 1, depth]);
        translate([38, 24, 0]) cube([1, 1, depth]);
        translate([39, 24, 0]) cube([1, 1, depth]);
        translate([40, 24, 0]) cube([1, 1, depth]);
        translate([41, 24, 0]) cube([1, 1, depth]);
        translate([43, 24, 0]) cube([1, 1, depth]);
        translate([44, 24, 0]) cube([1, 1, depth]);
        translate([45, 24, 0]) cube([1, 1, depth]);
        translate([3, 25, 0]) cube([1, 1, depth]);
        translate([4, 25, 0]) cube([1, 1, depth]);
        translate([5, 25, 0]) cube([1, 1, depth]);
        translate([8, 25, 0]) cube([1, 1, depth]);
        translate([9, 25, 0]) cube([1, 1, depth]);
        translate([10, 25, 0]) cube([1, 1, depth]);
        translate([11, 25, 0]) cube([1, 1, depth]);
        translate([12, 25, 0]) cube([1, 1, depth]);
        translate([15, 25, 0]) cube([1, 1, depth]);
        translate([16, 25, 0]) cube([1, 1, depth]);
        translate([17, 25, 0]) cube([1, 1, depth]);
        translate([19, 25, 0]) cube([1, 1, depth]);
        translate([20, 25, 0]) cube([1, 1, depth]);
        translate([21, 25, 0]) cube([1, 1, depth]);
        translate([28, 25, 0]) cube([1, 1, depth]);
        translate([32, 25, 0]) cube([1, 1, depth]);
        translate([33, 25, 0]) cube([1, 1, depth]);
        translate([34, 25, 0]) cube([1, 1, depth]);
        translate([38, 25, 0]) cube([1, 1, depth]);
        translate([39, 25, 0]) cube([1, 1, depth]);
        translate([42, 25, 0]) cube([1, 1, depth]);
        translate([43, 25, 0]) cube([1, 1, depth]);
        translate([44, 25, 0]) cube([1, 1, depth]);
        translate([5, 26, 0]) cube([1, 1, depth]);
        translate([9, 26, 0]) cube([1, 1, depth]);
        translate([10, 26, 0]) cube([1, 1, depth]);
        translate([12, 26, 0]) cube([1, 1, depth]);
        translate([13, 26, 0]) cube([1, 1, depth]);
        translate([14, 26, 0]) cube([1, 1, depth]);
        translate([19, 26, 0]) cube([1, 1, depth]);
        translate([20, 26, 0]) cube([1, 1, depth]);
        translate([21, 26, 0]) cube([1, 1, depth]);
        translate([23, 26, 0]) cube([1, 1, depth]);
        translate([24, 26, 0]) cube([1, 1, depth]);
        translate([30, 26, 0]) cube([1, 1, depth]);
        translate([31, 26, 0]) cube([1, 1, depth]);
        translate([33, 26, 0]) cube([1, 1, depth]);
        translate([34, 26, 0]) cube([1, 1, depth]);
        translate([35, 26, 0]) cube([1, 1, depth]);
        translate([36, 26, 0]) cube([1, 1, depth]);
        translate([37, 26, 0]) cube([1, 1, depth]);
        translate([38, 26, 0]) cube([1, 1, depth]);
        translate([39, 26, 0]) cube([1, 1, depth]);
        translate([42, 26, 0]) cube([1, 1, depth]);
        translate([43, 26, 0]) cube([1, 1, depth]);
        translate([44, 26, 0]) cube([1, 1, depth]);
        translate([48, 26, 0]) cube([1, 1, depth]);
        translate([5, 27, 0]) cube([1, 1, depth]);
        translate([9, 27, 0]) cube([1, 1, depth]);
        translate([10, 27, 0]) cube([1, 1, depth]);
        translate([12, 27, 0]) cube([1, 1, depth]);
        translate([13, 27, 0]) cube([1, 1, depth]);
        translate([14, 27, 0]) cube([1, 1, depth]);
        translate([19, 27, 0]) cube([1, 1, depth]);
        translate([20, 27, 0]) cube([1, 1, depth]);
        translate([21, 27, 0]) cube([1, 1, depth]);
        translate([23, 27, 0]) cube([1, 1, depth]);
        translate([24, 27, 0]) cube([1, 1, depth]);
        translate([30, 27, 0]) cube([1, 1, depth]);
        translate([31, 27, 0]) cube([1, 1, depth]);
        translate([33, 27, 0]) cube([1, 1, depth]);
        translate([34, 27, 0]) cube([1, 1, depth]);
        translate([35, 27, 0]) cube([1, 1, depth]);
        translate([36, 27, 0]) cube([1, 1, depth]);
        translate([37, 27, 0]) cube([1, 1, depth]);
        translate([38, 27, 0]) cube([1, 1, depth]);
        translate([39, 27, 0]) cube([1, 1, depth]);
        translate([42, 27, 0]) cube([1, 1, depth]);
        translate([43, 27, 0]) cube([1, 1, depth]);
        translate([44, 27, 0]) cube([1, 1, depth]);
        translate([48, 27, 0]) cube([1, 1, depth]);
        translate([3, 28, 0]) cube([1, 1, depth]);
        translate([4, 28, 0]) cube([1, 1, depth]);
        translate([5, 28, 0]) cube([1, 1, depth]);
        translate([11, 28, 0]) cube([1, 1, depth]);
        translate([12, 28, 0]) cube([1, 1, depth]);
        translate([16, 28, 0]) cube([1, 1, depth]);
        translate([17, 28, 0]) cube([1, 1, depth]);
        translate([23, 28, 0]) cube([1, 1, depth]);
        translate([24, 28, 0]) cube([1, 1, depth]);
        translate([28, 28, 0]) cube([1, 1, depth]);
        translate([38, 28, 0]) cube([1, 1, depth]);
        translate([39, 28, 0]) cube([1, 1, depth]);
        translate([40, 28, 0]) cube([1, 1, depth]);
        translate([41, 28, 0]) cube([1, 1, depth]);
        translate([42, 28, 0]) cube([1, 1, depth]);
        translate([45, 28, 0]) cube([1, 1, depth]);
        translate([46, 28, 0]) cube([1, 1, depth]);
        translate([47, 28, 0]) cube([1, 1, depth]);
        translate([3, 29, 0]) cube([1, 1, depth]);
        translate([4, 29, 0]) cube([1, 1, depth]);
        translate([8, 29, 0]) cube([1, 1, depth]);
        translate([9, 29, 0]) cube([1, 1, depth]);
        translate([10, 29, 0]) cube([1, 1, depth]);
        translate([23, 29, 0]) cube([1, 1, depth]);
        translate([24, 29, 0]) cube([1, 1, depth]);
        translate([26, 29, 0]) cube([1, 1, depth]);
        translate([27, 29, 0]) cube([1, 1, depth]);
        translate([28, 29, 0]) cube([1, 1, depth]);
        translate([29, 29, 0]) cube([1, 1, depth]);
        translate([33, 29, 0]) cube([1, 1, depth]);
        translate([34, 29, 0]) cube([1, 1, depth]);
        translate([35, 29, 0]) cube([1, 1, depth]);
        translate([36, 29, 0]) cube([1, 1, depth]);
        translate([37, 29, 0]) cube([1, 1, depth]);
        translate([38, 29, 0]) cube([1, 1, depth]);
        translate([39, 29, 0]) cube([1, 1, depth]);
        translate([42, 29, 0]) cube([1, 1, depth]);
        translate([48, 29, 0]) cube([1, 1, depth]);
        translate([3, 30, 0]) cube([1, 1, depth]);
        translate([4, 30, 0]) cube([1, 1, depth]);
        translate([8, 30, 0]) cube([1, 1, depth]);
        translate([9, 30, 0]) cube([1, 1, depth]);
        translate([10, 30, 0]) cube([1, 1, depth]);
        translate([11, 30, 0]) cube([1, 1, depth]);
        translate([12, 30, 0]) cube([1, 1, depth]);
        translate([15, 30, 0]) cube([1, 1, depth]);
        translate([18, 30, 0]) cube([1, 1, depth]);
        translate([19, 30, 0]) cube([1, 1, depth]);
        translate([22, 30, 0]) cube([1, 1, depth]);
        translate([25, 30, 0]) cube([1, 1, depth]);
        translate([29, 30, 0]) cube([1, 1, depth]);
        translate([30, 30, 0]) cube([1, 1, depth]);
        translate([31, 30, 0]) cube([1, 1, depth]);
        translate([32, 30, 0]) cube([1, 1, depth]);
        translate([33, 30, 0]) cube([1, 1, depth]);
        translate([34, 30, 0]) cube([1, 1, depth]);
        translate([36, 30, 0]) cube([1, 1, depth]);
        translate([37, 30, 0]) cube([1, 1, depth]);
        translate([43, 30, 0]) cube([1, 1, depth]);
        translate([44, 30, 0]) cube([1, 1, depth]);
        translate([45, 30, 0]) cube([1, 1, depth]);
        translate([3, 31, 0]) cube([1, 1, depth]);
        translate([4, 31, 0]) cube([1, 1, depth]);
        translate([8, 31, 0]) cube([1, 1, depth]);
        translate([9, 31, 0]) cube([1, 1, depth]);
        translate([10, 31, 0]) cube([1, 1, depth]);
        translate([11, 31, 0]) cube([1, 1, depth]);
        translate([12, 31, 0]) cube([1, 1, depth]);
        translate([15, 31, 0]) cube([1, 1, depth]);
        translate([18, 31, 0]) cube([1, 1, depth]);
        translate([19, 31, 0]) cube([1, 1, depth]);
        translate([22, 31, 0]) cube([1, 1, depth]);
        translate([25, 31, 0]) cube([1, 1, depth]);
        translate([29, 31, 0]) cube([1, 1, depth]);
        translate([30, 31, 0]) cube([1, 1, depth]);
        translate([31, 31, 0]) cube([1, 1, depth]);
        translate([32, 31, 0]) cube([1, 1, depth]);
        translate([33, 31, 0]) cube([1, 1, depth]);
        translate([34, 31, 0]) cube([1, 1, depth]);
        translate([36, 31, 0]) cube([1, 1, depth]);
        translate([37, 31, 0]) cube([1, 1, depth]);
        translate([43, 31, 0]) cube([1, 1, depth]);
        translate([44, 31, 0]) cube([1, 1, depth]);
        translate([45, 31, 0]) cube([1, 1, depth]);
        translate([2, 32, 0]) cube([1, 1, depth]);
        translate([3, 32, 0]) cube([1, 1, depth]);
        translate([4, 32, 0]) cube([1, 1, depth]);
        translate([5, 32, 0]) cube([1, 1, depth]);
        translate([6, 32, 0]) cube([1, 1, depth]);
        translate([7, 32, 0]) cube([1, 1, depth]);
        translate([8, 32, 0]) cube([1, 1, depth]);
        translate([9, 32, 0]) cube([1, 1, depth]);
        translate([10, 32, 0]) cube([1, 1, depth]);
        translate([12, 32, 0]) cube([1, 1, depth]);
        translate([13, 32, 0]) cube([1, 1, depth]);
        translate([14, 32, 0]) cube([1, 1, depth]);
        translate([18, 32, 0]) cube([1, 1, depth]);
        translate([19, 32, 0]) cube([1, 1, depth]);
        translate([20, 32, 0]) cube([1, 1, depth]);
        translate([21, 32, 0]) cube([1, 1, depth]);
        translate([22, 32, 0]) cube([1, 1, depth]);
        translate([23, 32, 0]) cube([1, 1, depth]);
        translate([24, 32, 0]) cube([1, 1, depth]);
        translate([25, 32, 0]) cube([1, 1, depth]);
        translate([26, 32, 0]) cube([1, 1, depth]);
        translate([27, 32, 0]) cube([1, 1, depth]);
        translate([29, 32, 0]) cube([1, 1, depth]);
        translate([33, 32, 0]) cube([1, 1, depth]);
        translate([34, 32, 0]) cube([1, 1, depth]);
        translate([35, 32, 0]) cube([1, 1, depth]);
        translate([43, 32, 0]) cube([1, 1, depth]);
        translate([44, 32, 0]) cube([1, 1, depth]);
        translate([45, 32, 0]) cube([1, 1, depth]);
        translate([48, 32, 0]) cube([1, 1, depth]);
        translate([6, 33, 0]) cube([1, 1, depth]);
        translate([7, 33, 0]) cube([1, 1, depth]);
        translate([9, 33, 0]) cube([1, 1, depth]);
        translate([10, 33, 0]) cube([1, 1, depth]);
        translate([11, 33, 0]) cube([1, 1, depth]);
        translate([12, 33, 0]) cube([1, 1, depth]);
        translate([19, 33, 0]) cube([1, 1, depth]);
        translate([23, 33, 0]) cube([1, 1, depth]);
        translate([24, 33, 0]) cube([1, 1, depth]);
        translate([26, 33, 0]) cube([1, 1, depth]);
        translate([27, 33, 0]) cube([1, 1, depth]);
        translate([28, 33, 0]) cube([1, 1, depth]);
        translate([30, 33, 0]) cube([1, 1, depth]);
        translate([31, 33, 0]) cube([1, 1, depth]);
        translate([32, 33, 0]) cube([1, 1, depth]);
        translate([33, 33, 0]) cube([1, 1, depth]);
        translate([34, 33, 0]) cube([1, 1, depth]);
        translate([35, 33, 0]) cube([1, 1, depth]);
        translate([36, 33, 0]) cube([1, 1, depth]);
        translate([37, 33, 0]) cube([1, 1, depth]);
        translate([38, 33, 0]) cube([1, 1, depth]);
        translate([40, 33, 0]) cube([1, 1, depth]);
        translate([41, 33, 0]) cube([1, 1, depth]);
        translate([46, 33, 0]) cube([1, 1, depth]);
        translate([47, 33, 0]) cube([1, 1, depth]);
        translate([48, 33, 0]) cube([1, 1, depth]);
        translate([6, 34, 0]) cube([1, 1, depth]);
        translate([7, 34, 0]) cube([1, 1, depth]);
        translate([9, 34, 0]) cube([1, 1, depth]);
        translate([10, 34, 0]) cube([1, 1, depth]);
        translate([11, 34, 0]) cube([1, 1, depth]);
        translate([12, 34, 0]) cube([1, 1, depth]);
        translate([19, 34, 0]) cube([1, 1, depth]);
        translate([23, 34, 0]) cube([1, 1, depth]);
        translate([24, 34, 0]) cube([1, 1, depth]);
        translate([26, 34, 0]) cube([1, 1, depth]);
        translate([27, 34, 0]) cube([1, 1, depth]);
        translate([28, 34, 0]) cube([1, 1, depth]);
        translate([30, 34, 0]) cube([1, 1, depth]);
        translate([31, 34, 0]) cube([1, 1, depth]);
        translate([32, 34, 0]) cube([1, 1, depth]);
        translate([33, 34, 0]) cube([1, 1, depth]);
        translate([34, 34, 0]) cube([1, 1, depth]);
        translate([35, 34, 0]) cube([1, 1, depth]);
        translate([36, 34, 0]) cube([1, 1, depth]);
        translate([37, 34, 0]) cube([1, 1, depth]);
        translate([38, 34, 0]) cube([1, 1, depth]);
        translate([40, 34, 0]) cube([1, 1, depth]);
        translate([41, 34, 0]) cube([1, 1, depth]);
        translate([46, 34, 0]) cube([1, 1, depth]);
        translate([47, 34, 0]) cube([1, 1, depth]);
        translate([48, 34, 0]) cube([1, 1, depth]);
        translate([3, 35, 0]) cube([1, 1, depth]);
        translate([4, 35, 0]) cube([1, 1, depth]);
        translate([5, 35, 0]) cube([1, 1, depth]);
        translate([8, 35, 0]) cube([1, 1, depth]);
        translate([13, 35, 0]) cube([1, 1, depth]);
        translate([14, 35, 0]) cube([1, 1, depth]);
        translate([15, 35, 0]) cube([1, 1, depth]);
        translate([18, 35, 0]) cube([1, 1, depth]);
        translate([19, 35, 0]) cube([1, 1, depth]);
        translate([20, 35, 0]) cube([1, 1, depth]);
        translate([21, 35, 0]) cube([1, 1, depth]);
        translate([23, 35, 0]) cube([1, 1, depth]);
        translate([24, 35, 0]) cube([1, 1, depth]);
        translate([28, 35, 0]) cube([1, 1, depth]);
        translate([30, 35, 0]) cube([1, 1, depth]);
        translate([31, 35, 0]) cube([1, 1, depth]);
        translate([35, 35, 0]) cube([1, 1, depth]);
        translate([36, 35, 0]) cube([1, 1, depth]);
        translate([37, 35, 0]) cube([1, 1, depth]);
        translate([39, 35, 0]) cube([1, 1, depth]);
        translate([40, 35, 0]) cube([1, 1, depth]);
        translate([41, 35, 0]) cube([1, 1, depth]);
        translate([42, 35, 0]) cube([1, 1, depth]);
        translate([43, 35, 0]) cube([1, 1, depth]);
        translate([44, 35, 0]) cube([1, 1, depth]);
        translate([2, 36, 0]) cube([1, 1, depth]);
        translate([5, 36, 0]) cube([1, 1, depth]);
        translate([11, 36, 0]) cube([1, 1, depth]);
        translate([13, 36, 0]) cube([1, 1, depth]);
        translate([14, 36, 0]) cube([1, 1, depth]);
        translate([15, 36, 0]) cube([1, 1, depth]);
        translate([16, 36, 0]) cube([1, 1, depth]);
        translate([17, 36, 0]) cube([1, 1, depth]);
        translate([18, 36, 0]) cube([1, 1, depth]);
        translate([19, 36, 0]) cube([1, 1, depth]);
        translate([22, 36, 0]) cube([1, 1, depth]);
        translate([25, 36, 0]) cube([1, 1, depth]);
        translate([26, 36, 0]) cube([1, 1, depth]);
        translate([27, 36, 0]) cube([1, 1, depth]);
        translate([28, 36, 0]) cube([1, 1, depth]);
        translate([33, 36, 0]) cube([1, 1, depth]);
        translate([34, 36, 0]) cube([1, 1, depth]);
        translate([36, 36, 0]) cube([1, 1, depth]);
        translate([37, 36, 0]) cube([1, 1, depth]);
        translate([38, 36, 0]) cube([1, 1, depth]);
        translate([39, 36, 0]) cube([1, 1, depth]);
        translate([40, 36, 0]) cube([1, 1, depth]);
        translate([41, 36, 0]) cube([1, 1, depth]);
        translate([42, 36, 0]) cube([1, 1, depth]);
        translate([46, 36, 0]) cube([1, 1, depth]);
        translate([47, 36, 0]) cube([1, 1, depth]);
        translate([2, 37, 0]) cube([1, 1, depth]);
        translate([5, 37, 0]) cube([1, 1, depth]);
        translate([11, 37, 0]) cube([1, 1, depth]);
        translate([13, 37, 0]) cube([1, 1, depth]);
        translate([14, 37, 0]) cube([1, 1, depth]);
        translate([15, 37, 0]) cube([1, 1, depth]);
        translate([16, 37, 0]) cube([1, 1, depth]);
        translate([17, 37, 0]) cube([1, 1, depth]);
        translate([18, 37, 0]) cube([1, 1, depth]);
        translate([19, 37, 0]) cube([1, 1, depth]);
        translate([22, 37, 0]) cube([1, 1, depth]);
        translate([25, 37, 0]) cube([1, 1, depth]);
        translate([26, 37, 0]) cube([1, 1, depth]);
        translate([27, 37, 0]) cube([1, 1, depth]);
        translate([28, 37, 0]) cube([1, 1, depth]);
        translate([33, 37, 0]) cube([1, 1, depth]);
        translate([34, 37, 0]) cube([1, 1, depth]);
        translate([36, 37, 0]) cube([1, 1, depth]);
        translate([37, 37, 0]) cube([1, 1, depth]);
        translate([38, 37, 0]) cube([1, 1, depth]);
        translate([39, 37, 0]) cube([1, 1, depth]);
        translate([40, 37, 0]) cube([1, 1, depth]);
        translate([41, 37, 0]) cube([1, 1, depth]);
        translate([42, 37, 0]) cube([1, 1, depth]);
        translate([46, 37, 0]) cube([1, 1, depth]);
        translate([47, 37, 0]) cube([1, 1, depth]);
        translate([13, 38, 0]) cube([1, 1, depth]);
        translate([14, 38, 0]) cube([1, 1, depth]);
        translate([18, 38, 0]) cube([1, 1, depth]);
        translate([19, 38, 0]) cube([1, 1, depth]);
        translate([20, 38, 0]) cube([1, 1, depth]);
        translate([21, 38, 0]) cube([1, 1, depth]);
        translate([23, 38, 0]) cube([1, 1, depth]);
        translate([24, 38, 0]) cube([1, 1, depth]);
        translate([25, 38, 0]) cube([1, 1, depth]);
        translate([29, 38, 0]) cube([1, 1, depth]);
        translate([33, 38, 0]) cube([1, 1, depth]);
        translate([34, 38, 0]) cube([1, 1, depth]);
        translate([35, 38, 0]) cube([1, 1, depth]);
        translate([36, 38, 0]) cube([1, 1, depth]);
        translate([37, 38, 0]) cube([1, 1, depth]);
        translate([42, 38, 0]) cube([1, 1, depth]);
        translate([43, 38, 0]) cube([1, 1, depth]);
        translate([44, 38, 0]) cube([1, 1, depth]);
        translate([46, 38, 0]) cube([1, 1, depth]);
        translate([47, 38, 0]) cube([1, 1, depth]);
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
        translate([18, 39, 0]) cube([1, 1, depth]);
        translate([19, 39, 0]) cube([1, 1, depth]);
        translate([22, 39, 0]) cube([1, 1, depth]);
        translate([25, 39, 0]) cube([1, 1, depth]);
        translate([26, 39, 0]) cube([1, 1, depth]);
        translate([27, 39, 0]) cube([1, 1, depth]);
        translate([28, 39, 0]) cube([1, 1, depth]);
        translate([29, 39, 0]) cube([1, 1, depth]);
        translate([30, 39, 0]) cube([1, 1, depth]);
        translate([31, 39, 0]) cube([1, 1, depth]);
        translate([32, 39, 0]) cube([1, 1, depth]);
        translate([33, 39, 0]) cube([1, 1, depth]);
        translate([34, 39, 0]) cube([1, 1, depth]);
        translate([35, 39, 0]) cube([1, 1, depth]);
        translate([36, 39, 0]) cube([1, 1, depth]);
        translate([37, 39, 0]) cube([1, 1, depth]);
        translate([39, 39, 0]) cube([1, 1, depth]);
        translate([42, 39, 0]) cube([1, 1, depth]);
        translate([46, 39, 0]) cube([1, 1, depth]);
        translate([47, 39, 0]) cube([1, 1, depth]);
        translate([2, 40, 0]) cube([1, 1, depth]);
        translate([11, 40, 0]) cube([1, 1, depth]);
        translate([13, 40, 0]) cube([1, 1, depth]);
        translate([14, 40, 0]) cube([1, 1, depth]);
        translate([19, 40, 0]) cube([1, 1, depth]);
        translate([20, 40, 0]) cube([1, 1, depth]);
        translate([21, 40, 0]) cube([1, 1, depth]);
        translate([23, 40, 0]) cube([1, 1, depth]);
        translate([24, 40, 0]) cube([1, 1, depth]);
        translate([25, 40, 0]) cube([1, 1, depth]);
        translate([26, 40, 0]) cube([1, 1, depth]);
        translate([27, 40, 0]) cube([1, 1, depth]);
        translate([28, 40, 0]) cube([1, 1, depth]);
        translate([32, 40, 0]) cube([1, 1, depth]);
        translate([33, 40, 0]) cube([1, 1, depth]);
        translate([34, 40, 0]) cube([1, 1, depth]);
        translate([35, 40, 0]) cube([1, 1, depth]);
        translate([36, 40, 0]) cube([1, 1, depth]);
        translate([37, 40, 0]) cube([1, 1, depth]);
        translate([42, 40, 0]) cube([1, 1, depth]);
        translate([43, 40, 0]) cube([1, 1, depth]);
        translate([44, 40, 0]) cube([1, 1, depth]);
        translate([45, 40, 0]) cube([1, 1, depth]);
        translate([46, 40, 0]) cube([1, 1, depth]);
        translate([47, 40, 0]) cube([1, 1, depth]);
        translate([48, 40, 0]) cube([1, 1, depth]);
        translate([2, 41, 0]) cube([1, 1, depth]);
        translate([11, 41, 0]) cube([1, 1, depth]);
        translate([13, 41, 0]) cube([1, 1, depth]);
        translate([14, 41, 0]) cube([1, 1, depth]);
        translate([19, 41, 0]) cube([1, 1, depth]);
        translate([20, 41, 0]) cube([1, 1, depth]);
        translate([21, 41, 0]) cube([1, 1, depth]);
        translate([23, 41, 0]) cube([1, 1, depth]);
        translate([24, 41, 0]) cube([1, 1, depth]);
        translate([25, 41, 0]) cube([1, 1, depth]);
        translate([26, 41, 0]) cube([1, 1, depth]);
        translate([27, 41, 0]) cube([1, 1, depth]);
        translate([28, 41, 0]) cube([1, 1, depth]);
        translate([32, 41, 0]) cube([1, 1, depth]);
        translate([33, 41, 0]) cube([1, 1, depth]);
        translate([34, 41, 0]) cube([1, 1, depth]);
        translate([35, 41, 0]) cube([1, 1, depth]);
        translate([36, 41, 0]) cube([1, 1, depth]);
        translate([37, 41, 0]) cube([1, 1, depth]);
        translate([42, 41, 0]) cube([1, 1, depth]);
        translate([43, 41, 0]) cube([1, 1, depth]);
        translate([44, 41, 0]) cube([1, 1, depth]);
        translate([45, 41, 0]) cube([1, 1, depth]);
        translate([46, 41, 0]) cube([1, 1, depth]);
        translate([47, 41, 0]) cube([1, 1, depth]);
        translate([48, 41, 0]) cube([1, 1, depth]);
        translate([2, 42, 0]) cube([1, 1, depth]);
        translate([5, 42, 0]) cube([1, 1, depth]);
        translate([6, 42, 0]) cube([1, 1, depth]);
        translate([7, 42, 0]) cube([1, 1, depth]);
        translate([8, 42, 0]) cube([1, 1, depth]);
        translate([11, 42, 0]) cube([1, 1, depth]);
        translate([15, 42, 0]) cube([1, 1, depth]);
        translate([20, 42, 0]) cube([1, 1, depth]);
        translate([21, 42, 0]) cube([1, 1, depth]);
        translate([22, 42, 0]) cube([1, 1, depth]);
        translate([25, 42, 0]) cube([1, 1, depth]);
        translate([26, 42, 0]) cube([1, 1, depth]);
        translate([27, 42, 0]) cube([1, 1, depth]);
        translate([28, 42, 0]) cube([1, 1, depth]);
        translate([29, 42, 0]) cube([1, 1, depth]);
        translate([30, 42, 0]) cube([1, 1, depth]);
        translate([31, 42, 0]) cube([1, 1, depth]);
        translate([32, 42, 0]) cube([1, 1, depth]);
        translate([33, 42, 0]) cube([1, 1, depth]);
        translate([34, 42, 0]) cube([1, 1, depth]);
        translate([35, 42, 0]) cube([1, 1, depth]);
        translate([36, 42, 0]) cube([1, 1, depth]);
        translate([37, 42, 0]) cube([1, 1, depth]);
        translate([38, 42, 0]) cube([1, 1, depth]);
        translate([39, 42, 0]) cube([1, 1, depth]);
        translate([40, 42, 0]) cube([1, 1, depth]);
        translate([41, 42, 0]) cube([1, 1, depth]);
        translate([42, 42, 0]) cube([1, 1, depth]);
        translate([45, 42, 0]) cube([1, 1, depth]);
        translate([46, 42, 0]) cube([1, 1, depth]);
        translate([47, 42, 0]) cube([1, 1, depth]);
        translate([2, 43, 0]) cube([1, 1, depth]);
        translate([5, 43, 0]) cube([1, 1, depth]);
        translate([6, 43, 0]) cube([1, 1, depth]);
        translate([7, 43, 0]) cube([1, 1, depth]);
        translate([8, 43, 0]) cube([1, 1, depth]);
        translate([11, 43, 0]) cube([1, 1, depth]);
        translate([13, 43, 0]) cube([1, 1, depth]);
        translate([14, 43, 0]) cube([1, 1, depth]);
        translate([16, 43, 0]) cube([1, 1, depth]);
        translate([17, 43, 0]) cube([1, 1, depth]);
        translate([18, 43, 0]) cube([1, 1, depth]);
        translate([20, 43, 0]) cube([1, 1, depth]);
        translate([21, 43, 0]) cube([1, 1, depth]);
        translate([25, 43, 0]) cube([1, 1, depth]);
        translate([26, 43, 0]) cube([1, 1, depth]);
        translate([27, 43, 0]) cube([1, 1, depth]);
        translate([30, 43, 0]) cube([1, 1, depth]);
        translate([31, 43, 0]) cube([1, 1, depth]);
        translate([33, 43, 0]) cube([1, 1, depth]);
        translate([34, 43, 0]) cube([1, 1, depth]);
        translate([40, 43, 0]) cube([1, 1, depth]);
        translate([41, 43, 0]) cube([1, 1, depth]);
        translate([43, 43, 0]) cube([1, 1, depth]);
        translate([44, 43, 0]) cube([1, 1, depth]);
        translate([45, 43, 0]) cube([1, 1, depth]);
        translate([48, 43, 0]) cube([1, 1, depth]);
        translate([2, 44, 0]) cube([1, 1, depth]);
        translate([5, 44, 0]) cube([1, 1, depth]);
        translate([6, 44, 0]) cube([1, 1, depth]);
        translate([7, 44, 0]) cube([1, 1, depth]);
        translate([8, 44, 0]) cube([1, 1, depth]);
        translate([11, 44, 0]) cube([1, 1, depth]);
        translate([13, 44, 0]) cube([1, 1, depth]);
        translate([14, 44, 0]) cube([1, 1, depth]);
        translate([16, 44, 0]) cube([1, 1, depth]);
        translate([17, 44, 0]) cube([1, 1, depth]);
        translate([18, 44, 0]) cube([1, 1, depth]);
        translate([20, 44, 0]) cube([1, 1, depth]);
        translate([21, 44, 0]) cube([1, 1, depth]);
        translate([25, 44, 0]) cube([1, 1, depth]);
        translate([26, 44, 0]) cube([1, 1, depth]);
        translate([27, 44, 0]) cube([1, 1, depth]);
        translate([30, 44, 0]) cube([1, 1, depth]);
        translate([31, 44, 0]) cube([1, 1, depth]);
        translate([33, 44, 0]) cube([1, 1, depth]);
        translate([34, 44, 0]) cube([1, 1, depth]);
        translate([40, 44, 0]) cube([1, 1, depth]);
        translate([41, 44, 0]) cube([1, 1, depth]);
        translate([43, 44, 0]) cube([1, 1, depth]);
        translate([44, 44, 0]) cube([1, 1, depth]);
        translate([45, 44, 0]) cube([1, 1, depth]);
        translate([48, 44, 0]) cube([1, 1, depth]);
        translate([2, 45, 0]) cube([1, 1, depth]);
        translate([5, 45, 0]) cube([1, 1, depth]);
        translate([6, 45, 0]) cube([1, 1, depth]);
        translate([7, 45, 0]) cube([1, 1, depth]);
        translate([8, 45, 0]) cube([1, 1, depth]);
        translate([11, 45, 0]) cube([1, 1, depth]);
        translate([13, 45, 0]) cube([1, 1, depth]);
        translate([14, 45, 0]) cube([1, 1, depth]);
        translate([18, 45, 0]) cube([1, 1, depth]);
        translate([20, 45, 0]) cube([1, 1, depth]);
        translate([21, 45, 0]) cube([1, 1, depth]);
        translate([23, 45, 0]) cube([1, 1, depth]);
        translate([24, 45, 0]) cube([1, 1, depth]);
        translate([25, 45, 0]) cube([1, 1, depth]);
        translate([26, 45, 0]) cube([1, 1, depth]);
        translate([27, 45, 0]) cube([1, 1, depth]);
        translate([30, 45, 0]) cube([1, 1, depth]);
        translate([31, 45, 0]) cube([1, 1, depth]);
        translate([32, 45, 0]) cube([1, 1, depth]);
        translate([33, 45, 0]) cube([1, 1, depth]);
        translate([34, 45, 0]) cube([1, 1, depth]);
        translate([36, 45, 0]) cube([1, 1, depth]);
        translate([37, 45, 0]) cube([1, 1, depth]);
        translate([38, 45, 0]) cube([1, 1, depth]);
        translate([39, 45, 0]) cube([1, 1, depth]);
        translate([40, 45, 0]) cube([1, 1, depth]);
        translate([41, 45, 0]) cube([1, 1, depth]);
        translate([2, 46, 0]) cube([1, 1, depth]);
        translate([11, 46, 0]) cube([1, 1, depth]);
        translate([15, 46, 0]) cube([1, 1, depth]);
        translate([18, 46, 0]) cube([1, 1, depth]);
        translate([20, 46, 0]) cube([1, 1, depth]);
        translate([21, 46, 0]) cube([1, 1, depth]);
        translate([26, 46, 0]) cube([1, 1, depth]);
        translate([27, 46, 0]) cube([1, 1, depth]);
        translate([28, 46, 0]) cube([1, 1, depth]);
        translate([29, 46, 0]) cube([1, 1, depth]);
        translate([30, 46, 0]) cube([1, 1, depth]);
        translate([31, 46, 0]) cube([1, 1, depth]);
        translate([40, 46, 0]) cube([1, 1, depth]);
        translate([41, 46, 0]) cube([1, 1, depth]);
        translate([42, 46, 0]) cube([1, 1, depth]);
        translate([48, 46, 0]) cube([1, 1, depth]);
        translate([2, 47, 0]) cube([1, 1, depth]);
        translate([11, 47, 0]) cube([1, 1, depth]);
        translate([15, 47, 0]) cube([1, 1, depth]);
        translate([18, 47, 0]) cube([1, 1, depth]);
        translate([20, 47, 0]) cube([1, 1, depth]);
        translate([21, 47, 0]) cube([1, 1, depth]);
        translate([26, 47, 0]) cube([1, 1, depth]);
        translate([27, 47, 0]) cube([1, 1, depth]);
        translate([28, 47, 0]) cube([1, 1, depth]);
        translate([29, 47, 0]) cube([1, 1, depth]);
        translate([30, 47, 0]) cube([1, 1, depth]);
        translate([31, 47, 0]) cube([1, 1, depth]);
        translate([40, 47, 0]) cube([1, 1, depth]);
        translate([41, 47, 0]) cube([1, 1, depth]);
        translate([42, 47, 0]) cube([1, 1, depth]);
        translate([48, 47, 0]) cube([1, 1, depth]);
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
        translate([20, 48, 0]) cube([1, 1, depth]);
        translate([21, 48, 0]) cube([1, 1, depth]);
        translate([22, 48, 0]) cube([1, 1, depth]);
        translate([26, 48, 0]) cube([1, 1, depth]);
        translate([27, 48, 0]) cube([1, 1, depth]);
        translate([28, 48, 0]) cube([1, 1, depth]);
        translate([29, 48, 0]) cube([1, 1, depth]);
        translate([32, 48, 0]) cube([1, 1, depth]);
        translate([35, 48, 0]) cube([1, 1, depth]);
        translate([39, 48, 0]) cube([1, 1, depth]);
        translate([42, 48, 0]) cube([1, 1, depth]);
        translate([45, 48, 0]) cube([1, 1, depth]);
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
