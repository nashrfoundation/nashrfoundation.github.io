// EmailJS Setup Script for Nashr Foundation
// Run this in your browser console to configure EmailJS

(function() {
    console.log('🚀 Setting up EmailJS for Nashr Foundation...');
    
    // Your actual EmailJS credentials
    const EMAILJS_CONFIG = {
        serviceId: 'service_01wge0v',
        templateId: 'template_newsletter',
        publicKey: '8vdEHnT9o9ThMp3qc'
    };
    
    // Instructions
    console.log('');
    console.log('📧 EmailJS Setup Instructions:');
    console.log('1. Go to https://www.emailjs.com/');
    console.log('2. Create a free account');
    console.log('3. Create an email service (Gmail, Outlook, etc.)');
    console.log('4. Create an email template');
    console.log('5. Get your credentials from the dashboard');
    console.log('');
    console.log('🔧 Current Configuration:');
    console.log('Service ID:', EMAILJS_CONFIG.serviceId);
    console.log('Template ID:', EMAILJS_CONFIG.templateId);
    console.log('Public Key:', EMAILJS_CONFIG.publicKey);
    console.log('');
    
    // Configure EmailJS if available
    if (window.emailJSService) {
        try {
            window.emailJSService.configure(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.templateId,
                EMAILJS_CONFIG.publicKey
            );
            console.log('✅ EmailJS configured successfully!');
            
            // Test the service
            console.log('🧪 Testing EmailJS service...');
            window.emailJSService.testService().then(result => {
                if (result.success) {
                    console.log('✅ EmailJS test successful!');
                    console.log('🎉 Your email service is ready to use!');
                } else {
                    console.log('❌ EmailJS test failed:', result.message);
                    console.log('💡 Make sure to replace the demo credentials with your actual EmailJS credentials');
                }
            }).catch(error => {
                console.log('❌ EmailJS test error:', error.message);
                console.log('💡 Make sure to replace the demo credentials with your actual EmailJS credentials');
            });
            
        } catch (error) {
            console.error('❌ Failed to configure EmailJS:', error);
        }
    } else {
        console.log('⚠️ EmailJS service not loaded yet. Please refresh the page and try again.');
    }
    
    console.log('');
    console.log('📖 For detailed setup instructions, see EMAILJS_SETUP.md');
    console.log('🧪 To test: window.emailJSService.testService()');
    console.log('📧 To send email: window.emailJSService.sendEmail(to, subject, html, type)');
    
})();
