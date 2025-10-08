// Admin Dashboard JavaScript for Nashr Foundation

// Supabase Configuration
const supabaseConfig = {
    url: 'https://jtuhnndwhotxjjolwcuz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dWhubmR3aG90eGpqb2x3Y3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjU3MDEsImV4cCI6MjA3MjA0MTcwMX0.HJhOCxGDgDERcBfdgBQJsiGoaev5RAtX819eWuMGkhc',
    leaderboard: {
        tableName: 'leaderboard',
        donationsTableName: 'donations'
    }
};

// Initialize Supabase
let supabase;
let currentUser = null;
let charts = {};
let realtimeData = {};
let leaderboardSubscription = null;
let subscribersSubscription = null;
let contentSubscription = null;
let settingsSubscription = null;
let donationsData = [];
let logsData = [];
let currentPage = 1;
let logsCurrentPage = 1;
let subscribersCurrentPage = 1;
const itemsPerPage = 10;
let hasLoggedLoginEvent = false;
let settingsCache = null;
let settingsCacheTime = null;

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
    
    // Setup navigation event listeners
    setupNavigationListeners();
    
    // Initialize real-time features after Supabase is ready
    setTimeout(() => {
        setupRealtimeUpdates();
        setupLivePreview();
    }, 1000);
});

// Supabase Initialization
async function initializeSupabase() {
    try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        
        supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
            auth: {
                storageKey: 'nf_admin',
                persistSession: true,
                autoRefreshToken: true
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'apikey': supabaseConfig.anonKey
                }
            }
        });
        
        // Auth state listener
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                currentUser = { email: session.user.email, uid: session.user.id };
                showDashboard();
                loadDashboardData();
                if (!hasLoggedLoginEvent) {
                    logActivity('admin_login', `User ${session.user.email} logged in`, {
                        login_method: 'email',
                        user_agent: navigator.userAgent,
                        login_time: new Date().toISOString(),
                        session_duration: 'ongoing'
                    });
                    hasLoggedLoginEvent = true;
                }
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                hasLoggedLoginEvent = false;
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
        
        // Add debugging wrapper for all queries
        const originalFrom = supabase.from.bind(supabase);
        supabase.from = function(table) {
            const query = originalFrom(table);
            const originalSelect = query.select.bind(query);
            query.select = function(columns) {
                console.log(`Supabase Query: ${table}.select(${columns})`);
                return originalSelect(columns);
            };
            return query;
        };
        
        // Initialize realtime subscriptions
        setupSubscribersSubscription();
        setupDonationsSubscription();
        setupContentSubscription();
        setupSettingsSubscription();
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
        logActivity('admin_login_failed', `Failed login attempt for ${email}`, {
            login_method: 'email',
            user_agent: navigator.userAgent,
            attempt_time: new Date().toISOString(),
            security_risk: 'medium'
        });
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
    
    // Check if target element exists before accessing classList
    if (e.target && e.target.classList) {
        e.target.classList.add('active');
    }
    
    // Show target section
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Check if target section element exists before accessing classList
    const targetSectionElement = document.getElementById(targetSection);
    if (targetSectionElement) {
        targetSectionElement.classList.add('active');
    }
    
    // Load section-specific data
    loadSectionData(targetSection);
}

// Dashboard Data Loading
async function loadDashboardData() {
    try {
        // Show loading states
        document.getElementById('recent-activity-list').innerHTML = '<div class="loading">Loading recent donations...</div>';
        
        // Load overview data first (which includes leaderboard data)
        await loadOverviewData();
        
        // Only load leaderboard data if we're on the leaderboard section
        // to avoid redundant calls
        const activeSection = document.querySelector('.admin-section.active');
        if (activeSection && activeSection.id === 'leaderboard') {
            await loadLeaderboardData();
        }
        
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
        case 'subscribers':
            await loadSubscribersData();
            break;
        default:
            await loadDashboardData();
            break;
    }
}

// Helper function to get cached settings
async function getCachedSettings() {
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    if (settingsCache && settingsCacheTime && (now - settingsCacheTime) < cacheExpiry) {
        return settingsCache;
    }
    
    try {
        // Fetch all settings rows (key-value format)
        const { data: settingsRows, error } = await supabase
            .from('settings')
            .select('*');
            
        if (error) {
            console.error('Settings fetch error:', error);
            return null;
        }
        
        // Convert key-value rows to object format, but also check direct columns
        const settingsObj = {};
        if (Array.isArray(settingsRows)) {
            // Handle hybrid format: direct columns + key-value rows
            const firstRow = settingsRows[0];
            if (firstRow) {
                // Get direct column values
                settingsObj.title = firstRow.title || '';
                settingsObj.description = firstRow.description || '';
                settingsObj.keywords = firstRow.keywords || '';
                settingsObj.facebook = firstRow.facebook || '';
                settingsObj.instagram = firstRow.instagram || '';
                settingsObj.twitter = firstRow.twitter || '';
                settingsObj.youtube = firstRow.youtube || '';
                settingsObj.fundraising_goal = Number(firstRow.fundraising_goal) || 0;
                settingsObj.goal_description = firstRow.goal_description || '';
                settingsObj.total_raised = Number(firstRow.total_raised) || 0;
                settingsObj.admin_email_notifications = firstRow.admin_email_notifications || 'all';
                settingsObj.backup_frequency = firstRow.backup_frequency || 'daily';
            }
            
            // Override with key-value rows if they exist
            settingsRows.forEach(row => {
                if (row.key && row.value !== null) {
                    // Map key-value to standard field names
                    const keyMapping = {
                        'site_name': 'title',
                        'site_title': 'title',
                        'site_description': 'description',
                        'site_keywords': 'keywords',
                        'facebook_url': 'facebook',
                        'instagram_url': 'instagram',
                        'twitter_url': 'twitter',
                        'youtube_url': 'youtube',
                        'contact_email': 'contact_email'
                    };
                    
                    const fieldName = keyMapping[row.key] || row.key;
                    
                    // Convert numeric values
                    if (['fundraising_goal', 'total_raised'].includes(fieldName)) {
                        settingsObj[fieldName] = Number(row.value) || 0;
                    } else {
                        settingsObj[fieldName] = row.value;
                    }
                }
            });
        }
        
        settingsCache = settingsObj;
        settingsCacheTime = now;
        
        return settingsCache;
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return null;
    }
}

// Helper function to invalidate settings cache
function invalidateSettingsCache() {
    settingsCache = null;
    settingsCacheTime = null;
    // Also clear localStorage cache
    localStorage.removeItem('lastSettingsUpdate');
    localStorage.removeItem('lastContentUpdate');
}

// Real-time updates setup
function setupRealtimeUpdates() {
    try {
        // Settings real-time subscription
        supabase
            .channel('settings-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'settings' },
                (payload) => {
                    console.log('Settings changed:', payload);
                    invalidateSettingsCache();
                    loadSettingsData();
                    showNotification('Settings updated in real-time', 'info');
                }
            )
            .subscribe();

        // Content real-time subscription
        supabase
            .channel('content-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'content' },
                (payload) => {
                    console.log('Content changed:', payload);
                    loadContentData();
                    showNotification('Content updated in real-time', 'info');
                }
            )
            .subscribe();

        // Donations real-time subscription
        supabase
            .channel('donations-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'donations' },
                (payload) => {
                    console.log('Donations changed:', payload);
                    loadOverviewData();
                    loadDonationsData();
                    showNotification('New donation received!', 'success');
                }
            )
            .subscribe();

        console.log('✅ Real-time subscriptions established');
    } catch (error) {
        console.error('Failed to set up real-time updates:', error);
    }
}

// Live preview functionality
function setupLivePreview() {
    // Add preview buttons to forms
    const settingsForm = document.querySelector('#settings form');
    const contentForm = document.querySelector('#content form');
    
    if (settingsForm) {
        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.className = 'btn btn-outline';
        previewBtn.textContent = 'Live Preview';
        previewBtn.onclick = () => previewSettings();
        settingsForm.appendChild(previewBtn);
    }
    
    if (contentForm) {
        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.className = 'btn btn-outline';
        previewBtn.textContent = 'Live Preview';
        previewBtn.onclick = () => previewContent();
        contentForm.appendChild(previewBtn);
    }
}

function previewSettings() {
    const settingsData = {
        title: document.getElementById('site-title').value,
        description: document.getElementById('site-description').value,
        keywords: document.getElementById('keywords').value,
        facebook: document.getElementById('facebook-url').value,
        instagram: document.getElementById('instagram-url').value,
        twitter: document.getElementById('twitter-url').value,
        youtube: document.getElementById('youtube-url').value,
        fundraising_goal: document.getElementById('fundraising-goal-amount').value,
        total_raised: document.getElementById('total-raised-amount')?.value || ''
    };
    
    // Open preview in new window
    const previewWindow = window.open('', '_blank', 'width=1200,height=800');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${settingsData.title || 'Preview'}</title>
            <meta name="description" content="${settingsData.description || ''}">
            <meta name="keywords" content="${settingsData.keywords || ''}">
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .preview-header { background: #2A8D9C; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .preview-content { background: #f5f5f5; padding: 20px; border-radius: 8px; }
                .social-links { margin-top: 20px; }
                .social-links a { margin-right: 15px; color: #2A8D9C; }
            </style>
        </head>
        <body>
            <div class="preview-header">
                <h1>${settingsData.title || 'Site Title'}</h1>
                <p>${settingsData.description || 'Site description'}</p>
            </div>
            <div class="preview-content">
                <h2>Fundraising Progress</h2>
                <p>Goal: PKR ${Number(settingsData.fundraising_goal || 0).toLocaleString()}</p>
                <p>Raised: PKR ${Number(settingsData.total_raised || 0).toLocaleString()}</p>
                <div class="social-links">
                    ${settingsData.facebook ? `<a href="${settingsData.facebook}">Facebook</a>` : ''}
                    ${settingsData.instagram ? `<a href="${settingsData.instagram}">Instagram</a>` : ''}
                    ${settingsData.twitter ? `<a href="${settingsData.twitter}">Twitter</a>` : ''}
                    ${settingsData.youtube ? `<a href="${settingsData.youtube}">YouTube</a>` : ''}
                </div>
            </div>
        </body>
        </html>
    `);
}

function previewContent() {
    const contentData = {
        homepage_title: document.getElementById('homepage-title').value,
        homepage_description: document.getElementById('homepage-description').value,
        homepage_hero_title: document.getElementById('homepage-hero-title').value,
        homepage_hero_description: document.getElementById('homepage-hero-description').value,
        donation_title: document.getElementById('donation-title').value,
        donation_description: document.getElementById('donation-description').value
    };
    
    const previewWindow = window.open('', '_blank', 'width=1200,height=800');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Content Preview</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .hero-section { background: linear-gradient(135deg, #2A8D9C, #1A6E7C); color: white; padding: 60px 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
                .content-section { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="hero-section">
                <h1>${contentData.homepage_hero_title || 'Hero Title'}</h1>
                <p>${contentData.homepage_hero_description || 'Hero description'}</p>
            </div>
            <div class="content-section">
                <h2>${contentData.homepage_title || 'Homepage Title'}</h2>
                <p>${contentData.homepage_description || 'Homepage description'}</p>
            </div>
            <div class="content-section">
                <h2>${contentData.donation_title || 'Donation Title'}</h2>
                <p>${contentData.donation_description || 'Donation description'}</p>
            </div>
        </body>
        </html>
    `);
}

// Notification system
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.admin-notification');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Overview Section
async function loadOverviewData() {
    try {
        showSectionLoading('#overview .activity-list', 'Loading recent donations...');
        showSectionLoading('#overview .stats-grid', 'Loading statistics...');
        
        // Overview should mirror leaderboard for now
        const { data: leaderboardRows, error: donationsError } = await supabase
            .from(supabaseConfig.leaderboard.tableName)
            .select('*')
            .order('total_amount', { ascending: false })
            .limit(50);
            
        console.log('Overview donations data fetched:', leaderboardRows);
        console.log('Overview donations fetch error:', donationsError);
            
        if (donationsError) {
            throw new Error(`Failed to fetch leaderboard for overview: ${donationsError.message}`);
        }
        
        // Get fundraising goal and optional total override from cached settings
        const settings = await getCachedSettings();
        const goalAmount = settings?.fundraising_goal || 1000000;
        const totalRaisedOverride = settings?.total_raised != null ? Number(settings.total_raised) : undefined;
        
        const overviewDonations = (leaderboardRows || []).map(row => ({
            name: row.name || 'Anonymous',
            amount: row.last_donation_amount != null ? row.last_donation_amount : (row.total_amount || 0),
            created_at: row.last_donation_date || row.updated_at || row.created_at || new Date().toISOString(),
            payment_method: row.payment_method || 'Unknown'
        }));

        updateOverviewStats(overviewDonations, goalAmount, totalRaisedOverride);
        updateRecentActivity(overviewDonations);
        
        // Charts disabled by default; enable by setting window.ENABLE_ADMIN_CHARTS = true
        if (window.ENABLE_ADMIN_CHARTS) {
            await loadChartData();
        }

        // Fetch visitors from Umami if configured
        await updateVisitorsFromUmami();
        
        hideSectionLoading('#overview .activity-list');
        hideSectionLoading('#overview .stats-grid');
        
    } catch (error) {
        console.error('Failed to load overview data:', error);
        showError('Failed to load overview data. Please refresh the page.');
        // Empty states
        updateOverviewStats([], 1000000, undefined);
        updateRecentActivity([]);
        hideSectionLoading('#overview .activity-list');
        hideSectionLoading('#overview .stats-grid');
    }
}

async function loadChartData() {
    try {
        // Fetch donations over time for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: donations, error: donationsError } = await supabase
            .from(supabaseConfig.leaderboard.donationsTableName)
            .select('amount, created_at, payment_method')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: true });
            
        if (donationsError) {
            throw new Error(`Failed to fetch chart data: ${donationsError.message}`);
        }
        
        // Process data for donations chart (group by day)
        const donationsByDay = {};
        donations.forEach(donation => {
            const date = new Date(donation.created_at).toISOString().split('T')[0];
            if (!donationsByDay[date]) {
                donationsByDay[date] = 0;
            }
            donationsByDay[date] += donation.amount || 0;
        });
        
        const donationsChartData = Object.entries(donationsByDay).map(([date, amount]) => ({
            date,
            amount
        }));
        
        // Process data for payment methods chart
        const paymentMethods = {};
        donations.forEach(donation => {
            const method = donation.payment_method || 'unknown';
            if (!paymentMethods[method]) {
                paymentMethods[method] = 0;
            }
            paymentMethods[method]++;
        });
        
        const paymentMethodsChartData = Object.entries(paymentMethods).map(([method, count]) => ({
            method,
            count
        }));
        
        // Update charts
        createDonationsChart(donationsChartData);
        createPaymentMethodsChart(paymentMethodsChartData);
        
    } catch (error) {
        console.error('Failed to load chart data:', error);
        // Initialize charts with empty data
        createDonationsChart([]);
        createPaymentMethodsChart([]);
    }
}

function updateOverviewStats(donations, goalAmount, totalRaisedOverride) {
    const computedTotal = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const totalRaised = (typeof totalRaisedOverride === 'number' && !Number.isNaN(totalRaisedOverride)) ? totalRaisedOverride : computedTotal;
    const today = new Date().toISOString().split('T')[0];
    const todayDonations = donations.filter(donation => {
        const d = donation.created_at ? new Date(donation.created_at) : new Date();
        return d.toISOString().split('T')[0] === today;
    });
    const todayAmount = todayDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const totalDonors = donations.length;
    const goal = goalAmount || 1000000;
    const goalProgress = Math.max(0, Math.min(100, Math.round((totalRaised / goal) * 100)));
    
    // Update stats
    document.getElementById('total-donations').textContent = `₨${totalRaised.toLocaleString()}`;
    document.getElementById('fundraising-goal').textContent = `${goalProgress}%`;
    document.getElementById('goal-progress-fill').style.width = `${goalProgress}%`;
    document.getElementById('total-donors').textContent = totalDonors;
    // Remove placeholder; to integrate real analytics (e.g., Umami), fetch here
    const visitorsEl = document.getElementById('website-visitors');
    if (visitorsEl) visitorsEl.textContent = '—';
    
    // Update change indicators
    document.getElementById('donations-change').textContent = `+₨${todayAmount.toLocaleString()} today`;
    document.getElementById('donors-change').textContent = `+${todayDonations.length} today`;
}

function updateRecentActivity(donations) {
    const recentDonations = donations
        .sort((a, b) => {
            const bd = b.created_at ? new Date(b.created_at) : new Date();
            const ad = a.created_at ? new Date(a.created_at) : new Date();
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
        time.textContent = formatTimeAgo(donation.created_at ? new Date(donation.created_at) : new Date());
        
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
        showSectionLoading('#donations-table-body', 'Loading donations...');
        
        // Mirror donations from leaderboard entries per current requirement
        const { data: leaderboardRows, error } = await supabase
            .from(supabaseConfig.leaderboard.tableName)
            .select('*')
            .order('total_amount', { ascending: false });
            
        console.log('Donations data fetched:', leaderboardRows);
        console.log('Donations fetch error:', error);
            
        if (error) {
            throw new Error(`Failed to fetch donations: ${error.message}`);
        }
        
        // Map leaderboard entries to donation-like objects for UI
        donationsData = (leaderboardRows || []).map(row => ({
            id: row.id || row.rank,
            name: row.name || 'Anonymous',
            amount: row.last_donation_amount != null ? row.last_donation_amount : (row.total_amount || 0),
            payment_method: row.payment_method || 'Unknown',
            created_at: row.last_donation_date || row.updated_at || row.created_at || new Date().toISOString()
        }));
        displayDonationsTable(donationsData);
        setupPagination(donationsData);
        
        hideSectionLoading('#donations-table-body');
        
    } catch (error) {
        console.error('Failed to load donations data:', error);
        showError('Failed to load donations data. Please refresh the page.');
        displayDonationsTable([]);
        setupPagination([]);
        hideSectionLoading('#donations-table-body');
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
        dateCell.textContent = formatDate(donation.created_at ? new Date(donation.created_at) : new Date());
        
        const nameCell = document.createElement('td');
        nameCell.textContent = donation.name || 'Anonymous';
        
        const amountCell = document.createElement('td');
        amountCell.textContent = `₨${(donation.amount != null ? donation.amount.toLocaleString() : '0')}`;
        
        const methodCell = document.createElement('td');
        methodCell.textContent = donation.payment_method || 'Unknown';
        
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
// Leaderboard Section
async function loadLeaderboardData() {
    try {
        showSectionLoading('#admin-leaderboard-body', 'Loading leaderboard...');
        
        // Clear any existing subscription
        if (leaderboardSubscription) {
            leaderboardSubscription.unsubscribe();
            leaderboardSubscription = null;
        }
        
        // Fetch leaderboard entries directly
        let { data: leaderboardData, error } = await supabase
            .from(supabaseConfig.leaderboard.tableName)
            .select('*')
            .order('total_amount', { ascending: false })
            .limit(50);
        
        console.log('Leaderboard data fetched:', leaderboardData);
        console.log('Leaderboard fetch error:', error);
        
        if (error) {
            throw new Error(`Failed to fetch leaderboard: ${error.message}`);
        }
        
        // Assign ranks
        const sortedData = (leaderboardData || []).map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));
        
        window._leaderboardData = sortedData;
        displayLeaderboardTable(sortedData);
        
        // Set up real-time subscription for leaderboard changes
        setupLeaderboardSubscription();
        
        hideSectionLoading('#admin-leaderboard-body');
        
    } catch (error) {
        console.error('Failed to load leaderboard data:', error);
        showError('Failed to load leaderboard data. Please refresh the page.');
        hideSectionLoading('#admin-leaderboard-body');
    }
}

// Function to populate leaderboard from donations data
async function populateLeaderboardFromDonations() {
    try {
        // Fetch all donations
        const { data: donations, error: donationsError } = await supabase
            .from(supabaseConfig.leaderboard.donationsTableName)
            .select('*');
            
        if (donationsError) {
            throw new Error(`Failed to fetch donations: ${donationsError.message}`);
        }
        
        if (!donations || donations.length === 0) {
            console.log('No donations found to populate leaderboard');
            return;
        }
        
        // Group donations by name and calculate totals
        const donorMap = {};
        donations.forEach(donation => {
            // Skip anonymous or ineligible donations
            if (!donation.name || donation.name === 'Anonymous' || !donation.leaderboard_eligible) {
                return;
            }
            
            if (!donorMap[donation.name]) {
                donorMap[donation.name] = {
                    name: donation.name,
                    total_amount: 0,
                    donation_count: 0,
                    first_donation_date: donation.created_at,
                    last_donation_date: donation.created_at,
                    last_donation_amount: 0
                };
            }
            
            donorMap[donation.name].total_amount += donation.amount;
            donorMap[donation.name].donation_count += 1;
            if (new Date(donation.created_at) > new Date(donorMap[donation.name].last_donation_date)) {
                donorMap[donation.name].last_donation_date = donation.created_at;
                donorMap[donation.name].last_donation_amount = donation.amount;
            }
        });
        
        // Convert to array and filter out donors below minimum amount
        const leaderboardEntries = Object.values(donorMap)
            .filter(donor => donor.total_amount >= 500) // Minimum amount from config
            .sort((a, b) => b.total_amount - a.total_amount);
        
        if (leaderboardEntries.length === 0) {
            console.log('No eligible donors found for leaderboard');
            return;
        }
        
        // Insert entries into leaderboard table
        const { error: insertError } = await supabase
            .from(supabaseConfig.leaderboard.tableName)
            .insert(leaderboardEntries.map(donor => ({
                ...donor,
                created_at: donor.first_donation_date,
                updated_at: new Date().toISOString()
            })));
            
        if (insertError) {
            console.error('Failed to populate leaderboard:', insertError);
            throw new Error(`Failed to populate leaderboard: ${insertError.message}`);
        }
        
        console.log(`✅ Successfully populated leaderboard with ${leaderboardEntries.length} entries`);
        
    } catch (error) {
        console.error('Error populating leaderboard from donations:', error);
        // Don't throw error to allow CSV fallback to work
    }
}

// Function to load leaderboard from CSV as fallback
async function loadLeaderboardFromCSV() {
    try {
        const res = await fetch('leaderboard.csv', { credentials: 'omit' });
        if (!res.ok) throw new Error('Failed to fetch leaderboard.csv');
        const text = await res.text();
        const lines = text.split(/\r?\n/).filter(Boolean);
        // Expect header: Rank,Name,Amount
        const data = lines.slice(1).map((line, index) => {
            const [rankStr, name, amountStr] = line.split(',');
            const rank = parseInt(rankStr, 10) || index + 1;
            const amount = parseInt((amountStr || '').replace(/[^0-9]/g, ''), 10) || 0;
            return { rank, name: name || 'Anonymous', total_amount: amount };
        });
        window._leaderboardData = data;
        displayLeaderboardTable(data);
    } catch (error) {
        console.error('Failed to load leaderboard from CSV:', error);
        displayLeaderboardTable([]);
    }
}

// Real-time subscription for leaderboard changes
function setupLeaderboardSubscription() {
    try {
        if (leaderboardSubscription) {
            leaderboardSubscription.unsubscribe();
            leaderboardSubscription = null;
        }
        leaderboardSubscription = supabase
            .channel('leaderboard-changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: supabaseConfig.leaderboard.tableName
                },
                (payload) => {
                    console.log('Leaderboard change detected:', payload);
                    loadLeaderboardData();
                }
            )
            .subscribe();
        console.log('✅ Leaderboard real-time subscription established');
    } catch (error) {
        console.error('Failed to set up leaderboard subscription:', error);
    }
}

function setupSubscribersSubscription() {
    try {
        // Clear existing subscription
        if (subscribersSubscription) {
            subscribersSubscription.unsubscribe();
            subscribersSubscription = null;
        }

        subscribersSubscription = supabase
            .channel('newsletter-subscribers-changes')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'newsletter_subscribers'
                },
                (payload) => {
                    const newSub = payload.new || {};
                    // Show admin notification
                    if (window.adminNotifications) {
                        window.adminNotifications.addNotification({
                            type: 'success',
                            title: 'New Subscriber',
                            message: `${newSub.email || 'Unknown'} subscribed to the newsletter`,
                            action: () => {
                                const link = document.querySelector('[data-section="subscribers"]');
                                if (link) link.click();
                            }
                        });
                    }
                    // If subscribers section open, refresh data
                    if (document.getElementById('subscribers')?.classList.contains('active')) {
                        loadSubscribersData();
                    }
                }
            )
            .subscribe();

        console.log('✅ Subscribers real-time subscription established');
    } catch (error) {
        console.error('Failed to set up subscribers subscription:', error);
    }
}

function setupContentSubscription() {
    try {
        if (contentSubscription) {
            contentSubscription.unsubscribe();
            contentSubscription = null;
        }
        contentSubscription = supabase
            .channel('content-changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'content'
                },
                () => {
                    // Refresh content editor if active
                    if (document.getElementById('content')?.classList.contains('active')) {
                        loadContentData();
                    }
                }
            )
            .subscribe();
    } catch (error) {
        console.error('Failed to set up content subscription:', error);
    }
}

function setupSettingsSubscription() {
    try {
        if (settingsSubscription) {
            settingsSubscription.unsubscribe();
            settingsSubscription = null;
        }
        settingsSubscription = supabase
            .channel('settings-changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'settings'
                },
                () => {
                    // Refresh settings editor if active
                    if (document.getElementById('settings')?.classList.contains('active')) {
                        loadSettingsData();
                    }
                }
            )
            .subscribe();
    } catch (error) {
        console.error('Failed to set up settings subscription:', error);
    }
}

function setupDonationsSubscription() {
    try {
        if (realtimeData.donationsChannel) {
            realtimeData.donationsChannel.unsubscribe();
            realtimeData.donationsChannel = null;
        }

        realtimeData.donationsChannel = supabase
            .channel('donations-changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: supabaseConfig.leaderboard.donationsTableName
                },
                (payload) => {
                    // Refresh relevant sections
                    if (document.getElementById('dashboard')?.classList.contains('active')) {
                        loadDashboardData();
                    }
                    if (document.getElementById('donations')?.classList.contains('active')) {
                        loadDonationsData();
                    }
                }
            )
            .subscribe();

        console.log('✅ Donations real-time subscription established');
    } catch (error) {
        console.error('Failed to set up donations subscription:', error);
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
        const displayAmount = (entry.total_amount != null ? entry.total_amount : entry.amount) || 0;
        amountCell.textContent = `₨${Number(displayAmount).toLocaleString()}`;
        
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
        // Load content from Supabase if available; skip silently if table missing
        const { data: contentRows, error } = await supabase
            .from('content')
            .select('*')
            .limit(1);
        if (error) {
            console.warn('Content table not available or fetch failed:', error);
        }
        const content = Array.isArray(contentRows) ? contentRows[0] : null;
        if (content) {
            if (document.getElementById('homepage-title')) document.getElementById('homepage-title').value = content.homepage_title || '';
            if (document.getElementById('homepage-description')) document.getElementById('homepage-description').value = content.homepage_description || '';
            if (document.getElementById('homepage-hero-title')) document.getElementById('homepage-hero-title').value = content.homepage_hero_title || '';
            if (document.getElementById('homepage-hero-description')) document.getElementById('homepage-hero-description').value = content.homepage_hero_description || '';
            if (document.getElementById('donation-title')) document.getElementById('donation-title').value = content.donation_title || '';
            if (document.getElementById('donation-description')) document.getElementById('donation-description').value = content.donation_description || '';
            if (document.getElementById('donation-impact-title')) document.getElementById('donation-impact-title').value = content.donation_impact_title || '';
        }
        
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
        
        (async () => {
            try {
                // Upsert into content table as single row
                const payload = {
                    homepage_title: homepageContent.title,
                    homepage_description: homepageContent.description,
                    homepage_hero_title: homepageContent.heroTitle,
                    homepage_hero_description: homepageContent.heroDescription,
                    donation_title: donationContent.title,
                    donation_description: donationContent.description,
                    donation_impact_title: donationContent.impactTitle,
                    updated_at: new Date().toISOString()
                };
                const { data: existing, error: fetchErr } = await supabase
                    .from('content')
                    .select('id')
                    .limit(1);
                if (fetchErr) throw fetchErr;
                if (Array.isArray(existing) && existing[0]?.id) {
                    const { error: updateErr } = await supabase
                        .from('content')
                        .update(payload)
                        .eq('id', existing[0].id);
                    if (updateErr) throw updateErr;
                } else {
                    const { error: insertErr } = await supabase
                        .from('content')
                        .insert([payload]);
                    if (insertErr) throw insertErr;
                }
                showSuccess('Content changes saved successfully!');
                showNotification('Content updated successfully!', 'success');
                logActivity('content_update', 'Website content updated', {
                    content_sections: ['homepage', 'donation'],
                    fields_updated: Object.keys(payload).filter(key => payload[key])
                });
                localStorage.setItem('lastContentUpdate', new Date().toISOString());
            } catch (err) {
                console.error('Failed to save content:', err);
                showError('Failed to save content changes. Please try again.');
            }
        })();
    } catch (error) {
        console.error('Failed to save content:', error);
        showError('Failed to save content changes. Please try again.');
    }
}

// Newsletter Management
async function loadNewsletterData() {
    try {
        console.log('Loading newsletter data...');
        
        // Just load subscribers data for the table, no statistics needed
        await loadSubscribersData();
        
    } catch (error) {
        console.error('Failed to load newsletter data:', error);
        showError('Failed to load newsletter data. Please try again.');
    }
}

async function sendNewsletter() {
    try {
        const subject = document.getElementById('newsletter-subject').value;
        const content = document.getElementById('newsletter-content').value;
        const recipientsInput = document.getElementById('newsletter-recipients').value;
        
        if (!subject || !content) {
            showError('Subject and content required');
            return;
        }
        
        // Show loading state
        const sendButton = document.querySelector('#newsletter .btn-primary');
        const originalText = sendButton ? sendButton.innerHTML : 'Send Newsletter';
        if (sendButton) {
            sendButton.innerHTML = '<div class="inline-loader"></div> Sending...';
            sendButton.disabled = true;
        }
        
        // Collect recipients: prefer active subscribers from DB; if input is provided, use it as CSV override
        let recipients = [];
        const csvOverride = (recipientsInput || '').trim();
        console.log('Newsletter recipients input:', { csvOverride, hasInput: !!csvOverride });
        
        if (csvOverride && csvOverride !== 'all') {
            // Handle manual email input (comma or line separated)
            recipients = csvOverride
                .split(/[\n,;]+/)
                .map(s => s.trim())
                .filter(Boolean);
            console.log('Recipients from input:', recipients);
        } else {
            console.log('Fetching active subscribers from database...');
            const { data: subs, error } = await supabase
                .from('newsletter_subscribers')
                .select('email, status')
                .eq('status', 'active');
            console.log('Database query result:', { subs, error, count: subs?.length });
            if (error) {
                console.error('Newsletter subscribers query error:', error);
                // If table doesn't exist or permission denied, show helpful message
                if (error.code === 'PGRST116' || error.code === '42501' || 
                    error.message.includes('relation') || error.message.includes('does not exist') ||
                    error.message.includes('permission denied') || error.message.includes('Forbidden') ||
                    error.message.includes('row-level security policy')) {
                    showError('Newsletter subscribers table not accessible due to RLS policies. Please run the SQL commands in Supabase to create the necessary policies, or add emails manually.');
                    if (sendButton) {
                        sendButton.innerHTML = originalText;
                        sendButton.disabled = false;
                    }
                    return;
                }
                throw error;
            }
            recipients = (subs || []).map(s => s.email).filter(Boolean);
            console.log('Recipients from database:', recipients);
        }

        // Normalize emails: lowercase, trim, and deduplicate; basic validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const beforeValidation = recipients.length;
        const invalidEmails = [];
        recipients = Array.from(new Set(
            recipients
                .map(e => (e || '').trim().toLowerCase())
                .filter(e => {
                    if (emailPattern.test(e)) {
                        return true;
                    } else {
                        invalidEmails.push(e);
                        return false;
                    }
                })
        ));
        console.log('Recipients after validation:', { beforeValidation, afterValidation: recipients.length, recipients, invalidEmails });
        
        // Show warning for invalid emails
        if (invalidEmails.length > 0) {
            showError(`Invalid email addresses found: ${invalidEmails.join(', ')}. Please use valid email addresses.`);
        }
        
        if (!recipients.length) {
            showError('No recipients found. Add subscribers in the Subscribers section or provide emails in the Recipients field.');
            // Add a button to quickly add test subscribers
            try {
                const errorDiv = document.createElement('div');
                errorDiv.innerHTML = `
                    <div style="margin-top: 10px;">
                        <button onclick="addTestSubscribers()" class="btn btn-outline btn-sm">
                            Add Test Subscribers
                        </button>
                    </div>
                `;
                const errorContainer = document.querySelector('#newsletter .error-message');
                if (errorContainer) {
                    errorContainer.appendChild(errorDiv);
                }
            } catch (e) {
                console.warn('Could not add test subscribers button:', e);
            }
            if (sendButton) {
                sendButton.innerHTML = originalText;
                sendButton.disabled = false;
            }
            return;
        }
        
        // Ensure EmailJS service is available
        if (!window.emailService) {
            showError('Email service not loaded. Please refresh the page.');
            if (sendButton) {
                sendButton.innerHTML = originalText;
                sendButton.disabled = false;
            }
            return;
        }
        
        console.log('Sending newsletter via EmailJS...');
        console.log('Recipients:', recipients.length);
        
        // Send per-recipient via EmailJS (handles template variables)
        let sentCount = 0;
        const maxRetries = 2;
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            let attempt = 0;
            while (true) {
                try {
                    console.log(`Sending to ${recipient} (${i + 1}/${recipients.length})`);
                    const result = await window.emailService.sendEmail(
                        recipient,
                        subject,
                        content,
                        'newsletter'
                    );
                    console.log('Email sent successfully:', { recipient, result, attempt: attempt + 1 });
                    sentCount++;
                    break;
                } catch (err) {
                    console.log('Email send error:', { error: err.message, recipient, attempt: attempt + 1, maxRetries: maxRetries + 1, willRetry: attempt < maxRetries });
                    if (attempt >= maxRetries) {
                        console.error('Max retries reached for recipient:', recipient);
                        throw new Error(`Failed to send to ${recipient}: ${err.message}`);
                    }
                    const delay = 1000 * Math.pow(2, attempt);
                    await new Promise(r => setTimeout(r, delay));
                    attempt++;
                }
            }
            if (i < recipients.length - 1) {
                await new Promise(r => setTimeout(r, 100));
            }
        }
        
        showSuccess(`Newsletter sent to ${sentCount} recipients via EmailJS!`);
        await logActivity('newsletter_sent', `Newsletter "${subject}" sent to ${sentCount} recipients via EmailJS`);
        
        // Clear form
        document.getElementById('newsletter-subject').value = '';
        document.getElementById('newsletter-content').value = '';
        
        // Reset button
        if (sendButton) {
            sendButton.innerHTML = originalText;
            sendButton.disabled = false;
        }
        
        // Refresh statistics
        loadNewsletterData();
        
    } catch (error) {
        console.error('Failed to send newsletter:', error);
        showError('Failed to send newsletter. Please try again.');
        
        // Reset button
        const sendButton = document.querySelector('#newsletter .btn-primary');
        if (sendButton) {
            sendButton.innerHTML = 'Send Newsletter';
            sendButton.disabled = false;
        }
    }
}

// Settings Management
async function loadSettingsData() {
    try {
        // Load current settings from cache or Supabase
        const s = await getCachedSettings();
        if (s) {
            if (document.getElementById('site-title')) document.getElementById('site-title').value = s.title || '';
            if (document.getElementById('site-description')) document.getElementById('site-description').value = s.description || '';
            if (document.getElementById('keywords')) document.getElementById('keywords').value = s.keywords || '';
            if (document.getElementById('facebook-url')) document.getElementById('facebook-url').value = s.facebook || '';
            if (document.getElementById('instagram-url')) document.getElementById('instagram-url').value = s.instagram || '';
            if (document.getElementById('twitter-url')) document.getElementById('twitter-url').value = s.twitter || '';
            if (document.getElementById('youtube-url')) document.getElementById('youtube-url').value = s.youtube || '';
            if (document.getElementById('fundraising-goal-amount')) document.getElementById('fundraising-goal-amount').value = (s.fundraising_goal != null ? s.fundraising_goal : '');
            if (document.getElementById('goal-description')) document.getElementById('goal-description').value = s.goal_description || '';
            if (document.getElementById('total-raised-amount')) {
                let totalRaisedValue = (s.total_raised != null ? s.total_raised : '');
                try {
                    if (totalRaisedValue === '' || totalRaisedValue == null) {
                        // Fallback: compute from donations table if settings.total_raised missing
                        const { data: donations, error: donationsErr } = await supabase
                            .from('donations')
                            .select('amount, payment_status');
                        if (!donationsErr && Array.isArray(donations)) {
                            // Include all donations, not just completed ones
                            totalRaisedValue = donations
                                .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
                        }
                    }
                } catch(e) {}
                document.getElementById('total-raised-amount').value = totalRaisedValue;
            }
            if (document.getElementById('admin-email-notifications')) document.getElementById('admin-email-notifications').value = s.admin_email_notifications || 'all';
            if (document.getElementById('backup-frequency')) document.getElementById('backup-frequency').value = s.backup_frequency || 'daily';
            // Auto-configure newsletter endpoint if provided in settings and not already set
            if (!window.RESEND_FUNCTION_URL && s.email_function_url) {
                window.RESEND_FUNCTION_URL = String(s.email_function_url || '').trim();
            } else if (!window.RESEND_FUNCTION_URL) {
                // Auto-configure Supabase Edge Function if no endpoint is set
                configureSupabaseEdgeFunction('super-function');
            }
        }
    } catch (error) {
        console.error('Failed to load settings data:', error);
        showError('Failed to load settings data. Please try again.');
    }
}

function saveSettings() {
    try {
        // Get settings values
        const settingsData = {
            title: document.getElementById('site-title').value,
            description: document.getElementById('site-description').value,
            keywords: document.getElementById('keywords').value,
            facebook: document.getElementById('facebook-url').value,
            instagram: document.getElementById('instagram-url').value,
            twitter: document.getElementById('twitter-url').value,
            youtube: document.getElementById('youtube-url').value,
            fundraising_goal: document.getElementById('fundraising-goal-amount').value,
            goal_description: document.getElementById('goal-description').value,
            total_raised: document.getElementById('total-raised-amount') ? document.getElementById('total-raised-amount').value : '',
            admin_email_notifications: document.getElementById('admin-email-notifications').value,
            backup_frequency: document.getElementById('backup-frequency').value
        };
        
        (async () => {
            try {
                // Check if we have direct columns or key-value format
                const { data: existingSettings, error: fetchErr } = await supabase
                    .from('settings')
                    .select('*')
                    .limit(1);
                if (fetchErr) throw fetchErr;
                
                const firstRow = Array.isArray(existingSettings) ? existingSettings[0] : null;
                const now = new Date().toISOString();
                
                if (firstRow && firstRow.title !== undefined) {
                    // Direct column format - update the first row
                    const payload = {
                        title: settingsData.title,
                        description: settingsData.description,
                        keywords: settingsData.keywords,
                        facebook: settingsData.facebook,
                        instagram: settingsData.instagram,
                        twitter: settingsData.twitter,
                        youtube: settingsData.youtube,
                        fundraising_goal: parseInt(settingsData.fundraising_goal, 10) || 0,
                        goal_description: settingsData.goal_description,
                        total_raised: parseInt(settingsData.total_raised, 10) || 0,
                        admin_email_notifications: settingsData.admin_email_notifications,
                        backup_frequency: settingsData.backup_frequency,
                        updated_at: now
                    };
                    
                    const { error: updateErr } = await supabase
                        .from('settings')
                        .update(payload)
                        .eq('id', firstRow.id);
                    
                    if (updateErr) throw updateErr;
                    
                    // Also update/create key-value rows for important fields
                    const keyValueUpdates = [
                        { key: 'site_name', value: settingsData.title },
                        { key: 'site_title', value: settingsData.title },
                        { key: 'site_description', value: settingsData.description },
                        { key: 'site_keywords', value: settingsData.keywords },
                        { key: 'facebook_url', value: settingsData.facebook },
                        { key: 'instagram_url', value: settingsData.instagram },
                        { key: 'twitter_url', value: settingsData.twitter },
                        { key: 'youtube_url', value: settingsData.youtube },
                        { key: 'fundraising_goal', value: String(settingsData.fundraising_goal) },
                        { key: 'total_raised', value: String(settingsData.total_raised) }
                    ];
                    
                    // Upsert key-value rows
                    for (const kv of keyValueUpdates) {
                        if (kv.value && kv.value.trim() !== '') {
                            const { data: existing } = await supabase
                                .from('settings')
                                .select('id')
                                .eq('key', kv.key)
                                .limit(1);
                            
                            if (existing && existing.length > 0) {
                                await supabase
                                    .from('settings')
                                    .update({ value: kv.value, updated_at: now })
                                    .eq('key', kv.key);
                            } else {
                                await supabase
                                    .from('settings')
                                    .insert([{
                                        key: kv.key,
                                        value: kv.value,
                                        created_at: now,
                                        updated_at: now
                                    }]);
                            }
                        }
                    }
                } else {
                    // Key-value format - upsert each setting
                    const existingMap = {};
                    const { data: allSettings } = await supabase.from('settings').select('*');
                    if (Array.isArray(allSettings)) {
                        allSettings.forEach(row => {
                            existingMap[row.key] = row.id;
                        });
                    }
                    
                    const upsertPromises = [];
                    Object.entries(settingsData).forEach(([key, value]) => {
                        if (value !== null && value !== undefined && value !== '') {
                            const upsertData = {
                                key: key,
                                value: String(value),
                                updated_at: now
                            };
                            
                            if (existingMap[key]) {
                                upsertPromises.push(
                                    supabase
                                        .from('settings')
                                        .update(upsertData)
                                        .eq('id', existingMap[key])
                                );
                            } else {
                                upsertPromises.push(
                                    supabase
                                        .from('settings')
                                        .insert([{
                                            ...upsertData,
                                            created_at: now
                                        }])
                                );
                            }
                        }
                    });
                    
                    const results = await Promise.all(upsertPromises);
                    const errors = results.filter(r => r.error);
                    if (errors.length > 0) {
                        console.error('Some settings failed to save:', errors);
                        showError('Some settings failed to save. Please try again.');
                        return;
                    }
                }
                
                showSuccess('Settings saved successfully!');
                showNotification('Settings updated successfully!', 'success');
                logActivity('settings_update', 'System settings updated', {
                    settings_changed: Object.keys(settingsData).filter(key => settingsData[key]),
                    total_changes: Object.keys(settingsData).length
                });
                
                // Invalidate cache and reload
                invalidateSettingsCache();
                localStorage.setItem('lastSettingsUpdate', now);
                await loadSettingsData();
                await loadOverviewData();
                
            } catch (err) {
                console.error('Failed to save settings:', err);
                showError('Failed to save settings. Please try again.');
            }
        })();
    } catch (error) {
        console.error('Failed to save settings:', error);
        showError('Failed to save settings. Please try again.');
    }
}

// Activity Logs
async function loadLogsData() {
    try {
        showSectionLoading('#logs-table-body', 'Loading activity logs...');
        
        // Fetch real-time activity logs from Supabase with enhanced data
        const { data: logs, error } = await supabase
            .from('activity_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(200); // Increased limit for more detailed logs
            
        if (error) {
            console.warn('Logs table not available or fetch failed:', error);
            displayLogsTable([]);
            setupLogsPagination([]);
            hideSectionLoading('#logs-table-body');
            return;
        }
        
        logsData = logs || [];
        displayLogsTable(logsData);
        setupLogsPagination(logsData);
        setupLogsFilters(logsData);
        
        hideSectionLoading('#logs-table-body');
        
        // Set up auto-refresh for activity logs
        setupLogsAutoRefresh();
        
    } catch (error) {
        console.error('Failed to load logs data:', error);
        displayLogsTable([]);
        setupLogsPagination([]);
        hideSectionLoading('#logs-table-body');
    }
}

// Auto-refresh activity logs every 30 seconds
function setupLogsAutoRefresh() {
    // Clear existing interval
    if (window.logsRefreshInterval) {
        clearInterval(window.logsRefreshInterval);
    }
    
    // Set up new interval
    window.logsRefreshInterval = setInterval(async () => {
        try {
            const { data: newLogs, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(10); // Only get recent logs for updates
                
            if (!error && newLogs && newLogs.length > 0) {
                // Check if there are new logs
                const latestLog = newLogs[0];
                const lastKnownLog = logsData[0];
                
                if (!lastKnownLog || new Date(latestLog.timestamp) > new Date(lastKnownLog.timestamp)) {
                    console.log('New activity logs detected, refreshing...');
                    await loadLogsData();
                    showNotification('New activity detected', 'info');
                }
            }
        } catch (error) {
            console.warn('Auto-refresh logs failed:', error);
        }
    }, 30000); // 30 seconds
}

// Enhanced logs display with modern UI/UX
function displayLogsTable(logs) {
    const tableBody = document.getElementById('logs-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (logs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data-state">
                    <div class="no-data-content">
                        <div class="no-data-icon">No Data</div>
                        <h3>No Activity Logs</h3>
                        <p>Activity logs will appear here as users interact with the system.</p>
                        <button class="btn btn-primary" onclick="loadLogsData()">Refresh</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    logs.forEach((log, index) => {
        const row = document.createElement('tr');
        row.className = `log-row log-${log.severity || 'info'}`;
        row.style.animationDelay = `${index * 0.1}s`;
        
        // Timestamp with relative time and status indicator
        const timestampCell = document.createElement('td');
        const date = new Date(log.timestamp);
        const relativeTime = getRelativeTime(date);
        const isRecent = (Date.now() - date.getTime()) < 300000; // 5 minutes
        timestampCell.innerHTML = `
            <div class="log-timestamp">
                <div class="log-time">${date.toLocaleTimeString()}</div>
                <div class="log-date">${date.toLocaleDateString()}</div>
                <div class="log-relative ${isRecent ? 'recent' : ''}">${relativeTime}</div>
                ${isRecent ? '<div class="status-indicator new"></div>' : ''}
            </div>
        `;
        
        // User with avatar
        const userCell = document.createElement('td');
        userCell.innerHTML = `
            <div class="log-user">
                <div class="user-avatar">${getUserInitials(log.user)}</div>
                <div class="user-info">
                    <div class="user-name">${log.user}</div>
                    <div class="user-session">${log.metadata?.session_id ? log.metadata.session_id.substring(0, 8) + '...' : 'N/A'}</div>
                </div>
            </div>
        `;
        
        // Action with category and severity
        const actionCell = document.createElement('td');
        const severityIcon = getSeverityIcon(log.severity || 'info');
        const categoryBadge = getCategoryBadge(log.category || 'general');
        const actionType = log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        actionCell.innerHTML = `
            <div class="log-action">
                <div class="action-header">
                    <span class="severity-icon">${severityIcon}</span>
                    <span class="action-name">${actionType}</span>
                    ${categoryBadge}
                </div>
                <div class="action-details">${log.details}</div>
                <div class="action-meta">
                    <span class="action-source">${log.metadata?.user_agent ? 'Web' : 'System'}</span>
                    ${log.metadata?.ip ? `<span class="action-ip">${log.metadata.ip}</span>` : ''}
                </div>
            </div>
        `;
        
        // Metadata with expandable details
        const metadataCell = document.createElement('td');
        const metadata = log.metadata || {};
        metadataCell.innerHTML = `
            <div class="log-metadata">
                <div class="metadata-summary">
                    <span class="metadata-item">${metadata.user_agent ? metadata.user_agent.split(' ')[0] : 'Unknown'}</span>
                    <span class="metadata-item">${metadata.screen_resolution || 'N/A'}</span>
                </div>
                <button class="btn btn-sm btn-outline metadata-toggle" onclick="toggleMetadata(this)">
                    <span class="toggle-text">Show Details</span>
                    <span class="toggle-icon">▼</span>
                </button>
                <div class="metadata-details" style="display: none;">
                    <div class="metadata-grid">
                        <div class="metadata-item"><strong>IP:</strong> ${log.ip}</div>
                        <div class="metadata-item"><strong>Referrer:</strong> ${metadata.referrer || 'Direct'}</div>
                        <div class="metadata-item"><strong>Viewport:</strong> ${metadata.viewport_size || 'N/A'}</div>
                        <div class="metadata-item"><strong>Timezone:</strong> ${metadata.timezone || 'N/A'}</div>
                        <div class="metadata-item"><strong>Language:</strong> ${metadata.language || 'N/A'}</div>
                        <div class="metadata-item"><strong>Page URL:</strong> ${metadata.page_url || 'N/A'}</div>
                        ${metadata.element_id ? `<div class="metadata-item"><strong>Element ID:</strong> ${metadata.element_id}</div>` : ''}
                        ${metadata.element_class ? `<div class="metadata-item"><strong>Element Class:</strong> ${metadata.element_class}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <div class="log-actions">
                <button class="btn btn-sm btn-outline" onclick="copyLogDetails('${JSON.stringify(log).replace(/'/g, "\\'")}')" title="Copy Details">
                    Copy
                </button>
                <button class="btn btn-sm btn-outline" onclick="exportLogEntry('${log.id || ''}')" title="Export">
                    Export
                </button>
                ${log.severity === 'error' ? `<button class="btn btn-sm btn-danger" onclick="markAsResolved('${log.id || ''}')" title="Mark as Resolved">✓</button>` : ''}
            </div>
        `;
        
        row.appendChild(timestampCell);
        row.appendChild(userCell);
        row.appendChild(actionCell);
        row.appendChild(metadataCell);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
}

// Helper functions for enhanced logs display
function getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
}

function getUserInitials(user) {
    return user.split('@')[0].substring(0, 2).toUpperCase();
}

function getSeverityIcon(severity) {
    const icons = {
        'success': '',
        'info': '',
        'warning': '',
        'error': ''
    };
    return icons[severity] || '';
}

function getCategoryBadge(category) {
    const colors = {
        'authentication': '#3B82F6',
        'configuration': '#8B5CF6',
        'content': '#10B981',
        'donations': '#F59E0B',
        'user_management': '#EF4444',
        'system': '#6B7280',
        'security': '#DC2626',
        'backup': '#059669',
        'data_management': '#7C3AED',
        'general': '#6B7280'
    };
    
    const color = colors[category] || '#6B7280';
    return `<span class="category-badge" style="background-color: ${color}">${category}</span>`;
}

// Enhanced filtering and utility functions
function setupLogsFilters(logs) {
    // Add filter controls to the logs section
    const logsSection = document.querySelector('#logs');
    if (!logsSection) return;
    
    // Check if filters already exist
    if (document.querySelector('.logs-filters')) return;
    
    const filterContainer = document.createElement('div');
    filterContainer.className = 'logs-filters';
    filterContainer.innerHTML = `
        <div class="filter-row">
            <div class="filter-group">
                <label>Severity:</label>
                <select id="severity-filter" onchange="filterLogs()">
                    <option value="">All</option>
                    <option value="success">✅ Success</option>
                    <option value="info">ℹ️ Info</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="error">❌ Error</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Category:</label>
                <select id="category-filter" onchange="filterLogs()">
                    <option value="">All</option>
                    <option value="authentication">Authentication</option>
                    <option value="configuration">Configuration</option>
                    <option value="content">Content</option>
                    <option value="donations">Donations</option>
                    <option value="user_management">User Management</option>
                    <option value="system">System</option>
                    <option value="security">Security</option>
                    <option value="backup">Backup</option>
                    <option value="data_management">Data Management</option>
                </select>
            </div>
            <div class="filter-group">
                <label>User:</label>
                <input type="text" id="user-filter" placeholder="Filter by user..." onkeyup="filterLogs()">
            </div>
            <div class="filter-group">
                <label>Date Range:</label>
                <input type="date" id="date-from" onchange="filterLogs()">
                <input type="date" id="date-to" onchange="filterLogs()">
            </div>
            <div class="filter-actions">
                <button class="btn btn-outline" onclick="clearFilters()">Clear</button>
                <button class="btn btn-primary" onclick="exportLogs()">Export All</button>
            </div>
        </div>
    `;
    
    // Insert filters before the table
    const table = logsSection.querySelector('table');
    if (table) {
        table.parentNode.insertBefore(filterContainer, table);
    }
}

function filterLogs() {
    const severityFilter = document.getElementById('severity-filter')?.value || '';
    const categoryFilter = document.getElementById('category-filter')?.value || '';
    const userFilter = document.getElementById('user-filter')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('date-from')?.value || '';
    const dateTo = document.getElementById('date-to')?.value || '';
    
    let filteredLogs = logsData.filter(log => {
        // Severity filter
        if (severityFilter && log.severity !== severityFilter) return false;
        
        // Category filter
        if (categoryFilter && log.category !== categoryFilter) return false;
        
        // User filter
        if (userFilter && !log.user.toLowerCase().includes(userFilter)) return false;
        
        // Date range filter
        if (dateFrom || dateTo) {
            const logDate = new Date(log.timestamp);
            if (dateFrom && logDate < new Date(dateFrom)) return false;
            if (dateTo && logDate > new Date(dateTo + 'T23:59:59')) return false;
        }
        
        return true;
    });
    
    displayLogsTable(filteredLogs);
    setupLogsPagination(filteredLogs);
}

function clearFilters() {
    document.getElementById('severity-filter').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('user-filter').value = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    filterLogs();
}

function exportLogs() {
    const logsToExport = logsData.map(log => ({
        timestamp: log.timestamp,
        user: log.user,
        action: log.action,
        details: log.details,
        severity: log.severity,
        category: log.category,
        ip: log.ip,
        metadata: log.metadata
    }));
    
    const csv = convertToCSV(logsToExport);
    downloadCSV(csv, `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
}

function convertToCSV(data) {
    const headers = ['Timestamp', 'User', 'Action', 'Details', 'Severity', 'Category', 'IP', 'User Agent', 'Screen Resolution', 'Referrer'];
    const rows = data.map(log => [
        log.timestamp,
        log.user,
        log.action,
        log.details,
        log.severity,
        log.category,
        log.ip,
        log.metadata?.user_agent || '',
        log.metadata?.screen_resolution || '',
        log.metadata?.referrer || ''
    ]);
    
    return [headers, ...rows].map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Utility functions for log actions
function toggleMetadata(button) {
    const details = button.nextElementSibling;
    const toggleText = button.querySelector('.toggle-text');
    const toggleIcon = button.querySelector('.toggle-icon');
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        toggleText.textContent = 'Hide Details';
        toggleIcon.textContent = '▲';
    } else {
        details.style.display = 'none';
        toggleText.textContent = 'Show Details';
        toggleIcon.textContent = '▼';
    }
}

function copyLogDetails(logJson) {
    navigator.clipboard.writeText(logJson).then(() => {
        showNotification('Log details copied to clipboard', 'success');
    }).catch(() => {
        showNotification('Failed to copy log details', 'error');
    });
}

function exportLogEntry(logId) {
    const log = logsData.find(l => l.id === logId);
    if (log) {
        const csv = convertToCSV([log]);
        downloadCSV(csv, `log_entry_${logId}_${new Date().toISOString().split('T')[0]}.csv`);
    }
}

function markAsResolved(logId) {
    // This would typically update the log entry in the database
    showNotification('Log entry marked as resolved', 'success');
    logActivity('log_resolved', `Log entry ${logId} marked as resolved`);
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
        showError('Invalid name or amount');
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
Date: ${formatDate(donation.created_at || donation.createdAt || null)}`);
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
// Subscribers Management
async function loadSubscribersData() {
    try {
        console.log('Loading subscribers data...');
        showSectionLoading('#subscribers-table-body', 'Loading subscribers...');

        // Use explicit query to avoid any client-side issues
        const { data: subscribers, error } = await supabase
            .from('newsletter_subscribers')
            .select('email, status, source, created_at, updated_at')
            .order('created_at', { ascending: false });

        console.log('Subscribers query result:', { subscribers, error, count: subscribers?.length });

        if (error) {
            console.error('Subscribers query error:', error);
            // If table doesn't exist or permission denied, show empty state instead of throwing
            if (error.code === 'PGRST116' || error.code === '42501' || 
                error.message.includes('relation') || error.message.includes('does not exist') ||
                error.message.includes('permission denied') || error.message.includes('Forbidden') ||
                error.message.includes('row-level security policy')) {
                console.log('Newsletter subscribers table not accessible due to RLS policies, showing empty state');
                window._subscribers = [];
                displaySubscribersTable([]);
                setupSubscribersPagination([]);
                hideSectionLoading('#subscribers-table-body');
                return;
            }
            throw new Error(`Failed to fetch subscribers: ${error.message}`);
        }

        window._subscribers = subscribers || [];
        console.log('Subscribers loaded:', window._subscribers);
        displaySubscribersTable(window._subscribers);
        setupSubscribersPagination(window._subscribers);

        // Update top stats in subscribers section if present
        const total = window._subscribers.length;
        const active = window._subscribers.filter(s => s.status === 'active').length;
        const unsub = window._subscribers.filter(s => s.status === 'unsubscribed').length;
        console.log('Subscriber stats:', { total, active, unsub });
        
        const totalEl = document.querySelector('#subscribers #total-subscribers');
        const activeEl = document.querySelector('#subscribers #active-subscribers');
        const unsubEl = document.querySelector('#subscribers #unsubscribed-count');
        if (totalEl) totalEl.textContent = total.toLocaleString();
        if (activeEl) activeEl.textContent = active.toLocaleString();
        if (unsubEl) unsubEl.textContent = unsub.toLocaleString();

        hideSectionLoading('#subscribers-table-body');
    } catch (error) {
        console.error('Failed to load subscribers data:', error);
        showError('Failed to load subscribers data. Please refresh the page.');
        displaySubscribersTable([]);
        setupSubscribersPagination([]);
        hideSectionLoading('#subscribers-table-body');
    }
}

// Add test subscribers for development
async function addTestSubscribers() {
    try {
        const testEmails = [
            'test1@example.com',
            'test2@example.com', 
            'test3@example.com',
            'admin@nashrfoundation.org'
        ];
        
        const subscribers = testEmails.map(email => ({
            email: email,
            name: email.split('@')[0],
            status: 'active',
            source: 'admin_test',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));
        
        const { error } = await supabase
            .from('newsletter_subscribers')
            .insert(subscribers);
            
        if (error) {
            console.error('Failed to insert test subscribers:', error);
            if (error.code === 'PGRST116' || error.code === '42501' || 
                error.message.includes('relation') || error.message.includes('does not exist') ||
                error.message.includes('permission denied') || error.message.includes('Forbidden') ||
                error.message.includes('row-level security policy')) {
                showError('Cannot add test subscribers. Row Level Security (RLS) policies are blocking access. Please run the SQL commands in Supabase to create the necessary policies, or contact your database administrator.');
                return;
            }
            throw error;
        }
        
        showSuccess(`Added ${testEmails.length} test subscribers!`);
        await loadSubscribersData();
        logActivity('test_subscribers_added', `Added ${testEmails.length} test subscribers`);
        
    } catch (error) {
        console.error('Failed to add test subscribers:', error);
        showError('Failed to add test subscribers. Please try again.');
    }
}

function displaySubscribersTable(subscribers) {
    const tableBody = document.getElementById('subscribers-table-body');
    console.log('Displaying subscribers table:', { tableBody, subscribers, count: subscribers?.length });
    if (!tableBody) {
        console.error('Subscribers table body not found!');
        return;
    }
    tableBody.innerHTML = '';

    if (!subscribers || subscribers.length === 0) {
        console.log('No subscribers to display');
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    <div>No subscribers found</div>
                    <button onclick="addTestSubscribers()" class="btn btn-outline btn-sm" style="margin-top: 10px;">
                        Add Test Subscribers
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    const startIndex = (subscribersCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = subscribers.slice(startIndex, endIndex);
    console.log('Pagination info:', { startIndex, endIndex, pageItems, totalSubscribers: subscribers.length });

    pageItems.forEach((sub, index) => {
        console.log(`Creating row ${index + 1} for subscriber:`, sub);
        const tr = document.createElement('tr');

        const emailTd = document.createElement('td');
        emailTd.textContent = sub.email;

        const statusTd = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `status-badge ${sub.status === 'active' ? 'confirmed' : 'error'}`;
        badge.textContent = sub.status || 'unknown';
        statusTd.appendChild(badge);

        const dateTd = document.createElement('td');
        dateTd.textContent = sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '-';

        const sourceTd = document.createElement('td');
        sourceTd.textContent = sub.source || '-';

        const actionsTd = document.createElement('td');
        const deactivateBtn = document.createElement('button');
        deactivateBtn.className = 'btn btn-outline btn-sm';
        deactivateBtn.textContent = sub.status === 'active' ? 'Deactivate' : 'Activate';
        deactivateBtn.onclick = () => toggleSubscriberStatus(sub);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteSubscriber(sub.email);

        actionsTd.appendChild(deactivateBtn);
        actionsTd.appendChild(deleteBtn);

        tr.appendChild(emailTd);
        tr.appendChild(statusTd);
        tr.appendChild(dateTd);
        tr.appendChild(sourceTd);
        tr.appendChild(actionsTd);

        tableBody.appendChild(tr);
    });
}

function setupSubscribersPagination(data) {
    const totalPages = Math.ceil((data?.length || 0) / itemsPerPage) || 1;
    const info = document.getElementById('subscriber-page-info');
    if (info) info.textContent = `Page ${subscribersCurrentPage} of ${totalPages}`;
    const prev = document.getElementById('prev-subscriber-page');
    const next = document.getElementById('next-subscriber-page');
    if (prev) prev.disabled = subscribersCurrentPage === 1;
    if (next) next.disabled = subscribersCurrentPage === totalPages;
}

function changeSubscriberPage(direction) {
    subscribersCurrentPage += direction;
    if (subscribersCurrentPage < 1) subscribersCurrentPage = 1;
    displaySubscribersTable(window._subscribers || []);
    setupSubscribersPagination(window._subscribers || []);
}

function searchSubscribers(e) {
    const term = (e.target.value || '').toLowerCase();
    const base = window._subscribers || [];
    const filtered = base.filter(s => (s.email || '').toLowerCase().includes(term));
    subscribersCurrentPage = 1;
    displaySubscribersTable(filtered);
    setupSubscribersPagination(filtered);
}

async function toggleSubscriberStatus(subscriber) {
    try {
        const newStatus = subscriber.status === 'active' ? 'unsubscribed' : 'active';
        const { error } = await supabase
            .from('newsletter_subscribers')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('email', subscriber.email);
        if (error) {
            console.error('Failed to update subscriber status:', error);
            if (error.code === 'PGRST116' || error.code === '42501' || 
                error.message.includes('relation') || error.message.includes('does not exist') ||
                error.message.includes('permission denied') || error.message.includes('Forbidden') ||
                error.message.includes('row-level security policy')) {
                showError('Cannot update subscriber status. Row Level Security (RLS) policies are blocking access. Please run the SQL commands in Supabase to create the necessary policies.');
                return;
            }
            throw error;
        }
        showSuccess(`Subscriber ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
        await loadSubscribersData();
        logActivity('subscriber_status_change', `${subscriber.email} -> ${newStatus}`);
    } catch (err) {
        console.error(err);
        showError('Failed to update subscriber status.');
    }
}

async function deleteSubscriber(email) {
    if (!confirm(`Delete subscriber ${email}?`)) return;
    try {
        const { error } = await supabase
            .from('newsletter_subscribers')
            .delete()
            .eq('email', email);
        if (error) {
            console.error('Failed to delete subscriber:', error);
            if (error.code === 'PGRST116' || error.code === '42501' || 
                error.message.includes('relation') || error.message.includes('does not exist') ||
                error.message.includes('permission denied') || error.message.includes('Forbidden') ||
                error.message.includes('row-level security policy')) {
                showError('Cannot delete subscriber. Row Level Security (RLS) policies are blocking access. Please run the SQL commands in Supabase to create the necessary policies.');
                return;
            }
            throw error;
        }
        showSuccess('Subscriber deleted.');
        await loadSubscribersData();
        logActivity('subscriber_deleted', email);
    } catch (err) {
        console.error(err);
        showError('Failed to delete subscriber.');
    }
}
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
function formatDate(input) {
    if (!input) return '-';
    const date = input instanceof Date ? input : new Date(input);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(input) {
    if (!input) return '-';
    const date = input instanceof Date ? input : new Date(input);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTimeAgo(input) {
    const date = input instanceof Date ? input : new Date(input);
    if (isNaN(date.getTime())) return '-';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
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

// Visitors (Umami) integration
async function updateVisitorsFromUmami() {
    try {
        // Feature flag: avoid content-blocker errors unless explicitly enabled
        if (!window.ENABLE_UMAMI_METRICS) {
            const el = document.getElementById('website-visitors');
            if (el && (!el.textContent || el.textContent === '—')) el.textContent = '0';
            return;
        }
        const websiteId = '499e6d89-95ee-459e-a467-b4e37f63281c';
        // Public aggregate endpoint via Cloud Umami embed (no token); sums unique visitors last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        const params = new URLSearchParams({
            website: websiteId,
            startAt: Math.floor(start.getTime() / 1000).toString(),
            endAt: Math.floor(end.getTime() / 1000).toString(),
            type: 'metrics',
            unit: 'day'
        });
        const metricsUrl = `https://cloud.umami.is/api/websites/${websiteId}/metrics?${params.toString()}`;
        const res = await fetch(metricsUrl, { credentials: 'omit' });
        if (!res.ok) throw new Error('Umami fetch failed');
        const data = await res.json();
        // Attempt to sum visitors from the series; structure can vary by endpoint version
        let total = 0;
        if (Array.isArray(data?.pageviews)) {
            total = data.pageviews.reduce((s, v) => s + (v?.y || 0), 0);
        } else if (Array.isArray(data?.visitors)) {
            total = data.visitors.reduce((s, v) => s + (v?.y || 0), 0);
        } else if (typeof data?.value === 'number') {
            total = data.value;
        }
        const el = document.getElementById('website-visitors');
        if (el) {
            el.textContent = total ? total.toLocaleString() : '0';
        }
    } catch (e) {
        // Keep silent to avoid breaking dashboard
        const el = document.getElementById('website-visitors');
        if (el && (!el.textContent || el.textContent === '—')) el.textContent = '0';
    }
}

function refreshDashboard() {
    loadDashboardData();
    showSuccess('Dashboard refreshed successfully!');
}

// Manual refresh function for newsletter data
function refreshNewsletterData() {
    console.log('Manually refreshing newsletter data...');
    loadNewsletterData();
    showSuccess('Newsletter data refreshed!');
}

// Helper function to configure EmailJS
function configureEmailJS(serviceId, templateId, publicKey) {
    if (window.emailJSService) {
        window.emailJSService.configure(serviceId, templateId, publicKey);
        showSuccess('EmailJS configured successfully!');
    } else {
        showError('EmailJS service not loaded. Please refresh the page.');
    }
}

// Helper function to test MailerLite service
async function testMailerLiteService() {
    try {
        if (!window.mailerLiteService) {
            showError('MailerLite service not loaded. Please refresh the page.');
            return;
        }

        if (!window.mailerLiteService.initialized) {
            showError('MailerLite service not initialized. Please check your API key configuration.');
            return;
        }

        showInfo('Testing MailerLite service...');
        
        const result = await window.mailerLiteService.testService();
        
        if (result.success) {
            showSuccess(`MailerLite test successful! ${result.message}`);
            console.log('MailerLite test result:', result);
        } else {
            showError(`MailerLite test failed: ${result.message}`);
        }
        
    } catch (error) {
        console.error('MailerLite test error:', error);
        showError(`MailerLite test failed: ${error.message}`);
    }
}


// Test welcome email function
async function testWelcomeEmail(email = 'test@example.com') {
    try {
        console.log('Testing welcome email to:', email);
        
        const endpoint = (window.RESEND_FUNCTION_URL || '').trim();
        if (!endpoint) {
            showError('No email service configured. Please configure window.RESEND_FUNCTION_URL first.');
            return;
        }
        
        // Check if it's a Supabase Edge Function and add authentication headers
        const isSupabaseFunction = endpoint.includes('supabase.co/functions/v1/');
        let headers = { 'Content-Type': 'application/json' };
        
        if (isSupabaseFunction) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
                console.log('Using Supabase session token for test welcome email');
            } else {
                console.warn('No Supabase session found for test welcome email, using API key only');
            }
            headers['apikey'] = supabaseConfig.anonKey;
        }
        
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                type: 'welcome',
                to: email,
                name: 'Test User'
            })
        });
        
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Test welcome email failed: ${res.status} ${text}`);
        }
        
        showSuccess(`Test welcome email sent successfully to ${email}!`);
        console.log('Test welcome email sent successfully');
        
    } catch (error) {
        console.error('Test welcome email failed:', error);
        showError(`Test welcome email failed: ${error.message}`);
    }
}

// Test newsletter function
async function testNewsletterFunction() {
    try {
        console.log('Testing newsletter function...');
        
        const endpoint = (window.RESEND_FUNCTION_URL || '').trim();
        if (!endpoint) {
            showError('No email service configured. Please configure window.RESEND_FUNCTION_URL first.');
            return;
        }
        
        console.log('Testing endpoint:', endpoint);
        
        // Check if it's a Supabase Edge Function and add authentication headers
        const isSupabaseFunction = endpoint.includes('supabase.co/functions/v1/');
        let headers = { 'Content-Type': 'application/json' };
        
        if (isSupabaseFunction) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
                console.log('Using Supabase session token for test newsletter');
            } else {
                console.warn('No Supabase session found for test newsletter, using API key only');
            }
            headers['apikey'] = supabaseConfig.anonKey;
        }
        
        console.log('Testing with headers:', headers);
        
        const res = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: headers,
            body: JSON.stringify({
                type: 'newsletter',
                subject: 'Test Newsletter',
                content: 'This is a test newsletter',
                to: ['test@example.com']
            })
        });
        
        console.log('Test newsletter response:', { 
            status: res.status, 
            ok: res.ok, 
            statusText: res.statusText 
        });
        
        const responseText = await res.text().catch(() => '');
        console.log('Test newsletter response body:', responseText);
        
        if (!res.ok) {
            throw new Error(`Test newsletter failed: ${res.status} ${responseText}`);
        }
        
        showSuccess('Newsletter function test successful!');
        console.log('Test newsletter sent successfully');
        
    } catch (error) {
        console.error('Test newsletter failed:', error);
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showError('Network error: Cannot reach the email service. Check if the Edge Function URL is correct and accessible.');
        } else {
            showError(`Test newsletter failed: ${error.message}`);
        }
    }
}

// Simple test to check Edge Function response
async function testEdgeFunctionResponse() {
    try {
        const endpoint = (window.RESEND_FUNCTION_URL || '').trim();
        if (!endpoint) {
            showError('No email service configured.');
            return;
        }
        
        console.log('Testing Edge Function response...');
        console.log('Endpoint URL:', endpoint);
        
        // First, test basic connectivity
        try {
            console.log('Testing basic connectivity...');
            const basicResponse = await fetch(endpoint, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit'
            });
            console.log('Basic connectivity test:', {
                status: basicResponse.status,
                ok: basicResponse.ok,
                statusText: basicResponse.statusText
            });
        } catch (basicError) {
            console.error('Basic connectivity test failed:', basicError);
            showError(`Cannot reach Edge Function: ${basicError.message}. Check if the function is deployed and accessible.`);
            return;
        }
        
        const isSupabaseFunction = endpoint.includes('supabase.co/functions/v1/');
        let headers = { 'Content-Type': 'application/json' };
        
        if (isSupabaseFunction) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
                console.log('Using session token for authentication');
            } else {
                console.warn('No session token available, using API key only');
            }
            headers['apikey'] = supabaseConfig.anonKey;
        }
        
        console.log('Request headers:', headers);
        
        const res = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: headers,
            body: JSON.stringify({
                type: 'newsletter',
                subject: 'Test',
                content: 'Test',
                to: ['test@example.com']
            })
        });
        
        const responseText = await res.text().catch(() => '');
        
        console.log('Edge Function Response:', {
            status: res.status,
            ok: res.ok,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries()),
            body: responseText
        });
        
        if (res.ok) {
            showSuccess(`Edge Function working! Status: ${res.status}`);
        } else {
            showError(`Edge Function error! Status: ${res.status}, Response: ${responseText}`);
        }
        
    } catch (error) {
        console.error('Edge Function test failed:', error);
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showError('Network error: Cannot reach the Edge Function. This could be due to:\n1. Edge Function not deployed\n2. CORS issues\n3. Network connectivity problems\n4. Incorrect URL');
        } else {
            showError(`Edge Function test failed: ${error.message}`);
        }
    }
}

// Test basic Supabase connectivity
async function testSupabaseConnectivity() {
    try {
        console.log('Testing Supabase connectivity...');
        
        // Test basic Supabase API
        const { data, error } = await supabase.from('settings').select('*').limit(1);
        
        if (error) {
            console.error('Supabase connectivity test failed:', error);
            showError(`Supabase connectivity failed: ${error.message}`);
            return;
        }
        
        console.log('Supabase connectivity test successful:', data);
        showSuccess('Supabase connectivity is working!');
        
        // Test Edge Function URL format
        const endpoint = (window.RESEND_FUNCTION_URL || '').trim();
        if (endpoint) {
            console.log('Edge Function URL:', endpoint);
            
            if (endpoint.includes('supabase.co/functions/v1/')) {
                showSuccess('Edge Function URL format looks correct');
            } else {
                showError('Edge Function URL format may be incorrect. Should contain "supabase.co/functions/v1/"');
            }
        } else {
            showError('No Edge Function URL configured');
        }
        
    } catch (error) {
        console.error('Supabase connectivity test failed:', error);
        showError(`Supabase connectivity test failed: ${error.message}`);
    }
}

// Test Edge Function with minimal payload
async function testEdgeFunctionMinimal() {
    try {
        const endpoint = (window.RESEND_FUNCTION_URL || '').trim();
        if (!endpoint) {
            showError('No email service configured.');
            return;
        }
        
        console.log('Testing Edge Function with minimal payload...');
        console.log('Endpoint URL:', endpoint);
        
        // Test with authentication headers
        const isSupabaseFunction = endpoint.includes('supabase.co/functions/v1/');
        let headers = { 'Content-Type': 'application/json' };
        
        if (isSupabaseFunction) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
                console.log('Using session token for minimal test');
                console.log('Session token (first 50 chars):', session.access_token.substring(0, 50) + '...');
            } else {
                console.warn('No session token available for minimal test');
            }
            headers['apikey'] = supabaseConfig.anonKey;
            console.log('API key (first 20 chars):', supabaseConfig.anonKey.substring(0, 20) + '...');
        }
        
        console.log('Request headers:', headers);
        console.log('Request payload:', {
            type: 'welcome',
            to: 'test@example.com',
            name: 'Test User'
        });
        
        // Add timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const res = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: headers,
            body: JSON.stringify({
                type: 'welcome',
                to: 'test@example.com',
                name: 'Test User'
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const responseText = await res.text().catch(() => '');
        
        console.log('Minimal test response:', {
            status: res.status,
            ok: res.ok,
            statusText: res.statusText,
            body: responseText
        });
        
        if (res.ok) {
            showSuccess(`Edge Function working! Status: ${res.status}, Response: ${responseText}`);
        } else {
            showError(`Edge Function error! Status: ${res.status}, Response: ${responseText}`);
        }
        
    } catch (error) {
        console.error('Minimal Edge Function test failed:', error);
        
        if (error.name === 'AbortError') {
            showError('Request timed out after 10 seconds. The Edge Function may be slow or unresponsive.');
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showError('Network error: Cannot reach the Edge Function. This could be due to:\n1. Edge Function not deployed\n2. CORS issues\n3. Network connectivity problems\n4. Incorrect URL\n5. Firewall blocking the request');
        } else {
            showError(`Minimal test failed: ${error.message}`);
        }
    }
}

// Test basic network connectivity to Supabase
async function testSupabaseNetwork() {
    try {
        console.log('Testing basic network connectivity to Supabase...');
        
        // Test basic Supabase API endpoint
        const supabaseUrl = 'https://jtuhnndwhotxjjolwcuz.supabase.co';
        const testUrl = `${supabaseUrl}/rest/v1/settings?select=*&limit=1`;
        
        console.log('Testing URL:', testUrl);
        
        const res = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'apikey': supabaseConfig.anonKey,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Supabase API test response:', {
            status: res.status,
            ok: res.ok,
            statusText: res.statusText
        });
        
        if (res.ok) {
            showSuccess('Supabase API connectivity is working!');
        } else {
            showError(`Supabase API test failed: ${res.status} ${res.statusText}`);
        }
        
    } catch (error) {
        console.error('Supabase network test failed:', error);
        showError(`Supabase network test failed: ${error.message}`);
    }
}

function exportDonations() {
    try {
        const rows = donationsData && donationsData.length ? donationsData : [];
        let csv = 'Date,Name,Amount,Payment Method\n';
        rows.forEach(d => {
            const date = formatDate(d.created_at || d.createdAt || '-');
            const name = (d.name || 'Anonymous').replace(/,/g, '');
            const amount = Number(d.amount || 0);
            const method = (d.payment_method || 'Unknown').replace(/,/g, '');
            csv += `${date},${name},${amount},${method}\n`;
        });
        downloadCSV(csv, 'donations.csv');
        showSuccess('Donations data exported successfully!');
        logActivity('data_export', 'Donations data exported');
    } catch (e) {
        console.error(e);
        showError('Failed to export donations.');
    }
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
            csv += `${rank},${name},${amount}\n`;
        }
    });
    
    downloadCSV(csv, 'leaderboard.csv');
}


function exportSubscribers() {
    try {
        const subscribers = window._subscribers && window._subscribers.length ? window._subscribers : [];
        let csv = 'Email,Status,Subscribed Date,Source\n';
        subscribers.forEach(s => {
            const email = (s.email || '').replace(/,/g, '');
            const status = (s.status || '').replace(/,/g, '');
            const date = s.created_at ? new Date(s.created_at).toLocaleDateString() : '';
            const source = (s.source || '').replace(/,/g, '');
            csv += `${email},${status},${date},${source}\n`;
        });
        downloadCSV(csv, 'newsletter_subscribers.csv');
        showSuccess('Newsletter subscribers exported successfully!');
        logActivity('subscribers_export', 'Newsletter subscribers exported');
    } catch (e) {
        console.error(e);
        showError('Failed to export subscribers.');
    }
}


// Helper function to show loading state in a section
function showSectionLoading(selector, message = 'Loading...') {
    const element = document.querySelector(selector);
    if (element) {
        element.innerHTML = `
            <tr>
                <td colspan="100%" class="loading">
                    <div class="loading-spinner"></div>
                    <span class="loading-text">${message}</span>
                </td>
            </tr>
        `;
    }
}

// Helper function to hide loading state in a section
function hideSectionLoading(selector) {
    const element = document.querySelector(selector);
    if (element) {
        // Remove any loading content
        const loadingElements = element.querySelectorAll('.loading, .loading-spinner, .loading-text');
        loadingElements.forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
        
        // Clear loading content from the element itself
        if (element.innerHTML.includes('Loading') || element.innerHTML.includes('loading')) {
            // Only clear if it's actually loading content
            if (element.innerHTML.includes('Loading newsletter statistics') || 
                element.innerHTML.includes('Loading subscribers') ||
                element.innerHTML.includes('Loading...')) {
                element.innerHTML = '';
            }
        }
    }
}

// Utility function to log activity to Supabase
// Enhanced activity logging system
async function logActivity(action, details, metadata = {}) {
    try {
        const userEmail = currentUser ? currentUser.email : 'anonymous';
        const timestamp = new Date().toISOString();
        const userAgent = navigator.userAgent;
        const referrer = document.referrer || 'direct';
        
        // Get more detailed information
        const logEntry = {
            user: userEmail,
            action: action,
            details: details,
            metadata: {
                ...metadata,
                user_agent: userAgent,
                referrer: referrer,
                screen_resolution: `${screen.width}x${screen.height}`,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                session_id: getSessionId(),
                page_url: window.location.href
            },
            ip: '0.0.0.0', // In a real implementation, get actual IP
            timestamp: timestamp,
            severity: getActionSeverity(action),
            category: getActionCategory(action)
        };
        
        await supabase
            .from('activity_logs')
            .insert([logEntry]);
            
        console.log('Activity logged:', logEntry);
        
        // Also log to browser console with more detail
        console.group(`Activity Log: ${action}`);
        console.log('User:', userEmail);
        console.log('Details:', details);
        console.log('Metadata:', logEntry.metadata);
        console.log('Timestamp:', timestamp);
        console.groupEnd();
        
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Continue without throwing - logging shouldn't break the app
    }
}

// Helper functions for enhanced logging
function getSessionId() {
    let sessionId = sessionStorage.getItem('admin_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('admin_session_id', sessionId);
    }
    return sessionId;
}

function getActionSeverity(action) {
    const severityMap = {
        'login': 'info',
        'logout': 'info',
        'settings_update': 'warning',
        'content_update': 'warning',
        'donation_received': 'success',
        'donation_updated': 'info',
        'donation_deleted': 'error',
        'user_created': 'success',
        'user_updated': 'info',
        'user_deleted': 'error',
        'system_error': 'error',
        'security_alert': 'error',
        'backup_created': 'info',
        'backup_restored': 'warning',
        'export_data': 'info',
        'import_data': 'warning'
    };
    return severityMap[action] || 'info';
}

function getActionCategory(action) {
    const categoryMap = {
        'login': 'authentication',
        'logout': 'authentication',
        'settings_update': 'configuration',
        'content_update': 'content',
        'donation_received': 'donations',
        'donation_updated': 'donations',
        'donation_deleted': 'donations',
        'user_created': 'user_management',
        'user_updated': 'user_management',
        'user_deleted': 'user_management',
        'system_error': 'system',
        'security_alert': 'security',
        'backup_created': 'backup',
        'backup_restored': 'backup',
        'export_data': 'data_management',
        'import_data': 'data_management'
    };
    return categoryMap[action] || 'general';
}

// Enhanced logging functions for specific actions
function logUserAction(action, details, element = null) {
    const metadata = {
        element_id: element ? element.id : null,
        element_class: element ? element.className : null,
        element_tag: element ? element.tagName : null
    };
    logActivity(action, details, metadata);
}

function logSystemEvent(event, details, severity = 'info') {
    logActivity(event, details, { 
        system_event: true, 
        severity: severity,
        component: 'admin_portal'
    });
}

function logSecurityEvent(event, details, risk_level = 'medium') {
    logActivity(event, details, { 
        security_event: true, 
        risk_level: risk_level,
        component: 'security'
    });
}

// UI Helpers
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showInfo(message) {
    showNotification(message, 'info');
}

// Loading functions
function showLoading(message = 'Loading...') {
    // Remove existing loading
    const existing = document.querySelector('.loading-overlay');
    if (existing) existing.remove();
    
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        </div>
    `;
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.querySelector('.loading-overlay');
    if (loading) loading.remove();
}

// Remove duplicate showNotification function

// Section Navigation Function
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show the selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Trigger data load for the activated section (prevents stuck loading states)
    try {
        switch (sectionName) {
            case 'dashboard':
                if (typeof loadOverviewData === 'function') loadOverviewData();
                break;
            case 'donations':
                if (typeof loadDonationsData === 'function') loadDonationsData();
                break;
            case 'leaderboard':
                if (typeof loadLeaderboardData === 'function') loadLeaderboardData();
                else if (typeof loadOverviewData === 'function') loadOverviewData();
                break;
            case 'newsletter':
                if (typeof loadNewsletterData === 'function') loadNewsletterData();
                break;
            case 'subscribers':
                if (typeof loadSubscribersData === 'function') loadSubscribersData();
                break;
            case 'content':
                if (typeof loadContentData === 'function') loadContentData();
                break;
            case 'settings':
                if (typeof loadSettingsData === 'function') loadSettingsData();
                break;
            case 'emails':
                if (typeof initializeEmailManagement === 'function') initializeEmailManagement();
                break;
            case 'media':
                if (typeof initializeMediaManagement === 'function') initializeMediaManagement();
                break;
            case 'security':
                if (typeof loadSecurityData === 'function') loadSecurityData();
                break;
            case 'logs':
                if (typeof loadLogsData === 'function') loadLogsData();
                break;
            default:
                break;
        }
    } catch (e) {
        console.warn('Section load trigger failed:', e);
    }
}

// Setup navigation event listeners
function setupNavigationListeners() {
    // Vertical navigation event listeners
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links (both vertical and horizontal)
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.horizontal-nav-link').forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get section name
            const section = this.getAttribute('data-section');
            
            // Update horizontal navigation as well
            const horizontalLink = document.querySelector(`.horizontal-nav-link[data-section="${section}"]`);
            if (horizontalLink) {
                horizontalLink.classList.add('active');
                scrollToActiveLink(horizontalLink);
            }
            
            // Show the section
            showSection(section);

            // Reflect in URL for deep-linking
            try { window.location.hash = section; } catch (e) {}
        });
    });
}

// Horizontal Navigation Functions
function scrollNav(direction) {
    const scrollContainer = document.querySelector('.horizontal-nav-scroll');
    if (!scrollContainer) return;
    
    const scrollAmount = 200;
    const currentScroll = scrollContainer.scrollLeft;
    
    if (direction === 'left') {
        scrollContainer.scrollTo({
            left: currentScroll - scrollAmount,
            behavior: 'smooth'
        });
    } else if (direction === 'right') {
        scrollContainer.scrollTo({
            left: currentScroll + scrollAmount,
            behavior: 'smooth'
        });
    }
    
    // Update scroll button states
    updateScrollButtons();
}

function updateScrollButtons() {
    const scrollContainer = document.querySelector('.horizontal-nav-scroll');
    const leftBtn = document.querySelector('.nav-scroll-left');
    const rightBtn = document.querySelector('.nav-scroll-right');
    
    if (!scrollContainer || !leftBtn || !rightBtn) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
    
    // Update left button
    if (scrollLeft <= 0) {
        leftBtn.disabled = true;
        leftBtn.style.opacity = '0.5';
    } else {
        leftBtn.disabled = false;
        leftBtn.style.opacity = '1';
    }
    
    // Update right button
    if (scrollLeft >= scrollWidth - clientWidth - 1) {
        rightBtn.disabled = true;
        rightBtn.style.opacity = '0.5';
    } else {
        rightBtn.disabled = false;
        rightBtn.style.opacity = '1';
    }
}

// Setup horizontal navigation event listeners
function setupHorizontalNavigation() {
    const scrollContainer = document.querySelector('.horizontal-nav-scroll');
    const horizontalLinks = document.querySelectorAll('.horizontal-nav-link');
    
    if (scrollContainer) {
        // Update scroll buttons on scroll
        scrollContainer.addEventListener('scroll', updateScrollButtons);
        
        // Initial button state
        updateScrollButtons();
    }
    
    // Handle horizontal navigation clicks
    horizontalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            horizontalLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get section name
            const section = this.getAttribute('data-section');
            
            // Update vertical navigation as well
            const verticalLink = document.querySelector(`.nav-link[data-section="${section}"]`);
            if (verticalLink) {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                verticalLink.classList.add('active');
            }
            
            // Show the section
            showSection(section);
            
            // Scroll to active link
            scrollToActiveLink(this);

            // Reflect in URL for deep-linking
            try { window.location.hash = section; } catch (e) {}
        });
    });
}

function scrollToActiveLink(activeLink) {
    const scrollContainer = document.querySelector('.horizontal-nav-scroll');
    if (!scrollContainer || !activeLink) return;
    
    const containerRect = scrollContainer.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    
    // Check if link is visible
    const isVisible = linkRect.left >= containerRect.left && 
                     linkRect.right <= containerRect.right;
    
    if (!isVisible) {
        // Scroll to center the active link
        const scrollLeft = activeLink.offsetLeft - 
                          (scrollContainer.clientWidth / 2) + 
                          (activeLink.clientWidth / 2);
        
        scrollContainer.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
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

// Cleanup function to prevent memory leaks
function cleanup() {
    try {
        // Unsubscribe from all real-time subscriptions
        if (leaderboardSubscription) {
            leaderboardSubscription.unsubscribe();
            leaderboardSubscription = null;
        }
        if (subscribersSubscription) {
            subscribersSubscription.unsubscribe();
            subscribersSubscription = null;
        }
        if (contentSubscription) {
            contentSubscription.unsubscribe();
            contentSubscription = null;
        }
        if (settingsSubscription) {
            settingsSubscription.unsubscribe();
            settingsSubscription = null;
        }
        if (realtimeData.donationsChannel) {
            realtimeData.donationsChannel.unsubscribe();
            realtimeData.donationsChannel = null;
        }
        
        // Destroy charts
        if (charts.donations) {
            charts.donations.destroy();
            charts.donations = null;
        }
        if (charts.paymentMethods) {
            charts.paymentMethods.destroy();
            charts.paymentMethods = null;
        }
        
        console.log('Cleanup completed');
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// ==================== EMAIL MANAGEMENT SYSTEM ====================

// Email templates and settings
let emailTemplates = [];
let emailQueue = [];
let emailAnalytics = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0
};

// Initialize email management
async function initializeEmailManagement() {
    try {
        await loadEmailTemplates();
        await loadEmailQueue();
        await loadEmailAnalytics();
        setupEmailRealtimeUpdates();
    } catch (error) {
        console.error('Failed to initialize email management:', error);
    }
}

// Load email templates from Supabase
async function loadEmailTemplates() {
    try {
        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        emailTemplates = data || [];
        displayEmailTemplates();
    } catch (error) {
        console.error('Error loading email templates:', error);
        // Create default templates if none exist
        createDefaultTemplates();
    }
}

// Create default email templates
async function createDefaultTemplates() {
    const defaultTemplates = [
        {
            name: 'Donor Thank You',
            subject: 'Thank you for your generous donation to Nashr Foundation',
            template: `Dear {{donor_name}},

Thank you for your generous donation of PKR {{amount}} to Nashr Foundation. Your contribution makes a real difference in our mission to help those in need.

Your donation was received on {{date}} and will be used to support our ongoing programs and initiatives.

We are grateful for your support and commitment to making a positive impact in our community.

With heartfelt thanks,
The Nashr Foundation Team

---
This is an automated message. Please do not reply to this email.`,
            type: 'donor_thank_you',
            is_active: true
        },
        {
            name: 'Newsletter Welcome',
            subject: 'Welcome to Nashr Foundation Newsletter',
            template: `Dear {{subscriber_name}},

Welcome to the Nashr Foundation newsletter! We're excited to have you join our community of supporters.

You'll receive regular updates about our programs, success stories, and how your support is making a difference in people's lives.

Thank you for your interest in our mission.

Best regards,
The Nashr Foundation Team`,
            type: 'newsletter_welcome',
            is_active: true
        }
    ];
    
    try {
        const { error } = await supabase
            .from('email_templates')
            .insert(defaultTemplates);
            
        if (!error) {
            await loadEmailTemplates();
        }
    } catch (error) {
        console.error('Error creating default templates:', error);
    }
}

// Display email templates
function displayEmailTemplates() {
    const container = document.getElementById('email-templates-list');
    if (!container) return;
    
    if (emailTemplates.length === 0) {
        container.innerHTML = '<p class="text-muted">No email templates found. <button class="btn btn-sm btn-outline" onclick="addEmailTemplate()">Create your first template</button></p>';
        return;
    }
    
    container.innerHTML = emailTemplates.map(template => `
        <div class="template-item">
            <div>
                <div class="template-name">${template.name}</div>
                <small class="text-muted">${template.type} • ${template.is_active ? 'Active' : 'Inactive'}</small>
            </div>
            <div class="template-actions">
                <button class="btn btn-sm btn-outline" onclick="editEmailTemplate('${template.id}')">Edit</button>
                <button class="btn btn-sm btn-outline" onclick="previewEmailTemplate('${template.id}')">Preview</button>
                <button class="btn btn-sm btn-danger" onclick="deleteEmailTemplate('${template.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Add new email template
async function addEmailTemplate() {
    const name = prompt('Enter template name:');
    if (!name) return;
    
    const newTemplate = {
        name: name,
        subject: '',
        template: '',
        type: 'custom',
        is_active: true
    };
    
    try {
        const { data, error } = await supabase
            .from('email_templates')
            .insert([newTemplate])
            .select()
            .single();
            
        if (error) throw error;
        
        await loadEmailTemplates();
        showSuccess('Email template created successfully!');
        logActivity('email_template_created', `Created template: ${name}`);
    } catch (error) {
        console.error('Error creating template:', error);
        showError('Failed to create email template');
    }
}

// Save thank you email template
async function saveThankYouTemplate() {
    const subject = document.getElementById('thank-you-subject')?.value;
    const template = document.getElementById('thank-you-template')?.value;
    const delay = document.getElementById('thank-you-delay')?.value;
    
    if (!subject || !template) {
        showError('Please fill in all required fields');
        return;
    }
    
    try {
        // Check if a donor thank you template already exists
        const { data: existingTemplates, error: selectError } = await supabase
            .from('email_templates')
            .select('id')
            .eq('type', 'donor_thank_you')
            .limit(1);

        if (selectError) throw selectError;

        const payload = {
            name: 'Donor Thank You',
            subject: subject,
            template: template,
            type: 'donor_thank_you',
            is_active: true,
            settings: { delay_minutes: parseInt(delay) || 5 }
        };

        if (Array.isArray(existingTemplates) && existingTemplates.length > 0) {
            const existingId = existingTemplates[0].id;
            const { error: updateError } = await supabase
                .from('email_templates')
                .update(payload)
                .eq('id', existingId);
            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await supabase
                .from('email_templates')
                .insert([payload]);
            if (insertError) throw insertError;
        }

        showSuccess('Thank you email template saved successfully!');
        logActivity('email_template_updated', 'Updated donor thank you template');
    } catch (error) {
        console.error('Error saving template:', error?.message || error);
        try {
            console.debug('Save template error details:', JSON.stringify(error));
        } catch (_) {
            console.debug('Save template error (non-serializable):', error);
        }
        showError('Failed to save email template');
    }
}

// Preview thank you email
function previewThankYouEmail() {
    const subject = document.getElementById('thank-you-subject')?.value;
    const template = document.getElementById('thank-you-template')?.value;
    
    if (!subject || !template) {
        showError('Please fill in the template first');
        return;
    }
    
    // Replace placeholders with sample data
    const previewContent = template
        .replace(/\{\{donor_name\}\}/g, 'John Doe')
        .replace(/\{\{amount\}\}/g, '5,000')
        .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
    
    showEmailPreview(subject, previewContent);
}

// Show email preview modal
function showEmailPreview(subject, content) {
    const modal = document.createElement('div');
    modal.className = 'email-preview-modal';
    modal.innerHTML = `
        <div class="email-preview-content">
            <div class="email-preview-header">
                <h3>Email Preview</h3>
                <button class="btn btn-sm btn-outline" onclick="this.closest('.email-preview-modal').remove()">Close</button>
            </div>
            <div class="email-preview-body">
                <h4>Subject: ${subject}</h4>
                <div style="white-space: pre-line; margin-top: 1rem;">${content}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Toggle auto thank you emails
async function toggleAutoThankYou() {
    const checkbox = document.getElementById('auto-thank-you');
    const isEnabled = checkbox.checked;
    
    try {
        const { error } = await supabase
            .from('settings')
            .upsert({
                key: 'auto_thank_you_emails',
                value: isEnabled.toString()
            });
            
        if (error) throw error;
        
        showSuccess(`Auto thank you emails ${isEnabled ? 'enabled' : 'disabled'}`);
        logActivity('email_settings_updated', `Auto thank you emails ${isEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
        console.error('Error updating email settings:', error);
        showError('Failed to update email settings');
    }
}

// Load email queue
async function loadEmailQueue() {
    try {
        const { data, error } = await supabase
            .from('email_queue')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
            
        if (error) throw error;
        
        emailQueue = data || [];
        updateEmailQueueDisplay();
    } catch (error) {
        console.error('Error loading email queue:', error);
    }
}

// Update email queue display
function updateEmailQueueDisplay() {
    const pendingCount = emailQueue.filter(email => email.status === 'pending').length;
    const failedCount = emailQueue.filter(email => email.status === 'failed').length;
    const sentToday = emailQueue.filter(email => {
        const today = new Date().toDateString();
        const emailDate = new Date(email.sent_at || email.created_at).toDateString();
        return email.status === 'sent' && emailDate === today;
    }).length;
    
    document.getElementById('pending-emails').textContent = pendingCount;
    document.getElementById('failed-emails').textContent = failedCount;
    document.getElementById('sent-today').textContent = sentToday;
    
    // Update queue list
    const queueList = document.getElementById('email-queue-list');
    if (queueList) {
        if (emailQueue.length === 0) {
            queueList.innerHTML = '<p class="text-muted">No emails in queue</p>';
        } else {
            queueList.innerHTML = emailQueue.slice(0, 10).map(email => `
                <div class="queue-list-item">
                    <div>
                        <div>${email.recipient_email}</div>
                        <small class="text-muted">${email.subject}</small>
                    </div>
                    <span class="queue-status ${email.status}">${email.status}</span>
                </div>
            `).join('');
        }
    }
}

// Process email queue
async function processEmailQueue() {
    try {
        showLoading('Processing email queue...');
        
        const { data, error } = await supabase
            .from('email_queue')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(10);
            
        if (error) throw error;
        
        let processed = 0;
        for (const email of data || []) {
            try {
                await sendEmail(email);
                processed++;
            } catch (error) {
                console.error('Failed to send email:', error);
            }
        }
        
        hideLoading();
        showSuccess(`Processed ${processed} emails from queue`);
        await loadEmailQueue();
        logActivity('email_queue_processed', `Processed ${processed} emails`);
    } catch (error) {
        hideLoading();
        console.error('Error processing email queue:', error);
        showError('Failed to process email queue');
    }
}

// Send individual email
async function sendEmail(emailData) {
    try {
        // Use your email service (EmailJS, Resend, etc.)
        const response = await fetch(window.RESEND_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: emailData.recipient_email,
                subject: emailData.subject,
                html: emailData.content,
                type: 'donor_thank_you'
            })
        });
        
        if (!response.ok) {
            throw new Error('Email service error');
        }
        
        // Update email status
        await supabase
            .from('email_queue')
            .update({ 
                status: 'sent', 
                sent_at: new Date().toISOString() 
            })
            .eq('id', emailData.id);
            
    } catch (error) {
        // Update email status to failed
        await supabase
            .from('email_queue')
            .update({ 
                status: 'failed', 
                error_message: error.message 
            })
            .eq('id', emailData.id);
            
        throw error;
    }
}

// Send test email
async function sendTestEmail() {
    const testEmail = prompt('Enter test email address:');
    if (!testEmail) return;
    
    try {
        showLoading('Sending test email...');
        
        const testData = {
            recipient_email: testEmail,
            subject: 'Test Email from Nashr Foundation Admin',
            content: 'This is a test email to verify the email system is working correctly.',
            status: 'pending'
        };
        
        const { error } = await supabase
            .from('email_queue')
            .insert([testData]);
            
        if (error) throw error;
        
        hideLoading();
        showSuccess('Test email added to queue');
        await loadEmailQueue();
        logActivity('test_email_sent', `Test email sent to ${testEmail}`);
    } catch (error) {
        hideLoading();
        console.error('Error sending test email:', error);
        showError('Failed to send test email');
    }
}

// Load email analytics
async function loadEmailAnalytics() {
    try {
        const { data, error } = await supabase
            .from('email_analytics')
            .select('*')
            .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
            
        if (error) throw error;
        
        // Calculate totals
        emailAnalytics = {
            sent: data?.reduce((sum, item) => sum + (item.sent || 0), 0) || 0,
            delivered: data?.reduce((sum, item) => sum + (item.delivered || 0), 0) || 0,
            opened: data?.reduce((sum, item) => sum + (item.opened || 0), 0) || 0,
            clicked: data?.reduce((sum, item) => sum + (item.clicked || 0), 0) || 0
        };
        
        updateEmailAnalyticsDisplay();
    } catch (error) {
        console.error('Error loading email analytics:', error);
    }
}

// Update email analytics display
function updateEmailAnalyticsDisplay() {
    document.getElementById('emails-sent').textContent = emailAnalytics.sent;
    document.getElementById('emails-delivered').textContent = emailAnalytics.delivered;
    document.getElementById('emails-opened').textContent = emailAnalytics.opened;
    document.getElementById('emails-clicked').textContent = emailAnalytics.clicked;
}

// Update email analytics when period changes
function updateEmailAnalytics() {
    loadEmailAnalytics();
}

// Refresh email templates
function refreshEmailTemplates() {
    loadEmailTemplates();
}

// Setup real-time updates for email system
function setupEmailRealtimeUpdates() {
    // Subscribe to email queue changes
    supabase
        .channel('email_queue_changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'email_queue' },
            () => {
                loadEmailQueue();
            }
        )
        .subscribe();
        
    // Subscribe to email templates changes
    supabase
        .channel('email_templates_changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'email_templates' },
            () => {
                loadEmailTemplates();
            }
        )
        .subscribe();
}

// Auto-send thank you email after donation
async function sendDonorThankYouEmail(donorData) {
    try {
        // Check if auto thank you emails are enabled
        const { data: settings } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'auto_thank_you_emails')
            .single();
            
        if (!settings?.value || settings.value !== 'true') {
            return; // Auto emails disabled
        }
        
        // Get thank you template
        const { data: template } = await supabase
            .from('email_templates')
            .select('*')
            .eq('type', 'donor_thank_you')
            .eq('is_active', true)
            .single();
            
        if (!template) {
            console.warn('No thank you email template found');
            return;
        }
        
        // Replace placeholders
        const subject = template.subject;
        const content = template.template
            .replace(/\{\{donor_name\}\}/g, donorData.name || 'Valued Supporter')
            .replace(/\{\{amount\}\}/g, donorData.amount?.toLocaleString() || '0')
            .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
            
        // Get send delay
        const delay = template.settings?.delay_minutes || 5;
        const sendAt = new Date(Date.now() + delay * 60 * 1000);
        
        // Add to email queue
        const { error } = await supabase
            .from('email_queue')
            .insert([{
                recipient_email: donorData.email,
                subject: subject,
                content: content,
                status: 'pending',
                send_at: sendAt.toISOString(),
                metadata: {
                    donor_id: donorData.id,
                    donation_amount: donorData.amount,
                    template_id: template.id
                }
            }]);
            
        if (error) throw error;
        
        console.log('Thank you email queued for:', donorData.email);
        logActivity('donor_thank_you_queued', `Thank you email queued for ${donorData.email}`);
        
    } catch (error) {
        console.error('Error queuing thank you email:', error);
    }
}

// Initialize email management when admin loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modules if user already authenticated
    if (currentUser) {
        initializeEmailManagement();
        initializeMediaManagement();
        initializeSecurityManagement();
    }
    // Always initialize horizontal navigation so links are clickable regardless of auth timing
    setupHorizontalNavigation();

    // Open section from URL hash on load
    const openSectionFromHash = () => {
        const hash = (window.location.hash || '').replace('#', '');
        if (!hash) return;
        const link = document.querySelector(`.horizontal-nav-link[data-section="${hash}"]`);
        if (link) {
            link.click();
        } else {
            // Fallback: show section directly
            showSection(hash);
        }
    };
    openSectionFromHash();
    window.addEventListener('hashchange', openSectionFromHash);
});

// ==================== MEDIA MANAGEMENT SYSTEM ====================

// Media management variables are defined in media-management.js

// Initialize media management
async function initializeMediaManagement() {
    try {
        // Call the media management initialization from the separate file
        if (typeof window.initializeMediaManagement === 'function') {
            window.initializeMediaManagement();
        }
    } catch (error) {
        console.error('Failed to initialize media management:', error);
    }
}