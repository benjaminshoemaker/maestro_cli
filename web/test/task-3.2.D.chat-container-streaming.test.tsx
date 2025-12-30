import { fireEvent, render, screen } from "@testing-library/react";

import { ChatContainer } from "../src/components/chat/ChatContainer";

const append = jest.fn();

jest.mock("../src/hooks/useSessionChat", () => ({
  useSessionChat: () => ({
    messages: [
      { id: "assistant-1", role: "assistant", content: "**Hello** _world_" },
      { id: "user-1", role: "user", content: "Hi" },
      { id: "system-1", role: "system", content: "Ignore me" },
    ],
    append,
    isLoading: false,
    isLoadingHistory: false,
    historyError: undefined,
  }),
}));

describe("Task 3.2 chat container streaming integration", () => {
  beforeEach(() => {
    append.mockClear();
  });

  test("renders persisted user+assistant messages and submits via append()", () => {
    render(
      <ChatContainer
        sessionId="session-1"
        phase={1}
        projectName="Project"
        completedPhases={[]}
        callbackPort={3847}
        sessionToken="token"
      />,
    );

    expect(screen.getByTestId("user-message")).toHaveTextContent("Hi");
    expect(screen.getByText("Hello")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("chat-input-textarea"), {
      target: { value: "New message" },
    });
    fireEvent.click(screen.getByTestId("chat-input-submit"));

    expect(append).toHaveBeenCalledWith({ role: "user", content: "New message" });
  });
});

