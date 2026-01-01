type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonMessage({ isUser = false }: { isUser?: boolean }) {
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      aria-hidden="true"
    >
      <div
        className={`max-w-[min(24rem,80%)] space-y-2 rounded-2xl px-4 py-3 ${
          isUser ? "bg-surface-tertiary" : "bg-surface-secondary"
        }`}
      >
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export function SkeletonMessageList() {
  return (
    <div
      className="flex flex-col gap-4"
      role="status"
      aria-label="Loading messages"
    >
      <SkeletonMessage />
      <SkeletonMessage isUser />
      <SkeletonMessage />
      <span className="sr-only">Loading messages...</span>
    </div>
  );
}

export function SkeletonPhaseIndicator() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <main
      className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-16"
      role="status"
      aria-label="Loading page"
    >
      <Skeleton className="h-10 w-48" />
      <SkeletonText lines={2} />
      <span className="sr-only">Loading...</span>
    </main>
  );
}
