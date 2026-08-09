/**
 * Structured logging.
 *
 * Backend Architecture requires every request to record a correlation ID,
 * execution time, errors and (later) agent usage and knowledge version. Until
 * an observability vendor is chosen (open question), this writes structured
 * JSON to stdout — which Vercel, Datadog, CloudWatch and every log aggregator
 * can parse without a rewrite. Choosing a vendor later is a change to `emit()`.
 *
 * **Never log personal data.** No email, name, address, or free-text founder
 * answers. Security Architecture — Privacy by Default. `redact()` enforces this
 * for known-sensitive keys, but the primary control is not passing them.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  correlationId?: string | undefined;
  userId?: string | undefined;
  businessId?: string | undefined;
  operation?: string | undefined;
  durationMs?: number | undefined;
  code?: string | undefined;
  [key: string]: unknown;
}

/** Keys that must never reach a log line, whatever a caller passes. */
const SENSITIVE_KEYS = new Set([
  'email',
  'password',
  'full_name',
  'fullName',
  'description',
  'founder_goals',
  'founderGoals',
  'location',
  'token',
  'access_token',
  'refresh_token',
  'apikey',
  'authorization',
  'cookie',
  'service_role_key',
]);

export function redact(context: LogContext): LogContext {
  const out: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) continue;
    out[key] = SENSITIVE_KEYS.has(key) ? '[redacted]' : value;
  }
  return out;
}

interface LogLine extends LogContext {
  level: LogLevel;
  message: string;
  timestamp: string;
}

export function formatLine(level: LogLevel, message: string, context: LogContext = {}): LogLine {
  return { level, message, timestamp: new Date().toISOString(), ...redact(context) };
}

function emit(level: LogLevel, message: string, context: LogContext = {}): void {
  const line = JSON.stringify(formatLine(level, message, context));
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.warn(line); // stdout via warn: `no-console` permits warn/error only
}

export const logger = {
  debug: (m: string, c?: LogContext) => {
    if (process.env.NODE_ENV !== 'production') emit('debug', m, c);
  },
  info: (m: string, c?: LogContext) => emit('info', m, c),
  warn: (m: string, c?: LogContext) => emit('warn', m, c),
  error: (m: string, c?: LogContext) => emit('error', m, c),
};

/**
 * Times an operation and logs its outcome. Execution time is a documented
 * logging requirement, and measuring it here means no caller can forget.
 */
export async function timed<T>(
  operation: string,
  context: LogContext,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    logger.info(`${operation} succeeded`, {
      ...context,
      operation,
      durationMs: Date.now() - start,
    });
    return result;
  } catch (error) {
    logger.error(`${operation} failed`, {
      ...context,
      operation,
      durationMs: Date.now() - start,
      code: error instanceof Error ? error.name : 'unknown',
    });
    throw error;
  }
}
