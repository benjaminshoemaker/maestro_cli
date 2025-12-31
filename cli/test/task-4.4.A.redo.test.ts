import { mkdir, writeFile, stat, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

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

describe("Task 4.4.A redo command", () => {
  const cwd = process.cwd();
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.chdir(cwd);
    logSpy.mockClear();
  });

  it("rejects invalid phase numbers", async () => {
    vi.doMock("../src/utils/network", async () => {
      const actual = await vi.importActual<any>("../src/utils/network");
      return { ...actual, assertInternetConnectivity: vi.fn(async () => undefined) };
    });
    vi.doMock("../src/utils/validations", () => ({
      assertNodeVersionSupported: vi.fn(() => undefined),
    }));

    const { createRedoCommand } = await import("../src/commands/redo");
    const command = createRedoCommand();

    await expect(command.parseAsync(["5"], { from: "user" })).rejects.toMatchObject({
      exitCode: 1,
    });
  });

  it("fails when not run inside a Maestro project", async () => {
    const projectDir = uniqueTempDir("redo-not-maestro");
    await mkdir(projectDir, { recursive: true });
    process.chdir(projectDir);

    vi.doMock("../src/utils/network", async () => {
      const actual = await vi.importActual<any>("../src/utils/network");
      return { ...actual, assertInternetConnectivity: vi.fn(async () => undefined) };
    });
    vi.doMock("../src/utils/validations", () => ({
      assertNodeVersionSupported: vi.fn(() => undefined),
    }));

    const { createRedoCommand } = await import("../src/commands/redo");
    const command = createRedoCommand();

    await expect(command.parseAsync(["1"], { from: "user" })).rejects.toMatchObject({
      exitCode: 3,
    });
  });

  it("backs up existing document when user chooses keep and opens browser to phase URL", async () => {
    const projectDir = uniqueTempDir("redo-project");
    await mkdir(projectDir, { recursive: true });
    await mkdir(join(projectDir, "specs"), { recursive: true });
    await writeConfig({ projectDir, projectName: "my-project", sessionToken: "token-1" });

    const docPath = join(projectDir, "specs", "PRODUCT_SPEC.md");
    await writeFile(docPath, "# existing\n", "utf8");

    process.chdir(projectDir);

    vi.doMock("../src/utils/network", async () => {
      const actual = await vi.importActual<any>("../src/utils/network");
      return { ...actual, assertInternetConnectivity: vi.fn(async () => undefined) };
    });

    vi.doMock("../src/utils/validations", () => ({
      assertNodeVersionSupported: vi.fn(() => undefined),
    }));

    const close = vi.fn(async () => undefined);
    vi.doMock("../src/server", () => ({
      startCallbackServer: vi.fn(async () => ({
        port: 50045,
        close,
        waitForSave: vi.fn(),
      })),
    }));

    const launchSessionPhaseInBrowser = vi.fn(async () => "https://example.com/session/session-1/phase/1");
    vi.doMock("../src/utils/browser", async () => {
      const actual = await vi.importActual<any>("../src/utils/browser");
      return {
        ...actual,
        getAppUrl: () => "https://example.com",
        launchSessionPhaseInBrowser,
      };
    });

    vi.doMock("../src/utils/session", () => ({
      validateSession: vi.fn(async () => ({
        status: "valid",
        sessionId: "session-1",
        currentPhase: 2,
      })),
    }));

    vi.doMock("../src/utils/wait", () => ({
      waitForDocument: vi.fn(async () => ({
        phase: 1,
        filename: "PRODUCT_SPEC.md",
        path: docPath,
      })),
    }));

    const prompt = vi.fn(async () => ({ action: "keep" }));
    vi.doMock("inquirer", () => ({ default: { prompt } }));

    const { createRedoCommand } = await import("../src/commands/redo");
    const command = createRedoCommand();

    await command.parseAsync(["1"], { from: "user" });

    const backups = await readdir(join(projectDir, ".maestro", "backups"));
    expect(backups.some((name) => name.startsWith("PRODUCT_SPEC.") && name.endsWith(".bak.md"))).toBe(
      true,
    );

    expect(launchSessionPhaseInBrowser).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-1",
        phase: 1,
        callbackPort: 50045,
        token: "token-1",
      }),
    );

    await expect(stat(join(projectDir, ".maestro", "backups"))).resolves.toBeDefined();
    expect(close).toHaveBeenCalledTimes(1);
  });
});

