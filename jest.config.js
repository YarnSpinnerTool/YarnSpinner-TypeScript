/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  projects: [
    {
      // testPathIgnorePatterns: ["<rootDir>/**/node_modules"],
      preset: 'ts-jest',
      testEnvironment: 'node',
      displayName: "core",

      testMatch: ["<rootDir>/packages/core/tests/**/*.test.ts"],
      globals: {
        'ts-jest': {
          tsconfig: 'packages/core/tsconfig.json'
        }
      }
    },
  ],
};