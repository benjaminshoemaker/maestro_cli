import { NextResponse } from "next/server";

import { and, eq } from "drizzle-orm";

import { db } from "../../../../src/db";
import { projects } from "../../../../src/db/schema";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { projectName?: unknown; sessionToken?: unknown }
    | null;

  const projectName =
    typeof body?.projectName === "string" ? body.projectName.trim() : "";
  const sessionToken =
    typeof body?.sessionToken === "string" ? body.sessionToken.trim() : "";

  if (!projectName || !sessionToken) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const [project] = await db
    .select({
      currentPhase: projects.currentPhase,
    })
    .from(projects)
    .where(and(eq(projects.name, projectName), eq(projects.sessionToken, sessionToken)));

  if (!project) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  return NextResponse.json(
    { valid: true, currentPhase: project.currentPhase ?? 1 },
    { status: 200 },
  );
}

