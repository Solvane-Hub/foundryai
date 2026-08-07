import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <header className="flex flex-col gap-1">
        <Link href="/" className="text-foreground text-xl font-semibold tracking-tight">
          FoundryAI
        </Link>
        <p className="text-foreground-muted text-sm">
          An AI-native operating system for entrepreneurship.
        </p>
      </header>
      <main>{children}</main>
    </div>
  );
}
