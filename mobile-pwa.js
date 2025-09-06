/**
 * Mobile & PWA Enhancements for Nashr Foundation
 * Advanced mobile interactions, swipe gestures, and PWA features
 */

class MobilePWAEnhancements {
    constructor() {
        this.currentSection = 0;
        this.sections = [];
        this.isScrolling = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.deferredPrompt = null;
        this.isInstalled = false;
        
        this.init();
    }

    init() {
        this.setupSections();
        this.setupMobileNavigation();
        this.setupSwipeGestures();
        this.setupTouchInteractions();
        this.setupPWAFeatures();
        this.setupSmoothTransitions();
        this.setupMobileAnimations();
        this.setupScrollSnap();
    }

    // Section Management
    setupSections() {
        this.sections = document.querySelectorAll('section[id]');
        this.updateSwipeIndicators();
        
        // Add mobile classes to sections
        this.sections.forEach((section, index) => {
            section.classList.add('mobile-fade-up');
            if (index === 0) {
                section.classList.add('visible');
            }
        });
    }

    // Mobile Navigation
    setupMobileNavigation() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileNav = document.getElementById('mobileNav');
        const mobileNavOverlay = document.getElementById('mobileNavOverlay');
        const mobileNavClose = document.getElementById('mobileNavClose');
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

        // Toggle mobile menu
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileNav();
            });
        }

        // Close mobile menu
        if (mobileNavClose) {
            mobileNavClose.addEventListener('click', () => {
                this.closeMobileNav();
            });
        }

        // Close on overlay click
        if (mobileNavOverlay) {
            mobileNavOverlay.addEventListener('click', () => {
                this.closeMobileNav();
            });
        }

        // Handle mobile nav links
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                this.navigateToSection(targetId);
                this.closeMobileNav();
            });
        });

        // Add touch feedback to mobile nav links
        mobileNavLinks.forEach(link => {
            this.addTouchFeedback(link);
        });
    }

    toggleMobileNav() {
        const mobileNav = document.getElementById('mobileNav');
        const mobileNavOverlay = document.getElementById('mobileNavOverlay');
        
        if (mobileNav && mobileNavOverlay) {
            mobileNav.classList.toggle('active');
            mobileNavOverlay.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
        }
    }

    closeMobileNav() {
        const mobileNav = document.getElementById('mobileNav');
        const mobileNavOverlay = document.getElementById('mobileNavOverlay');
        
        if (mobileNav && mobileNavOverlay) {
            mobileNav.classList.remove('active');
            mobileNavOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Swipe Gestures
    setupSwipeGestures() {
        const hero = document.getElementById('hero');
        if (!hero) return;

        hero.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        hero.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].clientX;
            this.touchEndY = e.changedTouches[0].clientY;
            this.handleSwipe();
        }, { passive: true });

        // Add swipe handle to hero
        this.addSwipeHandle(hero);
    }

    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const minSwipeDistance = 50;

        // Check if it's a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                // Swipe right - go to previous section
                this.navigateToPreviousSection();
            } else {
                // Swipe left - go to next section
                this.navigateToNextSection();
            }
        }
    }

    addSwipeHandle(container) {
        const swipeHandle = document.createElement('div');
        swipeHandle.className = 'swipe-handle';
        container.appendChild(swipeHandle);
    }

    navigateToNextSection() {
        if (this.currentSection < this.sections.length - 1) {
            this.currentSection++;
            this.navigateToSection(`#${this.sections[this.currentSection].id}`);
        }
    }

    navigateToPreviousSection() {
        if (this.currentSection > 0) {
            this.currentSection--;
            this.navigateToSection(`#${this.sections[this.currentSection].id}`);
        }
    }

    navigateToSection(targetId) {
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = targetElement.offsetTop - headerHeight - 20;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

        // Update current section
        this.sections.forEach((section, index) => {
            if (section.id === targetId.replace('#', '')) {
                this.currentSection = index;
            }
        });

        this.updateSwipeIndicators();
    }

    updateSwipeIndicators() {
        const dots = document.querySelectorAll('.swipe-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSection);
        });
    }

    // Touch Interactions
    setupTouchInteractions() {
        // Add touch feedback to buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            this.addTouchFeedback(button);
        });

        // Add touch feedback to cards
        const cards = document.querySelectorAll('.aim-item, .involvement-option');
        cards.forEach(card => {
            this.addTouchFeedback(card);
        });

        // Add touch feedback to social icons
        const socialIcons = document.querySelectorAll('.social-icons a');
        socialIcons.forEach(icon => {
            this.addTouchFeedback(icon);
        });
    }

    addTouchFeedback(element) {
        element.classList.add('touch-target');
        
        const feedback = document.createElement('div');
        feedback.className = 'touch-feedback';
        element.appendChild(feedback);

        // Add touch events
        element.addEventListener('touchstart', (e) => {
            feedback.style.width = '0';
            feedback.style.height = '0';
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            const rect = element.getBoundingClientRect();
            const touch = e.changedTouches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            feedback.style.left = x + 'px';
            feedback.style.top = y + 'px';
            feedback.style.width = '100px';
            feedback.style.height = '100px';
            
            setTimeout(() => {
                feedback.style.width = '0';
                feedback.style.height = '0';
            }, 300);
        }, { passive: true });
    }

    // PWA Features
    setupPWAFeatures() {
        this.setupPWAInstall();
        this.setupServiceWorker();
        this.setupPWAStatusBar();
    }

    setupPWAInstall() {
        const installBanner = document.getElementById('pwaInstallBanner');
        const installBtn = document.getElementById('pwaInstallBtn');
        const dismissBtn = document.getElementById('pwaInstallDismiss');

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            return;
        }

        // Listen for beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            // Show install banner after delay
            setTimeout(() => {
                if (installBanner && !this.isInstalled) {
                    installBanner.classList.add('show');
                }
            }, 5000);
        });

        // Install button
        if (installBtn) {
            installBtn.addEventListener('click', () => {
                this.installPWA();
            });
        }

        // Dismiss button
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                if (installBanner) {
                    installBanner.classList.remove('show');
                }
            });
        }

        // Check if app was installed
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            if (installBanner) {
                installBanner.classList.remove('show');
            }
            this.showToast('App installed successfully!', 'success');
        });
    }

    async installPWA() {
        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            this.showToast('Installing app...', 'info');
        }
        
        this.deferredPrompt = null;
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    setupPWAStatusBar() {
        // Add status bar padding for PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            document.body.style.paddingTop = 'env(safe-area-inset-top)';
        }
    }

    // Smooth Transitions
    setupSmoothTransitions() {
        // Page transition for navigation
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link && link.getAttribute('href') !== '#') {
                e.preventDefault();
                this.showPageTransition(() => {
                    this.navigateToSection(link.getAttribute('href'));
                });
            }
        });

        // Section visibility observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            rootMargin: '-10% 0px -10% 0px',
            threshold: 0.1
        });

        this.sections.forEach(section => {
            observer.observe(section);
        });
    }

    showPageTransition(callback) {
        const transition = document.getElementById('pageTransition');
        if (!transition) return;

        transition.classList.add('active');
        
        setTimeout(() => {
            if (callback) callback();
            
            setTimeout(() => {
                transition.classList.remove('active');
            }, 200);
        }, 200);
    }

    // Mobile Animations
    setupMobileAnimations() {
        if (window.innerWidth <= 768) {
            // Add mobile-specific animations to elements
            const animatedElements = document.querySelectorAll('.aim-item, .involvement-option, .leaderboard-table');
            
            animatedElements.forEach((element, index) => {
                element.classList.add('mobile-scale-in');
                
                // Stagger animations
                setTimeout(() => {
                    element.classList.add('active');
                }, index * 100);
            });
        }
    }

    // Scroll Snap
    setupScrollSnap() {
        if (window.innerWidth <= 768) {
            document.documentElement.style.scrollSnapType = 'y mandatory';
            
            this.sections.forEach(section => {
                section.style.scrollSnapAlign = 'start';
            });
        }
    }

    // Utility Methods
    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        }
    }

    // Handle orientation change
    handleOrientationChange() {
        setTimeout(() => {
            this.setupMobileAnimations();
            this.setupScrollSnap();
        }, 100);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MobilePWAEnhancements();
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (window.mobilePWA) {
                window.mobilePWA.handleOrientationChange();
            }
        }, 100);
    });
});

// Export for global access
window.MobilePWAEnhancements = MobilePWAEnhancements;
