import open from "open";

import { DEFAULT_API_BASE_URL } from "./network";

export function getAppUrl(env: Record<string, string | undefined> = process.env) {
  const fromAppUrl = env.MAESTRO_APP_URL?.trim();
  if (fromAppUrl) return fromAppUrl;

  const fromApiUrl = env.MAESTRO_API_BASE_URL?.trim();
  if (fromApiUrl) return fromApiUrl;

  return DEFAULT_API_BASE_URL;
}

export function buildSessionNewUrl(params: {
  appUrl?: string;
  callbackPort: number;
  token: string;
  projectName: string;
}) {
  const base = new URL(params.appUrl ?? DEFAULT_API_BASE_URL);
  const url = new URL("/session/new", base);

  url.searchParams.set("callback", `localhost:${params.callbackPort}`);
  url.searchParams.set("token", params.token);
  url.searchParams.set("project", params.projectName);

  return url.toString();
}

export async function launchSessionInBrowser(params: {
  appUrl?: string;
  callbackPort: number;
  token: string;
  projectName: string;
}) {
  const url = buildSessionNewUrl(params);
  await open(url);
  return url;
}

export function buildSessionPhaseUrl(params: {
  appUrl?: string;
  sessionId: string;
  phase: number;
  callbackPort: number;
  token: string;
}) {
  const base = new URL(params.appUrl ?? DEFAULT_API_BASE_URL);
  const safeSessionId = encodeURIComponent(params.sessionId);
  const safePhase = encodeURIComponent(String(params.phase));
  const url = new URL(`/session/${safeSessionId}/phase/${safePhase}`, base);

  url.searchParams.set("port", String(params.callbackPort));
  url.searchParams.set("token", params.token);

  return url.toString();
}

export async function launchUrlInBrowser(url: string) {
  await open(url);
  return url;
}

export async function launchSessionPhaseInBrowser(params: {
  appUrl?: string;
  sessionId: string;
  phase: number;
  callbackPort: number;
  token: string;
}) {
  const url = buildSessionPhaseUrl(params);
  await launchUrlInBrowser(url);
  return url;
}
