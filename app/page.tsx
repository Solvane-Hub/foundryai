import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-6">
      <p className="text-foreground-muted text-sm font-medium tracking-wide uppercase">
        Solvane Hub
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">FoundryAI</h1>
      <p className="text-foreground-muted text-lg">
        An AI-native operating system for entrepreneurship.
      </p>
      <div className="mt-4 flex gap-3">
        <Link href="/signup">
          <Button>Create an account</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </div>
      <p className="text-foreground-muted mt-6 text-sm">
        Sprint 1 · Phase 3 — authentication. Business creation and intake are not built yet.
      </p>
    </main>
  );
}
