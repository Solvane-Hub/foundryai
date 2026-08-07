/**
 * Name of the cookie holding the founder's currently selected business.
 *
 * The value is a hint, not an authorization token: it is client-controllable, so
 * every read re-checks it against the RLS-scoped business list
 * (services/business#resolveCurrentBusiness). A foreign or stale ID silently
 * falls back to the most recent business rather than erroring.
 */
export const CURRENT_BUSINESS_COOKIE = 'foundryai_business';
