import { phase1Prompt } from "../src/prompts/phase1";

describe("Task 3.4.A phase 1 system prompt", () => {
  test("covers required areas and behaviors", () => {
    expect(phase1Prompt).toMatch(/Problem Statement/i);
    expect(phase1Prompt).toMatch(/Target User/i);
    expect(phase1Prompt).toMatch(/Core Value Proposition/i);
    expect(phase1Prompt).toMatch(/Key Features/i);
    expect(phase1Prompt).toMatch(/User Flows/i);
    expect(phase1Prompt).toMatch(/Success Metrics/i);

    expect(phase1Prompt).toMatch(/clarifying questions/i);
    expect(phase1Prompt).toMatch(/challenge vague/i);
    expect(phase1Prompt).toMatch(/PRODUCT_SPEC\.md/i);
  });
});

