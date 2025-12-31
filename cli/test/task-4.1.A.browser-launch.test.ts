import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { buildSessionNewUrl, getAppUrl } from "../src/utils/browser";

describe("Task 4.1.A browser launch utils", () => {
  it("builds the /session/new URL with callback, token, and project params", () => {
    const url = buildSessionNewUrl({
      appUrl: "https://maestro-cli-web.vercel.app",
      callbackPort: 50045,
      token: "session-token",
      projectName: "phase3-e2e",
    });

    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://maestro-cli-web.vercel.app");
    expect(parsed.pathname).toBe("/session/new");
    expect(parsed.searchParams.get("callback")).toBe("localhost:50045");
    expect(parsed.searchParams.get("token")).toBe("session-token");
    expect(parsed.searchParams.get("project")).toBe("phase3-e2e");
  });

  it("prefers MAESTRO_APP_URL over MAESTRO_API_BASE_URL", () => {
    expect(
      getAppUrl({
        MAESTRO_APP_URL: "https://app.example.com",
        MAESTRO_API_BASE_URL: "https://api.example.com",
      }),
    ).toBe("https://app.example.com");
  });
});

describe("Task 4.1.A init command launches browser", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    logSpy.mockClear();
  });

  it("calls launchSessionInBrowser with the callback port and session token", async () => {
    vi.doMock("../src/utils/network", async () => {
      const actual = await vi.importActual<any>("../src/utils/network");
      return {
        ...actual,
        assertInternetConnectivity: vi.fn(async () => undefined),
      };
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

    vi.doMock("../src/server", () => ({
      startCallbackServer: vi.fn(async () => ({
        port: 50045,
        close: async () => undefined,
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

    const { createInitCommand } = await import("../src/commands/init");
    const command = createInitCommand();

    await command.parseAsync(["phase3-e2e"], { from: "user" });

    expect(launchSessionInBrowser).toHaveBeenCalledWith({
      appUrl: "https://example.com",
      callbackPort: 50045,
      token: "test-token",
      projectName: "phase3-e2e",
    });
  });
});
