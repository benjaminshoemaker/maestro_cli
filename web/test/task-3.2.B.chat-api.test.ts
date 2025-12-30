/**
 * @jest-environment node
 */

import crypto from "node:crypto";

import { and, eq } from "drizzle-orm";

import { POST } from "../app/api/chat/route";
import { db } from "../src/db";
import { conversations, projects, users } from "../src/db/schema";
import { getAuthCookieName, signAuthToken } from "../src/lib/auth";

jest.mock("ai", () => {
  const actual = jest.requireActual("ai");
  return {
    ...actual,
    streamText: jest.fn(async (options: any) => {
      if (typeof options.onFinish === "function") {
        await options.onFinish({ text: "Assistant reply" });
      }
      return {
        toDataStreamResponse: () =>
          new Response("data: test\n\n", {
            headers: { "content-type": "text/event-stream" },
          }),
      };
    }),
  };
});

describe("Task 3.2.B chat streaming endpoint", () => {
  let userId: string | null = null;

  afterEach(async () => {
    if (!userId) return;
    await db.delete(users).where(eq(users.id, userId));
    userId = null;
  });

  test("returns 401 if not authenticated", async () => {
    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "x", phase: 1, messages: [] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  test("validates request body", async () => {
    const githubId = `test-${crypto.randomUUID()}`;
    const githubUsername = `test-user-${crypto.randomUUID()}`;

    const [user] = await db
      .insert(users)
      .values({ githubId, githubUsername })
      .returning({ id: users.id });

    userId = user.id;
    const token = await signAuthToken(user.id);

    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${getAuthCookieName()}=${token}`,
      },
      body: JSON.stringify({ sessionId: user.id, phase: 1 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  test("validates session ownership and persists messages", async () => {
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

    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${getAuthCookieName()}=${token}`,
      },
      body: JSON.stringify({
        sessionId: project.id,
        phase: 1,
        messages: [{ id: "m1", role: "user", content: "Hello" }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");

    const stored = await db
      .select({ messages: conversations.messages })
      .from(conversations)
      .where(and(eq(conversations.projectId, project.id), eq(conversations.phase, 1)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = (stored[0]?.messages ?? []) as any[];
    expect(messages.some((msg) => msg.role === "user" && msg.content === "Hello")).toBe(true);
  });
});

