// Mobile UI/UX Enhancement Scripts for Nashr Foundation
// Improves touch interactions, animations, and user experience on mobile devices

class MobileEnhancements {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.isTouch = 'ontouchstart' in window;
        this.init();
    }
    
    init() {
        console.log('Initializing mobile enhancements...');
        
        this.setupTouchInteractions();
        this.setupSmoothScrolling();
        this.setupFormEnhancements();
        this.setupNavigationImprovements();
        this.setupPerformanceOptimizations();
        this.setupAccessibilityFeatures();
        this.ensureHeroAtTopOnMobile();
        
        console.log('✅ Mobile enhancements initialized');
    }
    
    // Enhanced touch interactions
    setupTouchInteractions() {
        if (!this.isTouch) return;
        
        // Add touch feedback to buttons
        const buttons = document.querySelectorAll('.btn, .amount-option, .donation-tab');
        buttons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                button.style.transform = 'scale(0.98)';
                button.style.transition = 'transform 0.1s ease';
            });
            
            button.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    button.style.transform = '';
                }, 100);
            });
        });
        
        // Enhanced form field interactions
        const formControls = document.querySelectorAll('.form-control');
        formControls.forEach(control => {
            control.addEventListener('focus', () => {
                control.parentElement.classList.add('focused');
            });
            
            control.addEventListener('blur', () => {
                control.parentElement.classList.remove('focused');
            });
        });
    }

    // Make sure hero is visible on initial load on mobile
    ensureHeroAtTopOnMobile() {
        if (!this.isMobile) return;
        // Scroll to top after small delay to avoid any previous scroll restoration
        setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
        }, 50);
        // If parallax exists, reduce intensity on mobile
        if (window.setParallaxSpeed) {
            try { window.setParallaxSpeed(0.2); } catch (_) {}
        }
    }
    
    // Smooth scrolling with momentum
    setupSmoothScrolling() {
        if (!this.isMobile) return;
        
        // Add momentum scrolling to containers
        const scrollableElements = document.querySelectorAll('.container, .aims-grid, .leaderboard-table');
        scrollableElements.forEach(element => {
            element.style.webkitOverflowScrolling = 'touch';
        });
        
        // Smooth scroll to sections
        const navLinks = document.querySelectorAll('a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('header').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    // Enhanced form interactions
    setupFormEnhancements() {
        if (!this.isMobile) return;
        
        // Auto-focus next field on mobile
        const formFields = document.querySelectorAll('.form-control');
        formFields.forEach((field, index) => {
            field.addEventListener('input', () => {
                // Auto-advance to next field if current is complete
                if (field.value.length >= field.maxLength && field.maxLength > 0) {
                    const nextField = formFields[index + 1];
                    if (nextField) {
                        nextField.focus();
                    }
                }
            });
        });
        
        // Enhanced amount selection
        const amountOptions = document.querySelectorAll('.amount-option');
        amountOptions.forEach(option => {
            option.addEventListener('touchstart', (e) => {
                e.preventDefault();
                option.click();
            });
        });
        
        // Better keyboard handling for forms
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('form-control')) {
                const form = e.target.closest('form');
                if (form) {
                    const submitButton = form.querySelector('button[type="submit"]');
                    if (submitButton) {
                        submitButton.click();
                    }
                }
            }
        });
    }
    
    // Improved navigation
    setupNavigationImprovements() {
        if (!this.isMobile) return;
        
        // Enhanced existing navigation and mobile drawer
        const nav = document.querySelector('nav');
        const navLinks = document.querySelectorAll('.nav-btn');
        const toggle = document.querySelector('.mobile-menu-toggle');
        const drawer = document.getElementById('mobile-drawer');
        const overlay = document.querySelector('.drawer-overlay');
        
        if (nav) {
            // Add haptic feedback to navigation
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (navigator.vibrate) {
                        navigator.vibrate(30); // 30ms vibration
                    }
                });
            });
            
            // Enhanced navigation interactions
            navLinks.forEach(link => {
                link.addEventListener('touchstart', (e) => {
                    link.style.transform = 'scale(0.98)';
                    link.style.transition = 'transform 0.1s ease';
                });
                
                link.addEventListener('touchend', (e) => {
                    setTimeout(() => {
                        link.style.transform = '';
                    }, 100);
                });
            });
        }

        // Drawer toggle
        if (toggle && drawer && overlay) {
            const open = () => {
                document.documentElement.classList.add('drawer-open');
                toggle.setAttribute('aria-expanded', 'true');
                drawer.setAttribute('aria-hidden', 'false');
            };
            const close = () => {
                document.documentElement.classList.remove('drawer-open');
                toggle.setAttribute('aria-expanded', 'false');
                drawer.setAttribute('aria-hidden', 'true');
            };
            toggle.addEventListener('click', () => {
                const expanded = toggle.getAttribute('aria-expanded') === 'true';
                if (expanded) close(); else open();
            });
            overlay.addEventListener('click', close);
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') close();
            });
            drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
        }

        // Ensure hamburger only visible on mobile & at right side
        if (toggle) {
            const container = document.querySelector('header .container');
            if (container && !container.contains(toggle)) {
                container.appendChild(toggle);
            }
        }
    }
    
    // Performance optimizations
    setupPerformanceOptimizations() {
        if (!this.isMobile) return;
        
        // Lazy load images
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
        
        // Optimize scroll performance
        let ticking = false;
        const optimizedScrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    // Handle scroll-based animations here
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    }
    
    // Accessibility improvements
    setupAccessibilityFeatures() {
        if (!this.isMobile) return;
        
        // Enhanced focus management
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        // Add visible focus indicators
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.style.outline = '3px solid var(--primary)';
                element.style.outlineOffset = '2px';
            });
            
            element.addEventListener('blur', () => {
                element.style.outline = '';
                element.style.outlineOffset = '';
            });
        });
        
        // Announce form validation errors
        const form = document.querySelector('#donation-form');
        if (form) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        const errorMessages = form.querySelectorAll('.error-message, .validation-message');
                        errorMessages.forEach(error => {
                            if (error.getAttribute('aria-live') !== 'polite') {
                                error.setAttribute('aria-live', 'polite');
                                error.setAttribute('role', 'alert');
                            }
                        });
                    }
                });
            });
            
            observer.observe(form, { childList: true, subtree: true });
        }
    }
    
    // Utility methods
    isLowEndDevice() {
        return navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2;
    }
    
    reduceAnimations() {
        if (this.isLowEndDevice() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--transition-fast', '0.01ms');
            document.documentElement.style.setProperty('--transition-medium', '0.01ms');
            document.documentElement.style.setProperty('--transition-slow', '0.01ms');
        }
    }
}

// Initialize mobile enhancements when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileEnhancements = new MobileEnhancements();
    });
} else {
    window.mobileEnhancements = new MobileEnhancements();
}

// Handle orientation changes
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (window.mobileEnhancements) {
            window.mobileEnhancements.init();
        }
    }, 100);
});

// Handle resize events
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.mobileEnhancements) {
            window.mobileEnhancements.isMobile = window.innerWidth <= 768;
        }
    }, 250);
});
