"use client";

import { useState } from "react";

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Copy document"
      data-testid="fallback-dialog"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Couldn’t save to your machine</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Copy the generated document below and save it as <span className="font-semibold">{filename}</span>.
            </p>
            {errorMessage ? (
              <p className="mt-2 text-sm text-rose-700">{errorMessage}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white hover:bg-neutral-800"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(content);
                setCopyStatus("copied");
              } catch {
                setCopyStatus("failed");
              }
            }}
          >
            Copy to clipboard
          </button>
          <span className="text-sm text-neutral-600">
            {copyStatus === "copied"
              ? "Copied."
              : copyStatus === "failed"
                ? "Copy failed."
                : null}
          </span>
        </div>

        <pre
          className="mt-4 max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-900"
          data-testid="fallback-dialog-content"
        >
          {content}
        </pre>
      </div>
    </div>
  );
}

