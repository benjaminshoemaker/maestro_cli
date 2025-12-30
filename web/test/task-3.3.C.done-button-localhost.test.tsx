import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { DoneButton } from "../src/components/chat/DoneButton";

describe("Task 3.3.C DoneButton localhost callback", () => {
  test("generates document, POSTs to localhost with session token, then completes phase", async () => {
    const originalFetch = globalThis.fetch;
    const onComplete = jest.fn();

    try {
      globalThis.fetch = jest.fn(async (input: any, init: any) => {
        const url = typeof input === "string" ? input : input?.url;

        if (url === "/api/generate-document") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ filename: "PRODUCT_SPEC.md", document: "# Doc" }),
          } as any;
        }

        if (url === "http://localhost:3847/save") {
          expect(init.headers.authorization).toBe("Bearer session-token");
          const body = JSON.parse(init.body);
          expect(body).toEqual({ phase: 1, filename: "PRODUCT_SPEC.md", content: "# Doc" });
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, path: "specs/PRODUCT_SPEC.md" }),
          } as any;
        }

        if (url === "/api/sessions/session-1/phase/1/complete") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, nextPhase: 2 }),
          } as any;
        }

        return { ok: false, status: 500, json: async () => ({ error: "Unexpected request" }) } as any;
      }) as any;

      render(
        <DoneButton
          sessionId="session-1"
          phase={1}
          callbackPort={3847}
          sessionToken="session-token"
          onComplete={onComplete}
        />,
      );

      fireEvent.click(screen.getByTestId("done-button"));
      fireEvent.click(screen.getByTestId("confirm-dialog-confirm"));

      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(2));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("on localhost failure, shows fallback dialog with copy option", async () => {
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = jest.fn(async (input: any) => {
        const url = typeof input === "string" ? input : input?.url;

        if (url === "/api/generate-document") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ filename: "PRODUCT_SPEC.md", document: "# Doc" }),
          } as any;
        }

        if (url === "http://localhost:3847/save") {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: "Connection refused" }),
          } as any;
        }

        return { ok: false, status: 500, json: async () => ({ error: "Unexpected request" }) } as any;
      }) as any;

      render(
        <DoneButton
          sessionId="session-1"
          phase={1}
          callbackPort={3847}
          sessionToken="session-token"
        />,
      );

      fireEvent.click(screen.getByTestId("done-button"));
      fireEvent.click(screen.getByTestId("confirm-dialog-confirm"));

      expect(await screen.findByTestId("fallback-dialog")).toBeInTheDocument();
      expect(screen.getByText("Copy to clipboard")).toBeInTheDocument();
      expect(screen.getByTestId("fallback-dialog-content")).toHaveTextContent("# Doc");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
