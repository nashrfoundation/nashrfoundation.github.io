# EmailJS Setup Guide for Nashr Foundation

## Why EmailJS?

EmailJS is a service that allows you to send emails directly from the browser without CORS issues. It's perfect for your use case because:

- ✅ **No CORS issues** - Works directly from the browser
- ✅ **Free tier available** - 200 emails/month free
- ✅ **Easy setup** - No server required
- ✅ **Reliable** - Designed for client-side email sending

## Setup Steps

### 1. Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Create Email Service

1. In your EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note down your **Service ID**

### 3. Create Email Template

1. Go to **Email Templates**
2. Click **Create New Template**
3. Use this template:

```html
Subject: {{subject}}

From: {{from_name}} <{{from_email}}>
To: {{to_name}} <{{to_email}}>

{{message}}
```

4. Note down your **Template ID**

### 4. Get Public Key

1. Go to **Account** → **General**
2. Copy your **Public Key**

### 5. Configure in Your Code

Add this to your admin panel or main site:

```javascript
// Configure EmailJS with your credentials
window.emailJSService.configure(
    'your_service_id',        // From step 2
    'your_template_id',       // From step 3
    'your_public_key'         // From step 4
);
```

### 6. Test the Setup

```javascript
// Test the email service
window.emailJSService.testService().then(result => {
    if (result.success) {
        console.log('✅ EmailJS is working!');
    } else {
        console.error('❌ EmailJS setup failed:', result.message);
    }
});
```

## Alternative: Quick Setup

If you want to get started quickly, you can use these demo credentials (they won't actually send emails, but will test the connection):

```javascript
window.emailJSService.configure(
    'service_demo',
    'template_demo',
    'demo_public_key'
);
```

## Troubleshooting

### Common Issues

1. **"EmailJS not loaded"**
   - Make sure the EmailJS script is loaded before your code runs
   - Check browser console for script loading errors

2. **"Service not found"**
   - Verify your Service ID is correct
   - Make sure the service is active in your EmailJS dashboard

3. **"Template not found"**
   - Verify your Template ID is correct
   - Make sure the template is published

4. **"Invalid public key"**
   - Verify your Public Key is correct
   - Make sure it's copied without extra spaces

### Testing

Use the test page at `/test-email.html` to verify your setup:

1. Open `/test-email.html` in your browser
2. Click "Test Email Service"
3. Check the console for any errors
4. Try sending a test email

## Benefits

- **No CORS issues** - Works directly from browser
- **No server required** - Everything runs client-side
- **Free tier** - 200 emails/month free
- **Reliable** - Designed for this exact use case
- **Easy integration** - Just a few lines of code

## Next Steps

Once EmailJS is configured:

1. **Test the setup** using the test page
2. **Update your admin panel** to use EmailJS
3. **Test newsletter sending** from the admin panel
4. **Test welcome emails** on the main site

Your email functionality should now work without any CORS issues! 🚀
