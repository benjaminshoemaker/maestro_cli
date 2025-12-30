import crypto from "node:crypto";

import { NextResponse } from "next/server";

const OAUTH_STATE_COOKIE = "maestro_oauth_state";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function GET(_request: Request) {
  try {
    const clientId = getRequiredEnv("GITHUB_CLIENT_ID");
    const appUrl = getRequiredEnv("NEXT_PUBLIC_APP_URL");

    const state = crypto.randomBytes(16).toString("hex");

    const redirectUri = new URL("/api/auth/github", appUrl).toString();
    const url = new URL("https://github.com/login/oauth/authorize");

    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "user:email");
    url.searchParams.set("state", state);

    const response = NextResponse.redirect(url.toString());
    response.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

