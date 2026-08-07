import type { Enums, Tables } from '@/types/database';

/**
 * Domain types shared across layers (Engineering Standards §5 — shared
 * interfaces are centralized).
 *
 * These live in `types/` rather than in `lib/db/` so that `app/` and
 * `components/` can name a business without importing the data-access layer,
 * which the layer-boundary lint rule correctly forbids.
 */
export type Business = Tables<'businesses'>;
export type BusinessStatus = Enums<'business_status'>;
export type Country = Tables<'countries'>;
export type BusinessProfile = Tables<'business_profiles'>;

/** The minimum a UI needs to render a business in a picker or list. */
export type BusinessSummary = Pick<Business, 'id' | 'name'>;

/**
 * Partial intake answers written by a single step.
 *
 * Declared here rather than in `lib/db/` so Server Actions can name the shape
 * without importing the data-access layer.
 */
export type IntakePatch = Partial<
  Pick<
    BusinessProfile,
    | 'description'
    | 'founder_goals'
    | 'location'
    | 'business_stage'
    | 'employee_count'
    | 'funding_requirement_amount'
    | 'funding_requirement_currency'
    | 'last_completed_step'
    | 'completed_at'
    | 'responses'
  >
>;
