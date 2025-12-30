import { render, screen } from "@testing-library/react";

import { ChatContainer } from "../src/components/chat/ChatContainer";

describe("Task 3.1.D chat page layout", () => {
  test("displays project name in header", () => {
    render(
      <ChatContainer
        sessionId="session-1"
        phase={2}
        projectName="My Project"
        completedPhases={[1]}
      />,
    );

    expect(screen.getByTestId("chat-header-project-name")).toHaveTextContent("My Project");
  });

  test("shows PhaseIndicator and DoneButton in header area", () => {
    render(
      <ChatContainer
        sessionId="session-1"
        phase={2}
        projectName="My Project"
        completedPhases={[1]}
      />,
    );

    expect(screen.getByTestId("phase-indicator-current")).toBeInTheDocument();
    expect(screen.getByTestId("done-button")).toBeInTheDocument();
  });

  test("MessageList fills available space with scrolling and ChatInput is fixed at bottom", () => {
    render(
      <ChatContainer
        sessionId="session-1"
        phase={2}
        projectName="My Project"
        completedPhases={[1]}
      />,
    );

    const scrollArea = screen.getByTestId("chat-message-scroll-area");
    expect(scrollArea.className).toContain("flex-1");
    expect(scrollArea.className).toContain("overflow-y-auto");

    const inputArea = screen.getByTestId("chat-input-area");
    expect(inputArea.className).toContain("sticky");
    expect(inputArea.className).toContain("bottom-0");
  });

  test("uses a responsive layout container", () => {
    render(
      <ChatContainer
        sessionId="session-1"
        phase={2}
        projectName="My Project"
        completedPhases={[1]}
      />,
    );

    const root = screen.getByTestId("chat-container");
    expect(root.className).toContain("min-h-dvh");
    expect(root.className).toContain("max-w-3xl");
  });
});

