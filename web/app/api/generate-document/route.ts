import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { convertToCoreMessages, generateText } from "ai";

import { db } from "../../../src/db";
import { conversations, projects } from "../../../src/db/schema";
import { getUserIdFromRequest } from "../../../src/lib/auth";
import { createChatModel } from "../../../src/lib/ai";
import { buildDocumentSystemPrompt, getPhaseFilename } from "../../../src/lib/document";

type GenerateDocumentRequestPayload = {
  sessionId?: string;
  phase?: number | string;
};

function parsePhase(value: number | string): 1 | 2 | 3 | 4 | null {
  const phase = typeof value === "number" ? value : Number(value);
  return phase === 1 || phase === 2 || phase === 3 || phase === 4 ? phase : null;
}

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: GenerateDocumentRequestPayload;
  try {
    body = (await request.json()) as GenerateDocumentRequestPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  const phase = body.phase != null ? parsePhase(body.phase) : null;

  if (!sessionId || !phase) {
    return NextResponse.json(
      { error: "Missing required fields: sessionId, phase" },
      { status: 400 },
    );
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, sessionId), eq(projects.userId, userId)));

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [conversation] = await db
    .select({ messages: conversations.messages })
    .from(conversations)
    .where(and(eq(conversations.projectId, sessionId), eq(conversations.phase, phase)));

  if (!conversation) {
    return NextResponse.json({ error: "No conversation found" }, { status: 404 });
  }

  const filename = getPhaseFilename(phase);
  const system = buildDocumentSystemPrompt({ phase, filename });

  try {
    const result = await generateText({
      model: createChatModel(),
      system,
      messages: convertToCoreMessages(
        Array.isArray(conversation.messages) ? (conversation.messages as any[]) : [],
      ),
    });

    const document = result.text;

    await db
      .update(conversations)
      .set({ generatedDoc: document, updatedAt: new Date() })
      .where(and(eq(conversations.projectId, sessionId), eq(conversations.phase, phase)));

    return NextResponse.json({ filename, document }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

