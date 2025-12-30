/**
 * @jest-environment node
 */

import crypto from "node:crypto";

import { eq } from "drizzle-orm";

import { POST } from "../app/api/chat/route";
import { db } from "../src/db";
import { conversations, projects, users } from "../src/db/schema";
import { getAuthCookieName, signAuthToken } from "../src/lib/auth";

const streamTextMock = jest.fn();

jest.mock("ai", () => {
  const actual = jest.requireActual("ai");
  return {
    ...actual,
    streamText: (...args: any[]) => streamTextMock(...args),
  };
});

describe("Task 3.3.A context injection in /api/chat", () => {
  let userId: string | null = null;

  afterEach(async () => {
    streamTextMock.mockReset();

    if (!userId) return;
    await db.delete(users).where(eq(users.id, userId));
    userId = null;
  });

  test("injects previous phase docs into the system message", async () => {
    streamTextMock.mockImplementation(async (options: any) => {
      if (typeof options.onFinish === "function") {
        await options.onFinish({ text: "Assistant reply" });
      }
      return {
        toDataStreamResponse: () =>
          new Response("data: test\n\n", {
            headers: { "content-type": "text/event-stream" },
          }),
      };
    });

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
        currentPhase: 3,
        updatedAt: new Date(),
      })
      .returning({ id: projects.id });

    await db.insert(conversations).values({
      projectId: project.id,
      phase: 1,
      generatedDoc: "# Phase 1 Doc",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(conversations).values({
      projectId: project.id,
      phase: 2,
      generatedDoc: "# Phase 2 Doc",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${getAuthCookieName()}=${token}`,
      },
      body: JSON.stringify({
        sessionId: project.id,
        phase: 3,
        messages: [{ id: "m1", role: "user", content: "Hello" }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(streamTextMock).toHaveBeenCalled();
    const [options] = streamTextMock.mock.calls[0];
    expect(options.system).toContain("# Phase 1 Doc");
    expect(options.system).toContain("# Phase 2 Doc");
  });
});
