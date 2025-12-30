/**
 * @jest-environment node
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

function readTextFile(...pathParts: string[]) {
  return readFileSync(join(__dirname, "..", ...pathParts), "utf8");
}

describe("Task 2.1.A scaffolding", () => {
  it("includes Tailwind directives in app/globals.css", () => {
    const globalsCss = readTextFile("app", "globals.css");
    expect(globalsCss).toContain("@tailwind base;");
    expect(globalsCss).toContain("@tailwind components;");
    expect(globalsCss).toContain("@tailwind utilities;");
  });

  it("has a root layout with basic HTML structure", () => {
    const layout = readTextFile("app", "layout.tsx");
    expect(layout).toMatch(/<html[^>]*lang=/);
    expect(layout).toMatch(/<body/);
  });
});

