module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/electron'],
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'ts'],
  collectCoverageFrom: [
    'electron/**/*.{js,ts}',
    '!electron/**/*.d.ts',
  ],
};