// MailerLite Integration for Nashr Foundation
// Simple and reliable newsletter management

class MailerLiteService {
    constructor() {
        this.apiKey = '';
        this.baseUrl = 'https://connect.mailerlite.com/api';
        this.initialized = false;
    }

    // Initialize with API key
    initialize(apiKey) {
        this.apiKey = apiKey;
        this.initialized = true;
        console.log('✅ MailerLite service initialized');
    }

    // Add subscriber to MailerLite
    async addSubscriber(email, name = '', fields = {}) {
        try {
            if (!this.initialized) {
                throw new Error('MailerLite service not initialized');
            }

            const subscriberData = {
                email: email,
                name: name,
                fields: {
                    name: name,
                    ...fields
                },
                groups: ['newsletter'], // Add to newsletter group
                status: 'active'
            };

            console.log('Adding subscriber to MailerLite:', { email, name });

            const response = await fetch(`${this.baseUrl}/subscribers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(subscriberData)
            });

            const result = await response.json();

            if (!response.ok) {
                // Handle duplicate subscriber
                if (response.status === 400 && result.message && result.message.includes('already exists')) {
                    console.log('Subscriber already exists, updating...');
                    return await this.updateSubscriber(email, name, fields);
                }
                throw new Error(`MailerLite API error: ${result.message || 'Unknown error'}`);
            }

            console.log('✅ Subscriber added to MailerLite successfully:', result);
            return {
                success: true,
                data: result,
                message: 'Subscriber added successfully'
            };

        } catch (error) {
            console.error('❌ MailerLite subscription failed:', error);
            throw error;
        }
    }

    // Update existing subscriber
    async updateSubscriber(email, name = '', fields = {}) {
        try {
            const subscriberData = {
                name: name,
                fields: {
                    name: name,
                    ...fields
                }
            };

            console.log('Updating subscriber in MailerLite:', { email, name });

            const response = await fetch(`${this.baseUrl}/subscribers/${email}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(subscriberData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(`MailerLite API error: ${result.message || 'Unknown error'}`);
            }

            console.log('✅ Subscriber updated in MailerLite successfully:', result);
            return {
                success: true,
                data: result,
                message: 'Subscriber updated successfully'
            };

        } catch (error) {
            console.error('❌ MailerLite update failed:', error);
            throw error;
        }
    }

    // Get subscriber information
    async getSubscriber(email) {
        try {
            const response = await fetch(`${this.baseUrl}/subscribers/${email}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            if (response.status === 404) {
                return null; // Subscriber not found
            }

            if (!response.ok) {
                const result = await response.json();
                throw new Error(`MailerLite API error: ${result.message || 'Unknown error'}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('❌ MailerLite get subscriber failed:', error);
            throw error;
        }
    }

    // Send newsletter to subscribers
    async sendNewsletter(subject, content, recipients = []) {
        try {
            if (!this.initialized) {
                throw new Error('MailerLite service not initialized');
            }

            console.log('Sending newsletter via MailerLite:', { 
                subject, 
                recipients: recipients.length 
            });

            // For now, we'll send individual emails
            // In the future, you could use MailerLite's campaign API
            const results = [];
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < recipients.length; i++) {
                const recipient = recipients[i];
                
                try {
                    console.log(`Sending newsletter to ${recipient} (${i + 1}/${recipients.length})`);
                    
                    const result = await this.sendEmail(recipient, subject, content);
                    results.push({ recipient, success: true, result });
                    successCount++;
                    
                    // Small delay to avoid rate limits
                    if (i < recipients.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    
                } catch (error) {
                    console.error(`Failed to send to ${recipient}:`, error);
                    results.push({ recipient, success: false, error: error.message });
                    errorCount++;
                }
            }

            return {
                success: true,
                totalSent: successCount,
                totalErrors: errorCount,
                results: results,
                message: `Newsletter sent to ${successCount} recipients${errorCount > 0 ? `, ${errorCount} failed` : ''}`
            };

        } catch (error) {
            console.error('❌ MailerLite newsletter sending failed:', error);
            throw error;
        }
    }

    // Send individual email
    async sendEmail(to, subject, content) {
        try {
            const emailData = {
                to: to,
                subject: subject,
                html: content,
                text: this.stripHtml(content),
                from: {
                    email: 'nashrfoundationpk@gmail.com',
                    name: 'Nashr Foundation'
                }
            };

            const response = await fetch(`${this.baseUrl}/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(`MailerLite API error: ${result.message || 'Unknown error'}`);
            }

            return result;

        } catch (error) {
            console.error('❌ MailerLite email sending failed:', error);
            throw error;
        }
    }

    // Strip HTML tags for text content
    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // Test the service
    async testService() {
        try {
            if (!this.initialized) {
                return {
                    success: false,
                    message: 'Service not initialized'
                };
            }

            // Test by getting account info
            const response = await fetch(`${this.baseUrl}/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(`MailerLite API error: ${result.message || 'Unknown error'}`);
            }

            const result = await response.json();

            return {
                success: true,
                message: 'MailerLite service is working',
                data: {
                    account: result.data.name,
                    email: result.data.email
                }
            };

        } catch (error) {
            return {
                success: false,
                message: `Test failed: ${error.message}`
            };
        }
    }
}

// Create global instance
window.mailerLiteService = new MailerLiteService();

console.log('📧 MailerLite Service loaded');
