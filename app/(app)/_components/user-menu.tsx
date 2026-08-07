import { signOutAction } from '../../(auth)/actions';
import { Button } from '@/components/ui/button';

/**
 * Server Component: no interactivity needed beyond a form submit, so this stays
 * off the client bundle (Frontend Architecture — server-first).
 */
export function UserMenu({ email, fullName }: { email: string | null; fullName: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden flex-col items-end leading-tight sm:flex">
        {fullName ? <span className="text-sm font-medium">{fullName}</span> : null}
        {email ? <span className="text-foreground-muted text-xs">{email}</span> : null}
      </div>
      <form action={signOutAction}>
        <Button type="submit" variant="secondary" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}
