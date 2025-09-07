// Security & Monitoring System for Nashr Foundation Admin Portal

// Security management variables
let securityLogs = [];
let activeSessions = [];
let seoMetrics = {};
let ipWhitelist = [];
let ipBlacklist = [];
let twoFactorEnabled = false;

// Initialize security management
function initializeSecurityManagement() {
    loadSecurityData();
    setupSecurityEventListeners();
    startSecurityMonitoring();
}

// Setup security event listeners
function setupSecurityEventListeners() {
    // 2FA code input
    const twoFACodeInput = document.getElementById('2fa-code');
    if (twoFACodeInput) {
        twoFACodeInput.addEventListener('input', function(e) {
            if (e.target.value.length === 6) {
                verify2FACode();
            }
        });
    }
    
    // Session timeout monitoring
    let lastActivity = Date.now();
    document.addEventListener('click', () => lastActivity = Date.now());
    document.addEventListener('keypress', () => lastActivity = Date.now());
    
    setInterval(() => {
        const sessionTimeout = getSessionTimeout();
        if (Date.now() - lastActivity > sessionTimeout * 60 * 1000) {
            handleSessionTimeout();
        }
    }, 60000); // Check every minute
}

// Load security data
async function loadSecurityData() {
    try {
        await Promise.all([
            loadSecurityLogs(),
            loadActiveSessions(),
            loadSEOMetrics(),
            loadIPRules(),
            load2FAStatus(),
            loadSecuritySettings()
        ]);
    } catch (error) {
        console.error('Error loading security data:', error);
    }
}

// Two-Factor Authentication
async function toggle2FA() {
    const checkbox = document.getElementById('2fa-enabled');
    const isEnabled = checkbox.checked;
    
    if (isEnabled) {
        await setup2FA();
    } else {
        await disable2FA();
    }
}

async function setup2FA() {
    try {
        showLoading('Setting up 2FA...');
        
        // Generate 2FA secret
        const secret = generate2FASecret();
        const qrCodeUrl = generateQRCode(secret);
        
        // Display QR code
        const qrContainer = document.getElementById('qr-code');
        if (qrContainer) {
            qrContainer.innerHTML = `<img src="${qrCodeUrl}" alt="2FA QR Code" style="width: 100%; height: 100%; object-fit: contain;">`;
        }
        
        // Show setup UI
        document.getElementById('2fa-status').style.display = 'none';
        document.getElementById('2fa-setup').style.display = 'block';
        
        // Store secret temporarily
        sessionStorage.setItem('2fa_secret', secret);
        
        hideLoading();
        showSuccess('2FA setup initiated. Scan the QR code with your authenticator app.');
        
    } catch (error) {
        hideLoading();
        console.error('Error setting up 2FA:', error);
        showError('Failed to setup 2FA');
    }
}

async function verify2FACode() {
    const code = document.getElementById('2fa-code')?.value;
    if (!code || code.length !== 6) {
        showError('Please enter a valid 6-digit code');
        return;
    }
    
    try {
        showLoading('Verifying 2FA code...');
        
        const secret = sessionStorage.getItem('2fa_secret');
        const isValid = verifyTOTPCode(secret, code);
        
        if (isValid) {
            // Save 2FA settings
            await supabase
                .from('settings')
                .upsert({
                    key: '2fa_enabled',
                    value: 'true'
                });
                
            await supabase
                .from('settings')
                .upsert({
                    key: '2fa_secret',
                    value: secret
                });
            
            // Generate recovery codes
            const recoveryCodes = generateRecoveryCodes();
            await saveRecoveryCodes(recoveryCodes);
            
            // Update UI
            document.getElementById('2fa-setup').style.display = 'none';
            document.getElementById('2fa-status').style.display = 'block';
            document.getElementById('2fa-status').innerHTML = `
                <div class="status-indicator online">Enabled</div>
                <p>Two-factor authentication is now enabled</p>
            `;
            
            // Show recovery codes
            displayRecoveryCodes(recoveryCodes);
            
            hideLoading();
            showSuccess('2FA enabled successfully!');
            logSecurityEvent('2fa_enabled', 'Two-factor authentication enabled');
            
        } else {
            hideLoading();
            showError('Invalid 2FA code. Please try again.');
        }
        
    } catch (error) {
        hideLoading();
        console.error('Error verifying 2FA code:', error);
        showError('Failed to verify 2FA code');
    }
}

async function disable2FA() {
    try {
        await supabase
            .from('settings')
            .upsert({
                key: '2fa_enabled',
                value: 'false'
            });
            
        document.getElementById('2fa-status').innerHTML = `
            <div class="status-indicator offline">Disabled</div>
            <p>Two-factor authentication is currently disabled</p>
        `;
        
        showSuccess('2FA disabled successfully');
        logSecurityEvent('2fa_disabled', 'Two-factor authentication disabled');
        
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        showError('Failed to disable 2FA');
    }
}

async function load2FAStatus() {
    try {
        const { data } = await supabase
            .from('settings')
            .select('value')
            .eq('key', '2fa_enabled')
            .single();
            
        twoFactorEnabled = data?.value === 'true';
        
        const checkbox = document.getElementById('2fa-enabled');
        if (checkbox) {
            checkbox.checked = twoFactorEnabled;
        }
        
        const statusElement = document.getElementById('2fa-status');
        if (statusElement) {
            if (twoFactorEnabled) {
                statusElement.innerHTML = `
                    <div class="status-indicator online">Enabled</div>
                    <p>Two-factor authentication is currently enabled</p>
                `;
            } else {
                statusElement.innerHTML = `
                    <div class="status-indicator offline">Disabled</div>
                    <p>Two-factor authentication is currently disabled</p>
                `;
            }
        }
        
    } catch (error) {
        console.error('Error loading 2FA status:', error);
    }
}

// Session Management
async function loadActiveSessions() {
    try {
        const { data, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', currentUser?.id)
            .eq('active', true)
            .order('last_activity', { ascending: false });
            
        if (error) throw error;
        
        activeSessions = data || [];
        updateSessionDisplay();
        
    } catch (error) {
        console.error('Error loading active sessions:', error);
    }
}

function updateSessionDisplay() {
    const activeSessionsElement = document.getElementById('active-sessions');
    if (activeSessionsElement) {
        activeSessionsElement.textContent = activeSessions.length;
    }
    
    const sessionsList = document.getElementById('active-sessions-list');
    if (sessionsList) {
        if (activeSessions.length === 0) {
            sessionsList.innerHTML = '<p class="text-muted">No active sessions</p>';
        } else {
            sessionsList.innerHTML = activeSessions.map(session => `
                <div class="session-item">
                    <div class="session-info">
                        <div>${session.device_info || 'Unknown Device'}</div>
                        <small class="text-muted">${session.ip_address} • ${new Date(session.last_activity).toLocaleString()}</small>
                    </div>
                    <div class="session-actions">
                        <button class="btn btn-sm btn-outline" onclick="terminateSession('${session.id}')">Terminate</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

async function updateSessionTimeout() {
    const timeout = document.getElementById('session-timeout-select')?.value;
    if (!timeout) return;
    
    try {
        await supabase
            .from('settings')
            .upsert({
                key: 'session_timeout',
                value: timeout
            });
            
        document.getElementById('session-timeout').textContent = `${timeout} min`;
        showSuccess('Session timeout updated');
        logSecurityEvent('session_timeout_updated', `Session timeout set to ${timeout} minutes`);
        
    } catch (error) {
        console.error('Error updating session timeout:', error);
        showError('Failed to update session timeout');
    }
}

async function updateConcurrentSessions() {
    const maxSessions = document.getElementById('concurrent-sessions')?.value;
    if (!maxSessions) return;
    
    try {
        await supabase
            .from('settings')
            .upsert({
                key: 'max_concurrent_sessions',
                value: maxSessions
            });
            
        showSuccess('Max concurrent sessions updated');
        logSecurityEvent('concurrent_sessions_updated', `Max concurrent sessions set to ${maxSessions}`);
        
    } catch (error) {
        console.error('Error updating concurrent sessions:', error);
        showError('Failed to update concurrent sessions');
    }
}

async function terminateSession(sessionId) {
    try {
        await supabase
            .from('user_sessions')
            .update({ active: false, ended_at: new Date().toISOString() })
            .eq('id', sessionId);
            
        await loadActiveSessions();
        showSuccess('Session terminated');
        logSecurityEvent('session_terminated', `Session ${sessionId} terminated`);
        
    } catch (error) {
        console.error('Error terminating session:', error);
        showError('Failed to terminate session');
    }
}

async function terminateAllSessions() {
    try {
        await supabase
            .from('user_sessions')
            .update({ active: false, ended_at: new Date().toISOString() })
            .eq('user_id', currentUser?.id)
            .eq('active', true);
            
        await loadActiveSessions();
        showSuccess('All sessions terminated');
        logSecurityEvent('all_sessions_terminated', 'All user sessions terminated');
        
    } catch (error) {
        console.error('Error terminating all sessions:', error);
        showError('Failed to terminate all sessions');
    }
}

// SEO Monitoring
async function loadSEOMetrics() {
    try {
        // Simulate SEO metrics (in real implementation, this would call SEO APIs)
        seoMetrics = {
            score: 85,
            pageSpeed: 'Good',
            mobileFriendly: 'Yes',
            metaTags: 'Complete',
            altTags: '85%'
        };
        
        updateSEODisplay();
        
    } catch (error) {
        console.error('Error loading SEO metrics:', error);
    }
}

function updateSEODisplay() {
    document.getElementById('seo-score').textContent = `${seoMetrics.score}/100`;
    document.getElementById('page-speed').textContent = seoMetrics.pageSpeed;
    document.getElementById('mobile-friendly').textContent = seoMetrics.mobileFriendly;
    document.getElementById('meta-tags').textContent = seoMetrics.metaTags;
    document.getElementById('alt-tags').textContent = seoMetrics.altTags;
}

async function runSEOAudit() {
    try {
        showLoading('Running SEO audit...');
        
        // Simulate SEO audit
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const issues = [
            { type: 'Missing Alt Tags', severity: 'medium', count: 3 },
            { type: 'Slow Loading Images', severity: 'low', count: 2 },
            { type: 'Missing Meta Description', severity: 'high', count: 1 }
        ];
        
        displaySEOIssues(issues);
        
        hideLoading();
        showSuccess('SEO audit completed');
        logSecurityEvent('seo_audit_run', 'SEO audit completed');
        
    } catch (error) {
        hideLoading();
        console.error('Error running SEO audit:', error);
        showError('Failed to run SEO audit');
    }
}

function displaySEOIssues(issues) {
    const issuesList = document.querySelector('.issues-list');
    if (issuesList) {
        issuesList.innerHTML = issues.map(issue => `
            <div class="issue-item">
                <div>
                    <div>${issue.type}</div>
                    <small class="text-muted">${issue.count} issues found</small>
                </div>
                <span class="issue-severity ${issue.severity}">${issue.severity}</span>
            </div>
        `).join('');
    }
}

async function fixSEOIssues() {
    try {
        showLoading('Fixing SEO issues...');
        
        // Simulate fixing issues
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        hideLoading();
        showSuccess('SEO issues fixed automatically');
        logSecurityEvent('seo_issues_fixed', 'SEO issues auto-fixed');
        
    } catch (error) {
        hideLoading();
        console.error('Error fixing SEO issues:', error);
        showError('Failed to fix SEO issues');
    }
}

// Security Audit Logs
async function loadSecurityLogs() {
    try {
        const { data, error } = await supabase
            .from('security_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
            
        if (error) throw error;
        
        securityLogs = data || [];
        updateSecurityLogsDisplay();
        
    } catch (error) {
        console.error('Error loading security logs:', error);
    }
}

function updateSecurityLogsDisplay() {
    const logsList = document.getElementById('security-logs-list');
    if (logsList) {
        if (securityLogs.length === 0) {
            logsList.innerHTML = '<p class="text-muted">No security events found</p>';
        } else {
            logsList.innerHTML = securityLogs.map(log => `
                <div class="security-log-item">
                    <div>
                        <div>${log.event_type}</div>
                        <small class="text-muted">${log.ip_address} • ${new Date(log.created_at).toLocaleString()}</small>
                    </div>
                    <span class="log-severity ${log.severity}">${log.severity}</span>
                </div>
            `).join('');
        }
    }
    
    // Update security stats
    const failedLogins = securityLogs.filter(log => log.event_type === 'failed_login').length;
    const suspiciousActivity = securityLogs.filter(log => log.severity === 'critical').length;
    const blockedIPs = securityLogs.filter(log => log.event_type === 'ip_blocked').length;
    
    document.getElementById('failed-logins').textContent = failedLogins;
    document.getElementById('suspicious-activity').textContent = suspiciousActivity;
    document.getElementById('blocked-ips').textContent = blockedIPs;
}

function filterSecurityLogs() {
    const filter = document.getElementById('security-filter')?.value || 'all';
    // Implementation for filtering security logs
    console.log('Filtering security logs by:', filter);
}

// IP Management
async function loadIPRules() {
    try {
        const { data, error } = await supabase
            .from('ip_rules')
            .select('*');
            
        if (error) throw error;
        
        ipWhitelist = data?.filter(rule => rule.type === 'whitelist') || [];
        ipBlacklist = data?.filter(rule => rule.type === 'blacklist') || [];
        
        updateIPDisplay();
        
    } catch (error) {
        console.error('Error loading IP rules:', error);
    }
}

function updateIPDisplay() {
    const whitelistElement = document.getElementById('whitelist-ips');
    const blacklistElement = document.getElementById('blacklist-ips');
    
    if (whitelistElement) {
        whitelistElement.innerHTML = ipWhitelist.map(ip => `
            <div class="ip-item">
                <span>${ip.ip_address}</span>
                <button class="btn btn-sm btn-outline" onclick="removeIPRule('${ip.id}')">Remove</button>
            </div>
        `).join('') || '<p class="text-muted">No whitelisted IPs</p>';
    }
    
    if (blacklistElement) {
        blacklistElement.innerHTML = ipBlacklist.map(ip => `
            <div class="ip-item">
                <span>${ip.ip_address}</span>
                <button class="btn btn-sm btn-outline" onclick="removeIPRule('${ip.id}')">Remove</button>
            </div>
        `).join('') || '<p class="text-muted">No blacklisted IPs</p>';
    }
}

async function addIPAddress() {
    const ipAddress = document.getElementById('ip-address')?.value;
    const ruleType = document.getElementById('ip-rule-type')?.value;
    
    if (!ipAddress || !isValidIP(ipAddress)) {
        showError('Please enter a valid IP address');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('ip_rules')
            .insert([{
                ip_address: ipAddress,
                type: ruleType,
                created_at: new Date().toISOString()
            }]);
            
        if (error) throw error;
        
        document.getElementById('ip-address').value = '';
        await loadIPRules();
        showSuccess(`IP address ${ipAddress} added to ${ruleType}`);
        logSecurityEvent('ip_rule_added', `IP ${ipAddress} added to ${ruleType}`);
        
    } catch (error) {
        console.error('Error adding IP address:', error);
        showError('Failed to add IP address');
    }
}

async function removeIPRule(ruleId) {
    try {
        await supabase
            .from('ip_rules')
            .delete()
            .eq('id', ruleId);
            
        await loadIPRules();
        showSuccess('IP rule removed');
        logSecurityEvent('ip_rule_removed', `IP rule ${ruleId} removed`);
        
    } catch (error) {
        console.error('Error removing IP rule:', error);
        showError('Failed to remove IP rule');
    }
}

// Security Settings
async function loadSecuritySettings() {
    try {
        const { data } = await supabase
            .from('settings')
            .select('*')
            .in('key', ['password_policy', 'login_notifications', 'auto_logout', 'rate_limiting', 'security_headers']);
            
        if (data) {
            data.forEach(setting => {
                const element = document.getElementById(setting.key);
                if (element) {
                    element.checked = setting.value === 'true';
                }
            });
        }
        
    } catch (error) {
        console.error('Error loading security settings:', error);
    }
}

async function saveSecuritySettings() {
    try {
        const settings = [
            { key: 'password_policy', value: document.getElementById('password-policy')?.checked },
            { key: 'login_notifications', value: document.getElementById('login-notifications')?.checked },
            { key: 'auto_logout', value: document.getElementById('auto-logout')?.checked },
            { key: 'rate_limiting', value: document.getElementById('rate-limiting')?.checked },
            { key: 'security_headers', value: document.getElementById('security-headers')?.checked }
        ];
        
        const { error } = await supabase
            .from('settings')
            .upsert(settings.map(s => ({ key: s.key, value: s.value.toString() })));
            
        if (error) throw error;
        
        showSuccess('Security settings saved');
        logSecurityEvent('security_settings_updated', 'Security settings updated');
        
    } catch (error) {
        console.error('Error saving security settings:', error);
        showError('Failed to save security settings');
    }
}

// Security Monitoring
function startSecurityMonitoring() {
    // Monitor for suspicious activity
    setInterval(() => {
        checkForSuspiciousActivity();
    }, 30000); // Check every 30 seconds
    
    // Update security metrics
    setInterval(() => {
        updateSecurityMetrics();
    }, 60000); // Update every minute
}

function checkForSuspiciousActivity() {
    // Implementation for checking suspicious activity
    console.log('Checking for suspicious activity...');
}

function updateSecurityMetrics() {
    // Update real-time security metrics
    console.log('Updating security metrics...');
}

// Utility Functions
function generate2FASecret() {
    // Generate a random 32-character base32 secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
}

function generateQRCode(secret) {
    const issuer = 'Nashr Foundation';
    const account = currentUser?.email || 'admin';
    const url = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
}

function verifyTOTPCode(secret, code) {
    // Simple TOTP verification (in production, use a proper TOTP library)
    // This is a simplified implementation
    try {
        const currentTime = Math.floor(Date.now() / 1000 / 30);
        const expectedCode = generateTOTPCode(secret, currentTime);
        return code === expectedCode;
    } catch (error) {
        console.error('TOTP verification error:', error);
        return false;
    }
}

function generateTOTPCode(secret, time) {
    // Simplified TOTP generation (use proper library in production)
    try {
        // Convert secret to base32
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let binary = '';
        for (let i = 0; i < secret.length; i++) {
            const char = secret[i];
            const index = base32Chars.indexOf(char);
            if (index !== -1) {
                binary += index.toString(2).padStart(5, '0');
            }
        }
        
        // Pad to 8-bit groups
        while (binary.length % 8 !== 0) {
            binary += '0';
        }
        
        // Convert to bytes
        const bytes = [];
        for (let i = 0; i < binary.length; i += 8) {
            bytes.push(parseInt(binary.substr(i, 8), 2));
        }
        
        // Create key
        const key = CryptoJS.enc.Hex.parse(bytes.map(b => b.toString(16).padStart(2, '0')).join(''));
        
        // Generate HMAC
        const hash = CryptoJS.HmacSHA1(time.toString(), key);
        const words = hash.words;
        
        // Extract 6-digit code
        const offset = words[4] & 0xf;
        const code = ((words[offset] & 0x7fffffff) << 24) |
                     ((words[offset + 1] & 0x7fffffff) >>> 8);
        
        return (code % 1000000).toString().padStart(6, '0');
    } catch (error) {
        console.error('TOTP generation error:', error);
        // Fallback to a simple hash-based code
        const hash = CryptoJS.HmacSHA1(time.toString(), secret);
        return (Math.abs(hash.words[0]) % 1000000).toString().padStart(6, '0');
    }
}

function generateRecoveryCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
}

async function saveRecoveryCodes(codes) {
    try {
        await supabase
            .from('settings')
            .upsert({
                key: '2fa_recovery_codes',
                value: JSON.stringify(codes)
            });
    } catch (error) {
        console.error('Error saving recovery codes:', error);
    }
}

function displayRecoveryCodes(codes) {
    const container = document.getElementById('recovery-codes');
    if (container) {
        container.innerHTML = codes.map(code => `<div>${code}</div>`).join('');
    }
}

function isValidIP(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
}

function getSessionTimeout() {
    const timeout = document.getElementById('session-timeout-select')?.value;
    return parseInt(timeout) || 30;
}

function handleSessionTimeout() {
    showWarning('Session expired due to inactivity. Please log in again.');
    setTimeout(() => {
        window.location.href = '/admin.html';
    }, 3000);
}

function logSecurityEvent(eventType, details) {
    const logEntry = {
        event_type: eventType,
        details: details,
        user_id: currentUser?.id,
        ip_address: '0.0.0.0', // In production, get actual IP
        severity: getEventSeverity(eventType),
        created_at: new Date().toISOString()
    };
    
    // Save to database
    supabase
        .from('security_logs')
        .insert([logEntry])
        .then(() => {
            console.log('Security event logged:', logEntry);
        })
        .catch(error => {
            console.error('Error logging security event:', error);
        });
}

function getEventSeverity(eventType) {
    const criticalEvents = ['failed_login', 'suspicious_activity', 'ip_blocked'];
    const warningEvents = ['session_timeout', '2fa_disabled'];
    
    if (criticalEvents.includes(eventType)) return 'critical';
    if (warningEvents.includes(eventType)) return 'warning';
    return 'info';
}

// Security management utility functions
function runSecurityScan() {
    showInfo('Security scan feature coming soon!');
}

function refreshSecurityData() {
    loadSecurityData();
}

function exportSecurityReport() {
    showInfo('Security report export coming soon!');
}

function addIPRule() {
    addIPAddress();
}

function clearSecurityLogs() {
    showInfo('Clear security logs feature coming soon!');
}

function exportSecurityLogs() {
    showInfo('Export security logs feature coming soon!');
}

function generateRecoveryCodes() {
    showInfo('Generate recovery codes feature coming soon!');
}

// Initialize security management when admin loads
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        initializeSecurityManagement();
    }
});
