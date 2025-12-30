import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { readMaestroConfig } from "../src/utils/maestro-config";
import { scaffoldProject } from "../src/utils/scaffold";

function uniqueTempDir(name: string) {
  return join(tmpdir(), `maestro-cli-${name}-${Date.now()}-${Math.random()}`);
}

describe("Phase 1 - init/server integration helpers", () => {
  it("reads session token from scaffolded config", async () => {
    const projectDir = uniqueTempDir("project");
    await mkdir(projectDir, { recursive: true });

    const { sessionToken } = await scaffoldProject({
      projectDir,
      projectName: "my-project",
    });
    const config = await readMaestroConfig(projectDir);

    expect(config.sessionToken).toBe(sessionToken);
  });
});

