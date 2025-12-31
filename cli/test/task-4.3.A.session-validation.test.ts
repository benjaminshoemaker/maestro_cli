import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { validateSessionFromConfig } from "../src/utils/session";

function uniqueTempDir(name: string) {
  return join(tmpdir(), `maestro-cli-${name}-${Date.now()}-${Math.random()}`);
}

async function writeConfig(params: { projectDir: string; projectName: string; sessionToken: string }) {
  await mkdir(join(params.projectDir, ".maestro"), { recursive: true });
  await writeFile(
    join(params.projectDir, ".maestro", "config.json"),
    JSON.stringify(
      {
        version: "1.0.0",
        projectName: params.projectName,
        sessionToken: params.sessionToken,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );
}

describe("Task 4.3.A session validation", () => {
  it("reads token from config and returns current phase when valid", async () => {
    const server = createServer(async (req, res) => {
      if (req.method !== "POST" || req.url !== "/api/sessions/validate") {
        res.statusCode = 404;
        res.end();
        return;
      }

      let body = "";
      req.on("data", (chunk) => (body += String(chunk)));
      req.on("end", () => {
        const parsed = JSON.parse(body) as any;
        if (parsed.projectName === "my-project" && parsed.sessionToken === "token-1") {
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ valid: true, sessionId: "session-1", currentPhase: 3 }));
          return;
        }

        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ valid: false }));
      });
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      server.close();
      throw new Error("Expected server to have a numeric port");
    }

    const projectDir = uniqueTempDir("session-validate");
    await mkdir(projectDir, { recursive: true });
    await writeConfig({ projectDir, projectName: "my-project", sessionToken: "token-1" });

    try {
      const result = await validateSessionFromConfig({
        projectDir,
        baseUrl: `http://127.0.0.1:${address.port}`,
        timeoutMs: 1000,
      });

      expect(result).toEqual({
        status: "valid",
        sessionId: "session-1",
        currentPhase: 3,
        projectName: "my-project",
      });
    } finally {
      server.close();
    }
  });

  it("returns invalid when the server reports no matching session", async () => {
    const server = createServer(async (req, res) => {
      if (req.method !== "POST" || req.url !== "/api/sessions/validate") {
        res.statusCode = 404;
        res.end();
        return;
      }

      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ valid: false }));
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      server.close();
      throw new Error("Expected server to have a numeric port");
    }

    const projectDir = uniqueTempDir("session-invalid");
    await mkdir(projectDir, { recursive: true });
    await writeConfig({ projectDir, projectName: "my-project", sessionToken: "token-2" });

    try {
      const result = await validateSessionFromConfig({
        projectDir,
        baseUrl: `http://127.0.0.1:${address.port}`,
        timeoutMs: 1000,
      });

      expect(result).toEqual({ status: "invalid", projectName: "my-project" });
    } finally {
      server.close();
    }
  });

  it("returns error on network failure", async () => {
    const projectDir = uniqueTempDir("session-network");
    await mkdir(projectDir, { recursive: true });
    await writeConfig({ projectDir, projectName: "my-project", sessionToken: "token-3" });

    const result = await validateSessionFromConfig({
      projectDir,
      baseUrl: "http://127.0.0.1:1",
      timeoutMs: 200,
    });

    expect(result.status).toBe("error");
  });
});
