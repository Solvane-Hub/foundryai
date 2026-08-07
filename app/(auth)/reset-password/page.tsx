import type { Metadata } from 'next';
import { ResetPasswordForm } from '../_components/reset-password-form';

export const metadata: Metadata = { title: 'Choose a new password' };

/**
 * Reached via the recovery link, which /auth/callback exchanges for a session.
 * Without that session the update fails — the action surfaces it rather than
 * silently appearing to succeed.
 */
export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <ResetPasswordForm />
    </div>
  );
}
