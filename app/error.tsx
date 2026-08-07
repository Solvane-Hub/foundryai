'use client';

/**
 * Frontend Architecture — errors must be human-readable, actionable, and
 * non-technical. Never expose stack traces or internal implementation details.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-foreground-muted">
        We couldn&apos;t load this page. Your work has not been lost. Please try again.
      </p>
      <button
        onClick={reset}
        className="bg-brand text-brand-foreground w-fit rounded-md px-4 py-2 text-sm font-medium"
      >
        Try again
      </button>
    </main>
  );
}
