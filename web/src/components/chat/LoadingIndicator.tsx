export function LoadingIndicator() {
  return (
    <div
      className="flex items-center gap-2 text-sm text-neutral-500"
      aria-live="polite"
      data-testid="loading-indicator"
    >
      <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-neutral-400" />
      <span>Assistant is typing…</span>
    </div>
  );
}

