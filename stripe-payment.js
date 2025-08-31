// Payment Integration for Nashr Foundation
// Simple payment processing - no branding required!

class PaymentProcessor {
    constructor() {
        this.paymentLinks = {
            1000: 'https://buy.stripe.com/test_cNi9AV1MUfd3bAt7UsaEE01',
            2500: 'https://buy.stripe.com/test_cNi9AV1MUfd3bAt7UsaEE01', 
            5000: 'https://buy.stripe.com/test_cNi9AV1MUfd3bAt7UsaEE01',
            10000: 'https://buy.stripe.com/test_cNi9AV1MUfd3bAt7UsaEE01'
        };
        this.initializePaymentLinks();
    }

    initializePaymentLinks() {
        console.log('✅ Payment system initialized');
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

            console.log('📝 Donor info:', { donorName, donorEmail, donorPhone, anonymous, leaderboardConsent });

            // Validate required fields
            if (!donorEmail && !donorPhone) {
                console.log('❌ Validation failed: No email or phone');
                this.showErrorMessage('Please provide either an email or phone number for payment confirmation.');
                return;
            }

            if (!amount || amount <= 0) {
                console.log('❌ Validation failed: Invalid amount');
                this.showErrorMessage('Please select a valid donation amount.');
                return;
            }

            // Get the payment link for this amount
            const paymentLink = this.paymentLinks[amount];
            
            if (!paymentLink) {
                console.log('❌ No payment link found for amount:', amount);
                this.showErrorMessage('Payment link not configured for this amount. Please contact us.');
                return;
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
            window.location.href = paymentLink;

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
document.addEventListener('DOMContentLoaded', () => {
    window.stripePaymentProcessor = new PaymentProcessor();
    
    // Check for payment return
    window.stripePaymentProcessor.checkPaymentReturn();
    
    // Add event listeners for donation buttons
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
});
