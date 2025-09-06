# Brevo Integration Setup Guide

## 🔐 Security Notice
**NEVER commit API keys to version control!** This guide shows you how to securely configure Brevo integration.

## 🚀 Quick Setup

### 1. Local Development
The `brevo-secrets.js` file contains your API key for local development. This file is automatically ignored by git.

### 2. Production Deployment

#### Option A: GitHub Pages (Recommended)
Since GitHub Pages doesn't support server-side environment variables, you have two options:

1. **Manual Configuration**: Edit `brevo-config.js` and set your API key directly (only for production)
2. **Use GitHub Secrets**: Set up GitHub Actions to inject the API key during deployment

#### Option B: Manual Production Setup
1. Edit `brevo-config.js`
2. Replace `'YOUR_BREVO_API_KEY'` with your actual API key
3. Deploy to your hosting platform

## 🔧 Configuration Files

### `brevo-config.js` (Safe to commit)
- Contains configuration structure
- Uses environment variables or fallbacks
- Safe for version control

### `brevo-secrets.js` (Local only)
- Contains actual API keys
- Automatically ignored by git
- For local development only

## 📋 Your Current Configuration

- **API Key**: [Set in brevo-secrets.js for local development]
- **List ID**: `3`
- **List Name**: "nashr"

## 🧪 Testing

1. **Local Testing**: Use `test-brevo-integration.html`
2. **Production Testing**: Subscribe to newsletter on your live site
3. **Verify**: Check Brevo dashboard for new subscribers

## 🚨 Important Security Notes

1. **Never commit API keys** to version control
2. **Use environment variables** in production
3. **Rotate API keys** regularly
4. **Monitor API usage** in Brevo dashboard

## 🔄 Deployment Steps

1. **Remove API key** from committed files
2. **Set up environment variable** or manual configuration
3. **Test the integration** before going live
4. **Monitor logs** for any issues

## 📞 Support

If you need help with the integration:
1. Check the browser console for errors
2. Use the test page to debug issues
3. Verify your Brevo credentials are correct
4. Check Brevo dashboard for API usage limits
