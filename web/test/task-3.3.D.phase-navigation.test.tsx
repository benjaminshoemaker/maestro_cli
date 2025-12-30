import { render, screen, waitFor } from "@testing-library/react";

const push = jest.fn();
const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams("port=3847&token=session-token"),
}));

jest.mock("../src/components/chat/ChatContainer", () => ({
  ChatContainer: (props: any) => {
    if (typeof props.onPhaseComplete === "function") {
      props.onPhaseComplete(2);
    }
    return <div data-testid="mock-chat-container" />;
  },
}));

describe("Task 3.3.D phase navigation", () => {
  test("cannot navigate to future phases until prior complete", async () => {
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          session: {
            id: "session-1",
            projectName: "Test Project",
            currentPhase: 2,
            phases: {
              1: { complete: true, document: "# Phase 1" },
              2: { complete: false, document: null },
              3: { complete: false, document: null },
              4: { complete: false, document: null },
            },
          },
        }),
      })) as any;

      const SessionPhasePage = require("../app/session/[id]/phase/[phase]/page").default;
      render(<SessionPhasePage params={{ id: "session-1", phase: "3" }} />);

      await waitFor(() => {
        expect(replace).toHaveBeenCalledWith(
          "/session/session-1/phase/2?port=3847&token=session-token",
        );
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("after phase complete, redirects to next phase", async () => {
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          session: {
            id: "session-1",
            projectName: "Test Project",
            currentPhase: 1,
            phases: {
              1: { complete: false, document: null },
              2: { complete: false, document: null },
              3: { complete: false, document: null },
              4: { complete: false, document: null },
            },
          },
        }),
      })) as any;

      const SessionPhasePage = require("../app/session/[id]/phase/[phase]/page").default;
      render(<SessionPhasePage params={{ id: "session-1", phase: "1" }} />);

      await waitFor(() => {
        expect(push).toHaveBeenCalledWith(
          "/session/session-1/phase/2?port=3847&token=session-token",
        );
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("after phase 4 complete, shows Project Complete message", async () => {
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          session: {
            id: "session-1",
            projectName: "Test Project",
            currentPhase: null,
            phases: {
              1: { complete: true, document: "# Phase 1" },
              2: { complete: true, document: "# Phase 2" },
              3: { complete: true, document: "# Phase 3" },
              4: { complete: true, document: "# Phase 4" },
            },
          },
        }),
      })) as any;

      const SessionPhasePage = require("../app/session/[id]/phase/[phase]/page").default;
      render(<SessionPhasePage params={{ id: "session-1", phase: "4" }} />);

      expect(await screen.findByText("Project Complete")).toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
