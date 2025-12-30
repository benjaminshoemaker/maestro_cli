import { phase1Prompt, phase2Prompt, phase3Prompt, phase4Prompt } from "../src/prompts";

describe("Task 3.4.D prompts index", () => {
  test("exports all phase prompts", () => {
    expect(typeof phase1Prompt).toBe("string");
    expect(typeof phase2Prompt).toBe("string");
    expect(typeof phase3Prompt).toBe("string");
    expect(typeof phase4Prompt).toBe("string");
  });
});

