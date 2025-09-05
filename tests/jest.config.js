// Jest configuration for Nashr Foundation tests
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'tests/**/*.js',
    '!tests/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html']
};