// Admin Dashboard JavaScript for Nashr Foundation

// Supabase Configuration
const supabaseConfig = {
    url: 'https://jtuhnndwhotxjjolwcuz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dWhubmR3aG90eGpqb2x3Y3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjU3MDEsImV4cCI6MjA3MjA0MTcwMX0.HJhOCxGDgDERcBfdgBQJsiGoaev5RAtX819eWuMGkhc'
};

// Initialize Supabase
let supabase;
let currentUser = null;
let charts = {};
let realtimeData = {};
let leaderboardSubscription = null;
let donationsData = [];
let logsData = [];
let currentPage = 1;
let logsCurrentPage = 1;
const itemsPerPage = 10;

// Using Supabase Auth (email/password). Create admins in Supabase Console.

// DOM Elements
const loginModal = document.getElementById('login-modal');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeSupabase();
    setupEventListeners();
    checkAuthState();
});

// Supabase Initialization
async function initializeSupabase() {
    try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        
        supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
        
        // Auth state listener
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                currentUser = { email: session.user.email, uid: session.user.id };
                showDashboard();
                loadDashboardData();
                logActivity('admin_login', `User ${session.user.email} logged in`);
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                showLogin();
                logActivity('admin_logout', `User logged out`);
            }
        });
        
        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = { email: session.user.email, uid: session.user.id };
            showDashboard();
            loadDashboardData();
        } else {
            showLogin();
        }
        
        console.log('Supabase initialized successfully');
    } catch (error) {
        console.error('Supabase initialization failed:', error);
        showError('Failed to initialize Supabase. Please refresh the page.');
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Leaderboard form
    const leaderboardForm = document.getElementById('leaderboard-form');
    if (leaderboardForm) {
        leaderboardForm.addEventListener('submit', handleLeaderboardSubmit);
    }
    
    // Content form
    const contentSections = document.querySelectorAll('#content input, #content textarea');
    contentSections.forEach(element => {
        element.addEventListener('input', () => {
            // Mark content as dirty
        });
    });
    
    // Settings form
    const settingsSections = document.querySelectorAll('#settings input, #settings textarea, #settings select');
    settingsSections.forEach(element => {
        element.addEventListener('input', () => {
            // Mark settings as dirty
        });
    });
}

// Authentication Functions
function checkAuthState() {
    // onAuthStateChanged handles UI; this remains as a no-op placeholder
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const submitBtn = document.getElementById('login-submit');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        currentUser = { email: data.user.email, uid: data.user.id };
        showSuccess('Login successful!');
        
    } catch (err) {
        showLoginError('Login failed. Check your email and password.');
        logActivity('admin_login_failed', `Failed login attempt for ${email}`);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    }
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        showSuccess('Logged out successfully!');
        logActivity('admin_logout', `User ${currentUser.email} logged out`);
    } catch (err) {
        showError('Failed to logout. Please try again.');
    }
}

function showLogin() {
    loginModal.style.display = 'flex';
    adminDashboard.style.display = 'none';
}

function showDashboard() {
    loginModal.style.display = 'none';
    adminDashboard.style.display = 'block';
    document.getElementById('admin-user-email').textContent = currentUser.email;
}

function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
    setTimeout(() => {
        loginError.style.display = 'none';
    }, 5000);
}

// Navigation Functions
function handleNavigation(e) {
    e.preventDefault();
    
    const targetSection = e.target.getAttribute('data-section');
    
    // Update active navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Show target section
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(targetSection).classList.add('active');
    
    // Load section-specific data
    loadSectionData(targetSection);
}

// Dashboard Data Loading
async function loadDashboardData() {
    try {
        // Show loading states
        document.getElementById('recent-activity-list').innerHTML = '<div class="loading">Loading recent donations...</div>';
        
        await Promise.all([
            loadOverviewData(),
            loadLeaderboardData()
        ]);
        
        updateLastUpdatedTime();
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showError('Failed to load dashboard data. Please refresh the page.');
    }
}

async function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'donations':
            await loadDonationsData();
            break;
        case 'leaderboard':
            await loadLeaderboardData();
            break;
        case 'content':
            await loadContentData();
            break;
        case 'newsletter':
            await loadNewsletterData();
            break;
        case 'settings':
            await loadSettingsData();
            break;
        case 'logs':
            await loadLogsData();
            break;
        default:
            await loadDashboardData();
            break;
    }
}

// Overview Section
async function loadOverviewData() {
    try {
        // Simulate loading donations data
        const donations = [
            { id: 1, name: 'Ahmed Khan', amount: 5000, createdAt: new Date(Date.now() - 86400000), paymentMethod: 'stripe', paymentStatus: 'completed' },
            { id: 2, name: 'Fatima Ali', amount: 2500, createdAt: new Date(Date.now() - 172800000), paymentMethod: 'paypal', paymentStatus: 'completed' },
            { id: 3, name: 'Mohammed Rizwan', amount: 10000, createdAt: new Date(Date.now() - 259200000), paymentMethod: 'bank', paymentStatus: 'completed' }
        ];
        
        updateOverviewStats(donations);
        updateRecentActivity(donations);
        
        // Initialize charts with sample data
        createDonationsChart([
            { date: '2025-08-01', amount: 15000 },
            { date: '2025-08-02', amount: 22000 },
            { date: '2025-08-03', amount: 18000 },
            { date: '2025-08-04', amount: 25000 },
            { date: '2025-08-05', amount: 30000 }
        ]);
        
        createPaymentMethodsChart([
            { method: 'Stripe', count: 45 },
            { method: 'PayPal', count: 30 },
            { method: 'Bank Transfer', count: 25 }
        ]);
        
    } catch (error) {
        console.error('Failed to load overview data:', error);
        // Empty states
        updateOverviewStats([]);
        updateRecentActivity([]);
    }
}

function updateOverviewStats(donations) {
    const totalRaised = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const todayDonations = donations.filter(donation => {
        const today = new Date();
        const donationDate = donation.createdAt || new Date();
        return donationDate.toDateString() === today.toDateString();
    });
    const todayAmount = todayDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const totalDonors = donations.length;
    const goalAmount = 200000; // This should come from settings
    const goalProgress = Math.round((totalRaised / goalAmount) * 100);
    
    // Update stats
    document.getElementById('total-donations').textContent = `₨${totalRaised.toLocaleString()}`;
    document.getElementById('fundraising-goal').textContent = `${goalProgress}%`;
    document.getElementById('goal-progress-fill').style.width = `${goalProgress}%`;
    document.getElementById('total-donors').textContent = totalDonors;
    document.getElementById('website-visitors').textContent = '1,245'; // Placeholder
    
    // Update change indicators
    document.getElementById('donations-change').textContent = `+₨${todayAmount.toLocaleString()} today`;
    document.getElementById('donors-change').textContent = `+${todayDonations.length} today`;
}

function updateRecentActivity(donations) {
    const recentDonations = donations
        .sort((a, b) => {
            const bd = b.createdAt || new Date();
            const ad = a.createdAt || new Date();
            return bd - ad;
        })
        .slice(0, 5);
    
    const activityList = document.getElementById('recent-activity-list');
    activityList.innerHTML = '';
    
    if (recentDonations.length === 0) {
        activityList.innerHTML = '<div class="loading">No recent activity</div>';
        return;
    }
    
    recentDonations.forEach(donation => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const icon = document.createElement('div');
        icon.className = 'activity-icon';
        icon.textContent = '💰';
        
        const content = document.createElement('div');
        content.className = 'activity-content';
        
        const title = document.createElement('div');
        title.className = 'activity-title';
        title.textContent = `${donation.name || 'Anonymous'} donated ₨${(donation.amount != null ? donation.amount.toLocaleString() : '0')}`;
        
        const time = document.createElement('div');
        time.className = 'activity-time';
        time.textContent = formatTimeAgo(donation.createdAt || new Date());
        
        content.appendChild(title);
        content.appendChild(time);
        activityItem.appendChild(icon);
        activityItem.appendChild(content);
        activityList.appendChild(activityItem);
    });
}

// Donations Section
async function loadDonationsData() {
    try {
        // Simulate loading donations data
        const donations = [
            { id: 1, name: 'Ahmed Khan', amount: 5000, createdAt: new Date(Date.now() - 86400000), paymentMethod: 'stripe', paymentStatus: 'completed' },
            { id: 2, name: 'Fatima Ali', amount: 2500, createdAt: new Date(Date.now() - 172800000), paymentMethod: 'paypal', paymentStatus: 'completed' },
            { id: 3, name: 'Mohammed Rizwan', amount: 10000, createdAt: new Date(Date.now() - 259200000), paymentMethod: 'bank', paymentStatus: 'completed' },
            { id: 4, name: 'Sana Abbas', amount: 7500, createdAt: new Date(Date.now() - 345600000), paymentMethod: 'stripe', paymentStatus: 'completed' },
            { id: 5, name: 'Ali Hassan', amount: 3000, createdAt: new Date(Date.now() - 432000000), paymentMethod: 'paypal', paymentStatus: 'completed' }
        ];
        
        donationsData = donations;
        displayDonationsTable(donations);
        setupPagination(donations);
    } catch (error) {
        console.error('Failed to load donations data:', error);
        displayDonationsTable([]);
        setupPagination([]);
    }
}

function displayDonationsTable(donations) {
    const tableBody = document.getElementById('donations-table-body');
    tableBody.innerHTML = '';
    
    if (donations.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="loading">No donations found</td></tr>';
        return;
    }
    
    // Paginate donations
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDonations = donations.slice(startIndex, endIndex);
    
    paginatedDonations.forEach(donation => {
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(donation.createdAt || new Date());
        
        const nameCell = document.createElement('td');
        nameCell.textContent = donation.name || 'Anonymous';
        
        const amountCell = document.createElement('td');
        amountCell.textContent = `₨${(donation.amount != null ? donation.amount.toLocaleString() : '0')}`;
        
        const methodCell = document.createElement('td');
        methodCell.textContent = donation.paymentMethod || 'Unknown';
        
        const statusCell = document.createElement('td');
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-badge confirmed';
        statusSpan.textContent = 'Confirmed';
        statusCell.appendChild(statusSpan);
        
        const actionsCell = document.createElement('td');
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-outline btn-sm';
        viewBtn.textContent = 'View';
        viewBtn.onclick = () => viewDonation(donation);
        
        const refundBtn = document.createElement('button');
        refundBtn.className = 'btn btn-danger btn-sm';
        refundBtn.textContent = 'Refund';
        refundBtn.onclick = () => refundDonation(donation.id);
        
        actionsCell.appendChild(viewBtn);
        actionsCell.appendChild(refundBtn);
        
        row.appendChild(dateCell);
        row.appendChild(nameCell);
        row.appendChild(amountCell);
        row.appendChild(methodCell);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
}

// Leaderboard Section
async function loadLeaderboardData() {
    try {
        // Clear any existing subscription
        if (leaderboardSubscription) {
            leaderboardSubscription.unsubscribe();
            leaderboardSubscription = null;
        }
        
        // Simulate fetching leaderboard data
        const leaderboardData = [
            { rank: 1, name: 'Ahmed Khan', amount: 50000 },
            { rank: 2, name: 'Fatima Ali', amount: 25000 },
            { rank: 3, name: 'Mohammed Rizwan', amount: 15000 },
            { rank: 4, name: 'Sana Abbas', amount: 10000 },
            { rank: 5, name: 'Ali Hassan', amount: 7500 }
        ];
        
        window._leaderboardData = leaderboardData;
        displayLeaderboardTable(leaderboardData);
        
    } catch (error) {
        console.error('Failed to load leaderboard data:', error);
        showError('Failed to load leaderboard data. Please refresh the page.');
    }
}

function displayLeaderboardTable(leaderboardData) {
    const tableBody = document.getElementById('admin-leaderboard-body');
    tableBody.innerHTML = '';
    
    if (leaderboardData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="loading">No leaderboard entries found</td></tr>';
        return;
    }
    
    leaderboardData.forEach(entry => {
        const row = document.createElement('tr');
        
        const rankCell = document.createElement('td');
        rankCell.textContent = entry.rank.toString().padStart(2, '0');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = entry.name;
        
        const amountCell = document.createElement('td');
        amountCell.textContent = `₨${entry.amount.toLocaleString()}`;
        
        const actionsCell = document.createElement('td');
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-outline btn-sm';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editLeaderboardEntry(entry);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteLeaderboardEntry(entry.rank);
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(amountCell);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
}

// Content Management
async function loadContentData() {
    try {
        // Load current content settings
        document.getElementById('homepage-title').value = 'Nashr Foundation - Empowering Communities Through Essential Support';
        document.getElementById('homepage-description').value = 'Nashr Foundation provides education, food, clean water, and basic necessities to vulnerable communities across Pakistan. Join us in making a difference through donations and volunteer work.';
        document.getElementById('homepage-hero-title').value = 'Empowering Communities Through Essential Support';
        document.getElementById('homepage-hero-description').value = 'Providing education, food, water, and basic necessities to those in need';
        
        document.getElementById('donation-title').value = 'Make a Difference Today';
        document.getElementById('donation-description').value = 'Every contribution, no matter the size, helps us provide essential services to communities in need. Choose your preferred donation method below.';
        document.getElementById('donation-impact-title').value = 'Your Donation\'s Impact';
        
    } catch (error) {
        console.error('Failed to load content data:', error);
        showError('Failed to load content data. Please try again.');
    }
}

function saveContentChanges() {
    try {
        // Get content values
        const homepageContent = {
            title: document.getElementById('homepage-title').value,
            description: document.getElementById('homepage-description').value,
            heroTitle: document.getElementById('homepage-hero-title').value,
            heroDescription: document.getElementById('homepage-hero-description').value
        };
        
        const donationContent = {
            title: document.getElementById('donation-title').value,
            description: document.getElementById('donation-description').value,
            impactTitle: document.getElementById('donation-impact-title').value
        };
        
        // In a real implementation, this would save to a database
        console.log('Saving content:', { homepageContent, donationContent });
        showSuccess('Content changes saved successfully!');
        logActivity('content_update', 'Website content updated');
    } catch (error) {
        console.error('Failed to save content:', error);
        showError('Failed to save content changes. Please try again.');
    }
}

// Newsletter Management
async function loadNewsletterData() {
    try {
        // Load newsletter statistics
        document.getElementById('total-subscribers').textContent = '1,245';
        document.getElementById('active-subscribers').textContent = '1,180';
        document.getElementById('unsubscribed').textContent = '65';
    } catch (error) {
        console.error('Failed to load newsletter data:', error);
        showError('Failed to load newsletter data. Please try again.');
    }
}

function sendNewsletter() {
    try {
        const subject = document.getElementById('newsletter-subject').value;
        const content = document.getElementById('newsletter-content').value;
        const recipients = document.getElementById('newsletter-recipients').value;
        
        if (!subject || !content) {
            showError('Please enter both subject and content for the newsletter.');
            return;
        }
        
        // In a real implementation, this would send the newsletter
        console.log('Sending newsletter:', { subject, content, recipients });
        showSuccess(`Newsletter sent to ${recipients} subscribers!`);
        logActivity('newsletter_send', `Newsletter sent to ${recipients} subscribers`);
        
        // Clear form
        document.getElementById('newsletter-subject').value = '';
        document.getElementById('newsletter-content').value = '';
    } catch (error) {
        console.error('Failed to send newsletter:', error);
        showError('Failed to send newsletter. Please try again.');
    }
}

// Settings Management
async function loadSettingsData() {
    try {
        // Load current settings
        document.getElementById('site-title').value = 'Nashr Foundation - Empowering Communities Through Essential Support';
        document.getElementById('site-description').value = 'Nashr Foundation provides education, food, clean water, and basic necessities to vulnerable communities across Pakistan. Join us in making a difference through donations and volunteer work.';
        document.getElementById('keywords').value = 'charity, foundation, Pakistan, education, food, clean water, donations, nonprofit, community support';
        
        document.getElementById('facebook-url').value = 'https://www.facebook.com/nashrfoundation';
        document.getElementById('instagram-url').value = 'https://www.instagram.com/nashrfoundation';
        document.getElementById('twitter-url').value = 'https://x.com/nashrfoundation';
        document.getElementById('youtube-url').value = 'https://www.youtube.com/@nashrfoundation';
        
        document.getElementById('fundraising-goal-amount').value = '200000';
        document.getElementById('goal-description').value = 'Help us reach our goal to support more communities in need.';
        
        document.getElementById('admin-email-notifications').value = 'all';
        document.getElementById('backup-frequency').value = 'daily';
    } catch (error) {
        console.error('Failed to load settings data:', error);
        showError('Failed to load settings data. Please try again.');
    }
}

function saveSettings() {
    try {
        // Get settings values
        const seoSettings = {
            title: document.getElementById('site-title').value,
            description: document.getElementById('site-description').value,
            keywords: document.getElementById('keywords').value
        };
        
        const socialSettings = {
            facebook: document.getElementById('facebook-url').value,
            instagram: document.getElementById('instagram-url').value,
            twitter: document.getElementById('twitter-url').value,
            youtube: document.getElementById('youtube-url').value
        };
        
        const fundraisingSettings = {
            goal: document.getElementById('fundraising-goal-amount').value,
            description: document.getElementById('goal-description').value
        };
        
        const securitySettings = {
            notifications: document.getElementById('admin-email-notifications').value,
            backup: document.getElementById('backup-frequency').value
        };
        
        // In a real implementation, this would save to a database
        console.log('Saving settings:', { seoSettings, socialSettings, fundraisingSettings, securitySettings });
        showSuccess('Settings saved successfully!');
        logActivity('settings_update', 'System settings updated');
    } catch (error) {
        console.error('Failed to save settings:', error);
        showError('Failed to save settings. Please try again.');
    }
}

// Activity Logs
async function loadLogsData() {
    try {
        // Simulate loading logs data
        logsData = [
            { id: 1, timestamp: new Date(Date.now() - 3600000), user: 'admin@nashr.org', action: 'admin_login', details: 'User logged in successfully', ip: '192.168.1.100' },
            { id: 2, timestamp: new Date(Date.now() - 7200000), user: 'admin@nashr.org', action: 'donation_added', details: 'Added new donation entry for Ahmed Khan', ip: '192.168.1.100' },
            { id: 3, timestamp: new Date(Date.now() - 10800000), user: 'admin@nashr.org', action: 'content_update', details: 'Updated homepage content', ip: '192.168.1.100' },
            { id: 4, timestamp: new Date(Date.now() - 14400000), user: 'admin@nashr.org', action: 'settings_update', details: 'Updated social media links', ip: '192.168.1.100' },
            { id: 5, timestamp: new Date(Date.now() - 18000000), user: 'admin@nashr.org', action: 'admin_logout', details: 'User logged out', ip: '192.168.1.100' }
        ];
        
        displayLogsTable(logsData);
        setupLogsPagination(logsData);
    } catch (error) {
        console.error('Failed to load logs data:', error);
        displayLogsTable([]);
        setupLogsPagination([]);
    }
}

function displayLogsTable(logs) {
    const tableBody = document.getElementById('logs-table-body');
    tableBody.innerHTML = '';
    
    if (logs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="loading">No activity logs found</td></tr>';
        return;
    }
    
    // Paginate logs
    const startIndex = (logsCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLogs = logs.slice(startIndex, endIndex);
    
    paginatedLogs.forEach(log => {
        const row = document.createElement('tr');
        
        const timestampCell = document.createElement('td');
        timestampCell.textContent = formatDateTime(log.timestamp || new Date());
        
        const userCell = document.createElement('td');
        userCell.textContent = log.user || 'Unknown';
        
        const actionCell = document.createElement('td');
        actionCell.textContent = log.action || 'Unknown';
        
        const detailsCell = document.createElement('td');
        detailsCell.textContent = log.details || 'No details';
        
        const ipCell = document.createElement('td');
        ipCell.textContent = log.ip || 'Unknown';
        
        row.appendChild(timestampCell);
        row.appendChild(userCell);
        row.appendChild(actionCell);
        row.appendChild(detailsCell);
        row.appendChild(ipCell);
        
        tableBody.appendChild(row);
    });
}

// Leaderboard Management
async function handleLeaderboardSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('entry-name').value.trim();
    const amount = parseInt(document.getElementById('entry-amount').value, 10);
    const editId = document.getElementById('edit-entry-id').value;
    
    if (!name || isNaN(amount) || amount <= 0) {
        showError('Please enter a valid name and amount.');
        return;
    }
    
    if (!currentUser) {
        showError('You must be logged in to add entries.');
        return;
    }
    
    try {
        // In a real implementation, this would save to Supabase
        showSuccess(editId ? 'Leaderboard entry updated successfully!' : 'New leaderboard entry added successfully!');
        hideEntryForm();
        
        // Refresh data after a short delay
        setTimeout(() => {
            loadLeaderboardData();
        }, 1000);
        
        logActivity('leaderboard_update', editId ? 'Leaderboard entry updated' : 'Leaderboard entry added');
    } catch (error) {
        console.error('Failed to save leaderboard entry:', error);
        showError('Failed to save entry. Please try again.');
    }
}

function addLeaderboardEntry() {
    document.getElementById('form-title').textContent = 'Add New Entry';
    document.getElementById('edit-entry-id').value = '';
    document.getElementById('entry-name').value = '';
    document.getElementById('entry-amount').value = '';
    document.getElementById('entry-form').style.display = 'block';
}

function editLeaderboardEntry(entry) {
    document.getElementById('form-title').textContent = 'Edit Entry';
    document.getElementById('edit-entry-id').value = entry.rank;
    document.getElementById('entry-name').value = entry.name;
    document.getElementById('entry-amount').value = entry.amount;
    document.getElementById('entry-form').style.display = 'block';
}

function cancelEdit() {
    hideEntryForm();
}

function hideEntryForm() {
    document.getElementById('entry-form').style.display = 'none';
}

async function deleteLeaderboardEntry(rank) {
    if (confirm(`Are you sure you want to delete the entry with rank ${rank}?`)) {
        try {
            // In a real implementation, this would delete from Supabase
            showSuccess('Leaderboard entry deleted.');
            
            // Refresh data after a short delay
            setTimeout(() => {
                loadLeaderboardData();
            }, 1000);
            
            logActivity('leaderboard_delete', `Leaderboard entry with rank ${rank} deleted`);
        } catch (error) {
            console.error('Failed to delete entry:', error);
            showError('Failed to delete entry. Please try again.');
        }
    }
}

// Donation Management
function viewDonation(donation) {
    // In a real implementation, this would show donation details
    alert(`Viewing donation details for ${donation.name || 'Anonymous'}:
Amount: ₨${donation.amount}
Date: ${formatDate(donation.createdAt)}`);
}

function refundDonation(donationId) {
    if (confirm('Are you sure you want to refund this donation?')) {
        try {
            // In a real implementation, this would process the refund
            showSuccess('Donation refunded successfully!');
            logActivity('donation_refund', `Donation ${donationId} refunded`);
        } catch (error) {
            showError('Failed to refund donation. Please try again.');
        }
    }
}

// Search and Filter
function handleDonationSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    // In a real implementation, this would filter the donations
    console.log('Searching for:', searchTerm);
}

function handleDonationFilter(e) {
    const filterValue = e.target.value;
    // In a real implementation, this would filter the donations
    console.log('Filtering by:', filterValue);
}

function searchLogs(e) {
    const searchTerm = e.target.value.toLowerCase();
    // In a real implementation, this would filter the logs
    console.log('Searching logs for:', searchTerm);
}

// Pagination
function setupPagination(data) {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    updatePaginationInfo(totalPages);
    
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
}

function setupLogsPagination(data) {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    updateLogsPaginationInfo(totalPages);
    
    document.getElementById('prev-log-page').disabled = logsCurrentPage === 1;
    document.getElementById('next-log-page').disabled = logsCurrentPage === totalPages;
}

function changePage(direction) {
    currentPage += direction;
    loadDonationsData();
}

function changeLogPage(direction) {
    logsCurrentPage += direction;
    loadLogsData();
}

function updatePaginationInfo(totalPages) {
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages || 1}`;
}

function updateLogsPaginationInfo(totalPages) {
    document.getElementById('log-page-info').textContent = `Page ${logsCurrentPage} of ${totalPages || 1}`;
}

// Chart Functions
function createDonationsChart(data) {
    const canvas = document.getElementById('donations-chart');
    if (!canvas) {
        console.warn('Donations chart canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (charts.donations) {
        charts.donations.destroy();
    }
    
    try {
        charts.donations = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    label: 'Daily Donations (PKR)',
                    data: data.map(d => d.amount),
                    borderColor: '#2A8D9C',
                    backgroundColor: 'rgba(42, 141, 156, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₨' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Failed to create donations chart:', error);
    }
}

function createPaymentMethodsChart(data) {
    const canvas = document.getElementById('payment-methods-chart');
    if (!canvas) {
        console.warn('Payment methods chart canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (charts.paymentMethods) {
        charts.paymentMethods.destroy();
    }
    
    try {
        charts.paymentMethods = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.method),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: [
                        '#2A8D9C',
                        '#FFB52E',
                        '#28a745',
                        '#dc3545'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Failed to create payment methods chart:', error);
    }
}

// Utility Functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function updateLastUpdatedTime() {
    const now = new Date();
    const elements = document.querySelectorAll('.last-updated');
    elements.forEach(el => {
        el.textContent = `Last updated: ${now.toLocaleString()}`;
    });
}

function refreshDashboard() {
    loadDashboardData();
    showSuccess('Dashboard refreshed successfully!');
}

function exportDonations() {
    // In a real implementation, this would export donation data
    showSuccess('Donations data exported successfully!');
    logActivity('data_export', 'Donations data exported');
}

function exportLeaderboardCsv() {
    const table = document.querySelector('#leaderboard .admin-table');
    if (!table) return;
    
    let csv = 'Rank,Name,Amount\n';
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    rows.forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 3) {
            const rank = tds[0].textContent.trim();
            const name = tds[1].textContent.trim();
            const amount = tds[2].textContent.trim().replace(/[^0-9]/g, '');
            csv += `${rank},${name},${amount}
`;
        }
    });
    
    downloadCSV(csv, 'leaderboard.csv');
}

function exportLogs() {
    // In a real implementation, this would export logs data
    showSuccess('Activity logs exported successfully!');
    logActivity('logs_export', 'Activity logs exported');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Activity Logging
function logActivity(action, details) {
    // In a real implementation, this would save to a logs table in Supabase
    console.log(`Activity Log: ${action} - ${details}`);
}

// UI Helpers
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    // Remove existing notifications of the same type
    const existingNotifications = document.querySelectorAll(`.notification.${type}`);
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

function initializeApp() {
    // Check if user is already logged in
    // Auth state listener handles showing dashboard; nothing else to do here.
}