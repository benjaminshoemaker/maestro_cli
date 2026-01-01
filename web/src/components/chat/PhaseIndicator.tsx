const PHASES = [
  { phase: 1 as const, name: "Product Spec", shortName: "Product" },
  { phase: 2 as const, name: "Technical Spec", shortName: "Tech" },
  { phase: 3 as const, name: "Implementation", shortName: "Impl" },
  { phase: 4 as const, name: "AGENTS.md", shortName: "Agents" },
];

type PhaseIndicatorProps = {
  currentPhase: 1 | 2 | 3 | 4;
  completedPhases?: Array<1 | 2 | 3 | 4>;
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function PhaseIndicator({ currentPhase, completedPhases = [] }: PhaseIndicatorProps) {
  const currentName = PHASES.find((phase) => phase.phase === currentPhase)?.name ?? "Unknown";

  return (
    <nav className="flex flex-col gap-4" aria-label="Phase progress">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="text-sm font-semibold text-primary" data-testid="phase-indicator-current">
          Phase {currentPhase}:{" "}
          <span className="font-serif text-base">{currentName}</span>
        </p>
        <p className="text-xs text-muted">
          {completedPhases.length} of 4 complete
        </p>
      </div>

      {/* Progress bar connecting phases */}
      <div className="relative">
        {/* Background track */}
        <div className="absolute left-5 top-5 h-0.5 w-[calc(100%-2.5rem)] bg-border" aria-hidden="true" />

        {/* Completed track */}
        <div
          className="absolute left-5 top-5 h-0.5 bg-success transition-all duration-500"
          style={{
            width: `calc(${(completedPhases.length / 3) * 100}% - ${completedPhases.length > 0 ? "1.25rem" : "0rem"})`,
          }}
          aria-hidden="true"
        />

        <ol className="relative grid grid-cols-4 gap-2">
          {PHASES.map(({ phase, name, shortName }) => {
            const isComplete = completedPhases.includes(phase);
            const isCurrent = phase === currentPhase;
            const state = isComplete ? "complete" : isCurrent ? "current" : "upcoming";

            return (
              <li
                key={phase}
                className="flex flex-col items-center gap-2"
                data-testid={`phase-step-${phase}`}
                data-state={state}
              >
                <div
                  className={`
                    relative z-10 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold
                    transition-all duration-300
                    ${
                      isComplete
                        ? "border-2 border-success bg-success-light text-success"
                        : isCurrent
                          ? "border-2 border-accent bg-accent-light text-accent shadow-md"
                          : "border border-border bg-surface text-muted"
                    }
                  `}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : (
                    <span>{phase}</span>
                  )}
                </div>
                <span
                  className={`text-center text-xs transition-colors duration-200 ${
                    isCurrent ? "font-medium text-primary" : "text-secondary"
                  }`}
                >
                  <span className="hidden sm:inline">{name}</span>
                  <span className="sm:hidden">{shortName}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
