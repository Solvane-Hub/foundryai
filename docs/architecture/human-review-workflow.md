# Human Review Workflow

**Version:** 1.0 · **Status:** Canonical · **Owner:** Jamil Nash · **Last updated:** 2026-08-07
**Series:** AI Architecture, document 10 of 15

## 1. Executive Summary

Automation gets FoundryAI most of the way. This document covers the rest: what happens when the system quarantines a claim, when knowledge changes, when a founder says we are wrong, and when nobody is sure.

Human review is not a fallback for a broken system — it is a designed component. The Constitution places AI as a reasoning engine and authority in verified knowledge; verification is ultimately a human act.

The volume of review work is a **product metric**, not an operational nuisance. If the queue grows faster than a person can clear it, the platform does not scale, and that is worth knowing early.

## 2. Purpose

**Scope.** Review queues, roles, prioritisation, SLAs, correction paths, and how corrections re-enter the system.

**Not in scope.** Ingestion review (document 5 §5.6, a distinct queue) · founder support · incident response.

## 3. Architecture

```
  quarantined claims ─┐
  changed documents  ─┼─► REVIEW QUEUE ─► reviewer ─► decision ─► effect
  founder reports    ─┤       │                          │
  low-confidence runs ┘   prioritised          approve · correct · reject
                          by severity                    │
                                                 knowledge · plan · evaluation set
```

Every decision has three possible destinations, and choosing among them is the reviewer's core judgement: fix the _knowledge_, fix the _plan_, or fix the _system_ by adding a case to the evaluation set.

## 4. Design Principles

**H1 — Review is a queue, not an inbox.** Prioritised, measured, with a visible depth.

**H2 — Correct the cause, not the symptom.** A wrong requirement usually means wrong knowledge. Editing one founder's plan and leaving the corpus wrong guarantees recurrence.

**H3 — Every correction becomes a test case.** Otherwise the same error returns after the next prompt change.

**H4 — Reviewers need provenance, not raw output.** A reviewer sees the claim, the cited passage, the source document, and the agent's reasoning — enough to judge without re-deriving.

**H5 — Founder-reported errors are signals, not truth.** A founder may be mistaken. Reports are verified against sources, never applied directly.

**H6 — Nothing waits silently.** An item in the queue past its SLA is escalated, not simply older.

## 5. Queue Sources

| Source                            | Trigger                                        | Default priority                |
| --------------------------------- | ---------------------------------------------- | ------------------------------- |
| **Quarantined claim**             | Trust Layer validation failure (document 1 §6) | High                            |
| **Changed document**              | Content hash differs (document 6 §6)           | High if cited by an active plan |
| **Withdrawn source**              | 404 / moved                                    | **Urgent**                      |
| **Founder report**                | "This is wrong" from the workspace             | High                            |
| **Low coverage**                  | Plan generated with LOW Coverage Confidence    | Medium                          |
| **Low classification confidence** | Coordinator best-effort run (CO2)              | Medium                          |
| **Stale review**                  | `review_due_at` passed                         | Low, escalating                 |

## 6. Roles

| Role                    | Can                                                                   | Cannot                     |
| ----------------------- | --------------------------------------------------------------------- | -------------------------- |
| **Knowledge Reviewer**  | Approve/reject ingestion, correct metadata, publish, unpublish        | Edit a founder's plan      |
| **Compliance Reviewer** | Adjudicate quarantined claims, verify founder reports against sources | Publish knowledge          |
| **Engineer**            | Add evaluation cases, adjust thresholds after calibration             | Approve regulatory content |

**Separation is deliberate.** The person deciding whether a claim is correct should not also be the person who decides what the corpus says — that is the same conflict of interest that stops agents from grading themselves (Trust Layer §5).

⚠️ These are roles, not headcount. At current scale one person may hold several, but the _actions_ remain distinct and separately audited.

## 7. Decision Flow

```
queue item
   ├─ withdrawn source? ──► verify ──► unpublish, cascade to plans (doc 6 §7.4)
   │
   ├─ quarantined claim
   │     ├─ genuinely ungrounded ──► reject; add to evaluation set (H3)
   │     ├─ valid, threshold too tight ──► approve; flag for calibration
   │     └─ knowledge wrong ──────► correct corpus (H2), re-run affected plans
   │
   ├─ founder report
   │     ├─ verified against source ──► correct knowledge; notify founder
   │     └─ not verified ──────────► explain to founder; record the disagreement
   │
   └─ changed document ──► review diff ──► publish new version ──► cascade
```

## 8. SLAs

| Priority                                        | Target           | Escalation             |
| ----------------------------------------------- | ---------------- | ---------------------- |
| Urgent (withdrawn source cited by active plans) | 4 h              | Immediate notification |
| High                                            | 2 business days  | Escalate at 3 days     |
| Medium                                          | 5 business days  | Escalate at 10         |
| Low                                             | 14 business days | Batched                |

**Founders are told when their item is under review.** Silence while something is being checked reads as being ignored.

## 9. Security

| Concern                        | Control                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Reviewer editing founder data  | Reviewers correct knowledge and quarantine decisions, not founder-owned progress                         |
| Unauthorised publication       | Role separation; every publication audited with reviewer identity                                        |
| Founder report abuse           | Reports rate-limited; verified before action (H5)                                                        |
| Reviewer access to founder PII | Reviewers see the claim and its evidence, not the founder's identity, unless the report requires contact |
| Audit                          | Every decision written to `audit_log` with correlation ID                                                |

## 10. Failure Modes

| #   | Failure                              | Severity    | Mitigation                                                                                             |
| --- | ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------ |
| F1  | **Queue grows unbounded**            | 🔴 Critical | Depth and age are monitored metrics with alerts; growth signals a systemic problem, not a staffing one |
| F2  | Symptom fixed, cause left            | 🟠 High     | H2; correction requires naming the cause                                                               |
| F3  | Correction never becomes a test      | 🟠 High     | H3 enforced in the review form                                                                         |
| F4  | Founder report dismissed incorrectly | 🟠 High     | Disagreements recorded and periodically re-examined                                                    |
| F5  | Reviewer bottleneck blocks releases  | 🟡 Medium   | Ingestion and claim queues are separate                                                                |
| F6  | Reviewer fatigue → rubber-stamping   | 🟠 High     | Sampled audit of approvals; approval rate is itself a metric                                           |

**F1 is the one to watch.** A review queue that outgrows its reviewers means the automated pipeline is not good enough, and the honest response is to fix the pipeline or slow growth — not to approve faster.

## 11. Success Metrics

| Metric                                              | Target              |
| --------------------------------------------------- | ------------------- |
| Queue depth (p90)                                   | ≤ 20 items          |
| Urgent items within SLA                             | 100%                |
| Corrections producing an evaluation case            | ≥ 95%               |
| Founder reports acknowledged within 2 business days | 100%                |
| Approval rate under sampled audit                   | ≥ 95% agreement     |
| Quarantine rate trend                               | Declining over time |

## 12. Relationships

**Depends on:** Trust Layer (1) · Freshness (6) · Ingestion (5).
**Feeds:** Evaluation (7) — corrections become cases · Knowledge Pack — corrections become content.
**Related:** Observability (11) · Safety (14) · Launch Plan (2 §7A.4).

## 13. Future Evolution

Reviewer tooling with side-by-side source comparison · founder feedback as a Learning Layer signal (still human-verified) · SLA differentiation by jurisdiction as countries are added · partial automation of low-risk metadata corrections.

## 14. Open Questions

| #       | Question                                                                       | Severity            |
| ------- | ------------------------------------------------------------------------------ | ------------------- |
| **HR1** | **Who performs review at launch, and what regulatory competence is required?** | 🔴 Founder decision |
| HR2     | Are reviewers internal, or is a Bahamian legal reviewer contracted?            | 🟠 High             |
| HR3     | Do founders see that their report changed the corpus?                          | 🟡 Medium           |

## 15. ADR References

**0015** (quarantine origin) · **0016** (review pauses runs) · 0012 (audit) · 0018 (corrections gate releases).
