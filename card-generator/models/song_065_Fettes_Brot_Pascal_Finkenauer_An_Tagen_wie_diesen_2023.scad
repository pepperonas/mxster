// mxster Game Card - An Tagen wie diesen
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
song_year = "2023";
song_title_line1 = "An Tagen";
song_title_line2 = "wie diesen";
song_title_is_split = true;
song_artist = "Fettes Brot, Pascal Fi...";

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
        translate([16, 2, 0]) cube([1, 1, depth]);
        translate([17, 2, 0]) cube([1, 1, depth]);
        translate([22, 2, 0]) cube([1, 1, depth]);
        translate([23, 2, 0]) cube([1, 1, depth]);
        translate([24, 2, 0]) cube([1, 1, depth]);
        translate([26, 2, 0]) cube([1, 1, depth]);
        translate([27, 2, 0]) cube([1, 1, depth]);
        translate([28, 2, 0]) cube([1, 1, depth]);
        translate([29, 2, 0]) cube([1, 1, depth]);
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
        translate([19, 3, 0]) cube([1, 1, depth]);
        translate([20, 3, 0]) cube([1, 1, depth]);
        translate([21, 3, 0]) cube([1, 1, depth]);
        translate([23, 3, 0]) cube([1, 1, depth]);
        translate([24, 3, 0]) cube([1, 1, depth]);
        translate([25, 3, 0]) cube([1, 1, depth]);
        translate([26, 3, 0]) cube([1, 1, depth]);
        translate([27, 3, 0]) cube([1, 1, depth]);
        translate([28, 3, 0]) cube([1, 1, depth]);
        translate([29, 3, 0]) cube([1, 1, depth]);
        translate([33, 3, 0]) cube([1, 1, depth]);
        translate([34, 3, 0]) cube([1, 1, depth]);
        translate([35, 3, 0]) cube([1, 1, depth]);
        translate([39, 3, 0]) cube([1, 1, depth]);
        translate([48, 3, 0]) cube([1, 1, depth]);
        translate([2, 4, 0]) cube([1, 1, depth]);
        translate([11, 4, 0]) cube([1, 1, depth]);
        translate([13, 4, 0]) cube([1, 1, depth]);
        translate([14, 4, 0]) cube([1, 1, depth]);
        translate([19, 4, 0]) cube([1, 1, depth]);
        translate([20, 4, 0]) cube([1, 1, depth]);
        translate([21, 4, 0]) cube([1, 1, depth]);
        translate([23, 4, 0]) cube([1, 1, depth]);
        translate([24, 4, 0]) cube([1, 1, depth]);
        translate([25, 4, 0]) cube([1, 1, depth]);
        translate([26, 4, 0]) cube([1, 1, depth]);
        translate([27, 4, 0]) cube([1, 1, depth]);
        translate([28, 4, 0]) cube([1, 1, depth]);
        translate([29, 4, 0]) cube([1, 1, depth]);
        translate([33, 4, 0]) cube([1, 1, depth]);
        translate([34, 4, 0]) cube([1, 1, depth]);
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
        translate([16, 5, 0]) cube([1, 1, depth]);
        translate([17, 5, 0]) cube([1, 1, depth]);
        translate([18, 5, 0]) cube([1, 1, depth]);
        translate([19, 5, 0]) cube([1, 1, depth]);
        translate([23, 5, 0]) cube([1, 1, depth]);
        translate([24, 5, 0]) cube([1, 1, depth]);
        translate([25, 5, 0]) cube([1, 1, depth]);
        translate([28, 5, 0]) cube([1, 1, depth]);
        translate([29, 5, 0]) cube([1, 1, depth]);
        translate([35, 5, 0]) cube([1, 1, depth]);
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
        translate([15, 6, 0]) cube([1, 1, depth]);
        translate([16, 6, 0]) cube([1, 1, depth]);
        translate([17, 6, 0]) cube([1, 1, depth]);
        translate([19, 6, 0]) cube([1, 1, depth]);
        translate([20, 6, 0]) cube([1, 1, depth]);
        translate([21, 6, 0]) cube([1, 1, depth]);
        translate([23, 6, 0]) cube([1, 1, depth]);
        translate([24, 6, 0]) cube([1, 1, depth]);
        translate([26, 6, 0]) cube([1, 1, depth]);
        translate([27, 6, 0]) cube([1, 1, depth]);
        translate([33, 6, 0]) cube([1, 1, depth]);
        translate([34, 6, 0]) cube([1, 1, depth]);
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
        translate([15, 7, 0]) cube([1, 1, depth]);
        translate([16, 7, 0]) cube([1, 1, depth]);
        translate([17, 7, 0]) cube([1, 1, depth]);
        translate([19, 7, 0]) cube([1, 1, depth]);
        translate([20, 7, 0]) cube([1, 1, depth]);
        translate([21, 7, 0]) cube([1, 1, depth]);
        translate([23, 7, 0]) cube([1, 1, depth]);
        translate([24, 7, 0]) cube([1, 1, depth]);
        translate([26, 7, 0]) cube([1, 1, depth]);
        translate([27, 7, 0]) cube([1, 1, depth]);
        translate([33, 7, 0]) cube([1, 1, depth]);
        translate([34, 7, 0]) cube([1, 1, depth]);
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
        translate([13, 8, 0]) cube([1, 1, depth]);
        translate([14, 8, 0]) cube([1, 1, depth]);
        translate([15, 8, 0]) cube([1, 1, depth]);
        translate([18, 8, 0]) cube([1, 1, depth]);
        translate([20, 8, 0]) cube([1, 1, depth]);
        translate([21, 8, 0]) cube([1, 1, depth]);
        translate([28, 8, 0]) cube([1, 1, depth]);
        translate([29, 8, 0]) cube([1, 1, depth]);
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
        translate([15, 9, 0]) cube([1, 1, depth]);
        translate([16, 9, 0]) cube([1, 1, depth]);
        translate([17, 9, 0]) cube([1, 1, depth]);
        translate([29, 9, 0]) cube([1, 1, depth]);
        translate([30, 9, 0]) cube([1, 1, depth]);
        translate([31, 9, 0]) cube([1, 1, depth]);
        translate([35, 9, 0]) cube([1, 1, depth]);
        translate([36, 9, 0]) cube([1, 1, depth]);
        translate([37, 9, 0]) cube([1, 1, depth]);
        translate([39, 9, 0]) cube([1, 1, depth]);
        translate([48, 9, 0]) cube([1, 1, depth]);
        translate([2, 10, 0]) cube([1, 1, depth]);
        translate([11, 10, 0]) cube([1, 1, depth]);
        translate([15, 10, 0]) cube([1, 1, depth]);
        translate([16, 10, 0]) cube([1, 1, depth]);
        translate([17, 10, 0]) cube([1, 1, depth]);
        translate([29, 10, 0]) cube([1, 1, depth]);
        translate([30, 10, 0]) cube([1, 1, depth]);
        translate([31, 10, 0]) cube([1, 1, depth]);
        translate([35, 10, 0]) cube([1, 1, depth]);
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
        translate([20, 12, 0]) cube([1, 1, depth]);
        translate([21, 12, 0]) cube([1, 1, depth]);
        translate([22, 12, 0]) cube([1, 1, depth]);
        translate([25, 12, 0]) cube([1, 1, depth]);
        translate([26, 12, 0]) cube([1, 1, depth]);
        translate([27, 12, 0]) cube([1, 1, depth]);
        translate([28, 12, 0]) cube([1, 1, depth]);
        translate([30, 12, 0]) cube([1, 1, depth]);
        translate([31, 12, 0]) cube([1, 1, depth]);
        translate([32, 12, 0]) cube([1, 1, depth]);
        translate([33, 12, 0]) cube([1, 1, depth]);
        translate([34, 12, 0]) cube([1, 1, depth]);
        translate([36, 12, 0]) cube([1, 1, depth]);
        translate([37, 12, 0]) cube([1, 1, depth]);
        translate([2, 13, 0]) cube([1, 1, depth]);
        translate([5, 13, 0]) cube([1, 1, depth]);
        translate([8, 13, 0]) cube([1, 1, depth]);
        translate([11, 13, 0]) cube([1, 1, depth]);
        translate([15, 13, 0]) cube([1, 1, depth]);
        translate([18, 13, 0]) cube([1, 1, depth]);
        translate([19, 13, 0]) cube([1, 1, depth]);
        translate([20, 13, 0]) cube([1, 1, depth]);
        translate([21, 13, 0]) cube([1, 1, depth]);
        translate([22, 13, 0]) cube([1, 1, depth]);
        translate([23, 13, 0]) cube([1, 1, depth]);
        translate([24, 13, 0]) cube([1, 1, depth]);
        translate([25, 13, 0]) cube([1, 1, depth]);
        translate([26, 13, 0]) cube([1, 1, depth]);
        translate([27, 13, 0]) cube([1, 1, depth]);
        translate([30, 13, 0]) cube([1, 1, depth]);
        translate([31, 13, 0]) cube([1, 1, depth]);
        translate([32, 13, 0]) cube([1, 1, depth]);
        translate([35, 13, 0]) cube([1, 1, depth]);
        translate([36, 13, 0]) cube([1, 1, depth]);
        translate([37, 13, 0]) cube([1, 1, depth]);
        translate([42, 13, 0]) cube([1, 1, depth]);
        translate([46, 13, 0]) cube([1, 1, depth]);
        translate([47, 13, 0]) cube([1, 1, depth]);
        translate([2, 14, 0]) cube([1, 1, depth]);
        translate([5, 14, 0]) cube([1, 1, depth]);
        translate([8, 14, 0]) cube([1, 1, depth]);
        translate([11, 14, 0]) cube([1, 1, depth]);
        translate([15, 14, 0]) cube([1, 1, depth]);
        translate([18, 14, 0]) cube([1, 1, depth]);
        translate([19, 14, 0]) cube([1, 1, depth]);
        translate([20, 14, 0]) cube([1, 1, depth]);
        translate([21, 14, 0]) cube([1, 1, depth]);
        translate([22, 14, 0]) cube([1, 1, depth]);
        translate([23, 14, 0]) cube([1, 1, depth]);
        translate([24, 14, 0]) cube([1, 1, depth]);
        translate([25, 14, 0]) cube([1, 1, depth]);
        translate([26, 14, 0]) cube([1, 1, depth]);
        translate([27, 14, 0]) cube([1, 1, depth]);
        translate([30, 14, 0]) cube([1, 1, depth]);
        translate([31, 14, 0]) cube([1, 1, depth]);
        translate([32, 14, 0]) cube([1, 1, depth]);
        translate([35, 14, 0]) cube([1, 1, depth]);
        translate([36, 14, 0]) cube([1, 1, depth]);
        translate([37, 14, 0]) cube([1, 1, depth]);
        translate([42, 14, 0]) cube([1, 1, depth]);
        translate([46, 14, 0]) cube([1, 1, depth]);
        translate([47, 14, 0]) cube([1, 1, depth]);
        translate([3, 15, 0]) cube([1, 1, depth]);
        translate([4, 15, 0]) cube([1, 1, depth]);
        translate([5, 15, 0]) cube([1, 1, depth]);
        translate([9, 15, 0]) cube([1, 1, depth]);
        translate([10, 15, 0]) cube([1, 1, depth]);
        translate([12, 15, 0]) cube([1, 1, depth]);
        translate([15, 15, 0]) cube([1, 1, depth]);
        translate([16, 15, 0]) cube([1, 1, depth]);
        translate([17, 15, 0]) cube([1, 1, depth]);
        translate([18, 15, 0]) cube([1, 1, depth]);
        translate([19, 15, 0]) cube([1, 1, depth]);
        translate([25, 15, 0]) cube([1, 1, depth]);
        translate([32, 15, 0]) cube([1, 1, depth]);
        translate([33, 15, 0]) cube([1, 1, depth]);
        translate([34, 15, 0]) cube([1, 1, depth]);
        translate([38, 15, 0]) cube([1, 1, depth]);
        translate([39, 15, 0]) cube([1, 1, depth]);
        translate([40, 15, 0]) cube([1, 1, depth]);
        translate([41, 15, 0]) cube([1, 1, depth]);
        translate([2, 16, 0]) cube([1, 1, depth]);
        translate([5, 16, 0]) cube([1, 1, depth]);
        translate([8, 16, 0]) cube([1, 1, depth]);
        translate([9, 16, 0]) cube([1, 1, depth]);
        translate([10, 16, 0]) cube([1, 1, depth]);
        translate([11, 16, 0]) cube([1, 1, depth]);
        translate([12, 16, 0]) cube([1, 1, depth]);
        translate([13, 16, 0]) cube([1, 1, depth]);
        translate([14, 16, 0]) cube([1, 1, depth]);
        translate([19, 16, 0]) cube([1, 1, depth]);
        translate([20, 16, 0]) cube([1, 1, depth]);
        translate([21, 16, 0]) cube([1, 1, depth]);
        translate([26, 16, 0]) cube([1, 1, depth]);
        translate([27, 16, 0]) cube([1, 1, depth]);
        translate([36, 16, 0]) cube([1, 1, depth]);
        translate([37, 16, 0]) cube([1, 1, depth]);
        translate([40, 16, 0]) cube([1, 1, depth]);
        translate([41, 16, 0]) cube([1, 1, depth]);
        translate([45, 16, 0]) cube([1, 1, depth]);
        translate([46, 16, 0]) cube([1, 1, depth]);
        translate([47, 16, 0]) cube([1, 1, depth]);
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
        translate([19, 17, 0]) cube([1, 1, depth]);
        translate([20, 17, 0]) cube([1, 1, depth]);
        translate([21, 17, 0]) cube([1, 1, depth]);
        translate([26, 17, 0]) cube([1, 1, depth]);
        translate([27, 17, 0]) cube([1, 1, depth]);
        translate([36, 17, 0]) cube([1, 1, depth]);
        translate([37, 17, 0]) cube([1, 1, depth]);
        translate([40, 17, 0]) cube([1, 1, depth]);
        translate([41, 17, 0]) cube([1, 1, depth]);
        translate([45, 17, 0]) cube([1, 1, depth]);
        translate([46, 17, 0]) cube([1, 1, depth]);
        translate([47, 17, 0]) cube([1, 1, depth]);
        translate([48, 17, 0]) cube([1, 1, depth]);
        translate([9, 18, 0]) cube([1, 1, depth]);
        translate([10, 18, 0]) cube([1, 1, depth]);
        translate([12, 18, 0]) cube([1, 1, depth]);
        translate([15, 18, 0]) cube([1, 1, depth]);
        translate([16, 18, 0]) cube([1, 1, depth]);
        translate([17, 18, 0]) cube([1, 1, depth]);
        translate([23, 18, 0]) cube([1, 1, depth]);
        translate([24, 18, 0]) cube([1, 1, depth]);
        translate([29, 18, 0]) cube([1, 1, depth]);
        translate([32, 18, 0]) cube([1, 1, depth]);
        translate([36, 18, 0]) cube([1, 1, depth]);
        translate([37, 18, 0]) cube([1, 1, depth]);
        translate([42, 18, 0]) cube([1, 1, depth]);
        translate([48, 18, 0]) cube([1, 1, depth]);
        translate([3, 19, 0]) cube([1, 1, depth]);
        translate([4, 19, 0]) cube([1, 1, depth]);
        translate([6, 19, 0]) cube([1, 1, depth]);
        translate([7, 19, 0]) cube([1, 1, depth]);
        translate([11, 19, 0]) cube([1, 1, depth]);
        translate([13, 19, 0]) cube([1, 1, depth]);
        translate([14, 19, 0]) cube([1, 1, depth]);
        translate([15, 19, 0]) cube([1, 1, depth]);
        translate([16, 19, 0]) cube([1, 1, depth]);
        translate([17, 19, 0]) cube([1, 1, depth]);
        translate([18, 19, 0]) cube([1, 1, depth]);
        translate([19, 19, 0]) cube([1, 1, depth]);
        translate([29, 19, 0]) cube([1, 1, depth]);
        translate([32, 19, 0]) cube([1, 1, depth]);
        translate([35, 19, 0]) cube([1, 1, depth]);
        translate([36, 19, 0]) cube([1, 1, depth]);
        translate([37, 19, 0]) cube([1, 1, depth]);
        translate([38, 19, 0]) cube([1, 1, depth]);
        translate([39, 19, 0]) cube([1, 1, depth]);
        translate([42, 19, 0]) cube([1, 1, depth]);
        translate([43, 19, 0]) cube([1, 1, depth]);
        translate([44, 19, 0]) cube([1, 1, depth]);
        translate([46, 19, 0]) cube([1, 1, depth]);
        translate([47, 19, 0]) cube([1, 1, depth]);
        translate([48, 19, 0]) cube([1, 1, depth]);
        translate([3, 20, 0]) cube([1, 1, depth]);
        translate([4, 20, 0]) cube([1, 1, depth]);
        translate([5, 20, 0]) cube([1, 1, depth]);
        translate([13, 20, 0]) cube([1, 1, depth]);
        translate([14, 20, 0]) cube([1, 1, depth]);
        translate([15, 20, 0]) cube([1, 1, depth]);
        translate([16, 20, 0]) cube([1, 1, depth]);
        translate([17, 20, 0]) cube([1, 1, depth]);
        translate([18, 20, 0]) cube([1, 1, depth]);
        translate([19, 20, 0]) cube([1, 1, depth]);
        translate([20, 20, 0]) cube([1, 1, depth]);
        translate([21, 20, 0]) cube([1, 1, depth]);
        translate([23, 20, 0]) cube([1, 1, depth]);
        translate([24, 20, 0]) cube([1, 1, depth]);
        translate([32, 20, 0]) cube([1, 1, depth]);
        translate([33, 20, 0]) cube([1, 1, depth]);
        translate([34, 20, 0]) cube([1, 1, depth]);
        translate([35, 20, 0]) cube([1, 1, depth]);
        translate([36, 20, 0]) cube([1, 1, depth]);
        translate([37, 20, 0]) cube([1, 1, depth]);
        translate([39, 20, 0]) cube([1, 1, depth]);
        translate([48, 20, 0]) cube([1, 1, depth]);
        translate([3, 21, 0]) cube([1, 1, depth]);
        translate([4, 21, 0]) cube([1, 1, depth]);
        translate([5, 21, 0]) cube([1, 1, depth]);
        translate([13, 21, 0]) cube([1, 1, depth]);
        translate([14, 21, 0]) cube([1, 1, depth]);
        translate([15, 21, 0]) cube([1, 1, depth]);
        translate([16, 21, 0]) cube([1, 1, depth]);
        translate([17, 21, 0]) cube([1, 1, depth]);
        translate([18, 21, 0]) cube([1, 1, depth]);
        translate([19, 21, 0]) cube([1, 1, depth]);
        translate([20, 21, 0]) cube([1, 1, depth]);
        translate([21, 21, 0]) cube([1, 1, depth]);
        translate([23, 21, 0]) cube([1, 1, depth]);
        translate([24, 21, 0]) cube([1, 1, depth]);
        translate([32, 21, 0]) cube([1, 1, depth]);
        translate([33, 21, 0]) cube([1, 1, depth]);
        translate([34, 21, 0]) cube([1, 1, depth]);
        translate([35, 21, 0]) cube([1, 1, depth]);
        translate([36, 21, 0]) cube([1, 1, depth]);
        translate([37, 21, 0]) cube([1, 1, depth]);
        translate([39, 21, 0]) cube([1, 1, depth]);
        translate([48, 21, 0]) cube([1, 1, depth]);
        translate([2, 22, 0]) cube([1, 1, depth]);
        translate([6, 22, 0]) cube([1, 1, depth]);
        translate([7, 22, 0]) cube([1, 1, depth]);
        translate([8, 22, 0]) cube([1, 1, depth]);
        translate([11, 22, 0]) cube([1, 1, depth]);
        translate([12, 22, 0]) cube([1, 1, depth]);
        translate([16, 22, 0]) cube([1, 1, depth]);
        translate([17, 22, 0]) cube([1, 1, depth]);
        translate([18, 22, 0]) cube([1, 1, depth]);
        translate([19, 22, 0]) cube([1, 1, depth]);
        translate([20, 22, 0]) cube([1, 1, depth]);
        translate([21, 22, 0]) cube([1, 1, depth]);
        translate([22, 22, 0]) cube([1, 1, depth]);
        translate([26, 22, 0]) cube([1, 1, depth]);
        translate([27, 22, 0]) cube([1, 1, depth]);
        translate([30, 22, 0]) cube([1, 1, depth]);
        translate([31, 22, 0]) cube([1, 1, depth]);
        translate([33, 22, 0]) cube([1, 1, depth]);
        translate([34, 22, 0]) cube([1, 1, depth]);
        translate([38, 22, 0]) cube([1, 1, depth]);
        translate([43, 22, 0]) cube([1, 1, depth]);
        translate([44, 22, 0]) cube([1, 1, depth]);
        translate([45, 22, 0]) cube([1, 1, depth]);
        translate([46, 22, 0]) cube([1, 1, depth]);
        translate([47, 22, 0]) cube([1, 1, depth]);
        translate([48, 22, 0]) cube([1, 1, depth]);
        translate([3, 23, 0]) cube([1, 1, depth]);
        translate([4, 23, 0]) cube([1, 1, depth]);
        translate([5, 23, 0]) cube([1, 1, depth]);
        translate([6, 23, 0]) cube([1, 1, depth]);
        translate([7, 23, 0]) cube([1, 1, depth]);
        translate([13, 23, 0]) cube([1, 1, depth]);
        translate([14, 23, 0]) cube([1, 1, depth]);
        translate([15, 23, 0]) cube([1, 1, depth]);
        translate([19, 23, 0]) cube([1, 1, depth]);
        translate([23, 23, 0]) cube([1, 1, depth]);
        translate([24, 23, 0]) cube([1, 1, depth]);
        translate([26, 23, 0]) cube([1, 1, depth]);
        translate([27, 23, 0]) cube([1, 1, depth]);
        translate([28, 23, 0]) cube([1, 1, depth]);
        translate([29, 23, 0]) cube([1, 1, depth]);
        translate([32, 23, 0]) cube([1, 1, depth]);
        translate([35, 23, 0]) cube([1, 1, depth]);
        translate([39, 23, 0]) cube([1, 1, depth]);
        translate([40, 23, 0]) cube([1, 1, depth]);
        translate([41, 23, 0]) cube([1, 1, depth]);
        translate([46, 23, 0]) cube([1, 1, depth]);
        translate([47, 23, 0]) cube([1, 1, depth]);
        translate([3, 24, 0]) cube([1, 1, depth]);
        translate([4, 24, 0]) cube([1, 1, depth]);
        translate([5, 24, 0]) cube([1, 1, depth]);
        translate([6, 24, 0]) cube([1, 1, depth]);
        translate([7, 24, 0]) cube([1, 1, depth]);
        translate([13, 24, 0]) cube([1, 1, depth]);
        translate([14, 24, 0]) cube([1, 1, depth]);
        translate([15, 24, 0]) cube([1, 1, depth]);
        translate([19, 24, 0]) cube([1, 1, depth]);
        translate([23, 24, 0]) cube([1, 1, depth]);
        translate([24, 24, 0]) cube([1, 1, depth]);
        translate([26, 24, 0]) cube([1, 1, depth]);
        translate([27, 24, 0]) cube([1, 1, depth]);
        translate([28, 24, 0]) cube([1, 1, depth]);
        translate([29, 24, 0]) cube([1, 1, depth]);
        translate([32, 24, 0]) cube([1, 1, depth]);
        translate([35, 24, 0]) cube([1, 1, depth]);
        translate([39, 24, 0]) cube([1, 1, depth]);
        translate([40, 24, 0]) cube([1, 1, depth]);
        translate([41, 24, 0]) cube([1, 1, depth]);
        translate([46, 24, 0]) cube([1, 1, depth]);
        translate([47, 24, 0]) cube([1, 1, depth]);
        translate([2, 25, 0]) cube([1, 1, depth]);
        translate([3, 25, 0]) cube([1, 1, depth]);
        translate([4, 25, 0]) cube([1, 1, depth]);
        translate([11, 25, 0]) cube([1, 1, depth]);
        translate([15, 25, 0]) cube([1, 1, depth]);
        translate([18, 25, 0]) cube([1, 1, depth]);
        translate([20, 25, 0]) cube([1, 1, depth]);
        translate([21, 25, 0]) cube([1, 1, depth]);
        translate([25, 25, 0]) cube([1, 1, depth]);
        translate([26, 25, 0]) cube([1, 1, depth]);
        translate([27, 25, 0]) cube([1, 1, depth]);
        translate([29, 25, 0]) cube([1, 1, depth]);
        translate([32, 25, 0]) cube([1, 1, depth]);
        translate([36, 25, 0]) cube([1, 1, depth]);
        translate([37, 25, 0]) cube([1, 1, depth]);
        translate([38, 25, 0]) cube([1, 1, depth]);
        translate([39, 25, 0]) cube([1, 1, depth]);
        translate([43, 25, 0]) cube([1, 1, depth]);
        translate([44, 25, 0]) cube([1, 1, depth]);
        translate([45, 25, 0]) cube([1, 1, depth]);
        translate([5, 26, 0]) cube([1, 1, depth]);
        translate([6, 26, 0]) cube([1, 1, depth]);
        translate([7, 26, 0]) cube([1, 1, depth]);
        translate([8, 26, 0]) cube([1, 1, depth]);
        translate([12, 26, 0]) cube([1, 1, depth]);
        translate([13, 26, 0]) cube([1, 1, depth]);
        translate([14, 26, 0]) cube([1, 1, depth]);
        translate([16, 26, 0]) cube([1, 1, depth]);
        translate([17, 26, 0]) cube([1, 1, depth]);
        translate([18, 26, 0]) cube([1, 1, depth]);
        translate([19, 26, 0]) cube([1, 1, depth]);
        translate([20, 26, 0]) cube([1, 1, depth]);
        translate([21, 26, 0]) cube([1, 1, depth]);
        translate([25, 26, 0]) cube([1, 1, depth]);
        translate([26, 26, 0]) cube([1, 1, depth]);
        translate([27, 26, 0]) cube([1, 1, depth]);
        translate([30, 26, 0]) cube([1, 1, depth]);
        translate([31, 26, 0]) cube([1, 1, depth]);
        translate([32, 26, 0]) cube([1, 1, depth]);
        translate([36, 26, 0]) cube([1, 1, depth]);
        translate([37, 26, 0]) cube([1, 1, depth]);
        translate([38, 26, 0]) cube([1, 1, depth]);
        translate([39, 26, 0]) cube([1, 1, depth]);
        translate([40, 26, 0]) cube([1, 1, depth]);
        translate([41, 26, 0]) cube([1, 1, depth]);
        translate([46, 26, 0]) cube([1, 1, depth]);
        translate([47, 26, 0]) cube([1, 1, depth]);
        translate([48, 26, 0]) cube([1, 1, depth]);
        translate([5, 27, 0]) cube([1, 1, depth]);
        translate([6, 27, 0]) cube([1, 1, depth]);
        translate([7, 27, 0]) cube([1, 1, depth]);
        translate([8, 27, 0]) cube([1, 1, depth]);
        translate([12, 27, 0]) cube([1, 1, depth]);
        translate([13, 27, 0]) cube([1, 1, depth]);
        translate([14, 27, 0]) cube([1, 1, depth]);
        translate([16, 27, 0]) cube([1, 1, depth]);
        translate([17, 27, 0]) cube([1, 1, depth]);
        translate([18, 27, 0]) cube([1, 1, depth]);
        translate([19, 27, 0]) cube([1, 1, depth]);
        translate([20, 27, 0]) cube([1, 1, depth]);
        translate([21, 27, 0]) cube([1, 1, depth]);
        translate([25, 27, 0]) cube([1, 1, depth]);
        translate([26, 27, 0]) cube([1, 1, depth]);
        translate([27, 27, 0]) cube([1, 1, depth]);
        translate([30, 27, 0]) cube([1, 1, depth]);
        translate([31, 27, 0]) cube([1, 1, depth]);
        translate([32, 27, 0]) cube([1, 1, depth]);
        translate([36, 27, 0]) cube([1, 1, depth]);
        translate([37, 27, 0]) cube([1, 1, depth]);
        translate([38, 27, 0]) cube([1, 1, depth]);
        translate([39, 27, 0]) cube([1, 1, depth]);
        translate([40, 27, 0]) cube([1, 1, depth]);
        translate([41, 27, 0]) cube([1, 1, depth]);
        translate([46, 27, 0]) cube([1, 1, depth]);
        translate([47, 27, 0]) cube([1, 1, depth]);
        translate([48, 27, 0]) cube([1, 1, depth]);
        translate([6, 28, 0]) cube([1, 1, depth]);
        translate([7, 28, 0]) cube([1, 1, depth]);
        translate([11, 28, 0]) cube([1, 1, depth]);
        translate([12, 28, 0]) cube([1, 1, depth]);
        translate([13, 28, 0]) cube([1, 1, depth]);
        translate([14, 28, 0]) cube([1, 1, depth]);
        translate([15, 28, 0]) cube([1, 1, depth]);
        translate([16, 28, 0]) cube([1, 1, depth]);
        translate([17, 28, 0]) cube([1, 1, depth]);
        translate([25, 28, 0]) cube([1, 1, depth]);
        translate([28, 28, 0]) cube([1, 1, depth]);
        translate([30, 28, 0]) cube([1, 1, depth]);
        translate([31, 28, 0]) cube([1, 1, depth]);
        translate([39, 28, 0]) cube([1, 1, depth]);
        translate([45, 28, 0]) cube([1, 1, depth]);
        translate([46, 28, 0]) cube([1, 1, depth]);
        translate([47, 28, 0]) cube([1, 1, depth]);
        translate([48, 28, 0]) cube([1, 1, depth]);
        translate([2, 29, 0]) cube([1, 1, depth]);
        translate([5, 29, 0]) cube([1, 1, depth]);
        translate([6, 29, 0]) cube([1, 1, depth]);
        translate([7, 29, 0]) cube([1, 1, depth]);
        translate([9, 29, 0]) cube([1, 1, depth]);
        translate([10, 29, 0]) cube([1, 1, depth]);
        translate([12, 29, 0]) cube([1, 1, depth]);
        translate([13, 29, 0]) cube([1, 1, depth]);
        translate([14, 29, 0]) cube([1, 1, depth]);
        translate([16, 29, 0]) cube([1, 1, depth]);
        translate([17, 29, 0]) cube([1, 1, depth]);
        translate([22, 29, 0]) cube([1, 1, depth]);
        translate([26, 29, 0]) cube([1, 1, depth]);
        translate([27, 29, 0]) cube([1, 1, depth]);
        translate([28, 29, 0]) cube([1, 1, depth]);
        translate([30, 29, 0]) cube([1, 1, depth]);
        translate([31, 29, 0]) cube([1, 1, depth]);
        translate([32, 29, 0]) cube([1, 1, depth]);
        translate([35, 29, 0]) cube([1, 1, depth]);
        translate([36, 29, 0]) cube([1, 1, depth]);
        translate([37, 29, 0]) cube([1, 1, depth]);
        translate([38, 29, 0]) cube([1, 1, depth]);
        translate([39, 29, 0]) cube([1, 1, depth]);
        translate([40, 29, 0]) cube([1, 1, depth]);
        translate([41, 29, 0]) cube([1, 1, depth]);
        translate([42, 29, 0]) cube([1, 1, depth]);
        translate([2, 30, 0]) cube([1, 1, depth]);
        translate([3, 30, 0]) cube([1, 1, depth]);
        translate([4, 30, 0]) cube([1, 1, depth]);
        translate([5, 30, 0]) cube([1, 1, depth]);
        translate([9, 30, 0]) cube([1, 1, depth]);
        translate([10, 30, 0]) cube([1, 1, depth]);
        translate([11, 30, 0]) cube([1, 1, depth]);
        translate([16, 30, 0]) cube([1, 1, depth]);
        translate([17, 30, 0]) cube([1, 1, depth]);
        translate([18, 30, 0]) cube([1, 1, depth]);
        translate([25, 30, 0]) cube([1, 1, depth]);
        translate([28, 30, 0]) cube([1, 1, depth]);
        translate([30, 30, 0]) cube([1, 1, depth]);
        translate([31, 30, 0]) cube([1, 1, depth]);
        translate([39, 30, 0]) cube([1, 1, depth]);
        translate([40, 30, 0]) cube([1, 1, depth]);
        translate([41, 30, 0]) cube([1, 1, depth]);
        translate([43, 30, 0]) cube([1, 1, depth]);
        translate([44, 30, 0]) cube([1, 1, depth]);
        translate([46, 30, 0]) cube([1, 1, depth]);
        translate([47, 30, 0]) cube([1, 1, depth]);
        translate([48, 30, 0]) cube([1, 1, depth]);
        translate([2, 31, 0]) cube([1, 1, depth]);
        translate([3, 31, 0]) cube([1, 1, depth]);
        translate([4, 31, 0]) cube([1, 1, depth]);
        translate([5, 31, 0]) cube([1, 1, depth]);
        translate([9, 31, 0]) cube([1, 1, depth]);
        translate([10, 31, 0]) cube([1, 1, depth]);
        translate([11, 31, 0]) cube([1, 1, depth]);
        translate([16, 31, 0]) cube([1, 1, depth]);
        translate([17, 31, 0]) cube([1, 1, depth]);
        translate([18, 31, 0]) cube([1, 1, depth]);
        translate([25, 31, 0]) cube([1, 1, depth]);
        translate([28, 31, 0]) cube([1, 1, depth]);
        translate([30, 31, 0]) cube([1, 1, depth]);
        translate([31, 31, 0]) cube([1, 1, depth]);
        translate([39, 31, 0]) cube([1, 1, depth]);
        translate([40, 31, 0]) cube([1, 1, depth]);
        translate([41, 31, 0]) cube([1, 1, depth]);
        translate([43, 31, 0]) cube([1, 1, depth]);
        translate([44, 31, 0]) cube([1, 1, depth]);
        translate([46, 31, 0]) cube([1, 1, depth]);
        translate([47, 31, 0]) cube([1, 1, depth]);
        translate([48, 31, 0]) cube([1, 1, depth]);
        translate([3, 32, 0]) cube([1, 1, depth]);
        translate([4, 32, 0]) cube([1, 1, depth]);
        translate([8, 32, 0]) cube([1, 1, depth]);
        translate([12, 32, 0]) cube([1, 1, depth]);
        translate([22, 32, 0]) cube([1, 1, depth]);
        translate([23, 32, 0]) cube([1, 1, depth]);
        translate([24, 32, 0]) cube([1, 1, depth]);
        translate([25, 32, 0]) cube([1, 1, depth]);
        translate([28, 32, 0]) cube([1, 1, depth]);
        translate([30, 32, 0]) cube([1, 1, depth]);
        translate([31, 32, 0]) cube([1, 1, depth]);
        translate([33, 32, 0]) cube([1, 1, depth]);
        translate([34, 32, 0]) cube([1, 1, depth]);
        translate([36, 32, 0]) cube([1, 1, depth]);
        translate([37, 32, 0]) cube([1, 1, depth]);
        translate([39, 32, 0]) cube([1, 1, depth]);
        translate([40, 32, 0]) cube([1, 1, depth]);
        translate([41, 32, 0]) cube([1, 1, depth]);
        translate([43, 32, 0]) cube([1, 1, depth]);
        translate([44, 32, 0]) cube([1, 1, depth]);
        translate([45, 32, 0]) cube([1, 1, depth]);
        translate([46, 32, 0]) cube([1, 1, depth]);
        translate([47, 32, 0]) cube([1, 1, depth]);
        translate([48, 32, 0]) cube([1, 1, depth]);
        translate([2, 33, 0]) cube([1, 1, depth]);
        translate([8, 33, 0]) cube([1, 1, depth]);
        translate([11, 33, 0]) cube([1, 1, depth]);
        translate([13, 33, 0]) cube([1, 1, depth]);
        translate([14, 33, 0]) cube([1, 1, depth]);
        translate([16, 33, 0]) cube([1, 1, depth]);
        translate([17, 33, 0]) cube([1, 1, depth]);
        translate([19, 33, 0]) cube([1, 1, depth]);
        translate([23, 33, 0]) cube([1, 1, depth]);
        translate([24, 33, 0]) cube([1, 1, depth]);
        translate([25, 33, 0]) cube([1, 1, depth]);
        translate([32, 33, 0]) cube([1, 1, depth]);
        translate([38, 33, 0]) cube([1, 1, depth]);
        translate([45, 33, 0]) cube([1, 1, depth]);
        translate([46, 33, 0]) cube([1, 1, depth]);
        translate([47, 33, 0]) cube([1, 1, depth]);
        translate([48, 33, 0]) cube([1, 1, depth]);
        translate([2, 34, 0]) cube([1, 1, depth]);
        translate([8, 34, 0]) cube([1, 1, depth]);
        translate([11, 34, 0]) cube([1, 1, depth]);
        translate([13, 34, 0]) cube([1, 1, depth]);
        translate([14, 34, 0]) cube([1, 1, depth]);
        translate([16, 34, 0]) cube([1, 1, depth]);
        translate([17, 34, 0]) cube([1, 1, depth]);
        translate([19, 34, 0]) cube([1, 1, depth]);
        translate([23, 34, 0]) cube([1, 1, depth]);
        translate([24, 34, 0]) cube([1, 1, depth]);
        translate([25, 34, 0]) cube([1, 1, depth]);
        translate([32, 34, 0]) cube([1, 1, depth]);
        translate([38, 34, 0]) cube([1, 1, depth]);
        translate([45, 34, 0]) cube([1, 1, depth]);
        translate([46, 34, 0]) cube([1, 1, depth]);
        translate([47, 34, 0]) cube([1, 1, depth]);
        translate([48, 34, 0]) cube([1, 1, depth]);
        translate([3, 35, 0]) cube([1, 1, depth]);
        translate([4, 35, 0]) cube([1, 1, depth]);
        translate([6, 35, 0]) cube([1, 1, depth]);
        translate([7, 35, 0]) cube([1, 1, depth]);
        translate([9, 35, 0]) cube([1, 1, depth]);
        translate([10, 35, 0]) cube([1, 1, depth]);
        translate([16, 35, 0]) cube([1, 1, depth]);
        translate([17, 35, 0]) cube([1, 1, depth]);
        translate([19, 35, 0]) cube([1, 1, depth]);
        translate([20, 35, 0]) cube([1, 1, depth]);
        translate([21, 35, 0]) cube([1, 1, depth]);
        translate([25, 35, 0]) cube([1, 1, depth]);
        translate([26, 35, 0]) cube([1, 1, depth]);
        translate([27, 35, 0]) cube([1, 1, depth]);
        translate([28, 35, 0]) cube([1, 1, depth]);
        translate([32, 35, 0]) cube([1, 1, depth]);
        translate([33, 35, 0]) cube([1, 1, depth]);
        translate([34, 35, 0]) cube([1, 1, depth]);
        translate([36, 35, 0]) cube([1, 1, depth]);
        translate([37, 35, 0]) cube([1, 1, depth]);
        translate([39, 35, 0]) cube([1, 1, depth]);
        translate([2, 36, 0]) cube([1, 1, depth]);
        translate([6, 36, 0]) cube([1, 1, depth]);
        translate([7, 36, 0]) cube([1, 1, depth]);
        translate([8, 36, 0]) cube([1, 1, depth]);
        translate([11, 36, 0]) cube([1, 1, depth]);
        translate([12, 36, 0]) cube([1, 1, depth]);
        translate([18, 36, 0]) cube([1, 1, depth]);
        translate([19, 36, 0]) cube([1, 1, depth]);
        translate([23, 36, 0]) cube([1, 1, depth]);
        translate([24, 36, 0]) cube([1, 1, depth]);
        translate([26, 36, 0]) cube([1, 1, depth]);
        translate([27, 36, 0]) cube([1, 1, depth]);
        translate([28, 36, 0]) cube([1, 1, depth]);
        translate([30, 36, 0]) cube([1, 1, depth]);
        translate([31, 36, 0]) cube([1, 1, depth]);
        translate([32, 36, 0]) cube([1, 1, depth]);
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
        translate([46, 36, 0]) cube([1, 1, depth]);
        translate([47, 36, 0]) cube([1, 1, depth]);
        translate([48, 36, 0]) cube([1, 1, depth]);
        translate([2, 37, 0]) cube([1, 1, depth]);
        translate([6, 37, 0]) cube([1, 1, depth]);
        translate([7, 37, 0]) cube([1, 1, depth]);
        translate([8, 37, 0]) cube([1, 1, depth]);
        translate([11, 37, 0]) cube([1, 1, depth]);
        translate([12, 37, 0]) cube([1, 1, depth]);
        translate([18, 37, 0]) cube([1, 1, depth]);
        translate([19, 37, 0]) cube([1, 1, depth]);
        translate([23, 37, 0]) cube([1, 1, depth]);
        translate([24, 37, 0]) cube([1, 1, depth]);
        translate([26, 37, 0]) cube([1, 1, depth]);
        translate([27, 37, 0]) cube([1, 1, depth]);
        translate([28, 37, 0]) cube([1, 1, depth]);
        translate([30, 37, 0]) cube([1, 1, depth]);
        translate([31, 37, 0]) cube([1, 1, depth]);
        translate([32, 37, 0]) cube([1, 1, depth]);
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
        translate([46, 37, 0]) cube([1, 1, depth]);
        translate([47, 37, 0]) cube([1, 1, depth]);
        translate([48, 37, 0]) cube([1, 1, depth]);
        translate([13, 38, 0]) cube([1, 1, depth]);
        translate([14, 38, 0]) cube([1, 1, depth]);
        translate([18, 38, 0]) cube([1, 1, depth]);
        translate([19, 38, 0]) cube([1, 1, depth]);
        translate([20, 38, 0]) cube([1, 1, depth]);
        translate([21, 38, 0]) cube([1, 1, depth]);
        translate([22, 38, 0]) cube([1, 1, depth]);
        translate([25, 38, 0]) cube([1, 1, depth]);
        translate([30, 38, 0]) cube([1, 1, depth]);
        translate([31, 38, 0]) cube([1, 1, depth]);
        translate([32, 38, 0]) cube([1, 1, depth]);
        translate([33, 38, 0]) cube([1, 1, depth]);
        translate([34, 38, 0]) cube([1, 1, depth]);
        translate([35, 38, 0]) cube([1, 1, depth]);
        translate([36, 38, 0]) cube([1, 1, depth]);
        translate([37, 38, 0]) cube([1, 1, depth]);
        translate([42, 38, 0]) cube([1, 1, depth]);
        translate([43, 38, 0]) cube([1, 1, depth]);
        translate([44, 38, 0]) cube([1, 1, depth]);
        translate([48, 38, 0]) cube([1, 1, depth]);
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
        translate([16, 39, 0]) cube([1, 1, depth]);
        translate([17, 39, 0]) cube([1, 1, depth]);
        translate([18, 39, 0]) cube([1, 1, depth]);
        translate([25, 39, 0]) cube([1, 1, depth]);
        translate([26, 39, 0]) cube([1, 1, depth]);
        translate([27, 39, 0]) cube([1, 1, depth]);
        translate([35, 39, 0]) cube([1, 1, depth]);
        translate([36, 39, 0]) cube([1, 1, depth]);
        translate([37, 39, 0]) cube([1, 1, depth]);
        translate([39, 39, 0]) cube([1, 1, depth]);
        translate([42, 39, 0]) cube([1, 1, depth]);
        translate([45, 39, 0]) cube([1, 1, depth]);
        translate([48, 39, 0]) cube([1, 1, depth]);
        translate([2, 40, 0]) cube([1, 1, depth]);
        translate([11, 40, 0]) cube([1, 1, depth]);
        translate([15, 40, 0]) cube([1, 1, depth]);
        translate([16, 40, 0]) cube([1, 1, depth]);
        translate([17, 40, 0]) cube([1, 1, depth]);
        translate([18, 40, 0]) cube([1, 1, depth]);
        translate([23, 40, 0]) cube([1, 1, depth]);
        translate([24, 40, 0]) cube([1, 1, depth]);
        translate([25, 40, 0]) cube([1, 1, depth]);
        translate([29, 40, 0]) cube([1, 1, depth]);
        translate([32, 40, 0]) cube([1, 1, depth]);
        translate([33, 40, 0]) cube([1, 1, depth]);
        translate([34, 40, 0]) cube([1, 1, depth]);
        translate([36, 40, 0]) cube([1, 1, depth]);
        translate([37, 40, 0]) cube([1, 1, depth]);
        translate([42, 40, 0]) cube([1, 1, depth]);
        translate([48, 40, 0]) cube([1, 1, depth]);
        translate([2, 41, 0]) cube([1, 1, depth]);
        translate([11, 41, 0]) cube([1, 1, depth]);
        translate([15, 41, 0]) cube([1, 1, depth]);
        translate([16, 41, 0]) cube([1, 1, depth]);
        translate([17, 41, 0]) cube([1, 1, depth]);
        translate([18, 41, 0]) cube([1, 1, depth]);
        translate([23, 41, 0]) cube([1, 1, depth]);
        translate([24, 41, 0]) cube([1, 1, depth]);
        translate([25, 41, 0]) cube([1, 1, depth]);
        translate([29, 41, 0]) cube([1, 1, depth]);
        translate([32, 41, 0]) cube([1, 1, depth]);
        translate([33, 41, 0]) cube([1, 1, depth]);
        translate([34, 41, 0]) cube([1, 1, depth]);
        translate([36, 41, 0]) cube([1, 1, depth]);
        translate([37, 41, 0]) cube([1, 1, depth]);
        translate([42, 41, 0]) cube([1, 1, depth]);
        translate([48, 41, 0]) cube([1, 1, depth]);
        translate([2, 42, 0]) cube([1, 1, depth]);
        translate([5, 42, 0]) cube([1, 1, depth]);
        translate([6, 42, 0]) cube([1, 1, depth]);
        translate([7, 42, 0]) cube([1, 1, depth]);
        translate([8, 42, 0]) cube([1, 1, depth]);
        translate([11, 42, 0]) cube([1, 1, depth]);
        translate([13, 42, 0]) cube([1, 1, depth]);
        translate([14, 42, 0]) cube([1, 1, depth]);
        translate([18, 42, 0]) cube([1, 1, depth]);
        translate([19, 42, 0]) cube([1, 1, depth]);
        translate([20, 42, 0]) cube([1, 1, depth]);
        translate([21, 42, 0]) cube([1, 1, depth]);
        translate([29, 42, 0]) cube([1, 1, depth]);
        translate([36, 42, 0]) cube([1, 1, depth]);
        translate([37, 42, 0]) cube([1, 1, depth]);
        translate([38, 42, 0]) cube([1, 1, depth]);
        translate([39, 42, 0]) cube([1, 1, depth]);
        translate([40, 42, 0]) cube([1, 1, depth]);
        translate([41, 42, 0]) cube([1, 1, depth]);
        translate([42, 42, 0]) cube([1, 1, depth]);
        translate([43, 42, 0]) cube([1, 1, depth]);
        translate([44, 42, 0]) cube([1, 1, depth]);
        translate([46, 42, 0]) cube([1, 1, depth]);
        translate([47, 42, 0]) cube([1, 1, depth]);
        translate([2, 43, 0]) cube([1, 1, depth]);
        translate([5, 43, 0]) cube([1, 1, depth]);
        translate([6, 43, 0]) cube([1, 1, depth]);
        translate([7, 43, 0]) cube([1, 1, depth]);
        translate([8, 43, 0]) cube([1, 1, depth]);
        translate([11, 43, 0]) cube([1, 1, depth]);
        translate([15, 43, 0]) cube([1, 1, depth]);
        translate([20, 43, 0]) cube([1, 1, depth]);
        translate([21, 43, 0]) cube([1, 1, depth]);
        translate([23, 43, 0]) cube([1, 1, depth]);
        translate([24, 43, 0]) cube([1, 1, depth]);
        translate([29, 43, 0]) cube([1, 1, depth]);
        translate([30, 43, 0]) cube([1, 1, depth]);
        translate([31, 43, 0]) cube([1, 1, depth]);
        translate([32, 43, 0]) cube([1, 1, depth]);
        translate([35, 43, 0]) cube([1, 1, depth]);
        translate([42, 43, 0]) cube([1, 1, depth]);
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
        translate([15, 44, 0]) cube([1, 1, depth]);
        translate([20, 44, 0]) cube([1, 1, depth]);
        translate([21, 44, 0]) cube([1, 1, depth]);
        translate([23, 44, 0]) cube([1, 1, depth]);
        translate([24, 44, 0]) cube([1, 1, depth]);
        translate([29, 44, 0]) cube([1, 1, depth]);
        translate([30, 44, 0]) cube([1, 1, depth]);
        translate([31, 44, 0]) cube([1, 1, depth]);
        translate([32, 44, 0]) cube([1, 1, depth]);
        translate([35, 44, 0]) cube([1, 1, depth]);
        translate([42, 44, 0]) cube([1, 1, depth]);
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
        translate([15, 45, 0]) cube([1, 1, depth]);
        translate([16, 45, 0]) cube([1, 1, depth]);
        translate([17, 45, 0]) cube([1, 1, depth]);
        translate([18, 45, 0]) cube([1, 1, depth]);
        translate([20, 45, 0]) cube([1, 1, depth]);
        translate([21, 45, 0]) cube([1, 1, depth]);
        translate([22, 45, 0]) cube([1, 1, depth]);
        translate([26, 45, 0]) cube([1, 1, depth]);
        translate([27, 45, 0]) cube([1, 1, depth]);
        translate([30, 45, 0]) cube([1, 1, depth]);
        translate([31, 45, 0]) cube([1, 1, depth]);
        translate([36, 45, 0]) cube([1, 1, depth]);
        translate([37, 45, 0]) cube([1, 1, depth]);
        translate([38, 45, 0]) cube([1, 1, depth]);
        translate([42, 45, 0]) cube([1, 1, depth]);
        translate([48, 45, 0]) cube([1, 1, depth]);
        translate([2, 46, 0]) cube([1, 1, depth]);
        translate([11, 46, 0]) cube([1, 1, depth]);
        translate([19, 46, 0]) cube([1, 1, depth]);
        translate([22, 46, 0]) cube([1, 1, depth]);
        translate([23, 46, 0]) cube([1, 1, depth]);
        translate([24, 46, 0]) cube([1, 1, depth]);
        translate([26, 46, 0]) cube([1, 1, depth]);
        translate([27, 46, 0]) cube([1, 1, depth]);
        translate([28, 46, 0]) cube([1, 1, depth]);
        translate([32, 46, 0]) cube([1, 1, depth]);
        translate([36, 46, 0]) cube([1, 1, depth]);
        translate([37, 46, 0]) cube([1, 1, depth]);
        translate([38, 46, 0]) cube([1, 1, depth]);
        translate([42, 46, 0]) cube([1, 1, depth]);
        translate([46, 46, 0]) cube([1, 1, depth]);
        translate([47, 46, 0]) cube([1, 1, depth]);
        translate([2, 47, 0]) cube([1, 1, depth]);
        translate([11, 47, 0]) cube([1, 1, depth]);
        translate([19, 47, 0]) cube([1, 1, depth]);
        translate([22, 47, 0]) cube([1, 1, depth]);
        translate([23, 47, 0]) cube([1, 1, depth]);
        translate([24, 47, 0]) cube([1, 1, depth]);
        translate([26, 47, 0]) cube([1, 1, depth]);
        translate([27, 47, 0]) cube([1, 1, depth]);
        translate([28, 47, 0]) cube([1, 1, depth]);
        translate([32, 47, 0]) cube([1, 1, depth]);
        translate([36, 47, 0]) cube([1, 1, depth]);
        translate([37, 47, 0]) cube([1, 1, depth]);
        translate([38, 47, 0]) cube([1, 1, depth]);
        translate([42, 47, 0]) cube([1, 1, depth]);
        translate([46, 47, 0]) cube([1, 1, depth]);
        translate([47, 47, 0]) cube([1, 1, depth]);
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
        translate([19, 48, 0]) cube([1, 1, depth]);
        translate([26, 48, 0]) cube([1, 1, depth]);
        translate([27, 48, 0]) cube([1, 1, depth]);
        translate([29, 48, 0]) cube([1, 1, depth]);
        translate([30, 48, 0]) cube([1, 1, depth]);
        translate([31, 48, 0]) cube([1, 1, depth]);
        translate([32, 48, 0]) cube([1, 1, depth]);
        translate([36, 48, 0]) cube([1, 1, depth]);
        translate([37, 48, 0]) cube([1, 1, depth]);
        translate([38, 48, 0]) cube([1, 1, depth]);
        translate([39, 48, 0]) cube([1, 1, depth]);
        translate([42, 48, 0]) cube([1, 1, depth]);
        translate([43, 48, 0]) cube([1, 1, depth]);
        translate([44, 48, 0]) cube([1, 1, depth]);
        translate([45, 48, 0]) cube([1, 1, depth]);
        translate([46, 48, 0]) cube([1, 1, depth]);
        translate([47, 48, 0]) cube([1, 1, depth]);
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
