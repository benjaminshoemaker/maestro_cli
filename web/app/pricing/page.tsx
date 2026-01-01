import { ThemeToggle } from "../../src/components/ThemeToggle";

export default function PricingPage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-12 px-6 py-16"
      data-testid="pricing-page"
    >
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-2 page-enter">
          <h1 className="text-balance font-serif text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            Pricing
          </h1>
          <p className="text-pretty text-lg text-secondary">
            Choose the plan that works best for you.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="grid gap-6 sm:grid-cols-2 stagger-children">
        {/* Free tier */}
        <div className="card flex flex-col gap-6 p-6">
          <div>
            <h2 className="font-serif text-xl font-semibold text-primary">Free</h2>
            <p className="mt-1 text-sm text-secondary">
              Try Maestro with one free project.
            </p>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="font-serif text-4xl font-semibold text-primary">$0</span>
            <span className="text-secondary">/forever</span>
          </div>

          <ul className="flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-success"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span className="text-secondary">1 free project</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-success"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span className="text-secondary">All 4 phases included</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-success"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span className="text-secondary">Full document generation</span>
            </li>
          </ul>

          <a
            href="/login"
            className="btn-secondary h-11 w-full text-sm"
          >
            Get started free
          </a>
        </div>

        {/* Pro tier */}
        <div className="card relative flex flex-col gap-6 border-2 border-accent p-6">
          <div className="absolute -top-3 right-4 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
            Popular
          </div>

          <div>
            <h2 className="font-serif text-xl font-semibold text-primary">Pro</h2>
            <p className="mt-1 text-sm text-secondary">
              Unlimited projects for professionals.
            </p>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="font-serif text-4xl font-semibold text-primary">$19</span>
            <span className="text-secondary">/month</span>
          </div>

          <ul className="flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-success"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span className="text-secondary">Unlimited projects</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-success"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span className="text-secondary">Priority support</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-success"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span className="text-secondary">Advanced AI models</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-success"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span className="text-secondary">Early access to new features</span>
            </li>
          </ul>

          <a
            href="/login"
            className="btn-accent h-11 w-full text-sm"
          >
            Start Pro trial
          </a>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted">
          All plans include a 14-day money-back guarantee. No questions asked.
        </p>
      </div>
    </main>
  );
}
