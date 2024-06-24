/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  projects: [
    {
      // testPathIgnorePatterns: ["<rootDir>/**/node_modules"],
      preset: 'ts-jest',
      testEnvironment: 'node',
      preset: "ts-jest",
      displayName: "yarnspinner-web-runner",

      testMatch: ["<rootDir>/packages/yarnspinner-web-runner/tests/**/*.test.ts"],
      globals: {
        'ts-jest': {
          tsconfig: 'packages/yarnspinner-web-runner/tsconfig.json'
        }
      }
    },
  ],
};