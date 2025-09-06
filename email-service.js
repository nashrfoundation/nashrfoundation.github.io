// Email Service for Nashr Foundation
// This creates a simple email service using EmailJS as a fallback

class EmailService {
    constructor() {
        this.resendApiKey = null;
        this.fromEmail = null;
        this.emailjsConfig = null;
    }

    // Configure Resend API
    configureResend(apiKey, fromEmail) {
        this.resendApiKey = apiKey;
        this.fromEmail = fromEmail;
        console.log('✅ Resend API configured');
    }

    // Configure EmailJS as fallback
    configureEmailJS(serviceId, templateId, publicKey) {
        this.emailjsConfig = { serviceId, templateId, publicKey };
        console.log('✅ EmailJS configured as fallback');
    }

    // Send email with multiple fallback methods
    async sendEmail(to, subject, html, type = 'newsletter') {
        try {
            // Try EmailJS first (most reliable for browser)
            if (window.emailJSService) {
                return await window.emailJSService.sendEmail(to, subject, html, type);
            }
            
            // Fallback to Resend (if configured)
            if (this.resendApiKey) {
                return await this.sendViaResend(to, subject, html);
            }
            
            // Fallback to EmailJS config
            if (this.emailjsConfig) {
                return await this.sendViaEmailJS(to, subject, html, type);
            }
            
            throw new Error('No email service configured');
            
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    }

    // Send via Resend API (using serverless function to bypass CORS)
    async sendViaResend(to, subject, html) {
        // Use a serverless function to bypass CORS issues
        const serverlessUrl = 'https://nashrfoundation-email.vercel.app/api/send-email';
        
        try {
            console.log('Sending email via serverless function...');
            
            const response = await fetch(serverlessUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: Array.isArray(to) ? to : [to],
                    subject: subject,
                    html: html,
                    type: 'newsletter'
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(`Serverless function error: ${response.status} ${errorText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Unknown serverless function error');
            }
            
            console.log('Email sent successfully via serverless function');
            return result.data;
            
        } catch (error) {
            console.error('Serverless function failed, trying fallback...', error);
            
            // Fallback: Try direct Resend API with a simple CORS proxy
            const fallbackUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.resend.com/emails');
            
            const response = await fetch(fallbackUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: this.fromEmail,
                    to: Array.isArray(to) ? to : [to],
                    subject: subject,
                    html: html
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(`Resend API fallback error: ${response.status} ${errorText}`);
            }
            
            return await response.json();
        }
    }

    // Send via EmailJS (fallback)
    async sendViaEmailJS(to, subject, html, type) {
        if (typeof emailjs === 'undefined') {
            throw new Error('EmailJS not loaded');
        }

        const templateParams = {
            to_email: Array.isArray(to) ? to[0] : to,
            subject: subject,
            message: html,
            type: type
        };

        return await emailjs.send(
            this.emailjsConfig.serviceId,
            this.emailjsConfig.templateId,
            templateParams,
            this.emailjsConfig.publicKey
        );
    }

    // Test email service
    async testService() {
        try {
            await this.sendEmail('test@example.com', 'Test Email', '<p>This is a test email.</p>');
            return { success: true, message: 'Email service is working!' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Create global email service instance
window.emailService = new EmailService();

// Auto-configure with your Resend API key
window.emailService.configureResend(
    're_LPnRzAL8_CG6cby57HsRVguQGRYLgFCxE',
    'Nashr Foundation <no-reply@nashrfoundation.org>'
);

// Auto-configure EmailJS with your credentials
if (window.emailJSService) {
    window.emailJSService.configure(
        'service_01wge0v',
        'template_newsletter',
        '8vdEHnT9o9ThMp3qc'
    );
}

console.log('📧 Email Service initialized with Resend API');
