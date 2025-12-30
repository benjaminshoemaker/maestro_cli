import { createOpenAI } from "@ai-sdk/openai";

const DEFAULT_OPENAI_MODEL_ID = "gpt-4o-mini";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getOpenAIModelId() {
  const fromEnv = process.env.OPENAI_MODEL?.trim();
  return fromEnv ? fromEnv : DEFAULT_OPENAI_MODEL_ID;
}

export function createOpenAIProvider() {
  return createOpenAI({ apiKey: getRequiredEnv("OPENAI_API_KEY") });
}

export function createChatModel() {
  return createOpenAIProvider().chat(getOpenAIModelId());
}

