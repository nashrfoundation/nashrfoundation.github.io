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
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                showLogin();
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
    
    // Forms (settings and donations removed)
    
    // Removed donations and analytics listeners
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
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign in';
        }
    }
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        showSuccess('Logged out successfully!');
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
    }, 3000);
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
        await Promise.all([
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
        case 'leaderboard':
        default:
            await loadLeaderboardData();
            break;
    }
}

// Overview Section
async function loadOverviewData() {
    try {
        const donationsSnapshot = await (await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')).getDocs(
            (await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')).collection(db, 'donations')
        );
        const donations = donationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateOverviewStats(donations);
        updateRecentActivity(donations);
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
        const donationDate = (donation.createdAt && typeof donation.createdAt.toDate === 'function') ? donation.createdAt.toDate() : new Date();
        return donationDate.toDateString() === today.toDateString();
    });
    const todayAmount = todayDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const totalDonors = donations.length;
    const goalAmount = 200000; // This should come from settings
    const goalProgress = Math.round((totalRaised / goalAmount) * 100);
    
    // Update stats
    document.getElementById('total-raised').textContent = `₨${totalRaised.toLocaleString()}`;
    document.getElementById('goal-progress').textContent = `${goalProgress}%`;
    document.getElementById('goal-progress-fill').style.width = `${goalProgress}%`;
    document.getElementById('total-donors').textContent = totalDonors;
    
    // Update change indicators
    const totalRaisedChange = document.querySelector('#overview .stat-card:nth-child(1) .stat-change');
    const totalDonorsChange = document.querySelector('#overview .stat-card:nth-child(3) .stat-change');
    
    totalRaisedChange.textContent = `+₨${todayAmount.toLocaleString()} today`;
    totalDonorsChange.textContent = `+${todayDonations.length} today`;
    
    // Website visitors placeholder until GA4 integration
    document.getElementById('website-visitors').textContent = 0;
}

function updateRecentActivity(donations) {
    const recentDonations = donations
        .sort((a, b) => {
            const bd = (b.createdAt && typeof b.createdAt.toDate === 'function') ? b.createdAt.toDate() : new Date();
            const ad = (a.createdAt && typeof a.createdAt.toDate === 'function') ? a.createdAt.toDate() : new Date();
            return bd - ad;
        })
        .slice(0, 10);
    
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
        time.textContent = formatTimeAgo((donation.createdAt && typeof donation.createdAt.toDate === 'function') ? donation.createdAt.toDate() : new Date());
        
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
        const donationsSnapshot = await (await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')).getDocs(
            (await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')).collection(db, 'donations')
        );
        const donations = donationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
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
    
    donations.forEach(donation => {
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate((donation.createdAt && typeof donation.createdAt.toDate === 'function') ? donation.createdAt.toDate() : new Date());
        
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
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-outline btn-sm';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editDonation(donation);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteDonation(donation.id);
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
        
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
        
        // Initial fetch
        await fetchLeaderboardData();
        
        // Set up real-time subscription
        leaderboardSubscription = supabase
            .channel('leaderboard-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'leaderboard' },
                (payload) => {
                    console.log('Leaderboard change detected:', payload);
                    fetchLeaderboardData(); // Refresh data when changes occur
                }
            )
            .subscribe();
            
    } catch (error) {
        console.error('Failed to load leaderboard data:', error);
        showError('Failed to load leaderboard data. Please refresh the page.');
    }
}

async function fetchLeaderboardData() {
    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('*')
            .order('amount', { ascending: false });
            
        if (error) {
            throw error;
        }
        
        // Update ranks based on amount order
        const sortedData = (data || []).map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));
        
        window._leaderboardData = sortedData;
        displayLeaderboardTable(sortedData);
        
    } catch (error) {
        console.error('Failed to fetch leaderboard data:', error);
        displayLeaderboardTable([]);
    }
}

async function fallbackLeaderboardCsv() {
    try {
        const res = await fetch('leaderboard.csv', { cache: 'no-store' });
        if (!res.ok) throw new Error('CSV fetch failed');
        const text = await res.text();
        const rows = text.trim().split('\n');
        const data = [];
        for (let i = 1; i < rows.length; i++) {
            const line = rows[i];
            if (!line) continue;
            const firstComma = line.indexOf(',');
            const secondComma = line.indexOf(',', firstComma + 1);
            if (firstComma === -1 || secondComma === -1) continue;
            const rankStr = line.slice(0, firstComma).trim();
            const name = line.slice(firstComma + 1, secondComma).trim();
            const amountStr = line.slice(secondComma + 1).trim();
            const rank = parseInt(rankStr, 10);
            const amount = parseInt(amountStr.replace(/,/g, ''), 10);
            if (!isNaN(rank) && !isNaN(amount)) data.push({ rank, name, amount });
        }
        data.sort((a,b) => a.rank - b.rank);
        displayLeaderboardTable(data);
        window._leaderboardData = data;
        // Using CSV fallback silently to avoid distracting error toast
    } catch (e) {
        console.error('CSV fallback failed:', e);
        displayLeaderboardTable([]);
    }
}

async function fallbackLeaderboardRest() {
    try {
        if (!PROJECT_ID || !API_KEY) return false;
        const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(PROJECT_ID)}/databases/(default)/documents/leaderboard?pageSize=200&key=${encodeURIComponent(API_KEY)}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return false;
        const json = await res.json();
        if (!json.documents) return false;
        const data = json.documents.map(doc => {
            const f = doc.fields || {};
            const rank = Number((f.rank && (f.rank.integerValue||f.rank.doubleValue)) || 9999);
            const name = f.name ? (f.name.stringValue||'') : '';
            const amount = Number((f.amount && (f.amount.integerValue||f.amount.doubleValue)) || 0);
            return { rank, name, amount };
        }).sort((a,b) => a.rank - b.rank);
        window._leaderboardData = data;
        displayLeaderboardTable(data);
        return true;
    } catch (e) {
        console.error('REST fallback failed:', e);
        return false;
    }
}

function displayLeaderboardTable(leaderboardData) {
    const tableBody = document.getElementById('admin-leaderboard-body');
    tableBody.innerHTML = '';
    
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

// CSV Export
function exportLeaderboardCsv() {
    const table = document.getElementById('admin-leaderboard-table');
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
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leaderboard.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Analytics Section
async function loadAnalyticsData() {
    try {
        // Placeholder: integrate GA4 API. For now show empty charts/messages.
        createDonationsChart([]);
        createPaymentMethodsChart([]);
        createTrafficChart([]);
        createConversionChart([]);
        updateRealtimeMetrics({ activeUsers: 0, pageViews: 0, bounceRate: 0, sessionDuration: 0 });
    } catch (error) {
        console.error('Failed to load analytics data:', error);
    }
}

// Mock generators removed per requirement: no mock data

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

function createTrafficChart(data) {
    const canvas = document.getElementById('traffic-chart');
    if (!canvas) {
        console.warn('Traffic chart canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (charts.traffic) {
        charts.traffic.destroy();
    }
    
    try {
        charts.traffic = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    label: 'Visitors',
                    data: data.map(d => d.visitors),
                    backgroundColor: '#2A8D9C'
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
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Failed to create traffic chart:', error);
    }
}

function createConversionChart(data) {
    const canvas = document.getElementById('conversion-chart');
    if (!canvas) {
        console.warn('Conversion chart canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (charts.conversion) {
        charts.conversion.destroy();
    }
    
    try {
        charts.conversion = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    label: 'Conversion Rate (%)',
                    data: data.map(d => d.rate),
                    borderColor: '#FFB52E',
                    backgroundColor: 'rgba(255, 181, 46, 0.1)',
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
                                return value.toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Failed to create conversion chart:', error);
    }
}

function updateRealtimeMetrics(data) {
    document.getElementById('active-users').textContent = data.activeUsers;
    document.getElementById('page-views').textContent = data.pageViews.toLocaleString();
    document.getElementById('bounce-rate').textContent = data.bounceRate.toFixed(1) + '%';
    document.getElementById('session-duration').textContent = data.sessionDuration + 'm';
}

// Settings Section
function loadSettingsData() {
    // Load current settings
    document.getElementById('fundraising-goal').value = 200000;
    document.getElementById('site-title').value = 'Nashr Foundation - Empowering Communities Through Essential Support';
    document.getElementById('site-description').value = 'Nashr Foundation provides education, food, clean water, and basic necessities to vulnerable communities across Pakistan. Join us in making a difference through donations and volunteer work.';
}

// Form Handlers
async function handleGoalUpdate(e) {
    e.preventDefault();
    
    const goal = document.getElementById('fundraising-goal').value;
    
    try {
        // In production, save to Firestore
        console.log('Goal updated to:', goal);
        showSuccess('Fundraising goal updated successfully!');
    } catch (error) {
        showError('Failed to update goal. Please try again.');
    }
}

async function handleWebsiteSettings(e) {
    e.preventDefault();
    
    const title = document.getElementById('site-title').value;
    const description = document.getElementById('site-description').value;
    
    try {
        // In production, save to Firestore
        console.log('Website settings updated:', { title, description });
        showSuccess('Website settings updated successfully!');
    } catch (error) {
        showError('Failed to update website settings. Please try again.');
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        showError('New passwords do not match.');
        return;
    }
    // Validate current password by reauthenticating the current user
    try {
        const authModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
        const user = auth.currentUser;
        if (!user) {
            showError('You must be logged in to change password.');
            return;
        }

        // Reauthenticate with the provided current password
        const credential = authModule.EmailAuthProvider.credential(user.email, currentPassword);
        await authModule.reauthenticateWithCredential(user, credential);

        // Update password
        await authModule.updatePassword(user, newPassword);
        showSuccess('Password updated successfully!');
        e.target.reset();
    } catch (error) {
        console.error('Password update failed:', error);
        const message = error?.code === 'auth/wrong-password' ? 'Current password is incorrect.' : 'Failed to update password. Please try again.';
        showError(message);
    }
}

async function handleLeaderboardEntry(e) {
    e.preventDefault();
    
    const name = document.getElementById('entry-name').value;
    const amount = parseInt(document.getElementById('entry-amount').value);
    const editId = document.getElementById('edit-entry-id').value;
    
    try {
        const fs = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const list = Array.isArray(window._leaderboardData) ? window._leaderboardData : [];
        let rank;
        if (editId) {
            rank = parseInt(editId, 10);
        } else {
            rank = list.length ? Math.max(...list.map(x => x.rank)) + 1 : 1;
        }
        const rankId = String(rank).padStart(2, '0');
        const docRef = fs.doc(fs.collection(db, 'leaderboard'), rankId);
        await fs.setDoc(docRef, { rank, name, amount });
        showSuccess('Leaderboard entry saved.');
        e.target.reset();
        document.getElementById('edit-entry-id').value = '';
        hideEntryForm();
        // Realtime listener will refresh table
    } catch (error) {
        console.error('Failed to save entry:', error);
        showError('Failed to save entry. Check Firestore permissions and sign-in.');
    }
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
    
    // Debug: Check authentication state
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
        showError('You must be logged in to add entries.');
        return;
    }
    
    try {
        let success = false;
        
        if (editId) {
            // Edit existing entry
            const { data, error } = await supabase
                .from('leaderboard')
                .update({
                    name: name,
                    amount: amount,
                    updated_at: new Date().toISOString()
                })
                .eq('rank', parseInt(editId, 10));
                
            if (error) {
                throw error;
            }
            success = true;
        } else {
            // Add new entry - compute next available rank to satisfy NOT NULL constraint
            let nextRank = 1;
            try {
                const { data: maxRow, error: maxErr } = await supabase
                    .from('leaderboard')
                    .select('rank')
                    .order('rank', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (maxErr) {
                    // Log but do not block; default nextRank = 1
                    console.warn('Failed to fetch max rank, defaulting to 1:', maxErr);
                } else if (maxRow && typeof maxRow.rank === 'number') {
                    nextRank = maxRow.rank + 1;
                }
            } catch (e2) {
                console.warn('Max rank fetch threw, defaulting to 1:', e2);
            }

            const { data, error } = await supabase
                .from('leaderboard')
                .insert({
                    rank: nextRank,
                    name: name,
                    amount: amount
                });
                
            if (error) {
                throw error;
            }
            success = true;
        }
        
        if (success) {
            showSuccess(editId ? 'Leaderboard entry updated successfully!' : 'New leaderboard entry added successfully!');
            hideEntryForm();
            // Refresh data after a short delay
            setTimeout(() => {
                fetchLeaderboardData();
            }, 1000);
        }
        
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
            const { data, error } = await supabase
                .from('leaderboard')
                .delete()
                .eq('rank', rank);
                
            if (error) {
                throw error;
            }
            
            showSuccess('Leaderboard entry deleted.');
            // Refresh data after a short delay
            setTimeout(() => {
                fetchLeaderboardData();
            }, 1000);
            
        } catch (error) {
            console.error('Failed to delete entry:', error);
            showError('Failed to delete entry. Please try again.');
        }
    }
}

// Donation Management
function editDonation(donation) {
    // Implement donation editing
    console.log('Editing donation:', donation);
}

async function deleteDonation(donationId) {
    if (confirm('Are you sure you want to delete this donation? This action cannot be undone.')) {
        try {
            // In production, delete from Firestore
            console.log('Deleting donation:', donationId);
            showSuccess('Donation deleted successfully!');
            loadDonationsData();
        } catch (error) {
            showError('Failed to delete donation. Please try again.');
        }
    }
}

// Search and Filter
function handleDonationSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    // Implement search functionality
    console.log('Searching for:', searchTerm);
}

function handleDonationFilter(e) {
    const filterValue = e.target.value;
    // Implement filter functionality
    console.log('Filtering by:', filterValue);
}

// Pagination
let currentPage = 1;
const itemsPerPage = 20;

function setupPagination(data) {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    updatePaginationInfo(totalPages);
    
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
}

function changePage(direction) {
    currentPage += direction;
    // Implement pagination logic
    console.log('Changing to page:', currentPage);
}

function updatePaginationInfo(totalPages) {
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
}

// Utility Functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
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
    const el = document.getElementById('last-updated-time');
    if (el) {
        el.textContent = now.toLocaleString();
    }
}

function setupDateRangePicker() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('start-date').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('end-date').value = today.toISOString().split('T')[0];
}

function updateAnalytics() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    console.log('Updating analytics for:', startDate, 'to', endDate);
    loadAnalyticsData();
}

// Real-time Updates
function startRealtimeUpdates() {
    // Update data every 30 seconds
    setInterval(() => {
        if (currentUser) {
            updateLastUpdatedTime();
            // In production, fetch real-time updates from Firebase
        }
    }, 30000);
}

// Quick Actions
function addManualDonation() {
    // Implement manual donation entry
    console.log('Adding manual donation');
}

function exportDonations() {
    // Implement data export
    console.log('Exporting donations data');
}

function refreshData() {
    loadDashboardData();
    showSuccess('Data refreshed successfully!');
}

// UI Helpers
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
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
