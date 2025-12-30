import { createChatModel, getOpenAIModelId } from "../src/lib/ai";

describe("Task 3.2.A AI SDK configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("model defaults to gpt-4o-mini", () => {
    delete process.env.OPENAI_MODEL;
    expect(getOpenAIModelId()).toBe("gpt-4o-mini");
  });

  test("reads OPENAI_API_KEY and errors when missing", () => {
    delete process.env.OPENAI_API_KEY;
    expect(() => createChatModel()).toThrow(/OPENAI_API_KEY/);
  });

  test("creates a chat model with the configured model id", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-4o-mini";

    const model = createChatModel();
    expect(model.modelId).toBe("gpt-4o-mini");
  });
});

