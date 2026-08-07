## What does this change?

<!-- One paragraph. Link the Sprint phase or issue. -->

## Code Review Checklist

Every question below comes from Engineering Standards — Code Review Checklist.

- [ ] Does this solve the intended problem?
- [ ] Does it follow the documented architecture?
- [ ] Is the code understandable by another engineer?
- [ ] Are edge cases handled?
- [ ] Are types correct? (no `any` without a documented justification)
- [ ] Is documentation updated? (including an ADR if a decision was made)
- [ ] Are tests sufficient?

## Layer boundaries

- [ ] No business logic added to `app/` or `components/`
- [ ] All database writes go through `services/`
- [ ] No AI code imports `lib/db` or `services`

## Security

- [ ] RLS policies cover every new table
- [ ] Ownership is verified before any read or write
- [ ] All external input is validated with Zod
- [ ] No secret is committed or exposed to the client bundle

## Trust (once AI features exist)

- [ ] No fabricated data, citation, or placeholder presented as real
- [ ] Uncertainty is surfaced rather than hidden
