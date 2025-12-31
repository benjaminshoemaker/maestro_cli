/**
 * @jest-environment node
 */

import crypto from "node:crypto";

import { eq } from "drizzle-orm";

import { POST } from "../app/api/sessions/route";
import { db } from "../src/db";
import { projects, users } from "../src/db/schema";
import { getAuthCookieName, signAuthToken } from "../src/lib/auth";

describe("Task 4.1.B sessions endpoint accepts CLI session token", () => {
  let userId: string | null = null;
  let projectId: string | null = null;

  afterEach(async () => {
    if (projectId) {
      await db.delete(projects).where(eq(projects.id, projectId)).catch(() => {});
      projectId = null;
    }
    if (userId) {
      await db.delete(users).where(eq(users.id, userId)).catch(() => {});
      userId = null;
    }
  });

  test("creates a new project with the provided sessionToken", async () => {
    const githubId = `test-${crypto.randomUUID()}`;
    const githubUsername = `test-user-${crypto.randomUUID()}`;

    const [user] = await db
      .insert(users)
      .values({ githubId, githubUsername })
      .returning({ id: users.id });

    userId = user.id;
    const authToken = await signAuthToken(user.id);

    const projectName = `project-${crypto.randomUUID()}`;
    const sessionToken = crypto.randomUUID();

    const request = new Request("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${getAuthCookieName()}=${authToken}`,
      },
      body: JSON.stringify({ projectName, callbackPort: 1234, sessionToken }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body.sessionToken).toBe(sessionToken);

    projectId = body.projectId;
    const stored = await db
      .select({ sessionToken: projects.sessionToken })
      .from(projects)
      .where(eq(projects.id, body.projectId));

    expect(stored[0]?.sessionToken).toBe(sessionToken);
  });

  test("returns 409 when resuming with a mismatched sessionToken", async () => {
    const githubId = `test-${crypto.randomUUID()}`;
    const githubUsername = `test-user-${crypto.randomUUID()}`;

    const [user] = await db
      .insert(users)
      .values({ githubId, githubUsername })
      .returning({ id: users.id });

    userId = user.id;
    const authToken = await signAuthToken(user.id);

    const projectName = `project-${crypto.randomUUID()}`;
    const sessionToken = crypto.randomUUID();

    const create = new Request("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${getAuthCookieName()}=${authToken}`,
      },
      body: JSON.stringify({ projectName, callbackPort: 1234, sessionToken }),
    });

    const created = await POST(create);
    const body: any = await created.json();
    projectId = body.projectId;

    const resume = new Request("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${getAuthCookieName()}=${authToken}`,
      },
      body: JSON.stringify({ projectName, callbackPort: 1234, sessionToken: "different-token" }),
    });

    const resumed = await POST(resume);
    expect(resumed.status).toBe(409);
    await expect(resumed.json()).resolves.toMatchObject({ error: "Invalid session token" });
  });
});

