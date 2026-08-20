# code-review

`code-review` is an orchestrated code review skill. It reviews a target, launches focused read-only review subagents, adjudicates their findings, and writes implementation-handoff plans for accepted issues.

The skill is intentionally split into small pieces. Improve one piece at a time; do not rewrite the whole skill unless the core contract changes.

## Core idea

```text
target
→ context/recon
→ selected reviewers
→ subagent candidate findings
→ orchestrator adjudication
→ accepted findings
→ implementation plans
→ final report
```

Subagents generate leads. The orchestrator decides what is real.

## File map

- [`SKILL.md`](SKILL.md)
- [`references/target-selection.md`](references/target-selection.md)
- [`references/reviewer-selection.md`](references/reviewer-selection.md)
- [`references/subagent-protocol.md`](references/subagent-protocol.md)
- [`references/orchestration.md`](references/orchestration.md)
- [`references/finding-bar.md`](references/finding-bar.md)
- [`references/plan-template.md`](references/plan-template.md)
- [`references/reviewers/`](references/reviewers/)
  - [`correctness-regression.yaml`](references/reviewers/correctness-regression.yaml)
  - [`security-boundary.yaml`](references/reviewers/security-boundary.yaml)
  - [`test-coverage.yaml`](references/reviewers/test-coverage.yaml)
  - [`standards-conventions.yaml`](references/reviewers/standards-conventions.yaml)
  - [`spec-compliance.yaml`](references/reviewers/spec-compliance.yaml)
  - [`silent-failure.yaml`](references/reviewers/silent-failure.yaml)
  - [`type-contracts.yaml`](references/reviewers/type-contracts.yaml)
  - [`architecture-simplicity.yaml`](references/reviewers/architecture-simplicity.yaml)
  - [`performance.yaml`](references/reviewers/performance.yaml)
  - [`docs-dx.yaml`](references/reviewers/docs-dx.yaml)
  - [`codebase-direction.yaml`](references/reviewers/codebase-direction.yaml)

## Sections

### 1. Contract / target semantics

Lives mostly in [`SKILL.md`](SKILL.md).

Defines what the skill is allowed to do:

- review-only by default
- no source edits
- writes only review artifacts/plans
- diff targets accept only introduced/exposed issues
- codebase target can accept pre-existing high-leverage issues
- current output is plans, not PR comments/issues

Improve this only when the identity of the skill changes.

### 2. Target selection

Lives in [`references/target-selection.md`](references/target-selection.md).

Defines supported targets:

- `local`
- `commit <ref>`
- `branch [base]`
- `pr [number|url]`
- `since <ref>`
- `codebase`

Also defines pinned checkout/worktree rules and ambiguity handling.

Improve this when target resolution is wrong, unsafe, ambiguous, or missing a target kind.

### 3. Reviewer matrix

Lives in [`references/reviewer-selection.md`](references/reviewer-selection.md) and [`references/reviewers/*.yaml`](references/reviewers/).

Defines which reviewer profiles exist and when to use them.

Each reviewer is a YAML `pi-subagents` profile.

The orchestrator chooses reviewers by default. User-requested focus areas constrain reviewer selection.

Improve this by changing one reviewer profile, one trigger rule, or the user-focus rules in [`SKILL.md`](SKILL.md). Do not expand the default reviewer set casually; more reviewers often means more noise.

### 4. Subagent protocol / orchestration

Lives in [`references/subagent-protocol.md`](references/subagent-protocol.md) and [`references/orchestration.md`](references/orchestration.md).

Defines how review subagents are launched, what they receive, and what output shape they return.

This section uses `pi-subagents` profiles as the required runtime mechanism. If the `subagent` tool is unavailable, the review exits and tells the user.

Improve this when changing `subagent(...)` launch shape, profile behavior, thinking overrides, output files, or unavailable-tool behavior.

### 5. Finding bar / adjudication

Lives in [`references/finding-bar.md`](references/finding-bar.md).

Defines what counts as an accepted finding, what gets rejected, severity levels, and adjudication steps.

This is the anti-garbage filter. Improve this when reviews are too noisy, too timid, or accepting the wrong class of issue.

### 6. Plan template

Lives in [`references/plan-template.md`](references/plan-template.md).

Defines the implementation-handoff plan written for each accepted issue.

Current shape:

- `Issue`
- `Evidence`
- `Manual verification`
- `Goal`
- `Scope`
- `Implementation phases`
- `Stop conditions`
- `Review notes`

Improve this when plans are hard to execute, too verbose, not issue-like enough, or missing verification detail.

### 7. Final report

Lives in [`SKILL.md`](SKILL.md) report section.

Defines the user-facing summary after review:

- target
- reviewers run
- accepted findings
- plans written
- rejected findings
- decisions needed
- residual risk
- next action

Improve this when the final response is too noisy or not actionable.

### 8. Real dry run

Not a skill file. Track in `docs/plans/code-review-skill.md`.

Use real review runs to find where instructions are vague, where subagents over-report, and where plans fail as handoffs.

## Maintainer rule

When improving the skill:

1. Identify which section failed.
2. Patch that file only.
3. Avoid duplicating instructions across [`SKILL.md`](SKILL.md) and references.
4. Keep [`SKILL.md`](SKILL.md) lean; move details into references.
5. Prefer stricter evidence requirements over more reviewer roles.

## Current note

Reviewer YAML profiles are the source of truth for launches.
