import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("Task 4.2.B phase transition flow", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    logSpy.mockClear();
  });

  it("prompts to continue and opens browser for next phase", async () => {
    vi.doMock("../src/utils/network", async () => {
      const actual = await vi.importActual<any>("../src/utils/network");
      return { ...actual, assertInternetConnectivity: vi.fn(async () => undefined) };
    });

    vi.doMock("../src/utils/validations", () => ({
      assertNodeVersionSupported: vi.fn(() => undefined),
      assertValidProjectName: vi.fn(() => undefined),
    }));

    vi.doMock("../src/utils/directory", () => ({
      prepareProjectDirectory: vi.fn(async () => ({
        projectDir: "/tmp/maestro-test",
        isResume: false,
      })),
    }));

    vi.doMock("../src/utils/scaffold", () => ({
      scaffoldProject: vi.fn(async () => ({
        sessionToken: "test-token",
        createdPaths: [],
      })),
    }));

    vi.doMock("../src/utils/filetree", () => ({
      formatFileTree: vi.fn(() => ""),
    }));

    const close = vi.fn(async () => undefined);

    vi.doMock("../src/server", () => ({
      startCallbackServer: vi.fn(async () => ({
        port: 50045,
        close,
        waitForSave: vi.fn(),
      })),
    }));

    const launchSessionInBrowser = vi.fn(async () => "https://example.com/session/new");
    const getAppUrl = vi.fn(() => "https://example.com");

    vi.doMock("../src/utils/browser", async () => {
      const actual = await vi.importActual<any>("../src/utils/browser");
      return {
        ...actual,
        getAppUrl,
        launchSessionInBrowser,
      };
    });

    const waitForDocument = vi
      .fn()
      .mockResolvedValueOnce({
        phase: 1,
        filename: "PRODUCT_SPEC.md",
        path: "/tmp/PRODUCT_SPEC.md",
      })
      .mockResolvedValueOnce({
        phase: 4,
        filename: "AGENTS.md",
        path: "/tmp/AGENTS.md",
      });

    vi.doMock("../src/utils/wait", () => ({ waitForDocument }));

    const prompt = vi.fn(async () => ({ continue: true }));
    vi.doMock("inquirer", () => ({ default: { prompt } }));

    const { createInitCommand } = await import("../src/commands/init");
    const command = createInitCommand();

    await command.parseAsync(["phase3-e2e"], { from: "user" });

    expect(prompt).toHaveBeenCalled();
    expect(launchSessionInBrowser).toHaveBeenCalledTimes(2);
    expect(waitForDocument).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("exits after showing resume instructions when user declines to continue", async () => {
    vi.doMock("../src/utils/network", async () => {
      const actual = await vi.importActual<any>("../src/utils/network");
      return { ...actual, assertInternetConnectivity: vi.fn(async () => undefined) };
    });

    vi.doMock("../src/utils/validations", () => ({
      assertNodeVersionSupported: vi.fn(() => undefined),
      assertValidProjectName: vi.fn(() => undefined),
    }));

    vi.doMock("../src/utils/directory", () => ({
      prepareProjectDirectory: vi.fn(async () => ({
        projectDir: "/tmp/maestro-test",
        isResume: false,
      })),
    }));

    vi.doMock("../src/utils/scaffold", () => ({
      scaffoldProject: vi.fn(async () => ({
        sessionToken: "test-token",
        createdPaths: [],
      })),
    }));

    vi.doMock("../src/utils/filetree", () => ({
      formatFileTree: vi.fn(() => ""),
    }));

    const close = vi.fn(async () => undefined);

    vi.doMock("../src/server", () => ({
      startCallbackServer: vi.fn(async () => ({
        port: 50045,
        close,
        waitForSave: vi.fn(),
      })),
    }));

    const launchSessionInBrowser = vi.fn(async () => "https://example.com/session/new");
    const getAppUrl = vi.fn(() => "https://example.com");

    vi.doMock("../src/utils/browser", async () => {
      const actual = await vi.importActual<any>("../src/utils/browser");
      return {
        ...actual,
        getAppUrl,
        launchSessionInBrowser,
      };
    });

    const waitForDocument = vi.fn().mockResolvedValueOnce({
      phase: 1,
      filename: "PRODUCT_SPEC.md",
      path: "/tmp/PRODUCT_SPEC.md",
    });

    vi.doMock("../src/utils/wait", () => ({ waitForDocument }));

    const prompt = vi.fn(async () => ({ continue: false }));
    vi.doMock("inquirer", () => ({ default: { prompt } }));

    const { createInitCommand } = await import("../src/commands/init");
    const command = createInitCommand();

    await command.parseAsync(["phase3-e2e"], { from: "user" });

    expect(launchSessionInBrowser).toHaveBeenCalledTimes(1);
    expect(waitForDocument).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalled();
  });
});

