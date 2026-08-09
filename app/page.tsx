import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Public landing page.
 *
 * Claims here are checked against what is actually built. The previous copy
 * stated that business creation and intake were not built; both have shipped,
 * and a false statement on the front door is a trust problem before it is a
 * design problem.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col px-6 py-8 sm:py-12">
      <header className="mx-auto w-full max-w-3xl">
        <span className="text-foreground text-[0.9375rem] font-semibold tracking-[-0.015em]">
          FoundryAI
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-16">
        <p className="text-foreground-subtle text-2xs font-medium tracking-wide uppercase"></p>

        <h1 className="mt-5 max-w-2xl text-4xl font-semibold text-balance sm:text-5xl">
          From idea to launch, with the evidence behind every step.
        </h1>

        <p className="text-foreground-muted mt-6 max-w-xl text-base text-pretty">
          FoundryAI works out what your business actually needs — registrations, licences, permits
          and funding — for the country and industry you are operating in. Every requirement is
          traced back to the legislation it came from.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/signup">
            <Button size="lg">
              Create an account
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Sign in
            </Button>
          </Link>
        </div>

        {/* An honest statement of where the product is. Founders discovering a
            limitation after signing up costs more trust than saying it here. */}
        <p className="text-foreground-subtle mt-14 max-w-xl text-sm">
          Available today: accounts, business setup and guided intake. Compliance, funding,
          timelines and Nova are in development and are marked as such in the app.
        </p>
      </main>

      <footer className="text-foreground-subtle mx-auto w-full max-w-3xl text-xs">
        An AI-native operating system for entrepreneurship. Built in The Bahamas by Solvane Hub.
      </footer>
    </div>
  );
}
