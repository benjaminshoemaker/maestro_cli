/**
 * @jest-environment node
 */

import crypto from "node:crypto";

import { and, eq } from "drizzle-orm";

import { GET } from "../app/api/chat/route";
import { db } from "../src/db";
import { conversations, projects, users } from "../src/db/schema";
import { getAuthCookieName, signAuthToken } from "../src/lib/auth";

describe("Task 3.2.C chat history loading", () => {
  let userId: string | null = null;

  afterEach(async () => {
    if (!userId) return;
    await db.delete(users).where(eq(users.id, userId));
    userId = null;
  });

  test("returns 401 if not authenticated", async () => {
    const request = new Request("http://localhost:3000/api/chat?sessionId=x&phase=1");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  test("returns empty messages when no conversation exists", async () => {
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
      `http://localhost:3000/api/chat?sessionId=${project.id}&phase=1`,
      {
        headers: { cookie: `${getAuthCookieName()}=${token}` },
      },
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.messages).toEqual([]);
  });

  test("returns persisted messages for a session+phase", async () => {
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

    await db.insert(conversations).values({
      projectId: project.id,
      phase: 1,
      messages: [{ id: "m1", role: "user", content: "Hello" }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new Request(
      `http://localhost:3000/api/chat?sessionId=${project.id}&phase=1`,
      {
        headers: { cookie: `${getAuthCookieName()}=${token}` },
      },
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.messages).toEqual([{ id: "m1", role: "user", content: "Hello" }]);

    const stored = await db
      .select({ messages: conversations.messages })
      .from(conversations)
      .where(and(eq(conversations.projectId, project.id), eq(conversations.phase, 1)));

    expect(stored.length).toBe(1);
  });
});

