/**
 * @jest-environment node
 */

import crypto from "node:crypto";

import { eq } from "drizzle-orm";

import { GET } from "../app/api/auth/github/route";
import { db } from "../src/db";
import { users } from "../src/db/schema";

describe("Task 2.3.B OAuth callback", () => {
  afterEach(async () => {
    await db
      .delete(users)
      .where(eq(users.githubId, "123456789-test-user"))
      .catch(() => {});
  });

  test("rejects state mismatches", async () => {
    const request = new Request(
      "http://localhost:3000/api/auth/github?code=test-code&state=test-state",
      {
        headers: {
          cookie: "maestro_oauth_state=different-state",
        },
      },
    );

    const response = await GET(request);
    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(500);
  });

  test("sets auth cookie and redirects to /session/new", async () => {
    const oauthState = crypto.randomBytes(16).toString("hex");

    const realFetch = global.fetch;
    const fetchMock = jest.fn(async (url: any, init?: any) => {
      const urlString = String(url);
      if (urlString.startsWith("https://github.com/login/oauth/access_token")) {
        expect(init?.method).toBe("POST");
        return new Response(JSON.stringify({ access_token: "test-token" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (urlString.startsWith("https://api.github.com/user/emails")) {
        return new Response(
          JSON.stringify([
            { email: "test@example.com", primary: true, verified: true, visibility: "private" },
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      if (urlString.startsWith("https://api.github.com/user")) {
        return new Response(
          JSON.stringify({ id: "123456789-test-user", login: "test-user" }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      return await realFetch(url, init);
    });

    // @ts-expect-error - override fetch for test
    global.fetch = fetchMock;

    try {
      const request = new Request(
        `http://localhost:3000/api/auth/github?code=test-code&state=${oauthState}`,
        {
          headers: {
            cookie: `maestro_oauth_state=${oauthState}`,
          },
        },
      );

      const response = await GET(request);

      expect(response.status).toBeGreaterThanOrEqual(300);
      expect(response.status).toBeLessThan(400);
      expect(response.headers.get("location")).toMatch(/\/session\/new$/);

      const setCookie = response.headers.get("set-cookie");
      expect(setCookie).toContain("maestro_auth=");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toMatch(/SameSite=Lax/i);

      const stored = await db
        .select({ githubUsername: users.githubUsername, email: users.email })
        .from(users)
        .where(eq(users.githubId, "123456789-test-user"));

      expect(stored[0]?.githubUsername).toBe("test-user");
      expect(stored[0]?.email).toBe("test@example.com");
    } finally {
      // @ts-expect-error - restore original fetch
      global.fetch = realFetch;
    }
  });
});
