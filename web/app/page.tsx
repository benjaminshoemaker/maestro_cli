import { ThemeToggle } from "../src/components/ThemeToggle";

export default function HomePage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-6 py-16"
    >
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-2 page-enter">
          <h1 className="text-balance font-serif text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            Maestro
          </h1>
          <p className="text-pretty text-lg text-secondary">
            AI-powered project scaffolding for modern development workflows.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-col gap-6 stagger-children">
        <div className="card-elevated flex flex-col gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-accent"
              aria-hidden="true"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          </div>
          <div>
            <h2 className="font-serif text-xl font-semibold text-primary">
              Get Started
            </h2>
            <p className="mt-2 text-secondary">
              Run the following command to start a new project:
            </p>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-border bg-surface-secondary p-4 font-mono text-sm text-primary">
            npx maestro init my-project
          </pre>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="/login"
            className="card group flex flex-col gap-3 p-5 transition-all hover:border-accent hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary transition-colors group-hover:bg-accent-light">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-secondary transition-colors group-hover:text-accent"
                aria-hidden="true"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" x2="3" y1="12" y2="12" />
              </svg>
            </div>
            <h3 className="font-semibold text-primary">Login</h3>
            <p className="text-sm text-secondary">
              Sign in with GitHub to start a session.
            </p>
          </a>

          <a
            href="/pricing"
            className="card group flex flex-col gap-3 p-5 transition-all hover:border-accent hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary transition-colors group-hover:bg-accent-light">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-secondary transition-colors group-hover:text-accent"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                <path d="M12 18V6" />
              </svg>
            </div>
            <h3 className="font-semibold text-primary">Pricing</h3>
            <p className="text-sm text-secondary">
              View plans and subscription options.
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}
