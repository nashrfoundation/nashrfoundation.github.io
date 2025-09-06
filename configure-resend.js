// Resend API Configuration Script for Nashr Foundation
// Run this in your browser console to automatically configure Resend

(function() {
    console.log('🚀 Configuring Resend API for Nashr Foundation...');
    
    // Your Resend API key
    const API_KEY = 're_LPnRzAL8_CG6cby57HsRVguQGRYLgFCxE';
    const FROM_EMAIL = 'Nashr Foundation <no-reply@nashrfoundation.org>';
    
    // Set global variables
    window.RESEND_API_KEY = API_KEY;
    window.FROM_EMAIL = FROM_EMAIL;
    
    // If on admin page, update the form fields
    if (document.getElementById('resend-api-key')) {
        document.getElementById('resend-api-key').value = API_KEY;
        document.getElementById('from-email').value = FROM_EMAIL;
        console.log('✅ Form fields updated');
    }
    
    console.log('✅ Resend API configured successfully!');
    console.log('📧 API Key:', API_KEY.substring(0, 10) + '...');
    console.log('📧 From Email:', FROM_EMAIL);
    console.log('');
    console.log('🎉 You can now:');
    console.log('   • Send newsletters from the admin panel');
    console.log('   • Welcome emails will be sent automatically');
    console.log('   • Test the configuration with testResendAPI()');
    console.log('');
    console.log('💡 To test: testResendAPI()');
    
    // Show success notification if available
    if (typeof showSuccess === 'function') {
        showSuccess('Resend API configured successfully!');
    }
})();
