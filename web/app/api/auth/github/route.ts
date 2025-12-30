import { NextResponse } from "next/server";

import { db } from "../../../../src/db";
import { users } from "../../../../src/db/schema";
import { parseCookieHeader, getAuthCookieName, signAuthToken } from "../../../../src/lib/auth";
import {
  exchangeGitHubCodeForAccessToken,
  fetchGitHubPrimaryEmail,
  fetchGitHubUser,
} from "../../../../src/lib/github";

const OAUTH_STATE_COOKIE = "maestro_oauth_state";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appUrl = getRequiredEnv("NEXT_PUBLIC_APP_URL");

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const stateCookie = cookies[OAUTH_STATE_COOKIE];

  if (!code || !state || !stateCookie || stateCookie !== state) {
    const redirectUrl = new URL("/login?error=oauth_state_mismatch", appUrl);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const redirectUri = new URL("/api/auth/github", appUrl).toString();
    const accessToken = await exchangeGitHubCodeForAccessToken({ code, state, redirectUri });
    const userInfo = await fetchGitHubUser(accessToken);
    const email = await fetchGitHubPrimaryEmail(accessToken);

    const [user] = await db
      .insert(users)
      .values({
        githubId: userInfo.githubId,
        githubUsername: userInfo.githubUsername,
        email,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.githubId,
        set: {
          githubUsername: userInfo.githubUsername,
          email,
          updatedAt: new Date(),
        },
      })
      .returning({ id: users.id });

    const jwt = await signAuthToken(user.id);

    const response = NextResponse.redirect(new URL("/session/new", appUrl));
    response.cookies.set(getAuthCookieName(), jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    response.cookies.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("OAuth callback failed:", error);
    }
    const redirectUrl = new URL("/login?error=oauth_failed", appUrl);
    return NextResponse.redirect(redirectUrl);
  }
}
