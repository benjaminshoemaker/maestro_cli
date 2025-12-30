import { NextResponse } from "next/server";

import { and, eq } from "drizzle-orm";

import { db } from "../../../../../../../src/db";
import { conversations, projects } from "../../../../../../../src/db/schema";
import { getUserIdFromRequest } from "../../../../../../../src/lib/auth";

function parsePhase(raw: string) {
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1 || value > 4) return null;
  return value;
}

export async function POST(
  request: Request,
  context: { params: { id: string; phase: string } },
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = context.params.id;
  const phase = parsePhase(context.params.phase);

  if (!phase) {
    return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { document?: unknown } | null;
  const document = typeof body?.document === "string" ? body.document : null;

  if (!document) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, sessionId), eq(projects.userId, userId)));

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .insert(conversations)
    .values({
      projectId: project.id,
      phase,
      generatedDoc: document,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [conversations.projectId, conversations.phase],
      set: {
        generatedDoc: document,
        updatedAt: new Date(),
      },
    });

  const nextPhase = phase < 4 ? phase + 1 : null;

  const phaseUpdate =
    phase === 1
      ? { phase1Complete: true }
      : phase === 2
        ? { phase2Complete: true }
        : phase === 3
          ? { phase3Complete: true }
          : { phase4Complete: true };

  await db
    .update(projects)
    .set({
      ...phaseUpdate,
      currentPhase: nextPhase,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, project.id));

  return NextResponse.json({ success: true, nextPhase }, { status: 200 });
}
