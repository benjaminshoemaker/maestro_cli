import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { eq, and } from "drizzle-orm";

import { db } from "../../../src/db";
import { projects } from "../../../src/db/schema";
import { getUserIdFromRequest } from "../../../src/lib/auth";

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { projectName?: unknown; callbackPort?: unknown }
    | null;

  const projectName = typeof body?.projectName === "string" ? body.projectName : null;
  const callbackPort = typeof body?.callbackPort === "number" ? body.callbackPort : null;

  if (!projectName || projectName.trim().length === 0 || !callbackPort) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const [existing] = await db
    .select({
      id: projects.id,
      sessionToken: projects.sessionToken,
      currentPhase: projects.currentPhase,
    })
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.name, projectName)));

  if (existing) {
    return NextResponse.json(
      {
        sessionId: existing.id,
        sessionToken: existing.sessionToken,
        projectId: existing.id,
        currentPhase: existing.currentPhase ?? 1,
        isNewProject: false,
      },
      { status: 200 },
    );
  }

  const sessionToken = crypto.randomUUID();

  const [created] = await db
    .insert(projects)
    .values({
      userId,
      name: projectName,
      sessionToken,
      currentPhase: 1,
      updatedAt: new Date(),
    })
    .returning({ id: projects.id });

  return NextResponse.json(
    {
      sessionId: created.id,
      sessionToken,
      projectId: created.id,
      currentPhase: 1,
      isNewProject: true,
    },
    { status: 200 },
  );
}

