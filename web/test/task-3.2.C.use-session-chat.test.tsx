import { render, waitFor } from "@testing-library/react";

import { useSessionChat } from "../src/hooks/useSessionChat";

const useChatMock = jest.fn();

jest.mock("ai/react", () => ({
  useChat: (...args: any[]) => useChatMock(...args),
}));

function Harness(props: { sessionId: string; phase: 1 | 2 | 3 | 4 }) {
  useSessionChat(props);
  return null;
}

describe("Task 3.2.C useSessionChat hook", () => {
  beforeEach(() => {
    useChatMock.mockReset();
  });

  test("configures useChat to call /api/chat with session context", async () => {
    const originalFetch = globalThis.fetch;

    useChatMock.mockReturnValue({
      messages: [],
      setMessages: jest.fn(),
      input: "",
      setInput: jest.fn(),
      handleInputChange: jest.fn(),
      handleSubmit: jest.fn(),
      append: jest.fn(),
      reload: jest.fn(),
      stop: jest.fn(),
      isLoading: false,
      error: undefined,
      data: undefined,
      setData: jest.fn(),
    });

    try {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [] }),
      } as any);

      render(<Harness sessionId="session-1" phase={2} />);

      await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(useChatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        api: "/api/chat",
        body: { sessionId: "session-1", phase: 2 },
      }),
    );
  });

  test("loads existing messages from server on mount", async () => {
    const originalFetch = globalThis.fetch;
    const setMessages = jest.fn();

    useChatMock.mockReturnValue({
      messages: [],
      setMessages,
      input: "",
      setInput: jest.fn(),
      handleInputChange: jest.fn(),
      handleSubmit: jest.fn(),
      append: jest.fn(),
      reload: jest.fn(),
      stop: jest.fn(),
      isLoading: false,
      error: undefined,
      data: undefined,
      setData: jest.fn(),
    });

    try {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          messages: [{ id: "m1", role: "user", content: "Hello" }],
        }),
      } as any);

      render(<Harness sessionId="session-1" phase={1} />);

      await waitFor(() =>
        expect(globalThis.fetch).toHaveBeenCalledWith(
          "/api/chat?sessionId=session-1&phase=1",
          expect.anything(),
        ),
      );

      await waitFor(() =>
        expect(setMessages).toHaveBeenCalledWith([
          { id: "m1", role: "user", content: "Hello" },
        ]),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
