import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@renderer/(.*)$": "<rootDir>/src/renderer/$1",
    "^@main/(.*)$": "<rootDir>/src/main/$1",
    "^@custom_dependencies/(.*)$": "<rootDir>/src/custom_dependencies/$1",
    "&@src/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/tst/**/*.test.ts"],
};

export default jestConfig;
