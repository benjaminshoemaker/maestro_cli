type PhaseCompleteProps = {
  projectName: string;
};

export function PhaseComplete({ projectName }: PhaseCompleteProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-6 py-16">
      <h1 className="text-balance text-4xl font-semibold tracking-tight">Project Complete</h1>
      <p className="text-pretty text-lg text-neutral-600">
        <span className="font-semibold text-neutral-900">{projectName}</span> is ready. You can
        close this tab and continue in your editor.
      </p>
    </main>
  );
}

