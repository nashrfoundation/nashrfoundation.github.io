// Parallax Scrolling Effect for Hero Background
// Creates smooth parallax effect where background moves slower than content

class ParallaxController {
    constructor() {
        this.heroBackground = document.querySelector('.hero-bg-image');
        this.isScrolling = false;
        this.ticking = false;
        
        if (this.heroBackground) {
            this.init();
        }
    }
    
    init() {
        console.log('Initializing parallax effect...');
        
        // Add scroll event listener with throttling
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        
        // Initial positioning
        this.updateParallax();
        
        console.log('✅ Parallax effect initialized');
    }
    
    handleScroll() {
        if (!this.ticking) {
            requestAnimationFrame(() => {
                this.updateParallax();
                this.ticking = false;
            });
            this.ticking = true;
        }
    }
    
    updateParallax() {
        if (!this.heroBackground) return;
        
        // Get scroll position
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Calculate parallax offset (background moves slower than content)
        const parallaxSpeed = 0.5; // Adjust this value to control parallax intensity
        const yPos = -(scrollTop * parallaxSpeed);
        
        // Apply transform to background image
        this.heroBackground.style.transform = `translate3d(0, ${yPos}px, 0)`;
        
        // Optional: Add fade effect as user scrolls
        const heroSection = document.querySelector('.hero-background');
        if (heroSection) {
            const heroHeight = heroSection.offsetHeight;
            const fadeStart = heroHeight * 0.3; // Start fading at 30% of hero height
            const fadeEnd = heroHeight * 0.8;   // Complete fade at 80% of hero height
            
            if (scrollTop > fadeStart) {
                const fadeProgress = Math.min((scrollTop - fadeStart) / (fadeEnd - fadeStart), 1);
                const opacity = 1 - (fadeProgress * 0.3); // Fade to 70% opacity
                this.heroBackground.style.opacity = opacity;
            } else {
                this.heroBackground.style.opacity = 1;
            }
        }
    }
    
    // Method to adjust parallax speed
    setParallaxSpeed(speed) {
        this.parallaxSpeed = Math.max(0, Math.min(1, speed)); // Clamp between 0 and 1
        console.log(`Parallax speed set to: ${this.parallaxSpeed}`);
    }
    
    // Method to disable/enable parallax
    toggleParallax(enabled) {
        if (enabled) {
            this.init();
        } else {
            window.removeEventListener('scroll', this.handleScroll.bind(this));
            if (this.heroBackground) {
                this.heroBackground.style.transform = 'translate3d(0, 0, 0)';
            }
        }
    }
    
    // Cleanup method
    destroy() {
        window.removeEventListener('scroll', this.handleScroll.bind(this));
        if (this.heroBackground) {
            this.heroBackground.style.transform = 'translate3d(0, 0, 0)';
        }
    }
}

// Initialize parallax when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.parallaxController = new ParallaxController();
    });
} else {
    window.parallaxController = new ParallaxController();
}

// Expose global methods for debugging
window.setParallaxSpeed = (speed) => {
    if (window.parallaxController) {
        window.parallaxController.setParallaxSpeed(speed);
    }
};

window.toggleParallax = (enabled) => {
    if (window.parallaxController) {
        window.parallaxController.toggleParallax(enabled);
    }
};
