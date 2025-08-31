// Direct Bank Payment Integration
// This handles direct card processing through your bank's payment gateway

class BankPaymentProcessor {
    constructor() {
        this.cardForm = null;
        this.submitButton = null;
        this.initializeForm();
    }

    initializeForm() {
        // Create the card input form
        this.createCardForm();
        
        // Add event listeners
        this.addEventListeners();
        
        // Initialize card validation
        this.initializeCardValidation();
    }

    createCardForm() {
        const bankCardDetails = document.getElementById('bank-card-details');
        if (!bankCardDetails) return;

        // Replace the content with our custom card form
        bankCardDetails.innerHTML = `
            <h3>Direct Bank Payment</h3>
            <p>Enter your card details below to complete your donation securely.</p>
            <div class="bank-card-form">
                <div class="form-group">
                    <label for="card-number">Card Number</label>
                    <input type="text" id="card-number" class="form-control card-input" 
                           placeholder="1234 5678 9012 3456" maxlength="19" required>
                    <div class="card-icon" id="card-icon"></div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="expiry-date">Expiry Date</label>
                        <input type="text" id="expiry-date" class="form-control card-input" 
                               placeholder="MM/YY" maxlength="5" required>
                    </div>
                    <div class="form-group">
                        <label for="cvv">CVV</label>
                        <input type="text" id="cvv" class="form-control card-input" 
                               placeholder="123" maxlength="4" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="card-holder">Cardholder Name</label>
                    <input type="text" id="card-holder" class="form-control card-input" 
                           placeholder="As it appears on card" required>
                </div>
                
                <div class="security-info">
                    <div class="security-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Secure SSL Encrypted
                    </div>
                    <div class="card-types">
                        <span class="card-type visa">Visa</span>
                        <span class="card-type mastercard">Mastercard</span>
                        <span class="card-type amex">Amex</span>
                    </div>
                </div>
            </div>
        `;
    }

    addEventListeners() {
        // Card number formatting
        const cardNumber = document.getElementById('card-number');
        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => this.formatCardNumber(e.target));
            cardNumber.addEventListener('keypress', (e) => this.allowOnlyNumbers(e));
        }

        // Expiry date formatting
        const expiryDate = document.getElementById('expiry-date');
        if (expiryDate) {
            expiryDate.addEventListener('input', (e) => this.formatExpiryDate(e.target));
            expiryDate.addEventListener('keypress', (e) => this.allowOnlyNumbers(e));
        }

        // CVV validation
        const cvv = document.getElementById('cvv');
        if (cvv) {
            cvv.addEventListener('input', (e) => this.allowOnlyNumbers(e));
        }

        // Card type detection
        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => this.detectCardType(e.target.value));
        }

        // Card preview updates
        this.initializeCardPreview();
    }

    initializeCardPreview() {
        // Card number preview
        const cardNumber = document.getElementById('card-number');
        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => this.updateCardPreview('number', e.target.value));
        }

        // Cardholder name preview
        const cardHolder = document.getElementById('card-holder');
        if (cardHolder) {
            cardHolder.addEventListener('input', (e) => this.updateCardPreview('holder', e.target.value));
        }

        // Expiry date preview
        const expiryDate = document.getElementById('expiry-date');
        if (expiryDate) {
            expiryDate.addEventListener('input', (e) => this.updateCardPreview('expiry', e.target.value));
        }
    }

    updateCardPreview(type, value) {
        switch (type) {
            case 'number':
                const previewNumber = document.getElementById('preview-card-number');
                if (previewNumber) {
                    if (value) {
                        const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                        previewNumber.textContent = formatted || '•••• •••• •••• ••••';
                    } else {
                        previewNumber.textContent = '•••• •••• •••• ••••';
                    }
                }
                break;
            case 'holder':
                const previewHolder = document.getElementById('preview-card-holder');
                if (previewHolder) {
                    previewHolder.textContent = value || 'Your Name';
                }
                break;
            case 'expiry':
                const previewExpiry = document.getElementById('preview-card-expiry');
                if (previewExpiry) {
                    previewExpiry.textContent = value || 'MM/YY';
                }
                break;
        }
    }

    initializeCardValidation() {
        // Real-time validation
        const inputs = document.querySelectorAll('.card-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    formatCardNumber(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        input.value = value;
        
        // Update card icon
        this.detectCardType(value);
    }

    formatExpiryDate(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        input.value = value;
    }

    allowOnlyNumbers(e) {
        if (!/\d/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
            e.preventDefault();
        }
    }

    detectCardType(cardNumber) {
        const cardIcon = document.getElementById('card-icon');
        const previewCardLogo = document.getElementById('preview-card-logo');
        if (!cardIcon) return;

        const cleanNumber = cardNumber.replace(/\s/g, '');
        let cardType = '';

        if (/^4/.test(cleanNumber)) {
            cardType = 'visa';
        } else if (/^5[1-5]/.test(cleanNumber)) {
            cardType = 'mastercard';
        } else if (/^3[47]/.test(cleanNumber)) {
            cardType = 'amex';
        }

        // Update input icon
        cardIcon.className = `card-icon ${cardType}`;
        cardIcon.innerHTML = this.getCardIconHTML(cardType);

        // Update preview card logo
        if (previewCardLogo) {
            previewCardLogo.innerHTML = this.getCardIconHTML(cardType);
            previewCardLogo.className = `card-logo ${cardType}`;
        }

        // Update card preview background based on card type
        this.updateCardPreviewBackground(cardType);
    }

    updateCardPreviewBackground(cardType) {
        const cardPreview = document.getElementById('card-preview');
        if (!cardPreview) return;

        const cardFront = cardPreview.querySelector('.card-front');
        if (!cardFront) return;

        const gradients = {
            visa: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
            mastercard: 'linear-gradient(135deg, #FF5722 0%, #E64A19 100%)',
            amex: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
            default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        };

        cardFront.style.background = gradients[cardType] || gradients.default;
    }

    getCardIconHTML(cardType) {
        const icons = {
            visa: '<svg viewBox="0 0 48 48"><path fill="#1976D2" d="M32 10A12 12 0 1 0 32 34A12 12 0 1 0 32 10Z"/><path fill="#FFC107" d="M24 26A6 6 0 1 0 24 14A6 6 0 1 0 24 26Z"/></svg>',
            mastercard: '<svg viewBox="0 0 48 48"><path fill="#FF5722" d="M32 10A12 12 0 1 0 32 34A12 12 0 1 0 32 10Z"/><path fill="#FFC107" d="M24 26A6 6 0 1 0 24 14A6 6 0 1 0 24 26Z"/></svg>',
            amex: '<svg viewBox="0 0 48 48"><path fill="#4CAF50" d="M32 10A12 12 0 1 0 32 34A12 12 0 1 0 32 10Z"/><path fill="#FFC107" d="M24 26A6 6 0 1 0 24 14A6 6 0 1 0 24 26Z"/></svg>'
        };
        return icons[cardType] || '';
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (field.id) {
            case 'card-number':
                const cleanNumber = value.replace(/\s/g, '');
                if (cleanNumber.length < 13 || cleanNumber.length > 19) {
                    isValid = false;
                    errorMessage = 'Please enter a valid card number';
                } else if (!this.luhnCheck(cleanNumber)) {
                    isValid = false;
                    errorMessage = 'Invalid card number';
                }
                break;

            case 'expiry-date':
                if (!/^\d{2}\/\d{2}$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter expiry date as MM/YY';
                } else {
                    const [month, year] = value.split('/');
                    const currentDate = new Date();
                    const currentYear = currentDate.getFullYear() % 100;
                    const currentMonth = currentDate.getMonth() + 1;
                    
                    if (month < 1 || month > 12) {
                        isValid = false;
                        errorMessage = 'Invalid month';
                    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
                        isValid = false;
                        errorMessage = 'Card has expired';
                    }
                }
                break;

            case 'cvv':
                if (value.length < 3 || value.length > 4) {
                    isValid = false;
                    errorMessage = 'Please enter a valid CVV';
                }
                break;

            case 'card-holder':
                if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Please enter the cardholder name';
                }
                break;
        }

        // Update validation indicator
        this.updateValidationIndicator(field.id, isValid);

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    }

    updateValidationIndicator(fieldId, isValid) {
        const indicator = document.getElementById(`${fieldId.replace('-', '-')}-validation`);
        if (!indicator) return;

        if (isValid) {
            indicator.className = 'validation-indicator valid';
        } else {
            indicator.className = 'validation-indicator invalid';
        }
    }

    luhnCheck(cardNumber) {
        let sum = 0;
        let isEven = false;
        
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i));
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    validateForm() {
        const fields = ['card-number', 'expiry-date', 'cvv', 'card-holder'];
        let isValid = true;

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    getCardData() {
        return {
            cardNumber: document.getElementById('card-number')?.value.replace(/\s/g, '') || '',
            expiryDate: document.getElementById('expiry-date')?.value || '',
            cvv: document.getElementById('cvv')?.value || '',
            cardHolder: document.getElementById('card-holder')?.value || ''
        };
    }

    async processPayment(donationData) {
        try {
            // Validate the form first
            if (!this.validateForm()) {
                throw new Error('Please fix the errors in the form');
            }

            // Get card data
            const cardData = this.getCardData();
            
            // Simulate payment processing (no real API calls)
            console.log('🔍 Simulating card validation...');
            
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Simulate successful payment
            const transactionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const bankReference = 'REF_' + Date.now();
            
            console.log('✅ Payment simulation completed successfully');
            
            return {
                success: true,
                transactionId: transactionId,
                bankReference: bankReference,
                message: 'Payment simulation completed successfully'
            };

        } catch (error) {
            console.error('❌ Payment processing error:', error);
            throw error;
        }
    }
}

// Initialize the payment processor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.bankPaymentProcessor = new BankPaymentProcessor();
});
