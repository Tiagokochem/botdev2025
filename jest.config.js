/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  collectCoverageFrom: ["lib/**/*.js", "*.js", "!jest.config.js"],
  coverageDirectory: "coverage",
  testMatch: ["**/*.test.js"],
};
