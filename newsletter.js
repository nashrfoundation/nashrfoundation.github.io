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
        // Check if MailerLite service is available
        if (!window.mailerLiteService || !window.mailerLiteService.initialized) {
            console.warn('MailerLite service not configured, falling back to local storage only');
            // Fallback to local storage or show error
            showNewsletterMessage('Newsletter service is temporarily unavailable. Please try again later.', 'error', newsletterMessage);
            return;
        }

        // Check if subscriber already exists in MailerLite
        let existingSubscriber = null;
        try {
            existingSubscriber = await window.mailerLiteService.getSubscriber(email);
        } catch (error) {
            console.log('Error checking existing subscriber:', error);
            // Continue with subscription process
        }

        if (existingSubscriber) {
            // Subscriber already exists in MailerLite
            showNewsletterMessage('✅ You\'re already part of our community! Thank you for being a valued subscriber. You\'ll continue to receive our updates.', 'success', newsletterMessage);
            form.reset();
            return;
        }

        // Add new subscriber to MailerLite
        const mailerLiteResult = await window.mailerLiteService.addSubscriber(email, name, {
            source: window.location.pathname,
            subscribed_at: new Date().toISOString(),
            consent: 'yes'
        });

        console.log('✅ Subscriber added to MailerLite:', mailerLiteResult);
        
        // Send welcome email via EmailJS (always attempt this)
        try {
            console.log('Sending welcome email via EmailJS to:', email);
            await sendWelcomeEmail(email, name);
            console.log('✅ Welcome email sent successfully to:', email);
        } catch (e) {
            console.error('❌ Welcome email failed:', e);
            // Do not block subscription on email failure, but log the error
            console.warn('Subscription successful but welcome email failed. User will still receive newsletters.');
        }
        
        // Notify admin portal if open
        if (window.adminNotifications) {
            window.adminNotifications.addNotification({
                type: 'success',
                title: 'New Subscriber',
                message: `${email} subscribed to the newsletter via MailerLite`,
                action: () => {
                    const link = document.querySelector('[data-section="subscribers"]');
                    if (link) link.click();
                }
            });
        }

        // Show success message
        showNewsletterMessage(`🎉 Welcome to our community! Thank you for subscribing to our newsletter. You'll receive updates about our impact and how your support makes a difference. Check your inbox for a welcome email!`, 'success', newsletterMessage);
        
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

// Send welcome email using EmailJS service with the configured template
async function sendWelcomeEmail(email, name) {
    try {
        console.log('Sending welcome email to:', email, 'Name:', name);
        
        // Use the configured EmailJS service
        if (window.emailService) {
            const subject = 'Welcome to Nashr Foundation Newsletter';
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <img src="https://nashrfoundation.github.io/logo.webp" alt="Nashr Foundation" style="height: 80px; width: auto;">
                    </div>
                    
                    <h2 style="color: #2A8D9C; text-align: center;">Welcome to Our Community!</h2>
                    
                    <p>Hi ${name || 'Friend'},</p>
                    
                    <p>Thank you for subscribing to the Nashr Foundation newsletter! We're thrilled to have you join our community of supporters who are making a real difference in the lives of vulnerable communities across Pakistan.</p>
                    
                    <p>Through our newsletter, you'll receive:</p>
                    <ul style="color: #666; line-height: 1.6;">
                        <li>Updates on our impact and achievements</li>
                        <li>Stories from the communities we serve</li>
                        <li>Information about upcoming initiatives</li>
                        <li>Ways you can get involved and help</li>
                    </ul>
                    
                    <p>Your support helps us provide:</p>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <div style="display: flex; justify-content: space-around; text-align: center; flex-wrap: wrap;">
                            <div style="margin: 10px;">
                                <strong style="color: #2A8D9C;">📚 Education</strong><br>
                                <small>School supplies and learning opportunities</small>
                            </div>
                            <div style="margin: 10px;">
                                <strong style="color: #2A8D9C;">🍽️ Food Security</strong><br>
                                <small>Nutritious meals for families</small>
                            </div>
                            <div style="margin: 10px;">
                                <strong style="color: #2A8D9C;">💧 Clean Water</strong><br>
                                <small>Safe drinking water access</small>
                            </div>
                            <div style="margin: 10px;">
                                <strong style="color: #2A8D9C;">🏠 Basic Needs</strong><br>
                                <small>Essential life supplies</small>
                            </div>
                        </div>
                    </div>
                    
                    <p>Together, we can create lasting change and build stronger communities. Thank you for being part of our mission!</p>
                    
                    <p>Best regards,<br>
                    <strong>The Nashr Foundation Team</strong></p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <div style="text-align: center; font-size: 12px; color: #999;">
                        <p>Nashr Foundation | Empowering Communities Through Essential Support</p>
                        <p>Email: <a href="mailto:nashrfoundationpk@gmail.com" style="color: #2A8D9C;">nashrfoundationpk@gmail.com</a></p>
                        <p>Website: <a href="https://nashrfoundation.github.io" style="color: #2A8D9C;">nashrfoundation.github.io</a></p>
                    </div>
                </div>
            `;
            
            const result = await window.emailService.sendEmail(email, subject, html, 'welcome');
            console.log('✅ Welcome email sent successfully to:', email, 'Result:', result);
            return result;
        }
        
        // Fallback: Direct EmailJS call if email service is not available
        if (typeof emailjs !== 'undefined' && window.emailJSService) {
            console.log('Using direct EmailJS fallback for welcome email');
            
            const result = await window.emailJSService.sendEmail(
                email,
                'Welcome to Nashr Foundation Newsletter',
                `
                    <p>Hi ${name || 'Friend'},</p>
                    <p>Thank you for subscribing to the Nashr Foundation newsletter. We appreciate your support and will keep you informed about our impact and initiatives.</p>
                    <p>Best regards,<br>The Nashr Foundation Team</p>
                `,
                'welcome'
            );
            
            console.log('✅ Welcome email sent via EmailJS fallback to:', email);
            return result;
        }
        
        throw new Error('No email service available');
        
    } catch (err) {
        console.error('❌ Failed to send welcome email to:', email, 'Error:', err);
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