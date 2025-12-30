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
    textarea.style.height = `${textarea.scrollHeight}px`;
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
    <div className="flex items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-3">
      <textarea
        ref={textareaRef}
        className="min-h-[2.5rem] flex-1 resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm leading-relaxed text-neutral-900 outline-none focus:border-neutral-400 disabled:cursor-not-allowed disabled:bg-neutral-50"
        placeholder="Type your message…"
        rows={1}
        value={value}
        disabled={isDisabled}
        data-testid="chat-input-textarea"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey) return;
          event.preventDefault();
          if (isDisabled) return;
          submit();
        }}
      />
      <button
        type="button"
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
        onClick={submit}
        disabled={isDisabled}
        aria-busy={isSubmitting ? "true" : undefined}
        data-testid="chat-input-submit"
      >
        {isSubmitting ? "Sending…" : "Send"}
      </button>
    </div>
  );
}

