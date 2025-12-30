/**
 * @jest-environment node
 */

import crypto from "node:crypto";

import { eq, and } from "drizzle-orm";

import { POST } from "../app/api/sessions/[id]/phase/[phase]/complete/route";
import { db } from "../src/db";
import { conversations, projects, users } from "../src/db/schema";
import { getAuthCookieName, signAuthToken } from "../src/lib/auth";

describe("Task 2.4.C phase complete endpoint", () => {
  let userId: string | null = null;

  afterEach(async () => {
    if (!userId) return;
    await db.delete(users).where(eq(users.id, userId));
    userId = null;
  });

  test("returns 401 if not authenticated", async () => {
    const request = new Request("http://localhost:3000/api/sessions/x/phase/1/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ document: "# Doc" }),
    });

    // @ts-expect-error - route handler signature includes params
    const response = await POST(request, { params: { id: "x", phase: "1" } });
    expect(response.status).toBe(401);
  });

  test("validates phase number", async () => {
    const githubId = `test-${crypto.randomUUID()}`;
    const githubUsername = `test-user-${crypto.randomUUID()}`;

    const [user] = await db
      .insert(users)
      .values({ githubId, githubUsername })
      .returning({ id: users.id });

    userId = user.id;
    const token = await signAuthToken(user.id);

    const request = new Request("http://localhost:3000/api/sessions/x/phase/99/complete", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${getAuthCookieName()}=${token}`,
      },
      body: JSON.stringify({ document: "# Doc" }),
    });

    // @ts-expect-error - route handler signature includes params
    const response = await POST(request, { params: { id: "x", phase: "99" } });
    expect(response.status).toBe(400);
  });

  test("marks phase complete, stores doc, and advances current phase", async () => {
    const githubId = `test-${crypto.randomUUID()}`;
    const githubUsername = `test-user-${crypto.randomUUID()}`;

    const [user] = await db
      .insert(users)
      .values({ githubId, githubUsername })
      .returning({ id: users.id });

    userId = user.id;
    const token = await signAuthToken(user.id);

    const [project] = await db
      .insert(projects)
      .values({
        userId: user.id,
        name: `project-${crypto.randomUUID()}`,
        sessionToken: crypto.randomUUID(),
        currentPhase: 1,
        updatedAt: new Date(),
      })
      .returning({ id: projects.id });

    const request = new Request(
      `http://localhost:3000/api/sessions/${project.id}/phase/1/complete`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${getAuthCookieName()}=${token}`,
        },
        body: JSON.stringify({ document: "# Phase 1 Doc" }),
      },
    );

    // @ts-expect-error - route handler signature includes params
    const response = await POST(request, { params: { id: project.id, phase: "1" } });
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body.success).toBe(true);
    expect(body.nextPhase).toBe(2);

    const [updated] = await db
      .select({ phase1Complete: projects.phase1Complete, currentPhase: projects.currentPhase })
      .from(projects)
      .where(eq(projects.id, project.id));

    expect(updated.phase1Complete).toBe(true);
    expect(updated.currentPhase).toBe(2);

    const storedConversation = await db
      .select({ doc: conversations.generatedDoc })
      .from(conversations)
      .where(and(eq(conversations.projectId, project.id), eq(conversations.phase, 1)));

    expect(storedConversation[0]?.doc).toBe("# Phase 1 Doc");
  });

  test("phase 4 completion sets nextPhase to null and currentPhase to null", async () => {
    const githubId = `test-${crypto.randomUUID()}`;
    const githubUsername = `test-user-${crypto.randomUUID()}`;

    const [user] = await db
      .insert(users)
      .values({ githubId, githubUsername })
      .returning({ id: users.id });

    userId = user.id;
    const token = await signAuthToken(user.id);

    const [project] = await db
      .insert(projects)
      .values({
        userId: user.id,
        name: `project-${crypto.randomUUID()}`,
        sessionToken: crypto.randomUUID(),
        currentPhase: 4,
        updatedAt: new Date(),
      })
      .returning({ id: projects.id });

    const request = new Request(
      `http://localhost:3000/api/sessions/${project.id}/phase/4/complete`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${getAuthCookieName()}=${token}`,
        },
        body: JSON.stringify({ document: "# Phase 4 Doc" }),
      },
    );

    // @ts-expect-error - route handler signature includes params
    const response = await POST(request, { params: { id: project.id, phase: "4" } });
    const body: any = await response.json();

    expect(body.success).toBe(true);
    expect(body.nextPhase).toBeNull();

    const [updated] = await db
      .select({ phase4Complete: projects.phase4Complete, currentPhase: projects.currentPhase })
      .from(projects)
      .where(eq(projects.id, project.id));

    expect(updated.phase4Complete).toBe(true);
    expect(updated.currentPhase).toBeNull();
  });
});
