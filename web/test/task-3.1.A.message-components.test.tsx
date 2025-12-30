import { render, screen } from "@testing-library/react";

import { AssistantMessage } from "../src/components/chat/AssistantMessage";
import { MessageList } from "../src/components/chat/MessageList";
import { UserMessage } from "../src/components/chat/UserMessage";

describe("Task 3.1.A message components", () => {
  test("MessageList renders an array of messages", () => {
    render(
      <MessageList
        messages={[
          { id: "m1", role: "user", content: "Hello" },
          { id: "m2", role: "assistant", content: "Hi!" },
        ]}
      />,
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi!")).toBeInTheDocument();
  });

  test("UserMessage displays user messages with bubble styling", () => {
    render(<UserMessage content="Test user message" />);

    const bubble = screen.getByTestId("user-message");
    expect(bubble).toHaveTextContent("Test user message");
    expect(bubble.className).toContain("bg-neutral-900");
    expect(bubble.className).toContain("text-white");
  });

  test("AssistantMessage renders markdown content using react-markdown", () => {
    render(<AssistantMessage content={"Hello **world**"} />);

    const strong = screen.getByText("world");
    expect(strong.tagName.toLowerCase()).toBe("strong");
  });

  test("AssistantMessage enables remark-gfm for GitHub-flavored markdown", () => {
    const { container } = render(<AssistantMessage content={"~~strike~~"} />);
    const del = container.querySelector("del");
    expect(del).not.toBeNull();
    expect(del).toHaveTextContent("strike");
  });

  test("MessageList shows a loading indicator when assistant is typing", () => {
    render(
      <MessageList
        messages={[{ id: "m1", role: "user", content: "Hello" }]}
        isAssistantTyping
      />,
    );

    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });

  test("MessageList scrolls to bottom on new message", () => {
    const scrollIntoView = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HTMLElement.prototype as any).scrollIntoView = scrollIntoView;

    const { rerender } = render(
      <MessageList messages={[{ id: "m1", role: "user", content: "Hello" }]} />,
    );

    rerender(
      <MessageList
        messages={[
          { id: "m1", role: "user", content: "Hello" },
          { id: "m2", role: "assistant", content: "Hi!" },
        ]}
      />,
    );

    expect(scrollIntoView).toHaveBeenCalled();
  });
});

