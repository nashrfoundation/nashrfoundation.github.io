// Brevo Newsletter Service for Admin Portal
// Handles sending newsletters via Brevo API

class BrevoNewsletterService {
    constructor() {
        this.apiKey = '';
        this.baseUrl = 'https://api.brevo.com/v3';
        this.initialized = false;
    }

    // Initialize with API key
    initialize(apiKey) {
        this.apiKey = apiKey;
        this.initialized = true;
        console.log('✅ Brevo Newsletter Service initialized');
    }

    // Send newsletter to multiple recipients
    async sendNewsletter(recipients, subject, content, options = {}) {
        try {
            if (!this.initialized) {
                throw new Error('Brevo Newsletter Service not initialized');
            }

            console.log('Sending newsletter via Brevo:', { 
                recipients: recipients.length, 
                subject,
                options 
            });

            // For now, we'll send individual emails via Brevo's transactional email API
            // In the future, you could use Brevo's campaign API for better newsletter management
            const results = [];
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < recipients.length; i++) {
                const recipient = recipients[i];
                
                try {
                    console.log(`Sending newsletter to ${recipient} (${i + 1}/${recipients.length})`);
                    
                    const result = await this.sendTransactionalEmail(recipient, subject, content, options);
                    results.push({ recipient, success: true, result });
                    successCount++;
                    
                    // Add small delay to avoid rate limits
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
            console.error('Brevo newsletter sending failed:', error);
            throw error;
        }
    }

    // Send transactional email via Brevo
    async sendTransactionalEmail(to, subject, content, options = {}) {
        try {
            const emailData = {
                sender: {
                    name: options.senderName || 'Nashr Foundation',
                    email: options.senderEmail || 'nashrfoundationpk@gmail.com'
                },
                to: [
                    {
                        email: to,
                        name: options.recipientName || ''
                    }
                ],
                subject: subject,
                htmlContent: content,
                textContent: this.stripHtml(content),
                headers: {
                    'X-Mailin-custom': 'newsletter',
                    'charset': 'iso-8859-1'
                }
            };

            const response = await fetch(`${this.baseUrl}/smtp/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.apiKey
                },
                body: JSON.stringify(emailData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(`Brevo API error: ${result.message || 'Unknown error'}`);
            }

            return result;

        } catch (error) {
            console.error('Brevo transactional email failed:', error);
            throw error;
        }
    }

    // Strip HTML tags for text content
    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // Get campaign statistics (if using Brevo campaigns)
    async getCampaignStats(campaignId) {
        try {
            const response = await fetch(`${this.baseUrl}/emailCampaigns/${campaignId}`, {
                method: 'GET',
                headers: {
                    'api-key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get campaign stats');
            }

            return await response.json();

        } catch (error) {
            console.error('Failed to get campaign stats:', error);
            throw error;
        }
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

            // Test by sending a test email
            const result = await this.sendTransactionalEmail(
                'test@example.com',
                'Brevo Newsletter Service Test',
                '<p>This is a test email from Brevo Newsletter Service.</p>',
                { senderName: 'Nashr Foundation Test' }
            );

            return {
                success: true,
                message: 'Brevo Newsletter Service is working',
                result: result
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
window.brevoNewsletterService = new BrevoNewsletterService();

// Auto-initialize with API key from window.BREVO_API_KEY
document.addEventListener('DOMContentLoaded', function() {
    if (window.BREVO_API_KEY) {
        window.brevoNewsletterService.initialize(window.BREVO_API_KEY);
    }
});

console.log('📧 Brevo Newsletter Service loaded');
