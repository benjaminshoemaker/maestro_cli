import { phase3Prompt } from "../src/prompts/phase3";

describe("Task 3.4.C phase 3 system prompt", () => {
  test("references prior docs and defines implementation plan constraints", () => {
    expect(phase3Prompt).toContain("PRODUCT_SPEC.md");
    expect(phase3Prompt).toContain("TECH_SPEC.md");
    expect(phase3Prompt).toMatch(/1-4 hours/i);
    expect(phase3Prompt).toMatch(/acceptance criteria/i);
    expect(phase3Prompt).toMatch(/dependencies/i);
    expect(phase3Prompt).toMatch(/TODO/i);
    expect(phase3Prompt).toMatch(/markdown/i);
    expect(phase3Prompt).toMatch(/AI coding agent/i);
  });
});

