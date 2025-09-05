// Comprehensive Error Check Script for Nashr Foundation Website
// Run this in the browser console to check for potential issues

console.log('🔍 Starting comprehensive error check...');

// Check for missing images
function checkMissingImages() {
    console.log('📸 Checking for missing images...');
    const images = document.querySelectorAll('img');
    const missingImages = [];
    
    images.forEach(img => {
        // Count only images that have finished attempting to load and failed
        if (img.complete && img.naturalWidth === 0) {
            missingImages.push({
                src: img.src,
                alt: img.alt,
                element: img
            });
        } else {
            // Attach one-time error logger for late-loading images
            img.addEventListener('error', () => {
                console.warn('❌ Image failed to load:', { src: img.src, alt: img.alt });
            }, { once: true });
        }
    });
    
    if (missingImages.length > 0) {
        console.warn('⚠️ Missing or broken images:', missingImages);
        // Attempt graceful fallback to logo for broken images
        missingImages.forEach(item => {
            try {
                if (item.element && item.element.src !== location.origin + '/logo.webp') {
                    item.element.src = 'logo.webp';
                }
            } catch (e) {}
        });
        return false;
    } else {
        console.log('✅ All images loaded successfully');
        return true;
    }
}

// Check for JavaScript errors
function checkJavaScriptErrors() {
    console.log('⚡ Checking for JavaScript errors...');
    
    // Feature-aware checks per page content
    const requiredFunctions = [];
    // Require Chart only if charts are present
    if (document.getElementById('donations-chart') || document.getElementById('payment-methods-chart')) {
        requiredFunctions.push('Chart');
    }
    // Require AOS only if elements declare data-aos
    if (document.querySelector('[data-aos]')) {
        requiredFunctions.push('AOS');
    }
    // Require gtag only if GTM is included
    if (document.querySelector('script[src*="googletagmanager.com"]')) {
        // Treat presence of GTM script or dataLayer as sufficient
        if (!(window.dataLayer && Array.isArray(window.dataLayer))) {
            requiredFunctions.push('gtag');
        }
    }
    
    const missingFunctions = requiredFunctions.filter(func => {
        if (func === 'gtag') return typeof window.gtag === 'undefined';
        return typeof window[func] === 'undefined';
    });
    
    if (missingFunctions.length > 0) {
        console.warn('⚠️ Missing JavaScript functions:', missingFunctions);
        return false;
    } else {
        console.log('✅ All required JavaScript functions available');
        return true;
    }
}

// Check for CSS issues
function checkCSSIssues() {
    console.log('🎨 Checking for CSS issues...');
    
    // Check if critical CSS is loaded
    const criticalCSS = document.querySelector('style');
    if (!criticalCSS) {
        console.warn('⚠️ Critical CSS not found');
        return false;
    }
    
    // Check if main CSS is loaded
    const mainCSS = document.querySelector('link[href*="styles.css"]');
    if (!mainCSS) {
        console.warn('⚠️ Main CSS not loaded');
        return false;
    }
    
    console.log('✅ CSS loaded successfully');
    return true;
}

// Check for accessibility issues
function checkAccessibility() {
    console.log('♿ Checking accessibility...');
    
    let issues = 0;
    
    // Check for alt text on images
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
        console.warn('⚠️ Images without alt text:', imagesWithoutAlt.length);
        issues++;
    }
    
    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let prevLevel = 0;
    headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        if (level > prevLevel + 1) {
            console.warn('⚠️ Skipped heading level:', heading);
            issues++;
        }
        prevLevel = level;
    });
    
    // Check for skip navigation
    const skipLink = document.querySelector('.skip-link');
    if (!skipLink) {
        console.warn('⚠️ Skip navigation link not found');
        issues++;
    }
    
    if (issues === 0) {
        console.log('✅ Accessibility checks passed');
        return true;
    } else {
        console.warn(`⚠️ Found ${issues} accessibility issues`);
        return false;
    }
}

// Check for performance issues
function checkPerformance() {
    console.log('🚀 Checking performance...');
    
    // Check for large images
    const images = document.querySelectorAll('img');
    const largeImages = [];
    
    images.forEach(img => {
        if (img.naturalWidth > 1920 || img.naturalHeight > 1080) {
            largeImages.push({
                src: img.src,
                width: img.naturalWidth,
                height: img.naturalHeight
            });
        }
    });
    
    if (largeImages.length > 0) {
        console.warn('⚠️ Large images detected (consider optimization):', largeImages);
    }
    
    // Check for external resources
    const externalScripts = document.querySelectorAll('script[src^="http"]');
    const externalStyles = document.querySelectorAll('link[href^="http"]');
    
    console.log(`📊 External resources: ${externalScripts.length} scripts, ${externalStyles.length} stylesheets`);
    
    return true;
}

// Check for mobile responsiveness
function checkMobileResponsiveness() {
    console.log('📱 Checking mobile responsiveness...');
    
    // Use matchMedia to respect CSS media queries
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    
    // Check if mobile menu toggle is visible
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileToggle && isMobile) {
        const computedStyle = window.getComputedStyle(mobileToggle);
        // Reduce false positives: consider it an issue only if it's not displayed AND not interactable in layout
        const notDisplayed = computedStyle.display === 'none';
        const notInLayout = mobileToggle.offsetParent === null;
        if (notDisplayed && notInLayout) {
            console.info('ℹ️ Mobile menu toggle appears hidden; verify CSS @media for .mobile-menu-toggle');
        }
    }
    
    console.log('✅ Mobile responsiveness check completed');
    return true;
}

// Check for SEO elements
function checkSEO() {
    console.log('🔍 Checking SEO elements...');
    
    let issues = 0;
    
    // Check meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription || !metaDescription.content) {
        console.warn('⚠️ Meta description missing or empty');
        issues++;
    }
    
    // Check title
    const title = document.title;
    if (!title || title.length < 10 || title.length > 60) {
        console.warn('⚠️ Title length issue:', title.length, 'characters');
        issues++;
    }
    
    // Check canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        console.warn('⚠️ Canonical URL missing');
        issues++;
    }
    
    // Check Open Graph tags
    const ogTags = document.querySelectorAll('meta[property^="og:"]');
    if (ogTags.length === 0) {
        console.warn('⚠️ Open Graph tags missing');
        issues++;
    }
    
    if (issues === 0) {
        console.log('✅ SEO elements check passed');
        return true;
    } else {
        console.warn(`⚠️ Found ${issues} SEO issues`);
        return false;
    }
}

// Check for security headers (if possible)
function checkSecurity() {
    console.log('🔒 Checking security...');
    
    // Check for HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.warn('⚠️ Not using HTTPS');
        return false;
    }
    
    // Check for CSP (Content Security Policy)
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
        console.log('ℹ️ CSP meta tag not found (may be set via headers)');
    }
    
    console.log('✅ Security checks passed');
    return true;
}

// Check for PWA features
function checkPWA() {
    console.log('📱 Checking PWA features...');
    
    let features = 0;
    
    // Check manifest
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) {
        console.log('✅ Web App Manifest found');
        features++;
    }
    
    // Check service worker
    if ('serviceWorker' in navigator) {
        console.log('✅ Service Worker API available');
        features++;
    }
    
    // Check for offline capability
    if ('caches' in window) {
        console.log('✅ Cache API available');
        features++;
    }
    
    console.log(`📊 PWA features: ${features}/3 available`);
    return features > 0;
}

// Main error check function
function runComprehensiveCheck() {
    console.log('🚀 Starting comprehensive website check...\n');
    
    const results = {
        images: checkMissingImages(),
        javascript: checkJavaScriptErrors(),
        css: checkCSSIssues(),
        accessibility: checkAccessibility(),
        performance: checkPerformance(),
        mobile: checkMobileResponsiveness(),
        seo: checkSEO(),
        security: checkSecurity(),
        pwa: checkPWA()
    };
    
    console.log('\n📊 CHECK RESULTS SUMMARY:');
    console.log('========================');
    
    Object.entries(results).forEach(([category, result]) => {
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`${category.toUpperCase()}: ${status}`);
    });
    
    const passedChecks = Object.values(results).filter(Boolean).length;
    const totalChecks = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Score: ${passedChecks}/${totalChecks} (${Math.round((passedChecks/totalChecks)*100)}%)`);
    
    if (passedChecks === totalChecks) {
        console.log('🎉 All checks passed! Your website is ready for production.');
    } else {
        console.log('⚠️ Some checks failed. Please review the warnings above.');
    }
    
    return results;
}

// Auto-run if this script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runComprehensiveCheck);
} else {
    runComprehensiveCheck();
}

// Export for manual use
window.websiteErrorCheck = {
    run: runComprehensiveCheck,
    checkImages: checkMissingImages,
    checkJavaScript: checkJavaScriptErrors,
    checkCSS: checkCSSIssues,
    checkAccessibility: checkAccessibility,
    checkPerformance: checkPerformance,
    checkMobile: checkMobileResponsiveness,
    checkSEO: checkSEO,
    checkSecurity: checkSecurity,
    checkPWA: checkPWA
};

console.log('🔧 Error check script loaded. Use window.websiteErrorCheck.run() to run manually.');
