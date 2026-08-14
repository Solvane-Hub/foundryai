-- Regulatory Domain Foundation
-- Converts published FoundryAI Knowledge into structured,
-- business-applicable regulatory requirements.
--
-- This migration does NOT replace the Knowledge Foundation.
-- Regulatory requirements must retain authoritative provenance.

create table public.regulatory_requirements (
  id uuid primary key default gen_random_uuid(),

  jurisdiction text not null,
  title text not null,
  description text not null,

  regulatory_domain text not null,
  requirement_type text not null,

  status text not null default 'draft'
    check (status in (
      'draft',
      'validated',
      'published',
      'superseded',
      'withdrawn'
    )),

  source_locator text,

  effective_from date,
  effective_until date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index regulatory_requirements_jurisdiction_idx
  on public.regulatory_requirements(jurisdiction);

create index regulatory_requirements_domain_idx
  on public.regulatory_requirements(regulatory_domain);

create index regulatory_requirements_status_idx
  on public.regulatory_requirements(status);


create table public.regulatory_pathways (
  id uuid primary key default gen_random_uuid(),

  jurisdiction text not null,
  name text not null,
  description text not null,

  status text not null default 'draft'
    check (status in (
      'draft',
      'validated',
      'published',
      'superseded',
      'withdrawn'
    )),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index regulatory_pathways_jurisdiction_name_idx
  on public.regulatory_pathways(jurisdiction, name);

create index regulatory_pathways_status_idx
  on public.regulatory_pathways(status);


create table public.regulatory_pathway_steps (
  id uuid primary key default gen_random_uuid(),

  pathway_id uuid not null
    references public.regulatory_pathways(id)
    on delete cascade,

  requirement_id uuid
    references public.regulatory_requirements(id)
    on delete restrict,

  step_number integer not null
    check (step_number > 0),

  name text not null,
  description text not null,

  status text not null default 'draft'
    check (status in (
      'draft',
      'validated',
      'published',
      'superseded',
      'withdrawn'
    )),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index regulatory_pathway_steps_order_idx
  on public.regulatory_pathway_steps(pathway_id, step_number);

create index regulatory_pathway_steps_requirement_idx
  on public.regulatory_pathway_steps(requirement_id);


create table public.regulatory_requirement_dependencies (
  id uuid primary key default gen_random_uuid(),

  requirement_id uuid not null
    references public.regulatory_requirements(id)
    on delete cascade,

  depends_on_requirement_id uuid not null
    references public.regulatory_requirements(id)
    on delete restrict,

  relationship_type text not null
    check (relationship_type in (
      'prerequisite',
      'dependency',
      'alternative',
      'related'
    )),

  description text,

  created_at timestamptz not null default now(),

  check (requirement_id <> depends_on_requirement_id)
);

create unique index regulatory_requirement_dependencies_unique_idx
  on public.regulatory_requirement_dependencies(
    requirement_id,
    depends_on_requirement_id,
    relationship_type
  );

create index regulatory_requirement_dependencies_requirement_idx
  on public.regulatory_requirement_dependencies(requirement_id);

create index regulatory_requirement_dependencies_depends_on_idx
  on public.regulatory_requirement_dependencies(
    depends_on_requirement_id
  );


create table public.regulatory_actions (
  id uuid primary key default gen_random_uuid(),

  requirement_id uuid not null
    references public.regulatory_requirements(id)
    on delete cascade,

  pathway_step_id uuid
    references public.regulatory_pathway_steps(id)
    on delete cascade,

  action_type text not null
    check (action_type in (
      'information_required',
      'document_required',
      'application',
      'submission',
      'payment',
      'inspection',
      'approval',
      'renewal',
      'notification',
      'verification'
    )),

  name text not null,
  description text not null,

  agency_name text,
  system_name text,
  official_url text,

  requires_human_approval boolean not null default true,

  status text not null default 'draft'
    check (status in (
      'draft',
      'validated',
      'published',
      'superseded',
      'withdrawn'
    )),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index regulatory_actions_requirement_idx
  on public.regulatory_actions(requirement_id);

create index regulatory_actions_pathway_step_idx
  on public.regulatory_actions(pathway_step_id);

create index regulatory_actions_type_idx
  on public.regulatory_actions(action_type);


create table public.regulatory_requirement_evidence (
  id uuid primary key default gen_random_uuid(),

  requirement_id uuid not null
    references public.regulatory_requirements(id)
    on delete cascade,

  knowledge_pack_id uuid not null
    references public.knowledge_packs(id)
    on delete restrict,

  knowledge_source_id uuid not null
    references public.knowledge_sources(id)
    on delete restrict,

  knowledge_chunk_id uuid not null
  references public.knowledge_chunks(chunk_id)
  on delete restrict,

  source_locator text,

  evidence_role text not null default 'primary'
    check (evidence_role in (
      'primary',
      'supporting',
      'exception',
      'procedure'
    )),

  created_at timestamptz not null default now()
);

create unique index regulatory_requirement_evidence_unique_idx
  on public.regulatory_requirement_evidence(
    requirement_id,
    knowledge_chunk_id
  );

create index regulatory_requirement_evidence_requirement_idx
  on public.regulatory_requirement_evidence(requirement_id);

create index regulatory_requirement_evidence_chunk_idx
  on public.regulatory_requirement_evidence(knowledge_chunk_id);

create index regulatory_requirement_evidence_pack_idx
  on public.regulatory_requirement_evidence(knowledge_pack_id);


create table public.regulatory_applicability_rules (
  id uuid primary key default gen_random_uuid(),

  requirement_id uuid not null
    references public.regulatory_requirements(id)
    on delete cascade,

  rule_type text not null
    check (rule_type in (
      'all',
      'business_structure',
      'industry',
      'activity',
      'location',
      'employee_count',
      'revenue',
      'premises',
      'ownership',
      'custom'
    )),

  operator text not null
    check (operator in (
      'equals',
      'not_equals',
      'contains',
      'not_contains',
      'greater_than',
      'greater_than_or_equal',
      'less_than',
      'less_than_or_equal',
      'in',
      'not_in'
    )),

  field_path text not null,
  expected_value jsonb not null,

  explanation text,

  created_at timestamptz not null default now()
);

create index regulatory_applicability_requirement_idx
  on public.regulatory_applicability_rules(requirement_id);

create index regulatory_applicability_field_idx
  on public.regulatory_applicability_rules(field_path);


create table public.business_regulatory_requirements (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  requirement_id uuid not null
    references public.regulatory_requirements(id)
    on delete restrict,

  state text not null default 'unknown'
    check (state in (
      'unknown',
      'needs_information',
      'not_applicable',
      'applicable',
      'ready',
      'in_progress',
      'submitted',
      'approved',
      'active',
      'renewal_due',
      'expired',
      'blocked'
    )),

  reason text,

  missing_information jsonb not null default '[]'::jsonb,
  required_documents jsonb not null default '[]'::jsonb,

  started_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  active_at timestamptz,
  renewal_due_at timestamptz,
  expired_at timestamptz,

  last_evaluated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index business_regulatory_requirements_unique_idx
  on public.business_regulatory_requirements(
    business_id,
    requirement_id
  );

create index business_regulatory_requirements_business_idx
  on public.business_regulatory_requirements(business_id);

create index business_regulatory_requirements_requirement_idx
  on public.business_regulatory_requirements(requirement_id);

create index business_regulatory_requirements_state_idx
  on public.business_regulatory_requirements(state);

create index business_regulatory_requirements_renewal_idx
  on public.business_regulatory_requirements(renewal_due_at);


create table public.regulatory_requirement_outputs (
  id uuid primary key default gen_random_uuid(),

  requirement_id uuid not null
    references public.regulatory_requirements(id)
    on delete cascade,

  name text not null,

  output_type text not null
    check (output_type in (
      'registration_number',
      'licence_number',
      'certificate',
      'approval',
      'permit',
      'confirmation',
      'receipt',
      'document',
      'other'
    )),

  business_knowledge_field text,

  description text not null,

  required_for_downstream boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index regulatory_requirement_outputs_requirement_idx
  on public.regulatory_requirement_outputs(requirement_id);

create index regulatory_requirement_outputs_knowledge_field_idx
  on public.regulatory_requirement_outputs(
    business_knowledge_field
  );


-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table public.regulatory_requirements enable row level security;
alter table public.regulatory_requirements force row level security;

alter table public.regulatory_pathways enable row level security;
alter table public.regulatory_pathways force row level security;

alter table public.regulatory_pathway_steps enable row level security;
alter table public.regulatory_pathway_steps force row level security;

alter table public.regulatory_requirement_dependencies enable row level security;
alter table public.regulatory_requirement_dependencies force row level security;

alter table public.regulatory_actions enable row level security;
alter table public.regulatory_actions force row level security;

alter table public.regulatory_requirement_evidence enable row level security;
alter table public.regulatory_requirement_evidence force row level security;

alter table public.regulatory_applicability_rules enable row level security;
alter table public.regulatory_applicability_rules force row level security;

alter table public.business_regulatory_requirements enable row level security;
alter table public.business_regulatory_requirements force row level security;

alter table public.regulatory_requirement_outputs enable row level security;
alter table public.regulatory_requirement_outputs force row level security;


-- ----------------------------------------------------------------------------
-- Regulatory catalog
-- Published regulatory knowledge is readable by authenticated founders.
-- Authoring is intentionally NOT exposed through the client API.
-- ----------------------------------------------------------------------------

create policy regulatory_requirements_read_published
  on public.regulatory_requirements
  for select
  to authenticated
  using (status = 'published');


create policy regulatory_pathways_read_published
  on public.regulatory_pathways
  for select
  to authenticated
  using (status = 'published');


create policy regulatory_pathway_steps_read_published
  on public.regulatory_pathway_steps
  for select
  to authenticated
  using (
    status = 'published'
    and exists (
      select 1
      from public.regulatory_pathways p
      where p.id = regulatory_pathway_steps.pathway_id
        and p.status = 'published'
    )
  );


create policy regulatory_requirement_dependencies_read_published
  on public.regulatory_requirement_dependencies
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.regulatory_requirements r
      where r.id = regulatory_requirement_dependencies.requirement_id
        and r.status = 'published'
    )
    and exists (
      select 1
      from public.regulatory_requirements r
      where r.id = regulatory_requirement_dependencies.depends_on_requirement_id
        and r.status = 'published'
    )
  );


create policy regulatory_actions_read_published
  on public.regulatory_actions
  for select
  to authenticated
  using (
    status = 'published'
    and exists (
      select 1
      from public.regulatory_requirements r
      where r.id = regulatory_actions.requirement_id
        and r.status = 'published'
    )
  );


create policy regulatory_requirement_evidence_read_published
  on public.regulatory_requirement_evidence
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.regulatory_requirements r
      where r.id = regulatory_requirement_evidence.requirement_id
        and r.status = 'published'
    )
    and exists (
      select 1
      from public.knowledge_packs p
      where p.id = regulatory_requirement_evidence.knowledge_pack_id
        and p.status = 'published'
    )
  );


create policy regulatory_applicability_rules_read_published
  on public.regulatory_applicability_rules
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.regulatory_requirements r
      where r.id = regulatory_applicability_rules.requirement_id
        and r.status = 'published'
    )
  );


create policy regulatory_requirement_outputs_read_published
  on public.regulatory_requirement_outputs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.regulatory_requirements r
      where r.id = regulatory_requirement_outputs.requirement_id
        and r.status = 'published'
    )
  );


-- ----------------------------------------------------------------------------
-- Business regulatory state
-- Private to the authenticated owner of the business.
-- Writes will initially occur through the server-side application service.
-- ----------------------------------------------------------------------------

create policy business_regulatory_requirements_select_own
  on public.business_regulatory_requirements
  for select
  to authenticated
  using (app.business_access(business_id));


-- No INSERT policy yet.
-- No UPDATE policy yet.
-- No DELETE policy.
--
-- Regulatory state is derived/evaluated by the application service rather
-- than being directly writable from the browser.


-- ----------------------------------------------------------------------------
-- Grants
-- RLS determines WHICH rows are visible.
-- Grants determine WHETHER the role may attempt the operation.
-- ----------------------------------------------------------------------------

revoke all on public.regulatory_requirements from anon, authenticated;
revoke all on public.regulatory_pathways from anon, authenticated;
revoke all on public.regulatory_pathway_steps from anon, authenticated;
revoke all on public.regulatory_requirement_dependencies from anon, authenticated;
revoke all on public.regulatory_actions from anon, authenticated;
revoke all on public.regulatory_requirement_evidence from anon, authenticated;
revoke all on public.regulatory_applicability_rules from anon, authenticated;
revoke all on public.business_regulatory_requirements from anon, authenticated;
revoke all on public.regulatory_requirement_outputs from anon, authenticated;

grant select on public.regulatory_requirements to authenticated;
grant select on public.regulatory_pathways to authenticated;
grant select on public.regulatory_pathway_steps to authenticated;
grant select on public.regulatory_requirement_dependencies to authenticated;
grant select on public.regulatory_actions to authenticated;
grant select on public.regulatory_requirement_evidence to authenticated;
grant select on public.regulatory_applicability_rules to authenticated;
grant select on public.regulatory_requirement_outputs to authenticated;

grant select on public.business_regulatory_requirements to authenticated;


-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------

create trigger regulatory_requirements_updated_at
  before update on public.regulatory_requirements
  for each row execute function app.set_updated_at();


create trigger regulatory_pathways_updated_at
  before update on public.regulatory_pathways
  for each row execute function app.set_updated_at();


create trigger regulatory_pathway_steps_updated_at
  before update on public.regulatory_pathway_steps
  for each row execute function app.set_updated_at();


create trigger regulatory_actions_updated_at
  before update on public.regulatory_actions
  for each row execute function app.set_updated_at();


create trigger regulatory_applicability_rules_updated_at
  before update on public.regulatory_applicability_rules
  for each row execute function app.set_updated_at();


create trigger business_regulatory_requirements_updated_at
  before update on public.business_regulatory_requirements
  for each row execute function app.set_updated_at();


create trigger regulatory_requirement_outputs_updated_at
  before update on public.regulatory_requirement_outputs
  for each row execute function app.set_updated_at();