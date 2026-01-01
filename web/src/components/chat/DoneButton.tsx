"use client";

import { useState } from "react";

import { ConfirmDialog } from "./ConfirmDialog";
import { FallbackDialog } from "./FallbackDialog";
import { postDocumentToLocalhost } from "../../lib/localhost";

type DoneButtonProps = {
  onConfirm?: () => void;
  isGenerating?: boolean;

  sessionId?: string;
  phase?: 1 | 2 | 3 | 4;
  callbackPort?: number;
  sessionToken?: string;
  onComplete?: (nextPhase: number | null) => void;
};

export function DoneButton({
  onConfirm,
  isGenerating,
  sessionId,
  phase,
  callbackPort,
  sessionToken,
  onComplete,
}: DoneButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [fallbackFilename, setFallbackFilename] = useState<string>("DOCUMENT.md");
  const [fallbackContent, setFallbackContent] = useState<string>("");
  const [fallbackError, setFallbackError] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const isDisabled = Boolean(isGenerating || isRunning);
  const canRunFlow = Boolean(sessionId && phase && callbackPort && sessionToken);

  return (
    <>
      <button
        type="button"
        className="btn-accent h-11 gap-2 px-5 text-sm font-semibold"
        onClick={() => setConfirmOpen(true)}
        disabled={isDisabled}
        data-testid="done-button"
      >
        {isDisabled ? (
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
            Generating...
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
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Done
          </>
        )}
      </button>

      {error ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-error">
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
          {error}
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Complete this phase?"
        description="This will generate the document and move you to the next phase. You can revisit this phase later if needed."
        confirmLabel="Complete phase"
        cancelLabel="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);

          if (onConfirm) {
            onConfirm();
            return;
          }

          if (!canRunFlow || !sessionId || !phase || !callbackPort || !sessionToken) {
            setError("Missing localhost callback configuration.");
            return;
          }

          setError(null);
          setIsRunning(true);
          setFallbackOpen(false);
          setFallbackError(undefined);

          try {
            const generateResponse = await fetch("/api/generate-document", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ sessionId, phase }),
            });

            if (!generateResponse.ok) {
              const body: any = await generateResponse.json().catch(() => null);
              throw new Error(body?.error ?? `Generate failed with status ${generateResponse.status}`);
            }

            const generated: any = await generateResponse.json();
            const filename = typeof generated.filename === "string" ? generated.filename : "DOCUMENT.md";
            const document = typeof generated.document === "string" ? generated.document : "";

            setFallbackFilename(filename);
            setFallbackContent(document);

            try {
              await postDocumentToLocalhost({
                port: callbackPort,
                sessionToken,
                payload: { phase, filename, content: document },
                timeoutMs: 5_000,
              });
            } catch (err) {
              const message = err instanceof Error ? err.message : "Localhost callback failed";
              setFallbackError(message);
              setFallbackOpen(true);
              return;
            }

            const completeResponse = await fetch(
              `/api/sessions/${sessionId}/phase/${phase}/complete`,
              {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ document }),
              },
            );

            if (!completeResponse.ok) {
              const body: any = await completeResponse.json().catch(() => null);
              throw new Error(body?.error ?? `Complete failed with status ${completeResponse.status}`);
            }

            const body: any = await completeResponse.json();
            const nextPhase =
              typeof body?.nextPhase === "number" ? (body.nextPhase as number) : null;
            onComplete?.(nextPhase);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
          } finally {
            setIsRunning(false);
          }
        }}
      />

      <FallbackDialog
        open={fallbackOpen}
        filename={fallbackFilename}
        content={fallbackContent}
        errorMessage={fallbackError}
        onClose={() => setFallbackOpen(false)}
      />
    </>
  );
}
