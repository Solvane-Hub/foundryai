import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-foreground-muted">This page doesn&apos;t exist or may have moved.</p>
      <Link href="/" className="text-brand w-fit text-sm font-medium underline underline-offset-4">
        Return home
      </Link>
    </main>
  );
}
