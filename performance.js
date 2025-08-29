// Performance monitoring and optimization for Nashr Foundation
// Tracks Core Web Vitals and implements performance improvements

(function() {
    'use strict';
    
    // Performance monitoring
    function trackCoreWebVitals() {
        // Track LCP (Largest Contentful Paint)
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.startTime);
                
                // Send to analytics if available
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'LCP', {
                        value: Math.round(lastEntry.startTime),
                        event_category: 'Web Vitals'
                    });
                }
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        }
        
        // Track FID (First Input Delay)
        if ('PerformanceObserver' in window) {
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    console.log('FID:', entry.processingStart - entry.startTime);
                    
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'FID', {
                            value: Math.round(entry.processingStart - entry.startTime),
                            event_category: 'Web Vitals'
                        });
                    }
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
        }
        
        // Track CLS (Cumulative Layout Shift)
        if ('PerformanceObserver' in window) {
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        console.log('CLS:', clsValue);
                        
                        if (typeof gtag !== 'undefined') {
                            gtag('event', 'CLS', {
                                value: Math.round(clsValue * 1000) / 1000,
                                event_category: 'Web Vitals'
                            });
                        }
                    }
                });
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }
    
    // Image optimization
    function optimizeImages() {
        // Lazy load images that are not in viewport
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            img.classList.add('loaded');
                        }
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px'
            });
            
            // Observe all images with data-src attribute
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
        
        // Preload critical images
        const criticalImages = [
            'hero_background.webp',
            'hero_background_mobile.webp',
            'logo.webp'
        ];
        
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }
    
    // Resource hints optimization
    function addResourceHints() {
        const hints = [
            { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' },
            { rel: 'dns-prefetch', href: 'https://www.google-analytics.com' },
            { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
            { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
            { rel: 'dns-prefetch', href: 'https://cdn.jsdelivr.net' }
        ];
        
        hints.forEach(hint => {
            const link = document.createElement('link');
            link.rel = hint.rel;
            link.href = hint.href;
            document.head.appendChild(link);
        });
    }
    
    // Service Worker optimization
    function optimizeServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Register service worker with optimized strategy
            navigator.serviceWorker.register('./sw.js', {
                scope: './'
            }).then(registration => {
                console.log('Service Worker registered successfully');
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            console.log('New service worker available');
                        }
                    });
                });
            }).catch(error => {
                console.log('Service Worker registration failed:', error);
            });
        }
    }
    
    // Memory optimization
    function optimizeMemory() {
        // Clean up event listeners when elements are removed
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Remove any stored references to prevent memory leaks
                        if (node._eventListeners) {
                            node._eventListeners.forEach(({ event, handler }) => {
                                node.removeEventListener(event, handler);
                            });
                            delete node._eventListeners;
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Initialize performance optimizations
    function init() {
        // Track Core Web Vitals
        trackCoreWebVitals();
        
        // Optimize images
        optimizeImages();
        
        // Add resource hints
        addResourceHints();
        
        // Optimize service worker
        optimizeServiceWorker();
        
        // Optimize memory usage
        optimizeMemory();
        
        // Report performance metrics
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart);
                    console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart);
                }, 0);
            });
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for global access
    window.PerformanceOptimizer = {
        trackCoreWebVitals,
        optimizeImages,
        addResourceHints,
        optimizeServiceWorker,
        optimizeMemory
    };
})();
