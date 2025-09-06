// EmailJS Service for Nashr Foundation
// This uses EmailJS which is designed to work from browsers without CORS issues

class EmailJSService {
    constructor() {
        this.serviceId = 'service_01wge0v';
        this.templateId = 'template_newsletter';
        this.publicKey = '8vdEHnT9o9ThMp3qc';
        this.initialized = false;
    }

    // Initialize EmailJS
    async initialize() {
        try {
            if (typeof emailjs === 'undefined') {
                // Load EmailJS if not already loaded
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
                script.onload = () => {
                    this.setupEmailJS();
                };
                document.head.appendChild(script);
            } else {
                this.setupEmailJS();
            }
        } catch (error) {
            console.error('Failed to initialize EmailJS:', error);
            throw error;
        }
    }

    setupEmailJS() {
        try {
            emailjs.init(this.publicKey);
            this.initialized = true;
            console.log('✅ EmailJS initialized successfully');
        } catch (error) {
            console.error('Failed to setup EmailJS:', error);
            throw error;
        }
    }

    // Send email via EmailJS
    async sendEmail(to, subject, html, type = 'newsletter') {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const templateParams = {
                to_email: Array.isArray(to) ? to[0] : to,
                subject: subject,
                message: html,
                type: type,
                from_name: 'Nashr Foundation',
                to_name: 'Friend'
            };

            console.log('Sending email via EmailJS:', { to, subject, type });

            const result = await emailjs.send(
                this.serviceId,
                this.templateId,
                templateParams
            );

            console.log('Email sent successfully via EmailJS:', result);
            return result;

        } catch (error) {
            console.error('EmailJS sending failed:', error);
            throw new Error(`EmailJS error: ${error.message}`);
        }
    }

    // Test the service
    async testService() {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const result = await this.sendEmail(
                'test@example.com',
                'Test Email from Nashr Foundation',
                '<p>This is a test email to verify EmailJS configuration.</p>',
                'test'
            );

            return {
                success: true,
                message: 'EmailJS service is working correctly!',
                result: result
            };

        } catch (error) {
            return {
                success: false,
                message: `EmailJS test failed: ${error.message}`
            };
        }
    }

    // Configure EmailJS
    configure(serviceId, templateId, publicKey) {
        this.serviceId = serviceId;
        this.templateId = templateId;
        this.publicKey = publicKey;
        console.log('EmailJS configured:', { serviceId, templateId, publicKey: publicKey.substring(0, 10) + '...' });
    }
}

// Create global email service instance
window.emailJSService = new EmailJSService();

// Auto-configure with default values (you'll need to replace these with your actual EmailJS credentials)
window.emailJSService.configure(
    'service_nashrfoundation',
    'template_newsletter', 
    'your_emailjs_public_key'
);

console.log('📧 EmailJS Service initialized');
console.log('💡 To configure: emailJSService.configure(serviceId, templateId, publicKey)');
console.log('💡 To test: emailJSService.testService()');
