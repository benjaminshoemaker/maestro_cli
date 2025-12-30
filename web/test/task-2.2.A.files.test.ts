/**
 * @jest-environment node
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

function readTextFile(...pathParts: string[]) {
  return readFileSync(join(__dirname, "..", ...pathParts), "utf8");
}

describe("Task 2.2.A scaffolding", () => {
  it("exports a database connection utility", () => {
    const dbIndex = readTextFile("src", "db", "index.ts");
    expect(dbIndex).toMatch(/export const db/);
  });

  it("includes a drizzle-kit configuration file", () => {
    const drizzleConfig = readTextFile("drizzle.config.ts");
    expect(drizzleConfig).toMatch(/drizzle-kit/);
  });
});

