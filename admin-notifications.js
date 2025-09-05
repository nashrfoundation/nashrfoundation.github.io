// Notification System for Admin Dashboard

class AdminNotificationSystem {
    constructor() {
        this.notifications = [];
        this.init();
    }
    
    init() {
        // Load existing notifications from localStorage
        this.loadNotifications();
        
        // Set up periodic notification checking
        this.setupNotificationPolling();
        
        // Set up UI elements
        this.setupUI();
    }
    
    setupUI() {
        // Create notification dropdown in header
        this.createNotificationDropdown();
        
        // Set up notification badge
        this.updateNotificationBadge();
    }
    
    createNotificationDropdown() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;
        
        // Check if dropdown already exists
        if (document.getElementById('notifications-dropdown')) return;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'notifications-dropdown';
        dropdown.id = 'notifications-dropdown';
        dropdown.innerHTML = `
            <button class="notification-toggle" aria-label="Notifications" aria-haspopup="true" aria-expanded="false">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span class="notification-badge" id="notification-badge">0</span>
            </button>
            <div class="notification-panel" id="notification-panel" role="region" aria-label="Notifications">
                <div class="notification-header">
                    <h3>Notifications</h3>
                    <button class="clear-all-btn" id="clear-all-notifications">Clear All</button>
                </div>
                <div class="notification-list" id="notification-list">
                    <div class="notification-empty">No notifications</div>
                </div>
            </div>
        `;
        
        // Insert before the user info
        const userInfo = headerActions.querySelector('.user-info');
        if (userInfo) {
            headerActions.insertBefore(dropdown, userInfo);
        } else {
            headerActions.appendChild(dropdown);
        }
        
        // Add event listeners
        const toggleButton = dropdown.querySelector('.notification-toggle');
        const clearAllButton = dropdown.querySelector('#clear-all-notifications');
        
        toggleButton.addEventListener('click', () => this.toggleNotificationPanel());
        clearAllButton.addEventListener('click', () => this.clearAllNotifications());
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !toggleButton.contains(e.target)) {
                this.closeNotificationPanel();
            }
        });
    }
    
    toggleNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        const isOpen = panel.classList.contains('open');
        
        if (isOpen) {
            this.closeNotificationPanel();
        } else {
            this.openNotificationPanel();
        }
    }
    
    openNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        const toggleButton = document.querySelector('.notification-toggle');
        
        panel.classList.add('open');
        toggleButton.setAttribute('aria-expanded', 'true');
        
        // Mark notifications as read
        this.markAllAsRead();
    }
    
    closeNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        const toggleButton = document.querySelector('.notification-toggle');
        
        panel.classList.remove('open');
        toggleButton.setAttribute('aria-expanded', 'false');
    }
    
    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notification-badge');
        
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }
    
    addNotification(notification) {
        // Add timestamp if not present
        if (!notification.timestamp) {
            notification.timestamp = new Date().toISOString();
        }
        
        // Add read status if not present
        if (notification.read === undefined) {
            notification.read = false;
        }
        
        // Add ID if not present
        if (!notification.id) {
            notification.id = Date.now() + Math.random().toString(36).substr(2, 9);
        }
        
        // Add to notifications array
        this.notifications.unshift(notification);
        
        // Limit to 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }
        
        // Save to localStorage
        this.saveNotifications();
        
        // Update UI
        this.updateNotificationBadge();
        this.renderNotifications();
        
        // Show toast notification
        this.showToastNotification(notification);
    }
    
    renderNotifications() {
        const notificationList = document.getElementById('notification-list');
        if (!notificationList) return;
        
        if (this.notifications.length === 0) {
            notificationList.innerHTML = '<div class="notification-empty">No notifications</div>';
            return;
        }
        
        notificationList.innerHTML = '';
        
        this.notifications.forEach(notification => {
            const notificationElement = this.createNotificationElement(notification);
            notificationList.appendChild(notificationElement);
        });
    }
    
    createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item ${notification.read ? '' : 'unread'}`;
        div.dataset.id = notification.id;
        
        const icon = this.getNotificationIcon(notification.type);
        const timeAgo = this.getTimeAgo(new Date(notification.timestamp));
        
        div.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${timeAgo}</div>
            </div>
            <button class="notification-dismiss" aria-label="Dismiss notification">&times;</button>
        `;
        
        // Add event listeners
        const dismissButton = div.querySelector('.notification-dismiss');
        dismissButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.dismissNotification(notification.id);
        });
        
        div.addEventListener('click', () => {
            this.markAsRead(notification.id);
            if (notification.action) {
                notification.action();
            }
        });
        
        return div;
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22,4 12,14.01 9,11.01"></polyline></svg>',
            warning: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            error: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            info: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
            donation: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>'
        };
        
        return icons[type] || icons.info;
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
    
    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
            notification.read = true;
            this.saveNotifications();
            this.updateNotificationBadge();
            this.renderNotifications();
        }
    }
    
    markAllAsRead() {
        let updated = false;
        this.notifications.forEach(notification => {
            if (!notification.read) {
                notification.read = true;
                updated = true;
            }
        });
        
        if (updated) {
            this.saveNotifications();
            this.updateNotificationBadge();
            this.renderNotifications();
        }
    }
    
    dismissNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.saveNotifications();
        this.updateNotificationBadge();
        this.renderNotifications();
    }
    
    clearAllNotifications() {
        this.notifications = [];
        this.saveNotifications();
        this.updateNotificationBadge();
        this.renderNotifications();
    }
    
    showToastNotification(notification) {
        // Only show toast for unread notifications
        if (notification.read) return;
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification ${notification.type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;
        
        // Add to document
        document.body.appendChild(toast);
        
        // Add close event
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            toast.remove();
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }
    
    setupNotificationPolling() {
        // Check for new notifications every 30 seconds
        setInterval(() => {
            this.checkForNewNotifications();
        }, 30000);
    }
    
    async checkForNewNotifications() {
        // In a real implementation, this would check with your backend
        // For now, we'll simulate occasional notifications
        
        // Simulate a new donation notification (10% chance every 30 seconds)
        if (Math.random() < 0.1) {
            const donors = ['Ahmed Khan', 'Fatima Ali', 'Mohammed Rizwan', 'Sana Abbas', 'Ali Hassan'];
            const donor = donors[Math.floor(Math.random() * donors.length)];
            const amounts = [1000, 2500, 5000, 7500, 10000];
            const amount = amounts[Math.floor(Math.random() * amounts.length)];
            
            this.addNotification({
                type: 'donation',
                title: 'New Donation Received',
                message: `${donor} donated ₨${amount.toLocaleString()}`,
                action: () => {
                    // Navigate to donations section
                    document.querySelector('[data-section="donations"]').click();
                }
            });
        }
    }
    
    saveNotifications() {
        try {
            localStorage.setItem('adminNotifications', JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Failed to save notifications:', error);
        }
    }
    
    loadNotifications() {
        try {
            const saved = localStorage.getItem('adminNotifications');
            if (saved) {
                this.notifications = JSON.parse(saved);
            } else {
                this.notifications = [];
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
            this.notifications = [];
        }
    }
}

// Initialize notification system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminNotifications = new AdminNotificationSystem();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminNotificationSystem;
}