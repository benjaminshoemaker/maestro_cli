import { ThemeToggle } from "../../../src/components/ThemeToggle";

type SessionPageProps = {
  params: {
    id: string;
  };
};

export default function SessionPage({ params }: SessionPageProps) {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-16"
      data-testid="session-page"
    >
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-2 page-enter">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Session {params.id.slice(0, 8)}...
          </p>
          <h1 className="text-balance font-serif text-4xl font-semibold tracking-tight text-primary">
            Session Overview
          </h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="card flex flex-col items-center justify-center gap-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-light">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-accent"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="font-serif text-lg font-semibold text-primary">
            Phase-based Chat UI
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Navigate to a specific phase to start the chat interface.
          </p>
        </div>
      </div>
    </main>
  );
}
