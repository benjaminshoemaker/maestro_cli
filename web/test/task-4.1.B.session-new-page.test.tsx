import { render, screen, waitFor } from "@testing-library/react";

const replace = jest.fn();

let searchParams = new URLSearchParams("");

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

describe("Task 4.1.B /session/new handler", () => {
  beforeEach(() => {
    replace.mockClear();
    searchParams = new URLSearchParams("");
    sessionStorage.clear();
  });

  test("shows a helpful error when required params are missing", async () => {
    const SessionNewPage = require("../app/session/new/page").default;
    render(<SessionNewPage />);

    expect(await screen.findByText(/missing required parameters/i)).toBeInTheDocument();
  });

  test("creates/resumes session and redirects to current phase with port+token", async () => {
    const originalFetch = globalThis.fetch;

    try {
      searchParams = new URLSearchParams(
        "callback=localhost:50045&token=session-token&project=phase3-e2e",
      );

      globalThis.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          sessionId: "session-1",
          sessionToken: "session-token",
          currentPhase: 2,
          isNewProject: false,
        }),
      })) as any;

      const SessionNewPage = require("../app/session/new/page").default;
      render(<SessionNewPage />);

      await waitFor(() => {
        expect(replace).toHaveBeenCalledWith("/session/session-1/phase/2?port=50045&token=session-token");
      });

      const fetchCall = (globalThis.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe("/api/sessions");
      expect(JSON.parse(fetchCall[1].body)).toMatchObject({
        projectName: "phase3-e2e",
        callbackPort: 50045,
        sessionToken: "session-token",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("redirects to login when unauthorized", async () => {
    const originalFetch = globalThis.fetch;

    try {
      searchParams = new URLSearchParams(
        "callback=localhost:50045&token=session-token&project=phase3-e2e",
      );

      globalThis.fetch = jest.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      })) as any;

      const SessionNewPage = require("../app/session/new/page").default;
      render(<SessionNewPage />);

      await waitFor(() => {
        const arg = replace.mock.calls[0]?.[0] ?? "";
        expect(arg).toContain("/login?next=");
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
