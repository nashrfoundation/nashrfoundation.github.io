// Askari Bank Limited Payment Gateway Integration
// Real-time card validation and transaction processing

class AskariBankPaymentGateway {
    constructor() {
        // Use configuration from askari-bank-config.js
        this.config = {
            ...ASKARI_BANK_CONFIG,
            endpoints: {
                validateCard: '/validate-card',
                processPayment: '/process-payment',
                verifyTransaction: '/verify-transaction'
            }
        };
        
        this.initializeGateway();
    }

    initializeGateway() {
        console.log('🏦 Initializing Askari Bank Payment Gateway...');
        
        // Validate configuration
        if (!this.config.merchantId || this.config.merchantId === 'ASKARI_MERCHANT_ID') {
            console.warn('⚠️ Please configure your Askari Bank merchant ID');
        }
        
        if (!this.config.apiKey || this.config.apiKey === 'ASKARI_API_KEY') {
            console.warn('⚠️ Please configure your Askari Bank API key');
        }
        
        console.log('✅ Askari Bank Gateway initialized');
    }

    // Real-time card validation with bank
    async validateCardRealTime(cardData) {
        try {
            console.log('🔍 Validating card with Askari Bank...');
            
            const validationPayload = {
                merchantId: this.config.merchantId,
                cardNumber: cardData.cardNumber,
                expiryMonth: cardData.expiryDate.split('/')[0],
                expiryYear: '20' + cardData.expiryDate.split('/')[1],
                cvv: cardData.cvv,
                timestamp: new Date().toISOString(),
                signature: this.generateSignature(cardData)
            };

            const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.validateCard}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'X-Merchant-ID': this.config.merchantId,
                    'X-Timestamp': validationPayload.timestamp
                },
                body: JSON.stringify(validationPayload)
            });

            if (!response.ok) {
                throw new Error(`Bank API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.status === 'VALID') {
                console.log('✅ Card validated successfully by bank');
                return {
                    valid: true,
                    cardType: result.cardType,
                    bankName: result.bankName,
                    cardLevel: result.cardLevel,
                    message: 'Card validated successfully'
                };
            } else {
                console.log('❌ Card validation failed:', result.message);
                return {
                    valid: false,
                    error: result.message,
                    code: result.errorCode
                };
            }

        } catch (error) {
            console.error('❌ Card validation error:', error);
            return {
                valid: false,
                error: 'Unable to validate card at this time. Please try again.',
                code: 'VALIDATION_ERROR'
            };
        }
    }

    // Process real payment with bank
    async processRealPayment(paymentData) {
        try {
            console.log('💳 Processing real payment with Askari Bank...');
            
            const paymentPayload = {
                merchantId: this.config.merchantId,
                transactionId: this.generateTransactionId(),
                amount: paymentData.amount,
                currency: this.config.currency,
                cardNumber: paymentData.cardData.cardNumber,
                expiryMonth: paymentData.cardData.expiryDate.split('/')[0],
                expiryYear: '20' + paymentData.cardData.expiryDate.split('/')[1],
                cvv: paymentData.cardData.cvv,
                cardholderName: paymentData.cardData.cardHolder,
                billingDetails: {
                    name: paymentData.donorName,
                    email: paymentData.email,
                    phone: paymentData.phone,
                    address: 'Pakistan' // Default for donations
                },
                description: `Donation to Nashr Foundation - ${paymentData.donorName}`,
                timestamp: new Date().toISOString(),
                signature: this.generatePaymentSignature(paymentData)
            };

            const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.processPayment}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'X-Merchant-ID': this.config.merchantId,
                    'X-Transaction-ID': paymentPayload.transactionId,
                    'X-Timestamp': paymentPayload.timestamp
                },
                body: JSON.stringify(paymentPayload)
            });

            if (!response.ok) {
                throw new Error(`Payment API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.status === 'SUCCESS') {
                console.log('✅ Payment processed successfully:', result.transactionId);
                return {
                    success: true,
                    transactionId: result.transactionId,
                    bankReference: result.bankReference,
                    amount: result.amount,
                    currency: result.currency,
                    timestamp: result.timestamp,
                    message: 'Payment processed successfully'
                };
            } else {
                console.log('❌ Payment failed:', result.message);
                return {
                    success: false,
                    error: result.message,
                    code: result.errorCode,
                    bankReference: result.bankReference || null
                };
            }

        } catch (error) {
            console.error('❌ Payment processing error:', error);
            return {
                success: false,
                error: 'Payment processing failed. Please try again.',
                code: 'PROCESSING_ERROR'
            };
        }
    }

    // Verify transaction status
    async verifyTransaction(transactionId) {
        try {
            console.log('🔍 Verifying transaction:', transactionId);
            
            const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.verifyTransaction}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'X-Merchant-ID': this.config.merchantId
                },
                body: JSON.stringify({
                    merchantId: this.config.merchantId,
                    transactionId: transactionId,
                    timestamp: new Date().toISOString(),
                    signature: this.generateVerificationSignature(transactionId)
                })
            });

            if (!response.ok) {
                throw new Error(`Verification API error: ${response.status}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('❌ Transaction verification error:', error);
            return {
                status: 'UNKNOWN',
                error: 'Unable to verify transaction'
            };
        }
    }

    // Generate unique transaction ID
    generateTransactionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `TXN_${timestamp}_${random}`.toUpperCase();
    }

    // Generate signature for card validation
    generateSignature(cardData) {
        const data = `${this.config.merchantId}${cardData.cardNumber}${cardData.expiryDate}${this.config.secretKey}`;
        return this.hashString(data);
    }

    // Generate signature for payment
    generatePaymentSignature(paymentData) {
        const data = `${this.config.merchantId}${paymentData.amount}${paymentData.cardData.cardNumber}${this.config.secretKey}`;
        return this.hashString(data);
    }

    // Generate signature for verification
    generateVerificationSignature(transactionId) {
        const data = `${this.config.merchantId}${transactionId}${this.config.secretKey}`;
        return this.hashString(data);
    }

    // Simple hash function (replace with proper crypto library in production)
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    // Get bank transaction fees
    getTransactionFees(amount) {
        // Askari Bank typical fees (you'll get exact rates from the bank)
        const baseFee = 50; // PKR
        const percentageFee = 0.025; // 2.5%
        
        return {
            baseFee: baseFee,
            percentageFee: amount * percentageFee,
            totalFee: baseFee + (amount * percentageFee),
            netAmount: amount - (baseFee + (amount * percentageFee))
        };
    }

    // Get supported card types
    getSupportedCardTypes() {
        return [
            { type: 'visa', name: 'Visa', minLength: 13, maxLength: 19 },
            { type: 'mastercard', name: 'Mastercard', minLength: 16, maxLength: 19 },
            { type: 'amex', name: 'American Express', minLength: 15, maxLength: 15 },
            { type: 'unionpay', name: 'UnionPay', minLength: 16, maxLength: 19 }
        ];
    }

    // Get transaction limits
    getTransactionLimits() {
        return {
            minAmount: 100, // PKR
            maxAmount: 1000000, // PKR 1M
            dailyLimit: 500000, // PKR 500K
            monthlyLimit: 5000000 // PKR 5M
        };
    }

    // Check if amount is within limits
    validateAmount(amount) {
        const limits = this.getTransactionLimits();
        
        if (amount < limits.minAmount) {
            return { valid: false, error: `Minimum amount is PKR ${limits.minAmount}` };
        }
        
        if (amount > limits.maxAmount) {
            return { valid: false, error: `Maximum amount is PKR ${limits.maxAmount}` };
        }
        
        return { valid: true };
    }

    // Get bank status
    async getBankStatus() {
        try {
            const response = await fetch(`${this.config.baseUrl}/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'X-Merchant-ID': this.config.merchantId
                }
            });

            if (response.ok) {
                const status = await response.json();
                return {
                    online: status.status === 'ONLINE',
                    message: status.message,
                    timestamp: status.timestamp
                };
            } else {
                return { online: false, message: 'Unable to connect to bank' };
            }
        } catch (error) {
            return { online: false, message: 'Bank connection error' };
        }
    }
}

// Initialize the bank gateway
document.addEventListener('DOMContentLoaded', () => {
    window.askariBankGateway = new AskariBankPaymentGateway();
});
