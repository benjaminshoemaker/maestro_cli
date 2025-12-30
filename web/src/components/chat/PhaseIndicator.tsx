const PHASES = [
  { phase: 1 as const, name: "Product Spec" },
  { phase: 2 as const, name: "Technical Spec" },
  { phase: 3 as const, name: "Implementation Plan" },
  { phase: 4 as const, name: "AGENTS.md" },
];

type PhaseIndicatorProps = {
  currentPhase: 1 | 2 | 3 | 4;
  completedPhases?: Array<1 | 2 | 3 | 4>;
};

export function PhaseIndicator({ currentPhase, completedPhases = [] }: PhaseIndicatorProps) {
  const currentName = PHASES.find((phase) => phase.phase === currentPhase)?.name ?? "Unknown";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="text-sm font-semibold text-neutral-900" data-testid="phase-indicator-current">
          Phase {currentPhase}: <span className="font-semibold">{currentName}</span>
        </p>
      </div>

      <ol className="grid grid-cols-4 gap-2">
        {PHASES.map(({ phase, name }) => {
          const state =
            completedPhases.includes(phase) ? "complete" : phase === currentPhase ? "current" : "upcoming";

          return (
            <li
              key={phase}
              className="flex flex-col gap-1"
              data-testid={`phase-step-${phase}`}
              data-state={state}
            >
              <div
                className={[
                  "flex h-8 items-center justify-center rounded-xl border text-xs font-semibold",
                  state === "complete"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : state === "current"
                      ? "border-neutral-300 bg-neutral-100 text-neutral-900"
                      : "border-neutral-200 bg-white text-neutral-500",
                ].join(" ")}
              >
                {state === "complete" ? "✓" : phase}
              </div>
              <span className="text-xs text-neutral-600">{name}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
