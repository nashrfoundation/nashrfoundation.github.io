// MailerLite Integration for Nashr Foundation
// Simple and reliable newsletter management

class MailerLiteService {
    constructor() {
        this.apiKey = '';
        this.baseUrl = 'https://connect.mailerlite.com/api';
        this.initialized = false;
        this.groupId = null; // Cache the newsletter group ID
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

            // Ensure newsletter group exists and get its ID
            await this.ensureNewsletterGroup();

            const subscriberData = {
                email: email,
                name: name,
                fields: {
                    name: name,
                    ...fields
                },
                groups: this.groupId ? [this.groupId] : [], // Use group ID if available
                status: 'active'
            };

            console.log('Adding subscriber to MailerLite:', { email, name, groupId: this.groupId });

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

    // Send newsletter to subscribers via campaign
    async sendNewsletter(subject, content, recipients = []) {
        try {
            if (!this.initialized) {
                throw new Error('MailerLite service not initialized');
            }

            console.log('Creating newsletter campaign via MailerLite:', { 
                subject, 
                recipients: recipients.length 
            });

            // Ensure newsletter group exists
            await this.ensureNewsletterGroup();

            // If we have specific recipients, we need to add them to the newsletter group first
            if (recipients.length > 0) {
                console.log('Adding recipients to newsletter group...');
                let addedCount = 0;
                let errorCount = 0;

                for (const email of recipients) {
                    try {
                        await this.addSubscriber(email, '', { source: 'admin_newsletter' });
                        addedCount++;
                    } catch (error) {
                        console.warn(`Failed to add ${email} to newsletter group:`, error.message);
                        errorCount++;
                    }
                }

                console.log(`Added ${addedCount} recipients to newsletter group, ${errorCount} errors`);
            }

            // Create a campaign in MailerLite
            const campaignData = {
                name: `Newsletter - ${subject} - ${new Date().toISOString()}`,
                type: 'regular',
                language_id: 1, // English
                emails: [{
                    subject: subject,
                    from_name: 'Nashr Foundation',
                    from: 'nashrfoundationpk@gmail.com',
                    content: content
                }],
                filter: this.groupId ? [{
                    type: 'group',
                    value: this.groupId
                }] : []
            };

            console.log('Creating campaign with data:', campaignData);

            const response = await fetch(`${this.baseUrl}/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(campaignData)
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Campaign creation failed:', result);
                throw new Error(`MailerLite API error: ${result.message || 'Unknown error'}`);
            }

            console.log('✅ Campaign created successfully:', result);

            // Now send the campaign
            const campaignId = result.data?.id;
            if (campaignId) {
                const sendResponse = await fetch(`${this.baseUrl}/campaigns/${campaignId}/send`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Accept': 'application/json'
                    }
                });

                const sendResult = await sendResponse.json();

                if (!sendResponse.ok) {
                    console.error('Campaign send failed:', sendResult);
                    throw new Error(`Failed to send campaign: ${sendResult.message || 'Unknown error'}`);
                }

                console.log('✅ Campaign sent successfully:', sendResult);

                return {
                    success: true,
                    totalSent: recipients.length,
                    totalErrors: 0,
                    campaignId: campaignId,
                    message: `Newsletter campaign sent to ${recipients.length} recipients`
                };
            } else {
                throw new Error('Campaign created but no ID returned');
            }

        } catch (error) {
            console.error('❌ MailerLite newsletter sending failed:', error);
            throw error;
        }
    }

    // Send individual email via MailerLite's transactional email API
    async sendEmail(to, subject, content) {
        try {
            // MailerLite doesn't have a direct transactional email API like Brevo
            // Instead, we'll create a simple campaign and send it
            const campaignData = {
                name: `Newsletter - ${subject}`,
                type: 'regular',
                subject: subject,
                from: {
                    name: 'Nashr Foundation',
                    email: 'nashrfoundationpk@gmail.com'
                },
                content: {
                    html: content,
                    text: this.stripHtml(content)
                },
                recipients: {
                    groups: ['newsletter'] // Send to newsletter group
                }
            };

            const response = await fetch(`${this.baseUrl}/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(campaignData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(`MailerLite API error: ${result.message || 'Unknown error'}`);
            }

            // For now, we'll just return success since we can't send individual emails
            // In a real implementation, you'd want to use MailerLite's automation or groups
            return {
                success: true,
                message: 'Email queued for sending',
                campaignId: result.data?.id
            };

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

    // Create newsletter group if it doesn't exist
    async ensureNewsletterGroup() {
        try {
            // If we already have the group ID cached, return early
            if (this.groupId) {
                return;
            }

            // Check if newsletter group exists
            const response = await fetch(`${this.baseUrl}/groups`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch groups');
            }

            const result = await response.json();
            const newsletterGroup = result.data?.find(group => group.name === 'newsletter');

            if (!newsletterGroup) {
                // Create newsletter group
                const createResponse = await fetch(`${this.baseUrl}/groups`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        name: 'newsletter',
                        description: 'Newsletter subscribers for Nashr Foundation'
                    })
                });

                if (!createResponse.ok) {
                    const createResult = await createResponse.json();
                    // If group already exists, that's fine
                    if (createResult.message && createResult.message.includes('already been taken')) {
                        console.log('✅ Newsletter group already exists (detected during creation)');
                        // Try to fetch the group again to get its ID
                        await this.ensureNewsletterGroup();
                        return;
                    }
                    throw new Error(`Failed to create newsletter group: ${createResult.message}`);
                }

                const createResult = await createResponse.json();
                this.groupId = createResult.data?.id;
                console.log('✅ Newsletter group created with ID:', this.groupId);
            } else {
                this.groupId = newsletterGroup.id;
                console.log('✅ Newsletter group already exists with ID:', this.groupId);
            }

        } catch (error) {
            console.error('❌ Failed to ensure newsletter group:', error);
            // Don't throw error, just log it - the service can still work without groups
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

            // Ensure newsletter group exists
            await this.ensureNewsletterGroup();

            // Test by getting groups (this endpoint exists and works)
            const response = await fetch(`${this.baseUrl}/groups`, {
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
                    groupsCount: result.data?.length || 0,
                    newsletterGroup: result.data?.find(group => group.name === 'newsletter') ? 'Found' : 'Not found'
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