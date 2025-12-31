import fetch from "node-fetch";

import { readMaestroConfig } from "./maestro-config";
import { DEFAULT_API_BASE_URL } from "./network";

export type SessionValidationResult =
  | { status: "valid"; currentPhase: number }
  | { status: "invalid" }
  | { status: "error"; message: string };

type ValidateResponseBody =
  | { valid: true; currentPhase: number }
  | { valid: false }
  | { error: string };

export async function validateSession(params: {
  baseUrl?: string;
  projectName: string;
  sessionToken: string;
  timeoutMs?: number;
}): Promise<SessionValidationResult> {
  const baseUrl =
    params.baseUrl ?? process.env.MAESTRO_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const timeoutMs = params.timeoutMs ?? 5000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/sessions/validate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectName: params.projectName,
        sessionToken: params.sessionToken,
      }),
      signal: controller.signal,
    });

    const body = (await response.json().catch(() => null)) as ValidateResponseBody | null;
    if (body && "valid" in body) {
      if (body.valid) {
        const phase = typeof body.currentPhase === "number" ? body.currentPhase : 1;
        return { status: "valid", currentPhase: phase };
      }
      return { status: "invalid" };
    }

    if (body && "error" in body && typeof body.error === "string") {
      return { status: "error", message: body.error };
    }

    return { status: "error", message: `Unexpected response (HTTP ${response.status})` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { status: "error", message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function validateSessionFromConfig(params: {
  projectDir: string;
  baseUrl?: string;
  timeoutMs?: number;
}): Promise<SessionValidationResult & { projectName?: string }> {
  const config = await readMaestroConfig(params.projectDir);
  const result = await validateSession({
    baseUrl: params.baseUrl,
    projectName: config.projectName,
    sessionToken: config.sessionToken,
    timeoutMs: params.timeoutMs,
  });

  return { ...result, projectName: config.projectName };
}
