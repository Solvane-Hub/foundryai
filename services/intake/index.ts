import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { BusinessProfile } from '@/types/business';
import { AppError, newCorrelationId } from '@/lib/errors';
import { recordAuditEvent } from '@/services/audit';
import { findProfileByBusinessId, insertProfile, updateProfile } from '@/lib/db/business-profiles';
import { findBusinessById, updateBusiness } from '@/lib/db/businesses';
import type { IntakePatch } from '@/types/business';
import { assertTransition } from '@/services/business';
import { TOTAL_INTAKE_STEPS } from '@/lib/validation/intake';
import type { RequestContext } from '@/services/auth';

/**
 * Founder Intake Application Service.
 *
 * Draft persistence is the point of this phase: every step is written the moment
 * it is submitted, so closing the browser mid-flow loses nothing (Sprint 1
 * acceptance criteria C3/C4). Resumability is a data property, not UI polish.
 */

/** Returns the profile, creating it and moving the business to `intake_started`. */
export async function startOrResumeIntake(
  db: SupabaseClient<Database>,
  businessId: string,
  ownerId: string,
  ctx: RequestContext = {},
): Promise<BusinessProfile> {
  const correlationId = ctx.correlationId ?? newCorrelationId();

  const business = await findBusinessById(db, businessId);
  if (!business) {
    throw new AppError({
      code: 'NOT_FOUND',
      humanMessage: 'We could not find that business.',
      correlationId,
    });
  }
  if (business.status === 'archived') {
    throw new AppError({
      code: 'FORBIDDEN',
      humanMessage: 'Archived businesses cannot be edited.',
      correlationId,
    });
  }

  const existing = await findProfileByBusinessId(db, businessId);
  if (existing) return existing;

  const { data, error } = await insertProfile(db, businessId);
  if (error || !data) {
    throw new AppError({
      code: 'UNEXPECTED',
      humanMessage: 'We could not start your intake. Please try again.',
      developerMessage: error ?? 'insert returned no row',
      correlationId,
    });
  }

  if (business.status === 'draft') {
    assertTransition(business.status, 'intake_started', correlationId);
    await updateBusiness(db, businessId, { status: 'intake_started' });
  }

  await recordAuditEvent({
    event: 'intake.started',
    actorId: ownerId,
    businessId,
    correlationId,
    ipAddress: ctx.ipAddress ?? null,
    userAgent: ctx.userAgent ?? null,
  });

  return data;
}

/**
 * Persists one step.
 *
 * `last_completed_step` only ever moves forward: revisiting step 2 to correct an
 * answer must not discard steps 3–5 the founder already completed.
 */
export async function saveStep(
  db: SupabaseClient<Database>,
  businessId: string,
  ownerId: string,
  step: number,
  patch: IntakePatch,
  ctx: RequestContext = {},
): Promise<BusinessProfile> {
  const correlationId = ctx.correlationId ?? newCorrelationId();

  const profile = await findProfileByBusinessId(db, businessId);
  if (!profile) {
    throw new AppError({
      code: 'NOT_FOUND',
      humanMessage: 'We could not find your intake. Please start again.',
      correlationId,
    });
  }

  // A funding amount requires a currency (DB constraint
  // bp_funding_currency_required_with_amount). It is derived from the business's
  // country rather than typed by the founder, so it cannot disagree.
  const resolved: IntakePatch = { ...patch };
  if ('funding_requirement_amount' in resolved) {
    if (
      resolved.funding_requirement_amount === null ||
      resolved.funding_requirement_amount === undefined
    ) {
      resolved.funding_requirement_currency = null;
    } else {
      const business = await findBusinessById(db, businessId);
      const { data: country } = await db
        .from('countries')
        .select('currency_code')
        .eq('code', business?.country_code ?? '')
        .maybeSingle();
      resolved.funding_requirement_currency = country?.currency_code ?? null;
    }
  }

  const { data, error } = await updateProfile(db, businessId, {
    ...resolved,
    last_completed_step: Math.max(profile.last_completed_step, step),
  });

  if (error || !data) {
    throw new AppError({
      code: 'UNEXPECTED',
      humanMessage: 'We could not save that. Please try again.',
      developerMessage: error ?? 'update returned no row',
      correlationId,
    });
  }

  await recordAuditEvent({
    event: 'intake.step_saved',
    actorId: ownerId,
    businessId,
    correlationId,
    metadata: { step },
  });

  return data;
}

/** Finalises intake once every step is answered. */
export async function completeIntake(
  db: SupabaseClient<Database>,
  businessId: string,
  ownerId: string,
  ctx: RequestContext = {},
): Promise<void> {
  const correlationId = ctx.correlationId ?? newCorrelationId();

  const [profile, business] = await Promise.all([
    findProfileByBusinessId(db, businessId),
    findBusinessById(db, businessId),
  ]);

  if (!profile || !business) {
    throw new AppError({
      code: 'NOT_FOUND',
      humanMessage: 'We could not find your intake. Please start again.',
      correlationId,
    });
  }

  if (profile.last_completed_step < TOTAL_INTAKE_STEPS) {
    throw new AppError({
      code: 'VALIDATION_FAILED',
      humanMessage: 'Please finish the remaining questions first.',
      developerMessage: `last_completed_step=${profile.last_completed_step} of ${TOTAL_INTAKE_STEPS}`,
      correlationId,
    });
  }

  if (business.status !== 'intake_complete') {
    assertTransition(business.status, 'intake_complete', correlationId);
    await updateBusiness(db, businessId, { status: 'intake_complete' });
  }

  await updateProfile(db, businessId, { completed_at: new Date().toISOString() });

  await recordAuditEvent({
    event: 'intake.completed',
    actorId: ownerId,
    businessId,
    correlationId,
    ipAddress: ctx.ipAddress ?? null,
    userAgent: ctx.userAgent ?? null,
  });
}

/** Read-only accessor so `app/` never imports the data-access layer (ADR-0001). */
export async function getIntakeProfile(
  db: SupabaseClient<Database>,
  businessId: string,
): Promise<BusinessProfile | null> {
  return findProfileByBusinessId(db, businessId);
}

export function intakeProgress(profile: BusinessProfile | null): {
  completed: number;
  total: number;
  percent: number;
  isComplete: boolean;
} {
  const completed = Math.min(profile?.last_completed_step ?? 0, TOTAL_INTAKE_STEPS);
  return {
    completed,
    total: TOTAL_INTAKE_STEPS,
    percent: Math.round((completed / TOTAL_INTAKE_STEPS) * 100),
    isComplete: Boolean(profile?.completed_at),
  };
}
