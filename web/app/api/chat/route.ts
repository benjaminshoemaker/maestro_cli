import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { convertToCoreMessages, streamText } from "ai";

import { db } from "../../../src/db";
import { conversations, projects } from "../../../src/db/schema";
import { getUserIdFromRequest } from "../../../src/lib/auth";
import { createChatModel } from "../../../src/lib/ai";

type ChatMessagePayload = {
  id?: string;
  role?: string;
  content?: unknown;
};

type ChatRequestPayload = {
  sessionId?: string;
  phase?: number | string;
  messages?: ChatMessagePayload[];
};

function parsePhase(value: number | string): 1 | 2 | 3 | 4 | null {
  const phase = typeof value === "number" ? value : Number(value);
  return phase === 1 || phase === 2 || phase === 3 || phase === 4 ? phase : null;
}

function isMessageArray(value: unknown): value is ChatMessagePayload[] {
  return Array.isArray(value);
}

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const phaseParam = url.searchParams.get("phase");
  const phase = phaseParam ? parsePhase(phaseParam) : null;

  if (!sessionId || !phase) {
    return NextResponse.json(
      { error: "Missing required query parameters: sessionId, phase" },
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

  return NextResponse.json({ messages: conversation?.messages ?? [] }, { status: 200 });
}

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ChatRequestPayload;
  try {
    body = (await request.json()) as ChatRequestPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  const phase = body.phase != null ? parsePhase(body.phase) : null;
  const messages = isMessageArray(body.messages) ? body.messages : null;

  if (!sessionId || !phase || !messages) {
    return NextResponse.json(
      { error: "Missing required fields: sessionId, phase, messages" },
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

  const now = new Date();
  const existing = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.projectId, sessionId), eq(conversations.phase, phase)));

  if (existing.length) {
    await db
      .update(conversations)
      .set({ messages, updatedAt: now })
      .where(and(eq(conversations.projectId, sessionId), eq(conversations.phase, phase)));
  } else {
    await db.insert(conversations).values({
      projectId: sessionId,
      phase,
      messages,
      createdAt: now,
      updatedAt: now,
    });
  }

  try {
    const result = await streamText({
      model: createChatModel(),
      messages: convertToCoreMessages(
        messages.map((msg) => ({
          id: msg.id ?? crypto.randomUUID(),
          role: msg.role === "assistant" || msg.role === "user" ? msg.role : "user",
          content: typeof msg.content === "string" ? msg.content : "",
        })),
      ),
      onFinish: async ({ text }) => {
        const assistantMessage = {
          id: `assistant-${crypto.randomUUID()}`,
          role: "assistant",
          content: text,
        };

        await db
          .update(conversations)
          .set({ messages: [...messages, assistantMessage], updatedAt: new Date() })
          .where(and(eq(conversations.projectId, sessionId), eq(conversations.phase, phase)));
      },
    });

    return result.toDataStreamResponse({
      headers: {
        "Content-Type": "text/event-stream",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
