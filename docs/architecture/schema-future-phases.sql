-- ============================================================================
-- FoundryAI — Schema design for Phases 3–7
--
-- ⚠ THIS IS NOT A MIGRATION. It lives outside supabase/migrations/ deliberately
--   so no tooling can apply it. Its purpose is to prove that the Sprint 1
--   schema does not paint us into a corner — nothing below requires altering
--   a Sprint 1 table.
--
-- Sprint-01 places AI, Knowledge, Nova, Funding and Compliance out of scope.
-- Each block below is created in the phase named against it, with its own
-- migration, its own RLS tests, and its own review.
--
-- Two design patterns recur and are worth reviewing now, because they are the
-- expensive things to change later:
--
--   PATTERN A — AI PROVENANCE
--     Database Architecture § Audit Trail: "Every AI-generated object records
--     generated_by, generated_at, model_version, prompt_version, confidence,
--     citations. Nothing is anonymous."
--     Every AI-written table carries the same six columns, so provenance is
--     uniform and queryable across the platform rather than per-feature.
--     This is what makes "a human can reproduce the reasoning path"
--     (AI System Architecture) actually true.
--
--   PATTERN B — TRUST CLASSIFICATION
--     Trust Layer & Evidence Framework: four badges plus a 0–100 score.
--     Stored on every user-facing recommendation.
--
--     ⚠ OPEN CONFLICT — this is the single largest unresolved item before
--       Phase 4. The Trust Layer defines four badges and a 0–100 score; the
--       AI System Architecture, Knowledge Architecture and Research Agent
--       specification each define a DIFFERENT 1–5 confidence scale, and none
--       maps onto the badges. The `trust_score` bound below (>= 50) also
--       contradicts the Trust Layer's own '⚪ UNKNOWN is displayed' rule,
--       since UNKNOWN carries no score. RESOLVE BEFORE IMPLEMENTING.
-- ============================================================================


-- ============================================================================
-- PHASE 7 — shared trust vocabulary (created early; everything else cites it)
-- ============================================================================

create type public.trust_level as enum (
  'verified',     -- 🟢 legislation or official government documentation
  'derived',      -- 🟡 synthesised from multiple verified sources
  'recommended',  -- 🔵 professional best practice, not legally required
  'unknown'       -- ⚪ no authoritative information exists
);

-- Reusable provenance shape (Pattern A). Repeated as columns on each AI table
-- rather than a shared parent, so each table stays independently indexable.
--
--   generated_by     text        agent name: 'compliance', 'funding', ...
--   generated_at     timestamptz
--   model_version    text        e.g. 'claude-...' — the exact model used
--   prompt_version   text        prompt contract version (AI System Arch.)
--   knowledge_version text       Knowledge Pack version cited
--   confidence       smallint    RAW agent confidence — see OPEN CONFLICT above
--   trust_level      trust_level user-facing badge
--   trust_score      smallint    0–100
--   citations        jsonb       array of citation objects (see below)
--
-- Citation object shape — see the CANONICAL definition in
-- docs/architecture/trust-layer-specification.md §8. Do not restate it here.
--   MANDATORY: chunk_id (retrieval identity), agency, document, section,
--              publication_date, last_reviewed_date, knowledge_version,
--              url, accessed_at
--   OPTIONAL:  clause, page
-- chunk_id binds a claim to the exact chunk returned by the current retrieval
-- run; without it, citation binding and grounding cannot be reproduced.


-- ============================================================================
-- PHASE 4 — launch plans and tasks
-- ============================================================================

create type public.plan_status as enum ('generating','ready','stale','failed');
create type public.task_status as enum ('not_started','in_progress','blocked','complete','skipped');
create type public.task_priority as enum ('critical','high','medium','low');

-- One evolving roadmap per business (Database Architecture § Launch Plans).
create table public.launch_plans (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null unique references public.businesses (id) on delete cascade,
  status             public.plan_status not null default 'generating',
  version            integer not null default 1,
  generated_at       timestamptz,
  -- Marks the plan stale when the Knowledge Pack it was built from changes
  -- (Trust Layer § Government Updates: "affected workflows flagged").
  knowledge_version  text,
  superseded_at      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint launch_plans_version_positive check (version >= 1)
);

create table public.tasks (
  id                  uuid primary key default gen_random_uuid(),
  launch_plan_id      uuid not null references public.launch_plans (id) on delete cascade,
  business_id         uuid not null references public.businesses (id) on delete cascade,
  title               text not null,
  description         text,
  priority            public.task_priority not null default 'medium',
  status              public.task_status   not null default 'not_started',
  sort_order          integer  not null default 0,
  due_date            date,
  estimated_days      smallint,
  completed_at        timestamptz,
  -- Pattern A + B
  generated_by        text,
  generated_at        timestamptz,
  model_version       text,
  prompt_version      text,
  knowledge_version   text,
  trust_level         public.trust_level,
  trust_score         smallint,
  citations           jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint tasks_title_length     check (char_length(btrim(title)) between 1 and 300),
  constraint tasks_estimated_days   check (estimated_days is null or estimated_days between 0 and 3650),
  constraint tasks_trust_score      check (trust_score is null or trust_score between 0 and 100),
  constraint tasks_citations_array  check (jsonb_typeof(citations) = 'array'),
  constraint tasks_completed_consistency
    check ((status = 'complete') = (completed_at is not null))
);

-- Self-referencing dependency edges. A join table rather than a `depends_on`
-- column, because Database Architecture § Tasks implies many dependencies and
-- a single column cannot express a DAG.
create table public.task_dependencies (
  task_id           uuid not null references public.tasks (id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks (id) on delete cascade,
  primary key (task_id, depends_on_task_id),
  constraint task_dependencies_no_self_reference check (task_id <> depends_on_task_id)
);
-- NOTE: cycle prevention is NOT expressible as a constraint. The Action Plan
-- Agent's output must be validated as a DAG in services/ before insert.


-- ============================================================================
-- PHASE 4 — compliance and funding (agent outputs)
-- ============================================================================

create table public.compliance_requirements (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references public.businesses (id) on delete cascade,
  launch_plan_id     uuid references public.launch_plans (id) on delete set null,
  requirement_type   text not null,      -- registration | licence | permit
  title              text not null,
  description        text,
  agency             text not null,
  estimated_fee      numeric(14,2),
  fee_currency       char(3),
  estimated_days_min smallint,
  estimated_days_max smallint,
  required_documents jsonb not null default '[]'::jsonb,
  is_complete        boolean not null default false,
  completed_at       timestamptz,
  -- Pattern A + B — a compliance requirement without citations must not exist.
  generated_by       text not null,
  generated_at       timestamptz not null default now(),
  model_version      text not null,
  prompt_version     text not null,
  knowledge_version  text not null,
  trust_level        public.trust_level not null,
  trust_score        smallint not null,
  citations          jsonb not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint cr_fee_currency_required   check (estimated_fee is null or fee_currency is not null),
  constraint cr_days_range              check (estimated_days_min is null or estimated_days_max is null
                                               or estimated_days_min <= estimated_days_max),
  constraint cr_trust_score_range       check (trust_score between 0 and 100),
  constraint cr_citations_array         check (jsonb_typeof(citations) = 'array'),
  -- THE CONSTITUTIONAL CONSTRAINT: a 🟢/🟡 requirement MUST carry evidence.
  -- "Every requirement must include citations" — AI System Architecture.
  -- Enforced in the database so no code path can bypass it.
  constraint cr_evidence_required
    check (trust_level in ('recommended','unknown') or jsonb_array_length(citations) > 0)
);

create table public.funding_opportunities (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references public.businesses (id) on delete cascade,
  programme_name     text not null,
  provider           text not null,
  amount_min         numeric(14,2),
  amount_max         numeric(14,2),
  currency           char(3),
  eligibility_summary text,
  -- Funding Agent spec: "If eligibility cannot be determined, the agent says so."
  -- NULL is therefore a meaningful value and must not be coerced to false.
  is_eligible        boolean,
  application_url    text,
  deadline           date,
  required_documents jsonb not null default '[]'::jsonb,
  generated_by       text not null,
  generated_at       timestamptz not null default now(),
  model_version      text not null,
  prompt_version     text not null,
  knowledge_version  text not null,
  trust_level        public.trust_level not null,
  trust_score        smallint not null,
  citations          jsonb not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint fo_amount_range      check (amount_min is null or amount_max is null or amount_min <= amount_max),
  constraint fo_currency_required check ((amount_min is null and amount_max is null) or currency is not null),
  constraint fo_trust_score_range check (trust_score between 0 and 100),
  constraint fo_citations_array   check (jsonb_typeof(citations) = 'array'),
  constraint fo_evidence_required
    check (trust_level in ('recommended','unknown') or jsonb_array_length(citations) > 0)
);


-- ============================================================================
-- PHASE 4 — workflow runs (addresses R-10 and R-12 from the Understanding Report)
--   Multi-agent generation is long-running and resumable. Without a run record
--   there is nowhere for a paused workflow to live, and `Continue Workflow` /
--   `Regenerate Section` have no state model behind them.
-- ============================================================================

create type public.workflow_status as enum
  ('queued','running','needs_clarification','completed','failed','cancelled');

create table public.workflow_runs (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references public.businesses (id) on delete cascade,
  status             public.workflow_status not null default 'queued',
  current_agent      text,
  -- Coordinator spec: on missing information it emits a structured
  -- NEEDS_CLARIFICATION status with a question payload (ADR pending, Q15).
  clarification      jsonb,
  correlation_id     uuid not null,
  started_at         timestamptz,
  finished_at        timestamptz,
  error_code         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- One row per agent invocation: the reproducibility record.
create table public.agent_executions (
  id                uuid primary key default gen_random_uuid(),
  workflow_run_id   uuid not null references public.workflow_runs (id) on delete cascade,
  agent             text not null,
  sequence_no       smallint not null,
  status            text not null,
  input             jsonb,
  output            jsonb,
  model_version     text,
  prompt_version    text,
  knowledge_version text,
  confidence        smallint,
  latency_ms        integer,
  token_input       integer,
  token_output      integer,   -- supports the cost tracking absent from the docs (R-14)
  error_code        text,
  created_at        timestamptz not null default now(),
  unique (workflow_run_id, sequence_no)
);


-- ============================================================================
-- PHASE 6 — Nova conversations
--   AI System Architecture: "Conversation Memory and Knowledge Context never mix."
--   That separation is structural here: conversation tables hold no knowledge,
--   and knowledge tables hold no conversation. Nothing joins them at retrieval.
-- ============================================================================

create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  title       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.conversation_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role            text not null check (role in ('user','assistant')),
  content         text not null,
  agent           text,
  model_version   text,
  prompt_version  text,
  trust_level     public.trust_level,
  citations       jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  constraint cm_citations_array check (jsonb_typeof(citations) = 'array')
);


-- ============================================================================
-- PHASE 3 — Knowledge Pack
--   ⚠ BLOCKED: embedding model and dimensionality are undecided (open Q18).
--   Dimensionality is a COLUMN TYPE — vector(N) — so this table cannot be
--   created until that decision is made. Changing N later means re-embedding
--   the entire corpus.
--
--   Knowledge is NOT business-owned. It is global reference data, readable by
--   every authenticated user and writable only by the ingestion pipeline.
--   It therefore does NOT use app.business_access.
-- ============================================================================

-- create extension if not exists vector;   -- pgvector

create table public.knowledge_documents (
  id                uuid primary key default gen_random_uuid(),
  country_code      char(2) not null references public.countries (code),
  title             text not null,
  agency            text not null,
  category          text not null,
  document_type     text not null,
  source_url        text,
  publication_date  date,
  effective_date    date,
  expiry_date       date,
  version           text not null,
  confidence        smallint not null,
  last_reviewed_at  timestamptz,
  -- Knowledge Architecture § Knowledge Maintenance: 14/30-day review cadence.
  -- Storing the due date makes staleness queryable instead of a calendar
  -- reminder nobody owns (R-15).
  review_due_at     timestamptz,
  is_published      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint kd_confidence_range check (confidence between 1 and 5),
  constraint kd_date_order       check (expiry_date is null or effective_date is null
                                        or effective_date <= expiry_date)
);

create table public.knowledge_chunks (
  id                    uuid primary key default gen_random_uuid(),
  knowledge_document_id uuid not null references public.knowledge_documents (id) on delete cascade,
  chunk_index           integer not null,
  content               text not null,
  section_reference     text,
  -- embedding          vector(N) not null,   -- ⚠ N BLOCKED ON Q18
  token_count           integer,
  created_at            timestamptz not null default now(),
  unique (knowledge_document_id, chunk_index)
);

-- Retrieval indexes (Research Agent § Retrieval Pipeline: metadata filters are
-- applied BEFORE vector search, so the metadata index carries the selectivity).
-- create index knowledge_documents_retrieval_idx
--   on public.knowledge_documents (country_code, category, is_published)
--   where is_published;
-- create index knowledge_chunks_embedding_idx
--   on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);


-- ============================================================================
-- PHASE 5 — documents
-- ============================================================================

create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses (id) on delete cascade,
  title         text not null,
  document_type text not null,
  storage_path  text not null,     -- Supabase Storage object path
  mime_type     text,
  size_bytes    bigint,
  created_at    timestamptz not null default now(),
  constraint documents_size_positive check (size_bytes is null or size_bytes >= 0)
);
-- NOTE: Supabase Storage enforces its own access policies. The storage bucket
-- policy must mirror app.business_access, or the row is protected while the
-- file behind it is not.


-- ============================================================================
-- RLS FOR ALL OF THE ABOVE (applied in each table's own migration)
--
--   Business-owned tables — identical shape to Sprint 1, via the single helper:
--     alter table X enable row level security;
--     alter table X force  row level security;
--     create policy X_select_own on X for select to authenticated
--       using (app.business_access(business_id));
--     ... insert / update likewise. NO DELETE POLICY.
--
--   Tables one hop away from a business (tasks via launch_plan,
--   conversation_messages via conversation) resolve through their parent's
--   business_id — which is why tasks carries a denormalised business_id: it
--   keeps the RLS predicate a single indexed lookup rather than a join.
--   That denormalisation is deliberate and is the one place the Database
--   Architecture's "duplicate information should never exist" principle is
--   traded against policy performance. Flagged for founder review.
--
--   Knowledge tables — global reference data:
--     create policy knowledge_select on public.knowledge_documents
--       for select to authenticated using (is_published);
--     No write policies: the ingestion pipeline runs as service_role.
-- ============================================================================
