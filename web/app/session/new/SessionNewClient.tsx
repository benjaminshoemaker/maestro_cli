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
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-16">
        <h1 className="text-balance text-3xl font-semibold tracking-tight">
          Unable to start session
        </h1>
        <p className="text-pretty text-neutral-600">{error}</p>
        <p className="text-pretty text-neutral-600">
          Return to your CLI and run <code className="rounded bg-neutral-100 px-1">maestro init</code>{" "}
          again.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-6 py-16">
      <h1 className="text-balance text-3xl font-semibold tracking-tight">
        Starting session…
      </h1>
      <p className="text-pretty text-neutral-600">
        One moment while we connect your CLI.
      </p>
    </main>
  );
}
