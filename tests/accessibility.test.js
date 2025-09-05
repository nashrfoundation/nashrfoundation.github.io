// Mock DOM for testing
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

// Import the accessibility audit functions
const {
    checkAltText,
    checkHeadingHierarchy,
    checkKeyboardNavigation,
    checkARIA,
    checkFormAccessibility,
    checkSkipNavigation
} = require('../tests/accessibility-audit.js');

// Mock console methods to capture output
const originalConsole = { ...console };
const mockConsole = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

describe('Accessibility Audit', () => {
    beforeEach(() => {
        // Mock console
        global.console = mockConsole;
    });

    afterEach(() => {
        // Restore console
        global.console = originalConsole;
        jest.clearAllMocks();
    });

    test('should detect images with missing alt text', () => {
        // Create a simple DOM with an image missing alt text
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <img src="test.jpg">
                <img src="test2.jpg" alt="">
                <img src="test3.jpg" alt="Proper alt text">
            </body>
            </html>
        `);

        global.document = dom.window.document;
        global.window = dom.window;

        const result = checkAltText();
        expect(result).toBe(false);
        expect(mockConsole.warn).toHaveBeenCalledWith(
            expect.stringContaining('Images missing alt text')
        );
    });

    test('should pass when all images have alt text', () => {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <img src="test.jpg" alt="Test image">
                <img src="test2.jpg" alt="Another test image">
            </body>
            </html>
        `);

        global.document = dom.window.document;
        global.window = dom.window;

        const result = checkAltText();
        expect(result).toBe(true);
        expect(mockConsole.log).toHaveBeenCalledWith(
            expect.stringContaining('All images have alt text')
        );
    });

    test('should detect heading hierarchy issues', () => {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <h1>Main Heading</h1>
                <h3>Subsection</h3> <!-- Skipped h2 -->
                <h4>Sub-subsection</h4>
            </body>
            </html>
        `);

        global.document = dom.window.document;
        global.window = dom.window;

        const result = checkHeadingHierarchy();
        expect(result).toBe(false);
        expect(mockConsole.warn).toHaveBeenCalledWith(
            expect.stringContaining('Skipped heading level')
        );
    });

    test('should pass with proper heading hierarchy', () => {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <h1>Main Heading</h1>
                <h2>Section</h2>
                <h3>Subsection</h3>
                <h4>Sub-subsection</h4>
            </body>
            </html>
        `);

        global.document = dom.window.document;
        global.window = dom.window;

        const result = checkHeadingHierarchy();
        expect(result).toBe(true);
        expect(mockConsole.log).toHaveBeenCalledWith(
            expect.stringContaining('Proper heading hierarchy')
        );
    });

    test('should detect missing skip navigation link', () => {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <header>Header</header>
                <main>Main Content</main>
            </body>
            </html>
        `);

        global.document = dom.window.document;
        global.window = dom.window;

        const result = checkSkipNavigation();
        expect(result).toBe(false);
        expect(mockConsole.warn).toHaveBeenCalledWith(
            expect.stringContaining('Skip navigation link not found')
        );
    });

    test('should pass with skip navigation link', () => {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <a href="#main-content" class="skip-link">Skip to main content</a>
                <header>Header</header>
                <main id="main-content">Main Content</main>
            </body>
            </html>
        `);

        global.document = dom.window.document;
        global.window = dom.window;

        const result = checkSkipNavigation();
        expect(result).toBe(true);
        expect(mockConsole.log).toHaveBeenCalledWith(
            expect.stringContaining('Skip navigation link found')
        );
    });
});