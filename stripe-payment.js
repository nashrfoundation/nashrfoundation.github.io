// Payment Integration for Nashr Foundation
// Simple payment processing - no branding required!

class PaymentProcessor {
    constructor() {
        this.paymentLinks = {
            1000: 'https://buy.stripe.com/cNi9AV1MUfd3bAt7UsaEE01',
            2500: 'https://buy.stripe.com/cNi9AV1MUfd3bAt7UsaEE01', 
            5000: 'https://buy.stripe.com/cNi9AV1MUfd3bAt7UsaEE01',
            10000: 'https://buy.stripe.com/cNi9AV1MUfd3bAt7UsaEE01'
        };
        this.initializePaymentLinks();
        this.validatePaymentLinks();
    }

    initializePaymentLinks() {
        console.log('✅ Payment system initialized');
        // Setup real-time validation after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.setupRealTimeValidation();
        }, 100);
        
        // Test payment links in the background
        setTimeout(() => {
            this.testStripeLinks();
        }, 1000);
    }

    validatePaymentLinks() {
        console.log('🔍 Validating payment links...');
        Object.entries(this.paymentLinks).forEach(([amount, link]) => {
            if (!link || !link.startsWith('https://buy.stripe.com/')) {
                console.warn(`⚠️ Invalid payment link for amount ${amount}:`, link);
            } else {
                console.log(`✅ Payment link for ${amount}: ${link}`);
            }
        });
    }
    
    getClosestAmount(amount) {
        const availableAmounts = Object.keys(this.paymentLinks).map(Number).sort((a, b) => a - b);
        return availableAmounts.reduce((prev, curr) => 
            Math.abs(curr - amount) < Math.abs(prev - amount) ? curr : prev
        );
    }

    // Test method to verify Stripe links are working
    async testStripeLinks() {
        console.log('🧪 Testing Stripe payment links...');
        const testResults = {};
        
        for (const [amount, link] of Object.entries(this.paymentLinks)) {
            try {
                // Create a test link to check if it's accessible
                const response = await fetch(link, { method: 'HEAD', mode: 'no-cors' });
                testResults[amount] = { link, status: 'accessible' };
                console.log(`✅ Link for ${amount} is accessible`);
            } catch (error) {
                testResults[amount] = { link, status: 'error', error: error.message };
                console.warn(`⚠️ Link for ${amount} may have issues:`, error.message);
            }
        }
        
        return testResults;
    }

    // Robust redirection method with multiple fallbacks
    redirectToPayment(paymentLink) {
        console.log('🚀 Starting redirection process...');
        
        // Method 1: Try window.location.href (most common)
        try {
            console.log('📍 Method 1: Using window.location.href');
            window.location.href = paymentLink;
            return;
        } catch (error) {
            console.warn('⚠️ Method 1 failed:', error);
        }
        
        // Method 2: Try window.location.assign
        try {
            console.log('📍 Method 2: Using window.location.assign');
            window.location.assign(paymentLink);
            return;
        } catch (error) {
            console.warn('⚠️ Method 2 failed:', error);
        }
        
        // Method 3: Try window.open (for popup blockers)
        try {
            console.log('📍 Method 3: Using window.open');
            const newWindow = window.open(paymentLink, '_blank', 'noopener,noreferrer');
            if (newWindow) {
                console.log('✅ Opened in new window');
                return;
            }
        } catch (error) {
            console.warn('⚠️ Method 3 failed:', error);
        }
        
        // Method 4: Try creating a temporary link and clicking it
        try {
            console.log('📍 Method 4: Using temporary link');
            const tempLink = document.createElement('a');
            tempLink.href = paymentLink;
            tempLink.target = '_blank';
            tempLink.rel = 'noopener noreferrer';
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            console.log('✅ Clicked temporary link');
            return;
        } catch (error) {
            console.warn('⚠️ Method 4 failed:', error);
        }
        
        // Method 5: Try form submission
        try {
            console.log('📍 Method 5: Using form submission');
            const form = document.createElement('form');
            form.method = 'GET';
            form.action = paymentLink;
            form.target = '_blank';
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
            console.log('✅ Form submitted');
            return;
        } catch (error) {
            console.warn('⚠️ Method 5 failed:', error);
        }
        
        // If all methods fail, show error message
        console.error('❌ All redirection methods failed');
        this.showErrorMessage('Unable to redirect to payment page. Please try clicking this link: ' + paymentLink);
        
        // Show manual link as fallback
        this.showManualPaymentLink(paymentLink);
    }

    // Show manual payment link as fallback
    showManualPaymentLink(paymentLink) {
        const manualDiv = document.createElement('div');
        manualDiv.className = 'manual-payment-link';
        manualDiv.innerHTML = `
            <div style="background: linear-gradient(135deg, #4A90E2, #357ABD); color: white; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: center;">
                <h4>Manual Payment Link</h4>
                <p>If the automatic redirect didn't work, please click the link below:</p>
                <a href="${paymentLink}" target="_blank" rel="noopener noreferrer" 
                   style="color: white; text-decoration: underline; font-weight: bold; font-size: 1.1rem;">
                    Complete Payment Here
                </a>
            </div>
        `;
        
        const form = document.getElementById('donation-form');
        if (form) {
            form.insertBefore(manualDiv, form.firstChild);
        }
    }

    // Debug method for troubleshooting redirection issues
    debugRedirection(amount = 2500) {
        console.log('🔧 Debug Redirection Test');
        console.log('Amount:', amount);
        console.log('Payment Links:', this.paymentLinks);
        
        const paymentLink = this.paymentLinks[amount];
        console.log('Selected Link:', paymentLink);
        
        if (!paymentLink) {
            console.error('❌ No payment link found for amount:', amount);
            return;
        }
        
        // Test the link
        console.log('🧪 Testing link accessibility...');
        fetch(paymentLink, { method: 'HEAD', mode: 'no-cors' })
            .then(() => {
                console.log('✅ Link is accessible');
                console.log('🚀 Attempting redirection...');
                this.redirectToPayment(paymentLink);
            })
            .catch(error => {
                console.error('❌ Link test failed:', error);
                console.log('🔗 Manual link:', paymentLink);
            });
    }

    async processDonation(amount) {
        try {
            console.log('🚀 Starting donation process for amount:', amount);
            
            // Get donor information for tracking
            const donorName = document.getElementById('donor-name')?.value || 'Anonymous';
            const donorEmail = document.getElementById('donor-email')?.value || '';
            const donorPhone = document.getElementById('donor-phone')?.value || '';
            const countryCode = document.getElementById('country-code')?.value || '+92';
            const anonymous = document.getElementById('anonymous-donation')?.checked || false;
            const leaderboardConsent = document.getElementById('leaderboard-consent')?.checked || false;
            
            // Get payment link for amount
            let paymentLink = this.paymentLinks[amount];
            if (!paymentLink) {
                // Use closest amount or default to 2500
                const closestAmount = this.getClosestAmount(amount);
                paymentLink = this.paymentLinks[closestAmount];
                console.log(`💰 Using payment link for closest amount: ${closestAmount}`);
            }

            console.log('📝 Donor info:', { donorName, donorEmail, donorPhone, anonymous, leaderboardConsent });

            // Comprehensive validation before proceeding to Stripe
            const validationErrors = [];
            
            // Name validation (required unless anonymous)
            if (!anonymous && (!donorName || donorName.trim().length < 2)) {
                validationErrors.push('Name too short');
            }
            
            // Email validation (if provided)
            if (donorEmail && !this.isValidEmail(donorEmail)) {
                validationErrors.push('Invalid email');
            }
            
            // Phone validation (if provided)
            if (donorPhone && !this.isValidPhoneNumber(donorPhone, countryCode)) {
                validationErrors.push('Invalid phone');
            }
            
            // At least one contact method required
            if (!donorEmail && !donorPhone) {
                validationErrors.push('Contact info required');
            }
            
            // Amount validation
            if (!amount || amount <= 0) {
                validationErrors.push('Enter valid amount');
            } else if (amount < 100) {
                validationErrors.push('Min PKR 100');
            } else if (amount > 1000000) {
                validationErrors.push('Max PKR 1M');
            }
            
            // If there are validation errors, show them and stop
            if (validationErrors.length > 0) {
                console.log('❌ Validation failed:', validationErrors);
                this.showValidationErrors(validationErrors);
                return;
            }

            // Get the payment link for this amount
            let paymentLink = this.paymentLinks[amount];
            
            // Handle custom amounts by using the closest predefined amount
            if (!paymentLink) {
                console.log('❌ No payment link found for amount:', amount);
                
                // Find the closest predefined amount
                const predefinedAmounts = Object.keys(this.paymentLinks).map(Number).sort((a, b) => a - b);
                const closestAmount = predefinedAmounts.find(predefined => amount <= predefined) || predefinedAmounts[predefinedAmounts.length - 1];
                
                if (closestAmount) {
                    paymentLink = this.paymentLinks[closestAmount];
                    console.log(`🔄 Using closest payment link for amount ${closestAmount} instead of ${amount}`);
                } else {
                    this.showErrorMessage('Payment link not configured for this amount. Please contact us.');
                    return;
                }
            }

            console.log('🔗 Payment link:', paymentLink);

            // Store donor info in localStorage for after payment
            const donorData = {
                name: anonymous ? 'Anonymous' : donorName,
                email: donorEmail,
                phone: donorPhone ? (countryCode + donorPhone) : null,
                amount: amount,
                anonymous: anonymous,
                leaderboardConsent: !anonymous && leaderboardConsent,
                donationType: 'one-time',
                timestamp: Date.now()
            };
            
            localStorage.setItem('pendingDonation', JSON.stringify(donorData));
            console.log('💾 Donor data stored in localStorage');

            // Redirect to payment page
            console.log('🔄 Redirecting to payment page...');
            console.log('🔗 Payment link:', paymentLink);
            
            // Try multiple redirection methods for better compatibility
            this.redirectToPayment(paymentLink);

        } catch (error) {
            console.error('❌ Donation processing failed:', error);
            this.showErrorMessage('Unable to process donation. Please try again.');
        }
    }

    // Check for successful payment return
    checkPaymentReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment_status');
        const sessionId = urlParams.get('session_id');

        if (paymentStatus === 'paid' && sessionId) {
            // Payment was successful
            this.handleSuccessfulPayment(sessionId);
        } else if (paymentStatus === 'canceled') {
            // Payment was canceled
            this.showErrorMessage('Payment was canceled. You can try again anytime.');
        }
    }

    async handleSuccessfulPayment(sessionId) {
        try {
            // Get stored donor data
            const storedData = localStorage.getItem('pendingDonation');
            if (!storedData) {
                this.showSuccessMessage('🎉 Thank you! Your donation was successful!');
                return;
            }

            const donorData = JSON.parse(storedData);

            // Create donation record
            const donationData = {
                name: donorData.name,
                email: donorData.email,
                phone: donorData.phone,
                amount: donorData.amount,
                donationType: donorData.donationType,
                paymentMethod: 'secure',
                transactionId: sessionId,
                paymentStatus: 'completed',
                leaderboardConsent: donorData.leaderboardConsent,
                createdAt: new Date(),
                currency: 'PKR'
            };

            // Save to Firebase
            await this.saveToFirebase(donationData);

            // Update leaderboard
            await this.updateLeaderboard(donationData);

            // Show success message
            this.showSuccessMessage(`🎉 Thank you! Your donation of PKR ${donorData.amount} has been processed successfully!`);

            // Clear stored data
            localStorage.removeItem('pendingDonation');

            // Reset form
            this.resetForm();

        } catch (error) {
            console.error('Error handling successful payment:', error);
            this.showErrorMessage('Payment was successful but there was an error saving your donation. Please contact us.');
        }
    }

    async saveToFirebase(donationData) {
        try {
            // Import Firebase dynamically
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
            const { getFirestore, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

            const firebaseConfig = {
                apiKey: "AIzaSyBw9khGmocvn0bqGDOgumWDwUhQk1JuOMM",
                authDomain: "nashr-foundation-c3860.firebaseapp.com",
                projectId: "nashr-foundation-c3860",
                storageBucket: "nashr-foundation-c3860.firebasestorage.app",
                messagingSenderId: "76161626733",
                appId: "1:76161626733:web:cbc498485deaddd60bc564",
                measurementId: "G-Y0WSNQK3MW"
            };

            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);

            await addDoc(collection(db, "donations"), donationData);
            console.log('✅ Donation saved to Firebase');

        } catch (error) {
            console.error('❌ Firebase save error:', error);
            throw error;
        }
    }

    async updateLeaderboard(donationData) {
        try {
            if (donationData.leaderboardConsent) {
                // Update leaderboard in Supabase
                if (window.supabaseIntegration) {
                    await window.supabaseIntegration.addToLeaderboard({
                        name: donationData.name,
                        amount: donationData.amount
                    });
                }
                console.log('✅ Leaderboard updated');
            }
        } catch (error) {
            console.error('❌ Leaderboard update error:', error);
        }
    }

    showErrorMessage(message) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;

        const form = document.getElementById('donation-form');
        if (form) {
            form.insertBefore(errorDiv, form.firstChild);
        }

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 10000);
    }

    showSuccessMessage(message) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;

        const form = document.getElementById('donation-form');
        if (form) {
            form.insertBefore(successDiv, form.firstChild);
        }

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 10000);
    }

    // Validation helper methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }
    
    isValidPhoneNumber(phone, countryCode) {
        // Remove all non-digit characters
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Validation based on country code
        switch (countryCode) {
            case '+92': // Pakistan
                return cleanPhone.length >= 10 && cleanPhone.length <= 11 && cleanPhone.startsWith('3');
            case '+1': // USA/Canada
                return cleanPhone.length === 10;
            case '+44': // UK
                return cleanPhone.length >= 10 && cleanPhone.length <= 11;
            default:
                return cleanPhone.length >= 7 && cleanPhone.length <= 15;
        }
    }
    
    showValidationErrors(errors) {
        // Remove existing validation messages
        const existingMessages = document.querySelectorAll('.validation-message, .success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-errors';
        errorDiv.innerHTML = '<ul>' + 
            errors.map(error => `<li>${error}</li>`).join('') + 
            '</ul>';

        const form = document.getElementById('donation-form');
        if (form) {
            form.insertBefore(errorDiv, form.firstChild);
        }

        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 8000);
    }

    // Real-time validation for form fields
    setupRealTimeValidation() {
        const form = document.getElementById('donation-form');
        if (!form) return;

        const fields = {
            name: document.getElementById('donor-name'),
            email: document.getElementById('donor-email'),
            phone: document.getElementById('donor-phone'),
            amount: document.getElementById('donation-amount-input')
        };

        // Add real-time validation to each field
        Object.entries(fields).forEach(([fieldName, field]) => {
            if (!field) return;

            const formGroup = field.closest('.form-group');
            if (!formGroup) return;

            field.addEventListener('input', () => {
                this.validateField(fieldName, field, formGroup);
            });

            field.addEventListener('blur', () => {
                this.validateField(fieldName, field, formGroup);
            });
        });
    }

    validateField(fieldName, field, formGroup) {
        const value = field.value.trim();
        const countryCode = document.getElementById('country-code')?.value || '+92';
        let isValid = true;
        let message = '';

        // Remove existing validation classes
        formGroup.classList.remove('success', 'error', 'validating');
        field.classList.remove('success', 'error', 'validating');

        // Add validating class
        formGroup.classList.add('validating');
        field.classList.add('validating');

        // Validate based on field type
        switch (fieldName) {
            case 'name':
                if (value.length < 2) {
                    isValid = false;
                    message = 'Name too short';
                }
                break;
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    isValid = false;
                    message = 'Invalid email';
                }
                break;
            case 'phone':
                if (value && !this.isValidPhoneNumber(value, countryCode)) {
                    isValid = false;
                    message = 'Invalid phone';
                }
                break;
            case 'amount':
                const amount = parseInt(value);
                if (isNaN(amount) || amount < 100) {
                    isValid = false;
                    message = 'Min PKR 100';
                } else if (amount > 1000000) {
                    isValid = false;
                    message = 'Max PKR 1M';
                }
                break;
        }

        // Update field appearance after a short delay
        setTimeout(() => {
            formGroup.classList.remove('validating');
            field.classList.remove('validating');

            if (value && isValid) {
                formGroup.classList.add('success');
                field.classList.add('success');
            } else if (value && !isValid) {
                formGroup.classList.add('error');
                field.classList.add('error');
            }
        }, 500);
    }

    resetForm() {
        const form = document.getElementById('donation-form');
        if (form) {
            form.reset();
            
            // Reset UI elements
            document.getElementById("custom-amount-container").style.display = 'none';
            document.getElementById("donation-amount-input").value = "2500";
            document.querySelector('.amount-option.active')?.classList.remove("active");
            document.querySelector('.amount-option[data-amount="2500"]')?.classList.add("active");
            document.getElementById("leaderboard-consent").disabled = false;
        }
    }
}

// Initialize payment processor when page loads
if (document.readyState === 'loading') {
    // Document is still loading
    document.addEventListener('DOMContentLoaded', () => {
        window.stripePaymentProcessor = new PaymentProcessor();
        
        // Check for payment return
        window.stripePaymentProcessor.checkPaymentReturn();
        
        // Add event listeners for donation buttons
        setupDonationEventListeners();
        
        // Expose debug function globally
        window.debugStripeRedirection = (amount) => window.stripePaymentProcessor.debugRedirection(amount);
    });
} else {
    // Document is already loaded
    window.stripePaymentProcessor = new PaymentProcessor();
    
    // Check for payment return
    window.stripePaymentProcessor.checkPaymentReturn();
    
    // Add event listeners for donation buttons
    setupDonationEventListeners();
    
    // Expose debug function globally
    window.debugStripeRedirection = (amount) => window.stripePaymentProcessor.debugRedirection(amount);
}

function setupDonationEventListeners() {
    const amountOptions = document.querySelectorAll('.amount-option');
    amountOptions.forEach(option => {
        option.addEventListener('click', function() {
            const amount = parseInt(this.dataset.amount);
            if (amount && amount > 0) {
                // Update selected amount
                amountOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                // Update hidden input
                document.getElementById('donation-amount-input').value = amount;
            }
        });
    });
}

