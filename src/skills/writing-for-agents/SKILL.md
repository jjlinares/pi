---
name: writing-for-agents
description: Write concise agent-facing documentation with precise routing and non-obvious project knowledge. Use when creating or editing AGENTS.md, CLAUDE.md, skill instructions, or other docs for coding agents.
---

# Writing for Agents

Write agent-facing documentation that explains what the repository cannot and points to the code that can. Treat code and configuration as the source of truth. Treat documentation as a map of non-obvious knowledge, constraints, and intent.

Do not turn the conversation into documentation. Preserve only information that remains useful after the implementation changes.

## Route precisely

Make every pointer state:

1. what the target contains
2. when to read it

Front-load the subject agents will match against. Name concrete triggers rather than broad categories.

```markdown
<!-- Weak -->
See `docs/auth.md` for more information.

<!-- Strong -->
For authentication invariants and token-expiry rules, read `docs/auth.md`.
```

Apply the same rule to skill descriptions, lines in `AGENTS.md`, documentation indexes, and source-file references. Strengthen a weak pointer before copying its target into an always-loaded file.

## Keep the main path visible

Separate actions from reference material.

- Keep the common workflow and universal constraints inline.
- Move branch-specific knowledge behind a precise pointer.
- Co-locate each concept's definition, rules, and caveats.
- Avoid background prose between ordered steps.

Use progressive disclosure to protect the main path, not to create a large documentation tree. Keep simple material in one file.

## Let code explain implementation

Point to implementation instead of restating it. Include a file path and explain why it matters.

```markdown
<!-- Restates implementation and will drift -->
`SessionStore` hashes the token, inserts it into the sessions table, then schedules cleanup.

<!-- Routes to the source of truth -->
Session persistence and cleanup live in `src/auth/session-store.ts`. Read it when changing token storage or expiry behavior.
```

Document information that code does not clearly reveal:

- purpose and boundaries
- domain vocabulary and invariants
- surprising constraints or failure modes
- durable rationale when a future agent might otherwise undo the choice
- workflows that span several files or external systems
- the correct source files for deeper inspection

Omit:

- line-by-line implementation summaries
- file inventories discoverable with search
- copied signatures, schemas, commands, or configuration
- every implementation decision discussed during the work
- history that does not constrain current or future work
- plans presented as current truth

Record a decision only when it is durable, non-obvious, and its rationale affects future changes. Use an ADR when the project uses them. Otherwise keep the rationale beside the relevant constraint.

## Spend context deliberately

Distinguish two costs:

- **Context load:** material loaded for every task, such as skill descriptions and `AGENTS.md`.
- **Navigation load:** files an agent must discover and choose to read.

Keep always-loaded text short and high-value. Move specialized material behind pointers. Do not split merely to shorten a file when every reader needs both parts.

## Use shared language

Prefer familiar, concrete terms that already have useful meaning. Use one term consistently instead of repeating its definition or inventing synonyms.

State the desired behavior directly:

```markdown
Write one-line comments that explain intent.
```

Prefer this over leading with prohibited behavior. Use prohibitions only for hard guardrails, and pair them with the positive target.

## Prune

Keep one authoritative home for each fact.

Before adding a sentence, ask:

1. Does this change agent behavior?
2. Is it non-obvious from code, configuration, repository layout, or tool output?
3. Will it remain true when implementation details change?
4. Is this the right document and level of visibility?

Delete no-ops, stale claims, duplicated rules, conversational residue, and discoverable implementation details. Replace useful duplicated content with a pointer to its canonical source.

## Split only when the cut earns its cost

Split by a real branch: different tasks need different material. Keep universal guidance in the parent and route each branch with a precise pointer.

Keep files together when readers usually need both, splitting adds another navigation choice, or the proposed child only repeats implementation details.

## Workflow

1. Read the relevant code, configuration, and existing documentation.
2. Identify the audience and the tasks that should trigger this document.
3. Separate non-obvious knowledge from implementation details discoverable in the repository.
4. Write the common path and durable constraints.
5. Add precise pointers to canonical docs and source files.
6. Split only branch-specific material.
7. Prune every sentence that does not change behavior or improve navigation.
8. Search for duplicated, contradictory, and stale guidance.
