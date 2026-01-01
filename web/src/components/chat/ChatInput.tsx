"use client";

import { useLayoutEffect, useRef, useState } from "react";

type ChatInputProps = {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  isSubmitting?: boolean;
};

export function ChatInput({ onSubmit, disabled, isSubmitting }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isDisabled = Boolean(disabled || isSubmitting);

  function resizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }

  useLayoutEffect(() => {
    resizeTextarea();
  }, [value]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-2 shadow-sm transition-all duration-200 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          className="min-h-[2.75rem] max-h-[200px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-primary placeholder:text-muted outline-none disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Type your message..."
          rows={1}
          value={value}
          disabled={isDisabled}
          data-testid="chat-input-textarea"
          aria-label="Message input"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!isDisabled) submit();
            }
          }}
        />
        <button
          type="button"
          className="btn-accent mb-0.5 h-10 shrink-0 gap-2 px-4 text-sm"
          onClick={submit}
          disabled={isDisabled || !value.trim()}
          aria-busy={isSubmitting ? "true" : undefined}
          aria-label={isSubmitting ? "Sending message" : "Send message"}
          data-testid="chat-input-submit"
        >
          {isSubmitting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              Send
            </>
          )}
        </button>
      </div>
      <p className="mt-1 px-3 text-xs text-muted">
        Press <kbd className="rounded bg-surface-secondary px-1 py-0.5 font-mono text-[10px]">Enter</kbd> to send,{" "}
        <kbd className="rounded bg-surface-secondary px-1 py-0.5 font-mono text-[10px]">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
