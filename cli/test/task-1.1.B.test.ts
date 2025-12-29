import { describe, expect, it } from "vitest";
import cliPackageJson from "../package.json";

describe("Task 1.1.B - CLI dependencies", () => {
  it("includes required runtime dependencies", () => {
    expect(Object.keys(cliPackageJson.dependencies ?? {})).toEqual(
      expect.arrayContaining([
        "commander",
        "express",
        "open",
        "chalk",
        "ora",
        "inquirer",
        "get-port",
        "node-fetch",
      ]),
    );
  });

  it("includes required dev dependencies", () => {
    expect(Object.keys(cliPackageJson.devDependencies ?? {})).toEqual(
      expect.arrayContaining(["typescript", "@types/node", "tsup"]),
    );
  });
});

