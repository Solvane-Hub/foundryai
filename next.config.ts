import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fail the production build on type or lint errors.
  // Engineering Standards §5 (strong typing) enforced mechanically — ADR-0002.
  typescript: { ignoreBuildErrors: false },
  // Next.js 16 removed `eslint` from NextConfig; linting is its own CI gate
  // (.github/workflows/ci.yml). See ADR-0002.
  // Security Architecture: never leak implementation details to the client.
  poweredByHeader: false,
};

export default nextConfig;
