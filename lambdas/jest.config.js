/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["src/__tests__"],
  testMatch: ["**/*.[jt]s?(x)"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
