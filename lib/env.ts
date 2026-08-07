import { z } from 'zod';

/**
 * Typed environment access, validated once at module load.
 *
 * Security Architecture — secrets are server-side only. Importing this module
 * from a Client Component is a build error by design: server variables must
 * never reach the browser bundle.
 *
 * Fails fast and loudly at boot rather than producing a confusing runtime error
 * three layers deep (Platform Architecture — errors should be informative and traceable).
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
});

/** The shape of an environment source. Narrower than NodeJS.ProcessEnv so the
 *  parsers can be unit-tested against arbitrary inputs. */
export type EnvSource = Readonly<Record<string, string | undefined>>;

function format(error: z.ZodError): string {
  return error.issues.map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
}

function parseClientEnv(source: EnvSource): z.infer<typeof clientSchema> {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: source.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: source.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: source.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid or missing public environment variables:\n${format(parsed.error)}\n\nSee .env.example.`,
    );
  }
  return parsed.data;
}

function parseServerEnv(source: EnvSource): z.infer<typeof serverSchema> {
  const parsed = serverSchema.safeParse({
    NODE_ENV: source.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: source.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid or missing server environment variables:\n${format(parsed.error)}\n\nSee .env.example.`,
    );
  }
  return parsed.data;
}

/** Exported for unit testing without mutating process.env. */
export const __testing = { parseClientEnv, parseServerEnv, clientSchema, serverSchema };

export const clientEnv = parseClientEnv(process.env);
export const serverEnv = parseServerEnv(process.env);
