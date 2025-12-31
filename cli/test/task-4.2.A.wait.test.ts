import { describe, expect, it, vi, beforeEach } from "vitest";

describe("Task 4.2.A wait for document", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("retries after timeout when user presses Enter", async () => {
    const prompt = vi.fn(async () => ({ retry: "" }));
    vi.doMock("inquirer", () => ({ default: { prompt } }));

    const spinner = {
      start: vi.fn(() => spinner),
      succeed: vi.fn(() => spinner),
      fail: vi.fn(() => spinner),
      stop: vi.fn(() => spinner),
    };
    const ora = vi.fn(() => spinner);
    vi.doMock("ora", () => ({ default: ora }));

    const waitForSave = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("timeout"), { code: "ETIMEOUT" }))
      .mockResolvedValueOnce({
        phase: 1,
        filename: "PRODUCT_SPEC.md",
        path: "/tmp/PRODUCT_SPEC.md",
      });

    const { waitForDocument: subject } = await import("../src/utils/wait");

    const result = await subject({ waitForSave, timeoutMs: 1 });

    expect(ora).toHaveBeenCalledWith("Waiting for document...");
    expect(waitForSave).toHaveBeenCalledTimes(2);
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      phase: 1,
      filename: "PRODUCT_SPEC.md",
      path: "/tmp/PRODUCT_SPEC.md",
    });
  });
});
