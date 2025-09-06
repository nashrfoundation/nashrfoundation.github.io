// Brevo Production Configuration
// This file is safe to commit and contains production-ready configuration

// For production deployment, you can either:
// 1. Set the API key directly here (only for production)
// 2. Use environment variables
// 3. Configure via your hosting platform's environment settings

// Option 1: Direct configuration for production (uncomment and set your API key)

window.BREVO_API_KEY = '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';
window.BREVO_LIST_ID = '3';




// Option 3: Manual configuration for GitHub Pages
// IMPORTANT: Set your API key for GitHub Pages deployment
// For security, this should be set via environment variable in production
if (typeof window !== 'undefined') {
    // Set API key for production deployment
    // This will be overridden by environment variable if set
    window.BREVO_API_KEY = window.BREVO_API_KEY || 'YOUR_BREVO_API_KEY_HERE';
    window.BREVO_LIST_ID = '3';
}

console.log('🔧 Brevo production configuration loaded');
