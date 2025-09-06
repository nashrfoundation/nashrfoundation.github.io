/**
 * Desktop & Laptop Enhancements for Nashr Foundation
 * Advanced desktop interactions, keyboard navigation, and large screen optimizations
 */

class DesktopEnhancements {
    constructor() {
        this.isDesktop = window.innerWidth >= 1024;
        this.isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        this.keyboardShortcutsVisible = false;
        this.scrollProgress = 0;
        this.parallaxElements = [];
        
        this.init();
    }

    init() {
        if (this.isDesktop) {
            this.setupDesktopFeatures();
        }
        
        if (this.isTablet || this.isDesktop) {
            this.setupTabletFeatures();
        }
        
        this.setupKeyboardNavigation();
        this.setupScrollProgress();
        this.setupParallaxEffects();
        this.setupDesktopLoading();
        this.setupTooltips();
        this.setupDesktopAnimations();
    }

    // Desktop-specific features
    setupDesktopFeatures() {
        // Enhanced hover effects
        this.setupDesktopHoverEffects();
        
        // Desktop navigation enhancements
        this.setupDesktopNavigation();
        
        // Desktop form enhancements
        this.setupDesktopForms();
        
        // Desktop card interactions
        this.setupDesktopCards();
        
        // Desktop social icons
        this.setupDesktopSocialIcons();
    }

    setupDesktopHoverEffects() {
        // Enhanced button hover effects
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 10px 25px rgba(42, 141, 156, 0.4)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '';
            });
        });

        // Enhanced card hover effects
        const cards = document.querySelectorAll('.aim-item, .involvement-option');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '';
            });
        });
    }

    setupDesktopNavigation() {
        const navLinks = document.querySelectorAll('nav ul li a');
        
        navLinks.forEach(link => {
            // Add shimmer effect on hover
            link.addEventListener('mouseenter', () => {
                const shimmer = link.querySelector('::before');
                if (shimmer) {
                    shimmer.style.left = '100%';
                }
            });
            
            link.addEventListener('mouseleave', () => {
                const shimmer = link.querySelector('::before');
                if (shimmer) {
                    shimmer.style.left = '-100%';
                }
            });
        });
    }

    setupDesktopForms() {
        const formControls = document.querySelectorAll('.form-control');
        
        formControls.forEach(control => {
            control.addEventListener('focus', () => {
                control.style.transform = 'scale(1.02)';
                control.style.boxShadow = '0 0 0 3px rgba(42, 141, 156, 0.2)';
            });
            
            control.addEventListener('blur', () => {
                control.style.transform = 'scale(1)';
                control.style.boxShadow = '';
            });
        });
    }

    setupDesktopCards() {
        const leaderboardRows = document.querySelectorAll('.leaderboard-table tbody tr');
        
        leaderboardRows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                row.style.background = 'linear-gradient(90deg, rgba(42, 141, 156, 0.1), rgba(13, 105, 115, 0.1))';
                row.style.transform = 'scale(1.01)';
            });
            
            row.addEventListener('mouseleave', () => {
                row.style.background = '';
                row.style.transform = 'scale(1)';
            });
        });
    }

    setupDesktopSocialIcons() {
        const socialIcons = document.querySelectorAll('.social-icons a img');
        
        socialIcons.forEach(icon => {
            icon.addEventListener('mouseenter', () => {
                icon.style.transform = 'scale(1.2) rotate(5deg)';
                icon.style.filter = 'brightness(1.3) drop-shadow(0 5px 15px rgba(42, 141, 156, 0.5))';
            });
            
            icon.addEventListener('mouseleave', () => {
                icon.style.transform = 'scale(1) rotate(0deg)';
                icon.style.filter = '';
            });
        });
    }

    // Tablet-specific features
    setupTabletFeatures() {
        // iPad navigation
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileMenuToggle && this.isTablet) {
            mobileMenuToggle.style.display = 'none';
        }

        // Tablet-optimized touch targets
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            if (this.isTablet) {
                button.style.minHeight = '52px';
                button.style.fontSize = '1.1rem';
                button.style.padding = 'var(--spacing-lg) var(--spacing-xl)';
            }
        });

        // Tablet form optimizations
        const formControls = document.querySelectorAll('.form-control');
        formControls.forEach(control => {
            if (this.isTablet) {
                control.style.fontSize = '1.1rem';
                control.style.padding = 'var(--spacing-lg)';
            }
        });
    }

    // Keyboard navigation
    setupKeyboardNavigation() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Toggle keyboard shortcuts help
            if (e.key === '?' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                this.toggleKeyboardShortcuts();
            }
            
            // Navigation shortcuts
            if (e.altKey && !e.ctrlKey && !e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case 'h':
                        e.preventDefault();
                        this.navigateToSection('#hero');
                        break;
                    case 'a':
                        e.preventDefault();
                        this.navigateToSection('#aims');
                        break;
                    case 'l':
                        e.preventDefault();
                        this.navigateToSection('#leaderboard');
                        break;
                    case 'g':
                        e.preventDefault();
                        this.navigateToSection('#get-involved');
                        break;
                    case 'd':
                        e.preventDefault();
                        window.location.href = 'donate.html';
                        break;
                    case 'arrowup':
                        e.preventDefault();
                        this.scrollToTop();
                        break;
                }
            }
        });

        // Enhanced focus management
        this.setupFocusManagement();
    }

    setupFocusManagement() {
        // Skip link functionality
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(skipLink.getAttribute('href'));
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Enhanced focus indicators
        const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]');
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.style.outline = '3px solid var(--primary)';
                element.style.outlineOffset = '2px';
                element.style.boxShadow = '0 0 0 6px rgba(42, 141, 156, 0.2)';
            });
            
            element.addEventListener('blur', () => {
                element.style.outline = '';
                element.style.outlineOffset = '';
                element.style.boxShadow = '';
            });
        });
    }

    toggleKeyboardShortcuts() {
        const shortcutsPanel = document.getElementById('keyboardShortcuts');
        if (shortcutsPanel) {
            this.keyboardShortcutsVisible = !this.keyboardShortcutsVisible;
            shortcutsPanel.classList.toggle('show', this.keyboardShortcutsVisible);
        }
    }

    navigateToSection(sectionId) {
        const section = document.querySelector(sectionId);
        if (section) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const targetPosition = section.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Scroll progress indicator
    setupScrollProgress() {
        const scrollProgress = document.getElementById('scrollProgress');
        if (!scrollProgress) return;

        const updateScrollProgress = () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.body.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            
            scrollProgress.style.width = scrollPercent + '%';
        };

        window.addEventListener('scroll', this.throttle(updateScrollProgress, 10));
    }

    // Parallax effects
    setupParallaxEffects() {
        if (!this.isDesktop) return;

        const heroImage = document.querySelector('.hero-image img');
        if (heroImage) {
            this.parallaxElements.push({
                element: heroImage,
                speed: 0.5
            });
        }

        const updateParallax = () => {
            const scrollTop = window.pageYOffset;
            
            this.parallaxElements.forEach(item => {
                const yPos = -(scrollTop * item.speed);
                item.element.style.transform = `translateY(${yPos}px) scale(1.1)`;
            });
        };

        window.addEventListener('scroll', this.throttle(updateParallax, 10));
    }

    // Desktop loading
    setupDesktopLoading() {
        if (!this.isDesktop) return;

        const desktopLoading = document.getElementById('desktopLoading');
        if (!desktopLoading) return;

        // Show loading on page load
        desktopLoading.classList.add('active');

        // Hide loading when page is fully loaded
        window.addEventListener('load', () => {
            setTimeout(() => {
                desktopLoading.classList.remove('active');
            }, 1000);
        });
    }

    // Tooltips
    setupTooltips() {
        if (!this.isDesktop) return;

        const tooltipElements = document.querySelectorAll('.tooltip');
        
        tooltipElements.forEach(element => {
            const tooltip = element.querySelector('.tooltiptext');
            if (!tooltip) return;

            element.addEventListener('mouseenter', () => {
                tooltip.style.visibility = 'visible';
                tooltip.style.opacity = '1';
            });
            
            element.addEventListener('mouseleave', () => {
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
            });
        });
    }

    // Desktop animations
    setupDesktopAnimations() {
        if (!this.isDesktop) return;

        // Staggered animations for cards
        const cards = document.querySelectorAll('.aim-item, .involvement-option');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });

        // Enhanced scroll animations
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                }
            });
        }, observerOptions);

        const animateElements = document.querySelectorAll('.aim-item, .involvement-option, .leaderboard-table');
        animateElements.forEach(el => observer.observe(el));
    }

    // Utility methods
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Handle window resize
    handleResize() {
        const newIsDesktop = window.innerWidth >= 1024;
        const newIsTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        
        if (newIsDesktop !== this.isDesktop) {
            this.isDesktop = newIsDesktop;
            if (this.isDesktop) {
                this.setupDesktopFeatures();
            }
        }
        
        if (newIsTablet !== this.isTablet) {
            this.isTablet = newIsTablet;
            if (this.isTablet) {
                this.setupTabletFeatures();
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DesktopEnhancements();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.desktopEnhancements) {
            window.desktopEnhancements.handleResize();
        }
    });
});

// Export for global access
window.DesktopEnhancements = DesktopEnhancements;
