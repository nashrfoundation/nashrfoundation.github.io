/**
 * UI/UX Enhancements for Nashr Foundation Website
 * Enhanced interactions, loading states, and visual feedback
 */

class UIEnhancements {
    constructor() {
        this.init();
    }

    init() {
        this.setupBackToTop();
        this.setupSmoothScrolling();
        this.setupActiveNavigation();
        this.setupFormValidation();
        this.setupLoadingStates();
        this.setupToastNotifications();
        this.setupSkeletonLoading();
    }

    // Back to Top Button
    setupBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) return;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Smooth Scrolling for Navigation
    setupSmoothScrolling() {
        const navLinks = document.querySelectorAll('nav a[href^="#"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
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

    // Active Navigation Highlighting
    setupActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('nav a[href^="#"]');

        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const activeId = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${activeId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    }

    // Enhanced Form Validation
    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                // Real-time validation
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });

            // Form submission
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldGroup = field.closest('.form-group');
        let validationMessage = fieldGroup?.querySelector('.validation-message');
        
        if (!validationMessage) {
            validationMessage = document.createElement('div');
            validationMessage.className = 'validation-message';
            fieldGroup?.appendChild(validationMessage);
        }

        // Clear previous states
        field.classList.remove('error', 'success');
        validationMessage.classList.remove('show', 'success');

        // Validation rules
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, validationMessage, 'This field is required');
            return false;
        }

        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, validationMessage, 'Please enter a valid email address');
                return false;
            }
        }

        if (field.type === 'tel' && value) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                this.showFieldError(field, validationMessage, 'Please enter a valid phone number');
                return false;
            }
        }

        // Success state
        if (value) {
            field.classList.add('success');
            validationMessage.textContent = 'Looks good!';
            validationMessage.classList.add('show', 'success');
        }

        return true;
    }

    showFieldError(field, validationMessage, message) {
        field.classList.add('error');
        validationMessage.textContent = message;
        validationMessage.classList.add('show');
    }

    clearFieldError(field) {
        const fieldGroup = field.closest('.form-group');
        const validationMessage = fieldGroup?.querySelector('.validation-message');
        
        field.classList.remove('error');
        validationMessage?.classList.remove('show');
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // Loading States
    setupLoadingStates() {
        // Button loading states
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn[data-loading]')) {
                this.setButtonLoading(e.target, true);
            }
        });
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<span class="spinner"></span> Loading...';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Submit';
        }
    }

    // Toast Notifications
    setupToastNotifications() {
        // Global toast function
        window.showToast = (message, type = 'info', duration = 5000) => {
            this.showToast(message, type, duration);
        };
    }

    showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-title">${icons[type] || icons.info} ${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                <button class="toast-close" aria-label="Close notification">&times;</button>
            </div>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.hideToast(toast));

        // Auto hide
        if (duration > 0) {
            setTimeout(() => this.hideToast(toast), duration);
        }

        return toast;
    }

    hideToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Skeleton Loading for Leaderboard
    setupSkeletonLoading() {
        const leaderboardTable = document.querySelector('.leaderboard-table tbody');
        if (!leaderboardTable) return;

        // Show skeleton loading initially
        this.showSkeletonLoading(leaderboardTable);
    }

    showSkeletonLoading(container) {
        const skeletonRows = Array.from({ length: 5 }, () => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><div class="skeleton-loading narrow"></div></td>
                <td><div class="skeleton-loading wide"></div></td>
                <td><div class="skeleton-loading medium"></div></td>
            `;
            return row;
        });

        container.innerHTML = '';
        skeletonRows.forEach(row => container.appendChild(row));
    }

    hideSkeletonLoading(container) {
        const skeletonRows = container.querySelectorAll('.skeleton-loading');
        skeletonRows.forEach(row => {
            row.parentElement.parentElement.remove();
        });
    }

    // Progress Bar
    showProgress(container, percentage) {
        let progressBar = container.querySelector('.progress-bar');
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.innerHTML = '<div class="progress-fill"></div>';
            container.appendChild(progressBar);
        }

        const progressFill = progressBar.querySelector('.progress-fill');
        progressFill.style.width = `${percentage}%`;
    }

    // Utility Methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UIEnhancements();
});

// Export for use in other scripts
window.UIEnhancements = UIEnhancements;
