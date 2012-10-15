document.documentElement.className += ' cssregions';
// Test
if (Modernizr.regions) {
    document.documentElement.className += ' cssregions-test';
} else {
    document.documentElement.className += ' no-cssregions-test';
}