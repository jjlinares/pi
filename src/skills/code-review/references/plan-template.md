# Plan Template

Write plans only after orchestrator adjudication. Plans live under `.agents/reviews/<run-id>/plans/`.

Each plan must be self-contained for a fresh executor that did not see the review.

## File naming

```text
001-<short-slug>.md
002-<short-slug>.md
```

Keep numbering by priority/dependency order.

## Template

```markdown
# <P# title>

Status: TODO
Source review: .agents/reviews/<run-id>
Target: <local|commit|branch|pr|since|codebase>
Base: <sha/ref or n/a>
Head: <sha/ref or n/a>
Finding: <finding id/title>

## Issue

<One or two paragraphs suitable for a GitHub issue body. Explain what is wrong, who/what is affected, and why it matters. Avoid implementation detail unless needed to understand impact.>

## Evidence

- Location: <path:line>
- Current behavior: <short explanation>
- Trigger: <caller/input/state/env/requirement>
- Impact: <what breaks or gets worse>
- Review finding: <accepted finding text>

Include small code excerpts only when needed. Excerpts must come from orchestrator reads, not copied from subagent claims.

## Manual verification

Before fixing, this can be verified by:

- [ ] <manual reproduction step, CLI command, UI flow, or code inspection>
- [ ] Expected bad result: <what demonstrates the issue exists>

After fixing, verify:

- [ ] <same manual path or focused command>
- [ ] Expected good result: <what should happen instead>

## Goal

Fix <specific issue> without changing <important non-goal>. State the user-visible or system-visible behavior that must hold after the fix.

## Scope

In scope:

- `<file>` — <why>
- `<test file>` — <why>

Out of scope:

- <related thing not to touch>
- <broader refactor not needed>

## Implementation phases

### Phase 1 — <smallest safe change>

Purpose: <one sentence>

Tasks:

- [ ] <surgical code change>
- [ ] <test or fixture change>

Verification:

- [ ] Run `<command>` and expect <specific result>.
- [ ] Manually inspect <path/behavior> and confirm <condition>.

### Phase 2 — <cleanup or regression hardening, if needed>

Purpose: <one sentence>

Tasks:

- [ ] <task>

Verification:

- [ ] Run `<command>` and expect <specific result>.

## Stop conditions

Stop and report back instead of improvising if:

- <cited code no longer matches>
- <required test harness does not exist>
- <fix requires changing public contract beyond stated scope>
- <spec/ADR contradicts the planned behavior>

## Code Review notes

- Preserve <existing convention/pattern>.
- Watch for <risk> in review.
- Do not <common overreach>.
```

## Plan quality bar

A plan is not done until it has:

- target/base/head or explicit `n/a`
- issue summary usable as a GitHub issue body
- exact evidence and trigger
- manual verification before and after the fix
- explicit non-goals
- ordered phases
- tests or a reason tests are impossible
- verification commands with expected results
- stop conditions
- scope boundaries

## Index

Write `.agents/reviews/<run-id>/plans/README.md` with:

```markdown
# Code Review plans

## Execution order

1. `001-...md` — <why first>
2. `002-...md` — <dependency if any>

## Status

| Plan | Priority | Status | Depends on | Goal |
|---|---|---|---|---|
| 001-...md | P1 | TODO | None | ... |

## Rejected / not planned

- <finding> — <why no plan>
```

Do not write repo-level `docs/plans/` unless the user asks to promote review plans out of the review run.
