"use client";

import { useEffect, useState } from "react";
import { Confetti } from "../Confetti";

type PhaseCompleteProps = {
  projectName: string;
};

export function PhaseComplete({ projectName }: PhaseCompleteProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti after a short delay for better visual impact
    const timeout = setTimeout(() => setShowConfetti(true), 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <Confetti active={showConfetti} />

      <main
        id="main-content"
        className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16"
      >
        {/* Success checkmark with animation */}
        <div className="celebrate flex h-24 w-24 items-center justify-center rounded-full bg-success-light">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 text-success"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <div className="flex flex-col items-center gap-4 text-center stagger-children">
          <h1 className="text-balance font-serif text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            Project Complete!
          </h1>

          <p className="max-w-md text-pretty text-lg text-secondary">
            <span className="font-semibold text-primary">{projectName}</span> is ready.
            All four phases have been completed successfully.
          </p>
        </div>

        {/* What's next section */}
        <div className="mt-4 flex flex-col gap-4 stagger-children">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted">
            What&apos;s next?
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card-elevated flex flex-col gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-accent"
                  aria-hidden="true"
                >
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <h3 className="font-semibold text-primary">Start Coding</h3>
              <p className="text-sm text-secondary">
                Open your project in your favorite editor and start building with the generated specs.
              </p>
            </div>

            <div className="card-elevated flex flex-col gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-accent"
                  aria-hidden="true"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" x2="8" y1="13" y2="13" />
                  <line x1="16" x2="8" y1="17" y2="17" />
                  <line x1="10" x2="8" y1="9" y2="9" />
                </svg>
              </div>
              <h3 className="font-semibold text-primary">Review Documents</h3>
              <p className="text-sm text-secondary">
                Check the <code className="rounded bg-surface-secondary px-1 py-0.5 text-xs">specs/</code> folder for your generated documentation.
              </p>
            </div>
          </div>
        </div>

        {/* Close tab instruction */}
        <p className="mt-8 text-sm text-muted">
          You can safely close this tab and continue in your terminal.
        </p>
      </main>
    </>
  );
}
