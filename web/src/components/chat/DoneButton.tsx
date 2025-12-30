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
        className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
        onClick={() => setConfirmOpen(true)}
        disabled={isDisabled}
        data-testid="done-button"
      >
        {isDisabled ? "Generating…" : "Done"}
      </button>
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
      <ConfirmDialog
        open={confirmOpen}
        title="Complete this phase?"
        description="This will generate the document and move you to the next phase."
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
