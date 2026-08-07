-- ============================================================================
-- FoundryAI · Sprint 1 · Phase 1 — Data Foundation
-- Migration: 20260805120000_sprint1_foundation
--
-- Status:  AWAITING FOUNDER APPROVAL — do not apply until approved.
-- Scope:   Sprint-01 only. AI, Knowledge, Nova, Funding and Compliance tables
--          are deliberately excluded (see docs/architecture/schema-design.md D17).
--
-- Governing documents:
--   Database Architecture v1.0 · Security Architecture · Platform Architecture
--   Engineering Standards §8, §10 · ADR-0006 (tenancy) · ADR-0007 (lifecycle)
--
-- Every decision below is explained in docs/architecture/schema-design.md.
-- Decision references appear as (D1)…(D17).
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. PRIVATE SCHEMA (D4)
--    Functions in `public` are published by PostgREST as callable RPC endpoints.
--    Internal security primitives must not be reachable from the API.
-- ----------------------------------------------------------------------------

create schema if not exists app;

revoke all on schema app from public;
revoke all on schema app from anon, authenticated;
grant usage on schema app to authenticated;


-- ----------------------------------------------------------------------------
-- 2. ENUMERATED TYPES (D8)
-- ----------------------------------------------------------------------------

-- Business lifecycle. Founder direction, 2026-08-05 (ADR-0007):
--   Draft → Intake Started → Intake Complete → Launch Plan Generated
--         → Business Active → Archived
-- Transition legality is enforced in services/business/, NOT here: an enum
-- constrains the vocabulary, a state machine constrains the sequence.
create type public.business_status as enum (
  'draft',
  'intake_started',
  'intake_complete',
  'launch_plan_generated',
  'active',
  'archived'
);


-- ----------------------------------------------------------------------------
-- 3. UTILITY FUNCTIONS
-- ----------------------------------------------------------------------------

-- Maintains updated_at (D6). Lives in the database because application code
-- eventually forgets, and a stale updated_at is invisible until someone debugs it.
create or replace function app.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function app.set_updated_at is
  'Trigger function: maintains updated_at on write. See schema-design.md D6.';


-- Blocks mutation of append-only tables (D12). A trigger fires regardless of
-- privilege, so this holds even against service_role, which carries BYPASSRLS.
create or replace function app.prevent_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception
    'Table %.% is append-only; % is not permitted.',
    tg_table_schema, tg_table_name, tg_op
    using errcode = '42501';
end;
$$;

comment on function app.prevent_mutation is
  'Trigger function: enforces append-only semantics. See schema-design.md D12.';


-- ----------------------------------------------------------------------------
-- 4. COUNTRIES — reference data (D8)
--    "Country-specific logic never resides inside application code."
--      — Platform Architecture, Multi-Country Expansion
-- ----------------------------------------------------------------------------

create table public.countries (
  code           char(2)     primary key,
  name           text        not null,
  currency_code  char(3)     not null,
  is_active      boolean     not null default false,
  created_at     timestamptz not null default now(),

  constraint countries_code_format
    check (code ~ '^[A-Z]{2}$'),
  constraint countries_currency_format
    check (currency_code ~ '^[A-Z]{3}$'),
  constraint countries_name_length
    check (char_length(btrim(name)) between 1 and 100)
);

comment on table public.countries is
  'ISO 3166-1 alpha-2 reference data. is_active gates which jurisdictions are live.';
comment on column public.countries.is_active is
  'A country row may exist before its Knowledge Pack is ready. Only active countries accept new businesses.';


-- ----------------------------------------------------------------------------
-- 5. PROFILES — application-level user attributes (D2)
--    auth.users remains the single source of truth for identity.
--    email is deliberately NOT duplicated here.
-- ----------------------------------------------------------------------------

create table public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint profiles_full_name_length
    check (full_name is null or char_length(btrim(full_name)) between 1 and 150)
);

comment on table public.profiles is
  'Application attributes for an authenticated user. Identity and email live in auth.users (schema-design.md D2).';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function app.set_updated_at();


-- Guarantees every auth user has a profile, no matter which path created them
-- (signup, admin invite, future OAuth, seed script). SECURITY DEFINER so it can
-- insert past RLS; search_path pinned to close the shadowing vector (D5).
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function app.handle_new_user is
  'Trigger on auth.users: creates the matching public.profiles row. See schema-design.md D2.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();


-- ----------------------------------------------------------------------------
-- 6. BUSINESSES — the tenancy root (D3, ADR-0006)
--    Tenant = user for MVP. owner_id is the tenancy column.
-- ----------------------------------------------------------------------------

create table public.businesses (
  id            uuid                   primary key default gen_random_uuid(),
  owner_id      uuid                   not null references auth.users (id) on delete cascade,
  name          text                   not null,
  industry      text,
  country_code  char(2)                not null references public.countries (code) on delete restrict,
  status        public.business_status not null default 'draft',
  archived_at   timestamptz,
  created_at    timestamptz            not null default now(),
  updated_at    timestamptz            not null default now(),

  constraint businesses_name_length
    check (char_length(btrim(name)) between 1 and 200),
  constraint businesses_industry_length
    check (industry is null or char_length(btrim(industry)) between 1 and 120),
  -- status and archived_at can never disagree (D16)
  constraint businesses_archived_consistency
    check ((status = 'archived') = (archived_at is not null))
);

comment on table public.businesses is
  'A founder''s business. Tenancy root: every business-owned row resolves ownership through this table.';
comment on column public.businesses.owner_id is
  'Tenancy column (ADR-0006). MVP tenant is the user; organisations arrive via app.business_access, not a schema rewrite.';
comment on column public.businesses.industry is
  'Free text by design (schema-design.md D8) — industry taxonomy belongs to the Knowledge Pack, validated in services/.';

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function app.set_updated_at();

-- Indexes (D15). PostgreSQL does not index foreign keys automatically.
create index businesses_owner_id_idx
  on public.businesses (owner_id);

create index businesses_country_code_idx
  on public.businesses (country_code);

-- Serves the dashboard's default listing — the most frequent query in the
-- product — without indexing archived rows nobody lists.
create index businesses_owner_active_idx
  on public.businesses (owner_id, updated_at desc)
  where status <> 'archived';

-- A founder cannot own two ACTIVE businesses with the same name, but may reuse
-- a name after archiving.
create unique index businesses_owner_active_name_key
  on public.businesses (owner_id, lower(btrim(name)))
  where status <> 'archived';


-- ----------------------------------------------------------------------------
-- 7. BUSINESS ACCESS HELPER (D3, D4, D5)
--
--    The single ownership predicate for every business-owned table.
--    Introducing organisations later becomes a change to THIS FUNCTION BODY
--    plus a membership table — not an edit to every policy in the schema.
--
--    SECURITY DEFINER: called from policies on OTHER tables; under INVOKER the
--    read of public.businesses would itself be RLS-filtered, causing recursive
--    policy evaluation.
--    search_path = '': closes the definer privilege-escalation vector (D5).
--    STABLE: lets the planner cache the result within a statement.
-- ----------------------------------------------------------------------------

create or replace function app.business_access(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = p_business_id
      and b.owner_id = (select auth.uid())
  );
$$;

comment on function app.business_access is
  'Single ownership predicate for business-owned tables (ADR-0006, schema-design.md D3). Change this one body to introduce organisations.';

revoke all on function app.business_access(uuid) from public, anon;
grant execute on function app.business_access(uuid) to authenticated;


-- ----------------------------------------------------------------------------
-- 8. BUSINESS PROFILES — intake responses, 1:1 with a business (D13, D14)
-- ----------------------------------------------------------------------------

create table public.business_profiles (
  id                            uuid          primary key default gen_random_uuid(),
  business_id                   uuid          not null unique
                                                references public.businesses (id) on delete cascade,

  -- Typed columns: the Coordinator Agent's documented input contract.
  description                   text,
  founder_goals                 text,
  location                      text,
  business_stage                text,
  employee_count                integer,
  funding_requirement_amount    numeric(14,2),
  funding_requirement_currency  char(3),

  -- Evolving intake answers. The question set is still open (Q6/Q-S3), so this
  -- absorbs wording changes without a migration per revision.
  responses                     jsonb         not null default '{}'::jsonb,

  -- Draft persistence and resumption — Sprint 1 acceptance criteria C3, C4.
  last_completed_step           smallint      not null default 0,
  completed_at                  timestamptz,

  created_at                    timestamptz   not null default now(),
  updated_at                    timestamptz   not null default now(),

  constraint bp_description_length
    check (description is null or char_length(description) <= 5000),
  constraint bp_founder_goals_length
    check (founder_goals is null or char_length(founder_goals) <= 5000),
  constraint bp_location_length
    check (location is null or char_length(btrim(location)) between 1 and 200),
  constraint bp_business_stage_length
    check (business_stage is null or char_length(btrim(business_stage)) between 1 and 60),
  constraint bp_employee_count_range
    check (employee_count is null or employee_count between 0 and 1000000),
  constraint bp_funding_amount_non_negative
    check (funding_requirement_amount is null or funding_requirement_amount >= 0),
  constraint bp_funding_currency_format
    check (funding_requirement_currency is null or funding_requirement_currency ~ '^[A-Z]{3}$'),
  -- An amount without a currency is a number, not a quantity (D9).
  constraint bp_funding_currency_required_with_amount
    check (funding_requirement_amount is null or funding_requirement_currency is not null),
  constraint bp_last_completed_step_range
    check (last_completed_step between 0 and 20),
  constraint bp_responses_is_object
    check (jsonb_typeof(responses) = 'object')
);

comment on table public.business_profiles is
  'Intake responses, 1:1 with a business. Hybrid typed/JSONB by design — see schema-design.md D13.';
comment on column public.business_profiles.responses is
  'Evolving intake answers. Constrained to a JSON object so it cannot silently become a scalar or array.';
comment on column public.business_profiles.last_completed_step is
  'Powers intake resumption (acceptance criteria C3, C4). Resumability is a data property, not UI polish.';

create trigger business_profiles_set_updated_at
  before update on public.business_profiles
  for each row execute function app.set_updated_at();

-- UNIQUE already indexes business_id; this covers the resumption lookup.
create index business_profiles_incomplete_idx
  on public.business_profiles (business_id)
  where completed_at is null;


-- ----------------------------------------------------------------------------
-- 9. AUDIT LOG — append-only (D1, D12)
--    Security Architecture: authentication, business creation, AI generation,
--    knowledge updates and administrative actions are recorded.
-- ----------------------------------------------------------------------------

create table public.audit_log (
  id              bigint      generated always as identity primary key,
  occurred_at     timestamptz not null default now(),
  -- SET NULL, not CASCADE: the audit record must survive the user it describes.
  actor_id        uuid        references auth.users (id)     on delete set null,
  business_id     uuid        references public.businesses (id) on delete set null,
  event           text        not null,
  correlation_id  uuid,
  ip_address      inet,
  user_agent      text,
  metadata        jsonb       not null default '{}'::jsonb,

  constraint audit_event_format
    check (event ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  constraint audit_user_agent_length
    check (user_agent is null or char_length(user_agent) <= 500),
  constraint audit_metadata_is_object
    check (jsonb_typeof(metadata) = 'object')
);

comment on table public.audit_log is
  'Append-only audit trail. Mutation blocked by trigger, not merely by privilege (schema-design.md D12).';
comment on column public.audit_log.correlation_id is
  'Ties this entry to the request that produced it (API Architecture, Backend Architecture).';
comment on column public.audit_log.event is
  'Dotted namespace, e.g. business.created, auth.signed_in, intake.completed. Text rather than enum so new events never require a migration.';

create index audit_log_occurred_at_idx  on public.audit_log (occurred_at desc);
create index audit_log_actor_id_idx     on public.audit_log (actor_id)    where actor_id is not null;
create index audit_log_business_id_idx  on public.audit_log (business_id) where business_id is not null;
create index audit_log_event_idx        on public.audit_log (event, occurred_at desc);
create index audit_log_correlation_idx  on public.audit_log (correlation_id) where correlation_id is not null;

-- Append-only enforcement. Holds even against service_role (BYPASSRLS).
create trigger audit_log_no_update
  before update on public.audit_log
  for each row execute function app.prevent_mutation();

create trigger audit_log_no_delete
  before delete on public.audit_log
  for each row execute function app.prevent_mutation();


-- ============================================================================
-- 10. ROW LEVEL SECURITY (D10, D11)
--
--   ENABLE + FORCE on every table.
--   Deny by default: RLS on with no matching policy grants nothing.
--   One policy per operation — never FOR ALL.
--   Every policy scoped TO authenticated.
--   NO DELETE policy anywhere: deletion is impossible through the API (D7).
--   (select auth.uid()) is wrapped deliberately — evaluated once per query
--   rather than once per row (D11).
-- ============================================================================

alter table public.countries          enable row level security;
alter table public.profiles           enable row level security;
alter table public.businesses         enable row level security;
alter table public.business_profiles  enable row level security;
alter table public.audit_log          enable row level security;

alter table public.profiles           force row level security;
alter table public.businesses         force row level security;
alter table public.business_profiles  force row level security;
alter table public.audit_log          force row level security;
-- countries is intentionally NOT forced: it is public reference data seeded by
-- migration, and forcing would block the seed below.

-- --- countries: readable by every authenticated user; writable by nobody ----
create policy countries_select_authenticated
  on public.countries for select to authenticated
  using (true);

-- --- profiles: a user sees and edits only themselves ------------------------
create policy profiles_select_own
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- No INSERT policy: rows are created by app.handle_new_user().
-- No DELETE policy: profiles cascade from auth.users.

-- --- businesses: direct predicate, not the helper (avoids recursion, D3) ----
create policy businesses_select_own
  on public.businesses for select to authenticated
  using (owner_id = (select auth.uid()));

create policy businesses_insert_own
  on public.businesses for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy businesses_update_own
  on public.businesses for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
-- No DELETE policy: businesses are archived, never deleted (D7).

-- --- business_profiles: ownership via the single helper (D3) ----------------
create policy business_profiles_select_own
  on public.business_profiles for select to authenticated
  using (app.business_access(business_id));

create policy business_profiles_insert_own
  on public.business_profiles for insert to authenticated
  with check (app.business_access(business_id));

create policy business_profiles_update_own
  on public.business_profiles for update to authenticated
  using (app.business_access(business_id))
  with check (app.business_access(business_id));
-- No DELETE policy: cascades from the parent business.

-- --- audit_log: no policies at all — invisible and unwritable via the API ---
--     Written by service_role or a SECURITY DEFINER service function.


-- ============================================================================
-- 11. PRIVILEGES
--     RLS filters rows; grants decide whether a role may attempt the operation
--     at all. Both are required — Security Architecture: "No layer assumes
--     another layer has already performed validation."
-- ============================================================================

revoke all on public.countries         from anon, authenticated;
revoke all on public.profiles          from anon, authenticated;
revoke all on public.businesses        from anon, authenticated;
revoke all on public.business_profiles from anon, authenticated;
revoke all on public.audit_log         from anon, authenticated;

grant select                 on public.countries         to authenticated;
grant select, update         on public.profiles          to authenticated;
grant select, insert, update on public.businesses        to authenticated;
grant select, insert, update on public.business_profiles to authenticated;
-- audit_log: no grants to anon or authenticated, by design.


-- ============================================================================
-- 12. SEED — reference data only
--     No fabricated business data. Constitution: Truth Before Fluency applies
--     to seeds and demos as much as to AI output.
-- ============================================================================

insert into public.countries (code, name, currency_code, is_active) values
  ('BS', 'The Bahamas',         'BSD', true),
  ('JM', 'Jamaica',             'JMD', false),
  ('BB', 'Barbados',            'BBD', false),
  ('TT', 'Trinidad and Tobago', 'TTD', false),
  ('GY', 'Guyana',              'GYD', false),
  ('BZ', 'Belize',              'BZD', false)
on conflict (code) do nothing;

commit;

-- ============================================================================
-- POST-MIGRATION VERIFICATION (run manually; automated in tests/rls/)
--
--   select relname, relrowsecurity, relforcerowsecurity
--     from pg_class
--    where relnamespace = 'public'::regnamespace and relkind = 'r';
--
--   select tablename, policyname, cmd, roles from pg_policies
--    where schemaname = 'public' order by tablename, cmd;
--
--   -- must fail with SQLSTATE 42501:
--   update public.audit_log set event = 'tampered' where id = 1;
-- ============================================================================
