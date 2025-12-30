import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { startCallbackServer } from "../src/server";

describe("Task 1.4.A - localhost callback server", () => {
  it("starts on a dynamically allocated port and can shut down", async () => {
    const projectDir = join(tmpdir(), `maestro-cli-server-${Date.now()}`);
    await mkdir(projectDir, { recursive: true });

    const server = await startCallbackServer({
      projectDir,
      sessionToken: "token",
      handleSignals: false,
    });
    expect(server.port).toBeGreaterThan(0);
    await expect(server.close()).resolves.toBeUndefined();
  });
});
