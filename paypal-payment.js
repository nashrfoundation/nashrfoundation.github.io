// PayPal Payment Integration for Nashr Foundation
// This allows real money transfers without bank setup

class PayPalPaymentProcessor {
    constructor() {
        this.paypal = null;
        this.initializePayPal();
    }

    async initializePayPal() {
        try {
            // Initialize PayPal
            this.paypal = window.paypal;
            
            // Create PayPal buttons
            this.createPayPalButtons();
            
            console.log('✅ PayPal initialized successfully');
        } catch (error) {
            console.error('❌ PayPal initialization failed:', error);
        }
    }

    createPayPalButtons() {
        // Create PayPal button for each amount option
        const amountOptions = document.querySelectorAll('.amount-option');
        
        amountOptions.forEach(option => {
            const amount = option.dataset.amount;
            if (amount && amount !== 'custom') {
                this.createPayPalButton(option, parseInt(amount));
            }
        });
    }

    createPayPalButton(container, amount) {
        // Create PayPal button container
        const paypalContainer = document.createElement('div');
        paypalContainer.className = 'paypal-button-container';
        paypalContainer.id = `paypal-button-${amount}`;
        
        // Add PayPal button
        this.paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'pay'
            },
            
            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: (amount / 100).toFixed(2), // Convert to USD (PayPal requirement)
                            currency_code: 'USD'
                        },
                        description: `Donation to Nashr Foundation - PKR ${amount}`,
                        custom_id: `donation_${amount}_${Date.now()}`
                    }],
                    application_context: {
                        shipping_preference: 'NO_SHIPPING'
                    }
                });
            },
            
            onApprove: async (data, actions) => {
                try {
                    // Capture the order
                    const order = await actions.order.capture();
                    
                    // Process successful payment
                    await this.processSuccessfulPayment(order, amount);
                    
                } catch (error) {
                    console.error('Payment capture failed:', error);
                    this.showErrorMessage('Payment failed. Please try again.');
                }
            },
            
            onError: (err) => {
                console.error('PayPal error:', err);
                this.showErrorMessage('Payment error occurred. Please try again.');
            }
        }).render(`#paypal-button-${amount}`);
    }

    async processSuccessfulPayment(order, amount) {
        try {
            // Get donor information
            const donorName = document.getElementById('donor-name')?.value || 'Anonymous';
            const donorEmail = document.getElementById('donor-email')?.value || '';
            const donorPhone = document.getElementById('donor-phone')?.value || '';
            const countryCode = document.getElementById('country-code')?.value || '+92';
            const anonymous = document.getElementById('anonymous-donation')?.checked || false;
            const leaderboardConsent = document.getElementById('leaderboard-consent')?.checked || false;

            // Create donation data
            const donationData = {
                name: anonymous ? 'Anonymous' : donorName,
                email: donorEmail,
                phone: donorPhone ? (countryCode + donorPhone) : null,
                amount: amount,
                donationType: 'one-time',
                paymentMethod: 'paypal',
                transactionId: order.id,
                paypalOrderId: order.id,
                paymentStatus: 'completed',
                leaderboardConsent: !anonymous && leaderboardConsent,
                createdAt: new Date(),
                currency: 'PKR',
                paypalData: {
                    payerId: order.payer.payer_id,
                    payerEmail: order.payer.email_address,
                    paymentSource: order.payment_source
                }
            };

            // Save to Firebase
            await this.saveToFirebase(donationData);

            // Update leaderboard
            await this.updateLeaderboard(donationData);

            // Show success message
            this.showSuccessMessage(`🎉 Thank you! Your donation of PKR ${amount} has been processed successfully!`);

            // Reset form
            this.resetForm();

        } catch (error) {
            console.error('Error processing payment:', error);
            this.showErrorMessage('Payment processed but there was an error saving your donation. Please contact us.');
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

    resetForm() {
        const form = document.getElementById('donation-form');
        if (form) {
            form.reset();
            
            // Reset UI elements
            document.getElementById("custom-amount-container").style.display = 'none';
            document.getElementById("donation-amount-input").value = "2500";
            document.querySelector('.amount-option.active')?.classList.remove("active");
            document.querySelector('.amount-option[data-amount="2500"]')?.classList.add("active");
            document.getElementById("bank-card").checked = true;
            document.getElementById("leaderboard-consent").disabled = false;
        }
    }
}

// Initialize PayPal payment processor when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.paypalPaymentProcessor = new PayPalPaymentProcessor();
});
