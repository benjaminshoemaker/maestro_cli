"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SessionResponse = {
  sessionId: string;
  sessionToken: string;
  currentPhase?: number | null;
};

function parseCallbackPort(callback: string): number | null {
  const match = callback.match(/^localhost:(\d{1,5})$/);
  if (!match) return null;

  const port = Number(match[1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;

  return port;
}

export default function SessionNewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callback = searchParams.get("callback");
  const token = searchParams.get("token");
  const project = searchParams.get("project");

  const [error, setError] = useState<string | null>(null);

  const callbackPort = useMemo(() => {
    if (!callback) return null;
    return parseCallbackPort(callback);
  }, [callback]);

  const nextPath = useMemo(() => {
    const query = searchParams.toString();
    return query.length > 0 ? `/session/new?${query}` : "/session/new";
  }, [searchParams]);

  useEffect(() => {
    const requiredCallback = callback;
    const requiredToken = token;
    const requiredProject = project;

    if (!requiredCallback || !requiredToken || !requiredProject) {
      setError("Missing required parameters.");
      return;
    }

    if (!callbackPort) {
      setError("Invalid callback parameter.");
      return;
    }

    let canceled = false;

    async function run() {
      try {
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            projectName: requiredProject,
            callbackPort,
            sessionToken: requiredToken,
          }),
        });

        if (canceled) return;

        if (response.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
          return;
        }

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error ?? "Failed to start session.");
          return;
        }

        const body = (await response.json()) as SessionResponse;
        const phase = typeof body.currentPhase === "number" ? body.currentPhase : 1;
        const redirectToken = body.sessionToken;

        router.replace(
          `/session/${encodeURIComponent(body.sessionId)}/phase/${encodeURIComponent(
            String(phase),
          )}?port=${encodeURIComponent(String(callbackPort))}&token=${encodeURIComponent(
            redirectToken,
          )}`,
        );
      } catch (caught) {
        if (canceled) return;
        const message = caught instanceof Error ? caught.message : "Unknown error";
        setError(message);
      }
    }

    void run();

    return () => {
      canceled = true;
    };
  }, [callback, callbackPort, nextPath, project, router, token]);

  if (error) {
    return (
      <main
        id="main-content"
        className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-light">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-error"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-balance font-serif text-3xl font-semibold tracking-tight text-primary">
            Unable to start session
          </h1>
          <p className="mt-2 text-pretty text-secondary">{error}</p>
        </div>
        <div className="card flex items-center gap-3 bg-surface-secondary p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 shrink-0 text-muted"
            aria-hidden="true"
          >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" x2="20" y1="19" y2="19" />
          </svg>
          <p className="text-sm text-secondary">
            Return to your CLI and run{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-primary">
              maestro init
            </code>{" "}
            again.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-light">
        <svg
          className="h-8 w-8 animate-spin text-accent"
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
      </div>
      <div className="text-center">
        <h1 className="text-balance font-serif text-3xl font-semibold tracking-tight text-primary">
          Starting session...
        </h1>
        <p className="mt-2 text-pretty text-secondary">
          One moment while we connect your CLI.
        </p>
      </div>
    </main>
  );
}
