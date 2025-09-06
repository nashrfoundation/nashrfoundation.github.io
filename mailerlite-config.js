// MailerLite Configuration for Nashr Foundation
// Simple and reliable newsletter management

// Set your MailerLite API key here
// Get it from: https://dashboard.mailerlite.com/integrations/api
window.MAILERLITE_API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiZDY3ZWUzMDc3ZmExNmFhYWQzNmRkNWQ1YzczZTMwODNjYWNiOTgxM2FmMGFkYzZiNjI1OGI1MTc3NGI1ODc4NTZjMjgyYTg2MTc0MDFjYTkiLCJpYXQiOjE3NTcxNjk4NzYuMTQ0NjYzLCJuYmYiOjE3NTcxNjk4NzYuMTQ0NjY1LCJleHAiOjQ5MTI4NDM0NzYuMTM5MjUzLCJzdWIiOiIxNzk1NzYyIiwic2NvcGVzIjpbXX0.kjOuQ1CWWwEcsDCOcrUIv7EYYHpnURVgSh5GJYx5Im3TE1rT4uoEr7WgjFVmjOdGUECgTbKJ6UKPRFAq88GjBdCpkB_P2u7mO4zthZPhRM6Rf250eHNqEsJcBR-SFdBUV24YSlstDIXQb-G1h4XV2-hb8Y-6h31XwtG1ePJvzYAGAZbt0XRmkKsOjqUgAzjEhd5GflnefnnXIQZjeIO1ukHGnBK54rDwMH0Tsdp8P520Aiho69QbsGMPwxJQ5sRsplSWB1nc9EwsfVeBaMKknemzTv7jv_HdGr8ymv4PPrPCfuhZsOCs1VuWS9oZPUd9Gms2gqgJ2Of_lcO-dt7iaQzBhFB0mb3MfiX3YyyYw75L2OjAXCla41L9Fbm2sBqsry9tX7ZeyUfcAMEzsyPo-ypWDsNBNkfQnWkN-R2Gvay0aSxG_1JCjF1xOrOf0jtCfNj3_oeNPALKlvaCxu9V04jWxquExKnN9unERgqXK8eB7AzOiJGuuHHeiYtEQCNC5s5gehlS2-0sDiCYNlVNfuTEv7_Re8_shUtrhz1npVAknneRUa8Gt_5JXF4fYRlL-sd7CMcOIeVBKL4xCXBcA0PXAVoUqSqLccoXeY7j2CecZDa9qSDkKnEcjC6zkt1zu3iv4DR-vERLjO107jLsRIY6UhzWl9Rwyfe7EQDMdLI';

// Auto-initialize MailerLite service
document.addEventListener('DOMContentLoaded', function() {
    if (window.MAILERLITE_API_KEY && window.MAILERLITE_API_KEY !== 'YOUR_MAILERLITE_API_KEY_HERE') {
        window.mailerLiteService.initialize(window.MAILERLITE_API_KEY);
        console.log('✅ MailerLite service configured');
    } else {
        console.warn('⚠️ MailerLite not configured. Please set your API key in mailerlite-config.js');
    }
});

console.log('📧 MailerLite Configuration loaded');
