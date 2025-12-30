/**
 * @jest-environment node
 */

import crypto from "node:crypto";

import { eq } from "drizzle-orm";

import { POST } from "../app/api/sessions/route";
import { db } from "../src/db";
import { projects, users } from "../src/db/schema";
import { getAuthCookieName, signAuthToken } from "../src/lib/auth";

describe("Task 2.4.A create session endpoint", () => {
  let userId: string | null = null;

  afterEach(async () => {
    if (!userId) return;
    await db.delete(users).where(eq(users.id, userId));
    userId = null;
  });

  test("returns 401 if not authenticated", async () => {
    const request = new Request("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectName: "test", callbackPort: 1234 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  test("creates a new project session and returns details", async () => {
    const githubId = `test-${crypto.randomUUID()}`;
    const githubUsername = `test-user-${crypto.randomUUID()}`;

    const [user] = await db
      .insert(users)
      .values({ githubId, githubUsername })
      .returning({ id: users.id });

    userId = user.id;
    const token = await signAuthToken(user.id);

    const projectName = `project-${crypto.randomUUID()}`;

    const request = new Request("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${getAuthCookieName()}=${token}`,
      },
      body: JSON.stringify({ projectName, callbackPort: 1234 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body.isNewProject).toBe(true);
    expect(body.sessionToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(body.currentPhase).toBe(1);
    expect(body.sessionId).toBe(body.projectId);

    const stored = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.id, body.projectId));

    expect(stored[0]?.name).toBe(projectName);
  });

  test("returns existing project when called with duplicate project name", async () => {
    const githubId = `test-${crypto.randomUUID()}`;
    const githubUsername = `test-user-${crypto.randomUUID()}`;

    const [user] = await db
      .insert(users)
      .values({ githubId, githubUsername })
      .returning({ id: users.id });

    userId = user.id;
    const token = await signAuthToken(user.id);

    const projectName = `project-${crypto.randomUUID()}`;

    const request1 = new Request("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${getAuthCookieName()}=${token}`,
      },
      body: JSON.stringify({ projectName, callbackPort: 1234 }),
    });

    const response1 = await POST(request1);
    const body1: any = await response1.json();

    const request2 = new Request("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${getAuthCookieName()}=${token}`,
      },
      body: JSON.stringify({ projectName, callbackPort: 5678 }),
    });

    const response2 = await POST(request2);
    const body2: any = await response2.json();

    expect(body2.isNewProject).toBe(false);
    expect(body2.projectId).toBe(body1.projectId);
    expect(body2.sessionToken).toBe(body1.sessionToken);
  });
});

