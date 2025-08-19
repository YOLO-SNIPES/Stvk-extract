/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  // Jest will look for test files in the tests/ directory
  // that end with .test.js
  testMatch: ['**/tests/**/*.test.js'],
};

export default config;
