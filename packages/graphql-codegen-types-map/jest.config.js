const config = {
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ['/**/*.test.(js|jsx|ts|tsx)'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '~/(.*)': '<rootDir>/src/$1',
  },
}

module.exports = {
  projects: [
    config,
    {
      ...config,
      runner: 'jest-runner-eslint',
      displayName: 'lint',
    },
  ],
}
