export function LoadingIndicator() {
  return (
    <div
      className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
      aria-live="polite"
      role="status"
      data-testid="loading-indicator"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-light">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-accent"
          aria-hidden="true"
        >
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
      </div>
      <div className="flex flex-col gap-1 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
        <span className="sr-only">Assistant is typing...</span>
      </div>
    </div>
  );
}
