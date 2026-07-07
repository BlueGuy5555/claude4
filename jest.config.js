/**
 * Jest is configured to run against the *pure* TypeScript core of the app
 * (rep-counting engine, pose math, auto-detection, stats). These modules have
 * no React Native / Expo dependencies, so they run in a plain Node environment
 * and are fully deterministic and fast to test.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.core.json' }],
  },
  collectCoverageFrom: ['src/core/**/*.ts', 'src/data/aggregate.ts'],
};
