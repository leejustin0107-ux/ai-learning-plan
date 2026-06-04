module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/app.js',
    '!src/migrations/**',
    '!src/config/**',
  ],
  coverageThreshold: {
    global: {
      statements: 40,
      lines: 40,
      branches: 10,
      functions: 20,
    },
  },
};