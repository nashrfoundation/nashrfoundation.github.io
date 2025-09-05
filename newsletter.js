// Newsletter Signup Functionality for Nashr Foundation

document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.getElementById('newsletter-form');
    const newsletterMessage = document.getElementById('newsletter-message');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSignup);
    }
});

async function handleNewsletterSignup(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('newsletter-email');
    const consentCheckbox = document.getElementById('newsletter-consent');
    const submitButton = newsletterForm.querySelector('button[type="submit"]');
    
    // Get form values
    const email = emailInput.value.trim();
    const consent = consentCheckbox.checked;
    
    // Validate form
    if (!email) {
        showNewsletterMessage('Please enter your email address.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNewsletterMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    if (!consent) {
        showNewsletterMessage('Please agree to receive emails from us.', 'error');
        return;
    }
    
    // Disable submit button and show loading state
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Subscribing...';
    submitButton.disabled = true;
    
    try {
        // In a real implementation, this would send to your email service
        // For now, we'll simulate the process
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Show success message
        showNewsletterMessage('Thank you for subscribing! Please check your email to confirm your subscription.', 'success');
        
        // Reset form
        newsletterForm.reset();
        
        // Log subscription (in a real implementation, this would go to your backend)
        console.log('Newsletter subscription:', { email, consent });
        
        // In a real implementation, you would:
        // 1. Send the email to your email marketing service (Mailchimp, SendGrid, etc.)
        // 2. Store in your database
        // 3. Send confirmation email
        
    } catch (error) {
        console.error('Newsletter signup error:', error);
        showNewsletterMessage('Sorry, there was an error subscribing. Please try again.', 'error');
    } finally {
        // Re-enable submit button
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
}

function showNewsletterMessage(message, type) {
    const newsletterMessage = document.getElementById('newsletter-message');
    
    if (newsletterMessage) {
        newsletterMessage.textContent = message;
        newsletterMessage.className = `newsletter-message ${type}`;
        newsletterMessage.style.display = 'block';
        
        // Hide message after 5 seconds
        setTimeout(() => {
            newsletterMessage.style.display = 'none';
        }, 5000);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleNewsletterSignup,
        showNewsletterMessage,
        isValidEmail
    };
}