# ADR Format

Use an Architecture Decision Record to preserve why a durable, non-obvious decision was made. Keep current system behavior in architecture documentation; use the ADR for context, alternatives, the decision, and lasting consequences.

## Placement and numbering

Store ADRs under `docs/adr/` with sequential names:

```text
0001-event-sourced-orders.md
0002-postgres-for-write-model.md
```

Scan the directory for the highest number and increment it. Do not renumber existing ADRs.

## Status

Use frontmatter on every ADR once the collection contains more than one lifecycle state:

```yaml
---
status: accepted
---
```

Supported values:

- `proposed`
- `accepted`
- `deprecated`
- `superseded by ADR-NNNN`

When a decision changes, create a new ADR and mark the old record superseded. Do not rewrite the old decision to make it appear that the new choice was always intended.

## Recommended structure

```md
---
status: accepted
---

# {Short decision title}

{The context, selected direction, and why the choice matters.}

## Considered options

- {Meaningful alternative}
- {Meaningful alternative}

## Decision

{The durable decision, when the opening does not already state it clearly.}

## Consequences

- {A non-obvious lasting result or constraint}

{Link to current domain or architecture documentation when useful.}
```

Keep sections only when they add value. A short ADR can be one paragraph after its status and title.

## Detail level

Record rationale and durable consequences, not a snapshot of every function, error code, field, or protocol step.

Preserve historical context, but prevent stale implementation detail from presenting itself as current guidance.

## When to create an ADR

Require all three conditions:

1. **Hard to reverse** — changing the choice later has meaningful cost.
2. **Surprising without context** — code alone does not explain why the choice was made.
3. **A real trade-off** — genuine alternatives were considered.

Qualifying decisions include architectural shape, integration boundaries, lock-in-heavy technology choices, ownership decisions, invisible constraints, and deliberate deviations from the obvious approach.

Skip decisions that are easy to reverse, self-evident, or lack a meaningful alternative.

### What qualifies

- **Architectural shape.** "We're using a monorepo." "The write model is event-sourced, the read model is projected into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth provider, deployment target. Not every library — just the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only." The explicit no-s are as valuable as the yes-s.
- **Deliberate deviations from the obvious path.** "We're using manual SQL instead of an ORM because X." Anything where a reasonable reader would assume the opposite. These stop the next engineer from "fixing" something that was deliberate.
- **Constraints not visible in the code.** "We can't use AWS because of compliance requirements." "Response times must be under 200ms because of the partner API contract."
- **Rejected alternatives when the rejection is non-obvious.** If you considered GraphQL and picked REST for subtle reasons, record it — otherwise someone will suggest GraphQL again in six months.

## Review checklist

- [ ] Status reflects the decision's lifecycle.
- [ ] Context explains why a decision was needed.
- [ ] Alternatives are genuine rather than filler.
- [ ] The selected decision is unambiguous.
- [ ] Consequences are durable and non-obvious.
- [ ] Superseded records link to their replacement.
- [ ] Broken or misleading implementation references are absent.
- [ ] Current behavior is linked rather than duplicated.
- [ ] A changed decision has a new ADR instead of a rewritten history.
