type SessionPhasePageProps = {
  params: {
    id: string;
    phase: string;
  };
};

export default function SessionPhasePage({ params }: SessionPhasePageProps) {
  return (
    <main
      className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-16"
      data-testid="session-phase-page"
    >
      <h1 className="text-balance text-4xl font-semibold tracking-tight">
        Session: {params.id} — Phase {params.phase}
      </h1>
      <p className="text-pretty text-lg text-neutral-600">
        Placeholder page for a specific session phase.
      </p>
    </main>
  );
}

