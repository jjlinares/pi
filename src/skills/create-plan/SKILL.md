---
name: create-plan
description: This skill should be used when the user asks to "create a plan", "write a plan file", "make an implementation plan", "draft phases", "plan this work", or wants a docs/ plan with goals, verifiable phases, open questions, and future decisions.
version: 0.1.0
---

# Create Plan

Create concise implementation plans that separate intent, execution, and unresolved decisions.

## Required Plan Shape

Use exactly these top-level sections unless the user explicitly asks otherwise:

1. `Goal`
2. `Phases`
3. `Open questions and future decisions`

Write plan files under `docs/plans/` unless the user gives another path.

## Workflow

Start by identifying what is already decided. Do not put decided items in future decisions. Treat user corrections as decisions and update the plan accordingly.

Before writing, resolve obvious contradictions:

- If a technology choice is settled, state it in `Goal` or the relevant phase, not in future decisions.
- If a phase depends on an undecided choice, name that choice in `Open questions and future decisions`.
- If implementation scope is local-dev only, do not imply production deployment in the goal.
- If production deployment is later, keep it as a future decision or later phase.

## Section Guidance

### Goal

State the intent of the current implementation, not every possible future feature.

Include:

- What this plan is trying to prove or build now.
- Key constraints already decided.
- Explicit non-goals when confusion is likely.
- Chosen architecture or technology when already decided.

Avoid:

- Background dumps.
- Future optional work.
- Re-litigating decisions the user already made.

### Phases

Build phases as tracer bullets: tiny end-to-end slices through all necessary layers. Ship the smallest thing that validates the architecture, get feedback, then expand.

A good phase should:

- Prove one user-visible or system-visible behavior.
- Touch every required layer for that behavior, but only as narrowly as needed.
- Be small enough for the user to verify manually.
- Reduce uncertainty before adding breadth, persistence, reporting, or polish.

Each phase should include:

- Short phase title.
- One-sentence purpose.
- `Tasks:` checkbox list.
- `Verification:` checkbox list.

Use checkboxes for top-level task and verification items:

- `- [ ]` for incomplete items.
- `- [x]` for completed items.

Keep nested detail bullets plain unless they are independently trackable tasks.

Use `Verification`, not vague exit criteria, when the user wants to personally verify progress.

Good phase pattern:

```markdown
### Phase 1 — local service spike

Prove the local service can receive input and return useful output.

Tasks:

- [ ] Start a local server.
- [ ] Accept the minimal message shape.
- [ ] Log useful diagnostics.

Verification:

- [ ] Run the server locally.
- [ ] Send a sample message.
- [ ] See the expected response in logs or UI.
```

Phase construction rules:

- Order phases by dependency and risk, not by ideal architecture.
- Keep Phase 1 as the narrowest useful tracer bullet.
- Do not hide risky work in broad phases like "integration".
- Prefer live behavior before persistence unless persistence is the central risk.
- Add cleanup/failure lifecycle before expanding happy-path features.
- Add summaries/reporting after source data capture unless summary is the central behavior.

### Open questions and future decisions

List only unresolved items or decisions intentionally deferred.

Include:

- Choices blocked by implementation evidence.
- Production concerns not needed for local validation.
- Performance, cost, scaling, auth, deployment, or ownership decisions deferred until after the spike.

Do not include:

- Decisions already made by the user.
- Restatements of the selected technology.
- Generic risks with no decision attached.
- Questions answered in the `Goal` or `Phases` sections.

Phrase future decisions as concrete decision points:

```markdown
- Transport format: base64 JSON is the spike default; switch to binary frames only if bandwidth or CPU becomes a problem.
```

Not:

```markdown
- Need to think about transport.
```

## Progress Tracking

When creating or updating plans:

- Use `- [ ]` for incomplete task and verification items.
- Use `- [x]` only when completion is known from explicit user confirmation, executed checks, commits, or inspected code.
- Treat a phase as complete only when all top-level task and verification checkboxes in that phase are checked.
- Do not mark verification complete just because implementation code exists.
- Preserve existing checkbox state unless new evidence changes it.
- When the user says they verified something, mark the matching verification items complete.

## Editing Existing Plans

When revising a plan:

- Preserve the three-section shape.
- Convert bare task and verification bullets to checkboxes when missing.
- Mark already-completed items with `[x]` only from explicit evidence.
- Leave future or unverified items as `[ ]`.
- Remove stale assumptions immediately.
- Move decided future items into `Goal` or `Phases`.
- Keep wording direct and current.
- Avoid expanding scope while cleaning up.
- Do not rewrite unrelated plan prose while updating progress.

## Style

Use concise, concrete bullets. Prefer implementation language over strategy language. Avoid praise, filler, and generic project-management boilerplate.
