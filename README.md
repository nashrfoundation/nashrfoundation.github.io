# Nashr Foundation Website

A modern, responsive charity website for Nashr Foundation - Empowering communities through essential support including education, food, clean water, and basic necessities.

## Table of Contents
- [About](#about)
- [Features](#features)
- [Installation](#installation)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Payment Processing](#payment-processing)
- [Testing](#testing)
- [Error Pages](#error-pages)
- [Contributing](#contributing)
- [Error Handling](#error-handling)
- [License](#license)

## About

Nashr Foundation is a non-profit organization established in 2025, dedicated to providing essential services to vulnerable communities across Pakistan. This website serves as the primary digital platform for raising awareness, accepting donations, and showcasing our impact.

## Features

- **Responsive Design**: Fully mobile-optimized experience
- **Single Payment Processing**: Support for Stripe payment processing
- **Real-time Leaderboard**: Shows top donors with live updates
- **Admin Dashboard**: Secure admin panel for managing donations and leaderboard
- **Performance Optimized**: PWA with service worker caching and lazy loading
- **Accessibility**: WCAG compliant with screen reader support
- **SEO Optimized**: Structured data, meta tags, and semantic HTML
- **Security**: Cookie consent, CSP headers, and secure payment processing

## Installation

### Prerequisites
- A modern web browser
- Node.js (for local development server)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/nashrfoundation/nashrfoundation.github.io.git
cd nashrfoundation.github.io
```

2. Install dependencies (optional, for local server):
```bash
npm install
```

3. Start local server:
```bash
npm start
```

4. Open your browser at `http://localhost:8080`

### Without Node.js

Simply open `index.html` directly in your browser for local testing.

## Deployment

This site is automatically deployed to GitHub Pages using GitHub Actions. Any changes pushed to the `main` branch will trigger a new deployment.

### Manual Deployment

1. Build the site:
```bash
# No build step required for static site
```

2. Deploy to GitHub Pages:
- Push to `main` branch
- Or use GitHub's manual deployment option

## Project Structure

```
nashrfoundation.github.io/
├── .github/workflows/
│   └── jekyll-gh-pages.yml   # GitHub Pages deployment workflow
├── admin/                    # Admin dashboard files
│   └── index.html
├── .well-known/              # Security and verification files
│   └── security.txt
├── assets/                   # Images and media
├── tests/                    # Automated tests and auditing tools
├── .github/                  # GitHub configuration
├── .gitignore                # Git ignored files
├── _headers                  # Custom headers for GitHub Pages
├── 404.html                  # Custom 404 error page
├── 500.html                  # Custom 500 error page
├── admin.html                # Admin dashboard
├── admin.js                  # Admin dashboard JavaScript
├── admin-styles.css          # Admin dashboard styles
├── donate.html               # Donation page
├── error-check.js            # Website error checking script
├── google369719e20100e006.html # Google Search Console verification
├── index.html                # Homepage
├── leaderboard.csv           # Fallback leaderboard data
├── leaderboard.js            # Leaderboard JavaScript
├── LICENSE                   # MIT License
├── loaderio-34d0cfab278669630330d0ad9ee1abdc.txt # Loader.io verification
├── manifest.json             # PWA manifest
├── package.json              # Project metadata
├── performance.js            # Performance optimization script
├── README.md                 # This file
├── robots.txt                # Search engine robots file
├── sitemap.xml               # XML sitemap
├── stripe-payment.js         # Stripe payment integration
├── styles.css                # Main stylesheet
├── supabase-config.js        # Supabase configuration
├── supabase-integration.js   # Supabase integration
└── sw.js                     # Service worker
```

## Technologies Used

- **HTML5**: Semantic markup and accessibility
- **CSS3**: Flexbox, Grid, Custom Properties, Animations
- **JavaScript (ES6+)**: Modern features and modules
- **Service Worker**: Offline support and caching
- **Supabase**: Real-time database for leaderboard
- **Firebase**: Donation data storage
- **Stripe**: Payment processing
- **Google Analytics**: Site analytics
- **GitHub Pages**: Hosting platform
- **GitHub Actions**: CI/CD deployment

## Payment Processing

The website currently uses Stripe for payment processing with pre-configured payment links for different donation amounts. All payment processing is handled securely through Stripe's platform.

### Supported Payment Methods
- Credit/Debit Cards (Visa, Mastercard, American Express)
- Other payment methods supported by Stripe

### Security
- All payment data is handled by Stripe
- No sensitive payment information is stored on our servers
- PCI compliant payment processing

## Testing

The website includes automated tests and auditing tools in the `tests/` directory.

### Accessibility Testing
Run the accessibility audit directly in the browser console:
```javascript
// Run the full accessibility audit
runAccessibilityAudit();
```

### Unit Testing
Run automated tests with:
```bash
cd tests
npm test
```

### Test Coverage
Generate test coverage reports with:
```bash
cd tests
npm run test:coverage
```

## Error Pages

The website includes custom error pages for common HTTP errors:

### 404 Page Not Found
- Located at `404.html`
- Provides a friendly error message with navigation back to the homepage

### 500 Server Error
- Located at `500.html`
- Provides a friendly error message with navigation back to the homepage

## Contributing

We welcome contributions to improve the Nashr Foundation website!

### How to Contribute

1. Fork the repository
2. Create a new branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m "Add feature"`
6. Push to the branch: `git push origin feature-name`
7. Create a pull request

### Guidelines

- Follow the existing code style
- Ensure all tests pass
- Update documentation as needed
- Write clear, descriptive commit messages
- Keep pull requests focused on a single feature or fix

### Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub with:
- A clear title and description
- Steps to reproduce (for bugs)
- Expected and actual behavior
- Screenshots if applicable

## Error Handling

### Common Issues and Solutions

1. **Payment Processing Failures**
   - Ensure all payment integrations are properly configured
   - Check network connectivity
   - Verify payment gateway status

2. **Leaderboard Not Loading**
   - Check Supabase connection
   - Verify leaderboard.csv fallback exists
   - Check browser console for errors

3. **Service Worker Issues**
   - Clear browser cache and refresh
   - Check browser compatibility
   - Verify sw.js file is accessible

4. **Form Validation Errors**
   - Ensure all required fields are filled
   - Check browser console for validation errors
   - Verify JavaScript is enabled

### Debugging Steps

1. **Check Browser Console**
   ```javascript
   // Open browser developer tools (F12)
   // Look for errors in Console tab
   ```

2. **Run Website Error Check**
   ```javascript
   // In browser console, run:
   window.websiteErrorCheck.run();
   ```

3. **Test Offline Functionality**
   - Enable offline mode in developer tools
   - Verify site loads from cache
   - Check service worker status

### Error Monitoring

Currently, errors are logged to the browser console. For production monitoring, consider implementing:
- Sentry for error tracking
- Custom error reporting endpoint
- Performance monitoring tools

### Fallbacks

- Leaderboard falls back to CSV if Supabase is unavailable
- Styles load asynchronously with noscript fallback
- Service worker provides offline access to cached pages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

© 2025 Nashr Foundation. All rights reserved.