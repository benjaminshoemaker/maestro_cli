import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { prepareProjectDirectory } from "../src/utils/directory";

function uniqueTempDir(name: string) {
  return join(tmpdir(), `maestro-cli-${name}-${Date.now()}-${Math.random()}`);
}

describe("Task 1.2.C - directory existence checks", () => {
  it("creates directory when it does not exist", async () => {
    const cwd = uniqueTempDir("cwd");
    await mkdir(cwd, { recursive: true });

    const result = await prepareProjectDirectory("new-project", { cwd });
    expect(result.projectDir).toContain("new-project");
    expect(result.isResume).toBe(false);
  });

  it("exits with code 3 if directory exists without .maestro", async () => {
    const cwd = uniqueTempDir("cwd");
    const projectDir = join(cwd, "existing");
    await mkdir(projectDir, { recursive: true });

    await expect(prepareProjectDirectory("existing", { cwd })).rejects.toMatchObject(
      { exitCode: 3 },
    );
  });

  it("prompts resume and exits with code 4 when declined", async () => {
    const cwd = uniqueTempDir("cwd");
    const projectDir = join(cwd, "existing-maestro");
    await mkdir(join(projectDir, ".maestro"), { recursive: true });
    await writeFile(join(projectDir, ".maestro", "config.json"), "{}");

    await expect(
      prepareProjectDirectory("existing-maestro", {
        cwd,
        confirmResume: async () => false,
      }),
    ).rejects.toMatchObject({ exitCode: 4 });
  });

  it("returns resume when accepted", async () => {
    const cwd = uniqueTempDir("cwd");
    const projectDir = join(cwd, "existing-maestro-yes");
    await mkdir(join(projectDir, ".maestro"), { recursive: true });

    await expect(
      prepareProjectDirectory("existing-maestro-yes", {
        cwd,
        confirmResume: async () => true,
      }),
    ).resolves.toMatchObject({ isResume: true });
  });
});

