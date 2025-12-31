type LoginPageProps = {
  searchParams?: { next?: string | string[] };
};

export default function LoginPage(props: LoginPageProps) {
  const nextParam = props.searchParams?.next;
  const next =
    typeof nextParam === "string"
      ? nextParam
      : Array.isArray(nextParam)
        ? nextParam[0]
        : undefined;

  const oauthHref = next
    ? `/api/auth/github/redirect?next=${encodeURIComponent(next)}`
    : "/api/auth/github/redirect";

  return (
    <main
      className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-16"
      data-testid="login-page"
    >
      <h1 className="text-balance text-4xl font-semibold tracking-tight">
        Login
      </h1>
      <p className="text-pretty text-lg text-neutral-600">
        Sign in to start a Maestro session.
      </p>
      <a
        href={oauthHref}
        className="inline-flex w-fit items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        data-testid="github-oauth-cta"
      >
        Continue with GitHub
      </a>
    </main>
  );
}
