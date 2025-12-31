import fetch from "node-fetch";
import { CliError } from "./errors";

export const DEFAULT_API_BASE_URL = "https://maestro-cli-web.vercel.app";

export async function assertInternetConnectivity(options?: {
  baseUrl?: string;
  timeoutMs?: number;
}): Promise<void> {
  const baseUrl =
    options?.baseUrl ??
    process.env.MAESTRO_API_BASE_URL ??
    DEFAULT_API_BASE_URL;
  const timeoutMs = options?.timeoutMs ?? 5000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch {
    throw new CliError(
      "Maestro requires an internet connection. Check your network and try again.",
      2,
    );
  } finally {
    clearTimeout(timeout);
  }
}
