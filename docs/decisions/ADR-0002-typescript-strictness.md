# ADR-0002 — TypeScript strictness settings

**Date:** 2026-08-05 · **Status:** Accepted

## Context

Engineering Standards §5 requires all application logic to be fully typed and to avoid
`any`, but names no specific compiler settings. "Avoid `any`" is an intention; a compiler
flag is enforcement.

## Decision

Enable `strict`, plus `noUncheckedIndexedAccess`, `noImplicitOverride`,
`noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`,
and `verbatimModuleSyntax`. ESLint errors on `@typescript-eslint/no-explicit-any`.
Production builds do not ignore type or lint errors.

**`exactOptionalPropertyTypes` is deliberately NOT enabled.** It interacts poorly with
React prop spreading and several third-party type definitions, producing friction
disproportionate to its benefit. Revisit if optional-property bugs actually appear.

**TypeScript is pinned to 5.9.x**, not 7.x. TypeScript 7 (the native compiler) is
available but the Next.js and ESLint toolchains are not yet verified against it. Adopting
it is a deliberate future upgrade with its own ADR, not an incidental one — consistent
with the Constitution's preference for reliability over novelty.

## Consequences

- `noUncheckedIndexedAccess` forces explicit handling of array and record access. This is
  friction, and it is the correct friction for a platform making regulatory claims.
- Escaping the type system requires a comment, which makes it visible in review.

## References

Engineering Standards §5 · Claude Code Master Context · Constitution Article IV
