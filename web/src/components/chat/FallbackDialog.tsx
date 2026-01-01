"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FallbackDialogProps = {
  open: boolean;
  filename: string;
  content: string;
  errorMessage?: string;
  onClose: () => void;
};

export function FallbackDialog({
  open,
  filename,
  content,
  errorMessage,
  onClose,
}: FallbackDialogProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = [copyButtonRef.current, closeButtonRef.current].filter(
          Boolean
        ) as HTMLElement[];

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [open, onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      setTimeout(() => copyButtonRef.current?.focus(), 0);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (copyStatus === "copied") {
      const timeout = setTimeout(() => setCopyStatus("idle"), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copyStatus]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fallback-dialog-title"
      data-testid="fallback-dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          aria-label="Close dialog"
        >
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
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="flex flex-col gap-1 pr-10">
          <h2 id="fallback-dialog-title" className="text-lg font-semibold font-serif tracking-tight text-primary">
            Couldn&apos;t save to your machine
          </h2>
          <p className="text-sm text-secondary">
            Copy the generated document below and save it as{" "}
            <code className="rounded-md bg-surface-secondary px-1.5 py-0.5 font-mono text-xs text-primary">
              {filename}
            </code>
          </p>
          {errorMessage ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            ref={copyButtonRef}
            type="button"
            className="btn-primary h-10 gap-2 px-4 text-sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(content);
                setCopyStatus("copied");
              } catch {
                setCopyStatus("failed");
              }
            }}
          >
            {copyStatus === "copied" ? (
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
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Copied!
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
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Copy to clipboard
              </>
            )}
          </button>

          <div className="flex items-center gap-3">
            {copyStatus === "failed" ? (
              <span className="text-sm text-error">Copy failed. Try selecting manually.</span>
            ) : null}
            <button
              ref={closeButtonRef}
              type="button"
              className="btn-secondary h-10 px-4 text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <pre
          className="mt-4 max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-secondary p-4 font-mono text-xs leading-relaxed text-primary"
          data-testid="fallback-dialog-content"
        >
          {content}
        </pre>
      </div>
    </div>
  );
}
