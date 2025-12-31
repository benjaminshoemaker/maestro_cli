import { Suspense } from "react";

import SessionNewClient from "./SessionNewClient";

export const dynamic = "force-dynamic";

export default function SessionNewPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-6 py-16">
          <h1 className="text-balance text-3xl font-semibold tracking-tight">
            Starting session…
          </h1>
          <p className="text-pretty text-neutral-600">
            One moment while we connect your CLI.
          </p>
        </main>
      }
    >
      <SessionNewClient />
    </Suspense>
  );
}

