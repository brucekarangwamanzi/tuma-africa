module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/node_modules/**',
    '!backend/coverage/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.js']
};