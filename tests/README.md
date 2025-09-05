# Testing Suite for Nashr Foundation Website

This directory contains automated tests and auditing tools for the Nashr Foundation website.

## Table of Contents
- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Accessibility Audit](#accessibility-audit)
- [Contributing](#contributing)

## Overview

The testing suite includes:
- Unit tests for JavaScript functionality
- Accessibility audits
- End-to-end tests (planned)
- Performance tests (planned)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run tests:
```bash
npm test
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Types

### Accessibility Tests
Located in `accessibility.test.js`, these tests check:
- Proper alt text on images
- Correct heading hierarchy
- Skip navigation links
- Form accessibility
- ARIA attribute usage
- Keyboard navigation support

### Unit Tests
Planned for core JavaScript functionality including:
- Payment processing
- Form validation
- Data handling
- UI interactions

### End-to-End Tests
Planned using Puppeteer to test:
- User donation flow
- Navigation between pages
- Form submissions
- Error handling

## Accessibility Audit

The accessibility audit can be run directly in the browser console:

1. Open the website in your browser
2. Open developer tools (F12)
3. Go to the Console tab
4. Paste and run the following:

```javascript
// Run the full accessibility audit
runAccessibilityAudit();

// Or run specific checks
checkAltText();
checkHeadingHierarchy();
checkKeyboardNavigation();
```

### Audit Checks

The audit includes the following checks:
1. **Alt Text**: Verifies all images have descriptive alt text
2. **Heading Hierarchy**: Ensures proper heading structure (h1 → h2 → h3, etc.)
3. **Skip Navigation**: Checks for skip-to-content links
4. **Keyboard Navigation**: Verifies focus indicators on interactive elements
5. **ARIA Attributes**: Checks proper usage of accessibility attributes
6. **Form Accessibility**: Ensures form inputs have associated labels
7. **Color Contrast**: (Manual check recommended with external tools)

## Contributing

To add new tests:

1. Create a new test file in the `tests/` directory
2. Follow the naming convention: `[feature].test.js`
3. Write tests using Jest syntax
4. Run tests to ensure they pass
5. Submit a pull request

### Test Structure

```javascript
describe('Feature Name', () => {
    test('should do something', () => {
        // Arrange
        const input = 'test';
        
        // Act
        const result = someFunction(input);
        
        // Assert
        expect(result).toBe('expected');
    });
});
```