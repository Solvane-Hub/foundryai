# ADR-0016 — Long-running AI workflow execution

**Date:** 2026-08-07 · **Status:** ✅ Accepted (founder-directed)
**Foundation for:** Coordinator Agent Specification · all future AI orchestration

## Context

Generating a Launch Plan means running the Coordinator, then Research, then Compliance and Funding, then the Action Plan Agent — each an LLM call, several preceded by retrieval. Realistically tens of seconds to minutes.

The deployment target is Vercel. Serverless functions have a hard maximum duration; the platform cannot hold an HTTP request open for the length of a plan generation, and should not try. Beyond the limit itself, a request-bound design has four failure properties we cannot accept:

- A dropped connection destroys the work.
- A transient model error fails the entire run, discarding every completed step.
- There is no way to cancel a run in flight.
- Nothing is reproducible — intermediate agent output exists only in memory.

This was first raised as R-12 in the Engineering Understanding Report (2026-08-05), restated as L1 in the Launch Plan Architecture, and blocks Phase 4 entirely.

## Options considered

1. **Long-lived HTTP request with streaming.** Simplest. Still bounded by function duration; a dropped connection loses everything; no cancellation, no resumability. **Rejected — it is the problem, not a solution.**
2. **One serverless invocation runs the whole workflow in the background** (`waitUntil`). Frees the response but is still bounded by max duration, and a crash mid-run loses all progress. **Rejected.**
3. **Durable-execution vendor** (Inngest, Trigger.dev, Temporal). Best developer experience; retries, timeouts and replay are solved. Introduces a vendor, a cost, and a third party processing founder data — material for a platform targeting an emerging market and naming government agencies as partners. **Rejected for v1; revisit at scale (see Future).**
4. **Persisted workflow state in PostgreSQL, advanced one step per worker invocation.** No new vendor. Every step is durable. Resumability, cancellation and retries fall out of the state machine rather than being bolted on.

## Decision

**Option 4.**

> **A workflow is a state machine in PostgreSQL, not a running process. Each worker invocation advances it by exactly one step.**

That single constraint delivers the rest: if a step is the unit of work, every invocation is short, every completed step is durable, and resuming is just reading the row.

### Model

```
workflow_runs        one row per generation attempt — the state machine
  ├── status         queued · running · needs_clarification ·
  │                  completed · failed · cancelled
  ├── current_step   which step executes next
  ├── attempt        retry counter for the current step
  ├── lease_until    worker lease, for crash detection
  └── correlation_id ties every log line and audit row together

agent_executions     one row per step attempt — the reproducibility record
  ├── (workflow_run_id, sequence_no)  UNIQUE — idempotency key
  ├── input / output  jsonb
  ├── model_version · prompt_version · knowledge_version
  ├── latency_ms · token_input · token_output
  └── status · error_code
```

### Execution loop

```
enqueue  ──► Server Action inserts workflow_runs (queued), returns run id
             immediately. The founder is never blocked.
                        │
worker   ──► claim one run:  SELECT … FOR UPDATE SKIP LOCKED
             set lease_until = now() + lease
                        │
             cancelled? ──yes──► stop, status = cancelled
                        │ no
             execute EXACTLY ONE step
                        │
             ├─ success ──► write agent_executions, advance current_step
             ├─ transient failure ──► attempt++, backoff, stay on this step
             ├─ permanent failure ──► status = failed, partial results kept
             └─ needs clarification ──► status = needs_clarification, pause
                        │
             more steps? ──yes──► release; next tick picks it up
                        └─no───► status = completed
```

`FOR UPDATE SKIP LOCKED` is the standard PostgreSQL queue pattern and prevents two workers claiming the same run without a separate queue service.

### Worker trigger

A scheduled invocation (Vercel Cron or Supabase scheduled Edge Function) plus an opportunistic kick on enqueue, so the common case does not wait for the next tick. **The mechanism is deliberately replaceable** — the state machine is authoritative, and any trigger that calls "advance one step" is valid.

### Resumability

Free by construction. A worker crash leaves the run with an expired `lease_until`; the next tick reclaims it and re-executes only the current step. Completed steps are never repeated because `(workflow_run_id, sequence_no)` is unique — a retry that partially wrote is rejected rather than duplicated.

### Retries

| Failure                                | Classification    | Behaviour                                                                   |
| -------------------------------------- | ----------------- | --------------------------------------------------------------------------- |
| Model timeout, 429, 5xx, network       | Transient         | Retry same step, exponential backoff, **max 3 attempts**                    |
| Schema validation failure              | Transient once    | Retry once with the validation error appended to the prompt; then permanent |
| Trust Layer quarantine                 | **Not a failure** | Recorded; run continues. Quarantine is an outcome, not an error             |
| Missing required input                 | Permanent         | `needs_clarification` — pause, ask the founder                              |
| Unknown model error after max attempts | Permanent         | `failed`, partial results retained                                          |

**Retry budgets are per step, not per run.** A run that retried once at step 2 still has a full budget at step 4.

### Cancellation

**Cooperative, checked between steps** — never mid-inference. A cancelled run stops cleanly, retains completed steps, and is auditable. Founders may cancel from the workspace; the system may cancel on business archival.

Pre-emptive cancellation is deliberately not supported: killing a worker mid-call would leave provider-side usage unaccounted and the step in an unknown state.

### Timeouts

Two budgets, both enforced:

| Budget       | Default           | On breach                               |
| ------------ | ----------------- | --------------------------------------- |
| **Per step** | 60 s              | Treated as a transient failure; retried |
| **Per run**  | 15 min wall clock | `failed`; partial results retained      |
| **Lease**    | 90 s              | Run reclaimed by another worker         |

The lease must exceed the step budget, or a slow-but-healthy step gets stolen and executed twice.

### Failure recovery

**Partial results are always retained.** A run that failed at the Funding step still holds validated Compliance output. Three consequences:

- The founder is told what _was_ determined and what was not — never shown a blank failure.
- A resumed run does not pay to recompute completed steps.
- Every attempt is preserved in `agent_executions`, so a failure is diagnosable after the fact rather than only in logs.

A `failed` run may be resumed from its last successful step rather than restarted.

### Observability

Every step logs through `lib/logger` (ADR-0014) with the run's `correlation_id`, `operation`, `durationMs`, and token counts — which also gives cost attribution per run, feeding document 13.

## Consequences

**Gained**

- No request-duration limit. Adding a sixth agent does not threaten a timeout.
- Resumability, cancellation, retries and reproducibility from one design rather than four mechanisms.
- Full reproducibility: every step's input, output, model version, prompt version and knowledge version is durable — satisfying the Constitution's requirement that a human can reproduce the reasoning path.
- Cost and latency become measurable per step.
- No new vendor, no new data processor.

**Accepted costs**

- Latency floor from the polling interval. Mitigated by the opportunistic kick.
- The client must poll or subscribe rather than awaiting a response. Supabase Realtime on `workflow_runs` is the intended path.
- We are operating a queue. `FOR UPDATE SKIP LOCKED` is well-trodden, but leases and stuck-run detection are ours to get right, and need their own tests.
- Steps must be **idempotent**. This is a real constraint on every future agent, and belongs in the Specialist Agent Contract.

## Future

Revisit a durable-execution vendor if any of these become true: workflows need fan-out/fan-in beyond a linear chain; human-in-the-loop steps span days; or queue operations begin consuming meaningful engineering time. The state machine is the contract, so migration would not change agent code.

## References

Launch Plan Architecture §7A · Backend Architecture (Background Jobs) · AI System Architecture ·
Trust Layer Specification §6 · ADR-0014 · Engineering Understanding Report R-12 ·
`docs/architecture/schema-future-phases.sql` (`workflow_runs`, `agent_executions`)
