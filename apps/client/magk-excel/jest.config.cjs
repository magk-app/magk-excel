module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/electron', '<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.[jt]s', '**/*.test.[jt]s'],
  transform: {
    '^.+\\.(js|ts)$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'ts'],
  collectCoverageFrom: [
    'electron/**/*.{js,ts}',
    'src/**/*.{js,ts}',
    '!electron/**/*.d.ts',
    '!src/**/*.d.ts',
  ],
  testTimeout: 15000,
};