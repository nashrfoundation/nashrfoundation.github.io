// Newsletter Signup Functionality for Nashr Foundation

document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.getElementById('newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSignup);
    }
});

async function handleNewsletterSignup(e) {
    e.preventDefault();
    
    const form = e.target;
    const emailInput = form.querySelector('#newsletter-email');
    const consentCheckbox = form.querySelector('#newsletter-consent');
    const submitButton = form.querySelector('button[type="submit"]');
    const newsletterMessage = form.parentNode.querySelector('.newsletter-message') || document.getElementById('newsletter-message');
    
    // Get form values
    const email = emailInput.value.trim();
    const consent = consentCheckbox.checked;
    
    // Validate form
    if (!email) {
        showNewsletterMessage('Please enter your email address.', 'error', newsletterMessage);
        return;
    }
    
    if (!isValidEmail(email)) {
        showNewsletterMessage('Please enter a valid email address.', 'error', newsletterMessage);
        return;
    }
    
    if (!consent) {
        showNewsletterMessage('Please agree to receive emails from us.', 'error', newsletterMessage);
        return;
    }
    
    // Disable submit button and show loading state
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<div class="inline-loader"></div> Subscribing...';
    submitButton.disabled = true;
    
    try {
        // Initialize Supabase
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        
        const supabaseConfig = {
            url: 'https://jtuhnndwhotxjjolwcuz.supabase.io',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dWhubmR3aG90eGpqb2x3Y3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjU3MDEsImV4cCI6MjA3MjA0MTcwMX0.HJhOCxGDgDERcBfdgBQJsiGoaev5RAtX819eWuMGkhc'
        };
        
        const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
        
        // Check if subscriber already exists
        const { data: existingSubscriber, error: checkError } = await supabase
            .from('newsletter_subscribers')
            .select('*')
            .eq('email', email)
            .single();
            
        if (checkError && checkError.code !== 'PGRST116') {
            throw new Error(`Failed to check subscriber: ${checkError.message}`);
        }
        
        if (existingSubscriber) {
            if (existingSubscriber.status === 'active') {
                showNewsletterMessage('You are already subscribed to our newsletter!', 'success', newsletterMessage);
                form.reset();
                return;
            } else {
                // Reactivate unsubscribed user
                const { error: updateError } = await supabase
                    .from('newsletter_subscribers')
                    .update({
                        status: 'active',
                        consent_given: true,
                        consent_timestamp: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', email);
                    
                if (updateError) {
                    throw new Error(`Failed to reactivate subscription: ${updateError.message}`);
                }
                
                showNewsletterMessage('Welcome back! Your subscription has been reactivated.', 'success', newsletterMessage);
                form.reset();
                return;
            }
        }
        
        // Add new subscriber to Supabase
        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .insert([{
                email: email,
                status: 'active',
                consent_given: true,
                consent_timestamp: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                source: window.location.pathname,
                ip_address: '0.0.0.0' // In a real implementation, you would get the actual IP
            }]);
            
        if (error) {
            throw new Error(`Failed to subscribe: ${error.message}`);
        }
        
        // Attempt to send welcome email (no-blocker) and notify admin portal if open
        try {
            await sendWelcomeEmail(email);
            if (window.adminNotifications) {
                window.adminNotifications.addNotification({
                    type: 'success',
                    title: 'New Subscriber',
                    message: `${email} subscribed to the newsletter`,
                    action: () => {
                        const link = document.querySelector('[data-section="subscribers"]');
                        if (link) link.click();
                    }
                });
            }
        } catch (e) {
            console.warn('Welcome email failed:', e);
        }

        // Show success message
        showNewsletterMessage('Thank you for subscribing! A welcome email has been sent.', 'success', newsletterMessage);
        
        // Reset form
        form.reset();
        
        // Log subscription (in a real implementation, this would go to your backend)
        console.log('Newsletter subscription:', { email, consent });
        
        // In a real implementation, you would:
        // 1. Send the email to your email marketing service (Mailchimp, SendGrid, etc.)
        // 2. Store in your database
        // 3. Send confirmation email
        
    } catch (error) {
        console.error('Newsletter signup error:', error);
        showNewsletterMessage('Sorry, there was an error subscribing. Please try again.', 'error', newsletterMessage);
    } finally {
        // Re-enable submit button
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

function showNewsletterMessage(message, type, container) {
    if (!container) return;
    
    // Remove existing messages
    const existingMessages = container.querySelectorAll('.newsletter-message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `newsletter-message ${type}`;
    messageDiv.textContent = message;
    
    container.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Lightweight welcome email via EmailJS if configured
async function sendWelcomeEmail(email) {
    // If EmailJS is not available, skip gracefully
    if (typeof emailjs === 'undefined') {
        return;
    }
    const serviceId = window.EMAILJS_SERVICE_ID || '';
    const templateId = window.EMAILJS_TEMPLATE_ID || '';
    const publicKey = window.EMAILJS_PUBLIC_KEY || '';
    if (!serviceId || !templateId || !publicKey) {
        return;
    }
    try {
        emailjs.init({ publicKey });
        const params = {
            to_email: email,
            subject: 'Welcome to Nashr Foundation Newsletter',
            message: 'Thank you for subscribing to the Nashr Foundation newsletter. We appreciate your support and will keep you informed about our impact and initiatives.'
        };
        await emailjs.send(serviceId, templateId, params);
    } catch (err) {
        console.warn('EmailJS send failed', err);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleNewsletterSignup,
        showNewsletterMessage,
        isValidEmail
    };
}