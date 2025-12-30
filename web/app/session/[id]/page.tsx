type SessionPageProps = {
  params: {
    id: string;
  };
};

export default function SessionPage({ params }: SessionPageProps) {
  return (
    <main
      className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-16"
      data-testid="session-page"
    >
      <h1 className="text-balance text-4xl font-semibold tracking-tight">
        Session: {params.id}
      </h1>
      <p className="text-pretty text-lg text-neutral-600">
        Placeholder session page. Phase 3 will add the chat UI.
      </p>
    </main>
  );
}

