// Brevo (formerly Sendinblue) Integration for Nashr Foundation
// Handles newsletter subscription management

class BrevoService {
    constructor() {
        this.apiKey = '';
        this.listId = '';
        this.baseUrl = 'https://api.brevo.com/v3';
        this.initialized = false;
    }

    // Initialize Brevo service
    initialize(apiKey, listId) {
        this.apiKey = apiKey;
        this.listId = listId;
        this.initialized = true;
        console.log('✅ Brevo service initialized');
    }

    // Add subscriber to Brevo list
    async addSubscriber(email, name = '', attributes = {}) {
        try {
            if (!this.initialized) {
                throw new Error('Brevo service not initialized. Please provide API key and list ID.');
            }

            const subscriberData = {
                email: email,
                attributes: {
                    FIRSTNAME: name || '',
                    ...attributes
                },
                listIds: [parseInt(this.listId)],
                updateEnabled: true // Update existing subscriber if they exist
            };

            console.log('Adding subscriber to Brevo:', { email, name, listId: this.listId });

            const response = await fetch(`${this.baseUrl}/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.apiKey
                },
                body: JSON.stringify(subscriberData)
            });

            const result = await response.json();

            if (!response.ok) {
                // Handle specific Brevo errors
                if (response.status === 400 && result.code === 'duplicate_parameter') {
                    console.log('Subscriber already exists in Brevo, updating...');
                    return await this.updateSubscriber(email, name, attributes);
                }
                throw new Error(`Brevo API error: ${result.message || 'Unknown error'}`);
            }

            console.log('✅ Subscriber added to Brevo successfully:', result);
            return {
                success: true,
                data: result,
                message: 'Subscriber added successfully'
            };

        } catch (error) {
            console.error('❌ Brevo subscription failed:', error);
            throw error;
        }
    }

    // Update existing subscriber
    async updateSubscriber(email, name = '', attributes = {}) {
        try {
            const subscriberData = {
                attributes: {
                    FIRSTNAME: name || '',
                    ...attributes
                },
                listIds: [parseInt(this.listId)]
            };

            console.log('Updating subscriber in Brevo:', { email, name });

            const response = await fetch(`${this.baseUrl}/contacts/${email}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.apiKey
                },
                body: JSON.stringify(subscriberData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(`Brevo API error: ${result.message || 'Unknown error'}`);
            }

            console.log('✅ Subscriber updated in Brevo successfully:', result);
            return {
                success: true,
                data: result,
                message: 'Subscriber updated successfully'
            };

        } catch (error) {
            console.error('❌ Brevo update failed:', error);
            throw error;
        }
    }

    // Get subscriber information
    async getSubscriber(email) {
        try {
            const response = await fetch(`${this.baseUrl}/contacts/${email}`, {
                method: 'GET',
                headers: {
                    'api-key': this.apiKey
                }
            });

            if (response.status === 404) {
                return null; // Subscriber not found
            }

            if (!response.ok) {
                const result = await response.json();
                throw new Error(`Brevo API error: ${result.message || 'Unknown error'}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('❌ Brevo get subscriber failed:', error);
            throw error;
        }
    }

    // Remove subscriber from list
    async removeSubscriber(email) {
        try {
            const response = await fetch(`${this.baseUrl}/contacts/${email}`, {
                method: 'DELETE',
                headers: {
                    'api-key': this.apiKey
                }
            });

            if (!response.ok && response.status !== 404) {
                const result = await response.json();
                throw new Error(`Brevo API error: ${result.message || 'Unknown error'}`);
            }

            console.log('✅ Subscriber removed from Brevo successfully');
            return {
                success: true,
                message: 'Subscriber removed successfully'
            };

        } catch (error) {
            console.error('❌ Brevo removal failed:', error);
            throw error;
        }
    }

    // Get list information
    async getListInfo() {
        try {
            const response = await fetch(`${this.baseUrl}/contacts/lists/${this.listId}`, {
                method: 'GET',
                headers: {
                    'api-key': this.apiKey
                }
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(`Brevo API error: ${result.message || 'Unknown error'}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('❌ Brevo get list info failed:', error);
            throw error;
        }
    }

    // Test Brevo connection
    async testConnection() {
        try {
            if (!this.initialized) {
                return {
                    success: false,
                    message: 'Brevo service not initialized'
                };
            }

            // Test by getting list info
            const listInfo = await this.getListInfo();
            
            return {
                success: true,
                message: 'Brevo connection successful',
                data: {
                    listName: listInfo.name,
                    listId: this.listId,
                    subscriberCount: listInfo.uniqueSubscribers
                }
            };

        } catch (error) {
            return {
                success: false,
                message: `Brevo connection failed: ${error.message}`
            };
        }
    }
}

// Create global Brevo service instance
window.brevoService = new BrevoService();

// Auto-configure with your Brevo credentials
// SECURITY: API key should be set via environment variable or window.BREVO_API_KEY
// Never commit API keys to version control!
const defaultApiKey = process.env.BREVO_API_KEY || window.BREVO_API_KEY || 'YOUR_BREVO_API_KEY';
if (defaultApiKey !== 'YOUR_BREVO_API_KEY') {
    window.brevoService.initialize(defaultApiKey, '3');
}

console.log('📧 Brevo Service initialized');
console.log('💡 To configure: brevoService.initialize(apiKey, listId)');
console.log('💡 To test: brevoService.testConnection()');
