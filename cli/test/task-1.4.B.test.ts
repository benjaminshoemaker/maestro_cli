import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import fetch from "node-fetch";
import { describe, expect, it } from "vitest";
import { startCallbackServer } from "../src/server";

function uniqueTempDir(name: string) {
  return join(tmpdir(), `maestro-cli-${name}-${Date.now()}-${Math.random()}`);
}

describe("Task 1.4.B - POST /save endpoint", () => {
  it("rejects invalid session token with 401", async () => {
    const projectDir = uniqueTempDir("project");
    await mkdir(projectDir, { recursive: true });

    const server = await startCallbackServer({
      projectDir,
      sessionToken: "valid-token",
      handleSignals: false,
    });

    try {
      const response = await fetch(`http://127.0.0.1:${server.port}/save`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({
          phase: 1,
          filename: "PRODUCT_SPEC.md",
          content: "# Hello",
        }),
      });

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        error: "Invalid session token",
      });
    } finally {
      await server.close();
    }
  });

  it("writes phase 1-3 documents into specs/", async () => {
    const projectDir = uniqueTempDir("project");
    await mkdir(projectDir, { recursive: true });

    const server = await startCallbackServer({
      projectDir,
      sessionToken: "valid-token",
      handleSignals: false,
    });

    try {
      const response = await fetch(`http://127.0.0.1:${server.port}/save`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          phase: 1,
          filename: "PRODUCT_SPEC.md",
          content: "# Product Spec",
        }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as { path: string };
      expect(data.path).toBe(join(projectDir, "specs", "PRODUCT_SPEC.md"));

      const content = await readFile(join(projectDir, "specs", "PRODUCT_SPEC.md"), "utf8");
      expect(content).toBe("# Product Spec");
    } finally {
      await server.close();
    }
  });

  it("writes AGENTS.md to the project root", async () => {
    const projectDir = uniqueTempDir("project");
    await mkdir(projectDir, { recursive: true });

    const server = await startCallbackServer({
      projectDir,
      sessionToken: "valid-token",
      handleSignals: false,
    });

    try {
      const response = await fetch(`http://127.0.0.1:${server.port}/save`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          phase: 4,
          filename: "AGENTS.md",
          content: "# AGENTS",
        }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as { path: string };
      expect(data.path).toBe(join(projectDir, "AGENTS.md"));

      const content = await readFile(join(projectDir, "AGENTS.md"), "utf8");
      expect(content).toBe("# AGENTS");
    } finally {
      await server.close();
    }
  });
});

