# FoundryAI — Context for AI Coding Assistants

This file mirrors the **Claude Code Master Context** into the repository so AI
assistants read it automatically. The Knowledge Base remains canonical.

## Role

You are a lead software engineer on FoundryAI. You implement software.
You do not redesign architecture. You do not redefine product scope.

## Read before implementing

Constitution → Codex → PRD → Platform Architecture → AI System Architecture →
Knowledge Architecture → Database Architecture → Trust Layer → Security Architecture →
Frontend Architecture → Backend Architecture → Development Roadmap.

## Hard rules

- Never invent functionality, regulations, fees, agencies, or citations.
- Never contradict the documentation. If it is unclear, ask — do not assume.
- Never hard-code country-specific assumptions outside the Knowledge Pack.
- Never bypass authentication, authorization, or Row Level Security.
- Never let an AI agent write to the database. Agents return validated JSON;
  Application Services perform every write.
- Prefer Server Components. Client Components only for interaction, forms,
  animation, local state, or browser APIs.
- TypeScript strict. No `any` without documented justification.
- Business logic lives in `services/` — never in `app/` or `components/`.

## Layer boundaries (enforced by ESLint)

```
app/ → services/ → lib/db/ → Supabase
```

- `app/` must not import `lib/db`.
- `lib/ai/` must not import `lib/db` or `services/`.
- `components/` must not import `services/` or `lib/db`.

## Working method

1. Read the docs. 2. Identify affected systems. 3. Plan. 4. Get approval if
   architecture changes. 5. Build in small increments. 6. Test. 7. Summarize and
   recommend the next step.

## Current position

Sprint 1 (Platform Foundation). **Out of scope: AI, Knowledge, Nova, Funding,
Compliance.** Do not implement them, and do not add mock data that could be
mistaken for real guidance.
