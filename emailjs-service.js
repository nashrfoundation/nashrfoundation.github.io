// EmailJS Service for Nashr Foundation
// This uses EmailJS which is designed to work from browsers without CORS issues

class EmailJSService {
    constructor() {
        this.serviceId = 'service_01wge0v';
        this.templateId = 'template_qcyrnos'; // default to current newsletter template
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

            // Validate configuration
            if (!this.serviceId || !this.templateId || !this.publicKey) {
                throw new Error('EmailJS not properly configured. Please check service ID, template ID, and public key.');
            }

            // Try multiple template parameter formats to ensure compatibility
            const recipientEmail = Array.isArray(to) ? to[0] : to;
            const defaultName = (typeof recipientEmail === 'string' && recipientEmail.includes('@'))
                ? recipientEmail.split('@')[0]
                : 'Friend';

            const templateParams = {
                // Standard EmailJS parameters
                to_email: recipientEmail,
                subject: subject,
                message: html,
                type: type,
                from_name: 'Nashr Foundation',
                to_name: defaultName,
                name: defaultName,
                
                // Alternative parameter names that might be expected
                to: recipientEmail,
                email: recipientEmail,
                content: html,
                body: html,
                html_content: html,
                recipient: recipientEmail,
                
                // Additional context
                organization: 'Nashr Foundation',
                website: 'https://nashrfoundation.github.io',
                logo_url: 'https://nashrfoundation.github.io/logo.png',
                timestamp: new Date().toISOString()
            };

            console.log('Sending email via EmailJS:', { 
                to: Array.isArray(to) ? to[0] : to, 
                subject, 
                type,
                serviceId: this.serviceId,
                templateId: this.templateId
            });

            const result = await emailjs.send(
                this.serviceId,
                this.templateId,
                templateParams
            );

            console.log('Email sent successfully via EmailJS:', result);
            return result;

        } catch (error) {
            console.error('EmailJS sending failed:', error);
            console.error('Error details:', {
                status: error.status,
                statusText: error.statusText,
                message: error.message,
                text: error.text,
                response: error.response
            });
            
            // Provide more specific error messages
            let errorMessage = 'EmailJS error: ';
            
            if (error.status === 400) {
                errorMessage += 'Bad request - check template parameters';
            } else if (error.status === 401) {
                errorMessage += 'Unauthorized - check public key';
            } else if (error.status === 404) {
                errorMessage += 'Service or template not found - check IDs';
            } else if (error.status === 403) {
                errorMessage += 'Forbidden - check service permissions';
            } else if (error.status === 429) {
                errorMessage += 'Rate limit exceeded - too many requests';
            } else if (error.text) {
                errorMessage += error.text;
            } else if (error.message) {
                errorMessage += error.message;
            } else if (error.response) {
                errorMessage += JSON.stringify(error.response);
            } else {
                errorMessage += `Unknown error (Status: ${error.status || 'N/A'})`;
            }
            
            throw new Error(errorMessage);
        }
    }

    // Test the service
    async testService() {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            // First check configuration
            const configCheck = this.checkConfiguration();
            if (!configCheck.valid) {
                return {
                    success: false,
                    message: `Configuration error: ${configCheck.message}`
                };
            }

            // Test with minimal parameters first
            console.log('Testing EmailJS with minimal parameters...');
            
            const minimalParams = {
                to_email: 'test@example.com',
                subject: 'Test Email',
                message: 'This is a test email.',
                from_name: 'Nashr Foundation'
            };

            // Try sending with minimal parameters first
            const result = await emailjs.send(
                this.serviceId,
                this.templateId,
                minimalParams
            );

            return {
                success: true,
                message: 'EmailJS service is working correctly!',
                result: result
            };

        } catch (error) {
            console.error('EmailJS test error details:', error);
            return {
                success: false,
                message: `EmailJS test failed: ${error.message || 'Unknown error'}`
            };
        }
    }

    // Check EmailJS configuration
    checkConfiguration() {
        const issues = [];
        
        if (!this.serviceId || this.serviceId === 'service_nashrfoundation') {
            issues.push('Service ID not configured or using placeholder');
        }
        
        if (!this.templateId || (this.templateId === 'template_newsletter' && this.templateId !== '__ejs-test-mail-service__' && this.templateId !== 'template_7pk902j')) {
            // Only flag as issue if it's the old placeholder, not the valid templates
            if (this.templateId === 'template_newsletter') {
                issues.push('Template ID using old placeholder - consider using template_7pk902j (Welcome) or __ejs-test-mail-service__');
            } else {
                issues.push('Template ID not configured');
            }
        }
        
        if (!this.publicKey || this.publicKey === 'your_emailjs_public_key') {
            issues.push('Public key not configured or using placeholder');
        }
        
        if (issues.length > 0) {
            return {
                valid: false,
                message: issues.join(', ')
            };
        }
        
        return {
            valid: true,
            message: 'Configuration looks good'
        };
    }

    // Configure EmailJS
    configure(serviceId, templateId, publicKey) {
        this.serviceId = serviceId;
        this.templateId = templateId;
        this.publicKey = publicKey;
        
        // Debug logging
        console.log('EmailJS configure called with:');
        console.log('  - serviceId:', serviceId);
        console.log('  - templateId:', templateId);
        console.log('  - publicKey:', publicKey ? 'provided' : 'not provided');
        
        console.log('EmailJS configured:');
        console.log('  - serviceId:', this.serviceId);
        console.log('  - templateId:', this.templateId);
        console.log('  - publicKey:', this.publicKey ? this.publicKey.substring(0, 10) + '...' : 'not set');
    }

    // Test different template IDs to find a working one
    async findWorkingTemplate() {
        const commonTemplateIds = [
            'template_7pk902j', // Welcome template
            '__ejs-test-mail-service__',
            'template_newsletter',
            'template_contact',
            'template_default',
            'template_1',
            'template_2',
            'template_3'
        ];

        for (const templateId of commonTemplateIds) {
            try {
                console.log(`Testing template: ${templateId}`);
                
                const result = await emailjs.send(
                    this.serviceId,
                    templateId,
                    {
                        to_email: 'test@example.com',
                        subject: 'Test',
                        message: 'Test message',
                        from_name: 'Nashr Foundation'
                    }
                );
                
                console.log(`✅ Template ${templateId} works!`);
                return {
                    success: true,
                    templateId: templateId,
                    result: result
                };
                
            } catch (error) {
                console.log(`❌ Template ${templateId} failed:`, error.message);
            }
        }
        
        return {
            success: false,
            message: 'No working template found'
        };
    }
}

// Create global email service instance
window.emailJSService = new EmailJSService();

// Auto-configure with actual EmailJS credentials
window.emailJSService.configure(
    'service_01wge0v',
    'template_qcyrnos', 
    '8vdEHnT9o9ThMp3qc'
);

console.log('📧 EmailJS Service initialized');
console.log('💡 To configure: emailJSService.configure(serviceId, templateId, publicKey)');
console.log('💡 To test: emailJSService.testService()');
