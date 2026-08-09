> # ⛔ RETIRED 2026-08-08 — superseded by K6
>
> **Canonical specification:** _Knowledge Monitoring & Change Detection Specification_ (K6),
> Knowledge Engineering series.
> Notion: <https://app.notion.com/p/3b69910b029a80b1aaa8e7f640dfd878>
>
> This document is **retained for history and reference only. Do not implement from it.**
>
> Founder-approved merge (C2). K6 was stronger on operational mechanics — change taxonomy,
> impact assessment, change logging, governance, publication workflow — while this document
> was stronger on policy. Rather than keep two specifications on one subject and let them
> drift, the five policy mechanisms below were absorbed into **K6 §2A**:
>
> | Mechanism                           | Now at   |
> | ----------------------------------- | -------- |
> | Review cadence by source class      | K6 §2A.1 |
> | Trust-score staleness penalty (−10) | K6 §2A.2 |
> | Plan cascade (`ready` vs `active`)  | K6 §2A.3 |
> | 404 ≠ unpublish                     | K6 §2A.4 |
> | Coverage recovery                   | K6 §2A.5 |
>
> Nothing in this document was discarded.

---

# Knowledge Freshness Specification

**Version:** 1.0 · **Status:** ⛔ RETIRED — superseded by K6 · **Owner:** Jamil Nash · **Last updated:** 2026-08-07
**Series:** AI Architecture, document 6 of 15

## 1. Executive Summary

Government information changes. A fee rises, an Act is amended, a programme closes. FoundryAI's failure mode is not that it will not notice — it is that it will keep citing the old text **with full confidence and a valid citation**.

This document specifies how staleness is detected, how it propagates to founders who already acted on a plan, and how the platform behaves when it knows its knowledge is old but does not yet know what changed.

The governing principle: **stale-and-labelled beats stale-and-silent.**

## 2. Purpose

**Scope.** Review cadences, change detection, version bumps, plan invalidation, expiry behaviour, and the founder-facing consequences of a knowledge change.

**Not in scope.** Ingestion (document 5) · trust classification (document 1) · plan regeneration mechanics (document 2 §7A.5).

## 3. Architecture

```
     ┌─────────── scheduled sweep (workflow run, ADR-0016) ───────────┐
     ▼                                                                │
 source registry ──► fetch ──► hash compare ──► changed? ──► re-ingest│
     │                                             │ no               │
     │                                             └─► touch last_checked
     ▼
 review_due sweep ──► past due? ──► flag stale ──► score penalty (Trust §5)
     │
     ▼
 affected plans ──► mark stale ──► notify founder ──► offer regeneration
```

## 4. Design Principles

**F1 — Age is not the same as staleness.** A 2019 Act that has not been amended is current. A guidance page from last month may already be wrong. Cadence differs by source type.

**F2 — Unknown freshness is a form of staleness.** If we have not checked, we do not know, and the trust score reflects that.

**F3 — Changes propagate to people, not just data.** A founder who acted on a plan built from a changed document must be told.

**F4 — Never silently swap evidence.** A citation points at an immutable chunk version. New text is a new version.

**F5 — Detection is cheap; interpretation is not.** Hash comparison is automatic. Deciding _what changed and whether it matters_ requires a human.

## 5. Review Cadence

Carried forward from the Knowledge Architecture, refined by authority:

| Source class              | Cadence                        | Rationale                                 |
| ------------------------- | ------------------------------ | ----------------------------------------- |
| Legislation (authority 5) | On amendment; verify quarterly | Rarely changes; changes matter enormously |
| Regulations (4)           | 90 days                        |                                           |
| Official guidance (3)     | **30 days**                    | Changes quietly and often                 |
| Funding programmes        | **14 days**                    | Deadlines and windows move fast           |
| Agency profiles           | 30 days                        | Contact details, fees                     |

Each document carries `review_due_at`. **Past due is queryable**, which is what turns a cadence into an operational fact rather than a calendar reminder nobody owns.

## 6. Change Detection

| Signal                        | Mechanism                   | Confidence                 |
| ----------------------------- | --------------------------- | -------------------------- |
| Content hash differs          | Automated fetch and compare | High — something changed   |
| Source URL 404 / moved        | HTTP status                 | High — possible withdrawal |
| Review date passed, unchecked | `review_due_at`             | Unknown state              |
| Founder correction            | Human Review Workflow (10)  | Requires verification      |

A changed hash means _something_ changed — a typo fix and a fee increase look identical. **Interpretation is a review task, never automated (F5).**

## 7. Consequences of Staleness

### 7.1 On trust

A citation past its review date applies a **−10 trust-score penalty** (Trust Layer §5). It does not change the badge: the source is still what it is. It lowers certainty, which is the honest signal.

### 7.2 On plans

```
document changes
   │
   ├─ find published chunks from that document
   ├─ find plans citing those chunks
   │
   ├─ plan status = ready   ──► regenerate silently, show diff
   └─ plan status = active  ──► mark stale, notify, DO NOT auto-replace
                                (approved plans are never silently replaced —
                                 Launch Plan §7A.5)
```

### 7.3 On coverage

When a domain **gains** coverage that previously returned nothing, plans generated during the gap were incomplete. Those plans are flagged for regeneration.

This is the platform's only mechanism for correcting an omission after the fact, and it is the reason coverage gaps are recorded per plan rather than merely computed and discarded.

### 7.4 On withdrawn documents

A source returning 404 is **not** auto-unpublished — a moved URL and a repealed Act look the same over HTTP. It is flagged for urgent review. If confirmed withdrawn, chunks are unpublished; plans citing them are marked stale, and the affected requirement becomes ⚪ UNKNOWN rather than silently disappearing.

**A requirement vanishing without explanation is worse than one labelled uncertain.**

## 8. Decision Flow

```
sweep tick
  ├─ fetch source ─ unreachable? ──► flag urgent review
  ├─ hash changed? ── no ──► update last_checked, next
  │        │ yes
  │        ├─ create new document version (immutable, K5)
  │        ├─ queue human review
  │        └─ on approval: publish, bump knowledge version
  │                 └─► cascade to citing plans (§7.2)
  └─ review_due passed? ──► mark stale, apply score penalty
```

## 9. Security

| Concern                           | Control                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| Source spoofing / MITM on refetch | HTTPS only; host pinned to the registry entry; unexpected host → review, not ingest |
| Silent corpus mutation            | Immutable versions; publication audited with reviewer identity                      |
| Denial via sweep load             | Sweeps are workflow runs with budgets (ADR-0016), rate-limited per host             |
| Founder notification abuse        | Notifications derive from citation links, not free input                            |

## 10. Failure Modes

| #   | Failure                                | Severity    | Mitigation                                                             |
| --- | -------------------------------------- | ----------- | ---------------------------------------------------------------------- |
| F1  | **Changed law, unchanged plan**        | 🔴 Critical | Hash sweeps; citation → plan cascade                                   |
| F2  | Sweep silently stops                   | 🔴 Critical | Sweep is a monitored workflow; alert on no-run                         |
| F3  | Auto-unpublish on a transient 404      | 🟠 High     | 404 → review, never auto-unpublish (§7.4)                              |
| F4  | Notification fatigue → ignored alerts  | 🟠 High     | Notify only on citation-linked change, never on cadence alone          |
| F5  | Review backlog grows unbounded         | 🟠 High     | Queue depth is a monitored metric with an alert threshold              |
| F6  | Founder never told their plan is stale | 🔴 Critical | Staleness is a plan state, visible in the workspace, not only an email |

## 11. Success Metrics

| Metric                                                | Target         |
| ----------------------------------------------------- | -------------- |
| Documents past review date                            | ≤ 5% of corpus |
| Median detection lag for a changed source             | ≤ 7 days       |
| Plans citing changed documents not marked stale       | **0**          |
| Review queue age (p90)                                | ≤ 14 days      |
| Funding programmes with expired deadlines still shown | **0**          |

## 12. Relationships

**Depends on:** Ingestion (5) · Trust Layer (1) · ADR-0016 · Launch Plan (2).
**Constrains:** Research Agent (published, current chunks only) · Human Review (10).
**Related:** Observability (11) · Evaluation (7).

## 13. Future Evolution

Gazette and RSS monitoring · legislation-database subscriptions · semantic diffing to distinguish substantive from cosmetic change · founder-reported discrepancies as a detection signal · predicted review dates from historical change frequency.

## 14. Open Questions

| #   | Question                                                      |
| --- | ------------------------------------------------------------- |
| KF1 | Who owns the review queue operationally, and what is the SLA? |
| KF2 | Are founders notified per change, or digested weekly?         |
| KF3 | Retention period for superseded document versions             |

## 15. ADR References

**0016** (sweeps as workflow runs) · **0015** (staleness affects score, not badge) · 0014 · 0012.
