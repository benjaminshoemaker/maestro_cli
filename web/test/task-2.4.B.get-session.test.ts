/**
 * @jest-environment node
 */

import crypto from "node:crypto";

import { eq } from "drizzle-orm";

import { GET } from "../app/api/sessions/[id]/route";
import { db } from "../src/db";
import { conversations, projects, users } from "../src/db/schema";
import { getAuthCookieName, signAuthToken } from "../src/lib/auth";

describe("Task 2.4.B get session endpoint", () => {
  let userId: string | null = null;

  afterEach(async () => {
    if (!userId) return;
    await db.delete(users).where(eq(users.id, userId));
    userId = null;
  });

  test("returns 401 if not authenticated", async () => {
    const request = new Request("http://localhost:3000/api/sessions/test");
    // @ts-expect-error - route handler signature includes params
    const response = await GET(request, { params: { id: "test" } });
    expect(response.status).toBe(401);
  });

  test("returns session object with phases and documents", async () => {
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
        currentPhase: 2,
        phase1Complete: true,
        updatedAt: new Date(),
      })
      .returning({ id: projects.id, name: projects.name });

    await db.insert(conversations).values({
      projectId: project.id,
      phase: 1,
      generatedDoc: "# Phase 1",
      updatedAt: new Date(),
    });

    const request = new Request(`http://localhost:3000/api/sessions/${project.id}`, {
      headers: {
        cookie: `${getAuthCookieName()}=${token}`,
      },
    });

    // @ts-expect-error - route handler signature includes params
    const response = await GET(request, { params: { id: project.id } });
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body.session.id).toBe(project.id);
    expect(body.session.projectName).toBe(project.name);
    expect(body.session.currentPhase).toBe(2);

    expect(body.session.phases["1"]).toEqual({ complete: true, document: "# Phase 1" });
    expect(body.session.phases["2"]).toEqual({ complete: false, document: null });
    expect(body.session.phases["3"]).toEqual({ complete: false, document: null });
    expect(body.session.phases["4"]).toEqual({ complete: false, document: null });
  });
});

