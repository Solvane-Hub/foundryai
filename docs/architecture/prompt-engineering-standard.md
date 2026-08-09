# Prompt Engineering Standard

**Version:** 1.0 · **Status:** Canonical · **Owner:** Jamil Nash · **Last updated:** 2026-08-07
**Series:** AI Architecture, document 8 of 15

## 1. Executive Summary

Prompts are source code. They determine platform behaviour, they change what founders are told, and an undocumented prompt edit is an undocumented production change.

This standard treats them accordingly: versioned, reviewed, tested, and stored in the repository — never edited in a database or a vendor console where the change is invisible to review.

## 2. Purpose

**Scope.** Prompt structure, versioning, storage, review, injection defence, and testing obligations.

**Not in scope.** Individual agent prompts (their specifications) · model selection (document 12) · evaluation (document 7).

## 3. Architecture

```
lib/ai/prompts/<agent>/<version>.ts   ── in the repository, in Git
        │
        ├─ system prompt (role · constraints · output contract)
        ├─ input template (typed, no string interpolation of user text)
        └─ few-shot examples (optional, versioned with the prompt)
                │
      compiled at build ──► agent ──► response ──► Zod schema validation
                │
        prompt_version recorded in agent_executions
```

## 4. Design Principles

**P1 — Prompts live in Git.** Reviewed like code, versioned with the code they govern, deployable and revertible.

**P2 — Semantic versioning.** `agent@major.minor.patch`. **Major** = output contract changed (breaking). **Minor** = behaviour changed. **Patch** = wording only. A major bump requires downstream review.

**P3 — Every response is schema-validated.** A prompt is not trusted to produce valid JSON; Zod enforces it (ADR-0005).

**P4 — User content is data, never instruction.** Founder input and retrieved documents are delimited and explicitly framed as material to process.

**P5 — Constrain, do not persuade.** "Return only fields defined in the schema" beats "please be accurate". Structural constraints outperform exhortation.

**P6 — No behaviour in the prompt that belongs in code.** Sorting, arithmetic, date handling and filtering are done deterministically outside the model.

## 5. Structure

Every system prompt has the same five parts, in order:

| Part                    | Contains                                                                          |
| ----------------------- | --------------------------------------------------------------------------------- |
| **Role**                | One sentence. What this agent is and is not                                       |
| **Constraints**         | Hard rules — never invent, only cite retrieved evidence, no trust self-assessment |
| **Input contract**      | What arrives and how it is delimited                                              |
| **Output contract**     | The envelope (document 4 §5). Schema is authoritative; the prompt describes it    |
| **Refusal instruction** | Exactly how to say "I could not determine this"                                   |

The refusal instruction is last because it is the one models most readily forget, and the one whose absence is most dangerous.

## 6. Injection Defence

Retrieved government documents and founder free text both enter model context. Both are untrusted.

| Layer      | Control                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------ |
| Ingestion  | Instruction-like content neutralised at parse time (document 5 §5.2)                             |
| Delimiting | Untrusted content wrapped in explicit boundaries, never concatenated into the instruction body   |
| Framing    | The system prompt states that delimited content is evidence to cite, never instruction to follow |
| Output     | Schema validation — an injected instruction to "return plain text" fails structurally            |
| Evaluation | Adversarial set (document 7 §5) gates release                                                    |

**No single layer is trusted.** Delimiting is defeatable; schema validation is the backstop that makes a successful injection produce an _invalid response_ rather than a _harmful one_.

## 7. Decision Flow — changing a prompt

```
proposed change
   ├─ output contract changed? ── yes ──► MAJOR bump, downstream review
   ├─ behaviour changed? ─────── yes ──► MINOR bump
   └─ wording only? ──────────── yes ──► PATCH bump
              │
        run evaluation (document 7)   ← mandatory, E4
              │
   ├─ hard gate failed ──► reject
   └─ pass ──► merge; prompt_version recorded on every future execution
```

## 8. Testing Obligations

Every prompt requires: a schema-conformance test on a fixture · at least one refusal test (does it say unknown when it should?) · one injection test from the adversarial set · an evaluation run before merge.

The refusal test is non-negotiable. A prompt that never refuses will fabricate under pressure, and that failure only surfaces in production.

## 9. Security

| Concern                  | Control                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| Prompt injection         | §6, layered                                                                               |
| Prompt exfiltration      | System prompts are not secret, but are not returned in responses; schema prevents it      |
| Untracked prompt change  | P1 — prompts in Git; a database-stored prompt would be a production change with no review |
| PII in few-shot examples | Examples are synthetic. **No real founder data**                                          |
| Secrets in prompts       | Never. Credentials are server-side configuration                                          |

## 10. Failure Modes

| #   | Failure                                                         | Severity    | Mitigation                                                                    |
| --- | --------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| F1  | Prompt edited without evaluation                                | 🔴 Critical | CI gate (E4)                                                                  |
| F2  | Prompt drift — behaviour changes silently across model versions | 🟠 High     | `prompt_version` **and** `model_version` recorded per execution (document 15) |
| F3  | Injection succeeds                                              | 🟠 High     | Layered defence; schema backstop                                              |
| F4  | Refusal instruction lost in an edit                             | 🔴 Critical | Mandatory refusal test                                                        |
| F5  | Prompt encodes business rules                                   | 🟡 Medium   | P6; code review                                                               |
| F6  | Few-shot examples become stale relative to the schema           | 🟡 Medium   | Examples versioned with the prompt                                            |

## 11. Success Metrics

| Metric                                       | Target |
| -------------------------------------------- | ------ |
| Prompts outside version control              | **0**  |
| Prompt changes shipped without evaluation    | **0**  |
| Schema-invalid responses                     | ≤ 1%   |
| Successful injections in the adversarial set | **0**  |
| Executions missing `prompt_version`          | **0**  |

## 12. Relationships

**Depends on:** Specialist Agent Contract (4) · ADR-0005 (Zod).
**Constrains:** every agent prompt · Evaluation (7) gates changes.
**Related:** Model Provider (12) — prompts may need per-provider variants · Versioning (15) · Safety (14).

## 13. Future Evolution

Per-provider prompt variants when a second model is supported · automated prompt regression bisection · prompt-level cost attribution (document 13) · structured output modes replacing schema-in-prompt where a provider supports them natively.

## 14. Open Questions

| #   | Question                                                                                        |
| --- | ----------------------------------------------------------------------------------------------- |
| PE1 | Are prompts translated for non-English markets, or is English canonical with translated output? |
| PE2 | Who reviews prompt changes — engineering, or a domain reviewer for compliance-affecting agents? |

## 15. ADR References

**0005** (Zod) · **0016** (retry appends the validation error) · 0018 (evaluation gate) · 0014.
