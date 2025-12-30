const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
};

module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();

  config.transformIgnorePatterns = [
    "^.+\\.module\\.(css|sass|scss)$",
  ];

  return config;
};
