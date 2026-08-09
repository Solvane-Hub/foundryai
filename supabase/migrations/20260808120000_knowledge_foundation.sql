-- ============================================================================
-- FoundryAI — Knowledge/Retrieval Foundation, Phase 1
--
-- Implements K1 (Knowledge Pack) · K2 (validation) · K3 (chunking) ·
-- K4 (metadata/citation) · K7 (publishing). Retrieval (K5) is contract-only in
-- this phase; no vector column and no index are created.
--
-- ⚠ KI1 / MP-1 REMAINS OPEN. No embedding model, provider or dimensionality is
--   chosen here. `vector(N)` is a COLUMN TYPE, so the embedding column cannot
--   exist until N is decided. `knowledge_embedding_manifests` records WHICH
--   model produced an artifact; it deliberately stores no vectors.
--
-- Knowledge is NOT business-owned. It is global reference data: readable by any
-- authenticated user, writable only by the ingestion pipeline (service role).
-- It therefore does not use app.business_access().
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Vocabularies
-- ---------------------------------------------------------------------------

-- K2 §8.1. Metadata ALONGSIDE the five-level Source Authority scale, used only
-- to order conflicts WITHIN a level. This is not a second trust scale and there
-- is no sixth level (finding A4).
create type public.legal_source_category as enum (
  'constitution',
  'primary_legislation',
  'regulation',
  'ministerial_order',
  'official_guidance',
  'agency_publication'
);

create type public.knowledge_source_type as enum (
  'act', 'regulation', 'statutory_instrument', 'gazette_notice',
  'guidance_note', 'agency_page', 'form', 'fee_schedule'
);

-- K7 §4. Publication state machine. `superseded` and `rolled_back` are distinct:
-- one is normal succession, the other is an incident. Collapsing them would lose
-- the only signal that a release was withdrawn rather than replaced.
create type public.knowledge_pack_status as enum (
  'draft', 'validating', 'staged', 'published', 'superseded', 'rolled_back'
);

-- K2 §9.
create type public.validation_outcome as enum (
  'validated', 'partially_validated', 'unverified', 'rejected'
);

-- K6 §2A.4. Freshness affects publication status and review priority. It is NOT
-- a fifth trust dimension (ADR-0015) and must never be rendered as one.
create type public.knowledge_freshness_state as enum (
  'current', 'review_due', 'changed_pending_assessment', 'stale', 'withdrawn'
);

-- ---------------------------------------------------------------------------
-- K1 — Knowledge Pack. The system of record for published knowledge.
-- ---------------------------------------------------------------------------
create table public.knowledge_packs (
  id                  uuid primary key default gen_random_uuid(),
  country_code        char(2) not null references public.countries (code),
  -- Human-facing version identity, e.g. 'BS-v1.4'. Unique per jurisdiction.
  version             text not null,
  status              public.knowledge_pack_status not null default 'draft',
  notes               text,

  -- K7 §9 approval record. Populated only on publication.
  published_at        timestamptz,
  published_by        uuid references auth.users (id),
  approval_note       text,
  superseded_at       timestamptz,
  superseded_by_id    uuid references public.knowledge_packs (id),

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint kp_version_per_country unique (country_code, version),
  constraint kp_version_format check (version ~ '^[A-Z]{2}-v[0-9]+\.[0-9]+$'),
  -- K7 §9: a published pack must carry its approval record. Enforced here
  -- rather than in application code because "who approved this" is the kind of
  -- field that goes missing exactly when it is needed.
  constraint kp_published_has_approval check (
    status <> 'published' or (published_at is not null and published_by is not null)
  )
);

-- K7 §4.2 atomic publication: at most one published pack per jurisdiction.
create unique index knowledge_packs_one_published_per_country
  on public.knowledge_packs (country_code)
  where status = 'published';

create index knowledge_packs_country_status_idx
  on public.knowledge_packs (country_code, status);

comment on table public.knowledge_packs is
  'K1 — Knowledge Pack, the system of record. Immutable once published (K7 §4.3). '
  'Embeddings are retrieval artifacts and do NOT increment this version (K7 §3.1).';

-- ---------------------------------------------------------------------------
-- Source registration — K1 §4, K2 §7, K4 §5, K7
-- ---------------------------------------------------------------------------
create table public.knowledge_sources (
  id                     uuid primary key default gen_random_uuid(),
  knowledge_pack_id      uuid not null references public.knowledge_packs (id) on delete cascade,

  -- Identity and provenance
  agency                 text not null,
  title                  text not null,
  source_url             text,
  source_type            public.knowledge_source_type not null,
  country_code           char(2) not null references public.countries (code),
  region                 text,
  municipality           text,

  -- Authority. ADR-0015 owns the scale; K2 §8.1 owns the category mapping.
  -- Source Authority is a property of the DOCUMENT, not the publisher (C1).
  source_authority       smallint not null,
  legal_source_category  public.legal_source_category not null,

  -- Temporal (K4 §5)
  publication_date       date,
  effective_date         date,
  expiry_date            date,
  last_reviewed_date     date,
  review_due_at          timestamptz,
  freshness_state        public.knowledge_freshness_state not null default 'current',

  -- Retrieval / access metadata (K4 §6 provenance, K2 §4.4 reproducibility)
  accessed_at            timestamptz,
  content_hash           text,
  content_media_type     text,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint ks_authority_range check (source_authority between 1 and 5),
  constraint ks_date_order check (
    expiry_date is null or effective_date is null or effective_date <= expiry_date
  ),
  -- ADR-0015 + C1: authority is derived from the document's legal category.
  -- Encoding the mapping here stops a 🟢 VERIFIED badge being reachable from
  -- official guidance, which is precisely the control ADR-0015 tightened.
  constraint ks_authority_matches_category check (
    (legal_source_category in ('constitution', 'primary_legislation') and source_authority = 5)
    or (legal_source_category in ('regulation', 'ministerial_order') and source_authority = 4)
    or (legal_source_category = 'official_guidance' and source_authority = 3)
    or (legal_source_category = 'agency_publication' and source_authority between 2 and 3)
  )
);

create index knowledge_sources_pack_idx on public.knowledge_sources (knowledge_pack_id);
create index knowledge_sources_review_due_idx
  on public.knowledge_sources (review_due_at)
  where freshness_state <> 'withdrawn';

comment on column public.knowledge_sources.source_authority is
  'ADR-0015 Source Authority 1-5. A property of the DOCUMENT, never the publisher.';

-- ---------------------------------------------------------------------------
-- K2 — validation records. Append-only; revalidation adds a row (K2 §4.7, §6).
-- ---------------------------------------------------------------------------
create table public.knowledge_source_validations (
  id                    uuid primary key default gen_random_uuid(),
  knowledge_source_id   uuid not null references public.knowledge_sources (id) on delete cascade,
  outcome               public.validation_outcome not null,

  -- K2 §6 checks, recorded individually so a failure says WHICH check failed.
  source_valid          boolean not null,
  structure_valid       boolean not null,
  metadata_valid        boolean not null,
  provenance_valid      boolean not null,
  classification_valid  boolean not null,

  validator             text not null,
  reviewer_notes        text,
  failure_reasons       jsonb not null default '[]'::jsonb,
  validated_at          timestamptz not null default now()
);

create index ksv_source_idx
  on public.knowledge_source_validations (knowledge_source_id, validated_at desc);

comment on table public.knowledge_source_validations is
  'K2 validation record. Supplies Source Authority ONLY. Evidence Strength and '
  'Reasoning Confidence are claim-level and are derived by the Trust Layer per claim.';

-- ---------------------------------------------------------------------------
-- K3 — chunks. `chunk_id` is the single citation identity (A12, K5 §3.10).
-- ---------------------------------------------------------------------------
create table public.knowledge_chunks (
  -- Deterministic UUIDv5 derived from (pack version, source, section, content).
  -- Not a random default: retries must produce the same id (ADR-0016 idempotency).
  chunk_id              uuid primary key,
  knowledge_source_id   uuid not null references public.knowledge_sources (id) on delete cascade,
  knowledge_pack_id     uuid not null references public.knowledge_packs (id) on delete cascade,

  chunk_index           integer not null,
  title                 text,
  body                  text not null,
  content_hash          text not null,

  -- Provenance (K3 §3 "Preserve Traceability", K4 §6)
  country_code          char(2) not null references public.countries (code),
  section_reference     text,
  clause                text,
  page                  integer,

  -- Source-level metadata ONLY (K3 §5.1). Denormalised from the source so a
  -- retrieval result can be ranked and cited without a join.
  source_authority      smallint not null,
  legal_source_category public.legal_source_category not null,

  -- Classification (K4 §5)
  industry              text,
  regulatory_domain     text,
  keywords              text[] not null default '{}',
  effective_date        date,

  chunk_version         integer not null default 1,
  created_at            timestamptz not null default now(),

  constraint kc_authority_range check (source_authority between 1 and 5),
  constraint kc_index_per_source unique (knowledge_source_id, chunk_index)
);

create index knowledge_chunks_pack_idx on public.knowledge_chunks (knowledge_pack_id);
create index knowledge_chunks_source_idx on public.knowledge_chunks (knowledge_source_id);
-- K5 §6 deterministic filtering happens before semantic search, so the filter
-- columns are indexed and the (absent) vector column is not the entry point.
create index knowledge_chunks_filter_idx
  on public.knowledge_chunks (country_code, regulatory_domain, industry);

comment on table public.knowledge_chunks is
  'K3 chunk. Carries Source Authority ONLY (K3 §5.1). Evidence Strength, '
  'Reasoning Confidence, Trust Level and Trust Score are claim-level and MUST NOT '
  'be added as columns here — the same chunk can be strong evidence for one claim '
  'and weak for another. Adding them would let a value computed once at publication '
  'be reused for claims it was never assessed against.';

-- K3 §7.1 conditional relationships (harvest D4.3). A condition is a property of
-- the RELATIONSHIP, never a trust dimension.
create table public.knowledge_chunk_relations (
  id                uuid primary key default gen_random_uuid(),
  from_chunk_id     uuid not null references public.knowledge_chunks (chunk_id) on delete cascade,
  to_chunk_id       uuid references public.knowledge_chunks (chunk_id) on delete cascade,
  relation_type     text not null,
  -- Structured predicate, e.g. {"field":"employees","op":"gt","value":5}.
  -- Structured because a condition in prose can only be honoured by a model
  -- reading it correctly every time, which is not a control.
  applies_if        jsonb,
  created_at        timestamptz not null default now(),
  constraint kcr_relation_type check (
    relation_type in ('prerequisite','exception','dependency','supersedes',
                      'related_procedure','supporting_guidance','applies_if')
  ),
  constraint kcr_not_self check (from_chunk_id <> to_chunk_id)
);

create index kcr_from_idx on public.knowledge_chunk_relations (from_chunk_id);

-- ---------------------------------------------------------------------------
-- Embedding manifests — K7 §3.1 / §7. RETRIEVAL ARTIFACTS, not Pack versions.
--
-- ⚠ NO VECTOR COLUMN AND NO INDEX EXIST YET. This table records which model
--   produced an artifact so a historical retrieval can be replayed (K5 §3.8).
--   `dimensions` is stored as data, not as a column type, precisely so this
--   table does not itself become blocked on KI1.
-- ---------------------------------------------------------------------------
create table public.knowledge_embedding_manifests (
  id                       uuid primary key default gen_random_uuid(),
  knowledge_pack_id        uuid not null references public.knowledge_packs (id) on delete cascade,

  provider                 text not null,
  model                    text not null,
  model_version            text not null,
  dimensions               integer not null,

  retrieval_config_version text not null,
  chunk_version            integer not null,
  status                   text not null default 'pending',
  generated_at             timestamptz not null default now(),

  constraint kem_dimensions_positive check (dimensions > 0),
  constraint kem_status check (status in ('pending','generating','complete','failed','invalidated'))
);

create index kem_pack_idx on public.knowledge_embedding_manifests (knowledge_pack_id, generated_at desc);

comment on table public.knowledge_embedding_manifests is
  'K7 §3.1 — embeddings are retrieval artifacts. Regenerating them does NOT '
  'increment the Knowledge Pack version. Recorded because deterministic retrieval '
  'replay (K5 §3.8) is impossible without the model and version that produced the vectors.';

-- ---------------------------------------------------------------------------
-- K7 §4.3 immutability + K7 §4.2 atomic publication
-- ---------------------------------------------------------------------------

-- A published pack may only move to superseded or rolled_back, and only its
-- lifecycle columns may change. Everything else is frozen.
create or replace function public.enforce_pack_immutability()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status = 'published' then
    if new.status not in ('published','superseded','rolled_back') then
      raise exception 'K7 §4.3: a published Knowledge Pack is immutable (% -> %)',
        old.status, new.status
        using errcode = 'check_violation';
    end if;
    if new.version <> old.version
       or new.country_code <> old.country_code
       or new.published_at is distinct from old.published_at
       or new.published_by is distinct from old.published_by then
      raise exception 'K7 §4.3: cannot alter identity or approval of a published Knowledge Pack'
        using errcode = 'check_violation';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger knowledge_packs_immutability
  before update on public.knowledge_packs
  for each row execute function public.enforce_pack_immutability();

-- Chunks belonging to a published pack are frozen. Corrections publish a new
-- version (K7 §4.3) — they never edit in place, because citations point at
-- chunk_id and rewriting the body under a stable id silently changes what a
-- founder was told.
create or replace function public.reject_published_chunk_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  pack_status public.knowledge_pack_status;
  target_pack uuid;
begin
  target_pack := coalesce(new.knowledge_pack_id, old.knowledge_pack_id);
  select status into pack_status from public.knowledge_packs where id = target_pack;
  if pack_status = 'published' then
    raise exception 'K7 §4.3: chunks of a published Knowledge Pack are immutable'
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger knowledge_chunks_immutability
  before update or delete on public.knowledge_chunks
  for each row execute function public.reject_published_chunk_mutation();

-- K7 §4.2 — publication is atomic, or it does not happen. Supersession of the
-- previous pack and promotion of the new one occur in one statement, so a
-- failure cannot leave a jurisdiction with two published packs or none.
create or replace function public.publish_knowledge_pack(
  p_pack_id uuid,
  p_approved_by uuid,
  p_approval_note text default null
)
returns public.knowledge_packs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target public.knowledge_packs;
begin
  select * into target from public.knowledge_packs where id = p_pack_id for update;
  if not found then
    raise exception 'Knowledge Pack % not found', p_pack_id using errcode = 'no_data_found';
  end if;
  if target.status <> 'staged' then
    raise exception 'K7 §8: only a staged pack may be published (current status: %)', target.status
      using errcode = 'check_violation';
  end if;

  update public.knowledge_packs
     set status = 'superseded',
         superseded_at = now(),
         superseded_by_id = p_pack_id
   where country_code = target.country_code
     and status = 'published';

  update public.knowledge_packs
     set status = 'published',
         published_at = now(),
         published_by = p_approved_by,
         approval_note = p_approval_note
   where id = p_pack_id
  returning * into target;

  return target;
end;
$$;

revoke all on function public.publish_knowledge_pack(uuid, uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS — knowledge is global reference data (readable), pipeline-written (not).
-- Only PUBLISHED knowledge is readable. This is the database-level guarantee
-- behind "unpublished content cannot enter retrieval": it does not depend on
-- every query remembering to filter.
-- ---------------------------------------------------------------------------
alter table public.knowledge_packs                 enable row level security;
alter table public.knowledge_sources               enable row level security;
alter table public.knowledge_source_validations    enable row level security;
alter table public.knowledge_chunks                enable row level security;
alter table public.knowledge_chunk_relations       enable row level security;
alter table public.knowledge_embedding_manifests   enable row level security;

alter table public.knowledge_packs                 force row level security;
alter table public.knowledge_sources               force row level security;
alter table public.knowledge_source_validations    force row level security;
alter table public.knowledge_chunks                force row level security;
alter table public.knowledge_chunk_relations       force row level security;
alter table public.knowledge_embedding_manifests   force row level security;

create policy knowledge_packs_read_published on public.knowledge_packs
  for select to authenticated
  using (status = 'published');

create policy knowledge_sources_read_published on public.knowledge_sources
  for select to authenticated
  using (exists (
    select 1 from public.knowledge_packs p
     where p.id = knowledge_sources.knowledge_pack_id and p.status = 'published'
  ));

create policy knowledge_chunks_read_published on public.knowledge_chunks
  for select to authenticated
  using (exists (
    select 1 from public.knowledge_packs p
     where p.id = knowledge_chunks.knowledge_pack_id and p.status = 'published'
  ));

create policy knowledge_chunk_relations_read_published on public.knowledge_chunk_relations
  for select to authenticated
  using (exists (
    select 1 from public.knowledge_chunks c
      join public.knowledge_packs p on p.id = c.knowledge_pack_id
     where c.chunk_id = knowledge_chunk_relations.from_chunk_id and p.status = 'published'
  ));

-- Validation records and embedding manifests are operational, not founder-facing.
-- No authenticated policy: service role only.

comment on schema public is 'FoundryAI — Sprint 1 foundation + Knowledge/Retrieval Foundation Phase 1.';
