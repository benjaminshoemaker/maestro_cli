import { buildPreviousDocsContext, estimateTokens } from "../src/lib/context";

describe("Task 3.3.A context utilities", () => {
  test("estimates tokens based on text length", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("1234")).toBe(1);
    expect(estimateTokens("12345")).toBe(2);
  });

  test("includes all previous docs when under token limit", () => {
    const result = buildPreviousDocsContext({
      currentPhase: 3,
      docs: [
        { phase: 1, document: "Doc one" },
        { phase: 2, document: "Doc two" },
      ],
      tokenLimit: 999,
    });

    expect(result.systemMessage).toContain("Doc one");
    expect(result.systemMessage).toContain("Doc two");
    expect(result.wasTruncated).toBe(false);
  });

  test("truncates older docs first and adds truncation note", () => {
    const result = buildPreviousDocsContext({
      currentPhase: 3,
      docs: [
        { phase: 1, document: `START-ONE ${"x".repeat(800)} END-ONE` },
        { phase: 2, document: `START-TWO ${"y".repeat(200)} END-TWO` },
      ],
      tokenLimit: 120,
    });

    expect(result.systemMessage).toContain("END-TWO");
    expect(result.systemMessage).toContain("END-ONE");
    expect(result.systemMessage).toContain("[Earlier content truncated for context]");
    expect(result.wasTruncated).toBe(true);
  });
});
