import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type express from "express";

type SaveRequestBody = {
  phase: number;
  filename: string;
  content: string;
};

function getBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export function createSaveHandler(params: {
  projectDir: string;
  sessionToken: string;
}): express.RequestHandler {
  return async (req, res) => {
    const token = getBearerToken(req.header("authorization"));
    if (!token || token !== params.sessionToken) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    const body = req.body as Partial<SaveRequestBody> | undefined;
    const phase = body?.phase;
    const filename = body?.filename;
    const content = body?.content;

    if (
      typeof phase !== "number" ||
      typeof filename !== "string" ||
      typeof content !== "string"
    ) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const projectDir = resolve(params.projectDir);

    const path =
      filename === "AGENTS.md" || phase === 4
        ? join(projectDir, "AGENTS.md")
        : join(projectDir, "specs", filename);

    await mkdir(join(projectDir, "specs"), { recursive: true });
    await writeFile(path, content, "utf8");

    return res.json({ success: true, path });
  };
}

