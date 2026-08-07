/**
 * Rejects protocol-relative (`//evil.com`) and absolute (`https://evil.com`) URLs,
 * allowing only internal paths.
 *
 * An open redirect immediately after sign-in is a credential-phishing vector:
 * the user has just proven they trust the domain, then gets sent elsewhere.
 */
export function isSafeInternalPath(path: string): boolean {
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (path.includes('://')) return false;
  if (path.includes('\\')) return false;
  return true;
}
