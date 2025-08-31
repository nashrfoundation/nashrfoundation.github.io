// Askari Bank Limited Configuration
// Replace these placeholder values with your actual bank credentials

const ASKARI_BANK_CONFIG = {
    // Bank API endpoints (you'll get these from Askari Bank)
    baseUrl: 'https://payment.askaribank.com/api', // Replace with actual URL
    
    // Your bank credentials (you'll get these from Askari Bank)
    merchantId: 'ASKARI_MERCHANT_ID', // Replace with your merchant ID
    apiKey: 'ASKARI_API_KEY', // Replace with your API key
    secretKey: 'ASKARI_SECRET_KEY', // Replace with your secret key
    
    // Transaction settings
    currency: 'PKR',
    country: 'PK',
    language: 'en',
    
    // Security settings
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    
    // Bank-specific settings
    supportedCardTypes: ['visa', 'mastercard', 'amex', 'unionpay'],
    minAmount: 100, // PKR
    maxAmount: 1000000, // PKR 1M
    
    // Fee structure (you'll get exact rates from the bank)
    fees: {
        baseFee: 50, // PKR
        percentageFee: 0.025, // 2.5%
        description: 'Askari Bank transaction fee'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ASKARI_BANK_CONFIG;
} else {
    window.ASKARI_BANK_CONFIG = ASKARI_BANK_CONFIG;
}
