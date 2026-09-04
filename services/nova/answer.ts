import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { CoverageSignal, RetrievalReproducibilityInputs } from '@/lib/ai/retrieval/contract';
import type { Citation } from '@/lib/knowledge/citation';
import type {
  NovaClaim,
  NovaEnvelope,
  NovaEvidenceInput,
  NovaUnresolved,
} from '@/lib/ai/agents/nova/contract';
import type { SourceManifest, SourceManifestEntry } from '@/services/knowledge/manifests/types';
import type {
  NovaRetrievalResult,
  NovaRetrievalRun,
  NovaRetrievedChunk,
} from '@/services/nova/retrieval';
import type { NovaContext } from '@/services/nova/context';

import { assertCitationsGrounded } from '@/lib/knowledge/citation';
import { reasonExtractively } from '@/lib/ai/agents/nova/reason';
import { amendmentsForProvision } from '@/services/knowledge/manifests/types';
import { retrieveNovaEvidence } from '@/services/nova/retrieval';

type Db = SupabaseClient<Database>;

/**
 * Nova Assistant Service — the orchestrator.
 *
 * The only module that knows retrieval, the reasoner and citations all exist.
 * It performs the layer crossing the agent cannot make for itself: `lib/ai/**`
 * may not import `services` (ESLint, Engineering Standards §8), so mapping a
 * `NovaRetrievedChunk` into a `NovaEvidenceInput` happens here.
 *
 * Two independent gates run on every answer, both failing closed:
 *   1. `assertRetrievalResultValid` — inside retrieval, before any agent sees a chunk.
 *   2. `assertCitationsGrounded`    — here, before any claim reaches a founder.
 *
 * ⚠ **This service states no legal conclusions in prose.** It assembles
 *   structured evidence and structured metadata. Where the current legal
 *   position cannot be established from that metadata, it says so in
 *   `unresolved[]` and leaves the position unstated — it never narrates one.
 */

/**
 * Founder-facing outcome. Deliberately distinguishes three refusal shapes that
 * a single "no answer" would flatten:
 *
 *   • `no_published_knowledge` — we hold no sources for this jurisdiction at all
 *   • `no_matching_evidence`   — we hold sources; none addresses the question
 *   • `needs_clarification`    — the question cannot be matched at all
 *
 * These are different truths and deserve different words.
 */
export type NovaAnswerOutcome =
  'answered' | 'no_published_knowledge' | 'no_matching_evidence' | 'needs_clarification';

/** Citations for one claim, materialised from the current retrieval run. */
export interface ClaimCitations {
  claimId: string;
  citations: readonly Citation[];
}

/** One amending instrument's bearing on a retrieved provision. Metadata only. */
export interface AmendmentReference {
  manifestId: string;
  title: string;
  actNumber: string | null;
  commencementDate: string | null;
  /**
   * True only when the manifest establishes that this amendment is in force.
   * False means the current position must not be stated.
   */
  commencementEstablished: boolean;
}

/**
 * Notice that a retrieved provision is affected by later instruments.
 *
 * ⚠ Carries no legal conclusion and no prose. It names the base provision, the
 *   amending instruments, and whether their commencement is established. The
 *   founder-facing wording is the presentation layer's job, and the operative
 *   conclusion is stated only where `currentApplicabilityEstablished` is true.
 */
export interface AmendmentNotice {
  claimId: string;
  baseManifestId: string;
  baseInstrumentTitle: string;
  provision: string;
  amendments: readonly AmendmentReference[];
  currentApplicabilityEstablished: boolean;
}

export interface NovaAnswer {
  outcome: NovaAnswerOutcome;
  /**
   * Null **only** when no Knowledge Pack is published.
   *
   * In that case no agent ran — retrieval short-circuited before there was
   * anything to reason over — so there is no envelope to report. Manufacturing
   * one would require inventing a `knowledgeVersion` that does not exist.
   */
  envelope: NovaEnvelope | null;
  citations: readonly ClaimCitations[];
  amendmentNotices: readonly AmendmentNotice[];
  coverage: CoverageSignal;
  /**
   * The jurisdiction this run was scoped to.
   *
   * From `businesses.country_code` via the retrieval context — never inferred
   * (K5 §3.2). Carried out of the service so the presentation layer can tell
   * whether it is displaying a real corpus or a synthetic one WITHOUT being told
   * by a caller. A boolean passed down as a prop can be forgotten at one call
   * site; a country code travels with the answer.
   */
  jurisdiction: string;
  knowledgeVersion: string | null;
  packId: string | null;
  /**
   * K5 §12 replay inputs from the run that produced this answer.
   *
   * Null only when no Knowledge Pack is published — there was no run to
   * reproduce. Carried out of the service so it can be PERSISTED: retrieval
   * previously computed these faithfully and then discarded them, which made
   * every historical answer unidentifiable.
   */
  reproducibility: RetrievalReproducibilityInputs | null;
  /**
   * The ordered chunk ids this run returned.
   *
   * Order is significant — K5 §3.8 makes the ordered result set part of the
   * reproducibility contract. Identifiers only; never text.
   */
  retrievedChunkIds: readonly string[];
  /**
   * MANDATORY at the answer level, not just the envelope level.
   *
   * The union of the envelope's `unresolved` and any gap the service itself
   * found — including the no-pack case, where there is no envelope to carry it.
   * A refusal that names nothing is never produced.
   */
  unresolved: readonly NovaUnresolved[];
  retrievedAt: string;
}

export interface NovaAnswerRequest {
  context: NovaContext;
  /** The founder's question, already combined with business facts. */
  queryRepresentation: string;
  /** Verbatim, for `unresolved[].question`. */
  question: string;
  topK?: number;
  /**
   * Corpus definition for the jurisdiction. Supplies the amendment chain.
   *
   * ⚠ Optional in the type, never optional in effect. Omitting it does not
   *   suppress amendment handling — it makes every claim's current legal
   *   position explicitly unestablished, because a platform with no chronology
   *   for a jurisdiction knows less than one with an empty amendment list, not
   *   the same amount.
   */
  manifest?: SourceManifest;
}

/**
 * Map retrieval output into the agent's input shape.
 *
 * Exported because this crossing is the contract between two layers that may
 * not import each other, and a contract deserves its own tests.
 *
 * Note what is NOT carried across: the built `Citation`, the score, and the
 * knowledge-source id. An agent cites by `chunk_id` and nothing else (A12), and
 * giving it a pre-built citation object would let it emit one the retrieval run
 * never produced.
 */
export function toEvidenceInput(chunks: readonly NovaRetrievedChunk[]): NovaEvidenceInput[] {
  return chunks.map((c) => ({
    chunkId: c.chunkId,
    body: c.body,
    sourceAuthority: c.sourceAuthority,
    sectionReference: c.sectionReference,
    regulatoryDomain: c.regulatoryDomain,
    rank: c.rank,
  }));
}

/**
 * Materialise citations for each claim from the chunks this run retrieved.
 *
 * The citation is taken from the retrieval result, never from the agent. The
 * agent selected a `chunk_id`; the system looks up what that identifier means.
 * That is what makes a fabricated citation structurally impossible rather than
 * merely discouraged (Trust Layer §8).
 */
function buildClaimCitations(
  claims: readonly NovaClaim[],
  chunks: readonly NovaRetrievedChunk[],
): ClaimCitations[] {
  const byChunkId = new Map(chunks.map((c) => [c.chunkId, c]));

  return claims.map((claim) => ({
    claimId: claim.claimId,
    citations: claim.evidence.map((ref) => {
      const chunk = byChunkId.get(ref.chunkId);
      if (!chunk) {
        // Unreachable if the validation gate did its job. Checked anyway: this
        // is the exact failure the gate exists to prevent, and a silent
        // undefined here would become a missing citation downstream.
        throw new Error(
          `ADR-0017: claim ${claim.claimId} cites chunk ${ref.chunkId}, which this retrieval ` +
            'run did not return. A citation to a chunk that was never retrieved is fabrication.',
        );
      }
      return chunk.citation;
    }),
  }));
}

/**
 * Resolve a retrieved chunk back to its manifest entry via the stable key.
 *
 * Previously this matched `chunk.citation.url` against `entry.canonicalUrl`. A
 * changed government URL silently detached the source from its amendments, and
 * a broken join was indistinguishable from "this provision has no amendments" —
 * failing in the unsafe direction (docs/nova-v0.1-review.md §6.2).
 */
function manifestEntryForChunk(
  manifest: SourceManifest,
  chunk: NovaRetrievedChunk,
): SourceManifestEntry | null {
  if (!chunk.manifestId) return null;
  return manifest.entries.find((e) => e.manifestId === chunk.manifestId) ?? null;
}

/**
 * A notice that establishes nothing.
 *
 * Emitted when the amendment chain cannot be resolved for a claim. Carrying no
 * amendments with `currentApplicabilityEstablished: false` is the fail-closed
 * shape: the quotation is still delivered, cited and correct, but the current
 * legal position is explicitly withheld rather than defaulting to settled.
 */
function unestablishedNotice(params: {
  claimId: string;
  manifestId: string;
  title: string;
  provision: string;
}): AmendmentNotice {
  return {
    claimId: params.claimId,
    baseManifestId: params.manifestId,
    baseInstrumentTitle: params.title,
    provision: params.provision,
    amendments: [],
    currentApplicabilityEstablished: false,
  };
}

/**
 * Build amendment notices for the claims in this answer.
 *
 * This is the temporal-accuracy half of the system. A perfectly cited provision
 * that was repealed by a later Act is still a wrong answer, and citation
 * machinery cannot detect it — only chronology can.
 */
function buildAmendmentNotices(
  claims: readonly NovaClaim[],
  chunks: readonly NovaRetrievedChunk[],
  manifest: SourceManifest | undefined,
): { notices: AmendmentNotice[]; unresolved: NovaUnresolved[] } {
  const notices: AmendmentNotice[] = [];
  const unresolved: NovaUnresolved[] = [];

  const byChunkId = new Map(chunks.map((c) => [c.chunkId, c]));

  for (const claim of claims) {
    const chunkId = claim.evidence[0]?.chunkId;
    const chunk = chunkId ? byChunkId.get(chunkId) : undefined;
    if (!chunk) continue;

    // ── Fail closed: no manifest for this jurisdiction ────────────────────
    //
    // This branch used to return early with no notices at all, which made "we
    // hold no chronology for this country" look exactly like "this provision
    // has no amendments". The caveat disappeared, and a disappeared caveat is
    // the failure mode citation grounding cannot detect: the quotation is
    // still perfectly cited, and still possibly repealed.
    if (!manifest) {
      notices.push(
        unestablishedNotice({
          claimId: claim.claimId,
          manifestId: chunk.manifestId ?? 'unknown',
          title: chunk.citation.document,
          provision: chunk.sectionReference ?? 'this provision',
        }),
      );
      unresolved.push({
        question: `Current legal position of ${chunk.sectionReference ?? 'this provision'} of ${chunk.citation.document}`,
        why:
          'No source manifest is registered for this jurisdiction, so no amendment history is ' +
          'available for any provision in it. The passage is quoted as published; the current ' +
          'legal position is not stated.',
      });
      continue;
    }

    const entry = manifestEntryForChunk(manifest, chunk);

    // ── Fail closed: the source is not in the manifest ────────────────────
    //
    // The chunk came from a published pack the manifest does not describe, so
    // the corpus definition and the database disagree. The quotation is still
    // sound — it is cited and grounded — but nothing can be said about whether
    // the provision has been amended.
    if (!entry) {
      notices.push(
        unestablishedNotice({
          claimId: claim.claimId,
          manifestId: chunk.manifestId ?? 'unknown',
          title: chunk.citation.document,
          provision: chunk.sectionReference ?? 'this provision',
        }),
      );
      unresolved.push({
        question: `Current legal position of ${chunk.sectionReference ?? 'this provision'} of ${chunk.citation.document}`,
        why:
          'This source could not be matched to the Knowledge Pack manifest, so its amendment ' +
          'history is unknown. The passage is quoted as published; the current legal position ' +
          'is not stated.',
      });
      continue;
    }

    // ── Fail closed: the provision cannot be identified ───────────────────
    //
    // A chunk with no parseable provision reference cannot be checked against
    // the amendment chain. Skipping silently would present it as unamended —
    // which is exactly the wrong default for Schedules and definitions
    // sections, the chunks least likely to carry a clean reference and, in the
    // Bahamian corpus, precisely where the 2026 food exemption lives.
    const provisionId = chunk.provisionId;
    if (!provisionId) {
      if (entry.amendedBy.length === 0) continue;

      notices.push(
        unestablishedNotice({
          claimId: claim.claimId,
          manifestId: entry.manifestId,
          title: entry.title,
          provision: chunk.sectionReference ?? 'an unidentified provision',
        }),
      );
      unresolved.push({
        question: `Current legal position of a passage in ${entry.title}`,
        why:
          `${entry.title} is amended by ${entry.amendedBy.length} later instrument(s), and this ` +
          'passage carries no provision reference that could be matched against them. The ' +
          'current legal position is not stated.',
      });
      continue;
    }

    const provision = chunk.sectionReference ?? provisionId;
    const amending = amendmentsForProvision(manifest, entry.manifestId, provisionId);
    if (amending.length === 0) continue;

    const amendments: AmendmentReference[] = amending.map((a) => ({
      manifestId: a.manifestId,
      title: a.title,
      actNumber: a.actNumber,
      commencementDate: a.commencementDate,
      commencementEstablished: a.legalStatus === 'in_force' && a.commencementDate !== null,
    }));

    const allEstablished = amendments.every((a) => a.commencementEstablished);

    notices.push({
      claimId: claim.claimId,
      baseManifestId: entry.manifestId,
      baseInstrumentTitle: entry.title,
      provision,
      amendments,
      currentApplicabilityEstablished: allEstablished,
    });

    if (!allEstablished) {
      const unestablished = amendments
        .filter((a) => !a.commencementEstablished)
        .map((a) => a.actNumber ?? a.title)
        .join(', ');
      unresolved.push({
        question: `Current legal position of ${provision} of ${entry.title}`,
        why:
          `${provision} is affected by ${unestablished}, whose commencement could not be ` +
          'established. The current legal position is therefore not stated.',
      });
    }
  }

  return { notices, unresolved };
}

/** Assemble the no-published-knowledge answer. No agent ran; there is no envelope. */
function noPublishedKnowledgeAnswer(
  retrieval: Extract<NovaRetrievalResult, { status: 'no_published_knowledge' }>,
  request: NovaAnswerRequest,
): NovaAnswer {
  return {
    outcome: 'no_published_knowledge',
    envelope: null,
    citations: [],
    amendmentNotices: [],
    coverage: retrieval.coverage,
    jurisdiction: retrieval.countryCode,
    knowledgeVersion: null,
    packId: null,
    // No run happened, so there is nothing to reproduce and no ordered set.
    reproducibility: null,
    retrievedChunkIds: [],
    unresolved: [
      {
        question: request.question,
        why:
          `No Knowledge Pack is published for ${retrieval.countryCode}, so there are no ` +
          'authoritative sources to quote. This is an absence of knowledge, not an absence ' +
          'of an answer in the sources we hold.',
      },
    ],
    retrievedAt: retrieval.retrievedAt,
  };
}

function outcomeFor(envelope: NovaEnvelope): NovaAnswerOutcome {
  switch (envelope.status) {
    case 'OK':
      return 'answered';
    case 'NEEDS_CLARIFICATION':
      return 'needs_clarification';
    default:
      return 'no_matching_evidence';
  }
}

/**
 * Answer a founder's question about their business.
 *
 * Flow — each step's failure mode is distinct and preserved:
 *
 *   resolve context → retrieve (fails closed on malformed results)
 *     ├─ no published pack ──────────► no_published_knowledge, no envelope
 *     └─ retrieved
 *          → map chunks to agent evidence
 *          → reason extractively (quotation only; no model, no prompt)
 *          → materialise citations from THIS run
 *          → assertCitationsGrounded (fails closed)
 *          → attach amendment metadata
 *          → answered | no_matching_evidence | needs_clarification
 */
export async function answerNovaQuestion(db: Db, request: NovaAnswerRequest): Promise<NovaAnswer> {
  const retrieval = await retrieveNovaEvidence(db, {
    context: request.context.retrieval,
    queryRepresentation: request.queryRepresentation,
    ...(request.topK !== undefined ? { topK: request.topK } : {}),
  });

  if (retrieval.status === 'no_published_knowledge') {
    return noPublishedKnowledgeAnswer(retrieval, request);
  }

  return assembleAnswer(retrieval, request);
}

/**
 * Everything after a successful retrieval.
 *
 * Split out so the orchestration can be exercised without a database stub —
 * the interesting behaviour is here, not in the query.
 */
export function assembleAnswer(
  retrieval: NovaRetrievalRun,
  request: NovaAnswerRequest,
): NovaAnswer {
  const envelope = reasonExtractively({
    question: request.question,
    knowledgeVersion: retrieval.reproducibility.knowledgePackVersion,
    evidence: toEvidenceInput(retrieval.chunks),
  });

  const citations = buildClaimCitations(envelope.claims, retrieval.chunks);

  // Fails closed. Every cited chunk must have been returned by THIS run
  // (ADR-0017). An unverifiable citation is worse than none.
  assertCitationsGrounded(
    citations.flatMap((c) => c.citations),
    retrieval.chunks.map((c) => c.chunkId),
  );

  const { notices, unresolved: amendmentGaps } = buildAmendmentNotices(
    envelope.claims,
    retrieval.chunks,
    request.manifest,
  );

  return {
    outcome: outcomeFor(envelope),
    envelope,
    citations,
    amendmentNotices: notices,
    coverage: retrieval.coverage,
    jurisdiction: request.context.retrieval.countryCode,
    knowledgeVersion: retrieval.reproducibility.knowledgePackVersion,
    packId: retrieval.packId,
    reproducibility: retrieval.reproducibility,
    retrievedChunkIds: retrieval.chunks.map((c) => c.chunkId),
    unresolved: [...envelope.unresolved, ...amendmentGaps],
    retrievedAt: retrieval.retrievedAt,
  };
}
