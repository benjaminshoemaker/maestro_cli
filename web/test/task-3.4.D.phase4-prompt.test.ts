import { phase4Prompt } from "../src/prompts/phase4";

describe("Task 3.4.D phase 4 system prompt", () => {
  test("references prior docs and covers required policies", () => {
    expect(phase4Prompt).toContain("PRODUCT_SPEC.md");
    expect(phase4Prompt).toContain("TECH_SPEC.md");
    expect(phase4Prompt).toContain("IMPLEMENTATION_PLAN.md");

    expect(phase4Prompt).toMatch(/tech stack/i);
    expect(phase4Prompt).toMatch(/testing policy/i);
    expect(phase4Prompt).toMatch(/mocking policy/i);
    expect(phase4Prompt).toMatch(/error handling/i);
    expect(phase4Prompt).toMatch(/guardrails/i);
    expect(phase4Prompt).toContain("AGENTS.md");
  });
});
