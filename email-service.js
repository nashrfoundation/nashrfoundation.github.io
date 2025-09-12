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

// EmailJS configuration is handled in emailjs-service.js
// No need to configure here since we're using MailerLite for newsletters

console.log('Email Service initialized with EmailJS');