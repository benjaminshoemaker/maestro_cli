"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ChatContainer } from "../../../../../src/components/chat/ChatContainer";
import { PhaseComplete } from "../../../../../src/components/chat/PhaseComplete";
import { SkeletonPage } from "../../../../../src/components/Skeleton";

type SessionPhasePageProps = {
  params: {
    id: string;
    phase: string;
  };
};

type SessionResponse = {
  session: {
    id: string;
    projectName: string;
    currentPhase: number | null;
    phases: Record<number, { complete: boolean; document: string | null }>;
  };
};

function parsePhase(phase: string): 1 | 2 | 3 | 4 | null {
  const value = Number(phase);
  return value === 1 || value === 2 || value === 3 || value === 4 ? value : null;
}

export default function SessionPhasePage({ params }: SessionPhasePageProps) {
  const phase = parsePhase(params.phase);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionResponse["session"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectComplete, setProjectComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSession(null);
    setError(null);

    fetch(`/api/sessions/${params.id}`)
      .then(async (response) => {
        if (!response.ok) {
          const body: any = await response.json().catch(() => null);
          throw new Error(body?.error ?? `Request failed with status ${response.status}`);
        }
        return (await response.json()) as SessionResponse;
      })
      .then((data) => {
        if (cancelled) return;
        setSession(data.session);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const completedPhases = useMemo(() => {
    const phases: Array<1 | 2 | 3 | 4> = [];
    if (!session) return phases;
    for (const candidate of [1, 2, 3, 4] as const) {
      if (session.phases[candidate]?.complete) phases.push(candidate);
    }
    return phases;
  }, [session]);

  const callbackPort = useMemo(() => {
    const raw = searchParams?.get?.("port") ?? null;
    if (!raw) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }, [searchParams]);

  const sessionToken = useMemo(() => {
    const token = searchParams?.get?.("token") ?? null;
    return token ? token : undefined;
  }, [searchParams]);

  const queryString = useMemo(() => {
    return searchParams?.toString?.() ?? "";
  }, [searchParams]);

  const withQuery = useCallback(
    (path: string) => {
      return queryString ? `${path}?${queryString}` : path;
    },
    [queryString],
  );

  useEffect(() => {
    if (!session || !phase) return;
    if (projectComplete) return;

    if (session.currentPhase == null) {
      setProjectComplete(true);
      return;
    }

    if (phase > session.currentPhase) {
      router?.replace?.(withQuery(`/session/${session.id}/phase/${session.currentPhase}`));
    }
  }, [phase, projectComplete, router, session, withQuery]);

  if (!phase) {
    return (
      <main
        id="main-content"
        className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16"
        data-testid="session-phase-page"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning-light">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-warning"
            aria-hidden="true"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-balance font-serif text-4xl font-semibold tracking-tight text-primary">
            Invalid phase
          </h1>
          <p className="mt-2 text-pretty text-lg text-secondary">
            Phase must be 1, 2, 3, or 4.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        id="main-content"
        className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16"
        data-testid="session-phase-page"
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
          <h1 className="text-balance font-serif text-4xl font-semibold tracking-tight text-primary">
            Could not load session
          </h1>
          <p className="mt-2 text-pretty text-lg text-secondary">{error}</p>
        </div>
        <button
          type="button"
          className="btn-secondary h-10 px-4 text-sm"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </main>
    );
  }

  if (!session) {
    return <SkeletonPage />;
  }

  if (projectComplete || session.currentPhase == null) {
    return <PhaseComplete projectName={session.projectName} />;
  }

  return (
    <ChatContainer
      sessionId={session.id}
      phase={phase}
      projectName={session.projectName}
      completedPhases={completedPhases}
      callbackPort={callbackPort}
      sessionToken={sessionToken}
      onPhaseComplete={(nextPhase) => {
        if (typeof nextPhase === "number") {
          router?.push?.(withQuery(`/session/${session.id}/phase/${nextPhase}`));
          return;
        }
        setProjectComplete(true);
      }}
    />
  );
}
