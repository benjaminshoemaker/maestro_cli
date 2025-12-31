import { mkdir, writeFile, readFile } from "node:fs/promises";
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

describe("Task 4.3.B init resume flow", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    logSpy.mockClear();
  });

  it("validates session and continues when valid", async () => {
    const projectDir = uniqueTempDir("resume-valid");
    await mkdir(projectDir, { recursive: true });
    await writeConfig({ projectDir, projectName: "my-project", sessionToken: "token-1" });

    vi.doMock("../src/utils/network", async () => {
      const actual = await vi.importActual<any>("../src/utils/network");
      return { ...actual, assertInternetConnectivity: vi.fn(async () => undefined) };
    });

    vi.doMock("../src/utils/validations", () => ({
      assertNodeVersionSupported: vi.fn(() => undefined),
      assertValidProjectName: vi.fn(() => undefined),
    }));

    vi.doMock("../src/utils/directory", () => ({
      prepareProjectDirectory: vi.fn(async () => ({ projectDir, isResume: true })),
    }));

    const close = vi.fn(async () => undefined);
    const startCallbackServer = vi.fn(async () => ({
      port: 50045,
      close,
      waitForSave: vi.fn(),
    }));
    vi.doMock("../src/server", () => ({ startCallbackServer }));

    const launchSessionInBrowser = vi.fn(async () => "https://example.com/session/new");
    vi.doMock("../src/utils/browser", async () => {
      const actual = await vi.importActual<any>("../src/utils/browser");
      return { ...actual, getAppUrl: () => "https://example.com", launchSessionInBrowser };
    });

    vi.doMock("../src/utils/wait", () => ({
      waitForDocument: vi.fn(async () => ({
        phase: 4,
        filename: "AGENTS.md",
        path: join(projectDir, "AGENTS.md"),
      })),
    }));

    vi.doMock("../src/utils/session", () => ({
      validateSessionFromConfig: vi.fn(async () => ({
        status: "valid",
        currentPhase: 3,
        projectName: "my-project",
      })),
    }));

    const { createInitCommand } = await import("../src/commands/init");
    const command = createInitCommand();

    await command.parseAsync(["my-project"], { from: "user" });

    expect(startCallbackServer).toHaveBeenCalledWith({ projectDir, sessionToken: "token-1" });
    expect(launchSessionInBrowser).toHaveBeenCalledWith(
      expect.objectContaining({ token: "token-1", projectName: "my-project" }),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Server session valid"));
  });

  it("offers to start fresh and rewrites config when invalid and accepted", async () => {
    const projectDir = uniqueTempDir("resume-invalid");
    await mkdir(projectDir, { recursive: true });
    await writeConfig({ projectDir, projectName: "my-project", sessionToken: "old-token" });

    vi.doMock("../src/utils/network", async () => {
      const actual = await vi.importActual<any>("../src/utils/network");
      return { ...actual, assertInternetConnectivity: vi.fn(async () => undefined) };
    });

    vi.doMock("../src/utils/validations", () => ({
      assertNodeVersionSupported: vi.fn(() => undefined),
      assertValidProjectName: vi.fn(() => undefined),
    }));

    vi.doMock("../src/utils/directory", () => ({
      prepareProjectDirectory: vi.fn(async () => ({ projectDir, isResume: true })),
    }));

    const close = vi.fn(async () => undefined);
    const startCallbackServer = vi.fn(async () => ({
      port: 50045,
      close,
      waitForSave: vi.fn(),
    }));
    vi.doMock("../src/server", () => ({ startCallbackServer }));

    const launchSessionInBrowser = vi.fn(async () => "https://example.com/session/new");
    vi.doMock("../src/utils/browser", async () => {
      const actual = await vi.importActual<any>("../src/utils/browser");
      return { ...actual, getAppUrl: () => "https://example.com", launchSessionInBrowser };
    });

    vi.doMock("../src/utils/wait", () => ({
      waitForDocument: vi.fn(async () => ({
        phase: 4,
        filename: "AGENTS.md",
        path: join(projectDir, "AGENTS.md"),
      })),
    }));

    vi.doMock("../src/utils/session", () => ({
      validateSessionFromConfig: vi.fn(async () => ({
        status: "invalid",
        projectName: "my-project",
      })),
    }));

    const prompt = vi.fn(async () => ({ startFresh: true }));
    vi.doMock("inquirer", () => ({ default: { prompt } }));

    const { createInitCommand } = await import("../src/commands/init");
    const command = createInitCommand();

    await command.parseAsync(["my-project"], { from: "user" });

    const raw = await readFile(join(projectDir, ".maestro", "config.json"), "utf8");
    const config = JSON.parse(raw) as any;
    expect(config.sessionToken).not.toBe("old-token");

    expect(startCallbackServer).toHaveBeenCalledWith({
      projectDir,
      sessionToken: config.sessionToken,
    });
    expect(launchSessionInBrowser).toHaveBeenCalledWith(
      expect.objectContaining({ token: config.sessionToken }),
    );
  });

  it("exits early when invalid and start fresh is declined", async () => {
    const projectDir = uniqueTempDir("resume-decline");
    await mkdir(projectDir, { recursive: true });
    await writeConfig({ projectDir, projectName: "my-project", sessionToken: "old-token" });

    vi.doMock("../src/utils/network", async () => {
      const actual = await vi.importActual<any>("../src/utils/network");
      return { ...actual, assertInternetConnectivity: vi.fn(async () => undefined) };
    });

    vi.doMock("../src/utils/validations", () => ({
      assertNodeVersionSupported: vi.fn(() => undefined),
      assertValidProjectName: vi.fn(() => undefined),
    }));

    vi.doMock("../src/utils/directory", () => ({
      prepareProjectDirectory: vi.fn(async () => ({ projectDir, isResume: true })),
    }));

    const startCallbackServer = vi.fn(async () => ({
      port: 50045,
      close: vi.fn(async () => undefined),
      waitForSave: vi.fn(),
    }));
    vi.doMock("../src/server", () => ({ startCallbackServer }));

    vi.doMock("../src/utils/session", () => ({
      validateSessionFromConfig: vi.fn(async () => ({
        status: "invalid",
        projectName: "my-project",
      })),
    }));

    const prompt = vi.fn(async () => ({ startFresh: false }));
    vi.doMock("inquirer", () => ({ default: { prompt } }));

    const { createInitCommand } = await import("../src/commands/init");
    const command = createInitCommand();

    await command.parseAsync(["my-project"], { from: "user" });

    expect(startCallbackServer).not.toHaveBeenCalled();
  });
});

