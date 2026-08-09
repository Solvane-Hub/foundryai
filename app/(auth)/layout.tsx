import Link from 'next/link';

/**
 * Auth shell.
 *
 * Shares the application's vocabulary — same canvas, same rhythm, same type —
 * so signing in does not feel like a different product from the one behind it.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col px-6 py-8 sm:py-12">
      <header className="mx-auto w-full max-w-sm">
        <Link
          href="/"
          className="text-foreground text-[0.9375rem] font-semibold tracking-[-0.015em]"
        >
          FoundryAI
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
        {children}
      </main>

      <footer className="text-foreground-subtle mx-auto w-full max-w-sm text-xs">
        An AI-native operating system for entrepreneurship. From Solvane Hub.
      </footer>
    </div>
  );
}
