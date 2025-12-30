/**
 * @jest-environment node
 */

import crypto from "node:crypto";

import { eq } from "drizzle-orm";

import { GET as getMe } from "../app/api/auth/me/route";
import { POST as postLogout } from "../app/api/auth/logout/route";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { getAuthCookieName, signAuthToken } from "../src/lib/auth";

describe("Task 2.3.C auth endpoints", () => {
  let testUserId: string | null = null;

  afterEach(async () => {
    if (!testUserId) return;
    await db.delete(users).where(eq(users.id, testUserId));
    testUserId = null;
  });

  test("GET /api/auth/me returns 401 if not authenticated", async () => {
    const request = new Request("http://localhost:3000/api/auth/me");
    const response = await getMe(request);
    expect(response.status).toBe(401);
  });

  test("GET /api/auth/me returns user object when authenticated", async () => {
    const githubId = `test-${crypto.randomUUID()}`;
    const githubUsername = `test-user-${crypto.randomUUID()}`;

    const [user] = await db
      .insert(users)
      .values({ githubId, githubUsername, email: "test@example.com" })
      .returning({ id: users.id });

    testUserId = user.id;
    const token = await signAuthToken(user.id);

    const request = new Request("http://localhost:3000/api/auth/me", {
      headers: {
        cookie: `${getAuthCookieName()}=${token}`,
      },
    });

    const response = await getMe(request);
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body.id).toBe(user.id);
    expect(body.githubUsername).toBe(githubUsername);
    expect(body.email).toBe("test@example.com");
    expect(body.subscriptionStatus).toBeTruthy();
    expect(typeof body.freeProjectUsed).toBe("boolean");
  });

  test("POST /api/auth/logout clears auth cookie", async () => {
    const request = new Request("http://localhost:3000/api/auth/logout", { method: "POST" });
    const response = await postLogout(request);
    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain(`${getAuthCookieName()}=`);
  });
});

