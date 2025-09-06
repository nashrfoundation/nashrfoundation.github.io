// Simple Email Service for Nashr Foundation
// Uses EmailJS for reliable email sending without CORS issues

class EmailService {
    constructor() {
        this.initialized = false;
    }

    // Send email via EmailJS
    async sendEmail(to, subject, html, type = 'newsletter') {
        try {
            if (!window.emailJSService) {
                throw new Error('EmailJS service not loaded. Please refresh the page.');
            }

            console.log(`Sending ${type} email to:`, to);
            
            const result = await window.emailJSService.sendEmail(to, subject, html, type);
            
            console.log('Email sent successfully:', result);
            return result;
            
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    }

    // Test email service
    async testService() {
        try {
            if (!window.emailJSService) {
                throw new Error('EmailJS service not loaded');
            }

            const result = await window.emailJSService.testService();
            return result;
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// Create global email service instance
window.emailService = new EmailService();

// Auto-configure EmailJS with your credentials
if (window.emailJSService) {
    window.emailJSService.configure(
        'service_01wge0v',
        'template_7pk902j',
        '8vdEHnT9o9ThMp3qc'
    );
}

console.log('📧 Email Service initialized with EmailJS');