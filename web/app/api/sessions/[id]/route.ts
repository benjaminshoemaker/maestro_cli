import { NextResponse } from "next/server";

import { eq, and, inArray } from "drizzle-orm";

import { db } from "../../../../src/db";
import { conversations, projects } from "../../../../src/db/schema";
import { getUserIdFromRequest } from "../../../../src/lib/auth";

export async function GET(
  request: Request,
  context: { params: { id: string } },
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = context.params.id;

  const [project] = await db
    .select({
      id: projects.id,
      projectName: projects.name,
      currentPhase: projects.currentPhase,
      phase1Complete: projects.phase1Complete,
      phase2Complete: projects.phase2Complete,
      phase3Complete: projects.phase3Complete,
      phase4Complete: projects.phase4Complete,
    })
    .from(projects)
    .where(and(eq(projects.id, sessionId), eq(projects.userId, userId)));

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const docs = await db
    .select({
      phase: conversations.phase,
      document: conversations.generatedDoc,
    })
    .from(conversations)
    .where(and(eq(conversations.projectId, project.id), inArray(conversations.phase, [1, 2, 3, 4])));

  const docsByPhase = new Map<number, string | null>();
  for (const row of docs) {
    docsByPhase.set(row.phase, row.document ?? null);
  }

  return NextResponse.json(
    {
      session: {
        id: project.id,
        projectName: project.projectName,
        currentPhase: project.currentPhase,
        phases: {
          1: { complete: project.phase1Complete, document: docsByPhase.get(1) ?? null },
          2: { complete: project.phase2Complete, document: docsByPhase.get(2) ?? null },
          3: { complete: project.phase3Complete, document: docsByPhase.get(3) ?? null },
          4: { complete: project.phase4Complete, document: docsByPhase.get(4) ?? null },
        },
      },
    },
    { status: 200 },
  );
}

