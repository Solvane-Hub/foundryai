import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6">
      <p className="text-foreground-subtle text-2xs font-medium tracking-wide uppercase">
        Error 404
      </p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-foreground-muted text-sm">
        This page doesn&apos;t exist or may have moved. Nothing you have saved is affected.
      </p>
      <div className="mt-2">
        <Link href="/">
          <Button variant="secondary">Return home</Button>
        </Link>
      </div>
    </main>
  );
}
