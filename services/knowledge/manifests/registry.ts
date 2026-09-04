import type { SourceManifest } from '@/services/knowledge/manifests/types';
import { DEMO_ZZ_COUNTRY_CODE, DEMO_ZZ_MANIFEST } from '@/services/knowledge/manifests/demo-zz';

/**
 * Which source manifest describes a jurisdiction's published corpus.
 *
 * The manifest supplies the amendment chain — which instrument amends which
 * provision of which other instrument, and whether that amendment has commenced.
 * Without it the Assistant Service cannot say whether a quoted provision is
 * still the current law, only that it was published.
 *
 * ⚠ **An absent manifest is not an answer.** A jurisdiction missing from this
 *   registry causes `answerNovaQuestion` to withhold the current legal position
 *   for every claim and to name the gap in `unresolved[]`. It does NOT cause
 *   amendment notices to be quietly omitted, which is what the code did before —
 *   and "we have no chronology" is indistinguishable from "there are no
 *   amendments" once the caveat disappears.
 *
 * ## Why BS is deliberately absent
 *
 * `services/knowledge/manifests/bahamas.ts` exists and is verified, but BS-v0.1
 * is not published and is not publishable while G11 — the commercial-reuse
 * restriction on the official legislation site — is unresolved. With no
 * published BS pack, retrieval short-circuits at `no_published_knowledge` before
 * a manifest is consulted at all, so wiring it in would change nothing except to
 * put real Bahamian instrument metadata one import closer to the runtime. Adding
 * BS here is a decision that belongs with the decision to publish, not before
 * it.
 */
const MANIFESTS_BY_COUNTRY: Readonly<Record<string, SourceManifest>> = Object.freeze({
  [DEMO_ZZ_COUNTRY_CODE]: DEMO_ZZ_MANIFEST,
});

/**
 * The manifest for a jurisdiction, or null when none is registered.
 *
 * Null is a real and expected answer, and callers must treat it as an integrity
 * gap rather than as an absence of amendments.
 */
export function manifestForJurisdiction(countryCode: string): SourceManifest | null {
  return MANIFESTS_BY_COUNTRY[countryCode] ?? null;
}

/** Jurisdictions whose chronology this build can account for. Test-facing. */
export function jurisdictionsWithManifest(): readonly string[] {
  return Object.keys(MANIFESTS_BY_COUNTRY);
}
