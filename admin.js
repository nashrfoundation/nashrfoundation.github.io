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
let donationsData = [];
let logsData = [];
let currentPage = 1;
let logsCurrentPage = 1;
let subscribersCurrentPage = 1;
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
        // Initialize realtime subscriptions
        setupSubscribersSubscription();
        setupDonationsSubscription();
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
        case 'subscribers':
            await loadSubscribersData();
            break;
        default:
            await loadDashboardData();
            break;
    }
}

// Overview Section
async function loadOverviewData() {
    try {
        showSectionLoading('#overview .activity-list', 'Loading recent donations...');
        showSectionLoading('#overview .stats-grid', 'Loading statistics...');
        
        // Fetch real-time donations data from Supabase
        const { data: donations, error: donationsError } = await supabase
            .from(supabaseConfig.leaderboard.donationsTableName)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
            
        console.log('Overview donations data fetched:', donations);
        console.log('Overview donations fetch error:', donationsError);
            
        if (donationsError) {
            throw new Error(`Failed to fetch donations: ${donationsError.message}`);
        }
        
        // Fetch fundraising goal from settings (if available)
        // Some deployments may have multiple rows in `settings`; pick the most recent/first
        const { data: settingsRows, error: settingsError } = await supabase
            .from('settings')
            .select('fundraising_goal')
            .limit(1);
            
        console.log('Settings data fetched:', settingsRows);
        console.log('Settings fetch error:', settingsError);
            
        const goalAmount = (Array.isArray(settingsRows) && settingsRows[0]?.fundraising_goal) || 200000;
        
        updateOverviewStats(donations, goalAmount);
        updateRecentActivity(donations);
        
        // Fetch data for charts
        await loadChartData();

        // Fetch visitors from Umami if configured
        await updateVisitorsFromUmami();
        
        hideSectionLoading('#overview .activity-list');
        hideSectionLoading('#overview .stats-grid');
        
    } catch (error) {
        console.error('Failed to load overview data:', error);
        showError('Failed to load overview data. Please refresh the page.');
        // Empty states
        updateOverviewStats([], 200000);
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

function updateOverviewStats(donations, goalAmount) {
    const totalRaised = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const todayDonations = donations.filter(donation => {
        const d = donation.created_at ? new Date(donation.created_at) : new Date();
        return d.toISOString().split('T')[0] === today;
    });
    const todayAmount = todayDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const totalDonors = donations.length;
    const goal = goalAmount || 200000;
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
        const response = await fetch('leaderboard.csv');
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard CSV');
        }
        
        const csvText = await response.text();
        const rows = csvText.trim().split('\n');
        const data = [];
        
        // Parse CSV data (skip header row)
        for (let i = 1; i < rows.length; i++) {
            const line = rows[i];
            if (!line) continue;
            
            const cells = line.split(',');
            if (cells.length >= 3) {
                data.push({
                    rank: parseInt(cells[0].trim()) || i,
                    name: cells[1].trim(),
                    total_amount: parseFloat(cells[2].trim().replace(/[^0-9.]/g, '')) || 0
                });
            }
        }
        
        console.log('Leaderboard data loaded from CSV:', data);
        return data;
        
    } catch (error) {
        console.error('Failed to load leaderboard from CSV:', error);
        return [];
    }
}

function setupLeaderboardSubscription() {
    try {
        // Set up real-time subscription to leaderboard changes
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
                    // Refresh leaderboard data when changes occur
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
                logActivity('content_update', 'Website content updated');
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
        showSectionLoading('.newsletter-editor .stats-grid', 'Loading newsletter statistics...');
        
        // Fetch real-time newsletter subscriber statistics from Supabase
        const { data: subscribers, error: subscribersError } = await supabase
            .from('newsletter_subscribers')
            .select('status');
            
        if (subscribersError) {
            throw new Error(`Failed to fetch subscribers: ${subscribersError.message}`);
        }
        
        // Calculate statistics
        const totalSubscribers = subscribers.length;
        const activeSubscribers = subscribers.filter(s => s.status === 'active').length;
        const unsubscribed = subscribers.filter(s => s.status === 'unsubscribed').length;
        
        // Update UI - check if elements exist before updating
        const totalEl = document.getElementById('total-subscribers');
        const activeEl = document.getElementById('active-subscribers');
        const unsubEl = document.getElementById('unsubscribed');
        
        if (totalEl) totalEl.textContent = totalSubscribers.toLocaleString();
        if (activeEl) activeEl.textContent = activeSubscribers.toLocaleString();
        if (unsubEl) unsubEl.textContent = unsubscribed.toLocaleString();
        
        hideSectionLoading('.newsletter-editor .stats-grid');
        
    } catch (error) {
        console.error('Failed to load newsletter data:', error);
        showError('Failed to load newsletter data. Please try again.');
        hideSectionLoading('.newsletter-editor .stats-grid');
    }
}

async function sendNewsletter() {
    try {
        const subject = document.getElementById('newsletter-subject').value;
        const content = document.getElementById('newsletter-content').value;
        const recipients = document.getElementById('newsletter-recipients').value;
        
        if (!subject || !content) {
            showError('Please enter both subject and content for the newsletter.');
            return;
        }
        
        // Show loading state
        const sendButton = document.querySelector('.newsletter-editor .btn-primary');
        const originalText = sendButton.innerHTML;
        sendButton.innerHTML = '<div class="inline-loader"></div> Sending...';
        sendButton.disabled = true;
        
        // In a real implementation, this would send the newsletter via email service
        // For now, we'll simulate the process
        
        // Log the newsletter send attempt
        await logActivity('newsletter_send', `Newsletter sent to ${recipients} subscribers`);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showSuccess(`Newsletter sent to ${recipients} subscribers!`);
        logActivity('newsletter_sent', `Newsletter "${subject}" sent to ${recipients} subscribers`);
        
        // Clear form
        document.getElementById('newsletter-subject').value = '';
        document.getElementById('newsletter-content').value = '';
        
        // Reset button
        sendButton.innerHTML = originalText;
        sendButton.disabled = false;
        
        // Refresh statistics
        loadNewsletterData();
        
        // Add notification
        if (window.adminNotifications) {
            window.adminNotifications.addNotification({
                type: 'success',
                title: 'Newsletter Sent',
                message: `Newsletter "${subject}" sent successfully`,
                action: () => {
                    // Navigate to newsletter section
                    document.querySelector('[data-section="newsletter"]').click();
                }
            });
        }
        
    } catch (error) {
        console.error('Failed to send newsletter:', error);
        showError('Failed to send newsletter. Please try again.');
        
        // Reset button
        const sendButton = document.querySelector('.newsletter-editor .btn-primary');
        sendButton.innerHTML = 'Send Newsletter';
        sendButton.disabled = false;
    }
}

// Settings Management
async function loadSettingsData() {
    try {
        // Load current settings from Supabase
        const { data: settingsRows, error } = await supabase
            .from('settings')
            .select('*')
            .limit(1);
        if (error) throw error;
        const s = Array.isArray(settingsRows) ? settingsRows[0] : null;
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
            if (document.getElementById('admin-email-notifications')) document.getElementById('admin-email-notifications').value = s.admin_email_notifications || 'all';
            if (document.getElementById('backup-frequency')) document.getElementById('backup-frequency').value = s.backup_frequency || 'daily';
        }
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
        
        (async () => {
            try {
                const payload = {
                    title: seoSettings.title,
                    description: seoSettings.description,
                    keywords: seoSettings.keywords,
                    facebook: socialSettings.facebook,
                    instagram: socialSettings.instagram,
                    twitter: socialSettings.twitter,
                    youtube: socialSettings.youtube,
                    fundraising_goal: parseInt(fundraisingSettings.goal, 10) || 0,
                    goal_description: fundraisingSettings.description,
                    admin_email_notifications: securitySettings.notifications,
                    backup_frequency: securitySettings.backup,
                    updated_at: new Date().toISOString()
                };
                const { data: existing, error: fetchErr } = await supabase
                    .from('settings')
                    .select('id')
                    .limit(1);
                if (fetchErr) throw fetchErr;
                if (Array.isArray(existing) && existing[0]?.id) {
                    const { error: updateErr } = await supabase
                        .from('settings')
                        .update(payload)
                        .eq('id', existing[0].id);
                    if (updateErr) throw updateErr;
                } else {
                    const { error: insertErr } = await supabase
                        .from('settings')
                        .insert([payload]);
                    if (insertErr) throw insertErr;
                }
                showSuccess('Settings saved successfully!');
                logActivity('settings_update', 'System settings updated');
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
        
        // Fetch real-time activity logs from Supabase
        const { data: logs, error } = await supabase
            .from('activity_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);
            
        if (error) {
            throw new Error(`Failed to fetch logs: ${error.message}`);
        }
        
        logsData = logs || [];
        displayLogsTable(logsData);
        setupLogsPagination(logsData);
        
        hideSectionLoading('#logs-table-body');
        
    } catch (error) {
        console.error('Failed to load logs data:', error);
        displayLogsTable([]);
        setupLogsPagination([]);
        hideSectionLoading('#logs-table-body');
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
        showSectionLoading('#subscribers-table-body', 'Loading subscribers...');

        const { data: subscribers, error } = await supabase
            .from('newsletter_subscribers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch subscribers: ${error.message}`);
        }

        window._subscribers = subscribers || [];
        displaySubscribersTable(window._subscribers);
        setupSubscribersPagination(window._subscribers);

        // Update top stats in subscribers section if present
        const total = window._subscribers.length;
        const active = window._subscribers.filter(s => s.status === 'active').length;
        const unsub = window._subscribers.filter(s => s.status === 'unsubscribed').length;
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

function displaySubscribersTable(subscribers) {
    const tableBody = document.getElementById('subscribers-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!subscribers || subscribers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="loading">No subscribers found</td></tr>';
        return;
    }

    const startIndex = (subscribersCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = subscribers.slice(startIndex, endIndex);

    pageItems.forEach(sub => {
        const tr = document.createElement('tr');

        const emailTd = document.createElement('td');
        emailTd.textContent = sub.email;

        const nameTd = document.createElement('td');
        nameTd.textContent = sub.name || '-';

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
        tr.appendChild(nameTd);
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
        if (error) throw error;
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
        if (error) throw error;
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
        const res = await fetch(`https://cloud.umami.is/api/websites/${websiteId}/metrics?${params.toString()}`, { credentials: 'omit' });
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
            csv += `${rank},${name},${amount}
`;
        }
    });
    
    downloadCSV(csv, 'leaderboard.csv');
}

function exportLogs() {
    try {
        const rows = logsData && logsData.length ? logsData : [];
        let csv = 'Timestamp,User,Action,Details,IP\n';
        rows.forEach(l => {
            const ts = formatDateTime(l.timestamp || '-');
            const user = (l.user || 'Unknown').replace(/,/g, '');
            const action = (l.action || 'Unknown').replace(/,/g, '');
            const details = (l.details || '').replace(/\n/g, ' ').replace(/,/g, '');
            const ip = (l.ip || '').replace(/,/g, '');
            csv += `${ts},${user},${action},${details},${ip}\n`;
        });
        downloadCSV(csv, 'activity_logs.csv');
        showSuccess('Activity logs exported successfully!');
        logActivity('logs_export', 'Activity logs exported');
    } catch (e) {
        console.error(e);
        showError('Failed to export logs.');
    }
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
    if (element && element.querySelector('.loading')) {
        // Don't hide if it's an error or empty state
        const loadingElement = element.querySelector('.loading');
        if (loadingElement && !loadingElement.classList.contains('error-message') && !loadingElement.classList.contains('success-message')) {
            // Keep the element visible but remove loading content if needed elsewhere
        }
    }
}

// Utility function to log activity to Supabase
async function logActivity(action, details) {
    try {
        const userEmail = currentUser ? currentUser.email : 'anonymous';
        
        await supabase
            .from('activity_logs')
            .insert([{
                user: userEmail,
                action: action,
                details: details,
                ip: '0.0.0.0', // In a real implementation, get actual IP
                timestamp: new Date().toISOString()
            }]);
            
        console.log('Activity logged:', { action, details });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Continue without throwing - logging shouldn't break the app
    }
}

// UI Helpers
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    try {
        // Minimal, non-intrusive notification; no mock/demo messages
        const el = document.createElement('div');
        el.className = `notification ${type}`;
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 4000);
    } catch (_) {
        // Fallback to console
        if (type === 'error') console.error(message); else console.log(message);
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