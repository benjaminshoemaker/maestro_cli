/**
 * @jest-environment node
 */

import crypto from "node:crypto";

import { eq } from "drizzle-orm";

import { POST } from "../app/api/sessions/validate/route";
import { db } from "../src/db";
import { projects, users } from "../src/db/schema";

describe("Task 4.3.A validate session endpoint", () => {
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

  test("returns valid with currentPhase when token matches", async () => {
    const githubId = `test-${crypto.randomUUID()}`;
    const githubUsername = `test-user-${crypto.randomUUID()}`;

    const [user] = await db
      .insert(users)
      .values({ githubId, githubUsername })
      .returning({ id: users.id });
    userId = user.id;

    const sessionToken = crypto.randomUUID();
    const projectName = `project-${crypto.randomUUID()}`;

    const [project] = await db
      .insert(projects)
      .values({
        userId,
        name: projectName,
        sessionToken,
        currentPhase: 3,
        updatedAt: new Date(),
      })
      .returning({ id: projects.id });
    projectId = project.id;

    const request = new Request("http://localhost:3000/api/sessions/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectName, sessionToken }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      valid: true,
      sessionId: projectId,
      currentPhase: 3,
    });
  });

  test("returns valid:false when token does not match", async () => {
    const githubId = `test-${crypto.randomUUID()}`;
    const githubUsername = `test-user-${crypto.randomUUID()}`;

    const [user] = await db
      .insert(users)
      .values({ githubId, githubUsername })
      .returning({ id: users.id });
    userId = user.id;

    const sessionToken = crypto.randomUUID();
    const projectName = `project-${crypto.randomUUID()}`;

    const [project] = await db
      .insert(projects)
      .values({
        userId,
        name: projectName,
        sessionToken,
        currentPhase: 2,
        updatedAt: new Date(),
      })
      .returning({ id: projects.id });
    projectId = project.id;

    const request = new Request("http://localhost:3000/api/sessions/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectName, sessionToken: "wrong-token" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ valid: false });
  });
});
