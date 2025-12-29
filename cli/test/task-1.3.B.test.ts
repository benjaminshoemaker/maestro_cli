import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { formatFileTree } from "../src/utils/filetree";
import { scaffoldProject } from "../src/utils/scaffold";

function uniqueTempDir(name: string) {
  return join(tmpdir(), `maestro-cli-${name}-${Date.now()}-${Math.random()}`);
}

describe("Task 1.3.B - scaffolding file writing", () => {
  it("creates directories and writes expected files", async () => {
    const projectDir = uniqueTempDir("project");
    await mkdir(projectDir, { recursive: true });

    const { sessionToken, createdPaths } = await scaffoldProject({
      projectDir,
      projectName: "my-project",
    });

    const configPath = join(projectDir, ".maestro", "config.json");
    const config = JSON.parse(await readFile(configPath, "utf8")) as Record<
      string,
      unknown
    >;

    expect(config.sessionToken).toBe(sessionToken);
    expect(sessionToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    expect(createdPaths).toEqual(
      expect.arrayContaining([
        configPath,
        join(projectDir, ".claude", "settings.json"),
        join(projectDir, ".claude", "skills", "code-verification", "SKILL.md"),
        join(projectDir, ".codex", "config.toml"),
        join(projectDir, "CLAUDE.md"),
        join(projectDir, "AGENTS.md"),
      ]),
    );
  });

  it("prints a file tree containing created paths", async () => {
    const projectDir = uniqueTempDir("project");
    await mkdir(projectDir, { recursive: true });

    const { createdPaths } = await scaffoldProject({
      projectDir,
      projectName: "my-project",
    });

    const tree = formatFileTree({ projectDir, createdPaths });
    expect(tree).toContain(".maestro/config.json");
    expect(tree).toContain(".claude/settings.json");
    expect(tree).toContain(".codex/config.toml");
  });
});

