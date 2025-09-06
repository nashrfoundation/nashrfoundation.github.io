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
    const nameInput = form.querySelector('#newsletter-name');
    const consentCheckbox = form.querySelector('#newsletter-consent');
    const submitButton = form.querySelector('button[type="submit"]');
    const newsletterMessage = form.parentNode.querySelector('.newsletter-message') || document.getElementById('newsletter-message');
    
    // Get form values
    const email = emailInput.value.trim();
    const name = nameInput ? nameInput.value.trim() : '';
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
        
        const globalCfg = (typeof window !== 'undefined' && window.SUPABASE_CONFIG) ? window.SUPABASE_CONFIG : null;
        const supabaseConfig = {
            url: globalCfg?.url || 'https://jtuhnndwhotxjjolwcuz.supabase.co',
            anonKey: globalCfg?.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dWhubmR3aG90eGpqb2x3Y3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjU3MDEsImV4cCI6MjA3MjA0MTcwMX0.HJhOCxGDgDERcBfdgBQJsiGoaev5RAtX819eWuMGkhc'
        };
        
        const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
            auth: {
                storageKey: 'nf_newsletter',
                persistSession: false,
                autoRefreshToken: false
            }
        });
        
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
                showNewsletterMessage('✅ You\'re already part of our community! Thank you for being a valued subscriber. You\'ll continue to receive our updates.', 'success', newsletterMessage);
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
                        updated_at: new Date().toISOString(),
                        name: name || existingSubscriber.name || null
                    })
                    .eq('email', email);
                    
                if (updateError) {
                    throw new Error(`Failed to reactivate subscription: ${updateError.message}`);
                }
                
                showNewsletterMessage('🎉 Welcome back! We\'re thrilled to have you back in our community. Your subscription has been reactivated and you\'ll start receiving our updates again.', 'success', newsletterMessage);
                form.reset();
                return;
            }
        }
        
        // Add new subscriber to Supabase
        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .insert([{
                email: email,
                name: name || null,
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
        
        // Attempt to send welcome email via Resend-backed function and notify admin portal if open
        try {
            const endpoint = (window.RESEND_FUNCTION_URL || '').trim();
            if (endpoint) {
                console.log('Attempting to send welcome email to:', email);
                await sendWelcomeEmail(email, name);
                console.log('Welcome email sent successfully to:', email);
            } else {
                console.warn('No email service configured. Welcome email will not be sent.');
            }
            
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
            console.error('Welcome email failed:', e);
            // Do not block subscription on email failure, but log the error
            console.warn('Subscription successful but welcome email failed. User will still receive newsletters.');
        }

        // Show success message
        const welcomeEmailText = endpoint ? 'Check your inbox for a welcome email!' : 'You\'ll receive our updates soon!';
        showNewsletterMessage(`🎉 Welcome to our community! Thank you for subscribing to our newsletter. You'll receive updates about our impact and how your support makes a difference. ${welcomeEmailText}`, 'success', newsletterMessage);
        
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
    // Find the newsletter message container
    const messageContainer = document.getElementById('newsletter-message');
    if (!messageContainer) return;
    
    // Clear existing content and classes
    messageContainer.innerHTML = message;
    messageContainer.className = `newsletter-message ${type}`;
    
    // Show the message with animation
    setTimeout(() => {
        messageContainer.classList.add('show');
    }, 100);
    
    // Auto-remove after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            messageContainer.classList.remove('show');
            setTimeout(() => {
                messageContainer.innerHTML = '';
                messageContainer.className = 'newsletter-message';
            }, 300);
        }, 5000);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Lightweight welcome email via Resend HTTP function if configured; falls back to EmailJS if present
async function sendWelcomeEmail(email, name) {
    try {
        const endpoint = (window.RESEND_FUNCTION_URL || '').trim();
        if (endpoint) {
            // Check if it's a Supabase Edge Function and add authentication headers
            const isSupabaseFunction = endpoint.includes('supabase.co/functions/v1/');
            let headers = { 'Content-Type': 'application/json' };
            
            if (isSupabaseFunction) {
                // Get Supabase client and session
                const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
                const supabase = createClient(
                    'https://jtuhnndwhotxjjolwcuz.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dWhubmR3aG90eGpqb2x3Y3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjU3MDEsImV4cCI6MjA3MjA0MTcwMX0.HJhOCxGDgDERcBfdgBQJsiGoaev5RAtX819eWuMGkhc'
                );
                
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    headers['Authorization'] = `Bearer ${session.access_token}`;
                    console.log('Using Supabase session token for welcome email');
                } else {
                    console.warn('No Supabase session found for welcome email, using API key only');
                }
                // Also add the API key as fallback
                headers['apikey'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dWhubmR3aG90eGpqb2x3Y3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjU3MDEsImV4cCI6MjA3MjA0MTcwMX0.HJhOCxGDgDERcBfdgBQJsiGoaev5RAtX819eWuMGkhc';
            }
            
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    type: 'welcome',
                    to: email,
                    name: name || 'Friend'
                })
            });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`Welcome email failed: ${res.status} ${text}`);
            }
            console.log('Welcome email sent successfully to:', email);
            return;
        }
        // Optional fallback to EmailJS if configured on window
        if (typeof emailjs !== 'undefined') {
            const serviceId = window.EMAILJS_SERVICE_ID || '';
            const templateId = window.EMAILJS_TEMPLATE_ID || '';
            const publicKey = window.EMAILJS_PUBLIC_KEY || '';
            if (serviceId && templateId && publicKey) {
                emailjs.init({ publicKey });
                const params = {
                    to_email: email,
                    to_name: name || 'Friend',
                    subject: 'Welcome to Nashr Foundation Newsletter',
                    message: 'Thank you for subscribing to the Nashr Foundation newsletter. We appreciate your support and will keep you informed about our impact and initiatives.'
                };
                await emailjs.send(serviceId, templateId, params);
            }
        }
    } catch (err) {
        throw err;
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