---
name: docs-modeling
description: This skill should be used when the user asks to "organize project docs", "create domain documentation", "define project vocabulary", "document domain invariants", "document current architecture", "create architecture docs", "split a context file", "create an ADR", or "decide where project documentation belongs".
---

# Documentation Modeling

Actively build and sharpen the project's documentation system. This is the active discipline — challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise.

## Shared documentation model

Keep one canonical home for each fact and link to it instead of duplicating it. Distinguish these roles:

- **Domain documentation** defines business language, relationships, and product invariants.
- **Architecture documentation** explains how the current technical system works.
- **ADRs** preserve why durable, non-obvious architectural decisions were made.
- **Focused guides** explain how to perform a specific task.

Keep current truth separate from decision history and future intent.

## Start from project conventions

Before changing documentation:

1. Read the root `README.md` and `AGENTS.md` when present.
2. Read `docs/README.md` or the project's equivalent router.
3. Locate existing domain files, ADRs, architecture docs, and focused guides.
4. Follow the established structure unless the user is explicitly reorganizing it.

Prefer the smallest useful hierarchy. Add directories and secondary routers only when they improve navigation at the project's actual scale.

## Load the focused guide

### Domain documentation

Use domain documentation when defining or changing what business terms mean, how concepts relate, or which product behaviors must remain true. Read [DOMAIN-FORMAT.md](./DOMAIN-FORMAT.md) before creating, splitting, reviewing, or substantially editing domain documentation.

### Architecture documentation

Use architecture documentation when explaining current runtimes, components, layers, dependency direction, data flow, ownership, or trust boundaries. Read [ARCHITECTURE-FORMAT.md](./ARCHITECTURE-FORMAT.md) before creating, splitting, reviewing, or substantially editing architecture documentation or a system overview.

### Architecture Decision Records

Use an ADR to explain why a durable architectural choice was made when the result would otherwise be surprising and genuine alternatives existed. Read [ADR-FORMAT.md](./ADR-FORMAT.md) before deciding whether an ADR is warranted or before creating, reviewing, superseding, or reorganizing ADRs.

## Work incrementally

1. Classify the information by documentation type.
2. Load the corresponding focused guide.
3. Confirm the canonical file and status of the information.
4. Update the canonical source and replace competing statements with links.
5. Update the project documentation router and affected references.
6. Preserve displaced information in the correct document type rather than silently deleting it.
7. Verify links and search for stale paths or contradictions.

When following a decision-led plan, record only confirmed decisions, their evidence, and any reusable principle.

## Verify changes

Before finishing:

- confirm the documentation router points to current files
- confirm moved-file references resolve
- search for duplicated or contradictory guidance
- confirm current truth, decisions, and plans remain distinguishable
- leave unrelated documentation unchanged unless the user expands scope
