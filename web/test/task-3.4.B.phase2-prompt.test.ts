import { phase2Prompt } from "../src/prompts/phase2";

describe("Task 3.4.B phase 2 system prompt", () => {
  test("covers required areas and references PRODUCT_SPEC.md", () => {
    expect(phase2Prompt).toMatch(/Architecture/i);
    expect(phase2Prompt).toMatch(/Tech Stack/i);
    expect(phase2Prompt).toMatch(/Data Model/i);
    expect(phase2Prompt).toContain("APIs/Interfaces");
    expect(phase2Prompt).toMatch(/Third-party Services/i);
    expect(phase2Prompt).toMatch(/Security/i);

    expect(phase2Prompt).toContain("PRODUCT_SPEC.md");
    expect(phase2Prompt).toMatch(/simple, proven technologies/i);
    expect(phase2Prompt).toMatch(/MVP/i);
  });
});
