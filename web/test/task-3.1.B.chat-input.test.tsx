import { fireEvent, render, screen } from "@testing-library/react";

import { ChatInput } from "../src/components/chat/ChatInput";

describe("Task 3.1.B chat input", () => {
  test("has an auto-resizing textarea", () => {
    render(<ChatInput onSubmit={jest.fn()} />);

    const textarea = screen.getByTestId("chat-input-textarea") as HTMLTextAreaElement;

    Object.defineProperty(textarea, "scrollHeight", {
      value: 123,
      configurable: true,
    });

    fireEvent.change(textarea, { target: { value: "Hello\nWorld" } });

    expect(textarea.style.height).toBe("123px");
  });

  test("submit button sends message on click", () => {
    const onSubmit = jest.fn();
    render(<ChatInput onSubmit={onSubmit} />);

    const textarea = screen.getByTestId("chat-input-textarea");
    fireEvent.change(textarea, { target: { value: "Hello" } });

    fireEvent.click(screen.getByTestId("chat-input-submit"));
    expect(onSubmit).toHaveBeenCalledWith("Hello");
  });

  test("Enter submits, Shift+Enter inserts newline", () => {
    const onSubmit = jest.fn();
    render(<ChatInput onSubmit={onSubmit} />);

    const textarea = screen.getByTestId("chat-input-textarea");
    fireEvent.change(textarea, { target: { value: "Hello" } });

    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("Hello");

    onSubmit.mockClear();
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("input is disabled while waiting for response", () => {
    render(<ChatInput onSubmit={jest.fn()} isSubmitting />);

    expect(screen.getByTestId("chat-input-textarea")).toBeDisabled();
    expect(screen.getByTestId("chat-input-submit")).toBeDisabled();
  });

  test("submit button shows loading state during submission", () => {
    render(<ChatInput onSubmit={jest.fn()} isSubmitting />);
    expect(screen.getByTestId("chat-input-submit")).toHaveTextContent("Sending");
  });

  test("empty messages cannot be submitted", () => {
    const onSubmit = jest.fn();
    render(<ChatInput onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId("chat-input-submit"));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId("chat-input-textarea"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByTestId("chat-input-submit"));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

