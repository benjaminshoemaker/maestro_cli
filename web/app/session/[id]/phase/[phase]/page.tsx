"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ChatContainer } from "../../../../../src/components/chat/ChatContainer";
import { PhaseComplete } from "../../../../../src/components/chat/PhaseComplete";

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
        className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-16"
        data-testid="session-phase-page"
      >
        <h1 className="text-balance text-4xl font-semibold tracking-tight">Invalid phase</h1>
        <p className="text-pretty text-lg text-neutral-600">Phase must be 1, 2, 3, or 4.</p>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-16"
        data-testid="session-phase-page"
      >
        <h1 className="text-balance text-4xl font-semibold tracking-tight">Could not load session</h1>
        <p className="text-pretty text-lg text-neutral-600">{error}</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main
        className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-16"
        data-testid="session-phase-page"
      >
        <h1 className="text-balance text-4xl font-semibold tracking-tight">Loading…</h1>
        <p className="text-pretty text-lg text-neutral-600">Fetching session details.</p>
      </main>
    );
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
