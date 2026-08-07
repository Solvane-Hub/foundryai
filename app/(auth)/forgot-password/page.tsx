import Link from 'next/link';
import type { Metadata } from 'next';
import { ForgotPasswordForm } from '../_components/forgot-password-form';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-foreground-muted text-sm">
          We&apos;ll email you a link to choose a new one.
        </p>
      </div>

      <ForgotPasswordForm />

      <Link href="/login" className="text-foreground-muted text-sm underline underline-offset-4">
        Back to sign in
      </Link>
    </div>
  );
}
