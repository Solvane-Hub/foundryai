import { LogOut } from 'lucide-react';
import { signOutAction } from '../../(auth)/actions';

/**
 * Server Component: no interactivity needed beyond a form submit, so this stays
 * off the client bundle (Frontend Architecture — server-first).
 */
export function UserMenu({ email, fullName }: { email: string | null; fullName: string | null }) {
  const label = fullName ?? email ?? null;
  const initials = fullName
    ? fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
    : (email?.[0]?.toUpperCase() ?? '?');

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="bg-surface-muted text-foreground-muted border-border flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
        >
          {initials}
        </span>
        {label ? (
          <span className="text-foreground hidden max-w-[14rem] truncate text-sm font-medium lg:block">
            {label}
          </span>
        ) : null}
      </div>

      <form action={signOutAction}>
        {/* Icon-only below `sm`, where the header has no room for a text button.
            The accessible name stays "Sign out" at every size — the e2e suite and
            a screen reader both depend on it. */}
        <button
          type="submit"
          className="text-foreground-muted hover:bg-surface-muted hover:text-foreground flex h-8 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors sm:px-3"
        >
          <LogOut aria-hidden="true" className="size-4" strokeWidth={1.75} />
          <span className="sr-only sm:not-sr-only">Sign out</span>
        </button>
      </form>
    </div>
  );
}
