/**
 * @jest-environment node
 */

import crypto from "node:crypto";

import { and, eq } from "drizzle-orm";

import { POST } from "../app/api/generate-document/route";
import { db } from "../src/db";
import { conversations, projects, users } from "../src/db/schema";
import { getAuthCookieName, signAuthToken } from "../src/lib/auth";

const generateTextMock = jest.fn();

jest.mock("ai", () => {
  const actual = jest.requireActual("ai");
  return {
    ...actual,
    generateText: (...args: any[]) => generateTextMock(...args),
  };
});

describe("Task 3.3.B generate document endpoint", () => {
  let userId: string | null = null;

  afterEach(async () => {
    generateTextMock.mockReset();
    if (!userId) return;
    await db.delete(users).where(eq(users.id, userId));
    userId = null;
  });

  test("returns 401 if not authenticated", async () => {
    const request = new Request("http://localhost:3000/api/generate-document", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "x", phase: 1 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  test("generates markdown doc, returns filename, and stores document", async () => {
    generateTextMock.mockResolvedValue({ text: "# Generated Doc" });

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

    const request = new Request("http://localhost:3000/api/generate-document", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${getAuthCookieName()}=${token}`,
      },
      body: JSON.stringify({ sessionId: project.id, phase: 1 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body.filename).toBe("PRODUCT_SPEC.md");
    expect(body.document).toBe("# Generated Doc");

    const stored = await db
      .select({ generatedDoc: conversations.generatedDoc })
      .from(conversations)
      .where(and(eq(conversations.projectId, project.id), eq(conversations.phase, 1)));

    expect(stored[0]?.generatedDoc).toBe("# Generated Doc");
  });
});

