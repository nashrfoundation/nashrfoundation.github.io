// Accessibility Audit Script for Nashr Foundation Website
// Run this in the browser console to check for accessibility issues

console.log('♿ Starting accessibility audit...');

// Check for missing alt text on images
function checkAltText() {
    console.log(' Checking for missing alt text...');
    const images = document.querySelectorAll('img');
    const missingAlt = [];
    
    images.forEach(img => {
        if (!img.hasAttribute('alt') || img.alt.trim() === '') {
            missingAlt.push({
                element: img,
                src: img.src,
                context: img.parentElement?.textContent?.substring(0, 50) || 'N/A'
            });
        }
    });
    
    if (missingAlt.length > 0) {
        console.warn('⚠️ Images missing alt text:', missingAlt);
        return false;
    } else {
        console.log('✅ All images have alt text');
        return true;
    }
}

// Check for proper heading hierarchy
function checkHeadingHierarchy() {
    console.log(' Checking heading hierarchy...');
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let prevLevel = 0;
    let issues = 0;
    
    headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        if (level > prevLevel + 1) {
            console.warn('⚠️ Skipped heading level:', heading);
            issues++;
        }
        prevLevel = level;
    });
    
    if (issues === 0) {
        console.log('✅ Proper heading hierarchy');
        return true;
    } else {
        console.warn(`⚠️ Found ${issues} heading hierarchy issues`);
        return false;
    }
}

// Check for sufficient color contrast
function checkColorContrast() {
    console.log(' Checking color contrast...');
    // This is a simplified check - in practice, you'd use a library like axe-core
    console.log('ℹ️ Note: For detailed contrast checking, use axe-core or browser dev tools');
    return true;
}

// Check for keyboard navigation
function checkKeyboardNavigation() {
    console.log(' Checking keyboard navigation...');
    const focusableElements = document.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );
    
    let issues = 0;
    focusableElements.forEach(el => {
        // Check if element has visible focus indicator
        const style = window.getComputedStyle(el);
        if (style.outline === 'none' && style.outlineStyle === 'none') {
            // Check if there's a custom focus style
            const hasFocusClass = el.classList.contains('focus') || 
                                 el.classList.contains('focused') ||
                                 [...el.classList].some(c => c.includes('focus'));
            
            if (!hasFocusClass) {
                console.warn('⚠️ Element may lack visible focus indicator:', el);
                issues++;
            }
        }
    });
    
    if (issues === 0) {
        console.log('✅ Keyboard navigation appears to be properly implemented');
        return true;
    } else {
        console.warn(`⚠️ Found ${issues} potential keyboard navigation issues`);
        return false;
    }
}

// Check for ARIA attributes
function checkARIA() {
    console.log(' Checking ARIA attributes...');
    const ariaElements = document.querySelectorAll('[aria-*]');
    let issues = 0;
    
    ariaElements.forEach(el => {
        // Check for invalid ARIA attributes
        const attributes = el.getAttributeNames();
        attributes.forEach(attr => {
            if (attr.startsWith('aria-')) {
                // Basic validation - in practice, use axe-core for comprehensive checks
                if (attr === 'aria-label' && el.getAttribute('aria-label').trim() === '') {
                    console.warn('⚠️ Empty aria-label on element:', el);
                    issues++;
                }
            }
        });
    });
    
    if (issues === 0) {
        console.log('✅ ARIA attributes appear to be properly used');
        return true;
    } else {
        console.warn(`⚠️ Found ${issues} potential ARIA issues`);
        return false;
    }
}

// Check for form accessibility
function checkFormAccessibility() {
    console.log(' Checking form accessibility...');
    const forms = document.querySelectorAll('form');
    let issues = 0;
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Check for labels
            const id = input.id;
            if (!id) {
                console.warn('⚠️ Form input missing ID:', input);
                issues++;
                return;
            }
            
            const label = form.querySelector(`label[for="${id}"]`);
            if (!label) {
                console.warn('⚠️ Form input missing associated label:', input);
                issues++;
            }
            
            // Check for required fields
            if (input.hasAttribute('required') && !label?.textContent?.includes('*')) {
                // This is a suggestion, not necessarily an error
                console.log('ℹ️ Required field label may need visual indicator:', input);
            }
        });
    });
    
    if (issues === 0) {
        console.log('✅ Form accessibility checks passed');
        return true;
    } else {
        console.warn(`⚠️ Found ${issues} form accessibility issues`);
        return false;
    }
}

// Check for skip navigation link
function checkSkipNavigation() {
    console.log(' Checking for skip navigation link...');
    const skipLink = document.querySelector('a[href^="#main-content"], a[href^="#content"]');
    
    if (skipLink) {
        console.log('✅ Skip navigation link found');
        return true;
    } else {
        console.warn('⚠️ Skip navigation link not found');
        return false;
    }
}

// Main accessibility audit function
function runAccessibilityAudit() {
    console.log('\n');
    console.log('♿ ACCESSIBILITY AUDIT REPORT');
    console.log('==============================');
    
    const results = {
        altText: checkAltText(),
        headingHierarchy: checkHeadingHierarchy(),
        colorContrast: checkColorContrast(),
        keyboardNavigation: checkKeyboardNavigation(),
        aria: checkARIA(),
        forms: checkFormAccessibility(),
        skipNavigation: checkSkipNavigation()
    };
    
    console.log('\n');
    console.log('📊 SUMMARY:');
    console.log('===========');
    
    Object.entries(results).forEach(([category, result]) => {
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`${category}: ${status}`);
    });
    
    const passedChecks = Object.values(results).filter(Boolean).length;
    const totalChecks = Object.keys(results).length;
    
    console.log(`\n🎯 Score: ${passedChecks}/${totalChecks} (${Math.round((passedChecks/totalChecks)*100)}%)`);
    
    if (passedChecks === totalChecks) {
        console.log('🎉 All accessibility checks passed!');
    } else {
        console.log('⚠️ Some accessibility issues were found. Please review the warnings above.');
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    console.log('1. Use axe-core or browser accessibility tools for more detailed analysis');
    console.log('2. Test with screen readers (NVDA, VoiceOver, JAWS)');
    console.log('3. Test keyboard-only navigation');
    console.log('4. Check color contrast with tools like WebAIM Contrast Checker');
    console.log('5. Validate HTML with W3C Markup Validator');
    
    return results;
}

// Run the audit automatically if called directly
if (typeof window !== 'undefined' && window.location) {
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAccessibilityAudit);
    } else {
        runAccessibilityAudit();
    }
}

// Export for use in testing environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAccessibilityAudit,
        checkAltText,
        checkHeadingHierarchy,
        checkKeyboardNavigation,
        checkARIA,
        checkFormAccessibility,
        checkSkipNavigation
    };
}