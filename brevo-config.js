// Brevo Configuration for Nashr Foundation
// Replace the placeholder values with your actual Brevo credentials

const BREVO_CONFIG = {
    // Your Brevo API Key (get this from Brevo dashboard > API Keys)
    // SECURITY: Never commit API keys to version control!
    // Set this via environment variable or configure manually
    apiKey: process.env.BREVO_API_KEY || window.BREVO_API_KEY || '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',
    
    // Your Brevo List ID (get this from Brevo dashboard > Contacts > Lists)
    listId: '3',
    
    // Optional: Default attributes for new subscribers
    defaultAttributes: {
        SOURCE: 'website',
        CONSENT: 'yes'
    }
};

// Auto-configure Brevo service when this file loads
document.addEventListener('DOMContentLoaded', function() {
    if (window.brevoService && BREVO_CONFIG.apiKey !== 'YOUR_BREVO_API_KEY') {
        window.brevoService.initialize(BREVO_CONFIG.apiKey, BREVO_CONFIG.listId);
        console.log('✅ Brevo service configured with provided credentials');
    } else {
        console.warn('⚠️ Brevo not configured. Please update brevo-config.js with your credentials.');
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BREVO_CONFIG;
} else {
    window.BREVO_CONFIG = BREVO_CONFIG;
}
