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

